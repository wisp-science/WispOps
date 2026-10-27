/**
 * The operations core shared by tools and human commands: fleet command
 * execution, inspection, and disk diagnosis over the inventory, with every
 * remote action written to the audit log. Authorization is decided before
 * this layer (see gate.ts); this layer only executes and records.
 * @module dsh-wisp-ops/service
 */

import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Config, HostSpec } from './config.ts'
import { diskScript, parseDisk } from './collectors/disk.ts'
import type { DiskOptions, DiskReport } from './collectors/disk.ts'
import { evaluate, INSPECT_SCRIPT, metricsOf, parseInspection, sortFindings, worstSeverity } from './collectors/inspect.ts'
import type { Finding, HostInspection, Severity } from './collectors/inspect.ts'
import { filesScript, parseFiles } from './collectors/files.ts'
import type { FilesOptions, FilesReport, FilesSnapshot } from './collectors/files.ts'
import { parseSecurity, securityScript } from './collectors/security.ts'
import type { SecurityReport } from './collectors/security.ts'
import { parseProbe, PROBE_SCRIPT } from './collectors/probe.ts'
import type { HostProbe } from './collectors/probe.ts'
import { Inventory } from './inventory.ts'
import type { Host } from './inventory.ts'
import { GrantStore } from './policy.ts'
import type { RiskLevel } from './risk.ts'
import type { SecretProvider } from './secrets.ts'
import { SshRunner } from './ssh.ts'
import type { RunResult, RunStatus } from './ssh.ts'
import { OpsStore } from './store.ts'
import type { Authorization } from './store.ts'

export interface ExecOptions {
  readonly sudo: boolean
  /** Capture limit override for built-in collectors. */
  readonly maxOutputBytes?: number
  readonly timeoutMs: number
  readonly signal?: AbortSignal
  /** Recorded in the audit log. */
  readonly tool: string
  readonly session?: string
  readonly risk: RiskLevel
  readonly authorization: Authorization
  readonly reason?: string
}

export interface HostInspectionResult {
  readonly host: string
  readonly status: RunStatus
  readonly severity: Severity | 'ok' | 'unreachable'
  readonly findings: Finding[]
  readonly report?: HostInspection
  readonly error?: string
  readonly durationMs: number
}

export interface FleetInspection {
  readonly at: string
  readonly hosts: HostInspectionResult[]
  readonly counts: Record<'ok' | 'info' | 'warn' | 'crit' | 'unreachable', number>
}

export class OpsService {
  readonly runner: SshRunner
  readonly store: OpsStore
  readonly grants = new GrantStore()

  private fileStamp: string | undefined

  constructor(
    readonly config: Config,
    public inventory: Inventory,
    private readonly secrets: SecretProvider,
    readonly imported: readonly HostSpec[] = [],
  ) {
    this.runner = new SshRunner(config.ssh, config.limits.maxOutputBytes, config.dataDir)
    this.store = new OpsStore(config.dataDir)
  }

  /**
   * Reload the inventory when its file changed since the last load, so edits
   * apply without a restart. A broken edit keeps the previous inventory and
   * reports the error.
   */
  async refresh(): Promise<void> {
    const paths = [join(this.config.dataDir, 'managed.json'), ...this.config.inventoryFile === undefined ? [] : [this.config.inventoryFile]]
    const mtime = (await Promise.all(paths.map(path => stat(path).then(s => `${s.mtimeMs}:${s.ctimeMs}:${s.size}`, error => {
      if (error.code === 'ENOENT') return 'missing'
      throw error
    })))).join('|')
    if (this.fileStamp === undefined) {
      this.fileStamp = mtime
      return
    }
    if (mtime === this.fileStamp) return
    this.inventory = await Inventory.load(this.config, this.imported)
    this.fileStamp = mtime
  }

  /** Resolve a selector and enforce the fleet size limit. */
  select(selector: string): Host[] {
    if (this.inventory.hosts.size === 0) {
      throw new Error(`the inventory is empty; add hosts to ${this.config.inventoryFile ?? 'the dsh-wisp-ops `hosts` config'} (see the dsh-wisp-ops README)`)
    }
    const hosts = this.inventory.select(selector)
    if (hosts.length === 0) throw new Error(`selector "${selector}" matches no hosts`)
    if (hosts.length > this.config.limits.maxTargets) {
      throw new Error(`selector "${selector}" matches ${hosts.length} hosts; the limit is ${this.config.limits.maxTargets} (limits.maxTargets)`)
    }
    return hosts
  }

