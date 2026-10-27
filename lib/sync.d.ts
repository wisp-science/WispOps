import type { LocalVault } from './vault.ts';
import type { OpsService } from './service.ts';
/** Explicit owner actions only; snapshots never include grants, audit history or live schedules. */
export declare class OpsSync {
    private readonly service;
    private readonly vault;
    private readonly hasSchedules;
    private readonly transport;
    private readonly state;
    private readonly library;
    private readonly previews;
    constructor(service: OpsService, vault: LocalVault, hasSchedules: () => Promise<boolean>, transport?: typeof fetch);
    private revisions;
    private snapshot;
    private validate;
    handle(action: string, request: Record<string, unknown>): Promise<unknown>;
}
