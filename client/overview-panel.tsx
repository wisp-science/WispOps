import { useEffect, useMemo, useRef, useState } from 'react'
import { tr } from './i18n'
import { Hint } from './hint'
import type { Api, Diagnosis, Host, Overview, OverviewHost, OverviewRow, OverviewState } from './contracts'

/** Mirrors src/auto-inspect.ts AUTO_INSPECT_MINUTES; 0 is off. */
const AUTO_MINUTES = [0, 5, 15, 30, 60, 180, 360, 720, 1440]
/** While automatic inspection is on, saved history is reread this often so new runs appear without a click. */
const POLL_MS = 60_000
/** "Inspect all" connects to at most this many servers at once; the rest wait their turn. */
const PARALLEL = 4
const date = (value: string) => new Date(value).toLocaleString()
const clock = (value: string) => {
  const at = new Date(value)
  return at.toDateString() === new Date().toDateString() ? at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : at.toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const ms = (value: number) => (value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`)
const rate = (bps: number) => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let value = bps, unit = 0
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++ }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`
}
const autoLabel = (minutes: number) => (minutes === 0 ? tr('fleet.auto.off') : minutes < 60 ? tr('fleet.auto.minutes', { p0: minutes }) : tr('fleet.auto.hours', { p0: minutes / 60 }))
const stateLabel = (state: OverviewState | 'never') => ({ ok: tr('fleet.summary.ok'), warn: tr('fleet.summary.warn'), crit: tr('fleet.summary.crit'), unreachable: tr('fleet.summary.unreachable'), never: tr('fleet.summary.never') })[state]
/** Why an inspection could not connect, from the runner status saved with it. */
const reasonLabel = (status: string | undefined) => ({ unreachable: tr('fleet.reason.unreachable'), timeout: tr('fleet.reason.timeout'), 'auth-failed': tr('fleet.reason.auth'), blocked: tr('fleet.reason.blocked'), failed: tr('fleet.reason.failed'), 'sudo-required': tr('fleet.reason.sudo'), cancelled: tr('fleet.reason.cancelled') } as Record<string, string>)[status ?? ''] ?? tr('fleet.summary.unreachable')
const reasonText = (row: OverviewRow) => row.findings.find(f => f.code === 'unreachable')?.message ?? ''
const worstDisk = (row: OverviewRow) => Object.entries(row.diskPct).sort((a, b) => b[1] - a[1])[0]

interface InspectResult { status: string; severity: string; findings: number; error: string }
/** Percentages share a fixed 0–100 scale; latency, traffic and connection counts scale to their own peak. */
interface Series { key: string; label: string; values: { at: string; value: number }[]; kind: 'used' | 'available' | 'latency' | 'rate' | 'count' | 'temp'; tone?: 'ok' | 'warn'; note?: { text: string; urgent: boolean } }
const forecastNote = (days: number | undefined) => days === undefined ? undefined : { text: days < 1 ? tr('fleet.forecast.soon') : tr('fleet.forecast', { p0: Math.round(days) }), urgent: days <= 7 }
const percent = (series: Series) => series.kind === 'used' || series.kind === 'available'
const formatValue = (series: Series, value: number) => series.kind === 'latency' ? ms(value) : series.kind === 'rate' ? rate(value) : series.kind === 'count' ? String(Math.round(value)) : series.kind === 'temp' ? `${Math.round(value)}°C` : `${value.toFixed(0)}%`

/** Up to three busiest mounts, memory, CPU and the network, each as a series over the stored inspections. */
function seriesOf(host: OverviewHost): Series[] {
  const rows = host.rows.filter(r => r.state !== 'unreachable')
  const latest = rows.at(-1)
  const mounts = latest ? Object.entries(latest.diskPct).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([mount]) => mount) : []
  const pick = (key: string, label: string, kind: Series['kind'], read: (row: OverviewRow) => number | undefined): Series => ({ key, label, kind, values: rows.flatMap(row => { const value = read(row); return value === undefined ? [] : [{ at: row.at, value }] }) })
  return [
    ...mounts.map(mount => ({ ...pick(`disk:${mount}`, tr('fleet.disk', { p0: mount }), 'used', row => row.diskPct[mount]), note: forecastNote(host.forecast?.[mount]) })),
    pick('mem', tr('fleet.memory'), 'available', row => row.memAvailPct),
    pick('cpu', tr('fleet.cpu'), 'used', row => row.cpuPct),
    pick('gpu-util', tr('fleet.gpu.util'), 'used', row => row.gpuUtilPct),
    pick('gpu-mem', tr('fleet.gpu.mem'), 'used', row => row.gpuMemPct),
    { ...pick('gpu-temp', tr('fleet.gpu.temp'), 'temp', row => row.gpuTempC), tone: latest?.findings.some(f => f.code === 'gpu-hot') ? 'warn' as const : 'ok' as const },
    // The login threshold lives in the server config, so its finding decides the color.
    { ...pick('login', tr('fleet.latency'), 'latency', row => row.loginMs), tone: latest?.findings.some(f => f.code === 'login-slow') ? 'warn' as const : 'ok' as const },
    pick('rx', tr('fleet.rx'), 'rate', row => row.rxBps),
    pick('tx', tr('fleet.tx'), 'rate', row => row.txBps),
    pick('tcp', tr('fleet.tcp'), 'count', row => row.tcpEstablished),
    { ...pick('ssh-fail', tr('fleet.ssh.failures'), 'count', row => row.sshFailures1h), tone: latest?.findings.some(f => f.code === 'ssh-failures') ? 'warn' as const : 'ok' as const },
  ].filter(series => series.values.length > 0)
}

