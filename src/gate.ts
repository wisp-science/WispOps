/**
 * The permission gate on `tools/pre-execute`.
 *
 * For this plugin's tools it classifies the action, settles each required
 * capability per host (policy → grant → ask), and returns `deny`, `ask`
 * (the host's approval UI asks the human about this exact call), or defers
 * to later listeners. Every non-denied call receives a voucher keyed by the
 * execution token; the tools refuse to run without one, so a composition that
 * skips this gate fails closed instead of executing unchecked.
 *
 * For local shell tools (bash) it catches `sudo` and raw `ssh` to inventory
 * hosts, which would otherwise bypass the per-host policy.
 * @module dsh-wisp-ops/gate
 */

import type { Capability, Config, Permission } from './config.ts'
import { stricter } from './inventory.ts'
import type { Host, Inventory } from './inventory.ts'
import { decide, describeRulings, requiredCapabilities } from './policy.ts'
import type { Decision, GrantStore } from './policy.ts'
import { classifyCommand } from './risk.ts'
import type { RiskAssessment } from './risk.ts'
import type { Authorization } from './store.ts'
import { changeCommands, changeRisk, describeChange, validateChange } from './change.ts'

/** What the gate concluded for one tool call, consumed once by the tool. */
export interface Voucher {
  readonly hosts: readonly string[]
  readonly risk: RiskAssessment
  readonly sudo: boolean
  readonly authorization: Authorization
  readonly issuedAt: number
}

/** The remote action a tool call would perform, derived from its arguments alone. */
export interface PlannedAction {
  readonly selector: string
  readonly command: string
  readonly risk: RiskAssessment
  readonly sudo: boolean
  /** Sudo pre-authorized by a human-written task definition (still refused by a policy deny). */
  readonly taskSudo?: boolean
  /** Further commands the action runs verbatim (a task's read-only command list), checked against the deny list too. */
  readonly extraCommands?: readonly string[]
}

const READ: RiskAssessment = { level: 'read', elevates: false, reasons: [] }

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** Interpret one of this plugin's tool calls; undefined for tools that touch no host. */
export function planAction(tool: string, args: unknown, extraRead: ReadonlySet<string>, inventory?: Inventory): PlannedAction | undefined {
  const a = (typeof args === 'object' && args !== null ? args : {}) as Record<string, unknown>
  const sudo = a.sudo === true
  switch (tool) {
    case 'ops_change': {
      const plan = validateChange(args)
      return { selector: plan.targets, command: describeChange(plan), risk: changeRisk(plan, extraRead), sudo }
    }
    case 'ops_exec': {
      const command = str(a.command) ?? ''
      return { selector: str(a.targets) ?? '', command, risk: classifyCommand(command, extraRead), sudo }
    }
    case 'ops_inspect':
      return { selector: str(a.targets) ?? 'all', command: '(built-in read-only inspection)', risk: READ, sudo }
    case 'ops_hosts':
      return a.probe === true ? { selector: str(a.targets) ?? 'all', command: '(built-in read-only capability probe)', risk: READ, sudo: false } : undefined
    case 'ops_disk':
      return { selector: str(a.host) ?? '', command: `(built-in read-only disk diagnosis of ${str(a.path) ?? '/'})`, risk: READ, sudo }
    case 'ops_files':
      return { selector: str(a.host) ?? '', command: `(built-in read-only recent-file analysis of ${str(a.paths) ?? '?'})`, risk: READ, sudo }
    case 'ops_security':
      return { selector: str(a.targets) ?? 'all', command: '(built-in read-only security triage)', risk: READ, sudo }
    case 'ops_task': {
      const task = str(a.name) === undefined ? undefined : inventory?.tasks.get(str(a.name) as string)
      if (task === undefined) return undefined
      const commands = task.commands ?? []
      return {
        selector: task.targets,
        command: `(task ${task.name}: ${task.playbook === 'script' ? `owner-reviewed check script "${task.script}"` : `built-in ${task.playbook} playbook`}${commands.length ? ` + ${commands.length} read-only command(s)` : ''})`,
        risk: READ,
        sudo: task.sudo === true,
        taskSudo: task.sudo === true,
        ...commands.length ? { extraCommands: commands } : {},
      }
    }
    default:
      return undefined
  }
}

export type GateOutcome =
  | { readonly kind: 'pass' }
  | { readonly kind: 'allow'; readonly voucher: Voucher }
  | { readonly kind: 'ask'; readonly voucher: Voucher; readonly reason: string; readonly displayReason: { readonly en: string; readonly zh: string } }
  | { readonly kind: 'deny'; readonly reason: string }

function compact(text: string, max = 600): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine
}

function hostList(hosts: readonly Host[]): string {
  const names = hosts.map(h => h.name)
  return names.length > 12 ? `${names.slice(0, 12).join(', ')} … (+${names.length - 12})` : names.join(', ')
}

/** Matches any configured deny pattern. */
export function deniedByPattern(command: string, patterns: readonly RegExp[]): RegExp | undefined {
  return patterns.find(re => re.test(command))
}

