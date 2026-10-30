/**
 * Fleet overview for the management panel: the recent inspection history
 * of every inventory host, reduced to what a status matrix and sparklines
 * need. Read-only, owner-only, and bounded: at most `MAX_OVERVIEW_ROWS`
 * inspections per host, a few non-informational findings per inspection,
 * and no command output or credentials.
 * @module dsh-wisp-ops/overview
 */

import { worstSeverity } from './collectors/inspect.ts'
import type { HistoryRecord } from './store.ts'
import { forecastFull, reachability } from './trends.ts'
import { findingSubject, muteFor } from './mutes.ts'
import type { Mute } from './mutes.ts'

/** Overall state of one inspection as the panel colors it. */
export type OverviewState = 'ok' | 'warn' | 'crit' | 'unreachable'

export interface OverviewRow {
  readonly at: string
  readonly state: OverviewState
  /** Why an unreachable inspection failed: the runner status such as `timeout`, `auth-failed` or `blocked`. */
  readonly status?: string
  readonly diskPct: Record<string, number>
  readonly memAvailPct?: number
  readonly load1?: number
  readonly cpuPct?: number
  readonly loginMs?: number
  readonly rxBps?: number
  readonly txBps?: number
  readonly tcpEstablished?: number
  readonly tcpRetransPct?: number
  readonly gpuUtilPct?: number
  readonly gpuMemPct?: number
  readonly gpuTempC?: number
  readonly sshFailures1h?: number
  /** Non-informational findings, newest inspection first in the parent; at most `MAX_FINDINGS` each. A muted one carries the mute covering it. */
  readonly findings: readonly { readonly severity: 'warn' | 'crit'; readonly code: string; readonly message: string; readonly subject?: string; readonly mute?: Mute }[]
}

export interface OverviewHost {
  readonly name: string
  readonly groups: readonly string[]
  /** Oldest first, so the panel draws time left to right. */
  readonly rows: readonly OverviewRow[]
  /** State of the newest inspection, or 'never' when nothing was recorded. */
  readonly latest: OverviewState | 'never'
  /** Days until each mount of the newest successful inspection fills at its recent growth rate, when it is growing. */
  readonly forecast: Record<string, number>
  /** Share of inspections that connected and the 95th-percentile login time over the last day and week. */
  readonly reach: { readonly day?: number; readonly week?: number; readonly loginP95?: number }
}

export interface Overview {
  readonly generatedAt: string
  readonly limit: number
  readonly hosts: readonly OverviewHost[]
  /** Hosts per latest state, for the summary strip. */
  readonly summary: Record<OverviewState | 'never', number>
}

export const DEFAULT_OVERVIEW_ROWS = 30
export const MAX_OVERVIEW_ROWS = 200
const MAX_FINDINGS = 6
const MAX_MESSAGE = 240

/** Clamp a client-supplied row count; anything that is not a finite number is the default. */
export function overviewLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_OVERVIEW_ROWS
  return Math.min(MAX_OVERVIEW_ROWS, Math.max(1, Math.floor(value)))
}

/** `{ key: value }` for a finite number, else nothing, so rows never carry NaN or strings from a damaged file. */
const finite = <K extends string>(key: K, value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? { [key]: value } : {}) as { [P in K]?: number }

/** State of one stored inspection under the owner's current mutes. */
export function recordState(record: HistoryRecord, mutes: readonly Mute[] | undefined, now: number): OverviewState {
  if (record.status !== 'ok') return 'unreachable'
  const worst = worstSeverity((record.findings ?? []).filter(f => !muteFor(f, mutes, now)))
  return worst === 'info' ? 'ok' : worst
}

