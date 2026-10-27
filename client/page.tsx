import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Credential, CredentialRef, Host, PageProps, Snapshot, Task } from './contracts'
import css from './style.css'
import { TaskForm } from './task-form'
import { TemplateForm } from './template-form'
import type { TaskTemplate } from '../src/task-template-content'
import { CredentialForm, credentialRoles } from './credential-form'

const playbooks: Record<string, string> = { inspect: '健康巡检', disk: '磁盘诊断', 'new-files': '新增文件分析', security: '安全排查', custom: '自定义检查' }
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const date = (value: string) => new Date(value).toLocaleString()
function scheduleText(task: Task, zone: string) {
  const s = task.schedule
  if (!s) return '手动运行'
  if (s.everyMinutes) return `每 ${s.everyMinutes} 分钟`
  if (s.cron) return `${s.cron} · ${s.timeZone ?? zone}`
  return `${s.weekdays?.length ? `每周${s.weekdays.map(d => weekdays[d - 1]).join('、')}` : '每天'} ${s.daily} · ${s.timeZone ?? zone}`
}
function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`wo-badge ${tone}`}>{children}</span> }
function RefLabel({ value }: { value: CredentialRef | null }) {
  if (!value) return <span className="wo-muted">未关联</span>
  const ready = value.status === 'ready'
  return <span className="wo-ref"><span className={`wo-dot ${ready ? 'good' : 'warn'}`}/>{value.name}{!ready && <small>{({ missing: '不存在', disabled: '禁止自动化', empty: '密码为空' } as Record<string, string>)[value.status]}</small>}</span>
}
function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}
function Dialog({ title, close, children, busy }: { title: string; close: () => void; children: ReactNode; busy: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const el = ref.current!; el.showModal(); return () => el.close() }, [])
  return <dialog ref={ref} className="wo-dialog" onCancel={e => { e.preventDefault(); if (!busy) close() }}><div className="wo-dialog-head"><h2>{title}</h2><button type="button" className="wo-icon-button" disabled={busy} onClick={close} aria-label="关闭">×</button></div>{children}</dialog>
}

