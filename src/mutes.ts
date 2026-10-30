/**
 * Muted findings: the owner acknowledges a known problem on one server (a finding code, optionally for one path
 * such as a mount) until a date or until unmuted. A muted finding is still recorded and reported to the agent, but
 * it no longer colors the server's state or raises an alert. Mutes are read when the overview and alerts are built,
 * so muting takes effect at once and an expired mute shows the problem again.
 * @module dsh-wisp-ops/mutes
 */
import type { Finding } from './collectors/inspect.ts'

export interface Mute {
  readonly code: string
  /** What a finding is about (a mount, a service), or absent for every finding with this code. */
  readonly subject?: string
  /** ISO time the mute ends; absent until unmuted. */
  readonly until?: string
}

export const MAX_MUTES = 50

/** What a finding is about: its recorded subject, or for older records the leading path of its message. */
export function findingSubject(finding: Pick<Finding, 'message' | 'subject'>): string | undefined {
  return finding.subject ?? /^(\/\S*)/.exec(finding.message)?.[1]
}

export function validateMutes(value: unknown): Mute[] {
  if (!Array.isArray(value) || value.length > MAX_MUTES) throw new Error(`Mutes must be a list of at most ${MAX_MUTES}`)
  return value.map(raw => {
    const mute = raw as Record<string, unknown>
    if (typeof mute?.code !== 'string' || !/^[a-z0-9-]{1,40}$/.test(mute.code)) throw new Error('Invalid mute')
    if (mute.subject !== undefined && (typeof mute.subject !== 'string' || mute.subject.length === 0 || mute.subject.length > 2048)) throw new Error('Invalid mute subject')
    if (mute.until !== undefined && (typeof mute.until !== 'string' || !Number.isFinite(Date.parse(mute.until)))) throw new Error('Invalid mute end')
    return { code: mute.code, ...mute.subject === undefined ? {} : { subject: mute.subject }, ...mute.until === undefined ? {} : { until: mute.until } }
  })
}

/** The mute covering a finding at `now`, if any. */
export function muteFor(finding: Pick<Finding, 'code' | 'message' | 'subject'>, mutes: readonly Mute[] | undefined, now: number): Mute | undefined {
  return mutes?.find(m => m.code === finding.code && (m.subject === undefined || m.subject === findingSubject(finding)) && (m.until === undefined || Date.parse(m.until) > now))
}
