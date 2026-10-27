import { tr } from './i18n'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Credential, Host, Snapshot } from './contracts'

type Role = 'login' | 'sudo'
export interface CredentialAssociation { host: string; login: boolean; sudo: boolean }
export function credentialRoles(host: Host, name: string) {
  return (['login', 'sudo'] as const).filter(role => host.credentials[role]?.provider === 'local' && host.credentials[role]?.name === name)
}

export function CredentialForm({ data, entry, hostName, role = 'login', submit, addHost, busy }: {
  data: Snapshot; entry?: Credential; hostName?: string; role?: Role; busy: boolean
  submit: (value: Record<string, unknown>, associations: CredentialAssociation[]) => Promise<void>
  addHost: () => void
}) {
  const password = useRef<HTMLInputElement>(null)
  const nameTouched = useRef(false), usernameTouched = useRef(false)
  const initial = data.hosts.map(host => ({ host: host.name,
    login: entry ? credentialRoles(host, entry.name).includes('login') : host.name === hostName && role === 'login',
    sudo: entry ? credentialRoles(host, entry.name).includes('sudo') : host.name === hostName && role === 'sudo',
  }))
  const [links, setLinks] = useState(initial)
  function suggestedName(rows: CredentialAssociation[]) {
    const first = rows.find(row => row.login || row.sudo)
    if (!first) return ''
    const base = `${first.host.slice(0, 80)}-${first.login ? 'ssh' : 'sudo'}`
    let result = base, n = 2
    while (data.vault.entries.some(e => e.name === result)) result = `${base}-${n++}`
    return result
  }
  const [name, setName] = useState(entry?.name ?? suggestedName(initial))
  const [username, setUsername] = useState(entry?.username ?? data.hosts.find(h => h.name === hostName)?.user ?? '')
  const selected = links.filter(row => row.login || row.sudo)
  function toggle(host: string, role: Role, checked: boolean) {
    const next = links.map(row => row.host === host ? { ...row, [role]: checked } : row)
    setLinks(next)
    if (!entry && !nameTouched.current) setName(suggestedName(next))
    if (!entry && !usernameTouched.current) setUsername(data.hosts.find(h => h.name === next.find(r => r.login || r.sudo)?.host)?.user ?? '')
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!entry && !selected.length) return
    const f = new FormData(e.currentTarget)
    const value = { name, username, note: f.get('note'), agent: f.has('agent'), ...(f.get('password') ? { password: f.get('password') } : {}) }
    // Keep plaintext out of React state and clear the input even when saving fails.
    if (password.current) password.current.value = ''
    void submit(value, selected)
  }
  const changes = data.hosts.flatMap(host => {
    const row = links.find(r => r.host === host.name)!
    const own = entry ? credentialRoles(host, entry.name) : []
    const notes: string[] = []
    for (const role of ['login', 'sudo'] as const) {
      const current = host.credentials[role]
      if (row[role] && !own.includes(role)) {
        if (current) notes.push(tr("the.credential.will.replace", { p0: host.name, p1: role === 'login' ? 'SSH' : 'sudo', p2: current.name }))
        if (role === 'login' && host.auth !== 'password') notes.push(tr("ssh.will.switch.to.password.authentication", { p0: host.name }))
      } else if (!row[role] && own.includes(role)) {
        notes.push(tr("unlink", { p0: host.name, p1: role === 'login' ? 'SSH' : 'sudo', p2: role === 'login' && host.auth === 'password' ? tr("and.use.ssh.keys.configuration") : '' }))
      }
    }
    return notes
  })
  return <form onSubmit={save} autoComplete="off"><fieldset className="wo-form-body" disabled={busy}>
    <fieldset className="wo-credential-picks"><legend>{tr("link.servers.and.purposes")}</legend>
      <p>{tr("choose.the.servers.that.use.this")}</p>
      <div className="wo-credential-pick-list">{[...data.hosts].sort((a, b) => Number(b.name === hostName) - Number(a.name === hostName)).map(host => {
        const row = links.find(r => r.host === host.name)!
        return <div className="wo-credential-pick" key={host.name}>
          <div><strong>{host.name}</strong><small>{host.user ? `${host.user}@` : ''}{host.ssh ?? host.name}</small></div>
          <label className="wo-check"><input type="checkbox" aria-label={tr("ssh.login.3", { p0: host.name })} checked={row.login} onChange={e => toggle(host.name, 'login', e.target.checked)}/>{tr("ssh.login")}</label>
          <label className="wo-check"><input type="checkbox" aria-label={tr("sudo.elevation.2", { p0: host.name })} checked={row.sudo} onChange={e => toggle(host.name, 'sudo', e.target.checked)}/>{tr("sudo.elevation")}</label>
        </div>
      })}</div>
      {!data.hosts.length && <p>{tr("no.servers.yet")}<button type="button" onClick={addHost}>{tr("add.server")}</button></p>}
      <small>{selected.length ? tr("servers.selected", { p0: selected.length }) : entry ? tr("no.servers.selected.saving.will.remove") : tr("select.at.least.one.server.and")}</small>
    </fieldset>
    {!!changes.length && <div className="wo-association-changes" role="status">{changes.map(note => <p key={note}>{note}</p>)}</div>}
    <div className="wo-form-grid"><label className="wo-field"><span>{tr("credential.name")}</span><input name="name" value={name} onChange={e => { nameTouched.current = true; setName(e.target.value) }} readOnly={!!entry} required maxLength={100}/></label>
    <label className="wo-field"><span>{tr("username.note")}</span><input name="username" value={username} onChange={e => { usernameTouched.current = true; setUsername(e.target.value) }} autoComplete="off"/></label></div>
    <label className="wo-field"><span>{entry ? tr("new.password.leave.blank.to.keep") : tr("password")}</span><input ref={password} type="password" name="password" required={!entry} autoComplete="new-password" maxLength={16384}/></label>
    <label className="wo-field"><span>{tr("notes")}</span><textarea name="note" defaultValue={entry?.note} rows={2}/></label>
    <label className="wo-check"><input type="checkbox" name="agent" defaultChecked={entry?.agent ?? true}/>{tr("allow.operations.tools.and.recurring.tasks")}</label>
    <p className="wo-muted">{tr("connections.use.the.server.s.username")}</p>
    <div className="wo-form-actions"><button className="wo-primary" disabled={busy || (!entry && !selected.length)}>{busy ? tr("encrypting.and.saving") : tr("encrypt.save.and.update.bindings")}</button></div>
  </fieldset></form>
}
