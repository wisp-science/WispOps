/**
 * Muted findings: the owner acknowledges a known problem on one server (a finding code, optionally for one path
 * such as a mount) until a date or until unmuted. A muted finding is still recorded and reported to the agent, but
 * it no longer colors the server's state or raises an alert. Mutes are read when the overview and alerts are built,
 * so muting takes effect at once and an expired mute shows the problem again.
 * @module dsh-wisp-ops/mutes
 */
import type { Finding } from './collectors/inspect.ts';
export interface Mute {
    readonly code: string;
    /** What a finding is about (a mount, a service), or absent for every finding with this code. */
    readonly subject?: string;
    /** ISO time the mute ends; absent until unmuted. */
    readonly until?: string;
}
export declare const MAX_MUTES = 50;
/** What a finding is about: its recorded subject, or for older records the leading path of its message. */
export declare function findingSubject(finding: Pick<Finding, 'message' | 'subject'>): string | undefined;
export declare function validateMutes(value: unknown): Mute[];
/** The mute covering a finding at `now`, if any. */
export declare function muteFor(finding: Pick<Finding, 'code' | 'message' | 'subject'>, mutes: readonly Mute[] | undefined, now: number): Mute | undefined;
