import { tr } from './i18n'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Credential, Host, Snapshot } from './contracts'

export type Role = 'login' | 'sudo'
export interface CredentialTarget { host: string; role: Role }
export const roleTitle = (role: Role) => role === 'login' ? tr("ssh.login") : tr("sudo.elevation")
export function credentialRoles(host: Host, name: string) {
  return (['login', 'sudo'] as const).filter(role => host.credentials[role]?.provider === 'local' && host.credentials[role]?.name === name)
}

// Servers pick credentials by purpose; a sudo credential may name a separate SSH account.
export function CredentialForm({ data, entry, target, submit, busy }: {
  data: Snapshot; entry?: Credential; target?: CredentialTarget; busy: boolean
  submit: (value: Record<string, unknown>) => Promise<void>
}) {
  const password = useRef<HTMLInputElement>(null)
  const [reveal, setReveal] = useState(false)
  const targetHost = data.hosts.find(h => h.name === target?.host)
  function suggestedName() {
    if (!target) return ''
    const base = `${target.host.slice(0, 80)}-${target.role === 'login' ? 'ssh' : 'sudo'}`
    let result = base, n = 2
    while (data.vault.entries.some(e => e.name === result)) result = `${base}-${n++}`
    return result
  }
  const [name, setName] = useState(entry?.name ?? suggestedName())
  const [username, setUsername] = useState(entry?.username ?? targetHost?.user ?? '')
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const value = { name, username, note: f.get('note'), agent: f.has('agent'), ...(f.get('password') ? { password: f.get('password') } : {}) }
    // Keep plaintext out of React state and clear the input even when saving fails.
    if (password.current) password.current.value = ''
    setReveal(false)
    void submit(value)
  }
  return <form onSubmit={save} autoComplete="off"><fieldset className="wo-form-body" disabled={busy}>
    {target ? <p className="wo-target-note">{tr("after.saving.this.credential.will.be", { p0: target.host, p1: roleTitle(target.role) })}</p> : <p className="wo-muted">{tr("the.password.is.stored.in.the")}</p>}
    <div className="wo-form-grid"><label className="wo-field"><span>{tr("credential.name")}</span><input name="name" value={name} onChange={e => setName(e.target.value)} readOnly={!!entry} required maxLength={100}/></label>
    <label className="wo-field"><span>{tr("credential.username")}</span><input name="username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="off"/><small>{tr("credential.username.hint")}</small></label></div>
    <div className="wo-field wo-password-field">
      <div className="wo-password-head"><label htmlFor="wo-credential-password">{entry ? tr("new.password.leave.blank.to.keep") : tr("password")}</label>
        <button type="button" className="wo-text-button" aria-pressed={reveal} onClick={() => setReveal(!reveal)}>{reveal ? tr("hide.password") : tr("show.password")}</button></div>
      <input id="wo-credential-password" ref={password} type={reveal ? 'text' : 'password'} name="password" required={!entry} autoComplete="new-password" maxLength={16384}/>
      <small>{tr("encrypted.on.save.never.shown.again")}</small>
    </div>
    <label className="wo-field"><span>{tr("notes")}</span><textarea name="note" defaultValue={entry?.note} rows={2}/></label>
    <label className="wo-check"><input type="checkbox" name="agent" defaultChecked={entry?.agent ?? true}/>{tr("allow.operations.tools.and.recurring.tasks")}</label>
    <p className="wo-muted">{tr("connections.use.the.server.s.username")}</p>
    <div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? tr("encrypting.and.saving") : target ? tr("encrypt.save.and.link") : tr("encrypt.and.save")}</button></div>
  </fieldset></form>
}

