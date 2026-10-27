import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Api, Snapshot, Task, TaskDraft } from './contracts'
import { renderTemplate } from '../src/task-template-content'
import type { TaskTemplate } from '../src/task-template-content'

const playbooks = { inspect: '健康巡检', disk: '磁盘诊断', 'new-files': '新增文件分析', security: '安全排查', custom: '综合 / 自定义检查' }
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function TaskForm({ data, task, template, host, api, submit, busy }: {
  data: Snapshot; task?: Task; template?: TaskTemplate; host?: string; api: Api
  submit: (value: Record<string, unknown>, parameters?: Record<string, string>) => Promise<void>; busy: boolean
}) {
  const defaults = task ?? template?.definition
  const [parameters, setParameters] = useState<Record<string, string>>(Object.fromEntries(template?.parameters.map(p => [p.key, p.defaultValue ?? '']) ?? []))
  const nameTouched = useRef(false)
  function proposedName(names: string[]) {
    if (!template) return ''
    const base = `${names[0] ?? 'task'}-${template.id.replace(/^builtin\./, '')}`.slice(0, 92)
    let name = base, n = 2
    while (data.tasks.some(t => t.name === name)) name = `${base}-${n++}`
    return name
  }
  const [selected, setSelected] = useState(task?.hosts ?? (host ? [host] : []))
  const [playbook, setPlaybook] = useState(defaults?.playbook ?? 'inspect')
  const [frequency, setFrequency] = useState(defaults?.schedule?.everyMinutes ? 'interval' : defaults?.schedule?.cron ? 'cron' : defaults?.schedule?.weekdays?.length ? 'weekly' : 'daily')
  const [days, setDays] = useState(defaults?.schedule?.weekdays ?? [1, 2, 3, 4, 5])
  const [fields, setFields] = useState({
    name: task?.name ?? proposedName(host ? [host] : []), description: task?.description ?? template?.title ?? '', instruction: task?.instruction ?? '',
    paths: defaults?.paths?.join(', ') ?? (defaults?.playbook === 'new-files' ? '/var/log' : '/'), lookbackDays: defaults?.days ?? 1, hours: defaults?.hours ?? 24,
    time: defaults?.schedule?.daily ?? '08:30', interval: defaults?.schedule?.everyMinutes ?? 60,
    cron: defaults?.schedule?.cron ?? '0 8 * * *', zone: defaults?.schedule?.timeZone ?? data.timeZone, sudo: task?.sudo ?? false,
  })
  const [refreshProbe, setRefreshProbe] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState<TaskDraft>()
  const [error, setError] = useState('')
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const disabled = busy || generating
  const set = <K extends keyof typeof fields>(key: K, value: typeof fields[K]) => setFields(previous => ({ ...previous, [key]: value }))
  function invalidateDraft() {
    if (draft) {
      setFields(previous => ({ ...previous, instruction: '', ...(!task ? { name: '', description: '' } : {}) }))
      setError('服务器或检查内容已变化，请重新生成规则，或手动填写报告要求。')
    }
    setDraft(undefined)
  }
  function changeSelection(names: string[]) {
    setSelected(names); invalidateDraft()
    if (template && !nameTouched.current) set('name', proposedName(names))
  }
  async function generate() {
    if (disabled || !selected.length) return
    setGenerating(true); setError('')
    try {
      const result = await api({ action: 'draftTask', hosts: selected, playbook, refreshProbe }) as TaskDraft
      if (!alive.current) return
      setDraft(result)
      setFields(previous => ({
        ...previous, name: task ? previous.name : result.task.name,
        description: result.task.description ?? '', instruction: result.task.instruction ?? '',
        paths: result.task.paths?.join(', ') ?? previous.paths,
        lookbackDays: result.task.days ?? previous.lookbackDays, hours: result.task.hours ?? previous.hours,
        ...(!task ? { time: result.task.schedule?.daily ?? '08:30', zone: result.task.schedule?.timeZone ?? data.timeZone } : {}),
      }))
      if (!task) setFrequency('daily')
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '生成失败，请重试。') }
    finally { if (alive.current) setGenerating(false) }
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (disabled) return
    const schedule = { timeZone: fields.zone, ...(frequency === 'interval' ? { everyMinutes: fields.interval } : frequency === 'cron' ? { cron: fields.cron } : { daily: fields.time, ...(frequency === 'weekly' ? { weekdays: days } : {}) }) }
    void submit({
      name: fields.name, description: fields.description, targets: selected.join(','), playbook, instruction: fields.instruction, schedule, sudo: fields.sudo,
      ...(['disk', 'new-files'].includes(playbook) ? { paths: fields.paths.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean) } : {}),
      ...(playbook === 'new-files' ? { days: fields.lookbackDays } : {}), ...(playbook === 'security' ? { hours: fields.hours } : {}),
      ...(task?.template ? { template: task.template } : {}),
    }, template ? parameters : undefined)
  }
  return <form onSubmit={save}>
    <fieldset className="wo-form-body" disabled={disabled}>
      <fieldset className="wo-server-picks"><legend>关联服务器 · 已选 {selected.length} 台</legend>
        {data.hosts.map(h => <label className="wo-check" key={h.name}><input type="checkbox" checked={selected.includes(h.name)} onChange={e => changeSelection(e.target.checked ? [...selected, h.name] : selected.filter(n => n !== h.name))}/>{h.name}<small>{h.ssh}</small></label>)}
        {!data.hosts.length && <p>请先添加服务器。</p>}
      </fieldset>
      {template ? <><div className="wo-template-context"><strong>{template.title}</strong><p>{template.description}</p><small>规则已准备好，填写检查对象即可。保存后独立运行。</small></div>{template.parameters.map(p => <Field key={p.key} title={p.label} hint={p.hint}><textarea value={parameters[p.key] ?? ''} onChange={e => setParameters(previous => ({ ...previous, [p.key]: e.target.value }))} required={p.required} maxLength={4000} rows={2}/></Field>)}<details className="wo-template-preview"><summary>查看预设巡查规则</summary><p>{renderTemplate(template, parameters, false)}</p></details></> : <><Field title="检查内容"><select value={playbook} onChange={e => { setPlaybook(e.target.value); invalidateDraft(); if (e.target.value === 'new-files' && fields.paths === '/') set('paths', '/var/log') }}>{Object.entries(playbooks).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <div className="wo-generator">
        <strong>让插件生成巡查规则</strong>
        <p>根据系统能力、历史巡检和告警阈值，自动填好任务名称、检查项及报告要求；生成后仍可编辑。</p>
        <label className="wo-check"><input type="checkbox" checked={refreshProbe} onChange={e => setRefreshProbe(e.target.checked)}/>先连接所选服务器做只读探测</label>
        <small>{refreshProbe ? '探测系统、GPU、调度器和容器能力，可能需要几十秒。' : '使用已保存的探测和巡检记录，不连接服务器。'}</small>
        <button type="button" className="wo-primary" disabled={!selected.length} onClick={() => void generate()}>{generating ? '正在生成…' : '自动生成巡查规则'}</button>
      </div></>}
      {error && <p role="alert" className="wo-alert">{error}</p>}
      {draft && <div className="wo-draft-evidence" role="status"><strong>已生成草稿 · 尚未保存</strong>{draft.evidence.map(item => <p key={item.host}><b>{item.host}</b>：{item.summary}<small>{item.probeAt && `探测：${new Date(item.probeAt).toLocaleString()}`}{item.inspectionAt && ` · 巡检：${new Date(item.inspectionAt).toLocaleString()}`}</small></p>)}{draft.warnings.map(w => <p className="wo-draft-warning" key={w}>{w}</p>)}</div>}
      <div className="wo-form-grid">
        <Field title="任务名称" hint="自动生成或填写唯一标识，如 hk-daily"><input value={fields.name} onChange={e => { nameTouched.current = true; set('name', e.target.value) }} readOnly={!!task} required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100}/></Field>
        <Field title="显示标题"><input value={fields.description} onChange={e => set('description', e.target.value)} placeholder="香港服务器每日巡检"/></Field>
      </div>
      <Field title={template ? '补充要求（可选）' : '报告要求'} hint="可补充关注的指标和汇报方式。"><textarea value={fields.instruction} onChange={e => set('instruction', e.target.value)} required={!template && playbook === 'custom'} rows={draft ? 8 : 3} placeholder={template ? '例如仅详细列出异常项。' : '点击上方自动生成巡查规则，无需手动撰写。'}/></Field>
      {['disk', 'new-files'].includes(playbook) && <Field title="扫描路径" hint="绝对路径，多个路径用逗号分隔"><input value={fields.paths} onChange={e => set('paths', e.target.value)} required/></Field>}
      {playbook === 'new-files' && <Field title="最近多少天"><input type="number" min="1" value={fields.lookbackDays} onChange={e => set('lookbackDays', Number(e.target.value))} required/></Field>}
      {playbook === 'security' && <Field title="回溯小时数"><input type="number" min="1" value={fields.hours} onChange={e => set('hours', Number(e.target.value))} required/></Field>}
      <div className="wo-form-grid">
        <Field title="运行频率"><select value={frequency} onChange={e => setFrequency(e.target.value)}><option value="daily">每天</option><option value="weekly">每周</option><option value="interval">固定间隔</option><option value="cron">Cron 表达式</option></select></Field>
        {frequency === 'interval' ? <Field title="间隔（分钟）"><input type="number" min="1" value={fields.interval} onChange={e => set('interval', Number(e.target.value))} required/></Field> : frequency === 'cron' ? <Field title="五段 Cron"><input value={fields.cron} onChange={e => set('cron', e.target.value)} required/></Field> : <Field title="运行时间"><input type="time" value={fields.time} onChange={e => set('time', e.target.value)} required/></Field>}
      </div>
      {frequency === 'weekly' && <div className="wo-weekdays">{weekdays.map((d, i) => <label key={d}><input type="checkbox" checked={days.includes(i + 1)} onChange={e => setDays(e.target.checked ? [...days, i + 1] : days.filter(n => n !== i + 1))}/>{d}</label>)}</div>}
      <Field title="时区"><input value={fields.zone} onChange={e => set('zone', e.target.value)} required list="wo-zones"/><datalist id="wo-zones"><option value="Asia/Shanghai"/><option value="America/Los_Angeles"/><option value="UTC"/></datalist></Field>
      <label className="wo-check"><input type="checkbox" checked={fields.sudo} onChange={e => set('sudo', e.target.checked)}/>预先授权此任务的只读采集使用 sudo</label>
      <p className="wo-muted">保存后，在例行任务页选择汇报会话并启用调度。</p>
      <div className="wo-form-actions"><button className="wo-primary" disabled={!selected.length || (frequency === 'weekly' && !days.length)}>{busy ? '保存中…' : '保存任务'}</button></div>
    </fieldset>
  </form>
}
