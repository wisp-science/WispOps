/**
 * Remote execution through the system OpenSSH client.
 *
 * Using the user's own `ssh` keeps ~/.ssh/config, agents, jump hosts,
 * certificates, and known_hosts exactly as the operator configured them.
 * Scripts travel on stdin to `sh -s`, so no remote quoting is involved and
 * fish/csh login shells work. Key hosts use `BatchMode=yes` so any prompt
 * fails instead of hanging; password hosts answer exactly one prompt through
 * a one-shot askpass (OpenSSH ≥ 8.4). Repeated authentication failures block
 * a host for a while, because retried logins look like brute force and get
 * operators' addresses banned.
 * @module dsh-wisp-ops/ssh
 */

import { execFile, spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { SshSpec } from './config.ts'
import { parseSshG } from './diagnose.ts'
import type { SshTarget } from './diagnose.ts'
import { expandHome } from './inventory.ts'
import type { Host } from './inventory.ts'

const execFileAsync = promisify(execFile)

export type RunStatus = 'ok' | 'failed' | 'unreachable' | 'auth-failed' | 'blocked' | 'sudo-required' | 'timeout' | 'cancelled'

export interface RunResult {
  readonly host: string
  readonly status: RunStatus
  /** Remote exit status, or null when the command never reported one. */
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
  readonly truncated: boolean
  readonly durationMs: number
  /** Milliseconds from starting ssh to the first byte on stdout; with `timeLogin`, the login itself. */
  readonly firstOutputMs?: number
}

export interface RunRequest {
  readonly host: Host
  readonly script: string
  readonly sudo: boolean
  /**
   * Password for sudo, supplied by a secret provider and never by the model.
   * It travels as the first stdin line, is consumed by `read` in the remote
   * wrapper, and is redacted from captured output.
   */
  readonly sudoPassword?: string
  /** Login password for `auth: password` hosts, answered through askpass. */
  readonly loginPassword?: string
  readonly timeoutMs: number
  readonly signal?: AbortSignal
  /** Per-stream capture limit for built-in collectors whose output is bounded by construction. */
  readonly maxOutputBytes?: number
  /** Print `@@login` before the prelude, so `firstOutputMs` measures the login rather than profile loading. */
  readonly timeLogin?: boolean
}

/** Exit status the password wrapper uses when sudo rejects the password. */
export const SUDO_REJECTED_EXIT = 97

/** Single-quote a value for POSIX sh. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

const AUTH_FAILURE = /Permission denied \(|Host key verification failed|Too many authentication failures|REMOTE HOST IDENTIFICATION HAS CHANGED|Authentication failed/i
const UNREACHABLE = /ssh: |Connection (?:refused|timed out|closed|reset)|Could not resolve hostname|No route to host|Network is unreachable|kex_exchange_identification|banner exchange|Operation timed out/i
const SUDO_REQUIRED = /sudo: (?:a password is required|a terminal is required|no tty present|.*may not run sudo|.* is not in the sudoers file)/i

/** Classify a finished ssh process. */
export function classifyExit(code: number | null, stderr: string, sudo: boolean, withPassword = false): RunStatus {
  if (code === 0) return 'ok'
  if (code === 255 && AUTH_FAILURE.test(stderr)) return 'auth-failed'
  if (code === 255 && UNREACHABLE.test(stderr)) return 'unreachable'
  if (sudo && withPassword && code === SUDO_REJECTED_EXIT) return 'sudo-required'
  if (sudo && SUDO_REQUIRED.test(stderr)) return 'sudo-required'
  return 'failed'
}

/** Windows ANSI code pages by locale `language-script`, language, or script; anything else is Western (1252). */
const ANSI_CODE_PAGES: Record<string, string> = {
  'zh-Hans': 'gb18030', 'zh-Hant': 'big5', Jpan: 'shift_jis', Kore: 'euc-kr', Cyrl: 'windows-1251', Grek: 'windows-1253',
  Hebr: 'windows-1255', Arab: 'windows-1256', Thai: 'windows-874', tr: 'windows-1254', vi: 'windows-1258',
  cs: 'windows-1250', hr: 'windows-1250', hu: 'windows-1250', pl: 'windows-1250', ro: 'windows-1250', sk: 'windows-1250', sl: 'windows-1250',
  et: 'windows-1257', lt: 'windows-1257', lv: 'windows-1257',
}

/**
 * Windows OpenSSH reports system errors such as "No such host is known" in the
 * ANSI code page (GBK on Chinese Windows), which has no runtime API in Node;
 * guess it from the user locale. Undefined elsewhere: POSIX ssh speaks UTF-8.
 */
export function legacyDecoder(platform = process.platform, locale = Intl.DateTimeFormat().resolvedOptions().locale): TextDecoder | undefined {
  if (platform !== 'win32') return undefined
  try {
    const { language, script = '' } = new Intl.Locale(locale).maximize()
    return new TextDecoder(ANSI_CODE_PAGES[`${language}-${script}`] ?? ANSI_CODE_PAGES[language] ?? ANSI_CODE_PAGES[script] ?? 'windows-1252')
  } catch {
    // Node built without full ICU lacks the legacy decoders.
    return undefined
  }
}

function decodeBytes(bytes: Uint8Array, legacy: TextDecoder | undefined): string | undefined {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return legacy?.decode(bytes)
  }
}

