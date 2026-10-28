/**
 * Owner-reviewed check scripts. A script travels to each linked server on stdin
 * exactly like the built-in collectors, so it is never classified line by line:
 * the trust decision is the owner saving it in the panel. The model can only
 * propose drafts. Its output follows a small contract, so WispOps can judge a
 * run, record it, notify and decide whether the agent is needed at all:
 *
 * - exit 0 = ok, 1 = warning, 2 = critical, anything else = failed
 * - the first non-empty stdout line is a one-line summary; the rest is evidence
 * - an optional `WISPOPS-JSON: {"key": number, …}` line carries metrics
 * @module dsh-wisp-ops/check-scripts
 */
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { LocalState } from './local-state.ts'
import { deniedByPattern } from './gate.ts'
import type { RunResult } from './ssh.ts'

export interface CheckScript {
  id: string
  title: string
  description: string
  /** POSIX shell, run with `sh -s` on every linked server. */
  content: string
  /** Of `content`, recomputed on every save so a task record can name the exact script it ran. */
  sha256: string
  timeoutSec: number
  updatedAt: string
}

export type ScriptVerdict = 'ok' | 'warn' | 'crit' | 'failed' | 'unreachable'

export interface ScriptOutcome {
  host: string
  verdict: ScriptVerdict
  exitCode: number | null
  /** First non-empty stdout line, bounded. */
  summary: string
  /** Remaining output, bounded; stored only in the run excerpt. */
  evidence: string
  metrics?: Record<string, number>
}

export const MAX_SCRIPT_BYTES = 64 * 1024
export const DEFAULT_SCRIPT_TIMEOUT_SEC = 120
export const MAX_SCRIPT_TIMEOUT_SEC = 3600
const MAX_SUMMARY_CHARS = 300
const MAX_EVIDENCE_CHARS = 4000
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/
const METRICS_LINE = /^WISPOPS-JSON:\s*(\{.*\})\s*$/

export const SCRIPT_CONTRACT = 'Exit 0 = ok, 1 = warning, 2 = critical, other = failed. The first non-empty stdout line is the one-line summary (it goes into notifications and to the agent); everything after it is evidence. An optional line "WISPOPS-JSON: {\"key\": number}" records metrics.'

