/**
 * Managed changes: back up → apply → verify → restore on failure, as one
 * remote shell transaction per host. A plan names every path it touches:
 * existing regular files (copied), new files (must not exist; rollback
 * deletes them) and existing directories (tar archive; rollback replaces the
 * directory). A fleet selector rolls the same plan out host by host and
 * stops at the first host that does not verify.
 * @module dsh-wisp-ops/change
 */

import { posix } from 'node:path'
import { shellQuote } from './ssh.ts'
import { classifyCommand } from './risk.ts'
import type { RiskAssessment } from './risk.ts'

export interface ChangePlan {
  /** Inventory selector; `host` is accepted as an alias when validating. */
  targets: string
  /** Existing regular files, backed up with `cp -a`. */
  files: string[]
  /** Paths that must not exist yet; rollback removes them. */
  newFiles?: string[]
  /** Existing directories, backed up as tar archives; rollback replaces them. */
  directories?: string[]
  command: string
  verify: string
  afterRollback?: string
  reason: string
  sudo?: boolean
  timeoutMs?: number
}

export type ChangeOutcome = 'verified' | 'rolled-back' | 'rollback-failed' | 'refused' | 'unknown'

export const MAX_PATHS_PER_KIND = 30

function validPath(f: unknown): f is string {
  return typeof f === 'string' && f.length <= 4096 && f.startsWith('/') && f !== '/' && !/[\0\r\n]/.test(f) && !f.endsWith('/') && !f.split('/').some(s => s === '..' || s === '.')
}

function pathList(value: unknown, key: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_PATHS_PER_KIND) throw new Error(`${key} must list at most ${MAX_PATHS_PER_KIND} paths`)
  if (value.some(f => !validPath(f))) throw new Error(`${key} entries must be absolute normalized paths`)
  return value as string[]
}

export function validateChange(value: unknown): ChangePlan {
  const p = (value ?? {}) as Record<string, unknown>
  const targets = typeof p.targets === 'string' && p.targets.trim() ? p.targets : typeof p.host === 'string' && p.host.trim() ? p.host : undefined
  if (targets === undefined) throw new Error('ops_change requires targets (a host selector)')
  const files = pathList(p.files, 'files'), newFiles = pathList(p.newFiles, 'newFiles'), directories = pathList(p.directories, 'directories')
  const all = [...files, ...newFiles, ...directories]
  if (all.length < 1) throw new Error('ops_change requires at least one path in files, newFiles or directories')
  if (new Set(all).size !== all.length) throw new Error('duplicate paths across files, newFiles and directories')
  for (const key of ['command', 'verify', 'reason'] as const) if (typeof p[key] !== 'string' || !(p[key] as string).trim() || (p[key] as string).length > 8000 || (p[key] as string).includes('\0')) throw new Error(`${key} is required and must be at most 8000 characters`)
  if (p.afterRollback !== undefined && (typeof p.afterRollback !== 'string' || p.afterRollback.length > 8000 || p.afterRollback.includes('\0'))) throw new Error('invalid afterRollback command')
  if (p.sudo !== undefined && typeof p.sudo !== 'boolean') throw new Error('sudo must be boolean')
  if (p.timeoutMs !== undefined && (typeof p.timeoutMs !== 'number' || !Number.isFinite(p.timeoutMs) || p.timeoutMs < 1000)) throw new Error('timeoutMs must be a number of milliseconds (at least 1000)')
  return {
    targets, files, command: p.command as string, verify: p.verify as string, reason: p.reason as string,
    ...newFiles.length ? { newFiles } : {}, ...directories.length ? { directories } : {},
    ...p.afterRollback === undefined ? {} : { afterRollback: p.afterRollback as string },
    ...p.sudo === undefined ? {} : { sudo: p.sudo as boolean },
    ...p.timeoutMs === undefined ? {} : { timeoutMs: p.timeoutMs as number },
  }
}

export function changeCommands(p: ChangePlan): string[] { return [p.command, p.verify, p.afterRollback ?? 'true'] }

export function changeRisk(p: ChangePlan, extraRead: ReadonlySet<string>): RiskAssessment {
  const risks = changeCommands(p).map(c => classifyCommand(c, extraRead))
  const reasons = ['managed change with automatic backup and rollback']
  if (p.directories?.length) reasons.push(`replaces ${p.directories.length} listed director${p.directories.length === 1 ? 'y' : 'ies'} from a tar backup on failure`)
  if (p.newFiles?.length) reasons.push(`deletes ${p.newFiles.length} listed new file(s) on failure`)
  return { level: risks.some(r => r.level === 'destructive') ? 'destructive' : 'change', elevates: risks.some(r => r.elevates), reasons: [...reasons, ...risks.flatMap(r => r.reasons)] }
}

export function describeChange(p: ChangePlan): string {
  return [
    p.files.length ? `Backup existing regular files: ${p.files.join(', ')}` : undefined,
    p.newFiles?.length ? `New files (must not exist; deleted on failure): ${p.newFiles.join(', ')}` : undefined,
    p.directories?.length ? `Backup directories as tar (replaced on failure): ${p.directories.join(', ')}` : undefined,
    `Apply:\n${p.command}`, `Verify:\n${p.verify}`, `On failure: restore every backup, then run:\n${p.afterRollback || 'true'}`, `Reason: ${p.reason}`,
  ].filter(Boolean).join('\n')
}

export interface ChangeScriptOptions {
  /** Where `wispops-change.*` backup directories are created. */
  backupRoot?: string
  /** Backup directories older than this are pruned at the start of each run; 0 keeps them forever. */
  retentionDays?: number
}

