import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import { TypertGatewayService } from '@deepseek-ai/dsh-api-gateway'
import { RemoteAccessService } from '@deepseek-ai/dsh-api-remote-access'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { OpsService } from '../src/service.ts'
import { OpsManagement, OpsManager } from '../src/management.ts'
import type { Scheduler, ScheduledRecord } from '../src/management.ts'
import { LocalVault, routeSecrets } from '../src/vault.ts'
import { noSecrets } from '../src/secrets.ts'
import { managedStore, validateManaged } from '../src/managed.ts'
import { addTemplateDraft, builtinTemplates } from '../src/task-library.ts'
import { TaskRunner } from '../src/runner.ts'

let dir: string, vault: LocalVault, service: OpsService, manager: OpsManager, records: ScheduledRecord[], scheduler: Scheduler
const key = vi.fn(async (_dir: string, _create: boolean) => new Uint8Array(32).fill(7))
const credential = { name: 'login', username: 'tester', password: 'test-only-secret', note: 'test', agent: true }
const snap = async () => await manager.dispatch({ action: 'snapshot' }) as any
const revision = async () => (await snap()).revision as string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wisp-management-'))
  key.mockClear()
  const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'inventory.yml'), hosts: [{ name: 'a', ssh: '192.0.2.1' }, { name: 'b', policy: { sudo: 'deny' } }] })
  vault = new LocalVault(dir, key)
  service = new OpsService(config, await Inventory.load(config), routeSecrets(vault, noSecrets))
  await service.refresh()
  records = []
  scheduler = {
    catalog: vi.fn(async () => records),
    create: vi.fn(async (sessionId, request) => { const row = { id: `id-${records.length}`, title: String(request.title), scheduledAt: '2027-01-01T08:00:00Z', sessionId, status: 'active' }; records.push(row); return row }),
    delete: vi.fn(async request => { const n = records.length; records = records.filter(r => r.id !== request.id || r.sessionId !== request.sessionId); return { deleted: n !== records.length } }),
  }
  manager = new OpsManager(service, vault, () => scheduler)
})
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
async function saveCredential() { await manager.dispatch({ action: 'saveCredential', credential, revision: (await vault.list()).revision }) }
async function saveTask(extra = {}) { await manager.dispatch({ action: 'saveTask', revision: await revision(), task: { name: 'daily', targets: 'a', playbook: 'inspect', schedule: { daily: '08:00', timeZone: 'UTC' }, ...extra } }) }
async function saveLinked(associations: unknown, extra = {}) {
  const view = await snap()
  return await manager.dispatch({ action: 'saveCredential', credential, revision: view.vault.revision, managedRevision: view.revision, associations, ...extra })
}

