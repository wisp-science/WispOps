import { tr } from './i18n'
import { useRef, useState } from 'react'
import type { Api } from './contracts'

interface Preview { automatedCredentials?: string[]; sudoTasks?: { name: string; targets: string }[]; bindings?: { host: string; auth: string; loginSecret?: string; sudoSecret?: string }[]; token: string; at: string; incoming: Record<string, number>; local: Record<string, number>; conflicts: string[]; hostNames: string[]; credentialNames: string[]; policies: { host: string; policy: Record<string, string> }[] }
export function SyncPanel({ api, onImported }: { api: Api; onImported: () => Promise<void> }) {
  const form = useRef<HTMLFormElement>(null)
  const [snapshots, setSnapshots] = useState<string[]>([])
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
      if (action === 'syncList') { setSnapshots(result.snapshots); setSelected(result.snapshots[0] ?? ''); setPreview(undefined) }
      if (action === 'syncPreview') setPreview(result)
      if (action === 'syncPush') setMessage(tr("encrypted.snapshot.uploaded", { p0: result.name }))
      if (action === 'syncPull') { setPreview(undefined); setMessage(tr("imported.schedules.remain.disabled.local.encrypted", { p0: result.backup })); await onImported() }
    } catch (e) { setError(e instanceof Error ? e.message : tr("sync.failed.please.retry")) }
    finally { setBusy(false) }
  }
  return <form ref={form} onSubmit={e => e.preventDefault()} autoComplete="off" onChange={() => setPreview(undefined)}>
    <fieldset className="wo-form-body" disabled={busy}>
      <h2>{tr("encrypted.device.sync.webdav")}</h2>
      <p>{tr("connect.with.a.nutstore.application.password")}</p>
      <label className="wo-field"><span>{tr("webdav.folder.url")}</span><input name="url" type="url" required defaultValue="https://dav.jianguoyun.com/dav/WispOps/"/></label>
      <label className="wo-field"><span>{tr("nutstore.account.webdav.username")}</span><input name="username" required autoComplete="off"/></label>
      <label className="wo-field"><span>{tr("webdav.application.password")}</span><input name="password" type="password" required autoComplete="new-password"/></label>
      <label className="wo-field"><span>{tr("independent.sync.passphrase.at.least.12")}</span><input name="passphrase" type="password" required minLength={12} maxLength={1024} autoComplete="new-password"/></label>
      <label className="wo-check"><input name="includeKeys" type="checkbox"/>{tr("include.ssh.private.keys.referenced.by")}</label>
      <p className="wo-muted">{tr("sync.includes.the.local.vault.panel")}</p>
      <div className="wo-form-actions"><button type="button" onClick={() => void run('syncPush')}>{tr("upload.a.new.encrypted.snapshot")}</button><button type="button" onClick={() => void run('syncList')}>{tr("list.cloud.snapshots")}</button></div>
      {!!snapshots.length && <><label className="wo-field"><span>{tr("choose.a.cloud.version")}</span><select value={selected} onChange={e => setSelected(e.target.value)}>{snapshots.map(name => <option key={name} value={name}>{name.replace(/^wispops-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\d{3}Z-(.{8}).*$/, '$1-$2-$3 $4:$5:$6 UTC · $7')}</option>)}</select></label><button type="button" onClick={() => void run('syncPreview')}>{tr("decrypt.and.preview.import")}</button></>}
      {preview && <div className="wo-draft-evidence"><h3>{tr("import.preview")}</h3><p>{preview.at}</p><p>{tr("import.replaces.this.device.s.panel")}</p><dl className="wo-facts">{Object.entries(preview.incoming).map(([key, count]) => <div key={key}><dt>{({ hosts: tr("servers.2"), credentials: tr("credentials.2"), tasks: tr("tasks.2"), templates: tr("templates"), keys: tr("ssh.private.keys") } as Record<string, string>)[key]}</dt><dd>{preview.local[key] ?? '—'} → {count}</dd></div>)}</dl><p>{tr("server")}{preview.hostNames.join(', ')}</p><p>{tr("credentials.3")}{preview.credentialNames.join(', ')}</p>{!!preview.conflicts.length && <p className="wo-alert">{tr("credentials.with.these.names.will.be")}{preview.conflicts.join(', ')}</p>}<p>{tr("sync.automation.credentials", { p0: preview.automatedCredentials?.join(", ") || "—" })}</p>{preview.sudoTasks?.map(t => <p key={t.name}>{tr("sync.sudo.task", { p0: t.name, p1: t.targets })}</p>)}{!!preview.bindings?.length && <><p>{tr("sync.bindings.include.config.hosts")}</p>{preview.bindings.map(b => <p key={b.host}>{tr("sync.binding", { p0: b.host, p1: b.auth, p2: b.loginSecret || "—", p3: b.sudoSecret || "—" })}</p>)}</>}{preview.policies.map(p => <p key={p.host}>{p.host}: {JSON.stringify(p.policy)}</p>)}<button type="button" className="wo-danger" onClick={() => void run('syncPull')}>{tr("confirm.replacement.of.local.data")}</button></div>}
      {busy && <p role="status">{tr("syncing")}</p>}{message && <p role="status">{message}</p>}{error && <p role="alert" className="wo-alert">{error}</p>}
    </fieldset>
  </form>
}
