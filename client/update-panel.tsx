import { useEffect, useId, useState } from 'react'
import { tr, useLocale } from './i18n'
import { PanelIcon as UpdateIcon } from './panel-icon'
import type { Api } from './contracts'
interface UpdateStatus { current: string; latest?: string; available: boolean; state: 'unchecked' | 'no-release' | 'current' | 'available' | 'restart-required' | 'failed'; detail?: string; releaseUrl?: string }

export function UpdatePanel({ api }: { api: Api }) {
  useLocale()
  const automaticId = useId()
  const [value, setValue] = useState<{ automatic: boolean; status: UpdateStatus }>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    setLoading(true)
    void api({ action: 'updateStatus' }).then(result => { if (alive) setValue(result) }, () => { if (alive) setError(tr('updates.error')) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [api])
  async function run(action: string, automatic?: boolean) {
    setBusy(action); setError('')
    try { setValue(await api({ action, automatic })) }
    catch { setError(tr('updates.error')) }
    finally { setBusy(null) }
  }
  const statusLabels = { unchecked: tr('updates.unchecked'), 'no-release': tr('updates.no-release'), available: tr('updates.available'), current: tr('updates.up-to-date'), 'restart-required': tr('updates.restart-required'), failed: tr('updates.failed') }
  const hints = { unchecked: tr('updates.hint.unchecked'), 'no-release': tr('updates.hint.no-release'), available: tr('updates.hint.available'), current: tr('updates.hint.current'), 'restart-required': tr('updates.hint.restart'), failed: tr('updates.hint.failed') }
  const state = value?.status.state ?? 'unchecked'
  const tone = state === 'current' ? 'good' : state === 'failed' ? 'warn' : state === 'available' || state === 'restart-required' ? 'accent' : 'neutral'
  const icon = state === 'current' ? 'check' : state === 'failed' ? 'alert' : state === 'available' ? 'download' : state === 'restart-required' ? 'refresh' : 'clock'
  const disabled = loading || busy !== null
  return <section className="wo-updates">
    <header className="wo-updates-heading"><h2>{tr('updates.title')}</h2><p>{tr('updates.subtitle')}</p></header>
    <div className="wo-update-card" aria-busy={loading || busy === 'updateCheck' || busy === 'updateInstall'}>
      <div className="wo-update-versions">
        <div className="wo-update-current"><span className="wo-update-brand" aria-hidden="true">W</span><div><span className="wo-update-label">{tr('updates.current')}</span><strong className="wo-update-version">{value?.status.current ?? '—'}</strong></div></div>
        <div className="wo-update-latest"><span className="wo-update-label">{tr('updates.latest')}</span>{value?.status.latest ? <strong>{value.status.latest}</strong> : <span className="wo-update-pending">{tr('updates.version.pending')}</span>}</div>
      </div>
      <div className={`wo-update-status ${tone}`} role="status">
        <span className="wo-update-status-icon"><UpdateIcon kind={icon}/></span>
        <div><strong>{loading ? tr('updates.loading') : value ? statusLabels[state] : tr('updates.unavailable')}</strong><p>{loading ? tr('updates.loading.hint') : value ? hints[state] : tr('updates.hint.failed')}</p></div>
      </div>
      {value?.status.detail && <p className="wo-update-detail">{value.status.detail}</p>}
      <div className="wo-update-actions">
        {value?.status.releaseUrl && <a className="wo-update-release" href={value.status.releaseUrl} target="_blank" rel="noreferrer">{tr('updates.release')}<UpdateIcon kind="external"/></a>}
        <div className="wo-update-buttons">
          <button type="button" className={!value?.status.available ? 'wo-primary' : ''} disabled={disabled} onClick={() => void run('updateCheck')}><UpdateIcon kind="refresh"/>{busy === 'updateCheck' ? tr('updates.checking') : tr('updates.check')}</button>
          <button type="button" className={value?.status.available ? 'wo-primary' : ''} disabled={disabled || !value?.status.available} onClick={() => void run('updateInstall')}><UpdateIcon kind="download"/>{busy === 'updateInstall' ? tr('updates.installing') : tr('updates.install')}</button>
        </div>
      </div>
    </div>
    <div className="wo-update-preference" aria-busy={busy === 'updateSettings'}>
      <div><label htmlFor={automaticId}>{tr('updates.automatic')}</label><p id={`${automaticId}-hint`}>{tr('updates.automatic.hint')}</p></div>
      <input className="wo-update-switch" id={automaticId} type="checkbox" role="switch" aria-describedby={`${automaticId}-hint`} checked={value?.automatic ?? false} disabled={disabled || !value} onChange={e => void run('updateSettings', e.target.checked)}/>
    </div>
    <p className="wo-update-note"><UpdateIcon kind="info"/><span>{tr('updates.explanation')}</span></p>
    {state === 'failed' && <div className="wo-update-recovery"><p>{tr('updates.reinstall')}</p><a href="https://github.com/wisp-science/WispOps" target="_blank" rel="noreferrer">https://github.com/wisp-science/WispOps<UpdateIcon kind="external"/></a></div>}
    {error && <p role="alert" className="wo-alert">{error}</p>}
  </section>
}
