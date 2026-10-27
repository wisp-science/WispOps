import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LocalState } from './local-state.ts'

const PACKAGE = 'dsh-wisp-ops', REPO = 'wisp-science/WispOps'
export interface UpdateHost {
  listBundles(): Promise<{ name: string; source?: string; installed: boolean; enabled: boolean }[]>
  installBundle(spec: string, options: { enabled: boolean; saveExact: boolean }): Promise<{ changed: boolean; application: string; version?: string; error?: { code: string }; pendingBuilds?: string[] }>
}
export interface UpdateStatus { checkedAt?: string; current: string; latest?: string; sha?: string; releaseUrl?: string; available: boolean; state: 'unchecked' | 'no-release' | 'current' | 'available' | 'restart-required' | 'failed'; detail?: string }
interface Settings { version: 1; automatic: boolean; status?: UpdateStatus }
export function newerStable(next: string, current: string): boolean {
  if (!/^\d+\.\d+\.\d+$/.test(next) || !/^\d+\.\d+\.\d+$/.test(current)) return false
  const a = next.split('.').map(Number), b = current.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!
  return false
}

/** Uses the host's installer and its compatibility/script checks; never edits plugin files. */
export class OpsUpdates {
  private readonly settings
  private pending: Promise<unknown> = Promise.resolve()
  private runningVersion?: Promise<string>
  constructor(dataDir: string, private readonly manager: () => UpdateHost | undefined, private readonly hasHmr: () => boolean, private readonly send: typeof fetch = fetch, private readonly root = fileURLToPath(new URL('../', import.meta.url))) {
    this.settings = new LocalState<Settings>(join(dataDir, 'updates.json'), () => ({ version: 1, automatic: false }), value => {
      const s = value as Settings
      if (s?.version !== 1 || typeof s.automatic !== 'boolean') throw new Error('Invalid update settings')
      return s
    })
  }
  dispatch(action: string, request: Record<string, unknown> = {}): Promise<unknown> {
    const next = this.pending.then(() => this.handle(action, request))
    this.pending = next.catch(() => {})
    return next
  }
  private current(): Promise<string> {
    return this.runningVersion ??= readFile(join(this.root, 'package.json'), 'utf8').then(text => String(JSON.parse(text).version))
  }
  private async saveStatus(status: UpdateStatus) {
    const { revision } = await this.settings.read()
    await this.settings.change(revision, value => ({ ...value, status }))
  }
  private async github(path: string): Promise<any> {
    const response = await this.send(`https://api.github.com/repos/${REPO}/${path}`, { headers: { accept: 'application/vnd.github+json' }, redirect: 'error', signal: AbortSignal.timeout(15_000) })
    if (response.status === 404) { await response.body?.cancel(); return null }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Update check failed (HTTP ${response.status})`) }
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Empty update response')
    const chunks: Uint8Array[] = []; let bytes = 0
    try {
      for (;;) {
        const r = await reader.read(); if (r.done) break
        bytes += r.value.length
        if (bytes > 1024 * 1024) throw new Error('Update response too large')
        chunks.push(r.value)
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } finally { await reader.cancel().catch(() => {}) }
  }
  private async check(): Promise<UpdateStatus> {
    const current = await this.current(), checkedAt = new Date().toISOString()
    try {
      const release = await this.github('releases/latest')
      if (!release) { const status: UpdateStatus = { current, checkedAt, available: false, state: 'no-release' }; await this.saveStatus(status); return status }
      if (release.draft || release.prerelease || !/^v?\d+\.\d+\.\d+$/.test(release.tag_name)) throw new Error('No supported stable release')
      const commit = await this.github(`commits/${encodeURIComponent(release.tag_name)}`)
      if (!/^[a-f0-9]{40}$/.test(commit?.sha)) throw new Error('Invalid release commit')
      const file = await this.github(`contents/package.json?ref=${commit.sha}`)
      if (file?.encoding !== 'base64' || typeof file.content !== 'string') throw new Error('Missing release manifest')
      const manifest = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
      if (manifest.name !== PACKAGE || manifest.version !== release.tag_name.replace(/^v/, '') || manifest.main !== 'lib/index.js') throw new Error('Release metadata mismatch')
      const previous = (await this.settings.read()).value.status
      if (previous?.state === 'restart-required' && previous.current === current && previous.sha === commit.sha) {
        const status: UpdateStatus = { ...previous, checkedAt }
        await this.saveStatus(status); return status
      }
      const available = newerStable(manifest.version, current)
      const status: UpdateStatus = { current, checkedAt, available, latest: manifest.version, sha: commit.sha, releaseUrl: `https://github.com/${REPO}/releases/tag/${encodeURIComponent(release.tag_name)}`, state: available ? 'available' : 'current' }
      await this.saveStatus(status); return status
    } catch {
      const status: UpdateStatus = { current, checkedAt, available: false, state: 'failed', detail: 'Cannot verify a stable GitHub release; retry later.' }
      await this.saveStatus(status); return status
    }
  }
  private async install(): Promise<UpdateStatus> {
    const status = await this.check()
    if (!status.available || !status.sha) return status
    try {
      if (await stat(join(this.root, '.git')).then(() => true, () => false)) throw new Error('Development checkouts are not updated automatically.')
      const manager = this.manager()
      if (!manager) throw new Error('Harness plugin manager is unavailable.')
      if (this.hasHmr()) throw new Error('Disable Harness HMR and restart before updating this GitHub plugin; its installer cannot replace an active Git bundle with HMR enabled.')
      const bundle = (await manager.listBundles()).find(b => b.name === PACKAGE)
      const source = bundle?.source ?? ''
      if (!bundle?.installed || !/^(?:github:|git\+https:\/\/github\.com\/|https:\/\/github\.com\/|git@github\.com:|https:\/\/codeload\.github\.com\/)wisp-science\/WispOps(?:\.git)?(?:[#/]|$)/i.test(source)) throw new Error('Only installations from the official WispOps GitHub repository can update here; local links are preserved.')
      const result = await manager.installBundle(`github:${REPO}#${status.sha}`, { enabled: bundle.enabled, saveExact: true })
      if (result.application === 'failed' || result.application === 'cancelled' || !result.changed || (result.version !== undefined && result.version !== status.latest)) throw new Error(result.pendingBuilds?.length ? 'Harness requires explicit dependency build approval. Review the installation in Plugins.' : 'Harness could not complete the update. Review the installation in Plugins.')
      const finished: UpdateStatus = { ...status, available: false, state: 'restart-required', detail: 'Update installed. Restart Harness to load the new version.' }
      await this.saveStatus(finished); return finished
    } catch (error) {
      const failed: UpdateStatus = { ...status, state: 'failed', detail: error instanceof Error ? error.message : 'Update installation failed.' }
      await this.saveStatus(failed); return failed
    }
  }
  private async handle(action: string, request: Record<string, unknown>): Promise<unknown> {
    const loaded = await this.current(), saved = (await this.settings.read()).value.status
    if (saved && saved.current !== loaded) {
      await this.saveStatus({ ...saved, current: loaded, available: saved.latest ? newerStable(saved.latest, loaded) : false, state: saved.latest && newerStable(saved.latest, loaded) ? 'available' : 'current', detail: undefined })
    }
    if (action === 'updateSettings') {
      if (typeof request.automatic !== 'boolean') throw new Error('automatic must be boolean')
      const { revision } = await this.settings.read()
      await this.settings.change(revision, value => ({ ...value, automatic: request.automatic as boolean }))
    } else if (action === 'updateCheck') await this.check()
    else if (action === 'updateInstall') await this.install()
    else if (action === 'updateTick') {
      const { value } = await this.settings.read()
      if (!value.automatic || value.status?.state === 'restart-required' || (value.status?.checkedAt && Date.now() - Date.parse(value.status.checkedAt) < 6 * 3600_000)) return
      await this.install()
    }
    const { value } = await this.settings.read()
    return { automatic: value.automatic, status: value.status ?? { current: await this.current(), available: false, state: 'unchecked' } }
  }
}