/**
 * One remote transaction: no second SSH connection is needed to start rollback.
 * Backups are stored as `f<i>` (files) and `d<i>.tar` (directories) with a manifest.
 */
export function changeScript(p: ChangePlan, seconds: number, options: ChangeScriptOptions | string = {}): string {
  const opts = typeof options === 'string' ? { backupRoot: options } : options
  const backupRoot = opts.backupRoot ?? '/var/tmp'
  const retentionDays = Math.max(0, Math.floor(opts.retentionDays ?? 0))
  const q = shellQuote
  const newFiles = p.newFiles ?? [], directories = p.directories ?? []
  const dirParts = directories.map(d => ({ parent: posix.dirname(d), name: posix.basename(d) }))
  const stage = (script: string) => `timeout --signal=TERM --kill-after=2s ${seconds}s sh -ec ${q(script)}`
  return `umask 077
command -v timeout >/dev/null 2>&1 || { echo 'GNU timeout is required'; exit 20; }
${directories.length ? `command -v tar >/dev/null 2>&1 || { echo 'tar is required for directory backups'; exit 20; }\n` : ''}${retentionDays > 0 ? `find ${q(backupRoot)} -maxdepth 1 -name 'wispops-change.*' -type d -mtime +${retentionDays} -exec rm -rf -- {} + 2>/dev/null\n` : ''}${p.files.map(f => `[ -f ${q(f)} ] && [ ! -L ${q(f)} ] || { echo ${q(`Backup requires an existing regular non-symlink file: ${f}`)}; exit 20; }`).join('\n')}
${newFiles.map(f => `[ ! -e ${q(f)} ] && [ ! -L ${q(f)} ] && [ -d ${q(posix.dirname(f))} ] || { echo ${q(`New file must not exist yet and its directory must exist: ${f}`)}; exit 20; }`).join('\n')}
${directories.map(d => `[ -d ${q(d)} ] && [ ! -L ${q(d)} ] || { echo ${q(`Backup requires an existing non-symlink directory: ${d}`)}; exit 20; }`).join('\n')}
B=$(mktemp -d ${q(`${backupRoot}/wispops-change.XXXXXXXX`)}) || exit 20
echo "Backup directory: $B"
${p.files.map((f, i) => `cp -a -- ${q(f)} "$B/f${i}" || exit 21`).join('\n')}
${dirParts.map((d, i) => `tar -C ${q(d.parent)} -cf "$B/d${i}.tar" -- ${q(d.name)} || exit 21`).join('\n')}
{ ${[...p.files.map(f => `printf 'file\\t%s\\n' ${q(f)}`), ...newFiles.map(f => `printf 'new\\t%s\\n' ${q(f)}`), ...directories.map(d => `printf 'dir\\t%s\\n' ${q(d)}`)].join('; ')}; } > "$B/manifest"
started=0
rollback() {
  failed=0
${dirParts.map((d, i) => {
  const path = posix.join(d.parent, d.name)
  return `  if [ -L ${q(path)} ]; then failed=1
  else
    T=$(mktemp -d ${q(`${path}.wispops-restore.XXXXXXXX`)}) && tar -C "$T" -xpf "$B/d${i}.tar" && rm -rf -- ${q(path)} && mv -- "$T/"${q(d.name)} ${q(path)} && rmdir -- "$T" || failed=1
  fi`
}).join('\n')}
${p.files.map((f, i) => `  if [ -L ${q(f)} ] || [ -d ${q(f)} ]; then failed=1
  else
    T=$(mktemp ${q(`${f}.wispops-restore.XXXXXXXX`)}) && cp -a -- "$B/f${i}" "$T" && mv -f -- "$T" ${q(f)} || failed=1
  fi`).join('\n')}
${newFiles.map(f => `  if [ -L ${q(f)} ] || [ -f ${q(f)} ]; then rm -f -- ${q(f)} || failed=1
  elif [ -e ${q(f)} ]; then failed=1
  fi`).join('\n')}
  ${stage(p.afterRollback || 'true')} || failed=1
  if [ "$failed" = 0 ]; then echo 'WISPOPS_CHANGE=rolled-back'; else echo 'WISPOPS_CHANGE=rollback-failed'; fi
  return "$failed"
}
finish() {
  rc=$?
  trap - EXIT HUP INT TERM
  if [ "$started" = 1 ]; then rollback || rc=24; fi
  exit "$rc"
}
trap finish EXIT
trap 'exit 25' HUP INT TERM
started=1
echo 'WISPOPS_STAGE=apply'
${stage(p.command)} || exit 22
echo 'WISPOPS_STAGE=verify'
${stage(p.verify)} || exit 23
started=0
echo 'WISPOPS_CHANGE=verified'
`
}

/** Read the transaction markers out of a host's output. */
export function parseChangeOutput(stdout: string, exitCode: number | null): { outcome: ChangeOutcome; backupDir?: string } {
  const backupDir = stdout.match(/^Backup directory: (.+)$/m)?.[1]?.trim()
  const marker = [...stdout.matchAll(/^WISPOPS_CHANGE=(verified|rolled-back|rollback-failed)$/gm)].at(-1)?.[1] as ChangeOutcome | undefined
  if (marker !== undefined) return { outcome: marker, ...backupDir === undefined ? {} : { backupDir } }
  if (exitCode === 20 || exitCode === 21) return { outcome: 'refused', ...backupDir === undefined ? {} : { backupDir } }
  return { outcome: 'unknown', ...backupDir === undefined ? {} : { backupDir } }
}
