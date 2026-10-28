import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseSpace, renderSpace, spaceScript } from '../src/collectors/space.ts'
import type { SpaceOptions, SpaceSnapshot } from '../src/collectors/space.ts'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { OpsManager } from '../src/management.ts'
import { TaskRunner } from '../src/runner.ts'
import { noSecrets } from '../src/secrets.ts'
import { OpsService } from '../src/service.ts'
import { buildSpaceTree, findSpaceNode } from '../src/space-tree.ts'
import { builtinTemplates } from '../src/task-library.ts'
import { LocalVault, routeSecrets } from '../src/vault.ts'
import { squarify } from '../client/treemap.ts'

const G = 1024 * 1024
const OPTIONS: SpaceOptions = { path: '/', depth: 5, maxDirs: 4, minKb: 1024, walkTimeoutSec: 300 }
const OUTPUT = `@@whoami
1000
@@df
Filesystem     Type 1024-blocks      Used Available Capacity Mounted on
/dev/sda2      ext4   1000000000 850000000 150000000      85% /
@@du
${300 * G}\t/
${200 * G}\t/home
${150 * G}\t/home/alice
${60 * G}\t/var
@@du_rc
1
@@du_count
37
@@end
`

describe('space tree', () => {
  it('nests du rows, keeps files directly in a directory as its rest, and rebuilds directories the rows lack', () => {
    const tree = buildSpaceTree('/data/', [['/data', 100], ['/data/a', 60], ['/data/a/x', 50], ['/data/b/deep/er', 20], ['/elsewhere', 999], ['/database', 7]])
    expect(tree).toMatchObject({ name: '/data', path: '/data', kb: 100, restKb: 20 })
    expect(tree.children.map(c => [c.name, c.kb, c.restKb])).toEqual([['a', 60, 10], ['b', 20, 0]])
    // `/data/b` and `/data/b/deep` were cut; their size is what their listed subdirectories add up to.
    expect(findSpaceNode(tree, '/data/b/deep')).toMatchObject({ name: 'deep', kb: 20 })
    expect(findSpaceNode(tree, '/data/c')).toBeUndefined()
    // An interrupted walk can lose the root; it becomes the sum of what was listed.
    expect(buildSpaceTree('/', [['/var', 5], ['/home/a', 7]])).toMatchObject({ name: '/', kb: 12, restKb: 0 })
  })
})

