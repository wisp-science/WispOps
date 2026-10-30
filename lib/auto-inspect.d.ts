import type { Host } from './inventory.ts';
import { LocalState } from './local-state.ts';
import type { Mute } from './mutes.ts';
import type { OverviewState } from './overview.ts';
import type { OpsService } from './service.ts';
import type { HistoryRecord } from './store.ts';
/** Intervals the panel offers, in minutes; 0 is off. */
export declare const AUTO_INSPECT_MINUTES: readonly number[];
export interface AutoInspectState {
    version: 1;
    intervalMinutes: number;
    /** Notification channels that receive state changes. */
    notify: string[];
    /** The state last reported per server, so only changes are sent. */
    notified: Record<string, OverviewState>;
    /** The latest alert and the channels it could not reach. */
    lastAlert?: {
        at: string;
        failed: string[];
    };
}
export interface AutoInspectStatus {
    intervalMinutes: number;
    running: boolean;
    nextAt?: string;
    notify: string[];
    lastAlert?: {
        at: string;
        failed: string[];
    };
}
export declare function autoInspectStore(dataDir: string): LocalState<AutoInspectState>;
/** Audit rows name the built-in script by digest; its full text every few minutes would swamp the log. */
export declare const AUTO_INSPECT_AUDIT: string;
/** One line per server whose state changed, with what it is about now. */
export declare function alertMessage(changes: readonly {
    host: string;
    before: OverviewState;
    after: OverviewState;
    record: HistoryRecord;
    mutes?: readonly Mute[];
}[], now: number): string;
export declare class AutoInspector {
    private readonly service;
    private readonly inspect;
    private readonly now;
    private readonly send;
    readonly state: LocalState<AutoInspectState>;
    private running;
    constructor(service: OpsService, inspect: (host: Host) => Promise<unknown>, now?: () => number, send?: typeof fetch);
    /** Start ticking; the returned function stops the timer. */
    start(tickMs?: number): () => void;
    interval(): Promise<number>;
    set(minutes: unknown): Promise<number>;
    /** Choose the channels for state-change alerts; only channels in the configuration are accepted. */
    setNotify(channels: unknown): Promise<string[]>;
    /** The interval and when the next server falls due, from each server's newest inspection time. */
    status(latest: readonly (string | undefined)[]): Promise<AutoInspectStatus>;
    /** One pass: inspect every server whose newest inspection is older than the interval, then report state changes. */
    tick(): Promise<void>;
    /** Compare each server's newest state with the one last reported, and send the changes to the chosen channels. */
    alert(): Promise<void>;
    private edit;
}
