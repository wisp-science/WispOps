export interface UpdateHost {
    listBundles(): Promise<{
        name: string;
        source?: string;
        installed: boolean;
        enabled: boolean;
    }[]>;
    installBundle(spec: string, options: {
        enabled: boolean;
        saveExact: boolean;
    }): Promise<{
        changed: boolean;
        application: string;
        version?: string;
        error?: {
            code: string;
        };
        pendingBuilds?: string[];
    }>;
}
export interface UpdateStatus {
    checkedAt?: string;
    current: string;
    latest?: string;
    sha?: string;
    releaseUrl?: string;
    available: boolean;
    state: 'unchecked' | 'no-release' | 'current' | 'available' | 'restart-required' | 'failed';
    detail?: string;
}
export declare function newerStable(next: string, current: string): boolean;
/** Uses the host's installer and its compatibility/script checks; never edits plugin files. */
export declare class OpsUpdates {
    private readonly manager;
    private readonly hasHmr;
    private readonly send;
    private readonly root;
    private readonly settings;
    private pending;
    private runningVersion?;
    constructor(dataDir: string, manager: () => UpdateHost | undefined, hasHmr: () => boolean, send?: typeof fetch, root?: string);
    dispatch(action: string, request?: Record<string, unknown>): Promise<unknown>;
    private current;
    private saveStatus;
    private github;
    private check;
    private install;
    private handle;
}
