import type { Config, NotificationChannel, QuietHours, TaskSpec } from './config.ts';
import type { TaskRunRecord } from './tasks.ts';
export interface Delivery {
    channel: string;
    status: 'sent' | 'failed' | 'skipped';
    detail?: string;
}
/** Keep within the smallest provider limit, without splitting a UTF-8 character. */
export declare function notificationSummary(task: TaskSpec, record: TaskRunRecord): string;
export declare function webhookRequest(channel: NotificationChannel, markdown: string, env?: NodeJS.ProcessEnv, now?: number): {
    url: URL;
    body: object;
    headers: Record<string, string>;
};
/** Count keys that make a run a problem worth a notification. */
export declare const PROBLEM_KEYS: readonly ["warn", "crit", "unreachable", "incomplete", "commandFailed"];
/** The problem counts of a run, in a fixed order, so two runs compare as strings. */
export declare function problemSignature(counts: Record<string, number>): string;
/** Wall-clock `HH:MM` of an instant in a zone; falls back to UTC for an unknown zone. */
export declare function localClock(ms: number, timeZone: string): string;
/** Whether `ms` falls inside the task's quiet window; a window that ends before it starts crosses midnight. */
export declare function inQuietHours(quiet: QuietHours | undefined, ms: number, fallbackZone: string): boolean;
export interface NotifyContext {
    /** The previous run, for `notifyOnChange`. */
    previous?: TaskRunRecord;
    /** Instant used for quiet hours; defaults to the record's time. */
    now?: number;
    /** Zone for quiet hours without their own; defaults to UTC. */
    timeZone?: string;
}
/** Opt-in delivery after durable task recording. Failures never discard the inspection. */
export declare function notifyTask(config: Pick<Config, 'notifications'>, task: TaskSpec, record: TaskRunRecord, signal?: AbortSignal, send?: typeof fetch, context?: NotifyContext): Promise<Delivery[]>;
/** Send one Markdown message to a configured channel. Failures are reported without the endpoint or the provider's reply. */
export declare function deliver(config: Pick<Config, 'notifications'>, channelName: string, markdown: string, signal?: AbortSignal, send?: typeof fetch): Promise<Delivery>;
