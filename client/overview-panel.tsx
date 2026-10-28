import { useEffect, useMemo, useRef, useState } from 'react'
import { tr } from './i18n'
import type { Api, Host, Overview, OverviewHost, OverviewRow, OverviewState } from './contracts'

const RANGES = [10, 30, 90]
/** "Inspect all" connects to at most this many servers at once; the rest wait their turn. */
const PARALLEL = 4
const date = (value: string) => new Date(value).toLocaleString()
const stateLabel = (state: OverviewState | 'never') => ({ ok: tr('fleet.summary.ok'), warn: tr('fleet.summary.warn'), crit: tr('fleet.summary.crit'), unreachable: tr('fleet.summary.unreachable'), never: tr('fleet.summary.never') })[state]
const worstDisk = (row: OverviewRow) => Object.entries(row.diskPct).sort((a, b) => b[1] - a[1])[0]

interface InspectResult { status: string; severity: string; findings: number; error: string }
interface Series { key: string; label: string; values: { at: string; value: number }[]; kind: 'used' | 'available' }

/** Up to three busiest mounts, memory and CPU, each as a 0–100 % series over the stored inspections. */
function seriesOf(host: OverviewHost): Series[] {
  const rows = host.rows.filter(r => r.state !== 'unreachable')
  const latest = rows.at(-1)
  const mounts = latest ? Object.entries(latest.diskPct).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([mount]) => mount) : []
  const pick = (key: string, label: string, kind: Series['kind'], read: (row: OverviewRow) => number | undefined): Series => ({ key, label, kind, values: rows.flatMap(row => { const value = read(row); return value === undefined ? [] : [{ at: row.at, value }] }) })
  return [
    ...mounts.map(mount => pick(`disk:${mount}`, tr('fleet.disk', { p0: mount }), 'used', row => row.diskPct[mount])),
    pick('mem', tr('fleet.memory'), 'available', row => row.memAvailPct),
    pick('cpu', tr('fleet.cpu'), 'used', row => row.cpuPct),
  ].filter(series => series.values.length > 0)
}

