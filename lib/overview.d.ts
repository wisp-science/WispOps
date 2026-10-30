/**
 * Fleet overview for the management panel: the recent inspection history
 * of every inventory host, reduced to what a status matrix and sparklines
 * need. Read-only, owner-only, and bounded: at most `MAX_OVERVIEW_ROWS`
 * inspections per host, a few non-informational findings per inspection,
 * and no command output or credentials.
 * @module dsh-wisp-ops/overview
 */
import type { HistoryRecord } from './store.ts';
import type { Mute } from './mutes.ts';
/** Overall state of one inspection as the panel colors it. */
export type OverviewState = 'ok' | 'warn' | 'crit' | 'unreachable';
export interface OverviewRow {
    readonly at: string;
    readonly state: OverviewState;
    /** Why an unreachable inspection failed: the runner status such as `timeout`, `auth-failed` or `blocked`. */
    readonly status?: string;
    readonly diskPct: Record<string, number>;
    readonly memAvailPct?: number;
    readonly load1?: number;
    readonly cpuPct?: number;
    readonly loginMs?: number;
    readonly rxBps?: number;
    readonly txBps?: number;
    readonly tcpEstablished?: number;
    readonly tcpRetransPct?: number;
    readonly gpuUtilPct?: number;
    readonly gpuMemPct?: number;
    readonly gpuTempC?: number;
    readonly sshFailures1h?: number;
    /** Non-informational findings, newest inspection first in the parent; at most `MAX_FINDINGS` each. A muted one carries the mute covering it. */
    readonly findings: readonly {
        readonly severity: 'warn' | 'crit';
        readonly code: string;
        readonly message: string;
        readonly subject?: string;
        readonly mute?: Mute;
    }[];
}
export interface OverviewHost {
    readonly name: string;
    readonly groups: readonly string[];
    /** Oldest first, so the panel draws time left to right. */
    readonly rows: readonly OverviewRow[];
    /** State of the newest inspection, or 'never' when nothing was recorded. */
    readonly latest: OverviewState | 'never';
    /** Days until each mount of the newest successful inspection fills at its recent growth rate, when it is growing. */
    readonly forecast: Record<string, number>;
    /** Share of inspections that connected and the 95th-percentile login time over the last day and week. */
    readonly reach: {
        readonly day?: number;
        readonly week?: number;
        readonly loginP95?: number;
    };
}
export interface Overview {
    readonly generatedAt: string;
    readonly limit: number;
    readonly hosts: readonly OverviewHost[];
    /** Hosts per latest state, for the summary strip. */
    readonly summary: Record<OverviewState | 'never', number>;
}
export declare const DEFAULT_OVERVIEW_ROWS = 30;
export declare const MAX_OVERVIEW_ROWS = 200;
/** Clamp a client-supplied row count; anything that is not a finite number is the default. */
export declare function overviewLimit(value: unknown): number;
/** State of one stored inspection under the owner's current mutes. */
export declare function recordState(record: HistoryRecord, mutes: readonly Mute[] | undefined, now: number): OverviewState;
/** Reduce one host's stored inspections (oldest first) to overview rows, applying the owner's current mutes. */
export declare function overviewRows(records: readonly HistoryRecord[], mutes?: readonly Mute[], now?: number): OverviewRow[];
/** Days to full per mount of the newest successful inspection, rounded to a tenth. */
export declare function hostForecast(history: readonly HistoryRecord[]): Record<string, number>;
/**
 * Assemble the overview from per-host histories, keeping inventory order. Rows are the newest `limit` inspections;
 * forecasts and reachability use the whole history passed in.
 */
export declare function buildOverview(hosts: readonly {
    name: string;
    groups: readonly string[];
    history: readonly HistoryRecord[];
    mutes?: readonly Mute[];
}[], limit: number, now?: Date): Overview;