describe('credentials associated with servers', () => {
  it('creates a shared credential and both kinds of links together, immediately and after reload', async () => {
    await saveLinked([{ host: 'a', login: true, sudo: true }, { host: 'b', login: false, sudo: true }])
    for (const inventory of [service.inventory, await Inventory.load(service.config)]) {
      expect(inventory.hosts.get('a')).toMatchObject({ auth: 'password', loginSecret: 'local:login', sudoSecret: 'local:login' })
      expect(inventory.hosts.get('b')).toMatchObject({ sudoSecret: 'local:login', policy: { sudo: 'deny' } })
      expect(inventory.hosts.get('b')?.auth).not.toBe('password')
    }
    const view = await snap()
    expect(view.hosts[0].credentials.login.status).toBe('ready')
    expect(JSON.stringify(view)).not.toContain(credential.password)
    expect(await vault.loginPassword(service.inventory.hosts.get('a')!)).toBe(credential.password)
    expect(await readdir(dir)).not.toContain('inventory.yml')
  })
  it('edits links without decrypting or replacing the stored secret, preserving other credentials and policy', async () => {
    await saveLinked([{ host: 'a', login: true, sudo: true }])
    await vault.save({ ...credential, name: 'other' }, (await vault.list()).revision)
    await manager.dispatch({ action: 'bindCredentials', host: 'b', binding: { auth: 'password', loginSecret: 'local:other' }, revision: await revision() })
    const before = JSON.parse(await readFile(join(dir, 'vault.json'), 'utf8')).entries.find((e: any) => e.name === 'login').secret
    key.mockClear()
    await saveLinked([{ host: 'a', login: false, sudo: true }, { host: 'b', login: false, sudo: true }], { edit: true, credential: { ...credential, password: '', note: 'edited', agent: false } })
    expect(key).not.toHaveBeenCalled()
    expect(service.inventory.hosts.get('a')).toMatchObject({ auth: 'key', sudoSecret: 'local:login' })
    expect(service.inventory.hosts.get('a')?.loginSecret).toBeUndefined()
    expect(service.inventory.hosts.get('b')).toMatchObject({ auth: 'password', loginSecret: 'local:other', sudoSecret: 'local:login', policy: { sudo: 'deny' } })
    expect(JSON.parse(await readFile(join(dir, 'vault.json'), 'utf8')).entries.find((e: any) => e.name === 'login').secret).toBe(before)
    await expect(vault.password('local:login')).rejects.toThrow('不允许自动化')
    await saveLinked([], { edit: true, credential: { ...credential, password: undefined } })
    expect(service.inventory.hosts.get('b')).toMatchObject({ auth: 'password', loginSecret: 'local:other' })
    expect(service.inventory.hosts.get('b')?.sudoSecret).toBeUndefined()
    await manager.dispatch({ action: 'deleteCredential', name: 'login', revision: (await vault.list()).revision })
  })
  it('tests one purpose of one server with a candidate credential without saving it', async () => {
    await saveCredential()
    const execute = vi.spyOn(service, 'execute').mockResolvedValue([{ host: 'a', status: 'ok', exitCode: 0, stdout: 'root\n', stderr: '', truncated: false, durationMs: 5 }])
    expect(await manager.dispatch({ action: 'testBinding', host: 'a', role: 'login', ref: 'local:login' })).toEqual({ status: 'ok', user: 'root', error: '' })
    expect(execute.mock.calls[0]![0][0]).toMatchObject({ name: 'a', auth: 'password', loginSecret: 'local:login' })
    expect(execute.mock.calls[0]![2]).toMatchObject({ sudo: false, authorization: 'read-only', tool: 'wispOps:testBinding' })
    await manager.dispatch({ action: 'testBinding', host: 'a', role: 'sudo', ref: 'local:login' })
    expect(execute.mock.calls[1]![0][0]).toMatchObject({ name: 'a', sudoSecret: 'local:login' })
    expect(execute.mock.calls[1]![0][0].auth).not.toBe('password')
    expect(execute.mock.calls[1]![0][0].loginSecret).toBeUndefined()
    expect(execute.mock.calls[1]![2]).toMatchObject({ sudo: true })
    execute.mockResolvedValueOnce([{ host: 'a', status: 'sudo-required', exitCode: 97, stdout: '', stderr: 'sudo: a password is required', truncated: false, durationMs: 5 }])
    expect(await manager.dispatch({ action: 'testBinding', host: 'a', role: 'sudo', ref: '' })).toEqual({ status: 'sudo-required', user: '', error: 'sudo: a password is required' })
    expect(execute.mock.calls[2]![0][0].sudoSecret).toBeUndefined()
    // Nothing was linked by testing, and bad targets are refused before connecting.
    expect(service.inventory.hosts.get('a')?.auth).not.toBe('password')
    expect(service.inventory.hosts.get('a')?.loginSecret).toBeUndefined()
    for (const request of [{ host: 'zz', role: 'login', ref: '' }, { host: 'a', role: 'root', ref: '' }, { host: 'a', role: 'login', ref: 'local:missing' }, { host: 'a', role: 'login', ref: 7 }]) {
      await expect(manager.dispatch({ action: 'testBinding', ...request })).rejects.toThrow()
    }
    expect(execute).toHaveBeenCalledTimes(3)
    execute.mockRestore()
  })
  it('retains dormant login references and recognizes unprefixed local references without rewriting YAML', async () => {
    const yaml = 'hosts:\n  - name: c\n    auth: key\n    loginSecret: login\n    sudoSecret: login\n'
    await writeFile(join(dir, 'inventory.yml'), yaml)
    await saveCredential()
    await saveLinked([{ host: 'c', login: true, sudo: true }], { edit: true, credential: { ...credential, password: undefined } })
    expect(service.inventory.hosts.get('c')).toMatchObject({ auth: 'key', loginSecret: 'local:login', sudoSecret: 'local:login' })
    await saveLinked([], { edit: true, credential: { ...credential, password: undefined } })
    const host = (await Inventory.load(service.config)).hosts.get('c')!
    expect(host.loginSecret).toBeUndefined()
    expect(host.sudoSecret).toBeUndefined()
    expect(await readFile(join(dir, 'inventory.yml'), 'utf8')).toBe(yaml)
  })

  it('uses the sudo credential account only for elevated connections, preserving the inventory and login credential', async () => {
    await saveCredential()
    await vault.save({ ...credential, name: 'admin', username: 'admin', password: 'admin-test-password' }, (await vault.list()).revision)
    await manager.dispatch({ action: 'addHost', host: { name: 'separate', ssh: 'tester@192.0.2.10', user: 'tester', port: 2222 }, revision: await revision() })
    await manager.dispatch({ action: 'bindCredentials', host: 'separate', binding: { auth: 'password', loginSecret: 'local:login', sudoSecret: 'local:admin' }, revision: await revision() })
    const run = vi.spyOn(service.runner, 'run').mockResolvedValue({ host: 'separate', status: 'ok', exitCode: 0, stdout: 'root\n', stderr: '', truncated: false, durationMs: 1 })
    await manager.dispatch({ action: 'testBinding', host: 'separate', role: 'login', ref: 'local:login' })
    expect(run.mock.calls[0]![0]).toMatchObject({ host: { name: 'separate', user: 'tester' }, loginPassword: credential.password, sudo: false })
    expect(run.mock.calls[0]![0].sudoPassword).toBeUndefined()
    await manager.dispatch({ action: 'testBinding', host: 'separate', role: 'sudo', ref: 'local:admin' })
    const elevated = run.mock.calls[1]![0]
    expect(elevated).toMatchObject({ host: { name: 'separate', user: 'admin', ssh: 'tester@192.0.2.10', port: 2222, auth: 'password', policy: { sudo: 'ask' } }, loginPassword: 'admin-test-password', sudoPassword: 'admin-test-password', sudo: true })
    expect(service.runner.argv(elevated.host, true, true)).toEqual(expect.arrayContaining(['-l', 'admin', '-p', '2222']))
    expect(service.inventory.hosts.get('separate')).toMatchObject({ user: 'tester', loginSecret: 'local:login' })
    const view = await snap()
    expect(view.hosts.find((h: any) => h.name === 'separate').credentials.sudo.username).toBe('admin')
    const audit = JSON.stringify(await service.store.readAudit({ limit: 10 }))
    for (const output of [JSON.stringify(view), audit]) {
      expect(output).not.toContain(credential.password)
      expect(output).not.toContain('admin-test-password')
    }
    run.mockRestore()
  })

  it('keeps SSH key authentication when the sudo username matches, and preserves blank-account compatibility', async () => {
    await saveCredential()
    await manager.dispatch({ action: 'addHost', host: { name: 'same', ssh: 'tester@192.0.2.10' }, revision: await revision() })
    const run = vi.spyOn(service.runner, 'run').mockResolvedValue({ host: 'same', status: 'ok', exitCode: 0, stdout: 'root\n', stderr: '', truncated: false, durationMs: 1 })
    await manager.dispatch({ action: 'testBinding', host: 'same', role: 'sudo', ref: 'local:login' })
    expect(run.mock.calls[0]![0].host.auth).not.toBe('password')
    expect(run.mock.calls[0]![0].loginPassword).toBeUndefined()
    expect(run.mock.calls[0]![0].sudoPassword).toBe(credential.password)
    await vault.save({ ...credential, username: '', password: undefined }, (await vault.list()).revision)
    await manager.dispatch({ action: 'testBinding', host: 'same', role: 'sudo', ref: 'local:login' })
    expect(run.mock.calls[1]![0].host.user).toBeUndefined()
    expect(run.mock.calls[1]![0].host.auth).not.toBe('password')
    run.mockRestore()
  })

  it('rejects unusable sudo account names and disabled credentials before starting SSH', async () => {
    await saveCredential()
    const run = vi.spyOn(service.runner, 'run')
    for (const extra of [{ username: '-oProxyCommand=bad' }, { agent: false }]) {
      await vault.save({ ...credential, ...extra, password: undefined }, (await vault.list()).revision)
      const result = await manager.dispatch({ action: 'testBinding', host: 'a', role: 'sudo', ref: 'local:login' }) as any
      expect(result.status).toBe('failed')
      expect(result.error).not.toContain(credential.password)
    }
    expect(run).not.toHaveBeenCalled()
    run.mockRestore()
  })
  it('rejects invalid and stale server selections before writing or accessing the key', async () => {
    for (const associations of [[], {}, [{ host: 'all', login: true, sudo: false }], [{ host: 'a', login: false, sudo: false }], [{ host: 'a', login: 'yes', sudo: false }], [{ host: 'a', login: true, sudo: false }, { host: 'a', login: false, sudo: true }]]) {
      await expect(saveLinked(associations)).rejects.toThrow()
      expect((await vault.list()).entries).toEqual([])
    }
    const stale = await revision()
    await manager.dispatch({ action: 'addHost', host: { name: 'c' }, revision: stale })
    await expect(saveLinked([{ host: 'a', login: true, sudo: false }], { managedRevision: stale })).rejects.toThrow('刷新')
    expect(key).not.toHaveBeenCalled()
    expect((await vault.list()).entries).toEqual([])
  })
  it('leaves bindings unchanged if the vault revision is stale or encryption fails', async () => {
    const stale = (await vault.list()).revision
    await saveCredential()
    const before = await revision()
    await expect(saveLinked([{ host: 'a', login: true, sudo: false }], { edit: true, revision: stale })).rejects.toThrow('刷新')
    key.mockRejectedValueOnce(new Error('Key unavailable'))
    await expect(saveLinked([{ host: 'a', login: true, sudo: false }], { edit: true })).rejects.toThrow('Key unavailable')
    expect(await revision()).toBe(before)
    expect(service.inventory.hosts.get('a')?.loginSecret).toBeUndefined()
    expect(await vault.password('local:login')).toBe(credential.password)
    expect((await readdir(dir)).filter(name => name.endsWith('.lock') || name.endsWith('.tmp'))).toEqual([])
  })
  it('rolls back a new or updated encrypted entry when committing associations fails', async () => {
    const fail = async () => { throw new Error('Association write failed') }
    const empty = (await vault.list()).revision
    await expect(vault.save(credential, empty, fail)).rejects.toThrow('Association write failed')
    expect((await vault.list()).revision).toBe(empty)
    await saveCredential()
    const before = await readFile(join(dir, 'vault.json'), 'utf8')
    await expect(vault.save({ ...credential, password: 'replacement-test-secret' }, (await vault.list()).revision, fail)).rejects.toThrow('Association write failed')
    expect(await readFile(join(dir, 'vault.json'), 'utf8')).toBe(before)
    expect(await vault.password('local:login')).toBe(credential.password)
    expect((await stat(join(dir, 'vault.json'))).mode & 0o777).toBe(0o600)
    expect((await readdir(dir)).filter(name => name.endsWith('.lock') || name.endsWith('.tmp'))).toEqual([])
  })
  it('restores both files when a combined save cannot rename the staged associations', async () => {
    await saveLinked([{ host: 'a', login: true, sudo: false }])
    const beforeVault = await readFile(join(dir, 'vault.json'), 'utf8')
    const beforeManaged = await readFile(join(dir, 'managed.json'), 'utf8')
    key.mockImplementationOnce(async () => {
      // Simulate the association file becoming unavailable between staging and commit.
      const staged = (await readdir(dir)).find(name => name.startsWith('managed.json.') && name.endsWith('.tmp'))
      expect(staged).toBeDefined()
      await rm(join(dir, staged!))
      return new Uint8Array(32).fill(7)
    })
    await expect(saveLinked([{ host: 'b', login: true, sudo: true }], { edit: true, credential: { ...credential, password: 'replacement-test-secret' } })).rejects.toThrow()
    expect(await readFile(join(dir, 'vault.json'), 'utf8')).toBe(beforeVault)
    expect(await readFile(join(dir, 'managed.json'), 'utf8')).toBe(beforeManaged)
    expect(service.inventory.hosts.get('a')?.loginSecret).toBe('local:login')
    expect(service.inventory.hosts.get('b')?.loginSecret).toBeUndefined()
  })
})

