/**
 * dsh-wisp-ops — multi-host server operations for DeepSeek Harness.
 *
 * Inventory with groups and tags, fleet inspection (巡检) with thresholds and
 * trends, disk-full diagnosis, and fleet command execution over the system
 * OpenSSH client, under a per-host permission model: read runs freely;
 * change, sudo, and destructive actions follow host policy, human grants
 * (/ops-allow), or a one-shot approval of the exact call through the host's
 * approval UI. Passwords come from the independent encrypted vault (or an optional WispTerm source) and never
 * reach the model.
 * @module dsh-wisp-ops
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-commands'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-user-approval'
import type {} from '@deepseek-ai/dsh-skill'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'
import { registerCommands } from './commands.ts'
import { Config } from './config.ts'
import { deniedByPattern, gateOpsCall, gateShellCall } from './gate.ts'
import { homedir } from 'node:os'
import { expandHome, Inventory } from './inventory.ts'
import { noSecrets } from './secrets.ts'
import { OpsService } from './service.ts'
import { registerSkills } from './skills.ts'
import { registerTools, VoucherBook } from './tools.ts'
import { resolve as resolvePath, sep } from 'node:path'
import { loadWispTermHosts, wisptermConfigDir, WispTermSecrets } from './wispterm.ts'
import { LocalVault, routeSecrets } from './vault.ts'
import { OpsManagement } from './management.ts'
import { changeCommands, validateChange } from './change.ts'

export { Config }
export const name = 'dsh-wisp-ops'
export const inject = ['tools', 'systemPrompt']

const OPS_TOOLS = new Set(['ops_hosts', 'ops_exec', 'ops_change', 'ops_inspect', 'ops_disk', 'ops_files', 'ops_security', 'ops_task', 'ops_history'])

const GUIDANCE = `Server operations (dsh-wisp-ops). Manage remote servers only through the ops_* tools; never ssh/scp/rsync to inventory hosts from a local shell, and never read or edit the WispOps inventory, data directory or state files (they hold the user's permission settings and encrypted credentials; use ops_hosts and ops_history instead).
1. Orient: ops_hosts (inventory, policy, capabilities, grants). For "check the servers", run ops_inspect first. Predefined per-server jobs: ops_task (list/run); scheduled deliveries ask you to run one. Asked to design a check template, agree on what to check, thresholds and timing with the user, then submit it with ops_template_draft; the user saves it from the panel. When a check is better as a script (no fixed data shape, or it should run without you to save tokens), write a read-only POSIX sh script that follows the exit-code and summary-line contract and submit it with ops_script_draft; the user tests and saves it, links servers, and picks whether runs report always, only on problems, or never. A delivery that says WispOps already ran the task means: call ops_task with mode="last" and report from the stored evidence. The user manages servers, independent encrypted credentials, and recurring tasks in the WispOps server operations panel; WispTerm is optional. Never request passwords in chat.
2. Diagnose read-only before acting: ops_inspect, ops_disk (full disk), ops_files (recent/new files, sequencing intermediates), ops_security (attacks, suspicious logins/processes), read-only ops_exec. Explain causes from the evidence. Skills wisp-disk-full, wisp-omics-cleanup, wisp-security-triage, wisp-daily-report, wisp-safe-change and wisp-hpc-gpu hold the detailed procedures — load the matching one.
3. Before any change, state the plan: what, why, risk, how to verify, how to roll back. Back up every file you will edit on the host first (cp -a FILE FILE.bak.$(date +%Y%m%d%H%M%S)) and record the current state.
4. For file and directory changes, use ops_change with every path the command touches (files, newFiles, directories), the apply command, a verification command, and an afterRollback reload/check when needed. It backs up before applying, restores on failure, rolls out host by host and stops at the first failure: change one canary host first, then the group. Other operations use ops_exec and a clear reason. Set sudo=true rather than writing sudo. Approval prompts are the user's decision: never rephrase, split, or obfuscate a command to avoid classification or approval, and never ask for a password (stored passwords are used automatically when allowed).
5. Verify after every change (service active, health check, logs, or the same ops_disk/ops_files/ops_inspect again). If verification fails, roll back from the backup, verify again, and report.
6. Never delete raw data, final results, files marked in-use, or files inside running job directories; other users' data needs the owner's agreement. Prefer vacuum/clean/compress over deletion, and explicit path lists over globs.
7. During a scheduled task, only collect and report; recommend changes instead of making them. On HPC login nodes do not run heavy work. Report sudo-required, auth-failed, or blocked hosts instead of retrying.`

export async function apply(ctx: Context, config: Config): Promise<void> {
  const denyPatterns = config.denyPatterns.map(source => {
    try {
      return new RegExp(source)
    } catch (error) {
      throw new Error(`dsh-wisp-ops: invalid denyPatterns entry ${JSON.stringify(source)}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  const extraRead = new Set(config.extraReadPrograms)
  const resolved: Config = { ...config, dataDir: expandHome(config.dataDir), ...config.inventoryFile === undefined ? {} : { inventoryFile: expandHome(config.inventoryFile) } }

  const wisptermDir = expandHome(config.secrets.wisptermDir ?? wisptermConfigDir())
  const imported = config.secrets.importWisptermHosts ? await loadWispTermHosts(wisptermDir) : []
  const inventory = await Inventory.load(resolved, imported)
  const vault = new LocalVault(resolved.dataDir)
  const legacy = config.secrets.provider === 'wispterm' ? new WispTermSecrets(wisptermDir) : config.secrets.provider === 'local' ? vault : noSecrets
  if (legacy instanceof WispTermSecrets) ctx.effect(() => () => legacy.dispose())
  const secrets = routeSecrets(vault, legacy)
  const protectedRoots = [resolved.dataDir, wisptermDir, ...resolved.inventoryFile === undefined ? [] : [resolved.inventoryFile]].map(p => resolvePath(p))
  const isProtected = (path: string) => {
    const full = resolvePath(path)
    return protectedRoots.some(root => full === root || full.startsWith(root + sep))
  }
  const mentionForms = protectedRoots.flatMap(root => [root, root.replace(homedir(), '~'), root.replace(homedir(), '$HOME')])
  // The data directory holds the vault ciphertext and, on Linux, its key file, so even a read-only
  // command that names it (cat, base64, tar …) could hand the model every stored password.
  const protectedMentions = (command: string) => mentionForms.some(form => command.includes(form)) || /\.dsh-wisp-ops\b|wispterm\/(?:passwords|ssh_hosts)|\bvault\.(?:key|json)\b/.test(command)
  /** Any string argument of any tool that names a protected path, so read, glob and list tools need no name list. */
  const protectedArgument = (value: unknown, depth = 0): string | undefined => {
    if (typeof value === 'string') return value.length > 0 && value.length <= 4096 && isProtected(expandHome(value.trim())) ? value : undefined
    if (depth >= 3 || value === null || typeof value !== 'object') return undefined
    for (const entry of Array.isArray(value) ? value : Object.values(value)) {
      const hit = protectedArgument(entry, depth + 1)
      if (hit !== undefined) return hit
    }
    return undefined
  }
  const service = new OpsService(resolved, inventory, secrets, imported)
  await service.refresh()
  ctx.plugin(OpsManagement, { service, vault })
  const vouchers = new VoucherBook()

  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    const session = exec.agent === undefined ? undefined : String(exec.agent.id)
    if (OPS_TOOLS.has(exec.name) || config.bashGuard.tools.includes(exec.name)) {
      try {
        await service.refresh()
      } catch (error) {
        return { kind: 'deny', reason: `dsh-wisp-ops could not reload the inventory: ${error instanceof Error ? error.message : String(error)}` }
      }
    }
    if (OPS_TOOLS.has(exec.name)) {
      const outcome = gateOpsCall(exec.name, exec.arguments, session, { config: resolved, inventory: service.inventory, grants: service.grants, denyPatterns, extraRead })
      switch (outcome.kind) {
        case 'pass':
          return next()
        case 'deny':
          return { kind: 'deny', reason: outcome.reason }
        case 'allow': {
          const downstream = await next()
          if (downstream.kind === 'allow' || downstream.kind === 'ask') vouchers.issue(exec.token, outcome.voucher)
          return downstream
        }
        case 'ask': {
          const downstream = await next()
          if (downstream.kind === 'deny' || downstream.kind === 'cancel') return downstream
          vouchers.issue(exec.token, outcome.voucher)
          return { kind: 'ask', reason: downstream.kind === 'ask' && downstream.reason !== undefined ? `${outcome.reason} ${downstream.reason}` : outcome.reason, displayReason: outcome.displayReason }
        }
      }
    }
    if (!config.bashGuard.tools.includes(exec.name)) {
      const pathKey = config.protect.fileTools[exec.name]
      const named = pathKey === undefined ? undefined : (exec.arguments as Record<string, unknown> | null)?.[pathKey]
      const target = typeof named === 'string' && isProtected(expandHome(named)) ? named : protectedArgument(exec.arguments)
      if (target !== undefined) {
        return { kind: 'deny', reason: `${target} belongs to dsh-wisp-ops (inventory, permissions, audit log, or the Password Store) and is managed by the user only; it is never read or written by tools. Use ops_hosts and ops_history for the inventory and audit log, and tell the user what to change instead.` }
      }
    }
    if (config.bashGuard.tools.includes(exec.name)) {
      const command = (exec.arguments as { command?: unknown } | null)?.command
      if (typeof command === 'string' && protectedMentions(command)) {
        return { kind: 'deny', reason: 'This shell command names dsh-wisp-ops inventory, permission, audit, or Password Store files, which the user manages and which hold encrypted credentials; the agent never reads or modifies them. Use ops_hosts and ops_history instead, and tell the user what to change.' }
      }
      if (typeof command === 'string') {
        const outcome = gateShellCall(command, config.bashGuard, service.inventory)
        if (outcome.kind === 'deny') return { kind: 'deny', reason: outcome.reason }
        if (outcome.kind === 'ask') {
          const downstream = await next()
          if (downstream.kind === 'deny' || downstream.kind === 'cancel') return downstream
          return { kind: 'ask', reason: outcome.reason, displayReason: outcome.displayReason }
        }
      }
    }
    return next()
  })

  // A final, monotonic refusal: no listener ordering can let a deny-listed command through.
  ctx.tools.guard(exec => {
    if (exec.name === 'ops_change') {
      try {
        const hit = changeCommands(validateChange(exec.arguments)).map(command => deniedByPattern(command, denyPatterns)).find(Boolean)
        return hit ? `Refused by the dsh-wisp-ops deny list (${hit.source}).` : undefined
      } catch { return 'Invalid ops_change plan; nothing executed.' }
    }
    if (exec.name === 'ops_task') {
      const name = (exec.arguments as { name?: unknown } | null)?.name
      const commands = typeof name === 'string' ? service.inventory.tasks.get(name)?.commands ?? [] : []
      const hit = commands.map(command => deniedByPattern(command, denyPatterns)).find(Boolean)
      return hit ? `Refused by the dsh-wisp-ops deny list (${hit.source}).` : undefined
    }
    if (exec.name !== 'ops_exec' && !config.bashGuard.tools.includes(exec.name)) return undefined
    const command = (exec.arguments as { command?: unknown } | null)?.command
    if (typeof command !== 'string') return undefined
    const hit = deniedByPattern(command, denyPatterns)
    return hit === undefined ? undefined : `Refused by the dsh-wisp-ops deny list (${hit.source}).`
  })

  ctx.systemPrompt.section({
    name: 'dsh-wisp-ops',
    order: ctx.systemPrompt.getSectionOrder('TOOL_BASH') + 5,
    text: GUIDANCE,
    interpolate: false,
  })

  registerTools(ctx, service, vouchers)
  ctx.inject(['commands'], commandCtx => registerCommands(commandCtx, service))
  ctx.inject(['skills'], skillCtx => registerSkills(skillCtx))
}
