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
        if (current) notes.push(`${host.name}：${role === 'login' ? 'SSH' : 'sudo'} 凭据将替换「${current.name}」。`)
        if (role === 'login' && host.auth !== 'password') notes.push(`${host.name}：SSH 将改用密码登录。`)
      } else if (!row[role] && own.includes(role)) {
        notes.push(`${host.name}：解除 ${role === 'login' ? 'SSH' : 'sudo'} 关联${role === 'login' && host.auth === 'password' ? '，改用 SSH 密钥 / 配置' : ''}。`)
      }
    }
    return notes
  })
  return <form onSubmit={save} autoComplete="off"><fieldset className="wo-form-body" disabled={busy}>
    <fieldset className="wo-credential-picks"><legend>关联服务器与用途</legend>
      <p>勾选这条凭据用于哪些服务器，可同时用于 SSH 登录和 sudo。</p>
      <div className="wo-credential-pick-list">{[...data.hosts].sort((a, b) => Number(b.name === hostName) - Number(a.name === hostName)).map(host => {
        const row = links.find(r => r.host === host.name)!
        return <div className="wo-credential-pick" key={host.name}>
          <div><strong>{host.name}</strong><small>{host.user ? `${host.user}@` : ''}{host.ssh ?? host.name}</small></div>
          <label className="wo-check"><input type="checkbox" aria-label={`${host.name} SSH 登录`} checked={row.login} onChange={e => toggle(host.name, 'login', e.target.checked)}/>SSH 登录</label>
          <label className="wo-check"><input type="checkbox" aria-label={`${host.name} sudo 提权`} checked={row.sudo} onChange={e => toggle(host.name, 'sudo', e.target.checked)}/>sudo 提权</label>
        </div>
      })}</div>
      {!data.hosts.length && <p>还没有服务器。<button type="button" onClick={addHost}>添加服务器</button></p>}
      <small>{selected.length ? `已选择 ${selected.length} 台服务器` : entry ? '未选择服务器，保存后将解除此凭据的全部关联。' : '请选择至少一台服务器及用途。'}</small>
    </fieldset>
    {!!changes.length && <div className="wo-association-changes" role="status">{changes.map(note => <p key={note}>{note}</p>)}</div>}
    <div className="wo-form-grid"><label className="wo-field"><span>凭据名称</span><input name="name" value={name} onChange={e => { nameTouched.current = true; setName(e.target.value) }} readOnly={!!entry} required maxLength={100}/></label>
    <label className="wo-field"><span>用户名（备注）</span><input name="username" value={username} onChange={e => { usernameTouched.current = true; setUsername(e.target.value) }} autoComplete="off"/></label></div>
    <label className="wo-field"><span>{entry ? '新密码（留空则保留原密码）' : '密码'}</span><input ref={password} type="password" name="password" required={!entry} autoComplete="new-password" maxLength={16384}/></label>
    <label className="wo-field"><span>备注</span><textarea name="note" defaultValue={entry?.note} rows={2}/></label>
    <label className="wo-check"><input type="checkbox" name="agent" defaultChecked={entry?.agent ?? true}/>允许运维工具及例行任务使用此凭据</label>
    <p className="wo-muted">连接用户名以服务器配置为准；sudo 仍遵循服务器及任务授权。已保存的密码不会返回页面或模型。</p>
    <div className="wo-form-actions"><button className="wo-primary" disabled={busy || (!entry && !selected.length)}>{busy ? '加密保存中…' : '加密保存并更新关联'}</button></div>
  </fieldset></form>
}