describe('independent vault', () => {
  it('encrypts at rest, keeps plaintext and ciphertext out of snapshots, and only decrypts for SSH', async () => {
    await saveCredential()
    const file = await readFile(join(dir, 'vault.json'), 'utf8')
    expect(file).not.toContain(credential.password)
    expect((await stat(join(dir, 'vault.json'))).mode & 0o777).toBe(0o600)
    expect(await vault.password('local:login')).toBe(credential.password)
    key.mockClear()
    const view = JSON.stringify(await snap())
    expect(view).not.toContain(credential.password)
    expect(view).not.toContain(JSON.parse(file).entries[0].secret)
    expect(key).not.toHaveBeenCalled()
  })
  it('preserves the password on metadata edits and enforces the automation flag', async () => {
    await saveCredential()
    await vault.save({ ...credential, password: undefined, note: 'changed', agent: false }, (await vault.list()).revision)
    await expect(vault.password('local:login')).rejects.toThrow('不允许自动化')
    await vault.save({ ...credential, password: '', agent: true }, (await vault.list()).revision)
    expect(await vault.password('local:login')).toBe(credential.password)
  })
  it('detects ciphertext tampering and never mints a key for existing encrypted entries', async () => {
    await saveCredential()
    const file = join(dir, 'vault.json'), raw = JSON.parse(await readFile(file, 'utf8'))
    raw.entries[0].name = 'swapped'
    await writeFile(file, JSON.stringify(raw))
    await expect(vault.password('local:swapped')).rejects.toThrow()
    expect(key).toHaveBeenLastCalledWith(dir, false)
  })
  it('rejects stale revisions, duplicates, newline passwords, and racing saves', async () => {
    const rev = (await vault.list()).revision
    await saveCredential()
    await expect(vault.save({ ...credential, name: 'other' }, rev)).rejects.toThrow('刷新')
    await expect(manager.dispatch({ action: 'saveCredential', credential, revision: (await vault.list()).revision })).rejects.toThrow('已存在')
    await expect(vault.save({ ...credential, password: 'x\ny' }, (await vault.list()).revision)).rejects.toThrow('格式')
    const now = (await vault.list()).revision
    const results = await Promise.allSettled([vault.save({ ...credential, name: 'one' }, now), vault.save({ ...credential, name: 'two' }, now)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect((await vault.list()).entries).toHaveLength(2)
  })
})

describe('server and task management', () => {
  it('generates editable drafts without connecting, writing definitions or enabling schedules', async () => {
    const probe = vi.spyOn(service, 'probe')
    const before = await revision()
    const result = await manager.dispatch({ action: 'draftTask', hosts: ['a', 'b', 'a'], playbook: 'inspect' }) as any
    expect(result.task.targets).toBe('a,b')
    expect(result.task.sudo).toBe(false)
    expect(result.warnings).toHaveLength(2)
    expect(probe).not.toHaveBeenCalled()
    expect(key).not.toHaveBeenCalled()
    expect(await revision()).toBe(before)
    expect(service.inventory.tasks.size).toBe(0)
    expect(scheduler.create).not.toHaveBeenCalled()
    await manager.dispatch({ action: 'saveTask', task: result.task, revision: before })
    expect(service.inventory.tasks.get(result.task.name)?.instruction).toContain('健康检查')
    expect(scheduler.create).not.toHaveBeenCalled()
  })
  it('validates draft selections and reports failed optional probes without discarding the draft', async () => {
    for (const hosts of [[], ['all'], ['absent'], ['a', 7]]) await expect(manager.dispatch({ action: 'draftTask', hosts, playbook: 'inspect' })).rejects.toThrow('服务器')
    await expect(manager.dispatch({ action: 'draftTask', hosts: ['a'], playbook: 'unknown' })).rejects.toThrow('检查内容')
    await expect(manager.dispatch({ action: 'draftTask', hosts: ['a'], playbook: 'inspect', refreshProbe: 'yes' })).rejects.toThrow('探测选项')
    const probe = vi.spyOn(service, 'probe').mockResolvedValueOnce([{ host: 'a', status: 'auth-failed' }])
    const result = await manager.dispatch({ action: 'draftTask', hosts: ['a'], playbook: 'security', refreshProbe: true }) as any
    expect(probe).toHaveBeenCalledWith([service.inventory.hosts.get('a')], { tool: 'wispOps:draftTask' })
    expect(result.warnings.join(' ')).toContain('本次探测未完成')
    expect(result.task).toMatchObject({ targets: 'a', playbook: 'security', hours: 24, sudo: false })
  })
  it('persists bindings across reloads, allows clearing them, and prevents deleting referenced secrets', async () => {
    await saveCredential()
    await manager.dispatch({ action: 'bindCredentials', host: 'a', binding: { auth: 'password', loginSecret: 'local:login', sudoSecret: 'local:login' }, revision: await revision() })
    let loaded = await Inventory.load(service.config)
    expect(loaded.hosts.get('a')).toMatchObject({ auth: 'password', loginSecret: 'local:login' })
    expect(await routeSecrets(vault, noSecrets).loginPassword(loaded.hosts.get('a')!)).toBe(credential.password)
    await expect(manager.dispatch({ action: 'deleteCredential', name: 'login', revision: (await vault.list()).revision })).rejects.toThrow('仍被 a')
    expect((await snap()).hosts[0].credentials.login.status).toBe('ready')
    await manager.dispatch({ action: 'bindCredentials', host: 'a', binding: { auth: 'key' }, revision: await revision() })
    loaded = await Inventory.load(service.config)
    expect(loaded.hosts.get('a')?.loginSecret).toBeUndefined()
    await manager.dispatch({ action: 'deleteCredential', name: 'login', revision: (await vault.list()).revision })
    expect((await vault.list()).entries).toEqual([])
  })
  it('force-deletes a linked credential and returns each purpose to its default, keeping other links', async () => {
    await saveLinked([{ host: 'a', login: true, sudo: true }, { host: 'b', login: false, sudo: true }])
    await manager.dispatch({ action: 'saveCredential', credential: { ...credential, name: 'other' }, revision: (await vault.list()).revision })
    await manager.dispatch({ action: 'bindCredentials', host: 'b', binding: { auth: 'password', loginSecret: 'local:other', sudoSecret: 'local:login' }, revision: await revision() })
    // A stale server revision changes neither file.
    await expect(manager.dispatch({ action: 'deleteCredential', name: 'login', force: true, revision: (await vault.list()).revision, managedRevision: 'stale' })).rejects.toThrow('刷新')
    expect((await vault.list()).entries.map(e => e.name)).toContain('login')
    const view = await snap()
    expect(await manager.dispatch({ action: 'deleteCredential', name: 'login', force: true, revision: view.vault.revision, managedRevision: view.revision })).toMatchObject({ message: expect.stringContaining('2 台') })
    expect((await vault.list()).entries.map(e => e.name)).toEqual(['other'])
    for (const inventory of [service.inventory, await Inventory.load(service.config)]) {
      expect(inventory.hosts.get('a')).toMatchObject({ auth: 'key', loginSecret: undefined, sudoSecret: undefined })
      expect(inventory.hosts.get('b')).toMatchObject({ auth: 'password', loginSecret: 'local:other', sudoSecret: undefined, policy: { sudo: 'deny' } })
    }
  })
  it('overrides host permissions from the panel, exposes the inherited value, and clears back to it', async () => {
    expect(service.inventory.hosts.get('b')).toMatchObject({ policy: { change: 'ask', sudo: 'deny', destructive: 'ask' }, inheritedPolicy: { sudo: 'deny' } })
    await manager.dispatch({ action: 'setPolicy', host: 'b', policy: { sudo: 'allow', change: 'allow' }, revision: await revision() })
    expect(service.inventory.hosts.get('b')).toMatchObject({ policy: { change: 'allow', sudo: 'allow', destructive: 'ask' }, inheritedPolicy: { change: 'ask', sudo: 'deny', destructive: 'ask' }, policyOverride: { sudo: 'allow', change: 'allow' } })
    expect((await Inventory.load(service.config)).hosts.get('b')?.policy.sudo).toBe('allow')
    expect((await snap()).hosts.find((h: any) => h.name === 'b')).toMatchObject({ policy: { sudo: 'allow' }, policyOverride: { sudo: 'allow' } })
    expect(JSON.parse(await readFile(join(dir, 'managed.json'), 'utf8')).policies).toEqual({ b: { sudo: 'allow', change: 'allow' } })
    // Unknown hosts, capabilities and values, and stale revisions are refused without writing.
    for (const request of [{ host: 'zz', policy: {} }, { host: 'b', policy: { root: 'allow' } }, { host: 'b', policy: { sudo: 'yes' } }, { host: 'b', policy: ['allow'] }]) {
      await expect(manager.dispatch({ action: 'setPolicy', revision: await revision(), ...request })).rejects.toThrow()
    }
    await expect(manager.dispatch({ action: 'setPolicy', host: 'b', policy: {}, revision: 'stale' })).rejects.toThrow()
    expect(service.inventory.hosts.get('b')?.policy.sudo).toBe('allow')
    await manager.dispatch({ action: 'setPolicy', host: 'b', policy: {}, revision: await revision() })
    expect(service.inventory.hosts.get('b')).toMatchObject({ policy: { sudo: 'deny' } })
    expect(service.inventory.hosts.get('b')?.policyOverride).toBeUndefined()
    expect(JSON.parse(await readFile(join(dir, 'managed.json'), 'utf8')).policies).toEqual({})
  })
  it('adds validated servers without broadening policy and refreshes live tools', async () => {
    await manager.dispatch({ action: 'addHost', host: { name: 'test', ssh: '192.0.2.10', policy: { sudo: 'allow' } }, revision: await revision() })
    expect(service.select('test')[0]?.policy.sudo).toBe('ask')
    await expect(manager.dispatch({ action: 'addHost', host: { name: 'evil', ssh: '-oProxyCommand=x' }, revision: await revision() })).rejects.toThrow()
    expect(service.inventory.hosts.has('evil')).toBe(false)
  })
  it('edits panel servers in place, keeps their name and unshown fields, and leaves YAML servers alone', async () => {
    await manager.dispatch({ action: 'addHost', host: { name: 'gx', ssh: 'xzg', user: 'guotosky.vip', port: 15031, groups: ['guozi'], proxyJump: 'bastion' }, revision: await revision() })
    expect((await snap()).hosts.map((h: any) => [h.name, h.editable])).toEqual([['a', false], ['b', false], ['gx', true]])
    service.runner.guard.record('gx', 'gx: Permission denied (password).')
    await manager.dispatch({ action: 'editHost', host: { name: 'gx', ssh: 'guotosky.vip', user: 'xzg', description: 'fixed', groups: [] }, revision: await revision() })
    for (const inventory of [service.inventory, await Inventory.load(service.config)]) {
      const host = inventory.hosts.get('gx')!
      expect(host).toMatchObject({ ssh: 'guotosky.vip', user: 'xzg', description: 'fixed', groups: [], proxyJump: 'bastion' })
      expect(host.port).toBeUndefined()
    }
    expect(service.runner.guard.check('gx')).toBeUndefined()
    await expect(manager.dispatch({ action: 'editHost', host: { name: 'a', ssh: '192.0.2.9' }, revision: await revision() })).rejects.toThrow('配置文件')
    await expect(manager.dispatch({ action: 'editHost', host: { name: 'gone', ssh: 'x' }, revision: await revision() })).rejects.toThrow('已被删除')
    await expect(manager.dispatch({ action: 'editHost', host: { name: 'gx', ssh: '-oProxyCommand=x' }, revision: await revision() })).rejects.toThrow()
    expect(service.inventory.hosts.get('a')?.ssh).toBe('192.0.2.1')
  })
  it('deletes panel servers with their bindings and policy, but not while a task names them', async () => {
    await saveCredential()
    await manager.dispatch({ action: 'addHost', host: { name: 'gx', ssh: '192.0.2.20' }, revision: await revision() })
    await manager.dispatch({ action: 'bindCredentials', host: 'gx', binding: { auth: 'password', loginSecret: 'local:login' }, revision: await revision() })
    await manager.dispatch({ action: 'setPolicy', host: 'gx', policy: { sudo: 'deny' }, revision: await revision() })
    await saveTask({ targets: 'a,gx' })
    await expect(manager.dispatch({ action: 'deleteHost', name: 'gx', revision: await revision() })).rejects.toThrow('daily')
    await manager.dispatch({ action: 'deleteTask', name: 'daily', revision: await revision() })
    await manager.dispatch({ action: 'deleteHost', name: 'gx', revision: await revision() })
    expect(service.inventory.hosts.has('gx')).toBe(false)
    const managed = JSON.parse(await readFile(join(dir, 'managed.json'), 'utf8'))
    expect([managed.hosts, managed.bindings, managed.policies]).toEqual([[], {}, {}])
    expect((await vault.list()).entries.map(e => e.name)).toEqual(['login'])
  })
  it('binds tasks to exact hosts and preserves the existing YAML', async () => {
    await writeFile(service.config.inventoryFile!, '# human comments\nhosts: []\n')
    await saveTask({ targets: 'all' })
    expect(service.inventory.tasks.get('daily')?.targets).toBe('a,b')
    expect((await snap()).hosts[0].tasks).toEqual(['daily'])
    expect(await readFile(service.config.inventoryFile!, 'utf8')).toContain('# human comments')
    expect((await Inventory.load(service.config)).tasks.get('daily')?.schedule?.daily).toBe('08:00')
  })
  it('rejects invalid host relationships, schedules and forbidden sudo without saving', async () => {
    await expect(saveTask({ targets: 'absent' })).rejects.toThrow('unknown host')
    await expect(saveTask({ schedule: { daily: '29:00' } })).rejects.toThrow()
    await expect(saveTask({ schedule: { daily: '08:00', timeZone: 'wrong/zone' } })).rejects.toThrow('时区')
    await expect(saveTask({ targets: 'b', sudo: true })).rejects.toThrow('禁止 sudo')
    await expect(saveTask({ playbook: 'custom' })).rejects.toThrow('instruction')
    expect((await managedStore(dir).read()).value.tasks).toEqual([])
  })
  it('enables idempotently in a session, refuses editing active tasks, then stops and deletes', async () => {
    await saveTask()
    const request = { action: 'scheduleTask', name: 'daily', sessionId: 'session-test', enabled: true }
    await manager.dispatch(request); await manager.dispatch(request)
    expect(scheduler.create).toHaveBeenCalledTimes(1)
    expect(scheduler.create).toHaveBeenCalledWith('session-test', expect.objectContaining({ title: 'WispOps: daily', daily: { time: '08:00:00', time_zone: 'UTC' } }))
    await expect(manager.dispatch({ action: 'deleteTask', name: 'daily', revision: await revision() })).rejects.toThrow('先停用')
    await manager.dispatch({ ...request, enabled: false })
    await manager.dispatch({ action: 'deleteTask', name: 'daily', revision: await revision() })
    expect(service.inventory.tasks.size).toBe(0)
    expect(records).toHaveLength(0)
  })
  it('keeps definitions on scheduler failure, and reports unavailable scheduling honestly', async () => {
    await saveTask()
    const unavailable = new OpsManager(service, vault, () => undefined)
    expect((await unavailable.dispatch({ action: 'snapshot' }) as any).schedulerAvailable).toBe(false)
    await expect(unavailable.dispatch({ action: 'scheduleTask', name: 'daily', sessionId: 's', enabled: true })).rejects.toThrow('没有 DSH')
    vi.mocked(scheduler.create).mockRejectedValueOnce(new Error('offline'))
    await expect(manager.dispatch({ action: 'scheduleTask', name: 'daily', sessionId: 's', enabled: true })).rejects.toThrow('offline')
    expect(service.inventory.tasks.has('daily')).toBe(true)
    expect(records).toHaveLength(0)
  })
})

describe('fleet overview', () => {
  it('returns bounded inspection history per host without command output or credentials', async () => {
    await saveLinked([{ host: 'a', login: true, sudo: true }])
    for (let i = 0; i < 5; i++) await service.store.appendHistory('a', { at: `2026-10-0${i + 1}T08:00:00Z`, status: 'ok', diskPct: { '/': 50 + i * 10 }, memAvailPct: 40 - i, findings: i >= 3 ? [{ severity: i === 4 ? 'crit' : 'warn', code: 'disk-high', message: `/ ${50 + i * 10}% used` }] : [] })
    await service.store.appendHistory('b', { at: '2026-10-05T08:00:00Z', status: 'unreachable', diskPct: {}, findings: [{ severity: 'crit', code: 'unreachable', message: 'ssh: connect timed out' }] })
    const view = await manager.dispatch({ action: 'overview', limit: 3 }) as any
    expect(view.limit).toBe(3)
    expect(view.hosts.map((h: any) => h.name)).toEqual(['a', 'b'])
    expect(view.hosts[0].rows.map((r: any) => r.state)).toEqual(['ok', 'warn', 'crit'])
    expect(view.hosts[0].rows.map((r: any) => r.diskPct['/'])).toEqual([70, 80, 90])
    expect(view.hosts[1]).toMatchObject({ latest: 'unreachable', rows: [{ state: 'unreachable', findings: [{ code: 'unreachable' }] }] })
    expect(view.summary).toEqual({ ok: 0, warn: 0, crit: 1, unreachable: 1, never: 0 })
    const text = JSON.stringify(view)
    expect(text).not.toContain(credential.password)
    expect(text).not.toContain('loginSecret')
    // Out-of-range or malformed limits are clamped, never rejected.
    expect((await manager.dispatch({ action: 'overview', limit: 'all' }) as any).hosts[0].rows).toHaveLength(5)
    expect((await manager.dispatch({ action: 'overview', limit: 99_999 }) as any).limit).toBe(200)
  })
})

describe('run once', () => {
  it('queues the task prompt into the chosen open session without touching schedules', async () => {
    await saveTask()
    const agent = { followup: vi.fn() }
    const runner = new OpsManager(service, vault, () => scheduler, undefined, id => id === 'live' ? agent : undefined)
    expect(await runner.dispatch({ action: 'runTaskNow', name: 'daily', sessionId: 'live' })).toMatchObject({ message: expect.stringContaining('daily') })
    expect(agent.followup).toHaveBeenCalledTimes(1)
    const message = agent.followup.mock.calls[0]![0] as any
    expect(JSON.stringify(message)).toContain('daily')
    expect(message.source).toEqual({ kind: 'user' })
    expect(scheduler.create).not.toHaveBeenCalled()
    await expect(runner.dispatch({ action: 'runTaskNow', name: 'daily', sessionId: 'closed' })).rejects.toThrow('未打开')
    await expect(runner.dispatch({ action: 'runTaskNow', name: 'missing', sessionId: 'live' })).rejects.toThrow('不存在')
    // Without a host agent registry nothing can be queued.
    await expect(manager.dispatch({ action: 'runTaskNow', name: 'daily', sessionId: 'live' })).rejects.toThrow('未打开')
    // A credential that is not allowed for automation blocks the run before anything is queued.
    await saveCredential()
    await manager.dispatch({ action: 'bindCredentials', host: 'a', binding: { auth: 'password', loginSecret: 'local:login' }, revision: await revision() })
    await manager.dispatch({ action: 'saveCredential', credential: { ...credential, password: undefined, agent: false }, edit: true, revision: (await vault.list()).revision })
    await expect(runner.dispatch({ action: 'runTaskNow', name: 'daily', sessionId: 'live' })).rejects.toThrow('不可用于自动化')
    expect(agent.followup).toHaveBeenCalledTimes(1)
  })
})
describe('panel inspection', () => {
  it('inspects one server read-only without sudo and reports the outcome', async () => {
    const inspect = vi.spyOn(service, 'inspect').mockResolvedValue({ at: '2026-10-27T08:00:00Z', counts: { ok: 0, info: 0, warn: 1, crit: 0, unreachable: 0 }, hosts: [{ host: 'a', status: 'ok', severity: 'warn', findings: [{ severity: 'warn', code: 'disk-high', message: '/ 91% used' }], durationMs: 12 }] })
    expect(await manager.dispatch({ action: 'inspectNow', host: 'a' })).toEqual({ at: '2026-10-27T08:00:00Z', status: 'ok', severity: 'warn', findings: 1, error: '', durationMs: 12 })
    expect(inspect.mock.calls[0]![0].map(h => h.name)).toEqual(['a'])
    expect(inspect.mock.calls[0]![1]).toMatchObject({ sudo: false, authorization: 'read-only', tool: 'wispOps:panelInspect' })
    await expect(manager.dispatch({ action: 'inspectNow', host: 'zz' })).rejects.toThrow('不存在')
    expect(inspect).toHaveBeenCalledTimes(1)
    inspect.mockRestore()
  })
})
describe('real DSH Gateway', () => {
  it('dispatches an owner request over the native protocol and refuses non-owner callers', async () => {
    const ctx = new Context()
    await ctx.plugin(TypertRegistry)
    await ctx.plugin(RemoteAccessService)
    await ctx.plugin(TypertGatewayService)
    await ctx.plugin(OpsManagement, { service, vault })
    const peer = { id: 'test-peer', principal: { kind: 'owner' }, interactions: 'answer', disposed: false, signal: new AbortController().signal } as never
    const result = await ctx.typertGateway.invoke({ namespace: 'wispOps', method: 'manage', args: { request: { action: 'snapshot' } }, peer }) as any
    expect(result.ok).toBe(true)
    expect(result.value.hosts.map((h: any) => h.name)).toEqual(['a', 'b'])
    await expect(ctx.typertGateway.invoke({ namespace: 'wispOps', method: 'manage', args: { request: { action: 'snapshot' } }, peer: { ...(peer as object), principal: { kind: 'untrusted' } } as never })).rejects.toThrow()
    expect(await (ctx.get('wispOps') as OpsManagement).manage({ action: 'snapshot' })).toMatchObject({ ok: false })
    for (const action of ['deleteHost', 'restoreHost']) {
      await expect(ctx.typertGateway.invoke({ namespace: 'wispOps', method: 'manage', args: { request: { action, name: 'a', revision: await revision() } }, peer: { ...(peer as object), principal: { kind: 'untrusted' } } as never })).rejects.toThrow()
      expect(await (ctx.get('wispOps') as OpsManagement).manage({ action, name: 'a', revision: await revision() })).toMatchObject({ ok: false })
    }
    expect(service.inventory.hosts.has('a')).toBe(true)
    expect((await snap()).excludedHosts).toEqual([])
    ctx.registry.delete(OpsManagement); ctx.registry.delete(TypertGatewayService); ctx.registry.delete(RemoteAccessService); ctx.registry.delete(TypertRegistry)
  })
})

describe('independent task library', () => {
  const template = { id: 'my-health', title: '日常巡检', description: '观察资源', category: '自定义', parameters: [], definition: { playbook: 'inspect', instruction: '只读检查资源和异常。', schedule: { daily: '08:30', timeZone: 'UTC' } } }
  const saveTemplate = async (value = template, edit = false) => manager.dispatch({ action: 'saveTemplate', template: value, edit, revision: (await snap()).templates.revision })
  const associate = async (id: string, values = {}, task = {}) => {
    const view = await snap()
    return manager.dispatch({ action: 'saveTask', templateId: id, templateRevision: view.templates.revision, templateValues: values, revision: view.revision, task: { name: 'linked', targets: 'a', ...task } })
  }
  it('queues AI drafts for review: chat requests go to an open session, drafts leave the queue when saved or discarded', async () => {
    const agent = { followup: vi.fn() }
    const chat = new OpsManager(service, vault, () => scheduler, undefined, id => id === 'live' ? agent : undefined)
    await chat.dispatch({ action: 'draftTemplateInChat', sessionId: 'live', prompt: 'design a template' })
    expect(agent.followup.mock.calls[0]![0]).toMatchObject({ source: { kind: 'user' } })
    expect(JSON.stringify(agent.followup.mock.calls[0]![0])).toContain('design a template')
    await expect(chat.dispatch({ action: 'draftTemplateInChat', sessionId: 'closed', prompt: 'x' })).rejects.toThrow('未打开')
    await expect(chat.dispatch({ action: 'draftTemplateInChat', sessionId: 'live', prompt: '' })).rejects.toThrow('prompt')
    // Drafts are validated like library templates: no sudo, no servers.
    await expect(addTemplateDraft(dir, { ...template, definition: { ...template.definition, sudo: true } })).rejects.toThrow('sudo')
    const first = await addTemplateDraft(dir, template)
    const second = await addTemplateDraft(dir, { ...template, id: 'other' })
    const replaced = await addTemplateDraft(dir, { ...template, title: '改进版' })
    expect(await manager.dispatch({ action: 'templateDrafts' })).toEqual({ ids: [second.id, replaced.id] })
    expect((await snap()).templates.drafts.map((d: any) => [d.template.id, d.template.title])).toEqual([['other', '日常巡检'], ['my-health', '改进版']])
    expect((await snap()).templates.entries.some((t: any) => t.id === 'my-health')).toBe(false)
    await manager.dispatch({ action: 'saveTemplate', template: replaced.template, edit: false, draftId: replaced.id, revision: (await snap()).templates.revision })
    await manager.dispatch({ action: 'discardTemplateDraft', id: second.id })
    const view = await snap()
    expect(view.templates.drafts).toEqual([])
    expect(view.templates.entries.find((t: any) => t.id === 'my-health')).toMatchObject({ title: '改进版', builtin: false })
    expect(first.id).not.toBe(replaced.id)
  })
  it('offers every built-in preset and saves custom templates with zero servers or schedules', async () => {
    const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'missing.yml'), hosts: [] })
    service = new OpsService(config, await Inventory.load(config), noSecrets)
    manager = new OpsManager(service, vault, () => scheduler)
    expect((await snap()).templates.entries.map((t: any) => t.id)).toEqual(builtinTemplates(config).map(t => t.id))
    await saveTemplate()
    const view = await snap()
    expect(view.hosts).toEqual([])
    expect(view.tasks).toEqual([])
    expect(view.templates.entries.at(-1)).toMatchObject({ id: 'my-health', builtin: false, uses: 0 })
    expect(scheduler.create).not.toHaveBeenCalled()
    expect((await stat(join(dir, 'task-templates.json'))).mode & 0o777).toBe(0o600)
    expect(await readdir(dir)).not.toContain('managed.json')
  })
  it('instantiates all presets with required values into valid, inactive tasks', async () => {
    const entries = (await snap()).templates.entries
    for (const t of entries) {
      const values = Object.fromEntries(t.parameters.map((p: any) => [p.key, p.defaultValue || 'test-target']))
      await associate(t.id, values, { name: t.id, targets: 'a,b', playbook: 'invalid' })
      const task = service.inventory.tasks.get(t.id)!
      expect(task.playbook).toBe(t.definition.playbook)
      expect(task.targets).toBe('a,b')
      expect(task.instruction).not.toContain('{{')
      expect(task.instruction).toContain('只读')
      expect(task.template).toBe(t.id)
      expect(task.sudo).toBeFalsy()
    }
    expect((await snap()).templates.entries.every((t: any) => t.uses === 1)).toBe(true)
    expect(records).toHaveLength(0)
  })
  it('requires actual targets and required parameters before saving an instance', async () => {
    await expect(associate('builtin.services')).rejects.toThrow('服务名称')
    await expect(associate('builtin.services', { services: '   ' })).rejects.toThrow('服务名称')
    await expect(associate('builtin.services', { services: 12 })).rejects.toThrow('格式')
    await expect(associate('builtin.services', { services: 'x'.repeat(4001) })).rejects.toThrow('格式')
    await expect(associate('builtin.health', {}, { targets: 'missing' })).rejects.toThrow()
    expect(service.inventory.tasks.size).toBe(0)
  })
  it('copies parameters, schedule, paths and explicit authorization without changing the template', async () => {
    await associate('builtin.services', { services: 'nginx\npostgresql' }, { sudo: true, schedule: { everyMinutes: 30, timeZone: 'Asia/Shanghai' }, instruction: '只详细报告异常。' })
    expect(service.inventory.tasks.get('linked')).toMatchObject({ template: 'builtin.services', sudo: true, schedule: { everyMinutes: 30, timeZone: 'Asia/Shanghai' } })
    expect(service.inventory.tasks.get('linked')?.instruction).toContain('nginx\npostgresql')
    expect(service.inventory.tasks.get('linked')?.instruction).toContain('补充要求：只详细报告异常。')
    await associate('builtin.disk', {}, { name: 'disk-linked', paths: ['/data'] })
    expect(service.inventory.tasks.get('disk-linked')?.paths).toEqual(['/data'])
    expect((await snap()).templates.entries.find((t: any) => t.id === 'builtin.disk').definition.paths).toEqual(['/'])
    expect(records).toHaveLength(0)
  })
  it('keeps linked rules and authorization unchanged after template edits or deletion', async () => {
    await saveTemplate()
    await associate(template.id, {}, { sudo: true })
    const before = JSON.stringify(service.inventory.tasks.get('linked'))
    await saveTemplate({ ...template, definition: { ...template.definition, instruction: '修改后的检查。' } }, true)
    expect(JSON.stringify(service.inventory.tasks.get('linked'))).toBe(before)
    await manager.dispatch({ action: 'deleteTemplate', name: template.id, revision: (await snap()).templates.revision })
    expect(JSON.stringify(service.inventory.tasks.get('linked'))).toBe(before)
    // Ordinary instance edits work even after its template has been deleted.
    await manager.dispatch({ action: 'saveTask', edit: true, revision: await revision(), task: { ...service.inventory.tasks.get('linked'), description: 'edited instance' } })
    expect(service.inventory.tasks.get('linked')).toMatchObject({ template: template.id, description: 'edited instance' })
  })
  it('rejects duplicate, stale, reserved and malformed templates without mutating the library', async () => {
    const empty = (await snap()).templates.revision
    await saveTemplate()
    await expect(saveTemplate()).rejects.toThrow('已存在')
    await expect(manager.dispatch({ action: 'saveTemplate', template, edit: true, revision: empty })).rejects.toThrow('刷新')
    await expect(manager.dispatch({ action: 'saveTask', templateId: 'builtin.health', templateRevision: empty, revision: await revision(), task: { name: 'stale', targets: 'a' } })).rejects.toThrow('刷新')
    for (const value of [
      { ...template, id: 'builtin.health' },
      { ...template, definition: { ...template.definition, targets: 'a' } },
      { ...template, definition: { ...template.definition, sudo: true } },
      { ...template, definition: { ...template.definition, instruction: '查 {{missing}}' } },
      { ...template, definition: { ...template.definition, playbook: 'new-files', paths: [] } },
      { ...template, definition: { ...template.definition, schedule: { daily: '08:30', everyMinutes: 20 } } },
    ]) await expect(saveTemplate(value as any, true)).rejects.toThrow()
    await expect(manager.dispatch({ action: 'deleteTemplate', name: 'builtin.health', revision: (await snap()).templates.revision })).rejects.toThrow('预设')
    expect((await snap()).templates.entries).toHaveLength(builtinTemplates(service.config).length + 1)
  })
  it('keeps scheduler activation and sudo policy enforcement on instantiated tasks', async () => {
    await expect(associate('builtin.health', {}, { targets: 'b', sudo: true })).rejects.toThrow('禁止 sudo')
    await associate('builtin.health')
    expect(records).toHaveLength(0)
    await manager.dispatch({ action: 'scheduleTask', name: 'linked', sessionId: 'session', enabled: true })
    expect(records).toHaveLength(1)
    expect(scheduler.create).toHaveBeenCalledWith('session', expect.objectContaining({ title: 'WispOps: linked', prompt: expect.stringContaining('ops_task') }))
    await expect(manager.dispatch({ action: 'saveTask', edit: true, revision: await revision(), task: service.inventory.tasks.get('linked') })).rejects.toThrow('停用')
  })
})

