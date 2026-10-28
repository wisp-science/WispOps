/**
 * Per-server recurring tasks: a task binds hosts to a built-in read-only
 * playbook (or a custom instruction) and an optional schedule. Scheduling
 * goes through the host's DSH Schedule service, which wakes the original
 * Session at the due time; the agent then calls `ops_task` and writes the
 * report. Every run is kept so the next report can say what changed.
 * @module dsh-wisp-ops/tasks
 */

import { renderDisk } from './collectors/disk.ts'
import { renderFiles } from './collectors/files.ts'
import { renderSecurity } from './collectors/security.ts'
import type { FsUsage } from './collectors/sections.ts'
import { renderSpace } from './collectors/space.ts'
import type { Config, TaskSpec } from './config.ts'
import type { Authorization } from './store.ts'
import type { OpsService } from './service.ts'
import { renderInspection, renderRuns } from './render.ts'
import { notifyTask, PROBLEM_KEYS } from './notifier.ts'
import type { Delivery } from './notifier.ts'
import { deniedScriptLine, parseScriptResult, renderScriptOutcomes, scriptStore, worstVerdict } from './check-scripts.ts'
import type { ScriptOutcome, ScriptVerdict } from './check-scripts.ts'

export const SCHEDULE_TITLE_PREFIX = 'WispOps: '

export interface TaskRunRecord {
  readonly at: string
  readonly hosts: readonly string[]
  readonly playbook: TaskSpec['playbook']
  /** Problems found, by severity, when the playbook reports findings. */
  readonly counts: Record<string, number>
  /** Head of the collected data, for "what changed since last time". */
  readonly excerpt: string
  /** Per-host verdicts of a check script run (evidence stays in the excerpt). */
  readonly outcomes?: readonly Omit<ScriptOutcome, 'evidence'>[]
  /** Script digest the run used, so a later edit is visible in history. */
  readonly scriptSha256?: string
}

export function hasProblems(record: Pick<TaskRunRecord, 'counts'>): boolean {
  return PROBLEM_KEYS.some(key => (record.counts[key] ?? 0) > 0)
}

/** One line per host (script tasks) or the problem counts, for notifications, the panel and escalations. */
export function summarizeRecord(record: TaskRunRecord): { verdict: ScriptVerdict | 'problems'; summary: string } {
  if (record.outcomes !== undefined && record.outcomes.length > 0) return { verdict: worstVerdict(record.outcomes), summary: record.outcomes.map(o => `${o.host}: ${o.verdict} — ${o.summary}`).join('\n') }
  const counts = Object.entries(record.counts).map(([k, v]) => `${k}=${v}`).join(', ')
  return { verdict: hasProblems(record) ? 'problems' : 'ok', summary: counts || 'no findings' }
}

/**
 * The message a scheduled delivery puts in the Session. `run` has the agent run the task;
 * `last` is the escalation of a WispOps-timer run that already collected and recorded
 * evidence, so the agent only reads it.
 */
export function taskPrompt(task: TaskSpec, mode: 'run' | 'last' = 'run'): string {
  if (mode === 'last') return `[WispOps scheduled task "${task.name}"] WispOps ran this task on its timer and found problems. Call ops_task with name="${task.name}" and mode="last" to read the evidence it already collected (do not run the task again), then write the report it asks for. Do not make changes; recommend actions instead.`
  return `[WispOps scheduled task "${task.name}"] Call ops_task with name="${task.name}", then write the report it asks for. Do not make changes; recommend actions instead.`
}

/** Translate a task schedule into a DSH Schedule create request. */
export function scheduleRequest(task: TaskSpec, config: Pick<Config, 'timeZone'>): Record<string, unknown> {
  const s = task.schedule
  if (s === undefined) throw new Error(`task "${task.name}" has no schedule`)
  const time_zone = s.timeZone ?? config.timeZone
  const base = { title: `${SCHEDULE_TITLE_PREFIX}${task.name}`.slice(0, 120), prompt: taskPrompt(task) }
  if (s.daily !== undefined) {
    // DSH Schedule takes HH:mm:ss.
    const time = `${s.daily}:00`
    return s.weekdays === undefined || s.weekdays.length === 0
      ? { ...base, daily: { time, time_zone } }
      : { ...base, weekly: { time, time_zone, weekdays: [...new Set(s.weekdays)].sort() } }
  }
  if (s.cron !== undefined) return { ...base, cron: { expression: s.cron, time_zone } }
  return { ...base, every_seconds: (s.everyMinutes ?? 60) * 60 }
}

export function describeSchedule(task: TaskSpec, config: Pick<Config, 'timeZone'>): string {
  const s = task.schedule
  if (s === undefined) return 'on demand'
  const zone = s.timeZone ?? config.timeZone
  if (s.daily !== undefined) return s.weekdays === undefined ? `daily ${s.daily} ${zone}` : `${s.daily} ${zone} on ISO weekdays ${s.weekdays.join(',')}`
  if (s.cron !== undefined) return `cron "${s.cron}" ${zone}`
  return `every ${s.everyMinutes} min`
}

