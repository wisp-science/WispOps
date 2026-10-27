import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Credential, CredentialRef, Host, PageProps, Snapshot, Task } from './contracts'
import css from './style.css'

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

type Modal = { type: 'host' } | { type: 'credential'; entry?: Credential } | { type: 'binding'; host: Host } | { type: 'task'; task?: Task; host?: string } | { type: 'delete'; kind: 'Credential' | 'Task'; name: string } | null
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
  const schedule = (task: Task, session: string, enabled: boolean) => mutate({ action: 'scheduleTask', name: task.name, sessionId: session, enabled })
  function taskCard(task: Task) {
    return <article className="wo-task" key={task.name}><div className="wo-task-heading"><div><h3>{task.description || task.name}</h3><small className="wo-mono">{task.name}</small></div><Badge tone={task.scheduled.length ? 'good' : ''}>{task.scheduled.length ? '运行中' : '未启用'}</Badge></div>
      <div className="wo-task-meta"><Badge>{playbooks[task.playbook]}</Badge><span>{scheduleText(task, data!.timeZone)}</span></div>
      <div className="wo-chips">{task.hosts.map(name => <button key={name} type="button" className="wo-chip" onClick={() => { setHostName(name); setTab('hosts'); setSearch('') }}>{name} ↗</button>)}</div>
      {task.instruction && <p className="wo-task-instruction">{task.instruction}</p>}
      {task.sudo && <small className="wo-muted">已授权此任务的只读采集使用 sudo</small>}
      {task.scheduled.map(row => <div className="wo-scheduled" key={row.id}><span>下次 {date(row.scheduledAt)}<small>汇报至 {sessions?.byId[row.sessionId]?.displayTitle ?? row.sessionId}</small></span><button disabled={busy} onClick={() => void schedule(task, row.sessionId, false)}>停用</button></div>)}
      <div className="wo-task-actions"><button disabled={busy || !data?.schedulerAvailable || !selectedSession || !task.schedule} title={!selectedSession ? '请先选择汇报会话' : !task.schedule ? '此任务未设置运行时间' : ''} onClick={() => void schedule(task, selectedSession, true)}>启用调度</button>{task.editable && <><button disabled={busy || task.scheduled.length > 0} onClick={() => setModal({ type: 'task', task })}>编辑</button><button disabled={busy || task.scheduled.length > 0} className="wo-text-button" onClick={() => setModal({ type: 'delete', kind: 'Task', name: task.name })}>删除</button></>}{!task.editable && <small className="wo-muted">来自 YAML 配置</small>}</div>
    </article>
  }
  return <main className={`wo-root${props.sidebar ? ' wo-sidebar' : ''}`}><style>{css}</style><div className="wo-content">
    <header className="wo-header"><div><div className="wo-eyebrow"><span className="wo-logo">W</span> WISPOPS <span className="wo-version">0.2</span></div><h1>服务器运维</h1><p>服务器、密码库和例行任务，在一处管理。</p></div><button disabled={busy || loading} onClick={() => void load()}>{loading ? '加载中…' : '↻ 刷新'}</button></header>
    {error && !modal && <div role="alert" className="wo-alert">{error}<button onClick={() => void load()} disabled={loading}>重试</button></div>}
    {notice && <div role="status" className="wo-notice">{notice}</div>}
    {data?.warnings.map(w => <div className="wo-alert" key={w}>{w}</div>)}
    {!data ? <div className="wo-empty">{loading ? '正在读取服务器清单…' : '暂时无法读取管理数据。'}</div> : <>
      <div className="wo-stats"><div><span>管理的服务器</span><strong>{data.hosts.length}<small>台</small></strong></div><div><span>加密凭据</span><strong>{data.vault.entries.length}<small>条</small></strong></div><div><span>已启用的例行任务</span><strong>{data.tasks.filter(t => t.scheduled.length > 0).length}<small>/ {data.tasks.length}</small></strong></div></div>
      <nav className="wo-tabs" aria-label="运维管理">{[['hosts', '服务器', data.hosts.length], ['vault', '密码库', data.vault.entries.length], ['tasks', '例行任务', data.tasks.length]].map(([key, title, n]) => <button key={key} aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'active' : ''} onClick={() => { setTab(String(key)); setSearch('') }}>{title}<span>{n}</span></button>)}</nav>
      <div className="wo-toolbar"><input type="search" aria-label="搜索" placeholder={tab === 'hosts' ? '搜索服务器、地址或分组…' : tab === 'vault' ? '搜索凭据名称或用户名…' : '搜索任务或关联服务器…'} value={search} onChange={e => setSearch(e.target.value)}/><button className="wo-primary" disabled={busy} onClick={() => { setError(''); setModal(tab === 'hosts' ? { type: 'host' } : tab === 'vault' ? { type: 'credential' } : { type: 'task' }) }}>＋ {tab === 'hosts' ? '添加服务器' : tab === 'vault' ? '新增凭据' : '创建例行任务'}</button></div>
      {tab === 'hosts' && <div className="wo-host-layout"><section className="wo-hosts" aria-label="服务器列表">{data.hosts.filter(h => matches(`${h.name} ${h.description ?? ''} ${h.ssh ?? ''} ${h.groups.join(' ')}`)).map(h => <button key={h.name} className={`wo-host-row ${host?.name === h.name ? 'selected' : ''}`} onClick={() => setHostName(h.name)}><div className="wo-host-symbol">▤</div><div><strong>{h.name}</strong><span className="wo-mono">{h.user ? `${h.user}@` : ''}{h.ssh ?? h.name}{h.port ? `:${h.port}` : ''}</span><div className="wo-chips">{h.groups.map(g => <Badge key={g}>{g}</Badge>)}<small>{h.tasks.length} 个任务</small></div></div><span className="wo-chevron">›</span></button>)}{!data.hosts.length && <div className="wo-empty">添加第一台服务器<br/><small>也支持读取已有 YAML 清单。</small></div>}{data.hosts.length > 0 && !data.hosts.some(h => matches(`${h.name} ${h.description ?? ''} ${h.ssh ?? ''} ${h.groups.join(' ')}`)) && <div className="wo-empty">没有匹配的服务器</div>}</section>
      {host && <aside className="wo-detail"><div className="wo-detail-title"><div><span className="wo-eyebrow">SERVER DETAILS</span><h2>{host.name}</h2></div><Badge>{host.auth === 'password' ? '密码登录' : 'SSH 密钥'}</Badge></div>{host.description && <p className="wo-muted">{host.description}</p>}<dl className="wo-facts"><div><dt>连接地址</dt><dd className="wo-mono">{host.ssh ?? host.name}</dd></div><div><dt>用户名 / 端口</dt><dd>{host.user ?? 'SSH 配置'} / {host.port ?? 22}</dd></div>{host.probe && <div><dt>最近探测</dt><dd>{host.probe.os ?? '未知系统'} · {date(host.probe.at)}</dd></div>}</dl>
        <div className="wo-section-title"><h3>关联密码库</h3><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'binding', host }) }}>管理关联</button></div><div className="wo-credential-row"><span>SSH 登录</span><RefLabel value={host.credentials.login}/></div><div className="wo-credential-row"><span>sudo 提权</span><RefLabel value={host.credentials.sudo}/></div><small className="wo-muted wo-block">密码只在建立连接时解密，不会显示给模型。</small>
        <div className="wo-section-title"><h3>例行任务 <span className="wo-muted">{host.tasks.length}</span></h3><button className="wo-text-button" onClick={() => { setError(''); setModal({ type: 'task', host: host.name }) }}>＋ 创建</button></div>{data.tasks.filter(t => t.hosts.includes(host.name)).map(t => <button className="wo-linked-task" key={t.name} onClick={() => { setTab('tasks'); setSearch(t.name) }}><div><strong>{t.description || t.name}</strong><small>{scheduleText(t, data.timeZone)}</small></div><span className={`wo-dot ${t.scheduled.length ? 'good' : ''}`}/></button>)}{!host.tasks.length && <p className="wo-muted">还没有关联任务，可创建定时巡检或安全排查。</p>}
        <div className="wo-section-title"><h3>操作权限</h3></div><div className="wo-chips">{Object.entries(host.policy).map(([key, value]) => <Badge key={key}>{key} · {({ ask: '需审批', allow: '允许', deny: '禁止' } as Record<string, string>)[value]}</Badge>)}</div>
      </aside>}</div>}
      {tab === 'vault' && <><p className="wo-section-note">内置独立密码库 · 加密保存 · 无需安装 WispTerm。留空密码可只更新备注与使用权限。</p><div className="wo-vault-grid">{data.vault.entries.filter(e => matches(`${e.name} ${e.username}`)).map(entry => { const refs = data.hosts.filter(h => [h.credentials.login, h.credentials.sudo].some(r => r?.provider === 'local' && r.name === entry.name)); return <article className="wo-vault-card" key={entry.name}><div className="wo-task-heading"><div><span className="wo-key-symbol">⚿</span><h3>{entry.name}</h3><small>{entry.username || '未设置用户名'}</small></div><Badge tone={entry.agent ? 'good' : 'warn'}>{entry.agent ? '允许自动化' : '禁止自动化'}</Badge></div><div className="wo-secret-mask" aria-label="已加密保存">•••••••••••• <small>已加密</small></div>{entry.note && <p className="wo-muted">{entry.note}</p>}<div className="wo-chips">{refs.map(h => <button className="wo-chip" key={h.name} onClick={() => { setHostName(h.name); setTab('hosts'); setSearch('') }}>{h.name} ↗</button>)}{!refs.length && <small className="wo-muted">尚未关联服务器</small>}</div><div className="wo-task-actions"><button onClick={() => { setError(''); setModal({ type: 'credential', entry }) }}>编辑凭据</button><button className="wo-text-button" disabled={refs.length > 0} title={refs.length ? '请先解除服务器关联' : ''} onClick={() => setModal({ type: 'delete', kind: 'Credential', name: entry.name })}>删除</button></div></article> })}</div>{!data.vault.entries.length && <div className="wo-empty">创建第一条加密凭据<br/><small>然后在服务器详情中关联到 SSH 登录或 sudo。</small></div>}</>}
      {tab === 'tasks' && <><div className="wo-destination"><label>汇报会话 <select aria-label="汇报会话" value={selectedSession} onChange={e => setSessionId(e.target.value)}><option value="">选择接收报告的会话</option>{props.defaultSessionId && !sessions?.byId[props.defaultSessionId] && <option value={props.defaultSessionId}>当前会话</option>}{sessions?.ids.filter(id => !sessions.byId[id]?.parentId).map(id => <option key={id} value={id}>{sessions.byId[id]?.displayTitle ?? id}</option>)}</select></label><small>{data.schedulerAvailable ? '到点唤醒所选会话；DSH 需要保持运行。' : '当前环境未提供调度服务，可使用 /ops-run 手动运行。'}</small></div><div className="wo-task-grid">{data.tasks.filter(t => matches(`${t.name} ${t.description ?? ''} ${t.hosts.join(' ')}`)).map(taskCard)}</div>{!data.tasks.length && <div className="wo-empty">让检查成为例行工作<br/><small>选择服务器、检查内容和运行时间，即可创建任务。</small></div>}</>}
      <footer className="wo-footer">WispOps · 例行任务只采集与汇报，服务器变更仍遵循审批策略。</footer>
    </>}
    {modal && data && <Dialog title={({ host: '添加服务器', credential: modal.type === 'credential' && modal.entry ? '编辑凭据' : '新增加密凭据', binding: '关联服务器凭据', task: modal.type === 'task' && modal.task ? '编辑例行任务' : '创建例行任务', delete: '确认删除' })[modal.type]} close={() => { setModal(null); setError('') }} busy={busy}>
      {error && <div role="alert" className="wo-alert">{error}</div>}
      {modal.type === 'host' && <HostForm busy={busy} submit={value => mutate({ action: 'addHost', host: value, revision: data.revision })}/>}
      {modal.type === 'credential' && <CredentialForm key={modal.entry?.name ?? 'new'} entry={modal.entry} busy={busy} submit={value => mutate({ action: 'saveCredential', credential: value, edit: !!modal.entry, revision: data.vault.revision })}/>}
      {modal.type === 'binding' && <BindingForm host={modal.host} entries={data.vault.entries} busy={busy} submit={value => mutate({ action: 'bindCredentials', host: modal.host.name, binding: value, revision: data.revision })}/>}
      {modal.type === 'task' && <TaskForm data={data} task={modal.task} host={modal.host} busy={busy} submit={value => mutate({ action: 'saveTask', task: value, edit: !!modal.task, revision: data.revision })}/>}
      {modal.type === 'delete' && <><p>删除「{modal.name}」？此操作无法撤销。</p><div className="wo-form-actions"><button onClick={() => setModal(null)} disabled={busy}>取消</button><button className="wo-danger" disabled={busy} onClick={() => void mutate({ action: `delete${modal.kind}`, name: modal.name, revision: modal.kind === 'Task' ? data.revision : data.vault.revision })}>确认删除</button></div></>}
    </Dialog>}
  </div></main>
}

