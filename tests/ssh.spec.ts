import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import type { Host } from '../src/inventory.ts'
import { AuthGuard, classifyExit, decodeStderr, legacyDecoder, passwordSudoCommand, prelude, SshRunner } from '../src/ssh.ts'

const FIXTURES = resolve(import.meta.dirname, 'fixtures')
let dir: string
let runner: SshRunner
let host: Host

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wisp-ops-ssh-'))
  process.env.FAKE_BIN = join(FIXTURES, 'bin')
  process.env.FAKE_SUDO_STATE = join(dir, 'state')
  process.env.FAKE_SUDO_PASSWORD = 'pa$$ w0rd'
  delete process.env.FAKE_SSH_LOG
  const config = resolveConfig({ hosts: [{ name: 'box' }], ssh: { binary: join(FIXTURES, 'fake-ssh.sh'), connectTimeoutSec: 5, controlPersistSec: 0, extraArgs: [], concurrency: 2, loadProfile: false, extraPath: [], authFailureBlockMinutes: 1 } })
  runner = new SshRunner(config.ssh, 1024 * 1024, dir)
  host = new Inventory(config.hosts, {}, config.defaultPolicy).select('box')[0] as Host
})
afterAll(async () => { await rm(dir, { recursive: true, force: true }) })

describe('SshRunner', () => {
  it('pipes the script on stdin', async () => {
    const r = await runner.run({ host, script: 'echo "a b"; echo err >&2; exit 3', sudo: false, timeoutMs: 5000 })
    expect(r).toMatchObject({ status: 'failed', exitCode: 3, stdout: 'a b\n', stderr: 'err\n' })
  })

  it('runs sudo with a stored password that never reaches the script or output', async () => {
    await rm(process.env.FAKE_SUDO_STATE as string, { force: true })
    const r = await runner.run({ host, script: "echo root=$FAKE_ROOT; cat; echo 'pa$$ w0rd'", sudo: true, sudoPassword: 'pa$$ w0rd', timeoutMs: 5000 })
    expect(r.status).toBe('ok')
    expect(r.stdout).toContain('root=1')
    expect(r.stdout).not.toContain('w0rd')
  })

  it('reports a rejected sudo password', async () => {
    await rm(process.env.FAKE_SUDO_STATE as string, { force: true })
    const r = await runner.run({ host, script: 'echo should-not-run', sudo: true, sudoPassword: 'wrong', timeoutMs: 5000 })
    expect(r.status).toBe('sudo-required')
    expect(r.stdout).not.toContain('should-not-run')
  })

  it('reports sudo that needs a password when none is stored', async () => {
    await rm(process.env.FAKE_SUDO_STATE as string, { force: true })
    const r = await runner.run({ host, script: 'id', sudo: true, timeoutMs: 5000 })
    expect(r.status).toBe('sudo-required')
  })

  it('times out', async () => {
    const r = await runner.run({ host, script: 'sleep 5', sudo: false, timeoutMs: 300 })
    expect(r.status).toBe('timeout')
  })

  it('caps output', async () => {
    const small = new SshRunner({ ...resolveConfig({}).ssh, binary: join(FIXTURES, 'fake-ssh.sh'), controlPersistSec: 0, loadProfile: false, extraPath: [] }, 1024, dir)
    const r = await small.run({ host, script: 'yes | head -c 5000', sudo: false, timeoutMs: 5000 })
    expect(r.truncated).toBe(true)
    expect(r.stdout.length).toBe(1024)
  })

  it('keeps the destination after -- and rejects nothing it should not', () => {
    const argv = runner.argv({ ...host, ssh: 'alice@10.0.0.1', port: 2222, proxyJump: 'bastion', identityFile: '/k/id' }, false)
    expect(argv.slice(-3)).toEqual(['--', 'alice@10.0.0.1', 'sh -s'])
    expect(argv).toContain('BatchMode=yes')
    expect(argv).toEqual(expect.arrayContaining(['-J', 'bastion', '-i', '/k/id', 'IdentitiesOnly=yes', '-p', '2222']))
    const pw = runner.argv({ ...host, auth: 'password' }, false)
    expect(pw).toEqual(expect.arrayContaining(['BatchMode=no', 'StrictHostKeyChecking=accept-new', 'NumberOfPasswordPrompts=1']))
  })
})

describe('helpers', () => {
  it('classifies exits', () => {
    expect(classifyExit(255, 'alice@h: Permission denied (publickey).', false)).toBe('auth-failed')
    expect(classifyExit(255, 'ssh: connect to host h port 22: Connection refused', false)).toBe('unreachable')
    expect(classifyExit(1, 'sudo: a password is required', true)).toBe('sudo-required')
    expect(classifyExit(97, '', true, true)).toBe('sudo-required')
    expect(classifyExit(1, 'boom', false)).toBe('failed')
  })

  it('decodes Windows ssh errors without mangling remote UTF-8', () => {
    const gbk = legacyDecoder('win32', 'zh-CN')
    // Windows OpenSSH: "No such host is known." in GBK, written as octal escapes.
    const escaped = Buffer.from('ssh: Could not resolve hostname xzg: \\262\\273\\326\\252\\265\\300\\325\\342\\321\\371\\265\\304\\326\\367\\273\\372\\241\\243\r\n')
    expect(decodeStderr(escaped, gbk)).toBe('ssh: Could not resolve hostname xzg: 不知道这样的主机。\r\n')
    const mixed = Buffer.concat([Buffer.from('远端错误\n'), Buffer.from([0xb2, 0xbb, 0xd6, 0xaa, 0xb5, 0xc0])])
    expect(decodeStderr(mixed, gbk)).toBe('远端错误\n不知道')
    expect(decodeStderr(Buffer.from('名称解析暂时失败 \\345\\220\\215 \\377'), undefined)).toBe('名称解析暂时失败 名 \\377')
    expect(legacyDecoder('linux', 'zh-CN')).toBeUndefined()
    expect(['zh-TW', 'ja', 'ru', 'de'].map(locale => legacyDecoder('win32', locale)?.encoding)).toEqual(['big5', 'shift_jis', 'windows-1251', 'windows-1252'])
  })

  it('builds the sudo wrapper and prelude', () => {
    expect(passwordSudoCommand('postgres')).toContain('-u postgres')
    expect(prelude({ loadProfile: false, extraPath: ['/opt/slurm/bin'] })).toBe('PATH="$PATH:/opt/slurm/bin"\nexport PATH\n')
    expect(prelude({ loadProfile: true, extraPath: [] })).toContain('/etc/profile')
  })

  it('pauses and resumes logins', () => {
    let now = 0
    const guard = new AuthGuard(60_000, () => now)
    guard.record('h', 'x\nalice@h: Permission denied (publickey).')
    expect(guard.check('h')).toContain('Permission denied')
    now = 61_000
    expect(guard.check('h')).toBeUndefined()
    guard.record('h', '')
    expect(guard.clear('all')).toEqual(['h'])
  })
})