type Modal = { type: 'host' } | { type: 'credential'; entry?: Credential; host?: string; role?: 'login' | 'sudo' } | { type: 'binding'; host: Host } | { type: 'task'; task?: Task; template?: TaskTemplate; host?: string } | { type: 'picker'; host?: string } | { type: 'template'; template?: TaskTemplate; copy?: boolean } | { type: 'delete'; kind: 'Credential' | 'Task' | 'Template'; name: string } | null
export function OpsPage(props: PageProps) {
  const sessions = props.useSessions?.(s => s)
  const [data, setData] = useState<Snapshot>()
  const [tab, setTab] = useState('hosts')
  const [search, setSearch] = useState('')
  const [hostName, setHostName] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sessionId, setSessionId] = useState('')
  const alive = useRef(true)
  const generation = useRef(0)
  const selectedSession = sessionId || props.defaultSessionId || sessions?.ids.find(id => (sessions.byId[id]?.retainedBy?.mainView ?? 0) > 0) || ''
  async function load() {
    const id = ++generation.current
    setLoading(true)
    try {
      const value = await props.api({ action: 'snapshot' }) as Snapshot
      if (alive.current && id === generation.current) { setData(value); setError('') }
    } catch (e) { if (alive.current && id === generation.current) setError(e instanceof Error ? e.message : '加载失败。') }
    finally { if (alive.current && id === generation.current) setLoading(false) }
  }
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; generation.current++ } }, [props.api])
  async function mutate(request: Record<string, unknown>) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await props.api(request)
      if (!alive.current) return
      setModal(null); setNotice(result.message ?? '已保存。'); await load()
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '保存失败。') }
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
      <div className="wo-task-heading"><div><h3>{task.description || task.name}</h3><small className="wo-mono">{task.name}</small></div><Badge tone={task.scheduled.length ? 'good' : ''}>{task.scheduled.length ? '已启用' : '未启用'}</Badge></div>
      <div className="wo-task-meta"><Badge>{playbooks[task.playbook]}</Badge><div className="wo-chips" aria-label="关联服务器">{task.hosts.map(name => <button key={name} type="button" className="wo-chip" onClick={() => { setHostName(name); setTab('hosts'); setSearch('') }}>{name} ↗</button>)}</div></div>
      <div className="wo-task-schedule"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>{scheduleText(task, data!.timeZone)}</span></div>
      {task.instruction && <details className="wo-task-rules"><summary><span className="wo-rule-label">巡查规则</span><span className="wo-rule-preview">{task.instruction}</span></summary><p className="wo-task-instruction">{task.instruction}</p></details>}
      {task.scheduled.map(row => <div className="wo-scheduled" key={row.id}><span>下次 {date(row.scheduledAt)}<small>汇报至 {sessions?.byId[row.sessionId]?.displayTitle ?? row.sessionId}</small></span><button disabled={busy} onClick={() => void schedule(task, row.sessionId, false)}>停用</button></div>)}
      <div className="wo-task-footer"><div className="wo-task-flags">{task.template && <small>模板：{templates.find(t => t.id === task.template)?.title ?? task.template}</small>}{task.sudo && <Badge>sudo 已授权</Badge>}{!task.editable && <small title={`在配置文件中编辑 ${task.name}`}>配置文件管理</small>}</div><div className="wo-task-actions">
        {task.editable && <><button disabled={busy || task.scheduled.length > 0} onClick={() => setModal({ type: 'task', task })}>编辑</button><button disabled={busy || task.scheduled.length > 0} className="wo-text-button" onClick={() => setModal({ type: 'delete', kind: 'Task', name: task.name })}>删除</button></>}
        <button className="wo-schedule-button" disabled={busy || !data?.schedulerAvailable || !selectedSession || !task.schedule || task.scheduled.some(row => row.sessionId === selectedSession)} title={!selectedSession ? '请先选择汇报会话' : !task.schedule ? '此任务未设置运行时间' : ''} onClick={() => void schedule(task, selectedSession, true)}>{task.scheduled.some(row => row.sessionId === selectedSession) ? '此会话已启用' : '启用调度'}</button>
      </div></div>
    </article>
  }
  return <main className={`wo-root${props.sidebar ? ' wo-sidebar' : ''}`}><style>{css}</style><div className="wo-content">
    <header className="wo-header"><div className="wo-heading"><span className="wo-logo" aria-hidden="true">W</span><div><div className="wo-heading-title"><h1>服务器运维</h1><span className="wo-version">0.5.0</span></div><p>服务器、密码库和例行任务，在一处管理。</p></div></div><button className="wo-refresh" disabled={busy || loading} onClick={() => void load()}>{loading ? '加载中…' : '↻ 刷新'}</button></header>
    {error && !modal && <div role="alert" className="wo-alert">{error}<button onClick={() => void load()} disabled={loading}>重试</button></div>}
    {notice && <div role="status" className="wo-notice">{notice}</div>}
    {data?.warnings.map(w => <div className="wo-alert" key={w}>{w}</div>)}
    {!data ? <div className="wo-empty">{loading ? '正在读取服务器清单…' : '暂时无法读取管理数据。'}</div> : <>
      <div className="wo-overview" aria-label="运维概览"><span>服务器 <strong>{data.hosts.length}</strong></span><span>凭据 <strong>{data.vault.entries.length}</strong></span><span><i className={`wo-dot ${data.tasks.some(t => t.scheduled.length) ? 'good' : ''}`} aria-hidden="true"/>任务已启用 <strong>{data.tasks.filter(t => t.scheduled.length > 0).length}<small> / {data.tasks.length}</small></strong></span></div>
      <nav className="wo-tabs" aria-label="运维管理">{[['hosts', '服务器', data.hosts.length], ['vault', '密码库', data.vault.entries.length], ['library', '任务库', templates.length], ['tasks', '例行任务', data.tasks.length]].map(([key, title, n]) => <button key={key} aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'active' : ''} onClick={() => { setTab(String(key)); setSearch('') }}>{title}<span>{n}</span></button>)}</nav>
      <div className="wo-toolbar"><input type="search" aria-label="搜索" placeholder={tab === 'hosts' ? '搜索服务器、地址或分组…' : tab === 'vault' ? '搜索凭据、用户名或服务器…' : tab === 'library' ? '搜索模板、用途或分类…' : '搜索任务或关联服务器…'} value={search} onChange={e => setSearch(e.target.value)}/><button className="wo-primary" disabled={busy} onClick={() => { setError(''); setModal(tab === 'hosts' ? { type: 'host' } : tab === 'vault' ? { type: 'credential' } : tab === 'library' ? { type: 'template' } : { type: 'picker' }) }}>＋ {tab === 'hosts' ? '添加服务器' : tab === 'vault' ? '新增凭据' : tab === 'library' ? '新建模板' : '关联任务'}</button></div>
      {tab === 'hosts' && <div className="wo-host-layout"><section className="wo-hosts" aria-label="服务器列表">{data.hosts.filter(h => matches(`${h.name} ${h.description ?? ''} ${h.ssh ?? ''} ${h.groups.join(' ')}`)).map(h => <button key={h.name} className={`wo-host-row ${host?.name === h.name ? 'selected' : ''}`} onClick={() => setHostName(h.name)}><div className="wo-host-symbol">▤</div><div><strong>{h.name}</strong><span className="wo-mono">{h.user ? `${h.user}@` : ''}{h.ssh ?? h.name}{h.port ? `:${h.port}` : ''}</span><div className="wo-chips">{h.groups.map(g => <Badge key={g}>{g}</Badge>)}<small>{h.tasks.length} 个任务</small></div></div><span className="wo-chevron">›</span></button>)}{!data.hosts.length && <div className="wo-empty">添加第一台服务器<br/><small>也支持读取已有 YAML 清单。</small></div>}{data.hosts.length > 0 && !data.hosts.some(h => matches(`${h.name} ${h.description ?? ''} ${h.ssh ?? ''} ${h.groups.join(' ')}`)) && <div className="wo-empty">没有匹配的服务器</div>}</section>
      {host && <aside className="wo-detail"><div className="wo-detail-title"><div><span className="wo-eyebrow">SERVER DETAILS</span><h2>{host.name}</h2></div><Badge>{host.auth === 'password' ? '密码登录' : 'SSH 密钥'}</Badge></div>{host.description && <p className="wo-muted">{host.description}</p>}<dl className="wo-facts"><div><dt>连接地址</dt><dd className="wo-mono">{host.ssh ?? host.name}</dd></div><div><dt>用户名 / 端口</dt><dd>{host.user ?? 'SSH 配置'} / {host.port ?? 22}</dd></div>{host.probe && <div><dt>最近探测</dt><dd>{host.probe.os ?? '未知系统'} · {date(host.probe.at)}</dd></div>}</dl>
        <div className="wo-section-title"><h3>关联密码库</h3><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'binding', host }) }}>管理关联</button></div>{(['login', 'sudo'] as const).map(role => <div className="wo-credential-row" key={role}><span>{role === 'login' ? 'SSH 登录' : 'sudo 提权'}</span><RefLabel value={host.credentials[role]}/><button className="wo-text-button" aria-label={`为 ${host.name} 新增${role === 'login' ? ' SSH 登录' : ' sudo'}凭据`} onClick={() => { setError(''); setModal({ type: 'credential', host: host.name, role }) }}>＋ 新增</button></div>)}<small className="wo-muted wo-block">密码只在建立连接时解密，不会显示给模型。</small>
        <div className="wo-section-title"><h3>例行任务 <span className="wo-muted">{host.tasks.length}</span></h3><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'picker', host: host.name }) }}>＋ 关联任务</button></div>{data.tasks.filter(t => t.hosts.includes(host.name)).map(t => <button className="wo-linked-task" key={t.name} onClick={() => { setTab('tasks'); setSearch(t.name) }}><div><strong>{t.description || t.name}</strong><small>{scheduleText(t, data.timeZone)}</small></div><span className={`wo-dot ${t.scheduled.length ? 'good' : ''}`}/></button>)}{!host.tasks.length && <p className="wo-muted">从任务库选择检查模板，关联后再启用调度。</p>}
        <div className="wo-section-title"><h3>操作权限</h3></div><div className="wo-chips">{Object.entries(host.policy).map(([key, value]) => <Badge key={key}>{key} · {({ ask: '需审批', allow: '允许', deny: '禁止' } as Record<string, string>)[value]}</Badge>)}</div>
      </aside>}</div>}
      {tab === 'vault' && <><p className="wo-section-note">凭据加密保存，按服务器及 SSH / sudo 用途关联。</p><div className="wo-vault-grid">{visibleCredentials.map(entry => { const refs = data.hosts.filter(h => credentialRoles(h, entry.name).length); return <article className="wo-vault-card" key={entry.name}><div className="wo-task-heading"><div><span className="wo-key-symbol">⚿</span><h3>{entry.name}</h3><small>{entry.username || '未设置用户名'}</small></div><Badge tone={entry.agent ? 'good' : 'warn'}>{entry.agent ? '允许自动化' : '禁止自动化'}</Badge></div><div className="wo-secret-mask" aria-label="已加密保存">•••••••••••• <small>已加密</small></div>{entry.note && <p className="wo-muted">{entry.note}</p>}<div className="wo-chips">{refs.map(h => <button className="wo-chip" key={h.name} onClick={() => { setHostName(h.name); setTab('hosts'); setSearch('') }}>{h.name} · {credentialRoles(h, entry.name).map(role => role === 'login' ? 'SSH' : 'sudo').join(' / ')} ↗</button>)}{!refs.length && <small className="wo-muted">尚未关联服务器</small>}</div><div className="wo-task-actions"><button onClick={() => { setError(''); setModal({ type: 'credential', entry }) }}>编辑凭据</button><button className="wo-text-button" disabled={refs.length > 0} title={refs.length ? '请先解除服务器关联' : ''} onClick={() => setModal({ type: 'delete', kind: 'Credential', name: entry.name })}>删除</button></div></article> })}</div>{data.vault.entries.length > 0 && !visibleCredentials.length && <div className="wo-empty">没有匹配的凭据<button className="wo-clear-search" onClick={() => setSearch('')}>清除搜索</button></div>}{!data.vault.entries.length && <div className="wo-empty">创建第一条加密凭据<br/><small>选择服务器和用途，保存时直接关联。</small></div>}</>}
      {tab === 'library' && <><p className="wo-section-note">先设置任务模板，再关联服务器。预设可直接使用，也可复制修改；已关联任务保留自己的规则。</p><div className="wo-task-grid wo-library-grid">{visibleTemplates.map(t => <article className="wo-task wo-template-card" key={t.id}><div className="wo-task-heading"><div><small>{t.category}</small><h3>{t.title}</h3></div><Badge>{t.builtin ? '预设' : '自建'}</Badge></div><p>{t.description}</p><small>{t.uses ? `已用于 ${t.uses} 个例行任务` : '待关联服务器'}{t.parameters.some(p => p.required) ? ' · 关联时填写检查对象' : ''}</small><div className="wo-task-actions"><button className="wo-primary" onClick={() => { setError(''); setModal({ type: 'task', template: t }) }}>关联服务器</button><button onClick={() => { setError(''); setModal({ type: 'template', template: t, copy: t.builtin }) }}>{t.builtin ? '复制编辑' : '编辑'}</button>{!t.builtin && <button className="wo-text-button" onClick={() => setModal({ type: 'delete', kind: 'Template', name: t.id })}>删除</button>}</div></article>)}</div>{!visibleTemplates.length && <div className="wo-empty">没有匹配的模板<button className="wo-clear-search" onClick={() => setSearch('')}>清除搜索</button></div>}</>}
      {tab === 'tasks' && <><div className="wo-destination"><label><span>汇报至</span><select aria-label="汇报会话" value={selectedSession} onChange={e => setSessionId(e.target.value)}><option value="">选择接收报告的会话</option>{props.defaultSessionId && !sessions?.byId[props.defaultSessionId] && <option value={props.defaultSessionId}>当前会话</option>}{sessions?.ids.filter(id => !sessions.byId[id]?.parentId).map(id => <option key={id} value={id}>{sessions.byId[id]?.displayTitle ?? id}</option>)}</select></label><small>{data.schedulerAvailable ? '任务到点后在此会话汇报，Harness 需保持运行。' : '当前环境未提供调度服务，可使用 /ops-run 手动运行。'}</small></div><div className="wo-task-grid">{visibleTasks.map(taskCard)}</div>{data.tasks.length > 0 && !visibleTasks.length && <div className="wo-empty">没有匹配的任务<button className="wo-clear-search" onClick={() => setSearch('')}>清除搜索</button></div>}{!data.tasks.length && <div className="wo-empty">让检查成为例行工作<br/><small>选择服务器、检查内容和运行时间，即可创建任务。</small></div>}</>}
      <footer className="wo-footer">WispOps · 例行任务只采集与汇报，服务器变更仍遵循审批策略。</footer>
    </>}
    {modal && data && <Dialog title={({ host: '添加服务器', credential: modal.type === 'credential' && modal.entry ? '编辑凭据' : '新增加密凭据', binding: '关联服务器凭据', task: modal.type === 'task' && modal.task ? '编辑例行任务' : '关联服务器与任务', picker: '选择任务模板', template: modal.type === 'template' && modal.template && !modal.copy ? '编辑任务模板' : '新建任务模板', delete: '确认删除' })[modal.type]} close={() => { setModal(null); setError('') }} busy={busy}>
      {error && <div role="alert" className="wo-alert">{error}</div>}
      {modal.type === 'host' && <HostForm busy={busy} submit={value => mutate({ action: 'addHost', host: value, revision: data.revision })}/>}
      {modal.type === 'credential' && <CredentialForm key={modal.entry?.name ?? `${modal.host ?? 'new'}-${modal.role}`} data={data} entry={modal.entry} hostName={modal.host} role={modal.role} busy={busy} addHost={() => setModal({ type: 'host' })} submit={(value, associations) => mutate({ action: 'saveCredential', credential: value, associations, edit: !!modal.entry, revision: data.vault.revision, managedRevision: data.revision })}/>}
      {modal.type === 'binding' && <BindingForm create={() => { setError(''); setModal({ type: 'credential', host: modal.host.name, role: modal.host.auth === 'password' ? 'login' : 'sudo' }) }} host={modal.host} entries={data.vault.entries} busy={busy} submit={value => mutate({ action: 'bindCredentials', host: modal.host.name, binding: value, revision: data.revision })}/>}
      {modal.type === 'task' && <TaskForm api={props.api} data={data} task={modal.task} template={modal.template} host={modal.host} busy={busy} submit={async (value, parameters) => { await mutate({ action: 'saveTask', task: value, edit: !!modal.task, revision: data.revision, ...(modal.template ? { templateId: modal.template.id, templateRevision: data.templates.revision, templateValues: parameters } : {}) }); setTab('tasks'); setSearch('') }}/>}
      {modal.type === 'template' && <TemplateForm template={modal.template} copy={modal.copy} zone={data.timeZone} busy={busy} submit={value => mutate({ action: 'saveTemplate', template: value, edit: !!modal.template && !modal.copy, revision: data.templates.revision })}/>}
      {modal.type === 'picker' && <><p className="wo-section-note">{modal.host ? `为 ${modal.host} 关联任务；下一步可添加其他服务器。` : '选择模板后，再设置服务器和运行时间。'}</p><div className="wo-template-picker">{templates.map(t => <button key={t.id} onClick={() => setModal({ type: 'task', template: t, host: modal.host })}><strong>{t.title}</strong><small>{t.description}</small></button>)}</div><div className="wo-form-actions"><button onClick={() => setModal({ type: 'task', host: modal.host })}>自定义 / 按服务器生成规则</button></div></>}

      {modal.type === 'delete' && <><p>删除「{modal.name}」？{modal.kind === 'Template' ? '已关联的例行任务仍保留原有规则。' : '此操作无法撤销。'}</p><div className="wo-form-actions"><button onClick={() => setModal(null)} disabled={busy}>取消</button><button className="wo-danger" disabled={busy} onClick={() => void mutate({ action: `delete${modal.kind}`, name: modal.name, revision: modal.kind === 'Task' ? data.revision : modal.kind === 'Template' ? data.templates.revision : data.vault.revision })}>确认删除</button></div></>}
    </Dialog>}
  </div></main>
}