describe('space collector', () => {
  const report = parseSpace(OUTPUT, OPTIONS)

  it('parses sizes, the filesystem and why totals may be low', () => {
    expect(report.filesystem).toMatchObject({ mount: '/', usePct: 85, availKb: 150000000 })
    expect(report.dirs).toEqual([['/', 300 * G], ['/home', 200 * G], ['/home/alice', 150 * G], ['/var', 60 * G]])
    expect(report).toMatchObject({ dirCount: 37, permissionDenied: true, walkIncomplete: false, fullVisibility: false })
    expect(report.notes.join(' ')).toMatch(/enable sudo/)
    expect(report.notes.join(' ')).toMatch(/37 directories/)
    expect(parseSpace(OUTPUT.replace('@@du_rc\n1', '@@du_rc\n124'), OPTIONS)).toMatchObject({ walkIncomplete: true, permissionDenied: false })
  })

  it('renders nested directories with growth since the previous scan', () => {
    const previous: SpaceSnapshot = { ...report, at: '2026-10-20T00:00:00.000Z', dirs: [['/', 250 * G], ['/home', 160 * G], ['/home/alice', 110 * G], ['/var', 60 * G]] }
    const text = renderSpace('gpu-01', report, previous)
    expect(text).toContain('gpu-01:/ — directory space on / (/dev/sda2) 85% used')
    expect(text).toMatch(/\n {2} +200G +67% {2}\/home {2}\[files directly here 50\.0G\] {2}\(\+40\.0G since/)
    expect(text).toMatch(/\n {4} +150G +50% {2}\/home\/alice/)
    // Growth names the deepest directory that explains it, not every ancestor.
    expect(text).toContain('Grew most since the previous scan (2026-10-20T00:00:00.000Z): /home/alice +40.0G')
  })

  it('quotes the path and measures a real directory tree with the shell tools', async () => {
    const root = await mkdtemp(join(tmpdir(), "wisp space '"))
    try {
      await mkdir(join(root, 'a', 'a1'), { recursive: true })
      await mkdir(join(root, 'b'))
      await mkdir(join(root, 'tiny'))
      await writeFile(join(root, 'a', 'a1', 'f'), Buffer.alloc(3 * 1024 * 1024, 'x'))
      await writeFile(join(root, 'a', 'f'), Buffer.alloc(1024 * 1024, 'x'))
      await writeFile(join(root, 'b', 'f'), Buffer.alloc(2 * 1024 * 1024, 'x'))
      await writeFile(join(root, 'tiny', 'f'), 'x')
      const options = { ...OPTIONS, path: `${root}/`, maxDirs: 100, walkTimeoutSec: 30 }
      const parsed = parseSpace(execFileSync('sh', ['-s'], { input: spaceScript(options), encoding: 'utf8' }), options)
      expect(parsed.path).toBe(root)
      expect(parsed.filesystem).toBeDefined()
      const tree = buildSpaceTree(parsed.path, parsed.dirs)
      expect(tree.children.map(c => c.name)).toEqual(['a', 'b'])
      expect(findSpaceNode(tree, join(root, 'a', 'a1'))!.kb).toBeGreaterThanOrEqual(3 * 1024)
      expect(tree.children[0]!.restKb).toBeGreaterThanOrEqual(1024)
      expect(parsed.dirCount).toBe(4)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('treemap layout', () => {
  it('fills the bounds with non-overlapping rectangles proportional to their values', () => {
    const values = [500, 300, 120, 50, 20, 6, 3, 1]
    const bounds = { x: 0, y: 0, w: 640, h: 360 }
    const rects = squarify(values.map((value, i) => ({ value, item: i })), bounds)
    expect(rects.map(r => r.item)).toEqual(values.map((_, i) => i))
    const total = values.reduce((a, b) => a + b, 0)
    for (const r of rects) {
      expect(r.w * r.h).toBeCloseTo(values[r.item]! / total * bounds.w * bounds.h, 6)
      expect(r.x).toBeGreaterThanOrEqual(-1e-9)
      expect(r.y + r.h).toBeLessThanOrEqual(bounds.h + 1e-6)
      expect(r.x + r.w).toBeLessThanOrEqual(bounds.w + 1e-6)
    }
    for (const a of rects) for (const b of rects) {
      if (a === b) continue
      const overlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
      expect(overlap).toBeLessThan(1e-6)
    }
    expect(squarify([{ value: 0, item: 0 }], bounds)).toEqual([])
  })
})

describe('space template', () => {
  const FIXTURES = join(import.meta.dirname, 'fixtures')
  let dir: string
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'wisp-space-')) })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('links servers, runs without the agent, and serves the latest scan per path to the panel only', async () => {
    const root = join(dir, 'tree')
    await mkdir(join(root, 'data'), { recursive: true })
    await writeFile(join(root, 'data', 'f'), Buffer.alloc(2 * 1024 * 1024, 'x'))
    process.env.FAKE_BIN = join(FIXTURES, 'bin')
    const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'inventory.yml'), hosts: [{ name: 'a', ssh: '192.0.2.1' }], ssh: { binary: join(FIXTURES, 'fake-ssh.sh'), connectTimeoutSec: 5, controlPersistSec: 0, extraArgs: [], concurrency: 4, loadProfile: false, extraPath: [], authFailureBlockMinutes: 15 } })
    expect(builtinTemplates(config).find(t => t.id === 'builtin.space')?.definition).toMatchObject({ playbook: 'space', paths: ['/'] })
    const vault = new LocalVault(dir, vi.fn(async () => new Uint8Array(32).fill(7)))
    const service = new OpsService(config, await Inventory.load(config), routeSecrets(vault, noSecrets))
    await service.refresh()
    const manager = new OpsManager(service, vault, () => undefined, undefined, undefined, new TaskRunner(service))
    const view = await manager.dispatch({ action: 'snapshot' }) as any
    await manager.dispatch({ action: 'saveTask', revision: view.revision, templateId: 'builtin.space', templateRevision: view.templates.revision, templateValues: {}, task: { name: 'space-a', targets: 'a', paths: [root], report: 'never', schedule: { daily: '08:00', timeZone: 'UTC' } } })
    expect(service.inventory.tasks.get('space-a')).toMatchObject({ playbook: 'space', paths: [root], template: 'builtin.space' })
    const ran = await manager.dispatch({ action: 'runTaskNow', name: 'space-a', sessionId: 'unused' }) as any
    expect(ran.record).toMatchObject({ playbook: 'space', hosts: ['a'] })
    expect(ran.record.excerpt).toContain(`a:${root} — directory space`)
    expect(ran.record.excerpt).toContain(`${root}/data`)
    const usage = await manager.dispatch({ action: 'spaceUsage', host: 'a' }) as { host: string; entries: SpaceSnapshot[] }
    expect(usage.entries.map(e => e.path)).toEqual([root])
    expect(usage.entries[0]!.dirs.map(([path]) => path)).toContain(join(root, 'data'))
    await expect(manager.dispatch({ action: 'spaceUsage', host: 'missing' })).rejects.toThrow('不存在')
  })
})
