import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Api, Snapshot, Task, TaskDraft } from './contracts'

const playbooks = { inspect: '健康巡检', disk: '磁盘诊断', 'new-files': '新增文件分析', security: '安全排查', custom: '综合 / 自定义检查' }
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function TaskForm({ data, task, host, api, submit, busy }: {
  data: Snapshot; task?: Task; host?: string; api: Api
  submit: (value: Record<string, unknown>) => Promise<void>; busy: boolean
}) {
  const [selected, setSelected] = useState(task?.hosts ?? (host ? [host] : []))
  const [playbook, setPlaybook] = useState(task?.playbook ?? 'inspect')
  const [frequency, setFrequency] = useState(task?.schedule?.everyMinutes ? 'interval' : task?.schedule?.cron ? 'cron' : task?.schedule?.weekdays?.length ? 'weekly' : 'daily')
  const [days, setDays] = useState(task?.schedule?.weekdays ?? [1, 2, 3, 4, 5])
  const [fields, setFields] = useState({
    name: task?.name ?? '', description: task?.description ?? '', instruction: task?.instruction ?? '',
    paths: task?.paths?.join(', ') ?? (task?.playbook === 'new-files' ? '/var/log' : '/'), lookbackDays: task?.days ?? 1, hours: task?.hours ?? 24,
    time: task?.schedule?.daily ?? '08:30', interval: task?.schedule?.everyMinutes ?? 60,
    cron: task?.schedule?.cron ?? '0 8 * * *', zone: task?.schedule?.timeZone ?? data.timeZone, sudo: task?.sudo ?? false,
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
    })
  }
  return <form onSubmit={save}>
    <fieldset className="wo-form-body" disabled={disabled}>
      <fieldset className="wo-server-picks"><legend>关联服务器 · 已选 {selected.length} 台</legend>
        {data.hosts.map(h => <label className="wo-check" key={h.name}><input type="checkbox" checked={selected.includes(h.name)} onChange={e => changeSelection(e.target.checked ? [...selected, h.name] : selected.filter(n => n !== h.name))}/>{h.name}<small>{h.ssh}</small></label>)}
        {!data.hosts.length && <p>请先添加服务器。</p>}
      </fieldset>
      <Field title="检查内容"><select value={playbook} onChange={e => { setPlaybook(e.target.value); invalidateDraft(); if (e.target.value === 'new-files' && fields.paths === '/') set('paths', '/var/log') }}>{Object.entries(playbooks).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <div className="wo-generator">
        <strong>让插件生成巡查规则</strong>
        <p>根据系统能力、历史巡检和告警阈值，自动填好任务名称、检查项及报告要求；生成后仍可编辑。</p>
        <label className="wo-check"><input type="checkbox" checked={refreshProbe} onChange={e => setRefreshProbe(e.target.checked)}/>先连接所选服务器做只读探测</label>
        <small>{refreshProbe ? '探测系统、GPU、调度器和容器能力，可能需要几十秒。' : '使用已保存的探测和巡检记录，不连接服务器。'}</small>
        <button type="button" className="wo-primary" disabled={!selected.length} onClick={() => void generate()}>{generating ? '正在生成…' : '自动生成巡查规则'}</button>
      </div>
      {error && <p role="alert" className="wo-alert">{error}</p>}
      {draft && <div className="wo-draft-evidence" role="status"><strong>已生成草稿 · 尚未保存</strong>{draft.evidence.map(item => <p key={item.host}><b>{item.host}</b>：{item.summary}<small>{item.probeAt && `探测：${new Date(item.probeAt).toLocaleString()}`}{item.inspectionAt && ` · 巡检：${new Date(item.inspectionAt).toLocaleString()}`}</small></p>)}{draft.warnings.map(w => <p className="wo-draft-warning" key={w}>{w}</p>)}</div>}
      <div className="wo-form-grid">
        <Field title="任务名称" hint="自动生成或填写唯一标识，如 hk-daily"><input value={fields.name} onChange={e => set('name', e.target.value)} readOnly={!!task} required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100}/></Field>
        <Field title="显示标题"><input value={fields.description} onChange={e => set('description', e.target.value)} placeholder="香港服务器每日巡检"/></Field>
      </div>
      <Field title="报告要求" hint="可自动生成，也可以补充关注的服务、指标和汇报方式。"><textarea value={fields.instruction} onChange={e => set('instruction', e.target.value)} required={playbook === 'custom'} rows={draft ? 8 : 3} placeholder="点击上方自动生成巡查规则，无需手动撰写。"/></Field>
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
