import { tr, useLocale } from './i18n'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Credential, CredentialRef, Host, PageProps, Snapshot, Task } from './contracts'
import css from './style.css'
import { UpdatePanel } from './update-panel'
import manifest from '../package.json'
import { SyncPanel } from './sync-panel'
import { OverviewPanel } from './overview-panel'
import { TaskForm } from './task-form'
import { TemplateForm } from './template-form'
import type { TaskTemplate } from '../src/task-template-content'
import { BindingTestResult, CredentialForm, RoleBindingForm, credentialRoles, roleTitle } from './credential-form'
import type { BindingTest, CredentialTarget, Role } from './credential-form'

const getPlaybooks = (): Record<string, string> => ({ inspect: tr("health.inspection"), disk: tr("disk.diagnosis"), 'new-files': tr("recent.files"), security: tr("security.triage"), custom: tr("custom.checks") })
const getWeekdays = () => [tr("mon"), tr("tue"), tr("wed"), tr("thu"), tr("fri"), tr("sat"), tr("sun")]
const date = (value: string) => new Date(value).toLocaleString()
function scheduleText(task: Task, zone: string) {
  const s = task.schedule
  if (!s) return tr("on.demand")
  if (s.everyMinutes) return tr("every.minutes", { p0: s.everyMinutes })
  if (s.cron) return `${s.cron} · ${s.timeZone ?? zone}`
  return `${s.weekdays?.length ? tr("weekly", { p0: s.weekdays.map(d => getWeekdays()[d - 1]).join('、') }) : tr("daily")} ${s.daily} · ${s.timeZone ?? zone}`
}
function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`wo-badge ${tone}`}>{children}</span> }
function RefLabel({ value }: { value: CredentialRef | null }) {
  if (!value) return <span className="wo-muted">{tr("not.linked")}</span>
  const ready = value.status === 'ready'
  return <span className="wo-ref"><span className={`wo-dot ${ready ? 'good' : 'warn'}`}/>{value.name}{!ready && <small>{({ missing: tr("missing"), disabled: tr("automation.disabled"), empty: tr("empty.password") } as Record<string, string>)[value.status]}</small>}</span>
}
function CredentialBindingRow({ host, role, api, busy, change }: { host: Host; role: Role; api: PageProps['api']; busy: boolean; change: () => void }) {
  const [testing, setTesting] = useState(false)
  const [outcome, setOutcome] = useState<{ result?: BindingTest; error?: string }>()
  async function runTest() {
    if (busy || testing) return
    setTesting(true); setOutcome(undefined)
    // Test the saved login method, including SSH keys with a dormant password reference.
    const ref = (role === 'login' ? host.auth === 'password' ? host.loginSecret : '' : host.sudoSecret) ?? ''
    try { setOutcome({ result: await api({ action: 'testBinding', host: host.name, role, ref }) as BindingTest }) }
    catch (e) { setOutcome({ error: e instanceof Error ? e.message : String(e) }) }
    finally { setTesting(false) }
  }
  return <div>
    <div className="wo-credential-row"><span>{roleTitle(role)}</span><RefLabel value={host.credentials[role]}/>
      <div className="wo-credential-actions">
        <button type="button" className="wo-text-button" disabled={busy || testing} aria-label={tr("link.credential.for", { p0: host.name, p1: roleTitle(role) })} onClick={change}>{host.credentials[role] ? tr("change.credential") : tr("link.credential")}</button>
        <button type="button" className="wo-text-button" disabled={busy || testing} aria-label={tr("test.credential.for", { p0: host.name, p1: roleTitle(role) })} onClick={() => void runTest()}>{testing ? tr("testing") : tr("test.credential")}</button>
      </div>
    </div>
    {role === 'sudo' && host.credentials.sudo?.username && <p className="wo-muted">{tr("sudo.account.connection", { p0: host.credentials.sudo.username })}</p>}
    {outcome && <BindingTestResult host={host.name} role={role} {...outcome}/>}
  </div>
}
const permissionText = (value: string) => ({ ask: tr("approval.required"), allow: tr("allow"), deny: tr("deny") } as Record<string, string>)[value] ?? value
function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}
function Dialog({ title, close, children, busy }: { title: string; close: () => void; children: ReactNode; busy: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const el = ref.current!; el.showModal(); return () => el.close() }, [])
  return <dialog ref={ref} className="wo-dialog" onCancel={e => { e.preventDefault(); if (!busy) close() }}><div className="wo-dialog-head"><h2>{title}</h2><button type="button" className="wo-icon-button" disabled={busy} onClick={close} aria-label={tr("close")}>×</button></div>{children}</dialog>
}

