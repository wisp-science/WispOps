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
import { managedStore } from '../src/managed.ts'

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
  it('adds validated servers without broadening policy and refreshes live tools', async () => {
    await manager.dispatch({ action: 'addHost', host: { name: 'test', ssh: '192.0.2.10', policy: { sudo: 'allow' } }, revision: await revision() })
    expect(service.select('test')[0]?.policy.sudo).toBe('ask')
    await expect(manager.dispatch({ action: 'addHost', host: { name: 'evil', ssh: '-oProxyCommand=x' }, revision: await revision() })).rejects.toThrow()
    expect(service.inventory.hosts.has('evil')).toBe(false)
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
  it('offers ten presets and saves custom templates with zero servers or schedules', async () => {
    const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'missing.yml'), hosts: [] })
    service = new OpsService(config, await Inventory.load(config), noSecrets)
    manager = new OpsManager(service, vault, () => scheduler)
    expect((await snap()).templates.entries).toHaveLength(10)
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
    expect((await snap()).templates.entries).toHaveLength(11)
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
