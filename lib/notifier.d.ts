import type { Config, NotificationChannel, TaskSpec } from './config.ts';
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
/** Opt-in delivery after durable task recording. Failures never discard the inspection. */
export declare function notifyTask(config: Pick<Config, 'notifications'>, task: TaskSpec, record: TaskRunRecord, signal?: AbortSignal, send?: typeof fetch): Promise<Delivery[]>;
