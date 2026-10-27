import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
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