type Modal = { type: 'host'; host?: Host } | { type: 'credential'; entry?: Credential; target?: CredentialTarget } | { type: 'binding'; host: Host; role: Role } | { type: 'policy'; host: Host } | { type: 'task'; task?: Task; template?: TaskTemplate; host?: string } | { type: 'picker'; host?: string } | { type: 'template'; template?: TaskTemplate; copy?: boolean; draft?: string } | { type: 'delete'; kind: 'Credential' | 'Task' | 'Template' | 'Host'; name: string } | null
export function OpsPage(props: PageProps) {
  useLocale()
  const sessions = props.useSessions?.(s => s)
  const [data, setData] = useState<Snapshot>()
  const [tab, setTab] = useState(props.sidebar ? 'hosts' : 'overview')
  const [search, setSearch] = useState('')
  const [hostName, setHostName] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sessionId, setSessionId] = useState('')
  // Set after a template request goes to chat; the library is reloaded once the agent's draft arrives.
  const [awaitingDraft, setAwaitingDraft] = useState(0)
  const alive = useRef(true)
  const generation = useRef(0)
  const selectedSession = sessionId || props.defaultSessionId || sessions?.ids.find(id => (sessions.byId[id]?.retainedBy?.mainView ?? 0) > 0) || ''
  async function load() {
    const id = ++generation.current
    setLoading(true)
    try {
      const value = await props.api({ action: 'snapshot' }) as Snapshot
      if (alive.current && id === generation.current) { setData(value); setError('') }
    } catch (e) { if (alive.current && id === generation.current) setError(e instanceof Error ? e.message : tr("failed.to.load")) }
    finally { if (alive.current && id === generation.current) setLoading(false) }
  }
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; generation.current++ } }, [props.api])
  useEffect(() => {
    if (!awaitingDraft) return
    const known = new Set(data?.templates.drafts.map(d => d.id))
    const timer = setInterval(() => {
      if (Date.now() - awaitingDraft > 15 * 60_000) { setAwaitingDraft(0); return }
      void (props.api({ action: 'templateDrafts' }) as Promise<{ ids: string[] }>).then(({ ids }) => {
        if (!alive.current || !ids.some(id => !known.has(id))) return
        setAwaitingDraft(0); setNotice(tr("ai.draft.ready")); void load()
      }, () => {})
    }, 5000)
    return () => clearInterval(timer)
  }, [awaitingDraft])
  async function mutate(request: Record<string, unknown> | ((api: PageProps['api']) => Promise<any>)) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = typeof request === 'function' ? await request(props.api) : await props.api(request)
      if (!alive.current) return
      setModal(null); setNotice(result.message ?? tr("saved")); await load()
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : tr("failed.to.save")) }
    finally { if (alive.current) setBusy(false) }
  }
  const host = data?.hosts.find(h => h.name === hostName) ?? data?.hosts[0]
  const matches = (text: string) => text.toLowerCase().includes(search.toLowerCase())
  const templates = data?.templates?.entries ?? []
  const visibleTemplates = templates.filter(t => matches(`${t.title} ${t.description} ${t.category}`))
  const visibleTasks = data?.tasks.filter(t => matches(`${t.name} ${t.description ?? ''} ${t.hosts.join(' ')}`)) ?? []
  const visibleCredentials = data?.vault.entries.filter(e => matches(`${e.name} ${e.username} ${data.hosts.filter(h => credentialRoles(h, e.name).length).map(h => h.name).join(' ')}`)) ?? []
  const schedule = (task: Task, session: string, enabled: boolean) => mutate({ action: 'scheduleTask', name: task.name, sessionId: session, enabled })
  function taskCard(task: Task) {
    return <article className="wo-task" key={task.name}>
      <div className="wo-task-heading"><div><h3>{task.description || task.name}</h3><small className="wo-mono">{task.name}</small></div><Badge tone={task.scheduled.length ? 'good' : ''}>{task.scheduled.length ? tr("enabled") : tr("disabled")}</Badge></div>
      <div className="wo-task-meta"><Badge>{getPlaybooks()[task.playbook]}</Badge><div className="wo-chips" aria-label={tr("link.servers")}>{task.hosts.map(name => <button key={name} type="button" className="wo-chip" onClick={() => { setHostName(name); setTab('hosts'); setSearch('') }}>{name} ↗</button>)}</div></div>
      <div className="wo-task-schedule"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>{scheduleText(task, data!.timeZone)}</span></div>
      {task.instruction && <details className="wo-task-rules"><summary><span className="wo-rule-label">{tr("inspection.rules")}</span><span className="wo-rule-preview">{task.instruction}</span></summary><p className="wo-task-instruction">{task.instruction}</p></details>}
      {task.scheduled.map(row => <div className="wo-scheduled" key={row.id}><span>{tr("next")}{date(row.scheduledAt)}<small>{tr("report.to")}{sessions?.byId[row.sessionId]?.displayTitle ?? row.sessionId}</small></span><button disabled={busy} onClick={() => void schedule(task, row.sessionId, false)}>{tr("disable")}</button></div>)}
      <div className="wo-task-footer"><div className="wo-task-flags">{task.template && <small>{tr("template")}{templates.find(t => t.id === task.template)?.title ?? task.template}</small>}{task.sudo && <Badge>{tr("sudo.authorized")}</Badge>}{!task.editable && <small title={tr("edit.in.the.configuration.file", { p0: task.name })}>{tr("managed.in.configuration")}</small>}</div><div className="wo-task-actions">
        {task.editable && <><button disabled={busy || task.scheduled.length > 0} onClick={() => setModal({ type: 'task', task })}>{tr("edit")}</button><button disabled={busy || task.scheduled.length > 0} className="wo-text-button" onClick={() => setModal({ type: 'delete', kind: 'Task', name: task.name })}>{tr("delete")}</button></>}
        <button disabled={busy || !selectedSession} title={!selectedSession ? tr("select.a.report.session.first") : ''} onClick={() => void mutate({ action: 'runTaskNow', name: task.name, sessionId: selectedSession })}>{tr("run.once")}</button>
        <button className="wo-schedule-button" disabled={busy || !data?.schedulerAvailable || !selectedSession || !task.schedule || task.scheduled.some(row => row.sessionId === selectedSession)} title={!selectedSession ? tr("select.a.report.session.first") : !task.schedule ? tr("no.run.time.configured") : ''} onClick={() => void schedule(task, selectedSession, true)}>{task.scheduled.some(row => row.sessionId === selectedSession) ? tr("enabled.in.this.session") : tr("enable.schedule")}</button>
      </div></div>
    </article>
  }
  return <main className={`wo-root${props.sidebar ? ' wo-sidebar' : ''}`}><style>{css}</style><div className="wo-content">
    <header className="wo-header"><div className="wo-heading"><span className="wo-logo" aria-hidden="true">W</span><div><div className="wo-heading-title"><h1>{tr("server.operations")}</h1><span className="wo-version">{manifest.version}</span></div><p>{tr("manage.servers.credentials.and.recurring.tasks")}</p></div></div><button className="wo-refresh" disabled={busy || loading} onClick={() => void load()}>{loading ? tr("loading") : tr("refresh")}</button></header>
    {error && !modal && <div role="alert" className="wo-alert">{error}<button onClick={() => void load()} disabled={loading}>{tr("retry")}</button></div>}
    {notice && <div role="status" className="wo-notice">{notice}</div>}
    {data?.warnings.map(w => <div className="wo-alert" key={w}>{w}</div>)}
    {!data ? <div className="wo-empty">{loading ? tr("reading.the.server.inventory") : tr("management.data.is.unavailable")}</div> : <>
      <div className="wo-overview" aria-label={tr("operations.overview")}><span>{tr("servers")}<strong>{data.hosts.length}</strong></span><span>{tr("credentials")}<strong>{data.vault.entries.length}</strong></span><span><i className={`wo-dot ${data.tasks.some(t => t.scheduled.length) ? 'good' : ''}`} aria-hidden="true"/>{tr("enabled.tasks")}<strong>{data.tasks.filter(t => t.scheduled.length > 0).length}<small> / {data.tasks.length}</small></strong></span></div>
      <nav className="wo-tabs" aria-label={tr("operations.management")}>{[['overview', tr('fleet.overview'), ''], ['hosts', tr("servers.2"), data.hosts.length], ['vault', tr("vault"), data.vault.entries.length], ['library', tr("task.library"), templates.length], ['tasks', tr("recurring.tasks"), data.tasks.length], ['sync', tr("device.sync"), ''], ['updates', tr('updates.title'), '']].map(([key, title, n]) => <button key={key} aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'active' : ''} onClick={() => { setTab(String(key)); setSearch('') }}>{title}{n !== '' && <span>{n}</span>}</button>)}</nav>
      {!['overview', 'sync', 'updates'].includes(tab) && <div className="wo-toolbar"><input type="search" aria-label={tr("search")} placeholder={tab === 'hosts' ? tr("search.servers.addresses.or.groups") : tab === 'vault' ? tr("search.credentials.usernames.or.servers") : tab === 'library' ? tr("search.templates.purposes.or.categories") : tr("search.tasks.or.linked.servers")} value={search} onChange={e => setSearch(e.target.value)}/><button className="wo-primary" disabled={busy} onClick={() => { setError(''); setModal(tab === 'hosts' ? { type: 'host' } : tab === 'vault' ? { type: 'credential' } : tab === 'library' ? { type: 'template' } : { type: 'picker' }) }}>＋ {tab === 'hosts' ? tr("add.server") : tab === 'vault' ? tr("new.credential") : tab === 'library' ? tr("new.template") : tr("link.task")}</button></div>}
      {tab === 'overview' && <OverviewPanel api={props.api} hosts={data.hosts} onSelectHost={name => { setHostName(name); setTab('hosts'); setSearch('') }}/>}
      {tab === 'updates' && <UpdatePanel api={props.api}/>}
      {tab === 'sync' && <SyncPanel api={props.api} onImported={load}/>}
      {tab === 'hosts' && <div className="wo-host-layout"><section className="wo-hosts" aria-label={tr("server.list")}>{data.hosts.filter(h => matches(`${h.name} ${h.description ?? ''} ${h.ssh ?? ''} ${h.groups.join(' ')}`)).map(h => <button key={h.name} className={`wo-host-row ${host?.name === h.name ? 'selected' : ''}`} onClick={() => setHostName(h.name)}><div className="wo-host-symbol">▤</div><div><strong>{h.name}</strong><span className="wo-mono">{h.user ? `${h.user}@` : ''}{h.ssh ?? h.name}{h.port ? `:${h.port}` : ''}</span><div className="wo-chips">{h.groups.map(g => <Badge key={g}>{g}</Badge>)}<small>{h.tasks.length} {tr("tasks")}</small></div></div><span className="wo-chevron">›</span></button>)}{!data.hosts.length && <div className="wo-empty">{tr("add.your.first.server")}<br/><small>{tr("existing.yaml.inventories.are.also.supported")}</small></div>}{data.hosts.length > 0 && !data.hosts.some(h => matches(`${h.name} ${h.description ?? ''} ${h.ssh ?? ''} ${h.groups.join(' ')}`)) && <div className="wo-empty">{tr("no.matching.servers")}</div>}</section>
      {host && <aside className="wo-detail"><div className="wo-detail-title"><div><span className="wo-eyebrow">SERVER DETAILS</span><h2>{host.name}</h2></div><Badge>{host.auth === 'password' ? tr("password.login") : tr("ssh.key")}</Badge></div>{host.description && <p className="wo-muted">{host.description}</p>}<dl className="wo-facts"><div><dt>{tr("connection.address")}</dt><dd className="wo-mono">{host.ssh ?? host.name}</dd></div><div><dt>{tr("username.port")}</dt><dd>{host.user ?? tr("ssh.configuration")} / {host.port ?? 22}</dd></div>{host.probe && <div><dt>{tr("last.probe")}</dt><dd>{host.probe.os ?? tr("unknown.system")} · {date(host.probe.at)}</dd></div>}</dl>
        <div className="wo-host-actions">{host.editable ? <><button disabled={busy} onClick={() => { setError(''); setModal({ type: 'host', host }) }}>{tr("edit.server")}</button><button className="wo-text-button" disabled={busy} onClick={() => { setError(''); setModal({ type: 'delete', kind: 'Host', name: host.name }) }}>{tr("delete")}</button></> : <small title={tr("edit.in.the.configuration.file", { p0: host.name })}>{tr("managed.outside.panel")}</small>}</div>
        <div className="wo-section-title"><h3>{tr("linked.credentials")}</h3></div>{(['login', 'sudo'] as const).map(role => <CredentialBindingRow key={JSON.stringify([host.name, role, data.revision, data.vault.revision])} host={host} role={role} api={props.api} busy={busy || loading} change={() => { setError(''); setModal({ type: 'binding', host, role }) }}/>)}<small className="wo-muted wo-block">{tr("passwords.are.decrypted.only.for.connections")}</small>
        <div className="wo-section-title"><h3>{tr("recurring.tasks.2")}<span className="wo-muted">{host.tasks.length}</span></h3><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'picker', host: host.name }) }}>{tr("link.task.2")}</button></div>{data.tasks.filter(t => t.hosts.includes(host.name)).map(t => <button className="wo-linked-task" key={t.name} onClick={() => { setTab('tasks'); setSearch(t.name) }}><div><strong>{t.description || t.name}</strong><small>{scheduleText(t, data.timeZone)}</small></div><span className={`wo-dot ${t.scheduled.length ? 'good' : ''}`}/></button>)}{!host.tasks.length && <p className="wo-muted">{tr("select.a.template.from.the.library")}</p>}
        <div className="wo-section-title"><h3>{tr("permissions")}</h3><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'policy', host }) }}>{tr("edit.permissions")}</button></div><div className="wo-chips">{Object.entries(host.policy).map(([key, value]) => <Badge key={key} tone={value === 'allow' ? 'good' : value === 'deny' ? 'warn' : ''}>{key} · {permissionText(value)}{host.policyOverride?.[key] !== undefined && <small> · {tr("set.in.panel")}</small>}</Badge>)}</div><small className="wo-muted wo-block">{tr("decided.by.host.group.then.default")}</small>
      </aside>}</div>}
      {tab === 'vault' && <><p className="wo-section-note">{tr("credentials.are.encrypted.and.linked.by")}</p><div className="wo-vault-grid">{visibleCredentials.map(entry => { const refs = data.hosts.filter(h => credentialRoles(h, entry.name).length); return <article className="wo-vault-card" key={entry.name}><div className="wo-task-heading"><div><span className="wo-key-symbol">⚿</span><h3>{entry.name}</h3><small>{entry.username || tr("no.username.set")}</small></div><Badge tone={entry.agent ? 'good' : 'warn'}>{entry.agent ? tr("automation.allowed") : tr("automation.disabled")}</Badge></div><div className="wo-secret-mask" aria-label={tr("stored.encrypted")}>•••••••••••• <small>{tr("encrypted")}</small></div>{entry.note && <p className="wo-muted">{entry.note}</p>}<div className="wo-chips">{refs.map(h => <button className="wo-chip" key={h.name} onClick={() => { setHostName(h.name); setTab('hosts'); setSearch('') }}>{h.name} · {credentialRoles(h, entry.name).map(role => role === 'login' ? 'SSH' : 'sudo').join(' / ')} ↗</button>)}{!refs.length && <small className="wo-muted">{tr("no.linked.servers")}</small>}</div><div className="wo-task-actions"><button onClick={() => { setError(''); setModal({ type: 'credential', entry }) }}>{tr("edit.credential")}</button><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'delete', kind: 'Credential', name: entry.name }) }}>{tr("delete")}</button></div></article> })}</div>{data.vault.entries.length > 0 && !visibleCredentials.length && <div className="wo-empty">{tr("no.matching.credentials")}<button className="wo-clear-search" onClick={() => setSearch('')}>{tr("clear.search")}</button></div>}{!data.vault.entries.length && <div className="wo-empty">{tr("create.your.first.encrypted.credential")}<br/><small>{tr("select.servers.and.purposes.to.link")}</small></div>}</>}
      {tab === 'library' && <><p className="wo-section-note">{tr("create.templates.then.link.servers.use")}</p>{data.templates.drafts.length > 0 && <section className="wo-drafts" aria-label={tr("drafts.to.review")}><h3>{tr("drafts.to.review")}<span className="wo-muted">{data.templates.drafts.length}</span></h3><div className="wo-task-grid wo-library-grid">{data.templates.drafts.map(d => <article className="wo-task wo-template-card" key={d.id}><div className="wo-task-heading"><div><small>{d.template.category}</small><h3>{d.template.title}</h3></div><Badge tone="warn">{tr("ai.draft")}</Badge></div><p>{d.template.description}</p><small className="wo-mono">{d.template.id} · {date(d.createdAt)}</small><div className="wo-task-actions"><button className="wo-primary" disabled={busy} onClick={() => { setError(''); setModal({ type: 'template', template: d.template, draft: d.id }) }}>{tr("review.and.save")}</button><button className="wo-text-button" disabled={busy} onClick={() => void mutate({ action: 'discardTemplateDraft', id: d.id })}>{tr("discard")}</button></div></article>)}</div></section>}<div className="wo-task-grid wo-library-grid">{visibleTemplates.map(t => <article className="wo-task wo-template-card" key={t.id}><div className="wo-task-heading"><div><small>{t.category}</small><h3>{t.title}</h3></div><Badge>{t.builtin ? tr("preset") : tr("custom")}</Badge></div><p>{t.description}</p><small>{t.uses ? tr("used.by.recurring.tasks", { p0: t.uses }) : tr("ready.to.link.servers")}{t.parameters.some(p => p.required) ? tr("specify.check.targets.when.linking") : ''}</small><div className="wo-task-actions"><button className="wo-primary" onClick={() => { setError(''); setModal({ type: 'task', template: t }) }}>{tr("link.servers")}</button><button onClick={() => { setError(''); setModal({ type: 'template', template: t, copy: t.builtin }) }}>{t.builtin ? tr("copy.and.edit") : tr("edit")}</button>{!t.builtin && <button className="wo-text-button" onClick={() => setModal({ type: 'delete', kind: 'Template', name: t.id })}>{tr("delete")}</button>}</div></article>)}</div>{!visibleTemplates.length && <div className="wo-empty">{tr("no.matching.templates")}<button className="wo-clear-search" onClick={() => setSearch('')}>{tr("clear.search")}</button></div>}</>}
      {tab === 'tasks' && <><div className="wo-destination"><label><span>{tr("report.to.2")}</span><select aria-label={tr("report.session")} value={selectedSession} onChange={e => setSessionId(e.target.value)}><option value="">{tr("choose.a.session.for.reports")}</option>{props.defaultSessionId && !sessions?.byId[props.defaultSessionId] && <option value={props.defaultSessionId}>{tr("current.session")}</option>}{sessions?.ids.filter(id => !sessions.byId[id]?.parentId).map(id => <option key={id} value={id}>{sessions.byId[id]?.displayTitle ?? id}</option>)}</select></label><small>{data.schedulerAvailable ? tr("reports.arrive.here.when.due.keep") : tr("scheduling.is.unavailable.here.use.ops")}</small></div><div className="wo-task-grid">{visibleTasks.map(taskCard)}</div>{data.tasks.length > 0 && !visibleTasks.length && <div className="wo-empty">{tr("no.matching.tasks")}<button className="wo-clear-search" onClick={() => setSearch('')}>{tr("clear.search")}</button></div>}{!data.tasks.length && <div className="wo-empty">{tr("make.inspections.routine")}<br/><small>{tr("choose.servers.checks.and.a.run")}</small></div>}</>}
      <footer className="wo-footer">{tr("wispops.recurring.tasks.collect.and.report")}</footer>
    </>}
    {modal && data && <Dialog title={({ host: modal.type === 'host' && modal.host ? tr("edit.server") : tr("add.server"), credential: modal.type === 'credential' && modal.entry ? tr("edit.credential") : tr("new.encrypted.credential"), binding: modal.type === 'binding' ? tr("link.role.credential", { p0: modal.host.name, p1: roleTitle(modal.role) }) : '', policy: modal.type === 'policy' ? tr("host.permissions", { p0: modal.host.name }) : '', task: modal.type === 'task' && modal.task ? tr("edit.recurring.task") : modal.type === 'task' && modal.host ? tr("link.task.for.server", { p0: modal.host }) : tr("link.servers.and.task"), picker: tr("choose.a.task.template"), template: modal.type === 'template' && modal.draft ? tr("review.ai.draft") : modal.type === 'template' && modal.template && !modal.copy ? tr("edit.task.template") : tr("new.task.template"), delete: tr("confirm.deletion") })[modal.type]} close={() => { setModal(null); setError('') }} busy={busy}>
      {error && <div role="alert" className="wo-alert">{error}</div>}
      {modal.type === 'host' && <HostForm host={modal.host} busy={busy} submit={value => mutate({ action: modal.host ? 'editHost' : 'addHost', host: value, revision: data.revision })}/>}
      {modal.type === 'credential' && <CredentialForm key={modal.entry?.name ?? `${modal.target?.host ?? 'new'}-${modal.target?.role}`} data={data} entry={modal.entry} target={modal.target} busy={busy} submit={value => mutate(async api => {
        const saved = await api({ action: 'saveCredential', credential: value, edit: !!modal.entry, revision: data.vault.revision })
        const target = modal.target && data.hosts.find(h => h.name === modal.target!.host)
        if (!target) return saved
        return await api({ action: 'bindCredentials', host: target.name, binding: bindingFor(target, modal.target!.role, `local:${String(value.name)}`), revision: data.revision })
      })}/>}
      {modal.type === 'binding' && <RoleBindingForm key={`${modal.host.name}-${modal.role}`} create={() => { setError(''); setModal({ type: 'credential', target: { host: modal.host.name, role: modal.role } }) }} host={modal.host} role={modal.role} entries={data.vault.entries} busy={busy} submit={ref => mutate({ action: 'bindCredentials', host: modal.host.name, binding: bindingFor(modal.host, modal.role, ref), revision: data.revision })} test={ref => props.api({ action: 'testBinding', host: modal.host.name, role: modal.role, ref }) as Promise<BindingTest>}/>}
      {modal.type === 'policy' && <PolicyForm key={modal.host.name} host={modal.host} busy={busy} submit={policy => mutate({ action: 'setPolicy', host: modal.host.name, policy, revision: data.revision })}/>}
      {modal.type === 'task' && <TaskForm api={props.api} data={data} task={modal.task} template={modal.template} fixedHost={modal.host} busy={busy} submit={async (value, parameters) => { await mutate({ action: 'saveTask', task: value, edit: !!modal.task, revision: data.revision, ...(modal.template ? { templateId: modal.template.id, templateRevision: data.templates.revision, templateValues: parameters } : {}) }); setTab('tasks'); setSearch('') }}/>}
      {modal.type === 'template' && <TemplateForm template={modal.template} copy={modal.copy} draft={!!modal.draft} zone={data.timeZone} busy={busy}
        chat={modal.template ? undefined : { session: selectedSession ? sessions?.byId[selectedSession]?.displayTitle ?? tr("current.session") : '', send: prompt => void mutate(async api => { const result = await api({ action: 'draftTemplateInChat', sessionId: selectedSession, prompt }); setAwaitingDraft(Date.now()); return result }) }}
        submit={value => mutate({ action: 'saveTemplate', template: value, edit: !!modal.template && !modal.copy && !modal.draft, revision: data.templates.revision, ...modal.draft ? { draftId: modal.draft } : {} })}/>}
      {modal.type === 'picker' && <><p className="wo-section-note">{modal.host ? tr("choose.task.for.server", { p0: modal.host }) : tr("choose.a.template.then.select.servers")}</p><div className="wo-template-picker">{templates.map(t => <button key={t.id} onClick={() => setModal({ type: 'task', template: t, host: modal.host })}><strong>{t.title}</strong><small>{t.description}</small></button>)}</div><div className="wo-form-actions"><button onClick={() => setModal({ type: 'task', host: modal.host })}>{tr("custom.generate.rules.for.servers")}</button></div></>}

      {modal.type === 'delete' && (() => {
        // A linked credential is deleted by force: its servers fall back to SSH key login and sudo without a stored password.
        const linked = modal.kind === 'Credential' ? data.hosts.filter(h => credentialRoles(h, modal.name).length).map(h => h.name) : []
        const effect = modal.kind === 'Template' ? tr("linked.tasks.keep.their.existing.rules") : modal.kind === 'Host' ? tr("delete.server.effect") : linked.length ? tr("delete.linked.credential.effect", { p0: linked.join(', ') }) : tr("this.cannot.be.undone")
        return <><p>{tr("delete.2")}{modal.name}” ? {effect}</p><div className="wo-form-actions"><button onClick={() => setModal(null)} disabled={busy}>{tr("cancel")}</button><button className="wo-danger" disabled={busy} onClick={() => void mutate({ action: `delete${modal.kind}`, name: modal.name, revision: modal.kind === 'Task' || modal.kind === 'Host' ? data.revision : modal.kind === 'Template' ? data.templates.revision : data.vault.revision, ...linked.length ? { force: true, managedRevision: data.revision } : {} })}>{tr("confirm.deletion")}</button></div></>
      })()}
    </Dialog>}
  </div></main>
}