/**
 * Decode ssh stderr line by line, so the remote's UTF-8 survives next to
 * local messages in the legacy code page. OpenSSH also writes non-ASCII bytes
 * of its own messages as `\NNN` octal escapes; those runs are decoded too.
 */
export function decodeStderr(bytes: Buffer, legacy: TextDecoder | undefined): string {
  const lines: string[] = []
  for (let start = 0; ;) {
    const end = bytes.indexOf(0x0a, start)
    const line = bytes.subarray(start, end === -1 ? bytes.length : end)
    lines.push(decodeBytes(line, legacy) ?? line.toString('utf8'))
    if (end === -1) break
    start = end + 1
  }
  return lines.join('\n').replace(/(?:\\[23][0-7]{2})+/g, run => decodeBytes(Buffer.from(run.slice(1).split('\\').map(digits => parseInt(digits, 8))), legacy) ?? run)
}

/**
 * Remote command that validates sudo with a password read from stdin, then
 * runs the rest of stdin through the cached credential. Both sudo calls keep
 * the same parent shell: replacing it with exec changes the ppid timestamp
 * scope on sessions without a tty and loses the successful authentication.
 * The password reaches only the `read` builtin and sudo's own stdin: if sudo needs no
 * password (NOPASSWD or a cached timestamp) the piped line is discarded by
 * sudo, so it can never be executed as a script line.
 */
export function passwordSudoCommand(sudoUser: string | undefined): string {
  const as = sudoUser === undefined ? '' : ` -u ${sudoUser}`
  return `sh -c 'IFS= read -r p; printf "%s\\n" "$p" | sudo -S -p "" -v${as} 2>/dev/null; s=$?; unset p; [ "$s" -eq 0 ] || exit ${SUDO_REJECTED_EXIT}; sudo -n${as} -- sh -s; s=$?; exit "$s"'`
}

/**
 * Script prelude: extend PATH with site directories and, optionally, adopt
 * the PATH a login shell would have. Profiles are sourced in a subshell with
 * output discarded, so a profile that prints, exits, or execs another shell
 * cannot break the session.
 */
export function prelude(spec: Pick<SshSpec, 'loadProfile' | 'extraPath'>): string {
  const lines: string[] = []
  if (spec.loadProfile) {
    lines.push(`__wisp_path=$( { [ -r /etc/profile ] && . /etc/profile; [ -r "$HOME/.profile" ] && . "$HOME/.profile"; } >/dev/null 2>&1 </dev/null; printf '%s' "$PATH")`)
    lines.push('[ -n "$__wisp_path" ] && PATH="$__wisp_path"; unset __wisp_path')
  }
  if (spec.extraPath.length > 0) lines.push(`PATH="$PATH:${spec.extraPath.join(':')}"`)
  if (lines.length > 0) lines.push('export PATH')
  return lines.length === 0 ? '' : `${lines.join('\n')}\n`
}

