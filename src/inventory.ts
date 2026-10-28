/**
 * Host inventory: membership, selectors, and the effective permission table
 * of each host. The model can only address hosts by inventory name, so it
 * never supplies an SSH destination of its own.
 * @module dsh-wisp-ops/inventory
 */

import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { parse as parseYaml } from 'yaml'
import z from '@deepseek-ai/schemastery'
import { CAPABILITIES, Config } from './config.ts'
import type { Capability, GroupSpec, HostSpec, Permission, PolicySpec, TaskSpec } from './config.ts'
import { managedStore } from './managed.ts'
import type { ManagedState } from './managed.ts'
import { classifyCommand } from './risk.ts'

/** A host with its effective policy resolved. */
export interface Host extends HostSpec {
  readonly groups: string[]
  readonly tags: Record<string, string>
  readonly policy: Record<Capability, Permission>
  /** Effective policy before the panel override, so the panel can show what "inherit" means. */
  readonly inheritedPolicy: Record<Capability, Permission>
  /** Capabilities set in the panel; absent when nothing is overridden. */
  readonly policyOverride?: PolicySpec
}

const STRICTNESS: Record<Permission, number> = { allow: 0, ask: 1, deny: 2 }

/** The stricter of two permissions. */
export function stricter(a: Permission, b: Permission): Permission {
  return STRICTNESS[a] >= STRICTNESS[b] ? a : b
}

/** Expand a leading `~/` against the home directory. */
export function expandHome(path: string): string {
  return path === '~' ? homedir() : path.startsWith('~/') ? `${homedir()}${path.slice(1)}` : path
}

const InventoryFile = z.object({
  hosts: Config.dict?.hosts as z<HostSpec[]>,
  groups: Config.dict?.groups as z<Record<string, GroupSpec>>,
  tasks: Config.dict?.tasks as z<TaskSpec[]>,
})

