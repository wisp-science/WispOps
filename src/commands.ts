/**
 * Human-only slash commands. These are the only way to widen permissions
 * beyond deployment policy: the model cannot invoke a command, and a grant
 * never overrides a policy `deny`.
 * @module dsh-wisp-ops/commands
 */

import type { Context } from '@deepseek-ai/cordis'
import { CommandDefinitionId } from '@deepseek-ai/dsh-commands/brand'
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { TaskSpec } from './config.ts'
import { grantCapabilities } from './gate.ts'
import { describeSchedule, SCHEDULE_TITLE_PREFIX, scheduleRequest, taskPrompt } from './tasks.ts'
import { parseDuration } from './policy.ts'
import type { OpsService } from './service.ts'
import { renderInspection } from './render.ts'

const ALLOW_USAGE = 'Usage: /ops-allow <change|sudo|destructive|all> <hosts|@group|tag:k=v|all> [duration, e.g. 30m, 2h]'

export function parseAllow(rawInput: string, service: OpsService): { capability: string; selector: string; ttlMs: number } | string {
  const words = rawInput.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return ALLOW_USAGE
  const [capability, ...rest] = words as [string, ...string[]]
  const last = rest.at(-1) as string
  const ttl = rest.length > 1 ? parseDuration(last) : undefined
  const selector = (ttl === undefined ? rest : rest.slice(0, -1)).join(',')
  const { defaultTtlMinutes, maxTtlMinutes } = service.config.grants
  const ttlMs = ttl ?? defaultTtlMinutes * 60_000
  if (ttlMs <= 0) return 'Duration must be positive.'
  if (ttlMs > maxTtlMinutes * 60_000) return `Duration exceeds the configured maximum of ${maxTtlMinutes} minutes (grants.maxTtlMinutes).`
  return { capability: capability.toLowerCase(), selector, ttlMs }
}

/** The slice of the DSH Schedule service these commands use. */
interface ScheduleLike {
  create(sessionId: unknown, request: Record<string, unknown>, signal?: AbortSignal): Promise<{ id: unknown; title: string; scheduledAt: string }>
  list(request: { sessionId: unknown }): Promise<{ id: unknown; title: string; scheduledAt: string }[]>
  delete(request: { sessionId: unknown; id: unknown }, signal?: AbortSignal): Promise<unknown>
}

function pickTasks(service: OpsService, rawInput: string): TaskSpec[] | string {
  const name = rawInput.trim()
  const tasks = [...service.inventory.tasks.values()]
  if (tasks.length === 0) return 'No tasks are defined; add them under `tasks:` in the inventory file.'
  if (name === '' || name === 'all') return tasks
  const task = service.inventory.tasks.get(name)
  return task === undefined ? `Unknown task "${name}". Known: ${tasks.map(t => t.name).join(', ')}` : [task]
}