/** Per-host login backoff after authentication failures. */
export class AuthGuard {
  private readonly blocked = new Map<string, { until: number; reason: string }>()

  constructor(private readonly blockMs: number, private readonly now: () => number = Date.now) {}

  check(host: string): string | undefined {
    const entry = this.blocked.get(host)
    if (entry === undefined) return undefined
    if (entry.until <= this.now()) {
      this.blocked.delete(host)
      return undefined
    }
    return `logins to ${host} are paused until ${new Date(entry.until).toISOString()} after an authentication failure (${entry.reason}); fix the credentials or host key, then run /ops-unblock ${host}`
  }

  record(host: string, stderr: string): void {
    if (this.blockMs <= 0) return
    const reason = stderr.split('\n').find(line => AUTH_FAILURE.test(line))?.trim() ?? 'authentication failed'
    this.blocked.set(host, { until: this.now() + this.blockMs, reason: reason.slice(0, 200) })
  }

  clear(host: string | 'all'): string[] {
    const hosts = host === 'all' ? [...this.blocked.keys()] : this.blocked.has(host) ? [host] : []
    for (const name of hosts) this.blocked.delete(name)
    return hosts
  }

  list(): { host: string; until: string }[] {
    return [...this.blocked].filter(([, e]) => e.until > this.now()).map(([host, e]) => ({ host, until: new Date(e.until).toISOString() }))
  }
}

/** One-shot askpass files, removed only after ssh exits (earlier removal breaks the spawn on some platforms). */
async function createAskpass(password: string): Promise<{ env: NodeJS.ProcessEnv; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'wisp-ops-askpass-'))
  await chmod(dir, 0o700)
  const passfile = join(dir, 'pass')
  await writeFile(passfile, password, { mode: 0o600 })
  let script: string
  if (process.platform === 'win32') {
    script = join(dir, 'askpass.cmd')
    await writeFile(script, `@type "${passfile}"\r\n`, { mode: 0o700 })
  } else {
    script = join(dir, 'askpass.sh')
    await writeFile(script, `#!/bin/sh\ncat ${shellQuote(passfile)}\n`, { mode: 0o700 })
  }
  return {
    env: { SSH_ASKPASS: script, SSH_ASKPASS_REQUIRE: 'force', DISPLAY: process.env.DISPLAY ?? 'wisp-ops:0' },
    cleanup: () => rm(dir, { recursive: true, force: true }),
  }
}

export class SshRunner {
  private readonly controlDir: string | undefined
  private readonly legacy = legacyDecoder()
  readonly guard: AuthGuard

  constructor(private readonly spec: SshSpec, private readonly maxOutputBytes: number, dataDir: string) {
    if (spec.controlPersistSec > 0) {
      this.controlDir = join(dataDir, 'cm')
      mkdirSync(this.controlDir, { recursive: true, mode: 0o700 })
    }
    this.guard = new AuthGuard(spec.authFailureBlockMinutes * 60_000)
  }

