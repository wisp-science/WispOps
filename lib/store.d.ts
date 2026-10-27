/**
 * Local durable state: the operation audit log, inspection history, and
 * disk snapshots, as JSON Lines under the configured data directory. Host
 * names are validated by the config schema, so they are safe file names.
 * @module dsh-wisp-ops/store
 */
import type { DiskSnapshot } from './collectors/disk.ts';
import type { HostProbe } from './collectors/probe.ts';
import type { Finding, InspectionMetrics } from './collectors/inspect.ts';
import type { RiskLevel } from './risk.ts';
import type { RunStatus } from './ssh.ts';
/** How a non-read action was authorized. */
export type Authorization = 'read-only' | 'policy' | 'grant' | 'approval' | 'task';
export interface AuditEntry {
    readonly at: string;
    readonly session?: string;
    readonly tool: string;
    readonly host: string;
    readonly risk: RiskLevel;
    readonly sudo: boolean;
    readonly authorization: Authorization;
    readonly command: string;
    readonly reason?: string;
    readonly status: RunStatus;
    readonly exitCode: number | null;
    readonly durationMs: number;
}
export interface HistoryRecord extends InspectionMetrics {
    readonly status: RunStatus;
    readonly findings: readonly Finding[];
}
export declare class OpsStore {
    private readonly dir;
    constructor(dir: string);
    private ensure;
    audit(entry: AuditEntry): Promise<void>;
    readAudit(filter: {
        hosts?: ReadonlySet<string>;
        sinceMs?: number;
        limit: number;
    }): Promise<AuditEntry[]>;
    appendHistory(host: string, record: HistoryRecord): Promise<void>;
    readHistory(host: string, limit: number): Promise<HistoryRecord[]>;
    /** The latest successful inspection, used as the trend baseline. */
    lastHealthy(host: string): Promise<HistoryRecord | undefined>;
    diskSnapshot(host: string, path: string): Promise<DiskSnapshot | undefined>;
    saveDiskSnapshot(host: string, snapshot: DiskSnapshot): Promise<void>;
    probes(): Promise<Record<string, HostProbe>>;
    saveProbes(update: Record<string, HostProbe>): Promise<void>;
    /** Append to a bounded per-key JSON Lines log under `sub/`. */
    appendBounded<T>(sub: string, key: string, row: T, keep?: number): Promise<void>;
    readBounded<T>(sub: string, key: string): Promise<T[]>;
}
