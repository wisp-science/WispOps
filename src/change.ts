import { shellQuote } from './ssh.ts'
import { classifyCommand } from './risk.ts'
import type { RiskAssessment } from './risk.ts'

export interface ChangePlan { host: string; files: string[]; command: string; verify: string; afterRollback?: string; reason: string; sudo?: boolean; timeoutMs?: number }

export function validateChange(value: unknown): ChangePlan {
  const p = value as ChangePlan
  if (!p || typeof p.host !== 'string' || !p.host.trim() || !Array.isArray(p.files) || p.files.length < 1 || p.files.length > 30) throw new Error('ops_change requires one host and 1–30 existing regular files')
  if (p.files.some(f => typeof f !== 'string' || f.length > 4096 || !f.startsWith('/') || f === '/' || /[\0\r\n]/.test(f) || f.split('/').some(s => s === '..' || s === '.'))) throw new Error('backup files must be absolute normalized paths')
  if (new Set(p.files).size !== p.files.length) throw new Error('duplicate backup paths')
  for (const key of ['command', 'verify', 'reason'] as const) if (typeof p[key] !== 'string' || !p[key].trim() || p[key].length > 8000 || p[key].includes('\0')) throw new Error(`${key} is required and must be at most 8000 characters`)
  if (p.afterRollback !== undefined && (typeof p.afterRollback !== 'string' || p.afterRollback.length > 8000 || p.afterRollback.includes('\0'))) throw new Error('invalid afterRollback command')
  return p
}

export function changeCommands(p: ChangePlan): string[] { return [p.command, p.verify, p.afterRollback ?? 'true'] }
export function changeRisk(p: ChangePlan, extraRead: ReadonlySet<string>): RiskAssessment {
  const risks = changeCommands(p).map(c => classifyCommand(c, extraRead))
  return { level: risks.some(r => r.level === 'destructive') ? 'destructive' : 'change', elevates: risks.some(r => r.elevates), reasons: ['managed file change with automatic backup and rollback', ...risks.flatMap(r => r.reasons)] }
}
export function describeChange(p: ChangePlan): string {
  return `Backup existing regular files: ${p.files.join(', ')}\nApply:\n${p.command}\nVerify:\n${p.verify}\nOn failure: restore every backup, then run:\n${p.afterRollback || 'true'}\nReason: ${p.reason}`
}

/** One remote transaction: no second SSH connection is needed to start rollback. */
export function changeScript(p: ChangePlan, seconds: number, backupRoot = '/var/tmp'): string {
  const q = shellQuote
  return `umask 077
command -v timeout >/dev/null 2>&1 || { echo 'GNU timeout is required'; exit 20; }
${p.files.map(f => `[ -f ${q(f)} ] && [ ! -L ${q(f)} ] || { echo 'Backup requires an existing regular non-symlink file'; exit 20; }`).join('\n')}
B=$(mktemp -d ${q(`${backupRoot}/wispops-change.XXXXXXXX`)}) || exit 20
echo "Backup directory: $B"
${p.files.map((f, i) => `cp -a -- ${q(f)} "$B/${i}" || exit 21`).join('\n')}
printf '%s\\n' ${p.files.map(q).join(' ')} > "$B/manifest"
started=0
rollback() {
  failed=0
${p.files.map((f, i) => `  if [ -L ${q(f)} ] || [ -d ${q(f)} ]; then failed=1
  else
    T=$(mktemp ${q(`${f}.wispops-restore.XXXXXXXX`)}) && cp -a -- "$B/${i}" "$T" && mv -f -- "$T" ${q(f)} || failed=1
  fi`).join('\n')}
  timeout --signal=TERM --kill-after=2s ${seconds}s sh -ec ${q(p.afterRollback || 'true')} || failed=1
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
timeout --signal=TERM --kill-after=2s ${seconds}s sh -ec ${q(p.command)} || exit 22
echo 'WISPOPS_STAGE=verify'
timeout --signal=TERM --kill-after=2s ${seconds}s sh -ec ${q(p.verify)} || exit 23
started=0
echo 'WISPOPS_CHANGE=verified'
`
}
