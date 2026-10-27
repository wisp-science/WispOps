import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { TaskTemplate } from '../src/task-template-content'

function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <label className="wo-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function TemplateForm({ template, copy, zone, busy, submit }: { template?: TaskTemplate; copy?: boolean; zone: string; busy: boolean; submit: (value: TaskTemplate) => Promise<void> }) {
  const [playbook, setPlaybook] = useState(template?.definition.playbook ?? 'inspect')
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
  return <form onSubmit={save}><fieldset className="wo-form-body" disabled={busy}>
    <p className="wo-section-note">保存到任务库后，可以随时关联一台或多台服务器。此处不启用调度。</p>
    <div className="wo-form-grid"><Field title="模板标识" hint="如 daily-health"><input name="id" required pattern="[A-Za-z0-9][A-Za-z0-9._\-]*" maxLength={80} defaultValue={copy ? `${template?.id.replace(/^builtin\./, '')}-copy` : template?.id} readOnly={!!template && !copy}/></Field><Field title="模板标题"><input name="title" required defaultValue={template ? `${template.title}${copy ? '（副本）' : ''}` : ''} maxLength={120}/></Field></div>
    <Field title="分类"><input name="category" defaultValue={template?.category ?? '自定义'} required list="wo-categories"/><datalist id="wo-categories"><option value="基础运维"/><option value="安全"/><option value="应用服务"/><option value="数据管理"/><option value="计算集群"/></datalist></Field>
    <Field title="简要说明"><input name="description" defaultValue={template?.description} maxLength={1000}/></Field>
    <Field title="检查内容"><select value={playbook} onChange={e => setPlaybook(e.target.value as typeof playbook)}><option value="inspect">健康巡检</option><option value="disk">磁盘诊断</option><option value="new-files">新增文件分析</option><option value="security">安全排查</option><option value="custom">自定义检查</option></select></Field>
    <Field title="巡查规则" hint="也可先复制预设，再调整检查项。"><textarea name="instruction" required rows={6} maxLength={30000} defaultValue={template?.definition.instruction ?? '检查服务器健康数据，报告异常指标、与上次相比的变化及建议；资料不足时明确说明。只采集和汇报，不修改服务器。'}/></Field>
    {!!template?.parameters.length && <p className="wo-section-note">关联服务器时填写参数：{template.parameters.map(p => `${p.label}（{{${p.key}}}）`).join('、')}。修改规则时保留所需占位符。</p>}
    {['disk', 'new-files'].includes(playbook) && <Field title="默认扫描路径" hint="绝对路径，多个用逗号分隔"><input name="paths" required defaultValue={template?.definition.paths?.join(', ') ?? (playbook === 'new-files' ? '/var/log' : '/')}/></Field>}
    {playbook === 'new-files' && <Field title="默认回溯天数"><input name="days" type="number" min={1} required defaultValue={template?.definition.days ?? 1}/></Field>}
    {playbook === 'security' && <Field title="默认回溯小时数"><input name="hours" type="number" min={1} required defaultValue={template?.definition.hours ?? 24}/></Field>}
    <div className="wo-form-grid"><Field title="建议每日运行时间"><input name="time" type="time" defaultValue={template?.definition.schedule?.daily ?? '08:30'} required/></Field><Field title="时区"><input name="zone" defaultValue={template?.definition.schedule?.timeZone ?? zone} required/></Field></div>
    <p className="wo-muted">关联时可改成每周、固定间隔或 Cron。修改模板不影响已关联任务。</p>
    <div className="wo-form-actions"><button className="wo-primary">{busy ? '保存中…' : '保存到任务库'}</button></div>
  </fieldset></form>
}
