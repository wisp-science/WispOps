import { tr, useLocale } from './i18n'
import { useRef, useState } from 'react'
import type { Api } from './contracts'
import { PanelIcon } from './panel-icon'

interface Preview { excludedHosts?: string[]; localExcludedHosts?: string[]; automatedCredentials?: string[]; sudoTasks?: { name: string; targets: string }[]; bindings?: { host: string; auth: string; loginSecret?: string; sudoSecret?: string }[]; token: string; at: string; incoming: Record<string, number>; local: Record<string, number>; conflicts: string[]; hostNames: string[]; credentialNames: string[]; policies: { host: string; policy: Record<string, string> }[] }
export function SyncPanel({ api, onImported }: { api: Api; onImported: () => Promise<void> }) {
  useLocale()
  const form = useRef<HTMLFormElement>(null)
  const [snapshots, setSnapshots] = useState<string[]>([])
  const [listed, setListed] = useState(false)
  const [selected, setSelected] = useState('')
  const [preview, setPreview] = useState<Preview>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function run(action: string) {
    if (busy || !form.current?.reportValidity()) return
    const data = new FormData(form.current)
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api({ action, webdav: { url: data.get('url'), username: data.get('username'), password: data.get('password') }, passphrase: data.get('passphrase'), includeKeys: data.has('includeKeys'), name: selected, token: preview?.token })
      if (action === 'syncList') { setSnapshots(result.snapshots); setSelected(result.snapshots[0] ?? ''); setPreview(undefined); setListed(true) }
      if (action === 'syncPreview') setPreview(result)
      if (action === 'syncPush') setMessage(tr("encrypted.snapshot.uploaded", { p0: result.name }))
      if (action === 'syncPull') { setPreview(undefined); setMessage(tr("imported.schedules.remain.disabled.local.encrypted", { p0: result.backup })); await onImported() }
    } catch (e) { setError(e instanceof Error ? e.message : tr("sync.failed.please.retry")) }
    finally { setBusy(false) }
  }
  return <form className="wo-sync" ref={form} onSubmit={e => e.preventDefault()} autoComplete="off" onChange={() => setPreview(undefined)}>
    <fieldset className="wo-form-body" disabled={busy}>
      <header className="wo-sync-heading"><div><h2>{tr("device.sync")}</h2><p>{tr('sync.subtitle')}</p></div><span className="wo-sync-encrypted"><PanelIcon kind="lock"/>{tr('sync.encrypted')}</span></header>
      <div className="wo-sync-grid">
        <section className="wo-sync-card">
          <div className="wo-sync-card-heading"><span className="wo-sync-symbol"><PanelIcon kind="cloud"/></span><div><h3>{tr('sync.connection.title')}</h3><p>{tr('sync.connection.hint')}</p></div></div>
          <label className="wo-field"><span>{tr("webdav.folder.url")}</span><input name="url" type="url" required defaultValue="https://dav.jianguoyun.com/dav/WispOps/" spellCheck={false}/></label>
          <label className="wo-field"><span>{tr("nutstore.account.webdav.username")}</span><input name="username" required autoComplete="off" spellCheck={false}/></label>
          <label className="wo-field"><span>{tr("webdav.application.password")}</span><input name="password" type="password" required autoComplete="new-password"/></label>
        </section>
        <section className="wo-sync-card">
          <div className="wo-sync-card-heading"><span className="wo-sync-symbol"><PanelIcon kind="lock"/></span><div><h3>{tr('sync.encryption.title')}</h3><p>{tr('sync.encryption.hint')}</p></div></div>
          <label className="wo-field"><span>{tr("independent.sync.passphrase.at.least.12")}</span><input name="passphrase" type="password" required minLength={12} maxLength={1024} autoComplete="new-password"/></label>
          <p className="wo-sync-passphrase-note"><PanelIcon kind="info"/><span>{tr('sync.passphrase.hint')}</span></p>
          <label className="wo-sync-key-option"><input name="includeKeys" type="checkbox"/><span><strong>{tr('sync.include.keys')}</strong><small>{tr('include.ssh.private.keys.referenced.by')}</small></span></label>
        </section>
      </div>
      <p className="wo-sync-scope"><PanelIcon kind="info"/><span>{tr("sync.includes.the.local.vault.panel")}</span></p>
      <div className="wo-sync-transfer">
        <div><h3>{tr('sync.upload.title')}</h3><p>{tr('sync.upload.hint')}</p><button type="button" className="wo-primary" onClick={() => void run('syncPush')}><PanelIcon kind="upload"/>{tr("upload.a.new.encrypted.snapshot")}</button></div>
        <div><h3>{tr('sync.download.title')}</h3><p>{tr('sync.download.hint')}</p><button type="button" onClick={() => void run('syncList')}><PanelIcon kind="download"/>{tr("list.cloud.snapshots")}</button></div>
      </div>
      {busy && <p role="status" className="wo-sync-progress">{tr("syncing")}</p>}{message && <p role="status" className="wo-notice">{message}</p>}{error && <p role="alert" className="wo-alert">{error}</p>}
      {listed && <section className="wo-sync-card wo-sync-cloud">
        <div className="wo-sync-card-heading"><span className="wo-sync-symbol"><PanelIcon kind="cloud"/></span><div><h3>{tr('sync.cloud.title')}</h3><p>{tr('sync.cloud.hint')}</p></div></div>
        {snapshots.length ? <div className="wo-sync-cloud-picker"><label className="wo-field"><span>{tr("choose.a.cloud.version")}</span><select value={selected} onChange={e => setSelected(e.target.value)}>{snapshots.map(name => <option key={name} value={name}>{name.replace(/^wispops-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\d{3}Z-(.{8}).*$/, '$1-$2-$3 $4:$5:$6 UTC · $7')}</option>)}</select></label><button type="button" onClick={() => void run('syncPreview')}>{tr("decrypt.and.preview.import")}</button></div> : <p className="wo-sync-cloud-empty" role="status">{tr('sync.cloud.empty')}</p>}
      </section>}
      {preview && <section className="wo-sync-card wo-sync-preview">
        <div className="wo-sync-preview-heading"><h3>{tr("import.preview")}</h3><time dateTime={preview.at}>{new Date(preview.at).toLocaleString()}</time></div>
        <p className="wo-sync-replace-note">{tr("import.replaces.this.device.s.panel")}</p>
        <p className="wo-sync-count-caption">{tr('sync.preview.counts')}</p>
        <dl className="wo-sync-counts">{Object.entries(preview.incoming).map(([key, count]) => <div key={key}><dt>{({ excludedHosts: tr("removed.servers"), hosts: tr("servers.2"), credentials: tr("credentials.2"), tasks: tr("tasks.2"), templates: tr("templates"), keys: tr("ssh.private.keys") } as Record<string, string>)[key] ?? key}</dt><dd><span>{preview.local[key] ?? '—'}</span><span aria-hidden="true">→</span><strong>{count}</strong></dd></div>)}</dl>
        <div className="wo-sync-preview-details"><p>{tr("sync.removed.servers", { p0: preview.localExcludedHosts?.join(", ") || "—", p1: preview.excludedHosts?.join(", ") || "—" })}</p><p>{tr("server")}{preview.hostNames.join(', ')}</p><p>{tr("credentials.3")}{preview.credentialNames.join(', ')}</p>{!!preview.conflicts.length && <p className="wo-alert">{tr("credentials.with.these.names.will.be")}{preview.conflicts.join(', ')}</p>}<p>{tr("sync.automation.credentials", { p0: preview.automatedCredentials?.join(", ") || "—" })}</p>{preview.sudoTasks?.map(t => <p key={t.name}>{tr("sync.sudo.task", { p0: t.name, p1: t.targets })}</p>)}{!!preview.bindings?.length && <><p>{tr("sync.bindings.include.config.hosts")}</p>{preview.bindings.map(b => <p key={b.host}>{tr("sync.binding", { p0: b.host, p1: b.auth, p2: b.loginSecret || "—", p3: b.sudoSecret || "—" })}</p>)}</>}{preview.policies.map(p => <p key={p.host}>{p.host}: {JSON.stringify(p.policy)}</p>)}</div>
        <div className="wo-sync-confirm"><button type="button" className="wo-danger" onClick={() => void run('syncPull')}>{tr("confirm.replacement.of.local.data")}</button></div>
      </section>}
    </fieldset>
  </form>
}