function HostForm({ submit, busy }: { submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); void submit({ name: f.get('name'), ssh: f.get('ssh'), ...(f.get('user') ? { user: f.get('user') } : {}), port: Number(f.get('port')), description: f.get('description'), groups: String(f.get('groups')).split(/[,，\s]+/).filter(Boolean) }) }
  return <form onSubmit={save}><Field title="服务器名称" hint="字母、数字、点、短横线或下划线，如 hk-prod"><input name="name" required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100}/></Field><Field title="SSH 地址或配置别名"><input name="ssh" placeholder="192.0.2.10 或 hk-server" required/></Field><div className="wo-form-grid"><Field title="用户名"><input name="user" placeholder="root"/></Field><Field title="端口"><input name="port" type="number" min="1" max="65535" defaultValue="22" required/></Field></div><Field title="分组" hint="多个分组用逗号分隔"><input name="groups" placeholder="production, web"/></Field><Field title="描述"><input name="description" placeholder="香港业务服务器"/></Field><p className="wo-muted">添加后可关联登录和 sudo 凭据；不填写密码时使用现有 SSH 密钥配置。</p><div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? '保存中…' : '添加服务器'}</button></div></form>
}
function CredentialForm({ entry, submit, busy }: { entry?: Credential; submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const password = useRef<HTMLInputElement>(null)
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    const value = { name: f.get('name'), username: f.get('username'), note: f.get('note'), agent: f.has('agent'), ...(f.get('password') ? { password: f.get('password') } : {}) }
    // Remove plaintext from the form immediately after submitting, including on failures.
    if (password.current) password.current.value = ''
    void submit(value)
  }
  return <form onSubmit={save} autoComplete="off"><Field title="凭据名称"><input name="name" defaultValue={entry?.name} readOnly={!!entry} required maxLength={100}/></Field><Field title="用户名" hint="用于识别凭据；服务器连接用户名在服务器配置中设置"><input name="username" defaultValue={entry?.username} autoComplete="off"/></Field><Field title={entry ? '新密码（留空则保留原密码）' : '密码'}><input ref={password} type="password" name="password" required={!entry} autoComplete="new-password" maxLength={16384}/></Field><Field title="备注"><textarea name="note" defaultValue={entry?.note} rows={2}/></Field><label className="wo-check"><input type="checkbox" name="agent" defaultChecked={entry?.agent ?? true}/>允许运维工具及例行任务使用此凭据</label><p className="wo-muted">仅在连接服务器时解密使用，页面和模型均无法读取已保存的密码。</p><div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? '加密保存中…' : '加密保存'}</button></div></form>
}
function BindingForm({ host, entries, submit, busy }: { host: Host; entries: Credential[]; submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [auth, setAuth] = useState(host.auth ?? 'key')
  function options(current?: string) { return <><option value="">不使用密码库凭据</option>{current && !entries.some(e => `local:${e.name}` === current) && <option value={current}>{current}（当前关联）</option>}{entries.map(e => <option key={e.name} value={`local:${e.name}`}>{e.name}{e.agent ? '' : '（禁止自动化）'}</option>)}</> }
  return <form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void submit({ auth, loginSecret: f.get('loginSecret') ?? '', sudoSecret: f.get('sudoSecret') ?? '' }) }}><p className="wo-muted">服务器：{host.name}</p><Field title="SSH 登录方式"><select value={auth} onChange={e => setAuth(e.target.value as 'key' | 'password')}><option value="key">SSH 密钥 / SSH 配置</option><option value="password">密码登录</option></select></Field><Field title="SSH 登录凭据"><select name="loginSecret" defaultValue={host.loginSecret ?? ''} required={auth === 'password'} disabled={auth === 'key'}>{options(host.loginSecret)}</select></Field><Field title="sudo 凭据" hint="未关联时使用免密 sudo；是否允许 sudo 仍由服务器策略决定。"><select name="sudoSecret" defaultValue={host.sudoSecret ?? ''}>{options(host.sudoSecret)}</select></Field>{!entries.length && <p className="wo-alert">密码库为空，请先在“密码库”页新增凭据。</p>}<div className="wo-form-actions"><button className="wo-primary" disabled={busy}>{busy ? '保存中…' : '保存关联'}</button></div></form>
}
function TaskForm({ data, task, host, submit, busy }: { data: Snapshot; task?: Task; host?: string; submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [selected, setSelected] = useState(task?.hosts ?? (host ? [host] : []))
  const [playbook, setPlaybook] = useState(task?.playbook ?? 'inspect')
  const [frequency, setFrequency] = useState(task?.schedule?.everyMinutes ? 'interval' : task?.schedule?.cron ? 'cron' : task?.schedule?.weekdays?.length ? 'weekly' : 'daily')
  const [days, setDays] = useState(task?.schedule?.weekdays ?? [1, 2, 3, 4, 5])
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    const schedule = { timeZone: f.get('zone'), ...(frequency === 'interval' ? { everyMinutes: Number(f.get('interval')) } : frequency === 'cron' ? { cron: f.get('cron') } : { daily: f.get('time'), ...(frequency === 'weekly' ? { weekdays: days } : {}) }) }
    void submit({ name: f.get('name'), description: f.get('description'), targets: selected.join(','), playbook, instruction: f.get('instruction'), schedule, sudo: f.has('sudo'), ...(playbook === 'disk' || playbook === 'new-files' ? { paths: String(f.get('paths')).split(/[,，\n]+/).map(s => s.trim()).filter(Boolean) } : {}), ...(playbook === 'new-files' ? { days: Number(f.get('days')) } : {}), ...(playbook === 'security' ? { hours: Number(f.get('hours')) } : {}) })
  }
  return <form onSubmit={save}><div className="wo-form-grid"><Field title="任务名称" hint="唯一标识，如 hk-daily"><input name="name" defaultValue={task?.name} readOnly={!!task} required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100}/></Field><Field title="显示标题"><input name="description" defaultValue={task?.description} placeholder="香港服务器每日巡检"/></Field></div><fieldset className="wo-server-picks"><legend>关联服务器 · 已选 {selected.length} 台</legend>{data.hosts.map(h => <label className="wo-check" key={h.name}><input type="checkbox" checked={selected.includes(h.name)} onChange={e => setSelected(e.target.checked ? [...selected, h.name] : selected.filter(n => n !== h.name))}/>{h.name}<small>{h.ssh}</small></label>)}{!data.hosts.length && <p>请先添加服务器。</p>}</fieldset><Field title="检查内容"><select value={playbook} onChange={e => setPlaybook(e.target.value)}>{Object.entries(playbooks).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field><Field title="报告要求" hint="描述关注的服务、指标，以及希望怎样汇报。"><textarea name="instruction" defaultValue={task?.instruction} required={playbook === 'custom'} rows={3} placeholder="检查失败的服务、磁盘增长和异常登录，汇报与上次相比的变化。"/></Field>{(playbook === 'disk' || playbook === 'new-files') && <Field title="扫描路径" hint="绝对路径，多个路径用逗号分隔"><input name="paths" defaultValue={task?.paths?.join(', ') ?? (playbook === 'disk' ? '/' : '/data')} required/></Field>}{playbook === 'new-files' && <Field title="最近多少天"><input name="days" type="number" min="1" defaultValue={task?.days ?? 1} required/></Field>}{playbook === 'security' && <Field title="回溯小时数"><input name="hours" type="number" min="1" defaultValue={task?.hours ?? 24} required/></Field>}<div className="wo-form-grid"><Field title="运行频率"><select value={frequency} onChange={e => setFrequency(e.target.value)}><option value="daily">每天</option><option value="weekly">每周</option><option value="interval">固定间隔</option><option value="cron">Cron 表达式</option></select></Field>{frequency === 'interval' ? <Field title="间隔（分钟）"><input name="interval" type="number" min="1" defaultValue={task?.schedule?.everyMinutes ?? 60} required/></Field> : frequency === 'cron' ? <Field title="五段 Cron"><input name="cron" defaultValue={task?.schedule?.cron ?? '0 8 * * *'} required/></Field> : <Field title="运行时间"><input type="time" name="time" defaultValue={task?.schedule?.daily ?? '08:30'} required/></Field>}</div>{frequency === 'weekly' && <div className="wo-weekdays">{weekdays.map((d, i) => <label key={d}><input type="checkbox" checked={days.includes(i + 1)} onChange={e => setDays(e.target.checked ? [...days, i + 1] : days.filter(n => n !== i + 1))}/>{d}</label>)}</div>}<Field title="时区"><input name="zone" defaultValue={task?.schedule?.timeZone ?? data.timeZone} required list="wo-zones"/><datalist id="wo-zones"><option value="Asia/Shanghai"/><option value="America/Los_Angeles"/><option value="UTC"/></datalist></Field><label className="wo-check"><input type="checkbox" name="sudo" defaultChecked={task?.sudo}/>预先授权此任务的只读采集使用 sudo</label><p className="wo-muted">保存后，在例行任务页选择汇报会话并启用调度。</p><div className="wo-form-actions"><button className="wo-primary" disabled={busy || !selected.length || (frequency === 'weekly' && !days.length)}>{busy ? '保存中…' : '保存任务'}</button></div></form>
}
