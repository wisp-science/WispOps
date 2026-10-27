/**
 * The operations core shared by tools and human commands: fleet command
 * execution, inspection, and disk diagnosis over the inventory, with every
 * remote action written to the audit log. Authorization is decided before
 * this layer (see gate.ts); this layer only executes and records.
 * @module dsh-wisp-ops/service
 */
import type { Config, HostSpec } from './config.ts';
import type { DiskOptions, DiskReport } from './collectors/disk.ts';
import type { Finding, HostInspection, Severity } from './collectors/inspect.ts';
import type { FilesOptions, FilesReport } from './collectors/files.ts';
import type { SecurityReport } from './collectors/security.ts';
import type { HostProbe } from './collectors/probe.ts';
import { Inventory } from './inventory.ts';
import type { Host } from './inventory.ts';
import { GrantStore } from './policy.ts';
import type { RiskLevel } from './risk.ts';
import type { SecretProvider } from './secrets.ts';
import { SshRunner } from './ssh.ts';
import type { RunResult, RunStatus } from './ssh.ts';
import { OpsStore } from './store.ts';
import type { Authorization } from './store.ts';
export interface ExecOptions {
    readonly sudo: boolean;
    /** Capture limit override for built-in collectors. */
    readonly maxOutputBytes?: number;
    readonly timeoutMs: number;
    readonly signal?: AbortSignal;
    /** Recorded in the audit log. */
    readonly tool: string;
    readonly session?: string;
    readonly risk: RiskLevel;
    readonly authorization: Authorization;
    readonly reason?: string;
}
export interface HostInspectionResult {
    readonly host: string;
    readonly status: RunStatus;
    readonly severity: Severity | 'ok' | 'unreachable';
    readonly findings: Finding[];
    readonly report?: HostInspection;
    readonly error?: string;
    readonly durationMs: number;
}
export interface FleetInspection {
    readonly at: string;
    readonly hosts: HostInspectionResult[];
    readonly counts: Record<'ok' | 'info' | 'warn' | 'crit' | 'unreachable', number>;
}
export declare class OpsService {
    readonly config: Config;
    inventory: Inventory;
    private readonly secrets;
    readonly imported: readonly HostSpec[];
    readonly runner: SshRunner;
    readonly store: OpsStore;
    readonly grants: GrantStore;
    private fileStamp;
    constructor(config: Config, inventory: Inventory, secrets: SecretProvider, imported?: readonly HostSpec[]);
    /**
     * Reload the inventory when its file changed since the last load, so edits
     * apply without a restart. A broken edit keeps the previous inventory and
     * reports the error.
     */
    refresh(): Promise<void>;
    /** Resolve a selector and enforce the fleet size limit. */
    select(selector: string): Host[];
    clampTimeout(timeoutMs: number | undefined): number;
    /** Run one script on each host, recording every attempt. */
    execute(hosts: readonly Host[], script: string, options: ExecOptions): Promise<RunResult[]>;
    /** Inspect a fleet, evaluate thresholds and trends, and record history. */
    inspect(hosts: readonly Host[], options: {
        sudo: boolean;
        signal?: AbortSignal;
        session?: string;
        authorization: Authorization;
        tool: string;
    }): Promise<FleetInspection>;
    /** Diagnose one filesystem and store a snapshot for the next comparison. */
    disk(host: Host, options: DiskOptions & {
        sudo: boolean;
        signal?: AbortSignal;
        session?: string;
        authorization: Authorization;
        tool: string;
    }): Promise<{
        report?: DiskReport;
        result: RunResult;
    }>;
    /** Probe capabilities and remember them; key hosts never prompt, so this is safe to run fleet-wide. */
    probe(hosts: readonly Host[], options: {
        signal?: AbortSignal;
        session?: string;
        tool: string;
    }): Promise<{
        host: string;
        status: RunStatus;
        probe?: HostProbe;
        error?: string;
    }[]>;
    /** Recent-file analysis on one host, compared with the previous scan of the same roots and window. */
    files(host: Host, options: FilesOptions & CollectorOptions): Promise<{
        report?: FilesReport;
        result: RunResult;
    }>;
    /** Security triage on a set of hosts. */
    security(hosts: readonly Host[], hoursBack: number, options: CollectorOptions): Promise<{
        host: string;
        report?: SecurityReport;
        result: RunResult;
    }[]>;
    private collector;
}
/** Common options of the built-in read-only collectors. */
export interface CollectorOptions {
    readonly sudo: boolean;
    readonly signal?: AbortSignal;
    readonly session?: string;
    readonly authorization: Authorization;
    readonly tool: string;
}
