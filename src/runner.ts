/**
 * The WispOps timer: runs tasks whose report mode is `problems` or `never` inside the
 * plugin, so a green run costs no model tokens. Each run is recorded and notified exactly
 * like an agent-driven run; a `problems` run that found something queues a short prompt
 * into the owner's chosen session, where the agent reads the stored evidence with
 * `ops_task mode=last` instead of collecting it again.
 * @module dsh-wisp-ops/runner
 */
import { join } from 'node:path'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { TaskSpec } from './config.ts'
import { LocalState } from './local-state.ts'
import { dueNow, nextDue } from './schedule.ts'
import type { OpsService } from './service.ts'
import { hasProblems, runTask, taskPrompt } from './tasks.ts'
import type { TaskRunRecord } from './tasks.ts'

export interface TimerEntry {
  /** Session that receives escalations; absent for `never`. */
  sessionId?: string
  enabledAt: string
  /** A `problems` run whose escalation could not be delivered yet (session not open). */
  pendingEscalation?: string
  /** Why the latest attempt did not run or escalate; never credentials or output. */
  lastError?: string
}
export interface TimerState { version: 1; tasks: Record<string, TimerEntry> }

export interface AgentLookup { (sessionId: string): { followup(message: unknown): void } | undefined }

export function timerStore(dataDir: string) {
  return new LocalState<TimerState>(join(dataDir, 'task-timer.json'), () => ({ version: 1, tasks: {} }), value => {
    const raw = value as TimerState
    if (raw?.version !== 1 || !raw.tasks || typeof raw.tasks !== 'object' || Array.isArray(raw.tasks)) throw new Error('Invalid task timer state')
    const tasks: Record<string, TimerEntry> = {}
    for (const [name, entry] of Object.entries(raw.tasks)) {
      if (!entry || typeof entry.enabledAt !== 'string') throw new Error('Invalid task timer entry')
      tasks[name] = { enabledAt: entry.enabledAt, ...typeof entry.sessionId === 'string' ? { sessionId: entry.sessionId } : {}, ...typeof entry.pendingEscalation === 'string' ? { pendingEscalation: entry.pendingEscalation } : {}, ...typeof entry.lastError === 'string' ? { lastError: entry.lastError } : {} }
    }
    return { version: 1, tasks }
  })
}

/** Runs on the WispOps timer: defined, enabled here, and not reporting through a DSH schedule. */
export function timerTask(task: TaskSpec | undefined): task is TaskSpec {
  return task !== undefined && task.report !== undefined && task.report !== 'always'
}

export class TaskRunner {
  readonly state
  private readonly running = new Set<string>()
  constructor(private readonly service: OpsService, private readonly agents?: AgentLookup, private readonly now: () => number = Date.now) {
    this.state = timerStore(service.config.dataDir)
  }

  /** Start ticking; the returned function stops the timer. */
  start(intervalMs = 60_000): () => void {
    const tick = () => { void this.tick().catch(() => {}) }
    const timer = setInterval(tick, intervalMs)
    timer.unref()
    tick()
    return () => clearInterval(timer)
  }

  async enable(name: string, sessionId: string | undefined): Promise<void> {
    await this.edit(state => { state.tasks[name] = { enabledAt: new Date(this.now()).toISOString(), ...sessionId === undefined ? {} : { sessionId } } })
  }
  async disable(name: string): Promise<void> {
    await this.edit(state => { delete state.tasks[name] })
  }
  async entries(): Promise<Record<string, TimerEntry>> {
    return (await this.state.read()).value.tasks
  }
  /** What the panel shows for an enabled task: the next slot and any pending escalation or error. */
  async status(task: TaskSpec, lastRun: string | undefined): Promise<(TimerEntry & { nextAt?: string }) | undefined> {
    const entry = (await this.entries())[task.name]
    if (entry === undefined) return undefined
    const next = task.schedule === undefined ? undefined : nextDue(task.schedule, this.service.config.timeZone, lastRun, entry.enabledAt, this.now())
    return { ...entry, ...next === undefined ? {} : { nextAt: new Date(next).toISOString() } }
  }

  /** One pass: deliver pending escalations, then run every enabled task whose slot is due. */
  async tick(): Promise<void> {
    await this.service.refresh()
    const entries = await this.entries()
    for (const [name, entry] of Object.entries(entries)) {
      const task = this.service.inventory.tasks.get(name)
      if (!timerTask(task)) {
        // Deleted, or edited back to agent reporting: the timer forgets it rather than running a stale definition.
        await this.disable(name).catch(() => {})
        continue
      }
      if (entry.pendingEscalation !== undefined) await this.escalate(task, entry.sessionId)
      if (task.schedule === undefined || this.running.has(name)) continue
      const lastRun = (await this.service.store.readBounded<TaskRunRecord>('tasks', name)).at(-1)?.at
      if (!dueNow(task.schedule, this.service.config.timeZone, lastRun, entry.enabledAt, this.now())) continue
      await this.run(task, entry.sessionId)
    }
  }

  /** Run a timer task now: record, notify, and escalate when the mode asks for it. Errors are kept per task, never thrown to the timer. */
  async run(task: TaskSpec, sessionId: string | undefined): Promise<{ record?: TaskRunRecord; escalated: boolean; error?: string }> {
    if (this.running.has(task.name)) return { escalated: false, error: '任务正在运行。' }
    this.running.add(task.name)
    try {
      const hosts = this.service.select(task.targets)
      // Fail closed on sudo exactly as the tool gate does; the task definition is the authorization for everything else.
      const refused = task.sudo === true ? hosts.filter(h => h.policy.sudo === 'deny').map(h => h.name) : []
      if (refused.length > 0) throw new Error(`host policy denies sudo on ${refused.join(', ')}`)
      const { record } = await runTask(this.service, task, { sudo: task.sudo === true, authorization: 'task' })
      const escalate = task.report === 'problems' && hasProblems(record)
      await this.edit(state => {
        const entry = state.tasks[task.name]
        if (entry === undefined) return
        delete entry.lastError
        if (escalate) entry.pendingEscalation = record.at
      })
      const escalated = escalate ? await this.escalate(task, sessionId) : false
      return { record, escalated }
    } catch (error) {
      const message = (error instanceof Error ? error.message : String(error)).slice(0, 300)
      await this.edit(state => { const entry = state.tasks[task.name]; if (entry !== undefined) entry.lastError = message }).catch(() => {})
      return { escalated: false, error: message }
    } finally {
      this.running.delete(task.name)
    }
  }

  /** Queue the "read the evidence" prompt; a closed session keeps the escalation pending for the next tick. */
  private async escalate(task: TaskSpec, sessionId: string | undefined): Promise<boolean> {
    const agent = sessionId === undefined ? undefined : this.agents?.(sessionId)
    if (agent === undefined) {
      await this.edit(state => { const entry = state.tasks[task.name]; if (entry !== undefined) entry.lastError = sessionId === undefined ? '未设置汇报会话，无法通知 agent。' : '汇报会话未打开，发现问题后将在会话打开时通知 agent。' }).catch(() => {})
      return false
    }
    agent.followup(createUserMessage({ content: [{ type: 'text', text: taskPrompt(task, 'last') }], source: { kind: 'user' } }))
    await this.edit(state => { const entry = state.tasks[task.name]; if (entry !== undefined) { delete entry.pendingEscalation; delete entry.lastError } }).catch(() => {})
    return true
  }

  private async edit(update: (state: TimerState) => void): Promise<void> {
    const { revision } = await this.state.read()
    await this.state.change(revision, state => { update(state); return state })
  }
}