describe('external server removal', () => {
  it('persists exclusions across reloads without changing sources, then restores bindings and deny policies', async () => {
    const yaml = '# preserve comments\nhosts:\n  - name: file-host\n    ssh: file.example\n'
    await writeFile(service.config.inventoryFile!, yaml)
    const imported = [{ name: 'wisp', ssh: '192.0.2.30', groups: ['lab'] }, { name: 'file-host', ssh: 'overridden.example' }]
    const originalImported = structuredClone(imported)
    service = new OpsService(service.config, await Inventory.load(service.config, imported), routeSecrets(vault, noSecrets), imported)
    manager = new OpsManager(service, vault, () => scheduler)
    await saveCredential()
    await manager.dispatch({ action: 'bindCredentials', host: 'wisp', binding: { auth: 'password', loginSecret: 'local:login' }, revision: await revision() })
    await manager.dispatch({ action: 'setPolicy', host: 'wisp', policy: { sudo: 'deny', change: 'deny' }, revision: await revision() })
    const names = ['a', 'file-host', 'wisp']
    for (const name of names) await manager.dispatch({ action: 'deleteHost', name, revision: await revision() })
    for (const inventory of [service.inventory, await Inventory.load(service.config, imported)]) {
      expect([...inventory.hosts.keys()]).toEqual(['b'])
      expect(inventory.select('all').map(h => h.name)).toEqual(['b'])
      expect(() => inventory.select('wisp')).toThrow('unknown host')
    }
    const view = await snap()
    expect(view.excludedHosts).toEqual(names)
    expect(JSON.stringify(view)).not.toContain(credential.password)
    expect(await readFile(service.config.inventoryFile!, 'utf8')).toBe(yaml)
    expect(imported).toEqual(originalImported)
    expect(service.config.hosts.map(h => h.name)).toEqual(['a', 'b'])
    for (const name of names) await manager.dispatch({ action: 'restoreHost', name, revision: await revision() })
    expect((await snap()).excludedHosts).toEqual([])
    for (const inventory of [service.inventory, await Inventory.load(service.config, imported)]) {
      expect(inventory.hosts.get('file-host')?.ssh).toBe('file.example')
      expect(inventory.hosts.get('wisp')).toMatchObject({ auth: 'password', loginSecret: 'local:login', policy: { sudo: 'deny', change: 'deny' } })
    }
  })
  it('rejects direct task references, stale writes, duplicate removal and accidental same-name additions', async () => {
    await saveTask()
    await expect(manager.dispatch({ action: 'deleteHost', name: 'a', revision: await revision() })).rejects.toThrow('daily')
    await manager.dispatch({ action: 'deleteTask', name: 'daily', revision: await revision() })
    const stale = await revision()
    await manager.dispatch({ action: 'deleteHost', name: 'a', revision: stale })
    const before = await readFile(join(dir, 'managed.json'), 'utf8')
    await expect(manager.dispatch({ action: 'restoreHost', name: 'a', revision: stale })).rejects.toThrow('刷新')
    await expect(manager.dispatch({ action: 'deleteHost', name: 'b', revision: stale })).rejects.toThrow('刷新')
    await expect(manager.dispatch({ action: 'deleteHost', name: 'a', revision: await revision() })).rejects.toThrow('已被删除')
    await expect(manager.dispatch({ action: 'restoreHost', name: 'missing', revision: await revision() })).rejects.toThrow('不在移除列表')
    await expect(manager.dispatch({ action: 'addHost', host: { name: 'a', ssh: '192.0.2.99' }, revision: await revision() })).rejects.toThrow('先在')
    expect(await readFile(join(dir, 'managed.json'), 'utf8')).toBe(before)
    expect(service.inventory.hosts.has('b')).toBe(true)
  })
  it.each(['all', '@lab', 'tag:lab', 'file-*'])('keeps %s tasks valid and refuses to remove their last target', async targets => {
    const yaml = { hosts: [{ name: 'file-one', groups: ['lab'], tags: { lab: 'yes' } }, { name: 'file-two', groups: ['lab'], tags: { lab: 'yes' } }], tasks: [{ name: 'yaml-task', targets, playbook: 'inspect' }] }
    await writeFile(service.config.inventoryFile!, JSON.stringify(yaml))
    await manager.dispatch({ action: 'deleteHost', name: 'file-one', revision: await revision() })
    expect(service.inventory.select(targets).some(h => h.name === 'file-one')).toBe(false)
    if (targets === 'all') {
      await manager.dispatch({ action: 'deleteHost', name: 'a', revision: await revision() })
      await manager.dispatch({ action: 'deleteHost', name: 'b', revision: await revision() })
    }
    const before = await readFile(join(dir, 'managed.json'), 'utf8')
    await expect(manager.dispatch({ action: 'deleteHost', name: 'file-two', revision: await revision() })).rejects.toThrow('yaml-task')
    expect(await readFile(join(dir, 'managed.json'), 'utf8')).toBe(before)
    expect(service.inventory.hosts.has('file-two')).toBe(true)
    expect(await readFile(service.config.inventoryFile!, 'utf8')).toBe(JSON.stringify(yaml))
  })
  it('keeps negative task references valid and permits an empty inventory when there are no tasks', async () => {
    await writeFile(service.config.inventoryFile!, JSON.stringify({ tasks: [{ name: 'except-a', targets: 'all,!a', playbook: 'inspect' }] }))
    await expect(manager.dispatch({ action: 'deleteHost', name: 'a', revision: await revision() })).rejects.toThrow('except-a')
    await writeFile(service.config.inventoryFile!, 'hosts: []\n')
    for (const name of ['a', 'b']) await manager.dispatch({ action: 'deleteHost', name, revision: await revision() })
    expect((await snap()).hosts).toEqual([])
    expect((await snap()).excludedHosts).toEqual(['a', 'b'])
    await manager.dispatch({ action: 'restoreHost', name: 'a', revision: await revision() })
    expect(service.inventory.hosts.has('a')).toBe(true)
  })
  it('can clear an exclusion after the original source disappears', async () => {
    await writeFile(service.config.inventoryFile!, 'hosts:\n  - name: temporary\n')
    await manager.dispatch({ action: 'deleteHost', name: 'temporary', revision: await revision() })
    await writeFile(service.config.inventoryFile!, 'hosts: []\n')
    const result = await manager.dispatch({ action: 'restoreHost', name: 'temporary', revision: await revision() })
    expect(result).toMatchObject({ message: expect.stringContaining('原始配置') })
    expect((await snap()).excludedHosts).toEqual([])
    expect(service.inventory.hosts.has('temporary')).toBe(false)
  })
  it('accepts older management files but fails closed on malformed exclusion lists', () => {
    const legacy = { version: 1, hosts: [], tasks: [], bindings: {} }
    expect(validateManaged(legacy).excludedHosts).toEqual([])
    expect(validateManaged({ ...legacy, excludedHosts: ['a', 'a'] }).excludedHosts).toEqual(['a'])
    for (const excludedHosts of [null, 'a', {}, [null], [5], [''], ['a,b'], ['../a']]) expect(() => validateManaged({ ...legacy, excludedHosts })).toThrow('Invalid excluded hosts')
  })
})