const REPORT_GUIDE = `Report format (use the user's language):
1. One status line: overall healthy / needs attention / urgent, with the count of affected hosts.
2. What changed since the previous run (new problems, resolved problems, growth), if a previous run exists.
3. Findings by severity, each with host, evidence (numbers, paths, processes), and likely cause.
4. Recommended actions, ordered by urgency, each marked read-only check / change needing approval.
Keep it short enough to read on a phone; put long lists in an appendix.`

/** Run one task's playbook and return model-facing text plus a run record. */
export async function runTask(service: OpsService, task: TaskSpec, options: { sudo: boolean; signal?: AbortSignal; session?: string; authorization: Authorization }): Promise<{ text: string; record: TaskRunRecord; previous?: TaskRunRecord }> {
  const hosts = service.select(task.targets)
  const common = { sudo: options.sudo, tool: `ops_task:${task.name}`, authorization: options.authorization, ...options.signal === undefined ? {} : { signal: options.signal }, ...options.session === undefined ? {} : { session: options.session } }
  const counts: Record<string, number> = {}
  const bump = (key: string, n = 1) => { counts[key] = (counts[key] ?? 0) + n }
  const bumpUsage = (fs: FsUsage | undefined) => {
    if (fs !== undefined && fs.usePct >= service.config.thresholds.diskCritPct) bump('crit')
    else if (fs !== undefined && fs.usePct >= service.config.thresholds.diskWarnPct) bump('warn')
  }
  let body: string
  let outcomes: ScriptOutcome[] | undefined
  let scriptSha256: string | undefined

  switch (task.playbook) {
    case 'inspect': {
      const fleet = await service.inspect(hosts, common)
      for (const [k, v] of Object.entries(fleet.counts)) if (v > 0) bump(k, v)
      body = renderInspection(fleet, true)
      break
    }
    case 'disk': {
      const parts: string[] = []
      for (const host of hosts) {
        for (const path of task.paths ?? ['/']) {
          const { report, result } = await service.disk(host, { ...common, path, depth: 2, top: 15, minFileMb: 100, recentMinFileMb: 10, recentMinutes: 1440, walkTimeoutSec: 120 })
          parts.push(report === undefined ? renderRuns([result], 2000) : renderDisk(host.name, report))
          if (report === undefined) bump('unreachable')
          else if (report.walkIncomplete || !report.filesystem) bump('incomplete')
          bumpUsage(report?.filesystem)
        }
      }
      body = parts.join('\n\n')
      break
    }
    case 'space': {
      const parts: string[] = []
      for (const host of hosts) {
        for (const path of task.paths ?? ['/']) {
          // du still walks the whole tree; depth and the kept count only bound what is returned and stored.
          const { report, previous, result } = await service.space(host, { ...common, path, depth: 5, maxDirs: 2000, minKb: 1024, walkTimeoutSec: 300 })
          parts.push(report === undefined ? renderRuns([result], 2000) : renderSpace(host.name, report, previous))
          if (report === undefined) bump('unreachable')
          else if (report.walkIncomplete || !report.filesystem) bump('incomplete')
          bumpUsage(report?.filesystem)
        }
      }
      body = parts.join('\n\n')
      break
    }
    case 'new-files': {
      const parts: string[] = []
      for (const host of hosts) {
        const { report, result } = await service.files(host, { ...common, paths: task.paths ?? ['/'], days: task.days ?? 1, depth: 3, listMinMb: 10, maxFiles: 5000, top: 20, walkTimeoutSec: 300 })
        if (report === undefined) {
          parts.push(renderRuns([result], 2000))
          bump('unreachable')
          continue
        }
        bump('newBytes', report.totalBytes)
        if (report.incompleteRoots.length) bump('incomplete')
        bump('reclaimableBytes', report.plan.reduce((sum, item) => sum + item.reclaimBytes, 0))
        parts.push(renderFiles(host.name, report))
      }
      body = parts.join('\n\n')
      break
    }
    case 'security': {
      const hours = task.hours ?? 24
      const results = await service.security(hosts, hours, common)
      body = results.map(r => {
        if (r.report === undefined) {
          bump('unreachable')
          return renderRuns([r.result], 2000)
        }
        for (const f of r.report.findings) bump(f.severity)
        return renderSecurity(r.host, r.report, hours)
      }).join('\n\n')
      break
    }
    case 'script': {
      const script = (await scriptStore(service.config.dataDir).read()).value.entries.find(entry => entry.id === task.script)
      if (script === undefined) {
        bump('incomplete')
        body = `Check script "${task.script}" is not in the script library; the owner removed or renamed it. Nothing ran.`
        break
      }
      // The deny list is the last word for a script exactly as it is for commands, checked at run time so a later deny rule applies to saved scripts.
      const denied = deniedScriptLine(script.content, service.config.denyPatterns.map(source => new RegExp(source)))
      if (denied !== undefined) throw new Error(`Refused by the dsh-wisp-ops deny list (${denied.source}): check script "${script.id}" line "${denied.line}"`)
      const results = await service.execute(hosts, script.content, { ...common, timeoutMs: script.timeoutSec * 1000, risk: 'read', reason: `task ${task.name} check script ${script.id}`, auditCommand: `(check script ${script.id} sha256:${script.sha256.slice(0, 12)})` })
      outcomes = results.map(parseScriptResult)
      for (const o of outcomes) bump(o.verdict === 'failed' ? 'commandFailed' : o.verdict === 'ok' ? 'ok' : o.verdict)
      scriptSha256 = script.sha256
      body = renderScriptOutcomes(script, outcomes)
      break
    }
    case 'custom':
      if (task.commands?.length) {
        body = ''
        break
      }
      bump('incomplete')
      body = `No built-in collector: gather the evidence yourself with read-only ops_exec / ops_inspect calls on ${hosts.map(h => h.name).join(', ')}.`
      break
  }

  // The task's own read-only commands, validated at load time, run after the collector so a
  // custom task carries real evidence instead of asking the model to collect it.
  if (task.commands?.length) {
    const unreachable = new Set<string>()
    const parts: string[] = []
    for (const [index, command] of task.commands.entries()) {
      const results = await service.execute(hosts, command, { ...common, timeoutMs: service.config.limits.defaultTimeoutMs, risk: 'read', reason: `task ${task.name} command ${index + 1}` })
      for (const r of results) {
        if (r.status === 'failed') bump('commandFailed')
        else if (r.status !== 'ok') unreachable.add(r.host)
      }
      parts.push(`### Command ${index + 1}: ${command}\n${renderRuns(results, 4000)}`)
    }
    if (unreachable.size && task.playbook === 'custom') bump('unreachable', unreachable.size)
    body = `${body ? `${body}\n\n` : ''}## Read-only commands (${task.commands.length})\nExit status other than 0 counts as commandFailed; interpret it against the user's instruction.\n\n${parts.join('\n\n')}`
  }

  const history = await service.store.readBounded<TaskRunRecord>('tasks', task.name)
  const previous = history.at(-1)
  const record: TaskRunRecord = {
    at: new Date().toISOString(), hosts: hosts.map(h => h.name), playbook: task.playbook, counts, excerpt: body.slice(0, 6000),
    ...outcomes === undefined ? {} : { outcomes: outcomes.map(({ evidence: _evidence, ...rest }) => rest) },
    ...scriptSha256 === undefined ? {} : { scriptSha256 },
  }
  await service.store.appendBounded('tasks', task.name, record, 90)
  const deliveries = await notifyTask(service.config, task, record, options.signal, fetch, { ...previous === undefined ? {} : { previous }, timeZone: task.schedule?.timeZone ?? service.config.timeZone })
  if (deliveries.length) await service.store.appendBounded('notifications', task.name, { at: record.at, deliveries }, 90)
  return { text: taskText(task, record, body, previous, deliveries), record, ...previous === undefined ? {} : { previous } }
}

