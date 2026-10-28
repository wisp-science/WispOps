import type { TaskSpec } from './config.ts';
import { LocalState } from './local-state.ts';
import type { OpsService } from './service.ts';
import type { TaskRunRecord } from './tasks.ts';
export interface TimerEntry {
    /** Session that receives escalations; absent for `never`. */
    sessionId?: string;
    enabledAt: string;
    /** A `problems` run whose escalation could not be delivered yet (session not open). */
    pendingEscalation?: string;
    /** Why the latest attempt did not run or escalate; never credentials or output. */
    lastError?: string;
}
export interface TimerState {
    version: 1;
    tasks: Record<string, TimerEntry>;
}
export interface AgentLookup {
    (sessionId: string): {
        followup(message: unknown): void;
    } | undefined;
}
export declare function timerStore(dataDir: string): LocalState<TimerState>;
/** Runs on the WispOps timer: defined, enabled here, and not reporting through a DSH schedule. */
export declare function timerTask(task: TaskSpec | undefined): task is TaskSpec;
export declare class TaskRunner {
    private readonly service;
    private readonly agents?;
    private readonly now;
    readonly state: LocalState<TimerState>;
    private readonly running;
    constructor(service: OpsService, agents?: AgentLookup | undefined, now?: () => number);
    /** Start ticking; the returned function stops the timer. */
    start(intervalMs?: number): () => void;
    enable(name: string, sessionId: string | undefined): Promise<void>;
    disable(name: string): Promise<void>;
    entries(): Promise<Record<string, TimerEntry>>;
    /** What the panel shows for an enabled task: the next slot and any pending escalation or error. */
    status(task: TaskSpec, lastRun: string | undefined): Promise<(TimerEntry & {
        nextAt?: string;
    }) | undefined>;
    /** One pass: deliver pending escalations, then run every enabled task whose slot is due. */
    tick(): Promise<void>;
    /** Run a timer task now: record, notify, and escalate when the mode asks for it. Errors are kept per task, never thrown to the timer. */
    run(task: TaskSpec, sessionId: string | undefined): Promise<{
        record?: TaskRunRecord;
        escalated: boolean;
        error?: string;
    }>;
    /** Queue the "read the evidence" prompt; a closed session keeps the escalation pending for the next tick. */
    private escalate;
    private edit;
}