export function scriptDigest(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function validateScript(value: unknown): CheckScript {
  const raw = value as Partial<CheckScript> | undefined
  if (!raw || typeof raw !== 'object') throw new Error('脚本格式不正确。')
  if (typeof raw.id !== 'string' || !ID.test(raw.id) || raw.id === 'all' || raw.id.startsWith('builtin.')) throw new Error('脚本标识无效：字母、数字、点、连字符或下划线，不能使用保留名称。')
  if (typeof raw.title !== 'string' || !raw.title.trim() || raw.title.length > 120) throw new Error('请填写脚本标题，最多 120 个字符。')
  if (raw.description !== undefined && (typeof raw.description !== 'string' || raw.description.length > 1000)) throw new Error('脚本说明最多 1000 个字符。')
  if (typeof raw.content !== 'string' || !raw.content.trim()) throw new Error('请填写脚本内容。')
  if (/\0/.test(raw.content)) throw new Error('脚本内容包含无效字符。')
  if (Buffer.byteLength(raw.content) > MAX_SCRIPT_BYTES) throw new Error(`脚本最多 ${MAX_SCRIPT_BYTES / 1024} KB。`)
  const timeoutSec = raw.timeoutSec === undefined ? DEFAULT_SCRIPT_TIMEOUT_SEC : raw.timeoutSec
  if (!Number.isInteger(timeoutSec) || timeoutSec < 5 || timeoutSec > MAX_SCRIPT_TIMEOUT_SEC) throw new Error(`超时须为 5 到 ${MAX_SCRIPT_TIMEOUT_SEC} 秒的整数。`)
  const content = raw.content.replace(/\r\n/g, '\n')
  const updatedAt = typeof raw.updatedAt === 'string' && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : new Date().toISOString()
  return { id: raw.id, title: raw.title.trim(), description: (raw.description ?? '').trim(), content, sha256: scriptDigest(content), timeoutSec, updatedAt }
}

/** The first script line the deploy-wide deny list refuses; the same last word commands get. */
export function deniedScriptLine(content: string, patterns: readonly RegExp[]): { line: string; source: string } | undefined {
  for (const line of content.split('\n')) {
    const hit = deniedByPattern(line, patterns)
    if (hit !== undefined) return { line: line.slice(0, 120), source: hit.source }
  }
  return undefined
}

export function scriptStore(dataDir: string) {
  return new LocalState<{ version: 1; entries: CheckScript[] }>(join(dataDir, 'check-scripts.json'), () => ({ version: 1, entries: [] }), value => {
    const raw = value as { version: number; entries: unknown[] }
    if (raw?.version !== 1 || !Array.isArray(raw.entries)) throw new Error('Invalid check script library')
    const entries = raw.entries.map(validateScript)
    if (new Set(entries.map(s => s.id)).size !== entries.length) throw new Error('脚本标识重复。')
    return { version: 1, entries }
  })
}

export interface ScriptDraft { id: string; createdAt: string; script: CheckScript }
const MAX_DRAFTS = 10

/** Scripts the model proposed. Only the owner moves one into the library, from the panel form. */
export function scriptDraftStore(dataDir: string) {
  return new LocalState<{ version: 1; entries: ScriptDraft[] }>(join(dataDir, 'check-script-drafts.json'), () => ({ version: 1, entries: [] }), value => {
    const raw = value as { version: number; entries: ScriptDraft[] }
    if (raw?.version !== 1 || !Array.isArray(raw.entries)) throw new Error('Invalid check script drafts')
    return { version: 1, entries: raw.entries.map(d => {
      if (typeof d?.id !== 'string' || typeof d.createdAt !== 'string') throw new Error('Invalid check script draft')
      return { id: d.id, createdAt: d.createdAt, script: validateScript(d.script) }
    }) }
  })
}

export async function addScriptDraft(dataDir: string, script: unknown): Promise<ScriptDraft> {
  const store = scriptDraftStore(dataDir)
  const draft = { id: randomUUID(), createdAt: new Date().toISOString(), script: validateScript(script) }
  await store.change((await store.read()).revision, state => ({ version: 1, entries: [...state.entries.filter(d => d.script.id !== draft.script.id), draft].slice(-MAX_DRAFTS) }))
  return draft
}

function bounded(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}… (truncated)` : text
}

/** Judge one host's run by the output contract. Transport failures never count as script verdicts. */
export function parseScriptResult(result: RunResult): ScriptOutcome {
  const base = { host: result.host, exitCode: result.exitCode }
  if (result.status !== 'ok' && result.status !== 'failed') {
    return { ...base, verdict: 'unreachable', summary: `${result.status}${result.stderr.trim() ? `: ${bounded(result.stderr.trim().split('\n').at(-1) ?? '', MAX_SUMMARY_CHARS)}` : ''}`, evidence: '' }
  }
  const lines = result.stdout.replace(/\r\n/g, '\n').split('\n')
  let metrics: Record<string, number> | undefined
  const kept: string[] = []
  for (const line of lines) {
    const match = METRICS_LINE.exec(line)
    if (match === null) { kept.push(line); continue }
    try {
      const parsed = JSON.parse(match[1]!) as Record<string, unknown>
      const numbers = Object.fromEntries(Object.entries(parsed).filter(([key, v]) => /^[A-Za-z0-9_.-]{1,60}$/.test(key) && typeof v === 'number' && Number.isFinite(v)).slice(0, 50)) as Record<string, number>
      if (Object.keys(numbers).length > 0) metrics = { ...metrics, ...numbers }
    } catch { kept.push(line) }
  }
  const first = kept.findIndex(line => line.trim().length > 0)
  const summaryLine = first === -1 ? '' : kept[first]!.trim()
  const rest = first === -1 ? '' : kept.slice(first + 1).join('\n').trim()
  const verdict: ScriptVerdict = result.exitCode === 0 ? 'ok' : result.exitCode === 1 ? 'warn' : result.exitCode === 2 ? 'crit' : 'failed'
  const stderr = result.stderr.trim()
  const summary = summaryLine || (verdict === 'failed' && stderr ? stderr.split('\n').at(-1)! : verdict === 'ok' ? 'ok (no output)' : `exit ${result.exitCode ?? '?'} (no output)`)
  const evidence = [rest, stderr && verdict !== 'ok' ? `[stderr]\n${stderr}` : ''].filter(Boolean).join('\n')
  return { ...base, verdict, summary: bounded(summary, MAX_SUMMARY_CHARS), evidence: bounded(evidence, MAX_EVIDENCE_CHARS) + (result.truncated ? '\n(output truncated by the capture limit)' : ''), ...metrics === undefined ? {} : { metrics } }
}

/** Model-facing body: summaries first so a bounded excerpt never loses them, evidence after. */
export function renderScriptOutcomes(script: Pick<CheckScript, 'id' | 'title' | 'sha256'>, outcomes: readonly ScriptOutcome[]): string {
  const head = [`## Check script "${script.title}" (${script.id}, sha256 ${script.sha256.slice(0, 12)}) on ${outcomes.length} host(s)`, 'Verdicts come from the script\'s exit status; failed = the script itself broke, unreachable = no result from the host.', '', ...outcomes.map(o => `- ${o.host}: ${o.verdict} — ${o.summary}${o.metrics ? ` {${Object.entries(o.metrics).map(([k, v]) => `${k}=${v}`).join(', ')}}` : ''}`)]
  const detail = outcomes.filter(o => o.evidence.length > 0).map(o => `### ${o.host} (${o.verdict}${o.exitCode === null ? '' : `, exit ${o.exitCode}`})\n${o.evidence}`)
  return [...head, ...detail.length ? ['', ...detail] : []].join('\n')
}

export function worstVerdict(outcomes: readonly Pick<ScriptOutcome, 'verdict'>[]): ScriptVerdict {
  const order: ScriptVerdict[] = ['ok', 'warn', 'failed', 'unreachable', 'crit']
  return outcomes.reduce<ScriptVerdict>((worst, o) => order.indexOf(o.verdict) > order.indexOf(worst) ? o.verdict : worst, 'ok')
}
