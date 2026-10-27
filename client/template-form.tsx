import { tr } from './i18n'
import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { TaskTemplate } from '../src/task-template-content'

function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}

const playbookTitle = (playbook: string) => ({ inspect: tr("health.inspection"), disk: tr("disk.diagnosis"), 'new-files': tr("recent.files"), security: tr("security.triage"), custom: tr("custom.checks") } as Record<string, string>)[playbook] ?? playbook

/** `draft` reviews an agent's proposal as a new template; `chat` (new templates only) hands what is filled in so far to a conversation. */
export function TemplateForm({ template, copy, draft, chat, zone, busy, submit }: { template?: TaskTemplate; copy?: boolean; draft?: boolean; chat?: { session: string; send: (prompt: string) => void }; zone: string; busy: boolean; submit: (value: TaskTemplate) => Promise<void> }) {
  const [playbook, setPlaybook] = useState(template?.definition.playbook ?? 'inspect')
  const form = useRef<HTMLFormElement>(null)
  function askInChat() {
    const f = new FormData(form.current!)
    const value = (key: string, fallback = '') => { const text = String(f.get(key) ?? '').trim(); return text === fallback ? '' : text }
    const filled = [[tr("template.title"), value('title')], [tr("category"), value('category', tr("custom.2"))], [tr("short.description"), value('description')], [tr("checks"), playbook === 'inspect' ? '' : playbookTitle(playbook)], [tr("inspection.rules"), value('instruction', tr("inspect.server.health.report.abnormal.metrics"))]]
      .filter(([, text]) => text).map(([label, text]) => `\n- ${label}: ${text}`).join('')
    chat!.send(tr("template.chat.prompt", { p0: filled ? `${tr("template.chat.filled")}${filled}` : '' }))
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    void submit({ id: String(f.get('id')), title: String(f.get('title')), description: String(f.get('description')), category: String(f.get('category')),
      parameters: template?.parameters ?? [],
      definition: { playbook, instruction: String(f.get('instruction')),
        schedule: { daily: String(f.get('time')), timeZone: String(f.get('zone')) },
        ...(['disk', 'new-files'].includes(playbook) ? { paths: String(f.get('paths')).split(/[,，\n]+/).map(s => s.trim()).filter(Boolean) } : {}),
        ...(playbook === 'new-files' ? { days: Number(f.get('days')) } : {}), ...(playbook === 'security' ? { hours: Number(f.get('hours')) } : {}),
      } })
  }
  return <form ref={form} onSubmit={save}><fieldset className="wo-form-body" disabled={busy}>
    <p className="wo-section-note">{tr("save.a.template.then.link.one")}</p>
    <div className="wo-form-grid"><Field title={tr("template.id")} hint={tr("e.g.daily.health")}><input name="id" required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={80} defaultValue={copy ? `${template?.id.replace(/^builtin\./, '')}-copy` : template?.id} readOnly={!!template && !copy && !draft}/></Field><Field title={tr("template.title")}><input name="title" required defaultValue={template ? `${template.title}${copy ? tr("copy") : ''}` : ''} maxLength={120}/></Field></div>
    <Field title={tr("category")}><input name="category" defaultValue={template?.category ?? tr("custom.2")} required list="wo-categories"/><datalist id="wo-categories"><option value={tr("core.operations")}/><option value={tr("security")}/><option value={tr("application.services")}/><option value={tr("data.management")}/><option value={tr("compute.cluster")}/></datalist></Field>
    <Field title={tr("short.description")}><input name="description" defaultValue={template?.description} maxLength={1000}/></Field>
    <Field title={tr("checks")}><select value={playbook} onChange={e => setPlaybook(e.target.value as typeof playbook)}><option value="inspect">{tr("health.inspection")}</option><option value="disk">{tr("disk.diagnosis")}</option><option value="new-files">{tr("recent.files")}</option><option value="security">{tr("security.triage")}</option><option value="custom">{tr("custom.checks")}</option></select></Field>
    <Field title={tr("inspection.rules")} hint={tr("you.can.copy.a.preset.and")}><textarea name="instruction" required rows={6} maxLength={30000} defaultValue={template?.definition.instruction ?? tr("inspect.server.health.report.abnormal.metrics")}/></Field>
    {!!template?.parameters.length && <p className="wo-section-note">{tr("parameters.supplied.when.linking.servers")}{template.parameters.map(p => `${p.label}（{{${p.key}}}）`).join('、')}{tr("keep.the.required.placeholders.when.editing")}</p>}
    {['disk', 'new-files'].includes(playbook) && <Field title={tr("default.scan.paths")} hint={tr("absolute.paths.separated.by.commas.2")}><input name="paths" required defaultValue={template?.definition.paths?.join(', ') ?? (playbook === 'new-files' ? '/var/log' : '/')}/></Field>}
    {playbook === 'new-files' && <Field title={tr("default.look.back.days")}><input name="days" type="number" min={1} required defaultValue={template?.definition.days ?? 1}/></Field>}
    {playbook === 'security' && <Field title={tr("default.look.back.hours")}><input name="hours" type="number" min={1} required defaultValue={template?.definition.hours ?? 24}/></Field>}
    <div className="wo-form-grid"><Field title={tr("suggested.daily.run.time")}><input name="time" type="time" defaultValue={template?.definition.schedule?.daily ?? '08:30'} required/></Field><Field title={tr("time.zone")}><input name="zone" defaultValue={template?.definition.schedule?.timeZone ?? zone} required/></Field></div>
    <p className="wo-muted">{tr("choose.weekly.interval.or.cron.schedules")}</p>
    {chat && <p className="wo-muted">{chat.session ? tr("generate.in.chat.target", { p0: chat.session }) : tr("open.a.session.first")}</p>}
    <div className="wo-form-actions">{chat && <button type="button" disabled={!chat.session} onClick={askInChat}>{tr("generate.in.chat")}</button>}<button className="wo-primary">{busy ? tr("saving") : tr("save.to.task.library")}</button></div>
  </fieldset></form>
}