function Sparkline({ series }: { series: Series }) {
  const { values } = series
  const first = values[0]!, last = values.at(-1)!
  const delta = last.value - first.value
  const points = values.map((point, index) => `${values.length === 1 ? 50 : (index / (values.length - 1)) * 100},${32 - (Math.min(100, Math.max(0, point.value)) / 100) * 32}`)
  // Higher used % and lower available % both move the line toward the danger color.
  const danger = series.kind === 'used' ? last.value >= 90 : last.value <= 10
  const caution = series.kind === 'used' ? last.value >= 80 : last.value <= 20
  const tone = danger ? 'crit' : caution ? 'warn' : 'ok'
  return <div className={`wo-spark ${tone}`}>
    <div className="wo-spark-head"><span>{series.label}</span><strong>{series.kind === 'used' ? tr('fleet.used', { p0: last.value.toFixed(0) }) : tr('fleet.available', { p0: last.value.toFixed(0) })}</strong></div>
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={`${series.label}: ${values.map(v => `${v.value.toFixed(0)}%`).join(', ')}`}>
      <line x1="0" y1="16" x2="100" y2="16" className="wo-spark-guide"/>
      {values.length > 1 && <polygon points={`0,32 ${points.join(' ')} 100,32`} className="wo-spark-area"/>}
      {values.length > 1 ? <polyline points={points.join(' ')} className="wo-spark-line" vectorEffect="non-scaling-stroke"/> : <circle cx="50" cy={32 - (last.value / 100) * 32} r="2" className="wo-spark-dot"/>}
    </svg>
    <small>{values.length > 1 ? tr('fleet.delta', { p0: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`, p1: new Date(first.at).toLocaleDateString() }) : tr('fleet.one.point')}</small>
  </div>
}

export function OverviewPanel({ api, hosts, onSelectHost }: { api: Api; hosts: Host[]; onSelectHost: (name: string) => void }) {
  const [limit, setLimit] = useState(30)
  const [data, setData] = useState<Overview>()
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<{ host: string; index?: number }>()
  const [generation, setGeneration] = useState(0)
  // Hosts queued or running; the ref answers synchronously so one server is never inspected twice at once.
  const [jobs, setJobs] = useState<Record<string, 'queued' | 'running'>>({})
  const claimed = useRef(new Set<string>())
  const [batch, setBatch] = useState<{ done: number; total: number }>()
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string }>()
  const severityLabel = (severity: string) => ({ ok: tr('fleet.summary.ok'), info: tr('fleet.summary.ok'), warn: tr('fleet.summary.warn'), crit: tr('fleet.summary.crit'), unreachable: tr('fleet.summary.unreachable') } as Record<string, string>)[severity] ?? severity
  const mark = (names: string[], state?: 'queued' | 'running') => setJobs(prev => {
    const next = { ...prev }
    for (const name of names) { if (state) next[name] = state; else delete next[name] }
    return next
  })
  /** One inspection of a claimed host; the matrix reloads as soon as it is saved, whatever else is still running. */
  async function inspect(name: string): Promise<InspectResult> {
    mark([name], 'running')
    try { return await api({ action: 'inspectNow', host: name }) as InspectResult }
    finally { claimed.current.delete(name); mark([name]); setGeneration(g => g + 1) }
  }
  async function inspectNow(name: string) {
    if (claimed.current.has(name)) return
    claimed.current.add(name); setNotice(undefined)
    try {
      const result = await inspect(name)
      const ok = result.status === 'ok'
      setNotice({ tone: ok ? 'good' : 'bad', text: ok ? tr('fleet.inspected', { p0: name, p1: result.findings ? `${severityLabel(result.severity)} · ${tr('fleet.findings.count', { p0: result.findings })}` : severityLabel(result.severity) }) : tr('fleet.inspect.failed', { p0: name, p1: result.error || severityLabel(result.severity) }) })
      setPicked({ host: name })
    } catch (e) { setNotice({ tone: 'bad', text: tr('fleet.inspect.failed', { p0: name, p1: e instanceof Error ? e.message : String(e) }) }) }
  }
  async function inspectAll() {
    const names = hosts.map(h => h.name).filter(name => !claimed.current.has(name))
    if (!names.length) return
    for (const name of names) claimed.current.add(name)
    mark(names, 'queued'); setNotice(undefined); setBatch({ done: 0, total: names.length })
    const tally = { ok: 0, warn: 0, crit: 0, unreachable: 0, error: 0 }
    let next = 0
    const worker = async () => {
      while (next < names.length) {
        const name = names[next++]!
        try {
          const { severity } = await inspect(name)
          tally[(severity === 'info' ? 'ok' : severity) as keyof typeof tally]++
        } catch { tally.error++ }
        setBatch(b => b && { ...b, done: b.done + 1 })
      }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL, names.length) }, worker))
    setBatch(undefined)
    const parts = (['ok', 'warn', 'crit', 'unreachable', 'error'] as const).filter(key => tally[key]).map(key => `${key === 'error' ? tr('fleet.inspect.error') : stateLabel(key)} ${tally[key]}`)
    setNotice({ tone: tally.unreachable || tally.error ? 'bad' : 'good', text: tr('fleet.inspected.all', { p0: names.length, p1: parts.join(' · ') }) })
  }
  const info = (name: string) => {
    const host = hosts.find(h => h.name === name)
    if (!host) return ''
    return [`${host.user ? `${host.user}@` : ''}${host.ssh ?? host.name}${host.port && host.port !== 22 ? `:${host.port}` : ''}`, host.probe?.os, `${host.tasks.length}${tr('tasks')}`].filter(Boolean).join(' · ')
  }
  useEffect(() => {
    let alive = true
    void api({ action: 'overview', limit }).then(result => { if (alive) { setData(result as Overview); setError('') } }, () => { if (alive) setError(tr('fleet.error')) })
    return () => { alive = false }
  }, [api, limit, generation, hosts])
  const columns = Math.max(1, ...(data?.hosts.map(h => h.rows.length) ?? [1]))
  const selected = useMemo(() => {
    if (!data) return undefined
    const host = data.hosts.find(h => h.name === picked?.host) ?? data.hosts.find(h => h.latest === 'crit') ?? data.hosts.find(h => h.latest === 'warn') ?? data.hosts.find(h => h.rows.length) ?? data.hosts[0]
    if (!host) return undefined
    const index = picked?.host === host.name && picked.index !== undefined ? picked.index : host.rows.length - 1
    return { host, row: host.rows[index], index }
  }, [data, picked])
  const series = useMemo(() => (selected ? seriesOf(selected.host) : []), [selected])
  const anyHistory = data?.hosts.some(h => h.rows.length) ?? false
  return <section className="wo-fleet" aria-label={tr('fleet.overview')}>
    <div className="wo-fleet-controls">
      <div className="wo-fleet-summary" role="status">{(['ok', 'warn', 'crit', 'unreachable', 'never'] as const).map(state => <span key={state} className={`wo-fleet-count ${state}`}><i className={`wo-dot ${state}`} aria-hidden="true"/>{stateLabel(state)}<strong>{data?.summary[state] ?? '—'}</strong></span>)}</div>
      <div className="wo-fleet-actions"><div className="wo-range" role="group" aria-label={tr('fleet.range', { p0: limit })}>{RANGES.map(n => <button key={n} type="button" className={n === limit ? 'active' : ''} onClick={() => setLimit(n)}>{n}</button>)}</div><button type="button" disabled={!hosts.length || !!batch} onClick={() => void inspectAll()}>{batch ? tr('fleet.inspecting.all', { p0: batch.done, p1: batch.total }) : tr('fleet.inspect.all')}</button></div>
    </div>
    {error && <p role="alert" className="wo-alert">{error}</p>}
    {!data && !error && <div className="wo-empty">{tr('fleet.loading')}</div>}
    {data && !hosts.length && <div className="wo-empty">{tr('add.your.first.server')}</div>}
    {notice && <p role="status" className={notice.tone === 'good' ? 'wo-notice' : 'wo-alert'}>{notice.text}</p>}
    {data && hosts.length > 0 && !anyHistory && <p className="wo-section-note">{tr('fleet.no.history')}</p>}
    {data && hosts.length > 0 && <>
      <p className="wo-section-note">{tr('fleet.matrix.hint')} <span className="wo-muted">{tr('fleet.generated', { p0: date(data.generatedAt) })}</span></p>
      <div className="wo-matrix" role="table" aria-label={tr('fleet.matrix')}>
        {data.hosts.map(host => {
          const latest = host.rows.at(-1)
          const disk = latest && latest.state !== 'unreachable' ? worstDisk(latest) : undefined
          const current = selected?.host.name === host.name
          const job = jobs[host.name]
          const jobLabel = job === 'running' ? tr('fleet.inspecting') : job === 'queued' ? tr('fleet.queued') : tr('fleet.inspect.now')
          return <div role="row" className={`wo-matrix-row${current ? ' current' : ''}`} key={host.name} onClick={e => { if (!(e.target instanceof Element && e.target.closest('button'))) setPicked({ host: host.name }) }}>
            <div role="rowheader" className="wo-matrix-host"><button type="button" className="wo-text-button wo-matrix-name" onClick={() => setPicked({ host: host.name })} aria-pressed={current}><i className={`wo-dot ${host.latest}`} aria-hidden="true"/>{host.name}</button>{host.groups.length > 0 && <small>{host.groups.join(', ')}</small>}</div>
            <div role="cell" className="wo-matrix-mid"><span className="wo-matrix-info" title={info(host.name)}>{info(host.name)}</span><div className="wo-cells" style={{ ['--wo-columns' as string]: columns }}>
              {Array.from({ length: columns - host.rows.length }, (_, i) => <span key={`pad-${i}`} className="wo-cell never" aria-hidden="true"/>)}
              {host.rows.map((row, index) => <button type="button" key={row.at} className={`wo-cell ${row.state}${current && selected?.index === index ? ' picked' : ''}`} title={`${date(row.at)} · ${stateLabel(row.state)}${row.findings.length ? ` · ${row.findings.map(f => f.code).join(', ')}` : ''}`} aria-label={`${host.name} ${date(row.at)} ${stateLabel(row.state)}`} onClick={() => setPicked({ host: host.name, index })}/>)}
            </div></div>
            <div role="cell" className="wo-matrix-latest">{latest ? latest.state === 'unreachable' ? <span className="wo-muted">{tr('fleet.summary.unreachable')}</span> : <>{disk && <span>{tr('fleet.short.disk')} <strong>{disk[1]}%</strong></span>}{latest.memAvailPct !== undefined && <span>{tr('fleet.short.mem')} <strong>{latest.memAvailPct.toFixed(0)}%</strong></span>}</> : <button type="button" className="wo-text-button wo-inspect-now" disabled={!!job} onClick={() => void inspectNow(host.name)}>{jobLabel}</button>}{latest && <button type="button" className="wo-chip" disabled={!!job} title={jobLabel} aria-label={job ? `${host.name} ${jobLabel}` : tr('fleet.inspect.host', { p0: host.name })} onClick={() => void inspectNow(host.name)}>{job ? '…' : '⟳'}</button>}<button type="button" className="wo-chip" onClick={() => onSelectHost(host.name)} aria-label={tr('fleet.open.server')}>↗</button></div>
          </div>
        })}
      </div>
      {selected && <article className="wo-detail wo-fleet-detail">
        <div className="wo-detail-title"><div><span className="wo-eyebrow">{tr('fleet.trends')}</span><h2>{selected.host.name}</h2></div>{selected.row && <span className={`wo-badge ${selected.row.state}`}>{stateLabel(selected.row.state)}</span>}</div>
        {selected.row && <p className="wo-muted">{tr('fleet.inspection.at', { p0: date(selected.row.at) })}</p>}
        {series.length > 0 ? <div className="wo-spark-grid">{series.map(s => <Sparkline key={s.key} series={s}/>)}</div> : <p className="wo-muted">{tr('fleet.one.point')}</p>}
        <div className="wo-section-title"><h3>{tr('fleet.findings')}</h3></div>
        {!selected.row ? <p className="wo-muted">{tr('fleet.summary.never')}</p>
          : selected.row.state === 'unreachable' ? <p className="wo-muted">{tr('fleet.unreachable.row')}</p>
          : selected.row.findings.length === 0 ? <p className="wo-muted">{tr('fleet.no.findings')}</p>
          : <ul className="wo-findings">{selected.row.findings.map((f, i) => <li key={`${f.code}-${i}`}><span className={`wo-badge ${f.severity}`}>{f.severity === 'crit' ? tr('fleet.summary.crit') : tr('fleet.summary.warn')}</span><span className="wo-mono">{f.code}</span><span>{f.message}</span></li>)}</ul>}
      </article>}
    </>}
  </section>
}