export function registerCommands(ctx: Context, service: OpsService): void {
  const schedule = () => ctx.get('schedule') as ScheduleLike | undefined

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/tasks'),
    name: 'ops-tasks',
    description: 'List WispOps per-server tasks and whether they are scheduled in this session',
    handler: async (invocation): Promise<CommandResult> => {
      await service.refresh()
      const tasks = [...service.inventory.tasks.values()]
      if (tasks.length === 0) return { kind: 'success', text: 'No tasks are defined; add them under `tasks:` in the inventory file.' }
      const scheduled = await schedule()?.list({ sessionId: invocation.agent.id }).catch(() => []) ?? []
      const lines = tasks.map(t => {
        const record = scheduled.find(r => r.title === `${SCHEDULE_TITLE_PREFIX}${t.name}`)
        return `- ${t.name}: ${t.playbook} on ${t.targets}, ${describeSchedule(t, service.config)}${t.sudo === true ? ', sudo' : ''} — ${record === undefined ? (t.schedule === undefined ? 'run with /ops-run' : 'not scheduled here (/ops-schedule)') : `scheduled, next ${record.scheduledAt}`}`
      })
      if (schedule() === undefined) lines.push('', 'This DSH profile has no Schedule service (use the Web profile for scheduled reports).')
      return { kind: 'success', text: lines.join('\n') }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/schedule'),
    name: 'ops-schedule',
    description: 'Schedule WispOps tasks to run and report in this session',
    input: { hint: '<task|all>' },
    handler: async (invocation): Promise<CommandResult> => {
      await service.refresh()
      const scheduler = schedule()
      if (scheduler === undefined) return { kind: 'error', text: 'This DSH profile has no Schedule service; scheduled reports need the Web profile (or another profile that mounts @deepseek-ai/dsh-schedule).' }
      const picked = pickTasks(service, invocation.rawInput)
      if (typeof picked === 'string') return { kind: 'error', text: picked }
      const existing = await scheduler.list({ sessionId: invocation.agent.id })
      const lines: string[] = []
      for (const task of picked) {
        if (task.schedule === undefined) {
          lines.push(`${task.name}: no schedule in its definition, skipped`)
          continue
        }
        const title = `${SCHEDULE_TITLE_PREFIX}${task.name}`
        // Re-scheduling replaces the old reminder so an edited time takes effect.
        for (const old of existing.filter(r => r.title === title)) await scheduler.delete({ sessionId: invocation.agent.id, id: old.id }, invocation.signal)
        const record = await scheduler.create(invocation.agent.id, scheduleRequest(task, service.config), invocation.signal)
        lines.push(`${task.name}: ${describeSchedule(task, service.config)}, first run ${record.scheduledAt}`)
      }
      lines.push('', 'Reports arrive in this session while DSH is running. Unattended runs cannot answer approval prompts: grant what they need in the inventory (task `sudo: true` or host policy) rather than relying on approval.')
      return { kind: 'success', text: lines.join('\n') }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/unschedule'),
    name: 'ops-unschedule',
    description: 'Remove scheduled WispOps tasks from this session',
    input: { hint: '<task|all>' },
    handler: async (invocation): Promise<CommandResult> => {
      const scheduler = schedule()
      if (scheduler === undefined) return { kind: 'error', text: 'This DSH profile has no Schedule service.' }
      const name = invocation.rawInput.trim() || 'all'
      const existing = (await scheduler.list({ sessionId: invocation.agent.id })).filter(r => r.title.startsWith(SCHEDULE_TITLE_PREFIX) && (name === 'all' || r.title === `${SCHEDULE_TITLE_PREFIX}${name}`))
      for (const record of existing) await scheduler.delete({ sessionId: invocation.agent.id, id: record.id }, invocation.signal)
      return existing.length === 0 ? { kind: 'error', text: `No scheduled WispOps task ${name === 'all' ? '' : `"${name}" `}in this session.` } : { kind: 'success', text: `Removed ${existing.map(r => r.title.slice(SCHEDULE_TITLE_PREFIX.length)).join(', ')}.` }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/run'),
    name: 'ops-run',
    description: 'Run a WispOps task now and have the agent write its report',
    input: { hint: '<task>' },
    handler: async (invocation): Promise<CommandResult> => {
      await service.refresh()
      const picked = pickTasks(service, invocation.rawInput)
      if (typeof picked === 'string') return { kind: 'error', text: picked }
      if (picked.length !== 1 || invocation.rawInput.trim() === '' || invocation.rawInput.trim() === 'all') return { kind: 'error', text: 'Usage: /ops-run <task>' }
      const task = picked[0] as TaskSpec
      invocation.agent.followup(createUserMessage({ content: [{ type: 'text', text: taskPrompt(task) }], source: { kind: 'user' } }))
      return { kind: 'success', text: `Queued task ${task.name}.` }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/allow'),
    name: 'ops-allow',
    description: 'Allow the agent to use change / sudo / destructive operations on some servers for a limited time in this session',
    input: { hint: '<change|sudo|destructive|all> <hosts|@group|all> [30m|2h]' },
    handler: async (invocation): Promise<CommandResult> => {
      await service.refresh()
      const parsed = parseAllow(invocation.rawInput, service)
      if (typeof parsed === 'string') return { kind: 'error', text: parsed }
      const capabilities = grantCapabilities(parsed.capability)
      if (capabilities === undefined) return { kind: 'error', text: ALLOW_USAGE }
      if (capabilities.includes('destructive') && !service.config.grants.allowDestructive) {
        return { kind: 'error', text: 'Destructive grants are disabled (grants.allowDestructive: false). Destructive commands are approved one call at a time.' }
      }
      let hosts
      try {
        hosts = service.select(parsed.selector)
      } catch (error) {
        return { kind: 'error', text: error instanceof Error ? error.message : String(error) }
      }
      const session = String(invocation.agent.id)
      const expiresAt = Date.now() + parsed.ttlMs
      const issued = capabilities.map(capability => service.grants.add({ session, capability, hosts: hosts.map(h => h.name), selector: parsed.selector, expiresAt }))
      const denied = hosts.flatMap(h => capabilities.filter(c => h.policy[c] === 'deny').map(c => `${h.name}:${c}`))
      return {
        kind: 'success',
        text: [
          `Granted ${capabilities.join(' + ')} on ${hosts.map(h => h.name).join(', ')} until ${new Date(expiresAt).toLocaleString()} (grant ${issued.map(g => g.id).join(', ')}).`,
          'Matching agent calls in this session now run without a prompt; others still ask. Revoke with /ops-revoke.',
          ...denied.length > 0 ? [`Still refused by policy deny: ${denied.join(', ')}.`] : [],
        ].join('\n'),
      }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/revoke'),
    name: 'ops-revoke',
    description: 'Revoke dsh-wisp-ops session grants',
    input: { hint: '[grant id|all]' },
    handler: (invocation): CommandResult => {
      const id = invocation.rawInput.trim() || 'all'
      const revoked = service.grants.revoke(String(invocation.agent.id), id)
      return revoked.length === 0
        ? { kind: 'error', text: id === 'all' ? 'No active grants.' : `No active grant ${id}.` }
        : { kind: 'success', text: `Revoked ${revoked.map(g => `${g.id} (${g.capability} on ${g.hosts.join(', ')})`).join('; ')}.` }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/grants'),
    name: 'ops-grants',
    description: 'Show dsh-wisp-ops session grants and paused logins',
    handler: (invocation): CommandResult => {
      const grants = service.grants.active(String(invocation.agent.id))
      const blocks = service.runner.guard.list()
      const lines = grants.length === 0
        ? ['No active grants.']
        : grants.map(g => `${g.id}: ${g.capability} on ${g.hosts.join(', ')} until ${new Date(g.expiresAt).toLocaleString()}`)
      if (blocks.length > 0) lines.push(`Paused logins: ${blocks.map(b => `${b.host} until ${new Date(b.until).toLocaleString()}`).join(', ')}`)
      return { kind: 'success', text: lines.join('\n') }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/unblock'),
    name: 'ops-unblock',
    description: 'Resume logins to a server paused after an authentication failure',
    input: { hint: '<host|all>' },
    handler: (invocation): CommandResult => {
      const host = invocation.rawInput.trim() || 'all'
      const cleared = service.runner.guard.clear(host)
      return cleared.length === 0 ? { kind: 'error', text: `No paused login for ${host}.` } : { kind: 'success', text: `Logins resumed for ${cleared.join(', ')}.` }
    },
  })

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-wisp-ops/inspect'),
    name: 'ops-inspect',
    description: 'Inspect server health now (read-only), without involving the model',
    input: { hint: '[hosts|@group|all]' },
    handler: async (invocation): Promise<CommandResult> => {
      try {
        await service.refresh()
        const hosts = service.select(invocation.rawInput.trim() || 'all')
        const fleet = await service.inspect(hosts, { sudo: false, signal: invocation.signal, session: String(invocation.agent.id), authorization: 'read-only', tool: '/ops-inspect' })
        return { kind: 'success', text: renderInspection(fleet, false) }
      } catch (error) {
        return { kind: 'error', text: error instanceof Error ? error.message : String(error) }
      }
    },
  })
}