// One server, one purpose: pick a vault credential or fall back to SSH keys / passwordless sudo.
export interface BindingTest { status: string; user: string; error: string }
export function BindingTestResult({ host, role, result, error }: { host: string; role: Role; result?: BindingTest; error?: string }) {
  const verdict = (value: BindingTest) => {
    if (value.status === 'ok') return role === 'login' ? tr("login.succeeded.as", { p0: value.user, p1: host }) : tr("sudo.works.as", { p0: value.user, p1: host })
    return ({ 'auth-failed': role === 'sudo' ? tr("sudo.account.login.failed") : tr("ssh.login.failed.check.the.password"), 'sudo-required': tr("sudo.rejected.the.password.or.needs"), unreachable: tr("the.server.is.unreachable"), timeout: tr("the.connection.timed.out"), blocked: tr("logins.are.paused.after.repeated.failures") } as Record<string, string>)[value.status] ?? tr("the.test.command.failed")
  }
  return <div role="status" className={`wo-test-result ${result?.status === 'ok' ? 'good' : 'bad'}`}>{result ? verdict(result) : error}{result?.error && <small>{result.error}</small>}</div>
}
export function RoleBindingForm({ host, role, entries, submit, busy, create, test }: {
  host: Host; role: Role; entries: Credential[]; busy: boolean
  submit: (ref: string) => Promise<void>; create: () => void; test: (ref: string) => Promise<BindingTest>
}) {
  const current = (role === 'login' ? host.loginSecret : host.sudoSecret) ?? ''
  const [ref, setRefState] = useState(current)
  const [testing, setTesting] = useState(false)
  const [outcome, setOutcome] = useState<{ ref: string; result?: BindingTest; error?: string }>()
  const setRef = (value: string) => { setRefState(value); if (outcome && outcome.ref !== value) setOutcome(undefined) }
  async function runTest() {
    setTesting(true); setOutcome(undefined)
    try { setOutcome({ ref, result: await test(ref) }) }
    catch (e) { setOutcome({ ref, error: e instanceof Error ? e.message : String(e) }) }
    finally { setTesting(false) }
  }
  const legacy = current && !entries.some(e => `local:${e.name}` === current) ? current : ''
  const sudoAccount = entries.find(e => `local:${e.name}` === ref)?.username || (ref === current ? host.credentials.sudo?.username : '')
  const option = (value: string, title: string, detail?: string, badge?: string) => <label className="wo-pick-option" key={value || 'none'}>
    <input type="radio" name="ref" value={value} checked={ref === value} onChange={() => setRef(value)}/>
    <div><strong>{title}{value === current && current ? <span className="wo-muted">{tr("current.binding")}</span> : null}</strong>{detail && <small>{detail}</small>}</div>
    {badge && <span className="wo-badge warn">{badge}</span>}
  </label>
  return <form onSubmit={e => { e.preventDefault(); void submit(ref) }}><fieldset className="wo-form-body" disabled={busy}>
    <p className="wo-muted">{tr("pick.one.credential.from.the.vault", { p0: roleTitle(role) })}</p>
    <div className="wo-pick-list" role="radiogroup" aria-label={roleTitle(role)}>
      {option('', role === 'login' ? tr("use.ssh.keys.no.credential") : tr("passwordless.sudo.no.credential"), role === 'login' ? undefined : tr("without.a.credential.use.passwordless.sudo"))}
      {legacy && option(legacy, legacy)}
      {entries.map(e => option(`local:${e.name}`, e.name, e.username || tr("no.username.set"), e.agent ? undefined : tr("automation.disabled")))}
    </div>
    {role === 'sudo' && <p className="wo-muted">{sudoAccount ? tr("sudo.account.connection", { p0: sudoAccount }) : tr("sudo.account.current.login")}</p>}
    <p className="wo-muted">{entries.length ? tr("need.another.credential") : tr("the.vault.is.empty")}<button type="button" disabled={busy || testing} onClick={create}>{tr("create.a.credential.and.link.this")}</button></p>
    {outcome && <BindingTestResult host={host.name} role={role} result={outcome.result} error={outcome.error}/>}
    <div className="wo-form-actions"><button type="button" disabled={busy || testing} onClick={() => void runTest()}>{testing ? tr("testing") : role === 'login' ? tr("test.login") : tr("test.sudo")}</button><button className="wo-primary" disabled={busy || testing || ref === current}>{busy ? tr("saving") : tr("save.bindings")}</button></div>
  </fieldset></form>
}
