import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { tr } from './i18n'
import type { Api, SpaceScan } from './contracts'
import { buildSpaceTree, findSpaceNode, normalizeRoot } from '../src/space-tree'
import type { SpaceNode } from '../src/space-tree'
import { formatKb } from '../src/collectors/sections'
import { squarify } from './treemap'
import type { Rect } from './treemap'

/** One hue class per block of the open level (style.css defines ten); nested blocks keep their parent's hue. */
const HUES = 10
const NEUTRAL = 'wo-space-hue-n'
/** Blocks drawn per level; smaller directories merge into one block. */
const MAX_BLOCKS = 24
const MAX_NESTED = 12
const MAX_ROWS = 200
const GAP = 4
const HEADER = 40
const PAD = 6
const date = (value: string) => new Date(value).toLocaleString()
const share = (part: number, whole: number) => {
  const value = whole > 0 ? part / whole * 100 : 0
  return `${value >= 10 || value === 0 ? value.toFixed(0) : value.toFixed(1)}%`
}

/** `of` is what the share is a part of: the open directory, or the filesystem size for free space. */
interface Block { key: string; kind: 'dir' | 'files' | 'other' | 'free'; kb: number; of: number; label: string; hue: string; node?: SpaceNode }

/** The blocks of one directory: its largest subdirectories, the rest merged, files directly in it, and optionally free space last. */
function blocksOf(node: SpaceNode, limit: number, hue: (index: number) => string, free?: { kb: number; of: number }): Block[] {
  const shown = node.children.slice(0, limit), hidden = node.children.slice(limit)
  const blocks: Block[] = shown.map((child, i) => ({ key: child.path, kind: 'dir', kb: child.kb, of: node.kb, label: child.name, hue: hue(i), node: child }))
  const otherKb = hidden.reduce((sum, c) => sum + c.kb, 0)
  if (otherKb > 0) blocks.push({ key: `${node.path}\0other`, kind: 'other', kb: otherKb, of: node.kb, label: tr('space.other', { p0: hidden.length }), hue: NEUTRAL })
  if (node.restKb > 0) blocks.push({ key: `${node.path}\0files`, kind: 'files', kb: node.restKb, of: node.kb, label: tr('space.files.here'), hue: NEUTRAL })
  blocks.sort((a, b) => b.kb - a.kb)
  // Free space goes last so it fills whatever the directories leave, like the remaining-space strip of a usage chart.
  if (free && free.kb > 0) blocks.push({ key: '\0free', kind: 'free', kb: free.kb, of: free.of, label: tr('space.free'), hue: NEUTRAL })
  return blocks
}

/** Slivers are skipped and small blocks drop their padding, so no block draws outside its own rectangle. */
const fit = (rect: Rect) => rect.w < 3 || rect.h < 3 ? undefined : rect.w < 28 || rect.h < 28 ? ' is-tiny' : ''
const opensTo = (block: Block) => block.node && block.node.children.length > 0 ? block.node.path : undefined
const describe = (block: Block) => tr('space.block.label', { p0: block.node?.path ?? block.label, p1: formatKb(block.kb), p2: share(block.kb, block.of) })

