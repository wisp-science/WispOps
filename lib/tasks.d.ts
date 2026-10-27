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
export declare const SCHEDULE_TITLE_PREFIX = "WispOps: ";
export interface TaskRunRecord {
    readonly at: string;
    readonly hosts: readonly string[];
    readonly playbook: TaskSpec['playbook'];
    /** Problems found, by severity, when the playbook reports findings. */
    readonly counts: Record<string, number>;
    /** Head of the collected data, for "what changed since last time". */
    readonly excerpt: string;
}
/** The message a scheduled delivery puts in the Session. */
export declare function taskPrompt(task: TaskSpec): string;
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