  /** Resolve ssh_config aliases locally, without opening a connection or decrypting a login password. */
  async loginUser(host: Host, signal?: AbortSignal): Promise<string> {
    if (host.user) return host.user
    if (host.ssh?.includes('@')) return host.ssh.slice(0, host.ssh.lastIndexOf('@'))
    try {
      const { stdout } = await execFileAsync(this.spec.binary, ['-G', ...this.argv(host, false).slice(0, -1)], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024, signal })
      const user = /^user\s+(\S+)\s*$/m.exec(stdout)?.[1]
      if (user) return user
    } catch { /* Never expose ssh_config output or custom command diagnostics. */ }
    throw new Error('无法确定 SSH 登录用户，请在服务器配置中显式填写用户名。')
  }

  /** Where ssh would connect for this host after ssh_config, without connecting; falls back to the inventory fields. */
  async resolveTarget(host: Host, signal?: AbortSignal): Promise<SshTarget> {
    const fallback = { hostname: (host.ssh ?? host.name).replace(/^[^@]*@/, ''), ...host.port === undefined ? {} : { port: host.port } }
    try {
      const { stdout } = await execFileAsync(this.spec.binary, ['-G', ...this.argv(host, false).slice(0, -1)], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024, signal })
      return parseSshG(stdout, fallback)
    } catch {
      return fallback.port === undefined ? { ...fallback, port: 22 } : { hostname: fallback.hostname, port: fallback.port }
    }
  }

  /** The argv for one host; the destination always follows `--`, so it cannot be parsed as an option. */
  argv(host: Host, sudo: boolean, withPassword = false): string[] {
    const args = ['-T', '-o', `ConnectTimeout=${this.spec.connectTimeoutSec}`]
    if (host.auth === 'password') {
      // StrictHostKeyChecking=accept-new: with forced askpass, a host-key question would receive the password as its answer.
      args.push('-o', 'BatchMode=no', '-o', 'PreferredAuthentications=password,keyboard-interactive', '-o', 'PubkeyAuthentication=no', '-o', 'NumberOfPasswordPrompts=1', '-o', 'StrictHostKeyChecking=accept-new')
    } else {
      args.push('-o', 'BatchMode=yes')
    }
    if (this.controlDir !== undefined) {
      args.push('-o', 'ControlMaster=auto', '-o', `ControlPath=${join(this.controlDir, '%C')}`, '-o', `ControlPersist=${this.spec.controlPersistSec}s`)
    }
    if (host.identityFile !== undefined) args.push('-i', expandHome(host.identityFile), '-o', 'IdentitiesOnly=yes')
    if (host.proxyJump !== undefined) args.push('-J', host.proxyJump)
    if (host.port !== undefined) args.push('-p', String(host.port))
    if (host.user !== undefined) args.push('-l', host.user)
    args.push(...this.spec.extraArgs, '--', host.ssh ?? host.name)
    if (!sudo) args.push('sh -s')
    else if (withPassword) args.push(passwordSudoCommand(host.sudoUser))
    else args.push(`sudo -n${host.sudoUser === undefined ? '' : ` -u ${shellQuote(host.sudoUser)}`} -- sh -s`)
    return args
  }

  async run(request: RunRequest): Promise<RunResult> {
    const { host } = request
    const blocked = this.guard.check(host.name)
    if (blocked !== undefined) return { host: host.name, status: 'blocked', exitCode: null, stdout: '', stderr: blocked, truncated: false, durationMs: 0 }
    if (host.auth === 'password' && request.loginPassword === undefined) {
      return { host: host.name, status: 'auth-failed', exitCode: null, stdout: '', stderr: `${host.name} uses password login but no password is available; set loginSecret to a Password Store entry (secrets.provider: wispterm) or switch the host to key authentication`, truncated: false, durationMs: 0 }
    }
    if (request.signal?.aborted) return { host: host.name, status: 'cancelled', exitCode: null, stdout: '', stderr: '', truncated: false, durationMs: 0 }
    const askpass = host.auth === 'password' && request.loginPassword !== undefined ? await createAskpass(request.loginPassword) : undefined
    try {
      const result = await this.spawnOnce(request, askpass?.env)
      if (result.status === 'auth-failed') this.guard.record(host.name, result.stderr)
      return result
    } finally {
      await askpass?.cleanup()
    }
  }

  private spawnOnce(request: RunRequest, env: NodeJS.ProcessEnv | undefined): Promise<RunResult> {
    const started = Date.now()
    const { host } = request
    const secrets = [request.sudoPassword, request.loginPassword].filter((s): s is string => s !== undefined && s.length > 0)
    const redact = (text: string) => secrets.reduce((acc, secret) => acc.split(secret).join('[REDACTED]'), text)
    return new Promise(resolve => {
      const withPassword = request.sudo && request.sudoPassword !== undefined
      const child = spawn(this.spec.binary, this.argv(host, request.sudo, withPassword), {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...env === undefined ? {} : { env: { ...process.env, ...env } },
      })
      const out = new Capture(request.maxOutputBytes ?? this.maxOutputBytes)
      const err = new Capture(request.maxOutputBytes ?? this.maxOutputBytes)
      let firstOutputMs: number | undefined
      let ended: RunStatus | undefined
      let killTimer: NodeJS.Timeout | undefined
      const stop = (status: RunStatus) => {
        if (ended !== undefined) return
        ended = status
        child.kill('SIGTERM')
        killTimer = setTimeout(() => child.kill('SIGKILL'), 2000)
      }
      const timer = setTimeout(() => stop('timeout'), request.timeoutMs)
      const onAbort = () => stop('cancelled')
      request.signal?.addEventListener('abort', onAbort, { once: true })
      child.stdout.on('data', (chunk: Buffer) => {
        firstOutputMs ??= Date.now() - started
        out.push(chunk)
      })
      child.stderr.on('data', (chunk: Buffer) => err.push(chunk))
      child.stdin.on('error', () => {})
      let spawnError: Error | undefined
      child.on('error', error => { spawnError = error })
      let finished = false
      const finish = (code: number | null) => {
        if (finished) return
        finished = true
        clearTimeout(timer)
        if (killTimer !== undefined) clearTimeout(killTimer)
        request.signal?.removeEventListener('abort', onAbort)
        const stderr = redact(spawnError === undefined ? decodeStderr(err.bytes(), this.legacy) : `failed to start ${this.spec.binary}: ${spawnError.message}`)
        resolve({
          host: host.name,
          status: ended ?? (spawnError === undefined ? classifyExit(code, stderr, request.sudo, withPassword) : 'unreachable'),
          exitCode: ended === undefined ? code : null,
          stdout: redact(out.text()),
          stderr,
          truncated: out.truncated || err.truncated,
          durationMs: Date.now() - started,
          ...firstOutputMs === undefined ? {} : { firstOutputMs },
        })
      }
      child.on('close', code => finish(code))
      child.on('exit', code => {
        // A stopped ssh may leave a descendant holding the pipes open; do not wait on it.
        if (ended === undefined) return
        setTimeout(() => {
          child.stdout.destroy()
          child.stderr.destroy()
          finish(code)
        }, 500).unref()
      })
      const script = (request.timeLogin ? 'echo @@login\n' : '') + prelude(this.spec) + (request.script.endsWith('\n') ? request.script : `${request.script}\n`)
      child.stdin.end(withPassword ? `${request.sudoPassword}\n${script}` : script)
    })
  }

  /** Run one request per host with bounded parallelism, preserving host order. */
  async runMany(hosts: readonly Host[], build: (host: Host) => RunRequest | Promise<RunRequest>): Promise<RunResult[]> {
    const results: RunResult[] = new Array(hosts.length)
    let next = 0
    const worker = async () => {
      while (next < hosts.length) {
        const index = next++
        const host = hosts[index] as Host
        try {
          results[index] = await this.run(await build(host))
        } catch (error) {
          // A secret lookup failure is this host's failure, not the fleet's.
          results[index] = { host: host.name, status: 'failed', exitCode: null, stdout: '', stderr: error instanceof Error ? error.message : String(error), truncated: false, durationMs: 0 }
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(this.spec.concurrency, hosts.length) }, worker))
    return results
  }
}

/** Bounded output capture that keeps the head of the stream. */
class Capture {
  private readonly chunks: Buffer[] = []
  private size = 0
  truncated = false

  constructor(private readonly limit: number) {}

  push(chunk: Buffer): void {
    const room = this.limit - this.size
    if (room <= 0) {
      this.truncated = true
      return
    }
    const kept = chunk.length > room ? chunk.subarray(0, room) : chunk
    if (kept.length < chunk.length) this.truncated = true
    this.chunks.push(kept)
    this.size += kept.length
  }

  bytes(): Buffer {
    return Buffer.concat(this.chunks)
  }

  text(): string {
    return this.bytes().toString('utf8')
  }
}