describe('onboarding and audit', () => {
  const FIXTURES = join(import.meta.dirname, 'fixtures')
  async function fakeSshManager(extra: Record<string, unknown> = {}) {
    const sshConfig = join(dir, 'ssh_config')
    await writeFile(sshConfig, 'Host web-01 web-02\n  HostName 10.0.0.1\n  User deploy\nHost a\n  HostName 192.0.2.1\nHost prod-*\n  User x\n')
    process.env.FAKE_SSH_LOG = join(dir, 'ssh.log')
    process.env.FAKE_BIN = join(FIXTURES, 'bin')
    const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'inventory.yml'), sshConfigFile: sshConfig, hosts: [{ name: 'a', ssh: '192.0.2.1' }], ssh: { binary: join(FIXTURES, 'fake-ssh.sh'), connectTimeoutSec: 5, controlPersistSec: 0, extraArgs: [], concurrency: 4, loadProfile: false, extraPath: [], authFailureBlockMinutes: 15 }, ...extra })
    const local = new OpsService(config, await Inventory.load(config), routeSecrets(vault, noSecrets))
    await local.refresh()
    return { local, localManager: new OpsManager(local, vault, () => scheduler) }
  }

  it('deletes and reimports ssh_config entries while keeping excluded external names out of imports', async () => {
    const { local, localManager } = await fakeSshManager()
    const rev = async () => (await localManager.dispatch({ action: 'snapshot' }) as any).revision
    const source = await readFile(join(dir, 'ssh_config'), 'utf8')
    await localManager.dispatch({ action: 'importSshConfigHosts', aliases: ['web-01'], revision: await rev() })
    await localManager.dispatch({ action: 'deleteHost', name: 'web-01', revision: await rev() })
    expect(local.inventory.hosts.has('web-01')).toBe(false)
    expect((await Inventory.load(local.config)).hosts.has('web-01')).toBe(false)
    await localManager.dispatch({ action: 'importSshConfigHosts', aliases: ['web-01'], revision: await rev() })
    expect(local.inventory.hosts.has('web-01')).toBe(true)
    await localManager.dispatch({ action: 'deleteHost', name: 'a', revision: await rev() })
    expect((await localManager.dispatch({ action: 'sshConfigHosts' }) as any).hosts.find((h: any) => h.name === 'a')).toMatchObject({ existing: false, excluded: true })
    await expect(localManager.dispatch({ action: 'importSshConfigHosts', aliases: ['a'], revision: await rev() })).rejects.toThrow('先恢复')
    expect(local.inventory.hosts.has('a')).toBe(false)
    expect(await readFile(join(dir, 'ssh_config'), 'utf8')).toBe(source)
  })

  it('lists ssh_config aliases, imports the chosen ones through their alias and probes them', async () => {
    const { local, localManager } = await fakeSshManager()
    const listed = await localManager.dispatch({ action: 'sshConfigHosts' }) as any
    expect(listed.path).toBe(join(dir, 'ssh_config'))
    expect(listed.hosts).toEqual([
      { alias: 'web-01', name: 'web-01', target: 'deploy@10.0.0.1', source: join(dir, 'ssh_config'), existing: false, excluded: false },
      { alias: 'web-02', name: 'web-02', target: 'deploy@10.0.0.1', source: join(dir, 'ssh_config'), existing: false, excluded: false },
      { alias: 'a', name: 'a', target: '192.0.2.1', source: join(dir, 'ssh_config'), existing: true, excluded: false },
    ])
    await expect(localManager.dispatch({ action: 'importSshConfigHosts', aliases: ['nope'], revision: (await localManager.dispatch({ action: 'snapshot' }) as any).revision })).rejects.toThrow('nope')
    await expect(localManager.dispatch({ action: 'importSshConfigHosts', aliases: ['a'], revision: (await localManager.dispatch({ action: 'snapshot' }) as any).revision })).rejects.toThrow('已存在')
    const imported = await localManager.dispatch({ action: 'importSshConfigHosts', aliases: ['web-01', 'web-02', 'a'], revision: (await localManager.dispatch({ action: 'snapshot' }) as any).revision }) as any
    expect(imported.added).toEqual(['web-01', 'web-02'])
    expect(imported.skipped).toBe(1)
    expect(local.inventory.hosts.get('web-01')).toMatchObject({ groups: ['ssh-config'], description: 'ssh_config web-01 → deploy@10.0.0.1' })
    expect(local.inventory.hosts.get('web-01')?.ssh).toBeUndefined()
    expect(JSON.parse(await readFile(join(dir, 'managed.json'), 'utf8')).hosts.map((h: any) => h.name)).toEqual(['web-01', 'web-02'])
    const probed = await localManager.dispatch({ action: 'probeHosts', hosts: ['web-01', 'web-02'] }) as any
    expect(probed.results.map((r: any) => r.host)).toEqual(['web-01', 'web-02'])
    expect(probed.results[0].probe).toMatchObject({ scheduler: expect.any(String), privilege: expect.any(String) })
    expect((await localManager.dispatch({ action: 'snapshot' }) as any).hosts.find((h: any) => h.name === 'web-01').probe).toMatchObject({ at: expect.any(String) })
    await expect(localManager.dispatch({ action: 'probeHosts', hosts: ['missing'] })).rejects.toThrow('有效')
    await expect(localManager.dispatch({ action: 'probeHosts', hosts: [] })).rejects.toThrow('有效')
  })

  it('serves the audit log to the panel, bounded and filtered, and flags missed scheduled runs', async () => {
    const { local, localManager } = await fakeSshManager()
    await local.store.audit({ at: '2026-10-20T00:00:00Z', host: 'a', tool: 'ops_exec', risk: 'change', sudo: true, authorization: 'approval', command: 'x'.repeat(1000), reason: 'r'.repeat(500), status: 'ok', exitCode: 0, durationMs: 5 })
    await local.store.audit({ at: new Date().toISOString(), host: 'a', tool: 'ops_inspect', risk: 'read', sudo: false, authorization: 'read-only', command: 'inspect', status: 'ok', exitCode: 0, durationMs: 5 })
    const all = await localManager.dispatch({ action: 'auditLog' }) as any
    expect(all.rows).toHaveLength(2)
    expect(all.rows[0].command).toHaveLength(401)
    expect(all.rows[0].reason).toHaveLength(300)
    expect(all.retentionMonths).toBe(12)
    expect((await localManager.dispatch({ action: 'auditLog', host: 'a', sinceHours: 1, limit: 1 }) as any).rows.map((r: any) => r.tool)).toEqual(['ops_inspect'])
    await expect(localManager.dispatch({ action: 'auditLog', host: 'missing' })).rejects.toThrow('不存在')
    await localManager.dispatch({ action: 'saveTask', revision: (await localManager.dispatch({ action: 'snapshot' }) as any).revision, task: { name: 'morning', targets: 'a', playbook: 'inspect', schedule: { daily: '00:00', timeZone: 'UTC' } } })
    expect((await localManager.dispatch({ action: 'snapshot' }) as any).tasks[0]).toMatchObject({ missed: false })
    await localManager.dispatch({ action: 'scheduleTask', name: 'morning', sessionId: 'session', enabled: true })
    const view = (await localManager.dispatch({ action: 'snapshot' }) as any).tasks[0]
    // Enabled with no run recorded: missed once today's 00:00 UTC slot is more than 30 minutes old.
    expect(view.dueAt).toBe(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')
    expect(view.missed).toBe(Date.now() - Date.parse(view.dueAt) > 30 * 60_000)
    await local.store.appendBounded('tasks', 'morning', { at: new Date().toISOString(), hosts: ['a'], playbook: 'inspect', counts: {}, excerpt: '' }, 90)
    expect((await localManager.dispatch({ action: 'snapshot' }) as any).tasks[0]).toMatchObject({ missed: false, lastRun: expect.any(String) })
  })
})