/** Read an inventory file; YAML is a superset of JSON so one parser serves both. A missing file is an empty inventory. */
export async function loadInventoryFile(path: string): Promise<{ hosts: HostSpec[]; groups: Record<string, GroupSpec>; tasks: TaskSpec[] }> {
  let text: string
  try {
    text = await readFile(expandHome(path), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { hosts: [], groups: {}, tasks: [] }
    throw error
  }
  const parsed: unknown = parseYaml(text) ?? {}
  try {
    return InventoryFile(parsed as Record<string, never>)
  } catch (error) {
    throw new Error(`invalid inventory file ${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export class Inventory {
  readonly hosts: ReadonlyMap<string, Host>
  readonly groups: ReadonlyMap<string, GroupSpec>
  readonly tasks: ReadonlyMap<string, TaskSpec>

  constructor(hosts: readonly (HostSpec & { policyOverride?: PolicySpec })[], groups: Record<string, GroupSpec>, defaults: Record<Capability, Permission>, tasks: readonly TaskSpec[] = [], extraRead: ReadonlySet<string> = new Set()) {
    const groupMap = new Map(Object.entries(groups))
    const hostMap = new Map<string, Host>()
    for (const spec of hosts) {
      if (hostMap.has(spec.name)) throw new Error(`duplicate inventory host "${spec.name}"`)
      const memberOf = spec.groups ?? []
      for (const name of memberOf) {
        // A host may name a group that has no settings; it then exists only as a label.
        if (!groupMap.has(name)) groupMap.set(name, {})
      }
      const effective = {} as Record<Capability, Permission>
      for (const capability of CAPABILITIES) {
        const own = spec.policy?.[capability]
        if (own !== undefined) {
          effective[capability] = own
          continue
        }
        const fromGroups = memberOf
          .map(name => groupMap.get(name)?.policy?.[capability])
          .filter((value): value is Permission => value !== undefined)
        effective[capability] = fromGroups.length > 0 ? fromGroups.reduce(stricter) : defaults[capability]
      }
      const override = spec.policyOverride
      const policy = override === undefined ? effective : { ...effective, ...override }
      hostMap.set(spec.name, { ...spec, groups: memberOf, tags: spec.tags ?? {}, policy, inheritedPolicy: effective, ...override === undefined ? {} : { policyOverride: override } })
    }
    this.hosts = hostMap
    this.groups = groupMap
    const taskMap = new Map<string, TaskSpec>()
    for (const raw of tasks) {
      // The schema materializes absent optional objects and arrays as {} and []; normalize them away.
      const { schedule, paths, commands, quietHours, ...rest } = raw
      const timed = schedule !== undefined && (schedule.daily !== undefined || schedule.cron !== undefined || schedule.everyMinutes !== undefined)
      const quiet = quietHours !== undefined && (quietHours.start !== undefined || quietHours.end !== undefined)
      const task: TaskSpec = {
        ...rest,
        ...paths !== undefined && paths.length > 0 ? { paths } : {},
        ...commands !== undefined && commands.length > 0 ? { commands: commands.map(c => c.trim()) } : {},
        ...timed ? { schedule: { ...schedule, ...schedule.weekdays !== undefined && schedule.weekdays.length === 0 ? { weekdays: undefined } : {} } } : {},
        ...quiet ? { quietHours: { ...quietHours } } : {},
      }
      if (task.schedule?.weekdays === undefined) delete task.schedule?.weekdays
      if (task.quietHours?.timeZone === undefined) delete task.quietHours?.timeZone
      if (taskMap.has(task.name)) throw new Error(`duplicate task "${task.name}"`)
      if (task.playbook === 'custom' && (task.instruction === undefined || task.instruction.trim().length === 0)) {
        throw new Error(`task "${task.name}" uses the custom playbook and needs an instruction`)
      }
      if (task.playbook === 'script' && task.script === undefined) throw new Error(`task "${task.name}" uses the script playbook and needs a script id`)
      if (task.playbook !== 'script' && task.script !== undefined) throw new Error(`task "${task.name}" names a script but does not use the script playbook`)
      if (task.report !== undefined && task.report !== 'always') {
        // Without a collector or commands the model is the only thing that gathers evidence.
        if (task.playbook === 'custom' && (task.commands === undefined || task.commands.length === 0)) throw new Error(`task "${task.name}" needs read-only commands or a built-in playbook before report "${task.report}" can run without the agent`)
        if (task.schedule?.cron !== undefined) throw new Error(`task "${task.name}" report "${task.report}" runs on the WispOps timer, which takes daily, weekly or interval schedules, not cron`)
      }
      // Commands run unattended under the task's authorization, so only commands the classifier
      // proves read-only are accepted; everything else must go through ops_exec and its approval.
      for (const command of task.commands ?? []) {
        if (command.length === 0 || /\0/.test(command)) throw new Error(`task "${task.name}" has an empty or invalid command`)
        const risk = classifyCommand(command, extraRead)
        if (risk.level !== 'read' || risk.elevates) throw new Error(`task "${task.name}" command is not read-only (${risk.reasons.join('; ') || 'privilege escalation'}): ${command.slice(0, 120)}`)
      }
      if (task.quietHours !== undefined) {
        const { start, end, timeZone } = task.quietHours
        if (start === undefined || end === undefined || start === end) throw new Error(`task "${task.name}" quietHours need different start and end times`)
        if (timeZone !== undefined) {
          try { new Intl.DateTimeFormat('en', { timeZone }) } catch { throw new Error(`task "${task.name}" quietHours time zone "${timeZone}" is invalid`) }
        }
      }
      if (task.playbook === 'new-files' && (task.paths === undefined || task.paths.length === 0)) {
        throw new Error(`task "${task.name}" uses the new-files playbook and needs paths`)
      }
      const s = task.schedule
      if (s !== undefined && [s.daily, s.cron, s.everyMinutes].filter(v => v !== undefined).length !== 1) {
        throw new Error(`task "${task.name}" schedule needs exactly one of daily, cron, everyMinutes`)
      }
      if (s?.weekdays !== undefined && s.daily === undefined) throw new Error(`task "${task.name}" schedule weekdays need daily`)
      // Fail loudly now rather than at 8 a.m.
      try {
        if (this.select(task.targets).length === 0) throw new Error('matches no hosts')
      } catch (error) {
        throw new Error(`task "${task.name}" targets "${task.targets}": ${error instanceof Error ? error.message : String(error)}`)
      }
      taskMap.set(task.name, task)
    }
    this.tasks = taskMap
  }

  /**
   * Build from config: imported hosts (e.g. WispTerm profiles) first, then
   * inline entries, then the inventory file. A configured host replaces an
   * imported one of the same name; two configured hosts with one name fail.
   */
  static async load(config: Config, imported: readonly HostSpec[] = [], managed?: ManagedState): Promise<Inventory> {
    let configured = config.hosts
    let groups = config.groups
    let tasks = config.tasks
    if (config.inventoryFile !== undefined) {
      const file = await loadInventoryFile(config.inventoryFile)
      configured = [...configured, ...file.hosts]
      groups = { ...groups, ...file.groups }
      tasks = [...tasks, ...file.tasks]
    }
    const names = new Set(configured.map(h => h.name))
    const state = managed ?? (await managedStore(config.dataDir).read()).value
    const excluded = new Set(state.excludedHosts)
    const hosts = [...imported.filter(h => !names.has(h.name)), ...configured, ...state.hosts].filter(h => !excluded.has(h.name)).map(h => {
      const binding = Object.hasOwn(state.bindings, h.name) ? state.bindings[h.name] : undefined
      const override = Object.hasOwn(state.policies, h.name) && Object.keys(state.policies[h.name]!).length > 0 ? state.policies[h.name] : undefined
      return { ...h, ...binding, ...override === undefined ? {} : { policyOverride: override } }
    })
    return new Inventory(hosts, groups, config.defaultPolicy, [...tasks, ...state.tasks], new Set(config.extraReadPrograms))
  }

  /**
   * Resolve a selector list. Each comma- or space-separated term is a host
   * name, `@group`, `tag:key=value`, a `*` glob over names, or `all`. A term
   * prefixed with `!` removes matches. Unknown names fail loudly.
   */
  select(selector: string): Host[] {
    const terms = selector.split(/[\s,]+/).filter(term => term.length > 0)
    if (terms.length === 0) throw new Error('empty host selector')
    const chosen = new Set<string>()
    for (const raw of terms) {
      const negate = raw.startsWith('!')
      const term = negate ? raw.slice(1) : raw
      const matches = this.match(term)
      for (const name of matches) {
        if (negate) chosen.delete(name)
        else chosen.add(name)
      }
    }
    return [...this.hosts.values()].filter(host => chosen.has(host.name))
  }

  private match(term: string): string[] {
    const names = [...this.hosts.keys()]
    if (term === 'all' || term === '*') return names
    if (term.startsWith('@')) {
      const group = term.slice(1)
      if (!this.groups.has(group)) throw new Error(`unknown group "${group}"; known groups: ${[...this.groups.keys()].join(', ') || '(none)'}`)
      return names.filter(name => this.hosts.get(name)?.groups.includes(group))
    }
    if (term.startsWith('tag:')) {
      const [key, value] = term.slice(4).split('=', 2)
      if (key === undefined || key.length === 0) throw new Error(`invalid tag selector "${term}"; use tag:key or tag:key=value`)
      return names.filter(name => {
        const tags = this.hosts.get(name)?.tags ?? {}
        return value === undefined ? key in tags : tags[key] === value
      })
    }
    if (term.includes('*') || term.includes('?')) {
      const re = new RegExp(`^${term.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`)
      return names.filter(name => re.test(name))
    }
    if (!this.hosts.has(term)) throw new Error(`unknown host "${term}"; run ops_hosts to list the inventory`)
    return [term]
  }

  /** Every token that would address an inventory host from a raw ssh command line. */
  addressTokens(): Set<string> {
    const tokens = new Set<string>()
    for (const host of this.hosts.values()) {
      tokens.add(host.name)
      if (host.ssh !== undefined) {
        tokens.add(host.ssh)
        tokens.add(host.ssh.slice(host.ssh.indexOf('@') + 1))
      }
    }
    return tokens
  }
}
