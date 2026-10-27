import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { OpsUpdates, newerStable } from '../src/updates.ts'
let dir: string
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'wisp-update-')); await writeFile(join(dir, 'package.json'), JSON.stringify({ version: '0.5.1' })) })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
function fixture(source = 'github:wisp-science/WispOps', hmr = false) {
  const sha = 'a'.repeat(40)
  const send = vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('releases/latest') ? { tag_name: 'v0.6.0', prerelease: false, draft: false } : url.includes('commits/') ? { sha } : { encoding: 'base64', content: Buffer.from(JSON.stringify({ name: 'dsh-wisp-ops', version: '0.6.0', main: 'lib/index.js' })).toString('base64') })))
  const host = { listBundles: vi.fn(async () => [{ name: 'dsh-wisp-ops', source, installed: true, enabled: true }]), installBundle: vi.fn(async () => ({ changed: true, application: 'restart-required', version: '0.6.0' })) }
  return { updates: new OpsUpdates(dir, () => host, () => hmr, send as typeof fetch, dir), host, send, sha }
}
it('compares stable versions numerically and ignores prereleases', () => {
  expect(newerStable('0.10.0', '0.9.0')).toBe(true)
  expect(newerStable('0.5.1', '0.5.1')).toBe(false)
  expect(newerStable('0.6.0-beta.1', '0.5.1')).toBe(false)
})
it('checks immutable release metadata and installs the exact commit through Harness', async () => {
  const { updates, host, sha } = fixture()
  expect((await updates.dispatch('updateCheck') as any).status.state).toBe('available')
  expect(host.installBundle).not.toHaveBeenCalled()
  expect((await updates.dispatch('updateInstall') as any).status.state).toBe('restart-required')
  expect(host.installBundle).toHaveBeenCalledWith(`github:wisp-science/WispOps#${sha}`, { enabled: true, saveExact: true })
})
it('defaults automatic updates off, persists opt-in and does not reinstall while awaiting restart', async () => {
  const { updates, host, send } = fixture()
  await updates.dispatch('updateTick'); expect(send).not.toHaveBeenCalled()
  await updates.dispatch('updateSettings', { automatic: true })
  await updates.dispatch('updateTick'); await updates.dispatch('updateTick')
  expect((await updates.dispatch('updateCheck') as any).status.state).toBe('restart-required')
  await updates.dispatch('updateInstall')
  expect(host.installBundle).toHaveBeenCalledTimes(1)
})
it('keeps the loaded version stable until restart and reconciles the installed version on restart', async () => {
  const { updates } = fixture()
  await updates.dispatch('updateInstall')
  await writeFile(join(dir, 'package.json'), JSON.stringify({ version: '0.6.0' }))
  expect((await updates.dispatch('updateStatus') as any).status).toMatchObject({ current: '0.5.1', state: 'restart-required' })
  const restarted = fixture()
  expect((await restarted.updates.dispatch('updateStatus') as any).status).toMatchObject({ current: '0.6.0', state: 'current', available: false })
})
it.each(['link:/local/checkout', 'github:someone-else/WispOps'])('preserves nonofficial or local sources: %s', async source => {
  const { updates, host } = fixture(source)
  expect((await updates.dispatch('updateInstall') as any).status.state).toBe('failed')
  expect(host.installBundle).not.toHaveBeenCalled()
})
it('preserves development checkouts and refuses unsupported HMR replacement', async () => {
  const { updates, host } = fixture()
  await mkdir(join(dir, '.git'))
  expect((await updates.dispatch('updateInstall') as any).status.detail).toContain('Development')
  expect(host.installBundle).not.toHaveBeenCalled()
  await rm(join(dir, '.git'), { recursive: true })
  const other = fixture('github:wisp-science/WispOps', true)
  expect((await other.updates.dispatch('updateInstall') as any).status.detail).toContain('HMR')
  expect(other.host.installBundle).not.toHaveBeenCalled()
})
it('reports no release and network failure without claiming an update was installed', async () => {
  const updates = new OpsUpdates(dir, () => undefined, () => false, vi.fn(async () => new Response(null, { status: 404 })) as typeof fetch, dir)
  expect((await updates.dispatch('updateCheck') as any).status.state).toBe('no-release')
  const failed = new OpsUpdates(dir, () => undefined, () => false, vi.fn(async () => { throw new Error('network'); }) as typeof fetch, dir)
  expect((await failed.dispatch('updateCheck') as any).status.state).toBe('failed')
})