function Sparkline({ series }: { series: Series }) {
  const { values } = series
  const first = values[0]!, last = values.at(-1)!
  const delta = last.value - first.value
  const top = percent(series) ? 100 : Math.max(...values.map(v => v.value)) * 1.15 || 1
  const y = (value: number) => 32 - (Math.min(top, Math.max(0, value)) / top) * 32
  const points = values.map((point, index) => `${values.length === 1 ? 50 : (index / (values.length - 1)) * 100},${y(point.value)}`)
  // Higher used % and lower available % both move the line toward the danger color.
  const danger = series.kind === 'used' ? last.value >= 90 : last.value <= 10
  const caution = series.kind === 'used' ? last.value >= 80 : last.value <= 20
  const tone = percent(series) ? danger ? 'crit' : caution ? 'warn' : 'ok' : series.tone ?? 'plain'
  return <div className={`wo-spark ${tone}`}>
    <div className="wo-spark-head"><span>{series.label}</span><strong>{series.kind === 'used' ? tr('fleet.used', { p0: last.value.toFixed(0) }) : series.kind === 'available' ? tr('fleet.available', { p0: last.value.toFixed(0) }) : formatValue(series, last.value)}</strong></div>
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={`${series.label}: ${values.map(v => formatValue(series, v.value)).join(', ')}`}>
      <line x1="0" y1="16" x2="100" y2="16" className="wo-spark-guide"/>
      {values.length > 1 && <polygon points={`0,32 ${points.join(' ')} 100,32`} className="wo-spark-area"/>}
      {values.length > 1 ? <polyline points={points.join(' ')} className="wo-spark-line" vectorEffect="non-scaling-stroke"/> : <circle cx="50" cy={y(last.value)} r="2" className="wo-spark-dot"/>}
    </svg>
    <small>{values.length < 2 ? tr('fleet.one.point')
      : percent(series) ? tr('fleet.delta', { p0: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`, p1: new Date(first.at).toLocaleDateString() })
      : tr('fleet.delta.value', { p0: `${delta >= 0 ? '+' : '-'}${formatValue(series, Math.abs(delta))}`, p1: new Date(first.at).toLocaleDateString() })}</small>
    {series.note && <small className={`wo-spark-note${series.note.urgent ? ' urgent' : ''}`}>{series.note.text}</small>}
  </div>
}

/** DNS, TCP and the SSH identification line from this machine, without logging in. */
function DiagnoseConnection({ api, host }: { api: Api; host: string }) {
  const [result, setResult] = useState<{ host: string; diagnosis?: Diagnosis; error?: string }>()
  const [running, setRunning] = useState(false)
  async function run() {
    setRunning(true)
    try { setResult({ host, diagnosis: await api({ action: 'diagnoseHost', host }) as Diagnosis }) }
    catch (e) { setResult({ host, error: e instanceof Error ? e.message : String(e) }) }
    finally { setRunning(false) }
  }
  const shown = result?.host === host ? result : undefined
  const stepLabel = (step: Diagnosis['steps'][number], d: Diagnosis) => step.step === 'dns' ? tr('fleet.diag.dns') : step.step === 'tcp' ? tr('fleet.diag.tcp', { p0: `${d.target}:${d.port}` }) : tr('fleet.diag.banner')
  return <div className="wo-diagnose">
    <div className="wo-diagnose-head"><button type="button" className="wo-text-button" disabled={running} onClick={() => void run()}>{running ? tr('fleet.diagnosing') : tr('fleet.diagnose')}</button><Hint text={tr('fleet.diagnose.hint')}/></div>
    {shown?.error && <p role="alert" className="wo-alert">{tr('fleet.diag.failed', { p0: shown.error })}</p>}
    {shown?.diagnosis && <div className="wo-diagnosis" role="status">
      {shown.diagnosis.via === 'proxy-jump' && <p className="wo-muted">{tr('fleet.diag.via.jump', { p0: shown.diagnosis.target })}</p>}
      {shown.diagnosis.steps.length > 0 && <ul>{shown.diagnosis.steps.map(step => <li key={step.step} className={step.ok ? 'ok' : 'bad'}><span aria-hidden="true">{step.ok ? '✓' : '✕'}</span><strong>{stepLabel(step, shown.diagnosis!)}</strong>{step.ms !== undefined && <span className="wo-mono">{ms(step.ms)}</span>}<span className="wo-mono wo-muted">{step.detail}</span></li>)}</ul>}
      <p className={shown.diagnosis.verdict === 'ok' ? 'wo-muted' : 'wo-diagnosis-verdict'}>{({ ok: tr('fleet.diag.verdict.ok'), dns: tr('fleet.diag.verdict.dns'), tcp: tr('fleet.diag.verdict.tcp'), banner: tr('fleet.diag.verdict.banner'), 'proxy-command': tr('fleet.diag.verdict.proxy') })[shown.diagnosis.verdict]}</p>
    </div>}
  </div>
}

/** Reachability over the last day and week, for the line under the network facts. */
function reachFacts(host: OverviewHost): string[] {
  const reach = host.reach ?? {}
  return [
    reach.day === undefined ? undefined : tr('fleet.reach.day', { p0: reach.day }),
    reach.week === undefined ? undefined : tr('fleet.reach.week', { p0: reach.week }),
    reach.loginP95 === undefined ? undefined : tr('fleet.reach.p95', { p0: ms(reach.loginP95) }),
  ].filter((fact): fact is string => fact !== undefined)
}

/** The selected inspection's network facts, for the line under its time. */
function networkFacts(row: OverviewRow): string[] {
  return [
    row.loginMs === undefined ? undefined : tr('fleet.net.login', { p0: ms(row.loginMs) }),
    row.rxBps === undefined ? undefined : tr('fleet.net.rx', { p0: rate(row.rxBps) }),
    row.txBps === undefined ? undefined : tr('fleet.net.tx', { p0: rate(row.txBps) }),
    row.tcpEstablished === undefined ? undefined : tr('fleet.net.tcp', { p0: row.tcpEstablished }),
    row.tcpRetransPct === undefined ? undefined : tr('fleet.net.retrans', { p0: row.tcpRetransPct }),
  ].filter((fact): fact is string => fact !== undefined)
}

export function OverviewPanel({ api, hosts, channels = [], onSelectHost }: { api: Api; hosts: Host[]; channels?: string[]; onSelectHost: (name: string) => void }) {
  const [data, setData] = useState<Overview>()
  const [error, setError] = useState('')
  // A cell is remembered by its time, so it stays picked while polling shifts older inspections out.
  const [picked, setPicked] = useState<{ host: string; at?: string }>()
  const [savingAuto, setSavingAuto] = useState(false)
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
  async function mute(host: string, code: string, subject: string | undefined, choice: string) {
    setNotice(undefined)
    try {
      await api({ action: 'muteFinding', host, code, ...subject === undefined ? {} : { subject }, ...choice === 'forever' ? {} : { days: Number(choice) } })
      setNotice({ tone: 'good', text: tr('mute.done', { p0: subject ? `${code} ${subject}` : code }) }); setGeneration(g => g + 1)
    } catch (e) { setNotice({ tone: 'bad', text: e instanceof Error ? e.message : String(e) }) }
  }
  async function unmute(host: string, code: string, subject: string | undefined) {
    setNotice(undefined)
    try { await api({ action: 'unmuteFinding', host, code, ...subject === undefined ? {} : { subject } }); setNotice({ tone: 'good', text: tr('mute.undone') }); setGeneration(g => g + 1) }
    catch (e) { setNotice({ tone: 'bad', text: e instanceof Error ? e.message : String(e) }) }
  }
  async function setNotify(next: string[]) {
    setNotice(undefined)
    try { await api({ action: 'setAutoNotify', channels: next }); setData(prev => prev && { ...prev, auto: { ...prev.auto, notify: next } }); setGeneration(g => g + 1) }
    catch (e) { setNotice({ tone: 'bad', text: e instanceof Error ? e.message : String(e) }) }
  }
  async function unblock(name: string) {
    setNotice(undefined)
    try { await api({ action: 'unblockHost', host: name }); setNotice({ tone: 'good', text: tr('fleet.unblocked', { p0: name }) }); setGeneration(g => g + 1) }
    catch (e) { setNotice({ tone: 'bad', text: e instanceof Error ? e.message : String(e) }) }
  }
  async function setAuto(minutes: number) {
    setSavingAuto(true); setNotice(undefined)
    try {
      await api({ action: 'setAutoInspect', minutes })
      setData(prev => prev && { ...prev, auto: { ...prev.auto, intervalMinutes: minutes } })
      setGeneration(g => g + 1)
    } catch (e) { setNotice({ tone: 'bad', text: tr('fleet.auto.failed', { p0: e instanceof Error ? e.message : String(e) }) }) }
    finally { setSavingAuto(false) }
  }
  const info = (name: string) => {
    const host = hosts.find(h => h.name === name)
    if (!host) return ''
    return [`${host.user ? `${host.user}@` : ''}${host.ssh ?? host.name}${host.port && host.port !== 22 ? `:${host.port}` : ''}`, host.probe?.os, `${host.tasks.length}${tr('tasks')}`].filter(Boolean).join(' · ')
  }
  useEffect(() => {
    let alive = true
    void api({ action: 'overview' }).then(result => { if (alive) { setData(result as Overview); setError('') } }, () => { if (alive) setError(tr('fleet.error')) })
    return () => { alive = false }
  }, [api, generation, hosts])
  const auto = data?.auto
  const autoOn = (auto?.intervalMinutes ?? 0) > 0
  useEffect(() => {
    if (!autoOn) return
    const timer = setInterval(() => setGeneration(g => g + 1), POLL_MS)
    return () => clearInterval(timer)
  }, [autoOn])
  const autoStatus = !auto || !autoOn ? '' : auto.running ? tr('fleet.auto.running') : auto.nextAt ? tr('fleet.auto.next', { p0: clock(auto.nextAt) }) : ''
  const columns = Math.max(1, ...(data?.hosts.map(h => h.rows.length) ?? [1]))
  const selected = useMemo(() => {
    if (!data) return undefined
    const host = data.hosts.find(h => h.name === picked?.host) ?? data.hosts.find(h => h.latest === 'crit') ?? data.hosts.find(h => h.latest === 'warn') ?? data.hosts.find(h => h.rows.length) ?? data.hosts[0]
    if (!host) return undefined
    const found = picked?.host === host.name && picked.at !== undefined ? host.rows.findIndex(row => row.at === picked.at) : -1
    const index = found === -1 ? host.rows.length - 1 : found
    return { host, row: host.rows[index], index }
  }, [data, picked])
  const series = useMemo(() => (selected ? seriesOf(selected.host) : []), [selected])
  const anyHistory = data?.hosts.some(h => h.rows.length) ?? false
  return <section className="wo-fleet" aria-label={tr('fleet.overview')}>
    <div className="wo-fleet-controls">
      <div className="wo-fleet-lead"><div className="wo-fleet-summary" role="status">{(['ok', 'warn', 'crit', 'unreachable', 'never'] as const).map(state => <span key={state} className={`wo-fleet-count ${state}`}><i className={`wo-dot ${state}`} aria-hidden="true"/>{stateLabel(state)}<strong>{data?.summary[state] ?? '—'}</strong></span>)}</div>{data && <Hint text={<>{tr('fleet.matrix.hint')}<br/>{tr('fleet.generated', { p0: date(data.generatedAt) })}</>}/>}</div>
      <div className="wo-fleet-actions">
        <label className="wo-auto-inspect"><span>{tr('fleet.auto')}</span><select value={auto?.intervalMinutes ?? 0} disabled={!data || savingAuto} onChange={e => void setAuto(Number(e.target.value))}>{AUTO_MINUTES.map(m => <option key={m} value={m}>{autoLabel(m)}</option>)}</select></label>
        <Hint text={tr('fleet.auto.hint')} align="end"/>
        {autoStatus && <small className="wo-auto-status">{autoStatus}</small>}
        {autoOn && auto && <details className="wo-alert-pick"><summary>{tr('fleet.alert')} · {auto.notify.length ? tr('fleet.alert.count', { p0: auto.notify.length }) : tr('fleet.alert.off')}</summary><div className="wo-alert-menu">
          {channels.length ? channels.map(c => <label className="wo-check" key={c}><input type="checkbox" checked={auto.notify.includes(c)} onChange={e => void setNotify(e.target.checked ? [...auto.notify, c] : auto.notify.filter(n => n !== c))}/>{c}</label>) : <p className="wo-muted">{tr('fleet.alert.none')}</p>}
        </div></details>}
        {autoOn && auto?.lastAlert?.failed.length ? <small className="wo-alert-failed">{tr('fleet.alert.failed', { p0: auto.lastAlert.failed.join(', ') })}</small> : null}
        <button type="button" disabled={!hosts.length || !!batch} onClick={() => void inspectAll()}>{batch ? tr('fleet.inspecting.all', { p0: batch.done, p1: batch.total }) : tr('fleet.inspect.all')}</button>
      </div>
    </div>
    {error && <p role="alert" className="wo-alert">{error}</p>}
    {!data && !error && <div className="wo-empty">{tr('fleet.loading')}</div>}
    {data && !hosts.length && <div className="wo-empty">{tr('add.your.first.server')}</div>}
    {notice && <p role="status" className={notice.tone === 'good' ? 'wo-notice' : 'wo-alert'}>{notice.text}</p>}
    {data && hosts.length > 0 && !anyHistory && <p className="wo-section-note">{tr('fleet.no.history')}</p>}
    {data && hosts.length > 0 && <>
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
              {host.rows.map((row, index) => <button type="button" key={row.at} className={`wo-cell ${row.state}${current && selected?.index === index ? ' picked' : ''}`} title={`${date(row.at)} · ${stateLabel(row.state)}${row.findings.length ? ` · ${row.findings.map(f => f.code).join(', ')}` : ''}`} aria-label={`${host.name} ${date(row.at)} ${stateLabel(row.state)}`} onClick={() => setPicked({ host: host.name, at: row.at })}/>)}
            </div></div>
            <div role="cell" className="wo-matrix-latest">{latest ? latest.state === 'unreachable' ? <span className="wo-muted" title={reasonText(latest)}>{data.blocked?.[host.name] ? tr('fleet.reason.blocked') : reasonLabel(latest.status)}</span> : <>{disk && <span>{tr('fleet.short.disk')} <strong>{disk[1]}%</strong></span>}{latest.memAvailPct !== undefined && <span>{tr('fleet.short.mem')} <strong>{latest.memAvailPct.toFixed(0)}%</strong></span>}{latest.loginMs !== undefined && <span>{tr('fleet.short.latency')} <strong>{ms(latest.loginMs)}</strong></span>}</> : <button type="button" className="wo-text-button wo-inspect-now" disabled={!!job} onClick={() => void inspectNow(host.name)}>{jobLabel}</button>}{latest && <button type="button" className="wo-chip" disabled={!!job} title={jobLabel} aria-label={job ? `${host.name} ${jobLabel}` : tr('fleet.inspect.host', { p0: host.name })} onClick={() => void inspectNow(host.name)}>{job ? '…' : '⟳'}</button>}<button type="button" className="wo-chip" onClick={() => onSelectHost(host.name)} aria-label={tr('fleet.open.server')}>↗</button></div>
          </div>
        })}
      </div>
      {selected && <article className="wo-detail wo-fleet-detail">
        <div className="wo-detail-title"><div><span className="wo-eyebrow">{tr('fleet.trends')}</span><h2>{selected.host.name}</h2></div>{selected.row && <span className={`wo-badge ${selected.row.state}`}>{stateLabel(selected.row.state)}</span>}</div>
        {selected.row && <p className="wo-muted">{tr('fleet.inspection.at', { p0: date(selected.row.at) })}</p>}
        {selected.row && networkFacts(selected.row).length > 0 && <p className="wo-net-facts"><strong>{tr('fleet.network')}</strong>{networkFacts(selected.row).map(fact => <span key={fact}>{fact}</span>)}</p>}
        {reachFacts(selected.host).length > 0 && <p className="wo-net-facts"><strong>{tr('fleet.reach')}</strong>{reachFacts(selected.host).map(fact => <span key={fact}>{fact}</span>)}</p>}
        <DiagnoseConnection api={api} host={selected.host.name}/>
        {series.length > 0 ? <div className="wo-spark-grid">{series.map(s => <Sparkline key={s.key} series={s}/>)}</div> : <p className="wo-muted">{tr('fleet.one.point')}</p>}
        <div className="wo-section-title"><h3>{tr('fleet.findings')}<Hint text={tr('mute.hint')}/></h3></div>
        {!selected.row ? <p className="wo-muted">{tr('fleet.summary.never')}</p>
          : selected.row.state === 'unreachable' ? <div className="wo-unreachable">
            <p><strong>{reasonLabel(selected.row.status)}</strong>{reasonText(selected.row) ? <span className="wo-mono">{reasonText(selected.row)}</span> : <span>{tr('fleet.unreachable.row')}</span>}</p>
            {data.blocked?.[selected.host.name] && <p className="wo-blocked">{tr('fleet.blocked.until', { p0: date(data.blocked[selected.host.name]!) })}<button type="button" className="wo-text-button" onClick={() => void unblock(selected.host.name)}>{tr('fleet.unblock')}</button></p>}
          </div>
          : selected.row.findings.length === 0 ? <p className="wo-muted">{tr('fleet.no.findings')}</p>
          : <ul className="wo-findings">{selected.row.findings.map((f, i) => <li key={`${f.code}-${i}`} className={f.mute ? 'muted' : ''}><span className={`wo-badge ${f.mute ? '' : f.severity}`}>{f.mute ? tr('mute.badge') : f.severity === 'crit' ? tr('fleet.summary.crit') : tr('fleet.summary.warn')}</span><span className="wo-mono">{f.code}</span><span>{f.message}{f.mute && <small> · {f.mute.until ? tr('mute.until', { p0: date(f.mute.until) }) : tr('mute.until.unmuted')}</small>}</span>
            {f.mute ? <button type="button" className="wo-text-button" onClick={() => void unmute(selected.host.name, f.code, f.mute?.subject)}>{tr('mute.unmute')}</button>
              : <select className="wo-mute-select" aria-label={tr('mute.select')} value="" onChange={e => void mute(selected.host.name, f.code, f.subject, e.target.value)}><option value="" disabled>{tr('mute.select')}</option><option value="1">{tr('mute.days', { p0: 1 })}</option><option value="7">{tr('mute.days', { p0: 7 })}</option><option value="30">{tr('mute.days', { p0: 30 })}</option><option value="forever">{tr('mute.forever')}</option></select>}</li>)}</ul>}
      </article>}
    </>}
  </section>
}