/** Reduce one host's stored inspections (oldest first) to overview rows, applying the owner's current mutes. */
export function overviewRows(records: readonly HistoryRecord[], mutes?: readonly Mute[], now = Date.now()): OverviewRow[] {
  return records.map(record => ({
    at: record.at,
    state: recordState(record, mutes, now),
    ...record.status === 'ok' ? {} : { status: record.status },
    diskPct: Object.fromEntries(Object.entries(record.diskPct ?? {}).filter(([, pct]) => typeof pct === 'number' && Number.isFinite(pct))),
    ...record.memAvailPct === undefined ? {} : { memAvailPct: record.memAvailPct },
    ...record.load1 === undefined ? {} : { load1: record.load1 },
    ...record.cpuPct === undefined ? {} : { cpuPct: record.cpuPct },
    ...finite('loginMs', record.loginMs),
    ...finite('rxBps', record.rxBps),
    ...finite('txBps', record.txBps),
    ...finite('tcpEstablished', record.tcpEstablished),
    ...finite('tcpRetransPct', record.tcpRetransPct),
    ...finite('gpuUtilPct', record.gpuUtilPct),
    ...finite('gpuMemPct', record.gpuMemPct),
    ...finite('gpuTempC', record.gpuTempC),
    ...finite('sshFailures1h', record.sshFailures1h),
    findings: (record.findings ?? [])
      .filter((f): f is typeof f & { severity: 'warn' | 'crit' } => f.severity === 'crit' || f.severity === 'warn')
      .map(f => ({ f, mute: muteFor(f, mutes, now) }))
      // Live problems first, critical before warning; muted ones last.
      .sort((a, b) => Number(!!a.mute) - Number(!!b.mute) || (a.f.severity === b.f.severity ? 0 : a.f.severity === 'crit' ? -1 : 1))
      .slice(0, MAX_FINDINGS)
      .map(({ f, mute }) => {
        const subject = findingSubject(f)
        return { severity: f.severity, code: f.code, message: f.message.length > MAX_MESSAGE ? `${f.message.slice(0, MAX_MESSAGE)}…` : f.message, ...subject === undefined ? {} : { subject }, ...mute === undefined ? {} : { mute } }
      }),
  }))
}

/** Days to full per mount of the newest successful inspection, rounded to a tenth. */
export function hostForecast(history: readonly HistoryRecord[]): Record<string, number> {
  const ok = history.filter(r => r.status === 'ok' && r.diskPct)
  const latest = ok.at(-1)
  if (latest === undefined) return {}
  return Object.fromEntries(Object.keys(latest.diskPct).flatMap(mount => {
    const forecast = forecastFull(ok.flatMap(r => typeof r.diskPct[mount] === 'number' ? [{ at: Date.parse(r.at), pct: r.diskPct[mount] as number }] : []))
    return forecast === undefined ? [] : [[mount, Math.round(forecast.days * 10) / 10]]
  }))
}

/**
 * Assemble the overview from per-host histories, keeping inventory order. Rows are the newest `limit` inspections;
 * forecasts and reachability use the whole history passed in.
 */
export function buildOverview(hosts: readonly { name: string; groups: readonly string[]; history: readonly HistoryRecord[]; mutes?: readonly Mute[] }[], limit: number, now = new Date()): Overview {
  const summary: Overview['summary'] = { ok: 0, warn: 0, crit: 0, unreachable: 0, never: 0 }
  const result = hosts.map(host => {
    const rows = overviewRows(host.history.slice(-limit), host.mutes, now.getTime())
    const latest: OverviewState | 'never' = rows.at(-1)?.state ?? 'never'
    summary[latest] += 1
    const day = reachability(host.history, now.getTime() - 86_400_000)
    const week = reachability(host.history, now.getTime() - 7 * 86_400_000)
    const reach = { ...day.pct === undefined ? {} : { day: day.pct }, ...week.pct === undefined ? {} : { week: week.pct }, ...day.loginP95 === undefined ? {} : { loginP95: day.loginP95 } }
    return { name: host.name, groups: [...host.groups], rows, latest, forecast: hostForecast(host.history), reach }
  })
  return { generatedAt: now.toISOString(), limit, hosts: result, summary }
}
