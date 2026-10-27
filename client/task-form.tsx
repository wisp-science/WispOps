import { tr } from './i18n'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Api, Snapshot, Task, TaskDraft } from './contracts'
import { renderTemplate } from '../src/task-template-content'
import type { TaskTemplate } from '../src/task-template-content'
import { PanelIcon } from './panel-icon'

const getPlaybooks = (): Record<string, string> => ({ inspect: tr("health.inspection"), disk: tr("disk.diagnosis"), 'new-files': tr("recent.files"), security: tr("security.triage"), custom: tr("combined.custom.checks") })
const getWeekdays = () => [tr("mon"), tr("tue"), tr("wed"), tr("thu"), tr("fri"), tr("sat"), tr("sun")]
function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}
function TaskToggle({ title, hint, checked, onChange, disabled }: { title: string; hint: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const hintId = useId()
  return <label className={`wo-task-option${disabled ? ' is-disabled' : ''}`}>
    <span><strong>{title}</strong><small id={hintId}>{hint}</small></span>
    <input className="wo-task-switch" type="checkbox" role="switch" aria-label={title} aria-describedby={hintId} checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)}/>
  </label>
}

export function TaskForm({ data, task, template, fixedHost, api, submit, busy }: {
  data: Snapshot; task?: Task; template?: TaskTemplate; fixedHost?: string; api: Api
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
  const [selectedHosts, setSelected] = useState(task?.hosts ?? [])
  // The server-details entry point fixes both rule generation and saving to this server.
  const selected = fixedHost ? [fixedHost] : selectedHosts
  const [notify, setNotify] = useState(task?.notify ?? [])
  const [notifyOnlyProblems, setNotifyOnlyProblems] = useState(task?.notifyOnlyProblems ?? true)
  const notificationChannels = data.notificationChannels ?? []
  const notificationsId = useId()
  const [playbook, setPlaybook] = useState(defaults?.playbook ?? 'inspect')
  const [frequency, setFrequency] = useState(task && !task.schedule ? 'manual' : defaults?.schedule?.everyMinutes ? 'interval' : defaults?.schedule?.cron ? 'cron' : defaults?.schedule?.weekdays?.length ? 'weekly' : 'daily')
  const [days, setDays] = useState(defaults?.schedule?.weekdays ?? [1, 2, 3, 4, 5])
  const [fields, setFields] = useState({
    name: task?.name ?? proposedName(selected), description: task?.description ?? template?.title ?? '', instruction: task?.instruction ?? '',
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
      setError(tr("servers.or.checks.changed.regenerate.rules"))
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
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : tr("generation.failed.please.retry")) }
    finally { if (alive.current) setGenerating(false) }
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (disabled) return
    const schedule = frequency === 'manual' ? undefined : { timeZone: fields.zone, ...(frequency === 'interval' ? { everyMinutes: fields.interval } : frequency === 'cron' ? { cron: fields.cron } : { daily: fields.time, ...(frequency === 'weekly' ? { weekdays: days } : {}) }) }
    void submit({
      name: fields.name, description: fields.description, targets: selected.join(','), playbook, instruction: fields.instruction, ...(schedule ? { schedule } : {}), sudo: fields.sudo,
      notify, notifyOnlyProblems,
      ...(['disk', 'new-files'].includes(playbook) ? { paths: fields.paths.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean) } : {}),
      ...(playbook === 'new-files' ? { days: fields.lookbackDays } : {}), ...(playbook === 'security' ? { hours: fields.hours } : {}),
      ...(task?.template ? { template: task.template } : {}),
    }, template ? parameters : undefined)
  }
  return <form onSubmit={save}>
    <fieldset className="wo-form-body" disabled={disabled}>
      {!fixedHost && <fieldset className="wo-server-picks"><legend>{tr("linked.servers.selected")}{selected.length} {tr("servers.3")}</legend>
        {data.hosts.map(h => <label className="wo-check" key={h.name}><input type="checkbox" checked={selected.includes(h.name)} onChange={e => changeSelection(e.target.checked ? [...selected, h.name] : selected.filter(n => n !== h.name))}/>{h.name}<small>{h.ssh}</small></label>)}
        {!data.hosts.length && <p>{tr("add.a.server.first")}</p>}
      </fieldset>}
      {template ? <><div className="wo-template-context"><strong>{template.title}</strong><p>{template.description}</p><small>{tr("rules.are.ready.specify.the.check")}</small></div>{template.parameters.map(p => <Field key={p.key} title={p.label} hint={p.hint}><textarea value={parameters[p.key] ?? ''} onChange={e => setParameters(previous => ({ ...previous, [p.key]: e.target.value }))} required={p.required} maxLength={4000} rows={2}/></Field>)}<details className="wo-template-preview"><summary>{tr("view.preset.inspection.rules")}</summary><p>{renderTemplate(template, parameters, false)}</p></details></> : <><Field title={tr("checks")}><select value={playbook} onChange={e => { setPlaybook(e.target.value); invalidateDraft(); if (e.target.value === 'new-files' && fields.paths === '/') set('paths', '/var/log') }}>{Object.entries(getPlaybooks()).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <div className="wo-generator">
        <strong>{tr("generate.inspection.rules")}</strong>
        <p>{tr("fill.the.task.name.checks.and")}</p>
        <label className="wo-check"><input type="checkbox" checked={refreshProbe} onChange={e => setRefreshProbe(e.target.checked)}/>{fixedHost ? tr("connect.to.current.server.for.a") : tr("connect.to.selected.servers.for.a")}</label>
        <small>{refreshProbe ? tr("probing.os.gpu.schedulers.and.containers") : tr("use.saved.probes.and.inspection.records")}</small>
        <button type="button" className="wo-primary" disabled={!selected.length} onClick={() => void generate()}>{generating ? tr("generating") : tr("generate.inspection.rules.2")}</button>
      </div></>}
      {error && <p role="alert" className="wo-alert">{error}</p>}
      {draft && <div className="wo-draft-evidence" role="status"><strong>{tr("draft.generated.not.saved")}</strong>{draft.evidence.map(item => <p key={item.host}><b>{item.host}</b>：{item.summary}<small>{item.probeAt && tr("probe", { p0: new Date(item.probeAt).toLocaleString() })}{item.inspectionAt && tr("inspection", { p0: new Date(item.inspectionAt).toLocaleString() })}</small></p>)}{draft.warnings.map(w => <p className="wo-draft-warning" key={w}>{w}</p>)}</div>}
      <div className="wo-form-grid">
        <Field title={tr("task.name")} hint={tr("generate.or.enter.a.unique.identifier")}><input value={fields.name} onChange={e => { nameTouched.current = true; set('name', e.target.value) }} readOnly={!!task} required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={100}/></Field>
        <Field title={tr("display.title")}><input value={fields.description} onChange={e => set('description', e.target.value)} placeholder={tr("daily.inspection.of.the.hong.kong")}/></Field>
      </div>
      <Field title={template ? tr("additional.requirements.optional") : tr("report.requirements")} hint={tr("add.metrics.to.focus.on.and")}><textarea value={fields.instruction} onChange={e => set('instruction', e.target.value)} required={!template && playbook === 'custom'} rows={draft ? 8 : 3} placeholder={template ? tr("for.example.describe.only.abnormal.findings") : tr("use.generate.inspection.rules.above.to")}/></Field>
      {['disk', 'new-files'].includes(playbook) && <Field title={tr("scan.paths")} hint={tr("absolute.paths.separated.by.commas")}><input value={fields.paths} onChange={e => set('paths', e.target.value)} required/></Field>}
      {playbook === 'new-files' && <Field title={tr("look.back.days")}><input type="number" min="1" value={fields.lookbackDays} onChange={e => set('lookbackDays', Number(e.target.value))} required/></Field>}
      {playbook === 'security' && <Field title={tr("look.back.hours")}><input type="number" min="1" value={fields.hours} onChange={e => set('hours', Number(e.target.value))} required/></Field>}
      <div className="wo-form-grid">
        <Field title={tr("frequency")}><select value={frequency} onChange={e => setFrequency(e.target.value)}><option value="manual">{tr("manual.only")}</option><option value="daily">{tr("daily")}</option><option value="weekly">{tr("weekly.2")}</option><option value="interval">{tr("fixed.interval")}</option><option value="cron">{tr("cron.expression")}</option></select></Field>
        {frequency === 'manual' ? <p className="wo-muted wo-manual-hint">{tr("no.run.time.only.run.once")}</p> : frequency === 'interval' ? <Field title={tr("interval.minutes")}><input type="number" min="1" value={fields.interval} onChange={e => set('interval', Number(e.target.value))} required/></Field> : frequency === 'cron' ? <Field title={tr("five.field.cron")}><input value={fields.cron} onChange={e => set('cron', e.target.value)} required/></Field> : <Field title={tr("run.time")}><input type="time" value={fields.time} onChange={e => set('time', e.target.value)} required/></Field>}
      </div>
      {frequency === 'weekly' && <div className="wo-weekdays">{getWeekdays().map((d, i) => <label key={d}><input type="checkbox" checked={days.includes(i + 1)} onChange={e => setDays(e.target.checked ? [...days, i + 1] : days.filter(n => n !== i + 1))}/>{d}</label>)}</div>}
      {frequency !== 'manual' && <Field title={tr("time.zone")}><input value={fields.zone} onChange={e => set('zone', e.target.value)} required list="wo-zones"/><datalist id="wo-zones"><option value="Asia/Shanghai"/><option value="America/Los_Angeles"/><option value="UTC"/></datalist></Field>}
      <div className="wo-task-options">
        <TaskToggle title={tr("task.sudo.title")} hint={tr("task.sudo.hint")} checked={fields.sudo} onChange={value => set('sudo', value)}/>
        <section className="wo-task-notifications" aria-labelledby={notificationsId}>
          <div className="wo-task-options-heading"><h3 id={notificationsId}>{tr("external.notifications")}</h3>{!notificationChannels.length && <span className="wo-task-option-status">{tr("task.notifications.unconfigured")}</span>}</div>
          {notificationChannels.length ? <>
            <div className="wo-task-channels" role="group" aria-labelledby={notificationsId}>{notificationChannels.map(name => <label className={`wo-task-channel${notify.includes(name) ? ' is-selected' : ''}`} key={name}><input type="checkbox" checked={notify.includes(name)} onChange={e => setNotify(e.target.checked ? [...notify, name] : notify.filter(n => n !== name))}/><span>{name}</span></label>)}</div>
            <TaskToggle title={tr("task.notifications.only.problems")} hint={tr("notify.only.on.warnings.failures.or")} checked={notifyOnlyProblems} disabled={!notificationChannels.some(name => notify.includes(name))} onChange={setNotifyOnlyProblems}/>
          </> : <p className="wo-task-notifications-empty">{tr("add.notification.channels.in.the.plugin")}</p>}
        </section>
      </div>
      <div className="wo-task-submit">
        <p className="wo-task-save-note"><PanelIcon kind="info"/><span>{tr("after.saving.choose.a.report.session")}</span></p>
        <button className="wo-primary" disabled={!selected.length || (frequency === 'weekly' && !days.length)}>{busy ? tr("saving") : tr("save.task")}</button>
      </div>
    </fieldset>
  </form>
}