function HostForm({ host, submit, busy }: { host?: Host; submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  // Blank optional fields are left out, which clears them when editing; a blank port falls back to ssh_config.
  function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); void submit({ name: f.get('name'), ssh: f.get('ssh'), ...(f.get('user') ? { user: f.get('user') } : {}), ...(f.get('port') ? { port: Number(f.get('port')) } : {}), description: f.get('description'), ...(f.get('identityFile') ? { identityFile: f.get('identityFile') } : {}), groups: String(f.get('groups')).split(/[,，\s]+/).filter(Boolean) }) }
  return <form onSubmit={save}><Field title={tr("server.name")} hint={host ? tr("server.name.is.fixed") : tr("letters.numbers.dots.hyphens.or.underscores")}><input name="name" required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100} defaultValue={host?.name} readOnly={!!host}/></Field><Field title={tr("ssh.address.or.config.alias")}><input name="ssh" placeholder={tr("192.0.2.10.or.hk")} defaultValue={host?.ssh ?? host?.name} required/></Field><div className="wo-form-grid"><Field title={tr("username")}><input name="user" placeholder="root" defaultValue={host?.user}/></Field><Field title={tr("port")}><input name="port" type="number" min="1" max="65535" defaultValue={host ? host.port : 22} required={!host}/></Field></div><Field title={tr("ssh.identity.path")} hint={tr("ssh.identity.hint")}><input name="identityFile" placeholder="~/.ssh/id_ed25519" defaultValue={host?.identityFile}/></Field><Field title={tr("groups")} hint={tr("separate.groups.with.commas")}><input name="groups" placeholder="production, web" defaultValue={host?.groups.join(', ')}/></Field><Field title={tr("description")}><input name="description" placeholder={tr("production.server.in.hong.kong")} defaultValue={host?.description}/></Field>{!host && <p className="wo-muted">{tr("link.ssh.and.sudo.credentials.after")}</p>}<div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? tr("saving") : host ? tr("save.server") : tr("add.server")}</button></div></form>
}
// Changing one purpose keeps the server's other binding as it is.
function bindingFor(host: Host, role: Role, ref: string) {
  if (role === 'login') return { auth: ref ? 'password' : 'key', loginSecret: ref, sudoSecret: host.sudoSecret ?? '' }
  return { auth: host.auth ?? 'key', loginSecret: host.loginSecret ?? '', sudoSecret: ref }
}
// Each capability is either inherited (YAML host > group > default) or set here for this host alone.
function PolicyForm({ host, submit, busy }: { host: Host; submit: (policy: Record<string, string>) => Promise<void>; busy: boolean }) {
  const capabilities = ['change', 'sudo', 'destructive'] as const
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(capabilities.map(key => [key, host.policyOverride?.[key] ?? ''])))
  const describe = { change: tr("capability.change"), sudo: tr("capability.sudo"), destructive: tr("capability.destructive") } as Record<string, string>
  const changed = capabilities.some(key => values[key] !== (host.policyOverride?.[key] ?? ''))
  return <form onSubmit={e => { e.preventDefault(); void submit(Object.fromEntries(capabilities.filter(key => values[key]).map(key => [key, values[key]!]))) }}><fieldset className="wo-form-body" disabled={busy}>
    <p className="wo-muted">{tr("allow.runs.without.asking.ask")}</p>
    {capabilities.map(key => <label className="wo-field wo-policy-row" key={key}><span>{key}<small>{describe[key]}</small></span><select value={values[key]} onChange={e => setValues({ ...values, [key]: e.target.value })}>
      <option value="">{tr("inherit", { p0: permissionText(host.inheritedPolicy[key] ?? 'ask') })}</option>
      <option value="allow">{tr("allow")}</option><option value="ask">{tr("approval.required")}</option><option value="deny">{tr("deny")}</option>
    </select></label>)}
    {values.destructive === 'allow' && <p className="wo-field-warn">{tr("destructive.allow.warning")}</p>}
    <p className="wo-muted">{tr("overrides.apply.to.yaml.hosts.too")}</p>
    <div className="wo-form-actions"><button className="wo-primary" disabled={busy || !changed}>{busy ? tr("saving") : tr("save.permissions")}</button></div>
  </fieldset></form>
}
