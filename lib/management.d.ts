/** Owner-only management API. Never registered as model tools. */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { OpsService } from './service.ts';
import { TaskRunner } from './runner.ts';
import type { LocalVault } from './vault.ts';
import { OpsUpdates } from './updates.ts';
import { AutoInspector } from './auto-inspect.ts';
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
    private readonly runner?;
    private readonly state;
    private readonly library;
    private readonly drafts;
    private readonly scripts;
    private readonly scriptDrafts;
    private pending;
    /** Panel inspections in flight by host, so repeated clicks share one run and one history append. */
    private readonly inspections;
    private readonly sync;
    readonly auto: AutoInspector;
    constructor(service: OpsService, vault: LocalVault, scheduler: () => Scheduler | undefined, updates?: OpsUpdates | undefined, agents?: AgentLookup | undefined, runner?: TaskRunner | undefined);
    /** Serialize writes spanning credentials, bindings, and scheduler membership; long read-only lookups and inspections bypass the queue. */
    dispatch(value: unknown): Promise<unknown>;
    /** Owner-initiated capability probe of a few servers, read-only and without sudo; results join the saved probes. */
    private probeHosts;
    /** The audit log the model sees through ops_history, for the panel: bounded rows, newest last, no secrets. */
    private auditLog;
    /** The latest stored directory scan of each path on one server, for the space map; nothing runs remotely. */
    private spaceUsage;
    /**
     * Read-only inspection of one server without sudo for the panel and the auto inspector; the result joins the same
     * history ops_inspect writes. Other servers inspect in parallel; a second request for this one joins the run in flight.
     */
    private inspectHost;
    private scheduleRecords;
    private update;
    private handle;
    private discardDraft;
    private discardScriptDraft;
    private denyPatterns;
    /** Enabled anywhere: a DSH schedule in any session, or the WispOps timer. */
    private scheduleActive;
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