describe('check scripts and the WispOps timer', () => {
  const script = { id: 'load', title: '负载检查', description: '负载超过核数时告警', content: 'uptime\nexit 0\n' }
  const saveScript = async (value: Record<string, unknown> = script, extra: Record<string, unknown> = {}) => manager.dispatch({ action: 'saveScript', script: value, revision: (await snap()).scripts.revision, ...extra })
  const saveScriptTask = async (extra: Record<string, unknown> = {}) => manager.dispatch({ action: 'saveTask', revision: await revision(), task: { name: 'load-check', targets: 'a', playbook: 'script', script: 'load', report: 'problems', schedule: { everyMinutes: 30 }, ...extra } })
  const result = (host: string, over = {}) => ({ host, status: 'ok' as const, exitCode: 0, stdout: 'fine\n', stderr: '', truncated: false, durationMs: 3, ...over })
  it('saves, tests, lists and deletes owner-reviewed scripts, refusing deny-listed lines and scripts in use', async () => {
    expect(await saveScript()).toMatchObject({ message: expect.stringContaining('已保存') })
    let view = await snap()
    expect(view.scripts.entries).toHaveLength(1)
    expect(view.scripts.entries[0]).toMatchObject({ id: 'load', title: '负载检查', uses: 0, timeoutSec: 120 })
    expect(view.scripts.entries[0].sha256).toHaveLength(64)
    await expect(saveScript()).rejects.toThrow('已存在')
    await expect(saveScript({ ...script, content: 'cat /etc/shadow\nrm -rf /tmp/x' }, { edit: true })).resolves.toBeTruthy()
    await expect(manager.dispatch({ action: 'saveScript', script: { ...script, id: 'bad' }, revision: 'stale' })).rejects.toThrow('刷新')
    const execute = vi.spyOn(service, 'execute').mockResolvedValue([result('a', { status: 'failed', exitCode: 1, stdout: 'load 9.5\nprocs 300\nWISPOPS-JSON: {"load1": 9.5}\n' })])
    expect(await manager.dispatch({ action: 'testScript', host: 'a', content: 'uptime' })).toMatchObject({ host: 'a', verdict: 'warn', summary: 'load 9.5', evidence: 'procs 300', metrics: { load1: 9.5 } })
    expect(execute.mock.calls[0]![2]).toMatchObject({ sudo: false, authorization: 'read-only', tool: 'wispOps:testScript' })
    await expect(manager.dispatch({ action: 'testScript', host: 'nope', content: 'uptime' })).rejects.toThrow('不存在')
    await saveScriptTask()
    view = await snap()
    expect(view.scripts.entries[0].uses).toBe(1)
    expect(view.tasks.find((t: any) => t.name === 'load-check')).toMatchObject({ playbook: 'script', script: 'load', report: 'problems', scheduled: [] })
    await expect(manager.dispatch({ action: 'deleteScript', name: 'load', revision: view.scripts.revision })).rejects.toThrow('load-check')
    await manager.dispatch({ action: 'deleteTask', name: 'load-check', revision: await revision() })
    await manager.dispatch({ action: 'deleteScript', name: 'load', revision: (await snap()).scripts.revision })
    expect((await snap()).scripts.entries).toHaveLength(0)
    await expect(saveScriptTask()).rejects.toThrow('脚本已不存在')
  })
  it('rejects deny-listed scripts and task definitions the timer cannot run', async () => {
    const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'inventory.yml'), denyPatterns: ['secret-file'], hosts: [{ name: 'a' }] })
    const strict = new OpsManager(new OpsService(config, await Inventory.load(config), routeSecrets(vault, noSecrets)), vault, () => scheduler)
    await expect(strict.dispatch({ action: 'saveScript', script: { ...script, content: 'df\ncat /etc/secret-file' }, revision: (await snap()).scripts.revision })).rejects.toThrow('deny')
    await expect(strict.dispatch({ action: 'testScript', host: 'a', content: 'cat /etc/secret-file' })).rejects.toThrow('deny')
    await saveScript()
    await expect(saveScriptTask({ schedule: { cron: '0 8 * * *' } })).rejects.toThrow('cron')
    await expect(saveScriptTask({ playbook: 'inspect' })).rejects.toThrow('script playbook')
    await expect(saveScriptTask({ playbook: 'custom', script: undefined, instruction: 'x', report: 'never' })).rejects.toThrow('read-only commands')
    await expect(saveScriptTask({ script: 'missing' })).rejects.toThrow('脚本已不存在')
    // Agent-reported tasks keep their validation and may use any playbook with commands.
    await saveScriptTask({ playbook: 'custom', script: undefined, instruction: 'x', commands: ['uptime'], report: 'never' })
  })
  it('enables timer tasks without the DSH scheduler, runs them on demand in the plugin, and blocks edits while enabled', async () => {
    await saveScript()
    await saveScriptTask()
    const agent = { followup: vi.fn() }
    const timed = new OpsManager(service, vault, () => undefined, undefined, id => id === 'live' ? agent : undefined, new TaskRunner(service, id => id === 'live' ? agent : undefined))
    await expect(timed.dispatch({ action: 'scheduleTask', name: 'load-check', sessionId: '', enabled: true })).rejects.toThrow('汇报会话')
    expect(await timed.dispatch({ action: 'scheduleTask', name: 'load-check', sessionId: 'live', enabled: true })).toMatchObject({ message: expect.stringContaining('发现异常时') })
    expect(scheduler.create).not.toHaveBeenCalled()
    let view = await timed.dispatch({ action: 'snapshot' }) as any
    const task = view.tasks.find((t: any) => t.name === 'load-check')
    expect(task.scheduled).toEqual([{ id: 'wisp-ops-timer', title: 'WispOps: load-check', sessionId: 'live', scheduledAt: expect.any(String), status: 'active' }])
    expect(view.timerAvailable).toBe(true)
    await expect(timed.dispatch({ action: 'saveTask', edit: true, revision: await revision(), task: service.inventory.tasks.get('load-check') })).rejects.toThrow('停用')
    await expect(timed.dispatch({ action: 'deleteTask', name: 'load-check', revision: await revision() })).rejects.toThrow('停用')
    // Run once stays inside the plugin: a green run reports back, nothing reaches the agent.
    const execute = vi.spyOn(service, 'execute').mockResolvedValue([result('a')])
    expect(await timed.dispatch({ action: 'runTaskNow', name: 'load-check', sessionId: 'live' })).toMatchObject({ message: expect.stringContaining('a: ok — fine') })
    expect(agent.followup).not.toHaveBeenCalled()
    expect(execute.mock.calls[0]![2]).toMatchObject({ authorization: 'task', tool: 'ops_task:load-check' })
    view = await timed.dispatch({ action: 'snapshot' }) as any
    expect(view.tasks.find((t: any) => t.name === 'load-check').lastOutcome).toMatchObject({ verdict: 'ok', summary: 'a: ok — fine' })
    // A run with problems escalates to the chosen session with the read-only prompt.
    execute.mockResolvedValue([result('a', { status: 'failed', exitCode: 2, stdout: 'load 40\n' })])
    expect(await timed.dispatch({ action: 'runTaskNow', name: 'load-check', sessionId: 'live' })).toMatchObject({ message: expect.stringContaining('已通知') })
    expect(agent.followup).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(agent.followup.mock.calls[0]![0])).toContain('mode=\\"last\\"')
    expect(await timed.dispatch({ action: 'scheduleTask', name: 'load-check', sessionId: 'live', enabled: false })).toMatchObject({ message: expect.stringContaining('停用') })
    expect((await timed.dispatch({ action: 'snapshot' }) as any).tasks.find((t: any) => t.name === 'load-check').scheduled).toEqual([])
    // Without a timer in the environment the panel is told so instead of silently enabling nothing.
    await expect(manager.dispatch({ action: 'scheduleTask', name: 'load-check', sessionId: 'live', enabled: true })).rejects.toThrow('定时器')
  })
})
