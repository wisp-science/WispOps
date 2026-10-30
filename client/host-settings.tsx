import { useState } from 'react'
import type { FormEvent } from 'react'
import { tr } from './i18n'
import type { UiKey } from './i18n'
import type { Host, ServiceCheck } from './contracts'

type CheckKind = ServiceCheck['kind']
const KINDS: CheckKind[] = ['unit', 'port', 'http']
const PLACEHOLDER: Record<CheckKind, string> = { unit: 'nginx.service', port: '443', http: 'http://127.0.0.1:8080/health' }
export const describeCheck = (check: ServiceCheck) => check.kind === 'unit' ? check.name : check.kind === 'port' ? String(check.port) : check.url
export const checkKindLabel = (kind: CheckKind) => ({ unit: tr('check.kind.unit'), port: tr('check.kind.port'), http: tr('check.kind.http') })[kind]

/** Owner-listed things that must be up on one server; checked read-only during each inspection. */
export function ServiceChecksForm({ host, busy, submit }: { host: Host; busy: boolean; submit: (checks: ServiceCheck[]) => Promise<void> }) {
  const [rows, setRows] = useState<{ kind: CheckKind; value: string }[]>(host.serviceChecks?.map(c => ({ kind: c.kind, value: describeCheck(c) })) ?? [])
  const [error, setError] = useState('')
  const update = (index: number, change: Partial<{ kind: CheckKind; value: string }>) => setRows(rows.map((row, i) => i === index ? { ...row, ...change } : row))
  function save(e: FormEvent) {
    e.preventDefault()
    const filled = rows.map(r => ({ ...r, value: r.value.trim() })).filter(r => r.value)
    const bad = filled.find(r => r.kind === 'port' ? !/^\d{1,5}$/.test(r.value) || Number(r.value) < 1 || Number(r.value) > 65535 : r.kind === 'http' ? !/^https?:\/\/\S+$/.test(r.value) : !/^[A-Za-z0-9][A-Za-z0-9@._:-]*$/.test(r.value))
    if (bad) { setError(tr('checks.invalid', { p0: bad.value })); return }
    void submit(filled.map(r => r.kind === 'unit' ? { kind: 'unit', name: r.value } : r.kind === 'port' ? { kind: 'port', port: Number(r.value) } : { kind: 'http', url: r.value }))
  }
  return <form onSubmit={save}><fieldset className="wo-form-body" disabled={busy}>
    {error && <p role="alert" className="wo-alert">{error}</p>}
    {rows.length === 0 && <p className="wo-muted">{tr('checks.none')}</p>}
    <div className="wo-check-rows">{rows.map((row, i) => <div className="wo-check-row" key={i}>
      <select aria-label={tr('checks.kind')} value={row.kind} onChange={e => update(i, { kind: e.target.value as CheckKind })}>{KINDS.map(k => <option key={k} value={k}>{checkKindLabel(k)}</option>)}</select>
      <input aria-label={checkKindLabel(row.kind)} value={row.value} placeholder={PLACEHOLDER[row.kind]} onChange={e => update(i, { value: e.target.value })} className="wo-mono"/>
      <button type="button" className="wo-icon-button" aria-label={tr('checks.remove')} onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
    </div>)}</div>
    <button type="button" className="wo-text-button" disabled={rows.length >= 20} onClick={() => setRows([...rows, { kind: 'unit', value: '' }])}>{tr('checks.add')}</button>
    <div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? tr('saving') : tr('checks.save')}</button></div>
  </fieldset></form>
}

/** Thresholds in the order the form shows them. */
export const THRESHOLD_KEYS = ['diskWarnPct', 'diskCritPct', 'diskGrowthWarnPts', 'diskFullForecastDays', 'inodeWarnPct', 'inodeCritPct', 'memAvailWarnPct', 'memAvailCritPct', 'swapWarnPct', 'loadPerCoreWarn', 'loadPerCoreCrit', 'gpuTempWarnC', 'zombieWarn', 'loginWarnMs', 'tcpRetransWarnPct', 'sshFailWarnPerHour'] as const
export const thresholdLabel = (key: string) => tr(`threshold.${key}` as UiKey)

/** Per-server overrides of the inspection thresholds; a blank field keeps the configured value. */
export function ThresholdsForm({ host, defaults, busy, submit }: { host: Host; defaults: Record<string, number>; busy: boolean; submit: (thresholds: Record<string, number>) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(THRESHOLD_KEYS.map(key => [key, host.thresholdOverride?.[key] === undefined ? '' : String(host.thresholdOverride[key])])))
  function save(e: FormEvent) {
    e.preventDefault()
    void submit(Object.fromEntries(THRESHOLD_KEYS.filter(key => values[key]!.trim() !== '').map(key => [key, Number(values[key])])))
  }
  return <form onSubmit={save}><fieldset className="wo-form-body" disabled={busy}>
    <div className="wo-form-grid">{THRESHOLD_KEYS.map(key => <label className="wo-field" key={key}><span>{thresholdLabel(key)}</span>
      <input type="number" min={0} step="any" value={values[key]} placeholder={defaults[key] === undefined ? '' : String(defaults[key])} onChange={e => setValues({ ...values, [key]: e.target.value })}/>
    </label>)}</div>
    <div className="wo-form-actions"><button type="button" disabled={busy} onClick={() => setValues(Object.fromEntries(THRESHOLD_KEYS.map(key => [key, ''])))}>{tr('thresholds.reset')}</button><button className="wo-primary" disabled={busy}>{busy ? tr('saving') : tr('thresholds.save')}</button></div>
  </fieldset></form>
}
