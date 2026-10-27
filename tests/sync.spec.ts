import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { OpsSync } from '../src/sync.ts'
import { WebDav } from '../src/webdav.ts'
import { openSync, sealSync } from '../src/sync-crypto.ts'
import { LocalVault } from '../src/vault.ts'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { OpsService } from '../src/service.ts'
import { noSecrets } from '../src/secrets.ts'
import { managedStore } from '../src/managed.ts'

const passphrase = 'correct horse battery staple'
const webdav = { url: 'https://dav.jianguoyun.com/dav/WispOps/', username: 'test@example.org', password: 'test-app-password' }
let dirs: string[], remote: Map<string, string>, send: ReturnType<typeof vi.fn>
beforeEach(() => {
  dirs = []; remote = new Map()
  send = vi.fn(async (url: URL, init: RequestInit) => {
    const name = url.pathname.split('/').at(-1)!
    if (init.method === 'MKCOL') return new Response(null, { status: 405 })
    if (init.method === 'PUT') { if (remote.has(name)) return new Response(null, { status: 412 }); remote.set(name, String(init.body)); return new Response(null, { status: 201 }) }
    if (init.method === 'PROPFIND') return new Response(`<d:multistatus xmlns:d="DAV:">${[...remote.keys()].map(n => `<d:response><d:href>/dav/WispOps/${n}</d:href></d:response>`).join('')}</d:multistatus>`, { status: 207 })
    return new Response(remote.get(name) ?? '', { status: remote.has(name) ? 200 : 404 })
  })
})
afterEach(async () => { await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true }))) })
async function device(n: number, active = false) {
  const dir = await mkdtemp(join(tmpdir(), 'wisp-sync-')); dirs.push(dir)
  const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'inventory.yml') })
  const vault = new LocalVault(dir, async () => new Uint8Array(32).fill(n))
  const service = new OpsService(config, await Inventory.load(config), noSecrets)
  const sync = new OpsSync(service, vault, async () => active, send as typeof fetch)
  return { dir, vault, service, sync }
}
async function seed(d: Awaited<ReturnType<typeof device>>, privateKey = false) {
  const key = join(d.dir, 'identity')
  if (privateKey) await writeFile(key, '-----BEGIN OPENSSH PRIVATE KEY-----\nTEST-ONLY-KEY\n-----END OPENSSH PRIVATE KEY-----\n')
  const store = managedStore(d.dir)
  await store.change((await store.read()).revision, value => ({ ...value, hosts: [{ name: 'a', ...(privateKey ? { identityFile: key } : {}) }] }))
  await d.vault.save({ name: 'owner-only', username: 'alice', note: '', agent: false, password: 'password-not-in-cloud' }, (await d.vault.list()).revision)
}
it('authenticates encrypted snapshots and rejects wrong passwords, tampering and weak passphrases', async () => {
  const encrypted = await sealSync({ secret: 'test' }, passphrase)
  expect(encrypted).not.toContain('test')
  expect(await openSync(encrypted, passphrase)).toEqual({ secret: 'test' })
  await expect(openSync(encrypted, 'incorrect-passphrase')).rejects.toThrow('Cannot decrypt')
  const envelope = JSON.parse(encrypted); envelope.ciphertext = 'AAAA' + envelope.ciphertext.slice(4)
  await expect(openSync(JSON.stringify(envelope), passphrase)).rejects.toThrow('Cannot decrypt')
  await expect(sealSync({}, 'short')).rejects.toThrow('12')
})
it('syncs a disabled credential and explicit SSH key across different device keys without plaintext in RPC results', async () => {
  const a = await device(1), b = await device(2); await seed(a, true)
  const uploaded = await a.sync.handle('syncPush', { webdav, passphrase, includeKeys: true }) as any
  expect([...remote.values()].join('')).not.toContain('password-not-in-cloud')
  expect([...remote.values()].join('')).not.toContain('TEST-ONLY-KEY')
  expect(await a.sync.handle('syncList', { webdav })).toEqual({ snapshots: [uploaded.name] })
  const preview = await b.sync.handle('syncPreview', { webdav, passphrase, name: uploaded.name }) as any
  expect(preview.incoming).toMatchObject({ hosts: 1, credentials: 1, keys: 1 })
  expect(JSON.stringify(preview)).not.toContain('password-not-in-cloud')
  const result = await b.sync.handle('syncPull', { webdav, passphrase, token: preview.token }) as any
  expect(JSON.stringify(result)).not.toContain('password-not-in-cloud')
  expect((await b.vault.exportForSync()).entries[0]?.password).toBe('password-not-in-cloud')
  await expect(b.vault.password('owner-only')).rejects.toThrow('不允许自动化')
  const original = JSON.parse(await readFile(join(a.dir, 'vault.json'), 'utf8'))
  const imported = JSON.parse(await readFile(join(b.dir, 'vault.json'), 'utf8'))
  expect(imported.entries[0].secret).not.toBe(original.entries[0].secret)
  const host = (await managedStore(b.dir).read()).value.hosts[0]!
  expect(host.identityFile).toContain(join(b.dir, 'ssh-keys'))
  expect((await stat(host.identityFile!)).mode & 0o777).toBe(0o600)
  expect(await readdir(join(b.dir, 'sync-backups'))).toHaveLength(1)
  await expect(b.sync.handle('syncPull', { webdav, passphrase, token: preview.token })).rejects.toThrow('expired')
})
it('refuses stale local revisions and active schedules, preserving the local vault', async () => {
  const a = await device(1), b = await device(2), c = await device(3, true); await seed(a)
  const uploaded = await a.sync.handle('syncPush', { webdav, passphrase }) as any
  const preview = await b.sync.handle('syncPreview', { webdav, passphrase, name: uploaded.name }) as any
  await seed(b)
  await expect(b.sync.handle('syncPull', { webdav, passphrase, token: preview.token })).rejects.toThrow('Local data changed')
  const scheduled = await c.sync.handle('syncPreview', { webdav, passphrase, name: uploaded.name }) as any
  await expect(c.sync.handle('syncPull', { webdav, passphrase, token: scheduled.token })).rejects.toThrow('Stop WispOps schedules')
  expect((await c.vault.list()).entries).toHaveLength(0)
})
it('previews automation permission, sudo tasks and bindings for externally configured servers', async () => {
  const a = await device(1), b = await device(2); await seed(a)
  await a.vault.save({ name: 'automated', username: 'alice', note: '', agent: true, password: 'never-in-preview' }, (await a.vault.list()).revision)
  const store = managedStore(a.dir)
  await store.change((await store.read()).revision, value => ({ ...value, bindings: { 'yaml-host': { auth: 'password', loginSecret: 'automated' } }, tasks: [{ name: 'root-report', targets: 'a', playbook: 'inspect', sudo: true }] }))
  const uploaded = await a.sync.handle('syncPush', { webdav, passphrase }) as any
  const preview = await b.sync.handle('syncPreview', { webdav, passphrase, name: uploaded.name }) as any
  expect(preview.automatedCredentials).toEqual(['automated'])
  expect(preview.sudoTasks).toEqual([{ name: 'root-report', targets: 'a' }])
  expect(preview.bindings).toContainEqual({ host: 'yaml-host', auth: 'password', loginSecret: 'automated' })
  expect(JSON.stringify(preview)).not.toContain('never-in-preview')
})
it('refuses changed remote data after preview and never overwrites snapshots', async () => {
  const a = await device(1), b = await device(2); await seed(a)
  const uploaded = await a.sync.handle('syncPush', { webdav, passphrase }) as any
  const preview = await b.sync.handle('syncPreview', { webdav, passphrase, name: uploaded.name }) as any
  remote.set(uploaded.name, (remote.get(uploaded.name) ?? '') + ' ')
  await expect(b.sync.handle('syncPull', { webdav, passphrase, token: preview.token })).rejects.toThrow('Remote snapshot changed')
  const put = send.mock.calls.find((c: any[]) => c[1].method === 'PUT')
  expect(put?.[1].headers).toMatchObject({ 'if-none-match': '*' })
})
it('rejects insecure endpoints, traversal and redirected credentials', async () => {
  expect(() => new WebDav({ ...webdav, url: 'http://example.org' })).toThrow('HTTPS')
  const dav = new WebDav(webdav, send as typeof fetch)
  await expect(dav.download('../vault.key')).rejects.toThrow('Invalid snapshot name')
  await dav.list()
  expect(send.mock.calls.at(-1)?.[1].redirect).toBe('error')
})
