import { useEffect, useState } from 'react'
import { tr, useLocale } from './i18n'
import type { Api, AuditLog, Host } from './contracts'

const WINDOWS: [number, () => string][] = [[24, () => tr('audit.window.day')], [24 * 7, () => tr('audit.window.week')], [24 * 30, () => tr('audit.window.month')], [24 * 365, () => tr('audit.window.year')]]
const LIMITS = [50, 100, 200, 500]
const FAILED = new Set(['failed', 'unreachable', 'auth-failed', 'blocked', 'sudo-required', 'timeout', 'cancelled'])

/** The operation audit the model also sees through ops_history, filtered by server and window; read-only. */
export function AuditPanel({ api, hosts, host, onHost }: { api: Api; hosts: Host[]; host: string; onHost: (name: string) => void }) {
  useLocale()
  const [hours, setHours] = useState(24 * 30)
  const [limit, setLimit] = useState(100)
  const [data, setData] = useState<AuditLog>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    setLoading(true); setError('')
    void (api({ action: 'auditLog', host, sinceHours: hours, limit }) as Promise<AuditLog>)
      .then(result => { if (alive) setData(result) }, () => { if (alive) setError(tr('audit.load.failed')) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [api, host, hours, limit])
  const rows = [...(data?.rows ?? [])].reverse()
  return <section className="wo-audit" aria-busy={loading}>
    <header className="wo-updates-heading"><h2>{tr('audit.log')}</h2><p>{tr('audit.subtitle')}</p></header>
    <div className="wo-audit-controls">
      <label>{tr('audit.host')}<select value={host} onChange={e => onHost(e.target.value)}><option value="">{tr('audit.all.servers')}</option>{hosts.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}</select></label>
      <label>{tr('audit.window')}<select value={hours} onChange={e => setHours(Number(e.target.value))}>{WINDOWS.map(([value, label]) => <option key={value} value={value}>{label()}</option>)}</select></label>
      <label>{tr('audit.limit')}<select value={limit} onChange={e => setLimit(Number(e.target.value))}>{LIMITS.map(n => <option key={n} value={n}>{n}</option>)}</select></label>
    </div>
    {error && <p role="alert" className="wo-alert">{error}</p>}
    {loading && !data ? <div className="wo-empty">{tr('loading')}</div> : !rows.length ? <div className="wo-empty">{tr('audit.empty')}</div> : <div className="wo-audit-scroll"><table className="wo-audit-table">
      <thead><tr><th>{tr('audit.time')}</th><th>{tr('audit.host')}</th><th>{tr('audit.tool')}</th><th>{tr('audit.risk')}</th><th>{tr('audit.authorization')}</th><th>{tr('audit.status')}</th><th>{tr('audit.command')}</th></tr></thead>
      <tbody>{rows.map((row, index) => <tr key={`${row.at}-${row.host}-${index}`}>
        <td>{new Date(row.at).toLocaleString()}</td>
        <td><button type="button" className="wo-text-button" onClick={() => onHost(row.host)}>{row.host}</button></td>
        <td className="wo-mono">{row.tool}</td>
        <td>{row.risk}{row.sudo ? ' + sudo' : ''}</td>
        <td>{row.authorization}</td>
        <td className={`wo-audit-status ${FAILED.has(row.status) ? 'bad' : 'ok'}`}>{row.status}{row.exitCode === null ? '' : `/${row.exitCode}`}<small>{(row.durationMs / 1000).toFixed(1)}s</small></td>
        <td className="wo-audit-command wo-mono">{row.command}{row.reason && <small>{tr('audit.reason', { p0: row.reason })}</small>}</td>
      </tr>)}</tbody>
    </table></div>}
    <p className="wo-muted">{data === undefined ? '' : data.retentionMonths > 0 ? tr('audit.retention', { p0: data.retentionMonths }) : tr('audit.retention.unlimited')}</p>
  </section>
}
