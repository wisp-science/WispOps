import { useEffect, useState } from 'react'
import { tr } from './i18n'
import type { Api, SshConfigCandidate } from './contracts'

/** Pick literal `Host` aliases from the owner's ssh_config; the page imports and probes the selection. */
export function SshImportForm({ api, busy, submit }: { api: Api; busy: boolean; submit: (aliases: string[]) => Promise<void> }) {
  const [path, setPath] = useState('')
  const [candidates, setCandidates] = useState<SshConfigCandidate[]>()
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    void (api({ action: 'sshConfigHosts' }) as Promise<{ path: string; hosts: SshConfigCandidate[] }>).then(result => {
      if (!alive) return
      setPath(result.path); setCandidates(result.hosts); setSelected(result.hosts.filter(h => !h.existing && !h.excluded).map(h => h.alias))
    }, () => { if (alive) setError(tr('ssh.import.load.failed')) })
    return () => { alive = false }
  }, [api])
  const fresh = candidates?.filter(h => !h.existing && !h.excluded) ?? []
  const toggle = (alias: string, on: boolean) => setSelected(on ? [...new Set([...selected, alias])] : selected.filter(a => a !== alias))
  return <form onSubmit={e => { e.preventDefault(); if (selected.length) void submit(selected) }}><fieldset className="wo-form-body" disabled={busy}>
    <p className="wo-section-note">{tr('ssh.import.hint', { p0: path || '~/.ssh/config' })}</p>
    {error && <p role="alert" className="wo-alert">{error}</p>}
    {candidates === undefined && !error && <div className="wo-empty">{tr('loading')}</div>}
    {candidates !== undefined && !candidates.length && <div className="wo-empty">{tr('ssh.import.empty')}</div>}
    {candidates !== undefined && candidates.length > 0 && <>
      <div className="wo-import-list">{candidates.map(h => <label key={h.alias} className={h.existing || h.excluded ? 'is-existing' : ''}>
        <input type="checkbox" disabled={h.existing || h.excluded} checked={!h.existing && !h.excluded && selected.includes(h.alias)} onChange={e => toggle(h.alias, e.target.checked)}/>
        <span><strong>{h.name}</strong>{h.name !== h.alias && <small className="wo-mono"> ({h.alias})</small>}<span className="wo-mono wo-block">{h.target}</span></span>
        {(h.existing || h.excluded) && <small className="wo-muted">{tr(h.excluded ? 'ssh.import.excluded' : 'ssh.import.existing')}</small>}
      </label>)}</div>
      <div className="wo-form-actions">
        <button type="button" disabled={!fresh.length} onClick={() => setSelected(fresh.map(h => h.alias))}>{tr('ssh.import.select.all')}</button>
        <button className="wo-primary" disabled={!selected.length}>{busy ? tr('ssh.import.probing') : tr('ssh.import.submit', { p0: selected.length })}</button>
      </div>
    </>}
  </fieldset></form>
}