/** The model-facing text of a run: header, the user's instruction, the data, and the previous run to compare with. */
export function taskText(task: TaskSpec, record: TaskRunRecord, body: string, previous?: TaskRunRecord, deliveries: readonly Delivery[] = []): string {
  const header = [
    `# WispOps task "${task.name}" (${task.playbook}) on ${record.hosts.join(', ')} — ${record.at}`,
    task.description === undefined ? undefined : `Description: ${task.description}`,
    task.instruction === undefined ? undefined : `What the user wants from this task: ${task.instruction}`,
    previous === undefined
      ? 'No previous run recorded.'
      : `Previous run ${previous.at}: ${Object.entries(previous.counts).map(([k, v]) => `${k}=${v}`).join(', ') || 'no findings'}. Its excerpt follows the current data for comparison.`,
    REPORT_GUIDE,
    deliveries.length ? `Notifications: ${deliveries.map(d => `${d.channel}: ${d.status}${d.detail ? ` (${d.detail})` : ''}`).join('; ')}` : undefined,
  ].filter(Boolean).join('\n')
  const tail = previous === undefined ? '' : `\n\n---\nPrevious run excerpt (${previous.at}):\n${previous.excerpt.slice(0, 2500)}`
  return `${header}\n\n${body}${tail}`
}

/** The last recorded run as the agent would have seen it, without running anything: evidence is the stored excerpt. */
export async function lastTaskText(service: OpsService, task: TaskSpec): Promise<{ text: string; record?: TaskRunRecord }> {
  const history = await service.store.readBounded<TaskRunRecord>('tasks', task.name)
  const record = history.at(-1)
  if (record === undefined) return { text: `Task "${task.name}" has no recorded run yet; call ops_task with mode="run" to run it.` }
  const previous = history.at(-2)
  return { text: taskText(task, record, `${record.excerpt}\n\n(Recorded run; evidence above is the stored excerpt of what WispOps collected at ${record.at}.)`, previous), record }
}
