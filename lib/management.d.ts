/** Owner-only management API. Never registered as model tools. */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { OpsService } from './service.ts';
import type { LocalVault } from './vault.ts';
import { OpsUpdates } from './updates.ts';
export interface ScheduledRecord {
    id: string;
    title: string;
    sessionId: string;
    scheduledAt: string;
    status: string;
}
export interface Scheduler {
    catalog(): Promise<ScheduledRecord[]>;
    create(sessionId: string, request: Record<string, unknown>): Promise<{
        id: string;
        scheduledAt: string;
    }>;
    delete(request: {
        sessionId: string;
        id: string;
    }): Promise<{
        deleted: boolean;
    }>;
}
/** Live agents of open sessions; a queued prompt runs the task there exactly like /ops-run. */
export interface AgentLookup {
    (sessionId: string): {
        followup(message: unknown): void;
    } | undefined;
}
export declare class OpsManager {
    readonly service: OpsService;
    readonly vault: LocalVault;
    private readonly scheduler;
    private readonly updates?;
    private readonly agents?;
    private readonly state;
    private readonly library;
    private pending;
    private readonly sync;
    constructor(service: OpsService, vault: LocalVault, scheduler: () => Scheduler | undefined, updates?: OpsUpdates | undefined, agents?: AgentLookup | undefined);
    /** Serialize writes spanning credentials, bindings, and scheduler membership. */
    dispatch(value: unknown): Promise<unknown>;
    private scheduleRecords;
    private update;
    private handle;
    /** Credentials and sudo policy a scheduled or immediate run would need, checked before anything is queued. */
    private assertAutomationReady;
    /** Recent inspection history for every host: read-only, bounded, no command output. */
    private overview;
    private snapshot;
}
export declare class OpsManagement extends TypertRemoteService {
    private readonly manager;
    constructor(ctx: Context, options: {
        service: OpsService;
        vault: LocalVault;
    });
    manage(request: unknown): Promise<unknown>;
}