function Nested({ block, rect, open }: { block: Block; rect: Rect; open: (path: string) => void }) {
  const size = fit(rect)
  if (size === undefined) return null
  const style: CSSProperties = { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
  const target = opensTo(block)
  const content = rect.w >= 50 && rect.h >= 24 && <><strong>{block.label}</strong>{rect.h >= 40 && <small>{formatKb(block.kb)}</small>}</>
  return target
    ? <button type="button" className={`wo-space-block is-dir is-inner ${block.hue}${size}`} style={style} title={describe(block)} aria-label={describe(block)} onClick={e => { e.stopPropagation(); open(target) }}>{content}</button>
    : <div className={`wo-space-block is-${block.kind} is-inner ${block.hue}${size}`} style={style} title={describe(block)}>{content}</div>
}

function BlockView({ block, rect, open }: { block: Block; rect: Rect; open: (path: string) => void }) {
  const size = fit(rect)
  if (size === undefined) return null
  const style: CSSProperties = { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
  const target = opensTo(block)
  const label = describe(block)
  const content = rect.w >= 56 && rect.h >= 28 && <><strong>{block.label}</strong>{rect.w >= 70 && rect.h >= 46 && <small>{formatKb(block.kb)} · {share(block.kb, block.of)}</small>}</>
  if (!target || block.node === undefined) return <div className={`wo-space-block is-${block.kind} ${block.hue}${size}`} style={style} title={label} role="img" aria-label={label}>{content}</div>
  if (rect.w < 120 || rect.h < 96) return <button type="button" className={`wo-space-block is-dir ${block.hue}${size}`} style={style} title={label} aria-label={label} onClick={() => open(target)}>{content}</button>
  // Large enough to show the next level inside, so the nesting reads at a glance; the 2px is the block's border.
  const inner = squarify(blocksOf(block.node, MAX_NESTED, () => block.hue).map(b => ({ value: b.kb, item: b })), { x: PAD, y: HEADER, w: rect.w - 2 * PAD - 2 + GAP, h: rect.h - HEADER - PAD - 2 + GAP })
  return <div className={`wo-space-block is-dir is-nested ${block.hue}`} style={style} title={label} onClick={() => open(target)}>
    <button type="button" className="wo-space-head" aria-label={label} onClick={e => { e.stopPropagation(); open(target) }}><strong>{block.label}</strong><small>{formatKb(block.kb)} · {share(block.kb, block.of)}</small></button>
    {inner.map(({ item, ...r }) => <Nested key={item.key} block={item} rect={{ ...r, w: Math.max(0, r.w - GAP), h: Math.max(0, r.h - GAP) }} open={open}/>)}
  </div>
}

function Treemap({ blocks, open }: { blocks: Block[]; open: (path: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current!
    const measure = () => setSize(prev => prev.w === el.clientWidth && prev.h === el.clientHeight ? prev : { w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // Lay out one gap beyond the edges so outer blocks sit flush with the frame.
  const layout = size.w > 0 && size.h > 0 ? squarify(blocks.map(b => ({ value: b.kb, item: b })), { x: 0, y: 0, w: size.w + GAP, h: size.h + GAP }) : []
  return <div ref={ref} className="wo-space-map" role="group" aria-label={tr('space.map.label')}>
    {layout.map(({ item, ...r }) => <BlockView key={item.key} block={item} rect={{ ...r, w: Math.max(0, r.w - GAP), h: Math.max(0, r.h - GAP) }} open={open}/>)}
  </div>
}

/** The latest directory scans of some servers as a map that opens one directory level at a time. */
export function SpaceMap({ api, hosts, paths = [] }: { api: Api; hosts: string[]; paths?: string[] }) {
  const [host, setHost] = useState(hosts[0] ?? '')
  const [scans, setScans] = useState<SpaceScan[]>()
  const [error, setError] = useState('')
  const [path, setPath] = useState('')
  const [zoom, setZoom] = useState('')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [showFree, setShowFree] = useState(true)
  useEffect(() => {
    let alive = true
    setScans(undefined); setError('')
    void api({ action: 'spaceUsage', host }).then(result => { if (alive) setScans((result as { entries: SpaceScan[] }).entries) }, e => { if (alive) setError(e instanceof Error ? e.message : tr('space.error')) })
    return () => { alive = false }
  }, [api, host])
  // The task's own paths first, then any other stored scan of this server.
  const ordered = useMemo(() => {
    const wanted = paths.map(normalizeRoot)
    const rank = (p: string) => wanted.includes(p) ? wanted.indexOf(p) : wanted.length
    return [...scans ?? []].sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path))
  }, [scans, paths])
  const scan = ordered.find(s => s.path === path) ?? ordered[0]
  const tree = useMemo(() => scan && buildSpaceTree(scan.path, scan.dirs), [scan])
  const current = tree && (findSpaceNode(tree, zoom) ?? tree)
  const trail: SpaceNode[] = []
  for (let node = tree; node && current;) {
    trail.push(node)
    if (node === current) break
    node = node.children.find(c => current.path === c.path || current.path.startsWith(`${c.path}/`))
  }
  const fs = scan?.filesystem
  const free = showFree && fs && current === tree && fs.mount === scan?.path ? { kb: fs.availKb, of: fs.sizeKb } : undefined
  const blocks = current ? blocksOf(current, view === 'map' ? MAX_BLOCKS : MAX_ROWS, i => `wo-space-hue-${i % HUES}`, free) : []
  const open = (target: string) => setZoom(target)
  return <section className="wo-space" aria-label={tr('space.title')}>
    <div className="wo-space-pickers">
      {hosts.length > 1 && <div className="wo-range" role="group" aria-label={tr('space.server')}>{hosts.map(name => <button key={name} type="button" className={name === host ? 'active' : ''} onClick={() => { setHost(name); setPath(''); setZoom('') }}>{name}</button>)}</div>}
      {ordered.length > 1 && <label className="wo-space-path"><span>{tr('space.path')}</span><select value={scan?.path} onChange={e => { setPath(e.target.value); setZoom('') }}>{ordered.map(s => <option key={s.path} value={s.path}>{s.path}</option>)}</select></label>}
    </div>
    {error && <p role="alert" className="wo-alert">{error}</p>}
    {!scans && !error && <div className="wo-empty">{tr('space.loading')}</div>}
    {scans && !scan && <div className="wo-empty">{tr('space.empty', { p0: host })}</div>}
    {scan && tree && current && <>
      <p className="wo-space-summary">
        <span>{tr('space.counted', { p0: formatKb(tree.kb) })}</span>
        {fs && <span>{tr('space.filesystem', { p0: fs.mount, p1: fs.type ?? fs.filesystem, p2: fs.usePct, p3: formatKb(fs.availKb), p4: formatKb(fs.sizeKb) })}</span>}
        <span className="wo-muted">{tr('space.scanned', { p0: date(scan.at), p1: scan.depth })}</span>
      </p>
      {(scan.walkIncomplete || scan.permissionDenied || scan.dirCount > scan.dirs.length) && <div className="wo-space-flags">
        {scan.walkIncomplete && <span className="wo-badge warn">{tr('space.incomplete')}</span>}
        {scan.permissionDenied && <span className="wo-badge warn">{tr('space.permission')}</span>}
        {scan.dirCount > scan.dirs.length && <span className="wo-badge">{tr('space.truncated', { p0: scan.dirs.length, p1: scan.dirCount, p2: formatKb(scan.minKb) })}</span>}
      </div>}
      <div className="wo-space-bar">
        <nav className="wo-space-trail" aria-label={tr('space.trail')}>{trail.map((node, i) => <span key={node.path}>{i > 0 && <i aria-hidden="true">›</i>}{node === current ? <strong aria-current="location">{node.name}</strong> : <button type="button" className="wo-text-button" onClick={() => setZoom(node.path)}>{node.name}</button>}</span>)}</nav>
        <span className="wo-space-total">{formatKb(current.kb)}{current !== tree && <small> · {share(current.kb, tree.kb)}</small>}</span>
      </div>
      {current.kb === 0 ? <div className="wo-empty">{tr('space.no.dirs')}</div> : view === 'map' ? <Treemap key={current.path} blocks={blocks} open={open}/> : <table className="wo-space-list">
        <thead><tr><th>{tr('space.col.name')}</th><th>{tr('space.col.size')}</th><th>{tr('space.col.share')}</th></tr></thead>
        <tbody>{blocks.map(b => { const target = opensTo(b); return <tr key={b.key} className={`is-${b.kind}`}>
          <td><i className={`wo-space-swatch ${b.hue}`} aria-hidden="true"/>{target ? <button type="button" className="wo-text-button" onClick={() => open(target)}>{b.label}</button> : <span>{b.label}</span>}{b.node && b.node.children.length > 0 && <small> · {tr('space.subdirs', { p0: b.node.children.length })}</small>}</td>
          <td className="wo-mono">{formatKb(b.kb)}</td>
          <td><span className={`wo-space-meter ${b.hue}`}><i style={{ width: share(b.kb, b.of) }}/></span>{share(b.kb, b.of)}</td>
        </tr> })}</tbody>
      </table>}
      <div className="wo-space-foot">
        <div className="wo-space-legend">{blocks.slice(0, 10).map(b => <span key={b.key} className={`is-${b.kind}`}><i className={`wo-space-swatch ${b.hue}`} aria-hidden="true"/>{b.label}<b>{formatKb(b.kb)}</b></span>)}</div>
        <div className="wo-space-controls">
          {fs && fs.mount === scan.path && current === tree && <label className="wo-check"><input type="checkbox" checked={showFree} onChange={e => setShowFree(e.target.checked)}/>{tr('space.show.free')}</label>}
          <div className="wo-range" role="group" aria-label={tr('space.view.mode')}><button type="button" className={view === 'map' ? 'active' : ''} aria-pressed={view === 'map'} onClick={() => setView('map')}>{tr('space.view.map')}</button><button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>{tr('space.view.list')}</button></div>
        </div>
      </div>
      <p className="wo-muted wo-space-hint">{tr('space.hint')}</p>
    </>}
  </section>
}