/** Settle one of this plugin's tool calls. */
export function gateOpsCall(
  tool: string,
  args: unknown,
  session: string | undefined,
  context: { config: Config; inventory: Inventory; grants: GrantStore; denyPatterns: readonly RegExp[]; extraRead: ReadonlySet<string> },
  now = Date.now(),
): GateOutcome {
  const action = planAction(tool, args, context.extraRead, context.inventory)
  if (action === undefined) return { kind: 'pass' }
  let hosts: Host[]
  try {
    hosts = context.inventory.select(action.selector)
  } catch {
    // Selector errors surface from the tool body with the real message; nothing runs.
    return { kind: 'pass' }
  }
  const commands = tool === 'ops_change' ? changeCommands(validateChange(args)) : [action.command, ...action.extraCommands ?? []]
  const pattern = commands.map(command => deniedByPattern(command, context.denyPatterns)).find(Boolean)
  if (pattern !== undefined) {
    return { kind: 'deny', reason: `Refused by the deployment deny list (${pattern.source}). This command is never run by the agent; a human must do it directly if it is really intended.` }
  }
  if (action.taskSudo === true) {
    const refused = hosts.filter(h => h.policy.sudo === 'deny').map(h => h.name)
    if (refused.length > 0) return { kind: 'deny', reason: `Task needs sudo, but host policy denies sudo on ${refused.join(', ')}.` }
  }
  // A task's sudo was authorized by the human who wrote the task.
  const capabilities = requiredCapabilities(action.risk, action.sudo && action.taskSudo !== true)
  const decision: Decision = decide(hosts, capabilities, session, context.grants)
  const base = { hosts: hosts.map(h => h.name), risk: action.risk, sudo: action.sudo || action.risk.elevates, issuedAt: now }
  switch (decision.kind) {
    case 'deny':
      return {
        kind: 'deny',
        reason: `Denied by host policy: ${describeRulings(decision.denied)} is set to deny. Policy deny cannot be overridden by approval or /ops-allow; change the inventory policy if this is intended.`,
      }
    case 'allow': {
      const authorization: Authorization = action.taskSudo === true
        ? 'task'
        : capabilities.length === 0
          ? 'read-only'
          : decision.rulings.some(r => r.grant !== undefined) ? 'grant' : 'policy'
      return { kind: 'allow', voucher: { ...base, authorization } }
    }
    case 'ask': {
      const why = action.risk.reasons.length > 0 ? ` Risk: ${action.risk.reasons.join('; ')}.` : ''
      const reasonText = str((args as Record<string, unknown> | null)?.reason)
      const needs = [...new Set(decision.pending.map(r => r.capability))].join(' + ')
      const display = tool === 'ops_change' ? action.command : compact(action.command)
      const reason = `${tool} on ${hostList(hosts)} needs ${needs}.${why} Command: ${display}${reasonText === undefined ? '' : ` Purpose: ${compact(reasonText, 300)}`}`
      return {
        kind: 'ask',
        voucher: { ...base, authorization: 'approval' },
        reason,
        displayReason: {
          en: `Allow ${needs} on ${hostList(hosts)}? ${tool === 'ops_change' ? display : compact(action.command, 300)}`,
          zh: `允许在 ${hostList(hosts)} 上执行需要 ${needs.replace('change', '变更').replace('sudo', 'sudo 提权').replace('destructive', '破坏性操作')} 的命令吗？${tool === 'ops_change' ? display : compact(action.command, 300)}`,
        },
      }
    }
  }
}

const REMOTE_CLIENT = /(?:^|[\s;&|(`'"])(?:\S*\/)?(?:ssh|scp|sftp|rsync|mosh|autossh)\s/

export type ShellOutcome =
  | { readonly kind: 'pass' }
  | { readonly kind: 'ask'; readonly reason: string; readonly displayReason: { readonly en: string; readonly zh: string } }
  | { readonly kind: 'deny'; readonly reason: string }

/** Settle a local shell call: privilege escalation and raw ssh to inventory hosts. */
export function gateShellCall(command: string, guard: Config['bashGuard'], inventory: Inventory): ShellOutcome {
  let worst: Permission = 'allow'
  const reasons: string[] = []
  if (guard.inventorySsh !== 'allow' && REMOTE_CLIENT.test(command)) {
    const tokens = new Set(command.split(/[\s'"`;&|()]+/).map(t => t.replace(/^[^@]*@/, '').replace(/:.*$/, '')))
    const hit = [...inventory.addressTokens()].find(addr => tokens.has(addr.replace(/^[^@]*@/, '')))
    if (hit !== undefined) {
      worst = stricter(worst, guard.inventorySsh)
      reasons.push(`connects to inventory host "${hit}" directly, bypassing its permission policy and audit log; use ops_exec with targets="${hit}" instead`)
    }
  }
  if (guard.sudo !== 'allow' && classifyCommand(command).elevates) {
    worst = stricter(worst, guard.sudo)
    reasons.push('runs sudo/su on the local machine')
  }
  if (worst === 'allow') return { kind: 'pass' }
  const reason = `This shell command ${reasons.join('; and ')}.`
  if (worst === 'deny') return { kind: 'deny', reason }
  return {
    kind: 'ask',
    reason,
    displayReason: { en: `Allow this local command? ${compact(command, 300)}`, zh: `允许执行这条本地命令吗？${compact(command, 300)}` },
  }
}

/** Grants a human may issue for a capability word typed after /ops-allow. */
export function grantCapabilities(word: string): Capability[] | undefined {
  switch (word) {
    case 'change': return ['change']
    case 'sudo': return ['sudo']
    case 'destructive': return ['destructive']
    // `all` deliberately excludes destructive: that must always be named.
    case 'all': return ['change', 'sudo']
    default: return undefined
  }
}
