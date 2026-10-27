import { createHash, randomUUID } from 'node:crypto'
import { chmod, lstat, mkdir, open, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { managedStore, validateManaged } from './managed.ts'
import type { ManagedState } from './managed.ts'
import { templateStore, validateTemplate } from './task-library.ts'
import type { TaskTemplate } from './task-template-content.ts'
import type { LocalVault, PortableCredential } from './vault.ts'
import { Inventory, expandHome } from './inventory.ts'
import type { OpsService } from './service.ts'
import { openSync, sealSync } from './sync-crypto.ts'
import { WebDav } from './webdav.ts'
import type { WebDavSettings } from './webdav.ts'

interface Snapshot {
  version: 1; at: string; managed: ManagedState; credentials: PortableCredential[]; templates: TaskTemplate[]
  keys: { source: string; content: string }[]
}
interface Revisions { managed: string; vault: string; templates: string }
interface Preview { url: string; name: string; hash: string; revisions: Revisions; expires: number }
const snapshotName = () => `wispops-${new Date().toISOString().replace(/[-:.]/g, '')}-${randomUUID()}.json`
const digest = (text: string) => createHash('sha256').update(text).digest('hex')
const keyValid = (text: unknown): text is string => typeof text === 'string' && text.length <= 128 * 1024 && /^-----BEGIN (?:OPENSSH |RSA |EC |DSA |ENCRYPTED )?PRIVATE KEY-----/.test(text)

/** Explicit owner actions only; snapshots never include grants, audit history or live schedules. */
export class OpsSync {
  private readonly state
  private readonly library
  private readonly previews = new Map<string, Preview>()
  constructor(private readonly service: OpsService, private readonly vault: LocalVault, private readonly hasSchedules: () => Promise<boolean>, private readonly transport: typeof fetch = fetch) {
    this.state = managedStore(service.config.dataDir)
    this.library = templateStore(service.config.dataDir)
  }
  private async revisions(): Promise<Revisions> {
    return { managed: (await this.state.read()).revision, vault: (await this.vault.list()).revision, templates: (await this.library.read()).revision }
  }
  private async snapshot(includeKeys: boolean): Promise<{ snapshot: Snapshot; revisions: Revisions }> {
    const managed = await this.state.read(), vault = await this.vault.exportForSync(), templates = await this.library.read()
    const keys: Snapshot['keys'] = []
    if (includeKeys) {
      for (const source of new Set(managed.value.hosts.flatMap(h => h.identityFile ? [h.identityFile] : []))) {
        const file = await open(expandHome(source), 'r')
        let content: string
        try {
          const info = await file.stat()
          if (!info.isFile() || info.size > 128 * 1024) throw new Error('SSH key is not a regular file or is too large')
          content = await file.readFile('utf8')
        } finally { await file.close() }
        if (!keyValid(content)) throw new Error('A referenced SSH identity is not a supported private key (maximum 128 KiB)')
        keys.push({ source, content })
      }
    }
    const revisions = { managed: managed.revision, vault: vault.revision, templates: templates.revision }
    if (JSON.stringify(await this.revisions()) !== JSON.stringify(revisions)) throw new Error('Local data changed during snapshot; refresh and retry')
    return { snapshot: { version: 1, at: new Date().toISOString(), managed: managed.value, credentials: vault.entries, templates: templates.value.entries, keys }, revisions }
  }
  private validate(value: unknown): Snapshot {
    const s = value as Snapshot
    if (!s || s.version !== 1 || !Number.isFinite(Date.parse(s.at)) || !Array.isArray(s.credentials) || s.credentials.length > 1000 || !Array.isArray(s.templates) || s.templates.length > 1000 || !Array.isArray(s.keys) || s.keys.length > 1000) throw new Error('Invalid sync snapshot')
    const managed = validateManaged(s.managed)
    const templates = s.templates.map(validateTemplate)
    if (new Set(templates.map(t => t.id)).size !== templates.length) throw new Error('Duplicate template in snapshot')
    const names = new Set<string>()
    for (const e of s.credentials) {
      if (!e || typeof e.name !== 'string' || !e.name || names.has(e.name) || typeof e.password !== 'string' || !e.password || typeof e.agent !== 'boolean' || typeof e.username !== 'string' || typeof e.note !== 'string') throw new Error('Invalid credential in snapshot')
      names.add(e.name)
    }
    for (const key of s.keys) if (!key || typeof key.source !== 'string' || !keyValid(key.content) || !managed.hosts.some(h => h.identityFile === key.source)) throw new Error('Invalid SSH key in snapshot')
    return { ...s, managed, templates }
  }
  async handle(action: string, request: Record<string, unknown>): Promise<unknown> {
    const settings = request.webdav as WebDavSettings
    if (!settings || typeof settings.url !== 'string' || typeof settings.username !== 'string' || typeof settings.password !== 'string') throw new Error('WebDAV settings are required')
    const dav = new WebDav(settings, this.transport)
    if (action === 'syncList') return { snapshots: await dav.list() }
    const passphrase = request.passphrase
    if (typeof passphrase !== 'string' || passphrase.length < 12) throw new Error('Sync passphrase must contain at least 12 characters')
    if (action === 'syncPush') {
      const { snapshot } = await this.snapshot(request.includeKeys === true)
      const name = snapshotName()
      const encrypted = await sealSync(snapshot, passphrase)
      await dav.upload(name, encrypted)
      return { message: 'Encrypted snapshot uploaded.', name }
    }
    if (action === 'syncPreview') {
      if (typeof request.name !== 'string') throw new Error('Select a snapshot')
      const encrypted = await dav.download(request.name), s = this.validate(await openSync(encrypted, passphrase))
      await Inventory.load(this.service.config, this.service.imported, s.managed)
      const revisions = await this.revisions()
      const local = await this.state.read(), localVault = await this.vault.list()
      for (const [id, preview] of this.previews) if (preview.expires < Date.now()) this.previews.delete(id)
      if (this.previews.size >= 20) this.previews.clear()
      const token = randomUUID()
      this.previews.set(token, { url: dav.url.href, name: request.name, hash: digest(encrypted), revisions, expires: Date.now() + 10 * 60_000 })
      return {
        token, at: s.at,
        incoming: { hosts: s.managed.hosts.length, credentials: s.credentials.length, tasks: s.managed.tasks.length, templates: s.templates.length, keys: s.keys.length },
        local: { hosts: local.value.hosts.length, credentials: localVault.entries.length, tasks: local.value.tasks.length },
        conflicts: s.credentials.filter(e => localVault.entries.some(old => old.name === e.name)).map(e => e.name),
        hostNames: s.managed.hosts.map(h => h.name), credentialNames: s.credentials.map(e => e.name),
        policies: s.managed.hosts.filter(h => h.policy).map(h => ({ host: h.name, policy: h.policy })),
        automatedCredentials: s.credentials.filter(e => e.agent).map(e => e.name),
        sudoTasks: s.managed.tasks.filter(t => t.sudo).map(t => ({ name: t.name, targets: t.targets })),
        bindings: Object.entries(s.managed.bindings).map(([host, binding]) => ({ host, ...binding })),
      }
    }
    if (action === 'syncPull') {
      const token = String(request.token ?? ''), preview = this.previews.get(token)
      this.previews.delete(token)
      if (!preview || preview.expires < Date.now() || preview.url !== dav.url.href) throw new Error('Sync preview expired; preview again')
      if (JSON.stringify(await this.revisions()) !== JSON.stringify(preview.revisions)) throw new Error('Local data changed after preview; preview again')
      if (await this.hasSchedules()) throw new Error('Stop WispOps schedules on this device before importing a snapshot')
      const encrypted = await dav.download(preview.name)
      if (digest(encrypted) !== preview.hash) throw new Error('Remote snapshot changed after preview; preview again')
      const s = this.validate(await openSync(encrypted, passphrase))
      await Inventory.load(this.service.config, this.service.imported, s.managed)
      const backup = await this.snapshot(true)
      const dir = join(this.service.config.dataDir, 'sync-backups')
      await mkdir(dir, { recursive: true, mode: 0o700 })
      const backupName = snapshotName()
      await writeFile(join(dir, backupName), await sealSync(backup.snapshot, passphrase), { mode: 0o600, flag: 'wx' })
      for (const key of s.keys) {
        const keyDir = join(this.service.config.dataDir, 'ssh-keys')
        await mkdir(keyDir, { recursive: true, mode: 0o700 })
        const path = join(keyDir, digest(key.content))
        // Content-addressed, private, and not written to a path supplied by the snapshot.
        await writeFile(path, key.content, { mode: 0o600, flag: 'wx' }).catch(async (error: NodeJS.ErrnoException) => {
          if (error.code !== 'EEXIST' || !(await lstat(path)).isFile() || await readFile(path, 'utf8') !== key.content) throw new Error('Cannot safely install SSH key')
        })
        await chmod(path, 0o600)
        for (const host of s.managed.hosts) if (host.identityFile === key.source) host.identityFile = path
      }
      await this.library.change(preview.revisions.templates, () => ({ version: 1, entries: s.templates }), async commitLibrary => {
        await this.state.change(preview.revisions.managed, () => s.managed, async commitManaged => {
          await this.vault.replaceFromSync(s.credentials, preview.revisions.vault, async commitVault => {
            await commitVault(); await commitManaged(); await commitLibrary()
          })
        })
      })
      this.service.inventory = await Inventory.load(this.service.config, this.service.imported)
      return { message: 'Snapshot imported; schedules remain disabled. Local encrypted backup saved.', backup: backupName }
    }
    throw new Error('Unknown sync action')
  }
}
