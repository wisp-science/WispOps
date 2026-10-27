import { useEffect, useState } from 'react'
import { tr } from './i18n'
import type { Api } from './contracts'
interface UpdateStatus { current: string; latest?: string; available: boolean; state: 'unchecked' | 'no-release' | 'current' | 'available' | 'restart-required' | 'failed'; detail?: string; releaseUrl?: string }

export function UpdatePanel({ api }: { api: Api }) {
  const [value, setValue] = useState<{ automatic: boolean; status: UpdateStatus }>()
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    void api({ action: 'updateStatus' }).then(result => { if (alive) setValue(result) }, () => { if (alive) setError(tr('updates.error')) })
    return () => { alive = false }
  }, [api])
  async function run(action: string, automatic?: boolean) {
    setBusy(true); setError('')
    try { setValue(await api({ action, automatic })) }
    catch { setError(tr('updates.error')) }
    finally { setBusy(false) }
  }
  const statusLabels = { unchecked: tr('updates.unchecked'), 'no-release': tr('updates.no-release'), available: tr('updates.available'), current: tr('updates.up-to-date'), 'restart-required': tr('updates.restart-required'), failed: tr('updates.failed') }
  return <section className="wo-form-body"><h2>{tr('updates.title')}</h2><p>{tr('updates.explanation')}</p>{value && <>
    <p>{tr('updates.current')}: {value.status.current}{value.status.latest && <> · {tr('updates.latest')}: {value.status.latest}</>}</p>
    <p role="status">{statusLabels[value.status.state]}{value.status.detail && <small className="wo-block">{value.status.detail}</small>}</p>
    {value.status.state === 'failed' && <p>{tr('updates.reinstall')} <a href="https://github.com/wisp-science/WispOps" target="_blank" rel="noreferrer">https://github.com/wisp-science/WispOps</a></p>}
    {value.status.releaseUrl && <a href={value.status.releaseUrl} target="_blank" rel="noreferrer">{tr('updates.release')}</a>}
    <label className="wo-check"><input type="checkbox" checked={value.automatic} disabled={busy} onChange={e => void run('updateSettings', e.target.checked)}/>{tr('updates.automatic')}</label>
  </>}
    <div className="wo-form-actions"><button disabled={busy} onClick={() => void run('updateCheck')}>{busy ? tr('updates.working') : tr('updates.check')}</button><button className="wo-primary" disabled={busy || !value?.status.available} onClick={() => void run('updateInstall')}>{tr('updates.install')}</button></div>
    {error && <p role="alert" className="wo-alert">{error}</p>}
  </section>
}
