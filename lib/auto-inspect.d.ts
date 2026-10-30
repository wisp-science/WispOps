import type { Host } from './inventory.ts';
import { LocalState } from './local-state.ts';
import type { OpsService } from './service.ts';
/** Intervals the panel offers, in minutes; 0 is off. */
export declare const AUTO_INSPECT_MINUTES: readonly number[];
export interface AutoInspectState {
    version: 1;
    intervalMinutes: number;
}
export interface AutoInspectStatus {
    intervalMinutes: number;
    running: boolean;
    nextAt?: string;
}
export declare function autoInspectStore(dataDir: string): LocalState<AutoInspectState>;
/** Audit rows name the built-in script by digest; its full text every few minutes would swamp the log. */
export declare const AUTO_INSPECT_AUDIT: string;
export declare class AutoInspector {
    private readonly service;
    private readonly inspect;
    private readonly now;
    readonly state: LocalState<AutoInspectState>;
    private running;
    constructor(service: OpsService, inspect: (host: Host) => Promise<unknown>, now?: () => number);
    /** Start ticking; the returned function stops the timer. */
    start(tickMs?: number): () => void;
    interval(): Promise<number>;
    set(minutes: unknown): Promise<number>;
    /** The interval and when the next server falls due, from each server's newest inspection time. */
    status(latest: readonly (string | undefined)[]): Promise<AutoInspectStatus>;
    /** One pass: inspect every server whose newest inspection is older than the interval. */
    tick(): Promise<void>;
}
