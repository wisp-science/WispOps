/**
 * Per-server recurring tasks: a task binds hosts to a built-in read-only
 * playbook (or a custom instruction) and an optional schedule. Scheduling
 * goes through the host's DSH Schedule service, which wakes the original
 * Session at the due time; the agent then calls `ops_task` and writes the
 * report. Every run is kept so the next report can say what changed.
 * @module dsh-wisp-ops/tasks
 */
import type { Config, TaskSpec } from './config.ts';
import type { Authorization } from './store.ts';
import type { OpsService } from './service.ts';
import type { Delivery } from './notifier.ts';
import type { ScriptOutcome, ScriptVerdict } from './check-scripts.ts';
export declare const SCHEDULE_TITLE_PREFIX = "WispOps: ";
export interface TaskRunRecord {
    readonly at: string;
    readonly hosts: readonly string[];
    readonly playbook: TaskSpec['playbook'];
    /** Problems found, by severity, when the playbook reports findings. */
    readonly counts: Record<string, number>;
    /** Head of the collected data, for "what changed since last time". */
    readonly excerpt: string;
    /** Per-host verdicts of a check script run (evidence stays in the excerpt). */
    readonly outcomes?: readonly Omit<ScriptOutcome, 'evidence'>[];
    /** Script digest the run used, so a later edit is visible in history. */
    readonly scriptSha256?: string;
}
export declare function hasProblems(record: Pick<TaskRunRecord, 'counts'>): boolean;
/** One line per host (script tasks) or the problem counts, for notifications, the panel and escalations. */
export declare function summarizeRecord(record: TaskRunRecord): {
    verdict: ScriptVerdict | 'problems';
    summary: string;
};
/**
 * The message a scheduled delivery puts in the Session. `run` has the agent run the task;
 * `last` is the escalation of a WispOps-timer run that already collected and recorded
 * evidence, so the agent only reads it.
 */
export declare function taskPrompt(task: TaskSpec, mode?: 'run' | 'last'): string;
/** Translate a task schedule into a DSH Schedule create request. */
export declare function scheduleRequest(task: TaskSpec, config: Pick<Config, 'timeZone'>): Record<string, unknown>;
export declare function describeSchedule(task: TaskSpec, config: Pick<Config, 'timeZone'>): string;
/** Run one task's playbook and return model-facing text plus a run record. */
export declare function runTask(service: OpsService, task: TaskSpec, options: {
    sudo: boolean;
    signal?: AbortSignal;
    session?: string;
    authorization: Authorization;
}): Promise<{
    text: string;
    record: TaskRunRecord;
    previous?: TaskRunRecord;
}>;
/** The model-facing text of a run: header, the user's instruction, the data, and the previous run to compare with. */
export declare function taskText(task: TaskSpec, record: TaskRunRecord, body: string, previous?: TaskRunRecord, deliveries?: readonly Delivery[]): string;
/** The last recorded run as the agent would have seen it, without running anything: evidence is the stored excerpt. */
export declare function lastTaskText(service: OpsService, task: TaskSpec): Promise<{
    text: string;
    record?: TaskRunRecord;
}>;