function HostForm({ submit, busy }: { submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); void submit({ name: f.get('name'), ssh: f.get('ssh'), ...(f.get('user') ? { user: f.get('user') } : {}), port: Number(f.get('port')), description: f.get('description'), groups: String(f.get('groups')).split(/[,，\s]+/).filter(Boolean) }) }
  return <form onSubmit={save}><Field title="服务器名称" hint="字母、数字、点、短横线或下划线，如 hk-prod"><input name="name" required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100}/></Field><Field title="SSH 地址或配置别名"><input name="ssh" placeholder="192.0.2.10 或 hk-server" required/></Field><div className="wo-form-grid"><Field title="用户名"><input name="user" placeholder="root"/></Field><Field title="端口"><input name="port" type="number" min="1" max="65535" defaultValue="22" required/></Field></div><Field title="分组" hint="多个分组用逗号分隔"><input name="groups" placeholder="production, web"/></Field><Field title="描述"><input name="description" placeholder="香港业务服务器"/></Field><p className="wo-muted">添加后可关联登录和 sudo 凭据；不填写密码时使用现有 SSH 密钥配置。</p><div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? '保存中…' : '添加服务器'}</button></div></form>
}
function BindingForm({ host, entries, submit, busy, create }: { create: () => void; host: Host; entries: Credential[]; submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [auth, setAuth] = useState(host.auth ?? 'key')
  function options(current?: string) { return <><option value="">不使用密码库凭据</option>{current && !entries.some(e => `local:${e.name}` === current) && <option value={current}>{current}（当前关联）</option>}{entries.map(e => <option key={e.name} value={`local:${e.name}`}>{e.name}{e.agent ? '' : '（禁止自动化）'}</option>)}</> }
  return <form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void submit({ auth, loginSecret: f.get('loginSecret') ?? '', sudoSecret: f.get('sudoSecret') ?? '' }) }}><p className="wo-muted">服务器：{host.name}</p><Field title="SSH 登录方式"><select value={auth} onChange={e => setAuth(e.target.value as 'key' | 'password')}><option value="key">SSH 密钥 / SSH 配置</option><option value="password">密码登录</option></select></Field><Field title="SSH 登录凭据"><select name="loginSecret" defaultValue={host.loginSecret ?? ''} required={auth === 'password'} disabled={auth === 'key'}>{options(host.loginSecret)}</select></Field><Field title="sudo 凭据" hint="未关联时使用免密 sudo；是否允许 sudo 仍由服务器策略决定。"><select name="sudoSecret" defaultValue={host.sudoSecret ?? ''}>{options(host.sudoSecret)}</select></Field><p className="wo-muted">{!entries.length ? '密码库为空，' : '没有合适的凭据？'}<button type="button" disabled={busy} onClick={create}>新增凭据并关联此服务器</button></p><div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? '保存中…' : '保存关联'}</button></div></form>
}