  clampTimeout(timeoutMs: number | undefined): number {
    return Math.min(Math.max(timeoutMs ?? this.config.limits.defaultTimeoutMs, 1000), this.config.limits.maxTimeoutMs)
  }

  /** Run one script on each host, recording every attempt. */
  async execute(hosts: readonly Host[], script: string, options: ExecOptions): Promise<RunResult[]> {
    const results = await this.runner.runMany(hosts, async host => {
      const sudoPassword = options.sudo ? await this.secrets.sudoPassword(host, options.signal) : undefined
      const loginPassword = host.auth === 'password' ? await this.secrets.loginPassword(host, options.signal) : undefined
      return {
        host,
        script,
        sudo: options.sudo,
        ...sudoPassword === undefined ? {} : { sudoPassword },
        ...loginPassword === undefined ? {} : { loginPassword },
        timeoutMs: options.timeoutMs,
        ...options.signal === undefined ? {} : { signal: options.signal },
        ...options.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes },
      }
    })
    const at = new Date().toISOString()
    await Promise.all(results.map(result => this.store.audit({
      at,
      ...options.session === undefined ? {} : { session: options.session },
      tool: options.tool,
      host: result.host,
      risk: options.risk,
      sudo: options.sudo,
      authorization: options.authorization,
      command: script.length > 4000 ? `${script.slice(0, 4000)}…` : script,
      ...options.reason === undefined ? {} : { reason: options.reason },
      status: result.status,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
    })))
    return results
  }

  /** Inspect a fleet, evaluate thresholds and trends, and record history. */
  async inspect(hosts: readonly Host[], options: { sudo: boolean; signal?: AbortSignal; session?: string; authorization: Authorization; tool: string }): Promise<FleetInspection> {
    const results = await this.execute(hosts, INSPECT_SCRIPT, {
      sudo: options.sudo,
      timeoutMs: this.clampTimeout(this.config.ssh.connectTimeoutSec * 1000 + 45_000),
      tool: options.tool,
      risk: 'read',
      authorization: options.authorization,
      ...options.signal === undefined ? {} : { signal: options.signal },
      ...options.session === undefined ? {} : { session: options.session },
    })
    const now = new Date()
    const hostResults = await Promise.all(results.map(async (result): Promise<HostInspectionResult> => {
      // The collector tolerates individual probe failures, so a non-zero exit with output is still usable.
      if (result.status !== 'ok' && result.status !== 'failed' || !result.stdout.includes('@@end')) {
        const error = (result.stderr.trim() || (result.status === 'ok' || result.status === 'failed'
          ? 'connected but the inspection produced no result: a restricted shell, a forced command, or a login script that exits early'
          : `inspection ${result.status}`)).slice(0, 500)
        await this.store.appendHistory(result.host, { at: now.toISOString(), diskPct: {}, status: result.status === 'ok' ? 'failed' : result.status, findings: [{ severity: 'crit', code: 'unreachable', message: error }] })
        return { host: result.host, status: result.status, severity: 'unreachable', findings: [{ severity: 'crit', code: result.status === 'ok' || result.status === 'failed' ? 'no-output' : result.status, message: error }], error, durationMs: result.durationMs }
      }
      const report = parseInspection(result.stdout)
      const previous = await this.store.lastHealthy(result.host)
      const findings = sortFindings(evaluate(report, this.config.thresholds, previous))
      await this.store.appendHistory(result.host, { ...metricsOf(report, now), status: 'ok', findings })
      return { host: result.host, status: 'ok', severity: worstSeverity(findings), findings, report, durationMs: result.durationMs }
    }))
    const counts = { ok: 0, info: 0, warn: 0, crit: 0, unreachable: 0 }
    for (const host of hostResults) counts[host.severity]++
    return { at: now.toISOString(), hosts: hostResults, counts }
  }

  /** Diagnose one filesystem and store a snapshot for the next comparison. */
  async disk(host: Host, options: DiskOptions & { sudo: boolean; signal?: AbortSignal; session?: string; authorization: Authorization; tool: string }): Promise<{ report?: DiskReport; result: RunResult }> {
    const normalized = options.path.length > 1 ? options.path.replace(/\/+$/, '') : options.path
    const previous = await this.store.diskSnapshot(host.name, normalized)
    const [result] = await this.execute([host], diskScript(options), {
      sudo: options.sudo,
      // Two walks plus the known-directory sizes, each bounded by walkTimeoutSec.
      timeoutMs: this.clampTimeout((options.walkTimeoutSec * 3 + 30) * 1000 + this.config.ssh.connectTimeoutSec * 1000),
      tool: options.tool,
      risk: 'read',
      authorization: options.authorization,
      ...options.signal === undefined ? {} : { signal: options.signal },
      ...options.session === undefined ? {} : { session: options.session },
    })
    if (result === undefined) throw new Error('no result')
    if (!result.stdout.includes('@@end')) return { result }
    const { report, snapshot } = parseDisk(result.stdout, options, previous)
    if (snapshot !== undefined) await this.store.saveDiskSnapshot(host.name, snapshot)
    return { report, result }
  }

  /** Probe capabilities and remember them; key hosts never prompt, so this is safe to run fleet-wide. */
  async probe(hosts: readonly Host[], options: { signal?: AbortSignal; session?: string; tool: string }): Promise<{ host: string; status: RunStatus; probe?: HostProbe; error?: string }[]> {
    const results = await this.execute(hosts, PROBE_SCRIPT, {
      sudo: false,
      timeoutMs: this.clampTimeout(this.config.ssh.connectTimeoutSec * 1000 + 20_000),
      tool: options.tool,
      risk: 'read',
      authorization: 'read-only',
      ...options.signal === undefined ? {} : { signal: options.signal },
      ...options.session === undefined ? {} : { session: options.session },
    })
    const now = new Date()
    const out = results.map(result => {
      const probe = result.status === 'ok' ? parseProbe(result.stdout, now) : undefined
      return probe === undefined
        ? { host: result.host, status: result.status, error: (result.stderr.trim() || 'connected but the probe produced no result (restricted shell or forced command?)').slice(0, 300) }
        : { host: result.host, status: result.status, probe }
    })
    const update: Record<string, HostProbe> = {}
    for (const entry of out) if (entry.probe !== undefined) update[entry.host] = entry.probe
    if (Object.keys(update).length > 0) await this.store.saveProbes(update)
    return out
  }

  /** Recent-file analysis on one host, compared with the previous scan of the same roots and window. */
  async files(host: Host, options: FilesOptions & CollectorOptions): Promise<{ report?: FilesReport; result: RunResult }> {
    const key = `${options.paths.join(',')}|${options.days}`
    const previous = (await this.store.readBounded<FilesSnapshot & { key: string }>('files', host.name)).filter(r => r.key === key).at(-1)
    const [result] = await this.execute([host], filesScript(options), {
      ...this.collector(options),
      timeoutMs: this.clampTimeout((options.walkTimeoutSec * (options.paths.length + 1) + 60) * 1000),
      maxOutputBytes: 8 * 1024 * 1024,
    })
    if (result === undefined) throw new Error('no result')
    if (!result.stdout.includes('@@end')) return { result }
    const { report, snapshot } = parseFiles(result.stdout, options, previous)
    await this.store.appendBounded('files', host.name, { ...snapshot, key }, 60)
    return { report, result }
  }

  /** Security triage on a set of hosts. */
  async security(hosts: readonly Host[], hoursBack: number, options: CollectorOptions): Promise<{ host: string; report?: SecurityReport; result: RunResult }[]> {
    const results = await this.execute(hosts, securityScript({ hours: hoursBack }), {
      ...this.collector(options),
      timeoutMs: this.clampTimeout(90_000 + this.config.ssh.connectTimeoutSec * 1000),
      maxOutputBytes: 2 * 1024 * 1024,
    })
    return results.map(result => result.stdout.includes('@@end')
      ? { host: result.host, report: parseSecurity(result.stdout, { hours: hoursBack }), result }
      : { host: result.host, result })
  }

  private collector(options: CollectorOptions): ExecOptions {
    return {
      sudo: options.sudo,
      timeoutMs: this.config.limits.defaultTimeoutMs,
      tool: options.tool,
      risk: 'read',
      authorization: options.authorization,
      ...options.signal === undefined ? {} : { signal: options.signal },
      ...options.session === undefined ? {} : { session: options.session },
    }
  }
}

/** Common options of the built-in read-only collectors. */
export interface CollectorOptions {
  readonly sudo: boolean
  readonly signal?: AbortSignal
  readonly session?: string
  readonly authorization: Authorization
  readonly tool: string
}
