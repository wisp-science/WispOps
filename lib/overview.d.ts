/**
 * Fleet overview for the management panel: the recent inspection history
 * of every inventory host, reduced to what a status matrix and sparklines
 * need. Read-only, owner-only, and bounded: at most `MAX_OVERVIEW_ROWS`
 * inspections per host, a few non-informational findings per inspection,
 * and no command output or credentials.
 * @module dsh-wisp-ops/overview
 */
import type { HistoryRecord } from './store.ts';
/** Overall state of one inspection as the panel colors it. */
export type OverviewState = 'ok' | 'warn' | 'crit' | 'unreachable';
export interface OverviewRow {
    readonly at: string;
    readonly state: OverviewState;
    readonly diskPct: Record<string, number>;
    readonly memAvailPct?: number;
    readonly load1?: number;
    readonly cpuPct?: number;
    readonly loginMs?: number;
    readonly rxBps?: number;
    readonly txBps?: number;
    readonly tcpEstablished?: number;
    readonly tcpRetransPct?: number;
    /** Non-informational findings, newest inspection first in the parent; at most `MAX_FINDINGS` each. */
    readonly findings: readonly {
        readonly severity: 'warn' | 'crit';
        readonly code: string;
        readonly message: string;
    }[];
}
export interface OverviewHost {
    readonly name: string;
    readonly groups: readonly string[];
    /** Oldest first, so the panel draws time left to right. */
    readonly rows: readonly OverviewRow[];
    /** State of the newest inspection, or 'never' when nothing was recorded. */
    readonly latest: OverviewState | 'never';
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
/** Reduce one host's stored inspections (oldest first) to overview rows. */
export declare function overviewRows(records: readonly HistoryRecord[]): OverviewRow[];
/** Assemble the overview from per-host histories, keeping inventory order. */
export declare function buildOverview(hosts: readonly {
    name: string;
    groups: readonly string[];
    history: readonly HistoryRecord[];
}[], limit: number, now?: Date): Overview;
