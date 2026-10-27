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
/** One host's outcome of a managed change, kept so retained backups can be listed later. */
export interface ChangeRecord {
    readonly at: string;
    readonly session?: string;
    readonly host: string;
    readonly outcome: 'verified' | 'rolled-back' | 'rollback-failed' | 'refused' | 'unknown';
    readonly status: RunStatus;
    readonly exitCode: number | null;
    /** Remote backup directory, when the transaction got far enough to create one. */
    readonly backupDir?: string;
    readonly files: readonly string[];
    readonly newFiles: readonly string[];
    readonly directories: readonly string[];
    readonly reason: string;
    readonly sudo: boolean;
}
export interface HistoryRecord extends InspectionMetrics {
    readonly status: RunStatus;
    readonly findings: readonly Finding[];
}
/** Read newest first in fixed-size chunks; buffers preserve split UTF-8 characters. */
export declare function reverseJsonLines<T>(path: string): AsyncGenerator<T>;
export interface StoreRetention {
    /** Inspection records kept per host. */
    readonly inspectionRecords: number;
    /** Monthly audit partitions kept, counting the current one; 0 keeps all. */
    readonly auditMonths: number;
}
export declare const DEFAULT_RETENTION: StoreRetention;
/** First month that `auditMonths` retention keeps, as `YYYY-MM`. */
export declare function auditCutoffMonth(auditMonths: number, now: Date): string;
export declare class OpsStore {
    private readonly dir;
    private readonly retention;
    private prunedFor;
    constructor(dir: string, retention?: StoreRetention);
    private ensure;
    /** Replace a JSON Lines file with the newest `keep` rows plus `row`, through a rename so readers never see a torn file. */
    private writeBounded;
    audit(entry: AuditEntry): Promise<void>;
    /** Delete monthly audit partitions older than the retention window; the legacy `audit.jsonl` is left alone. */
    pruneAudit(now?: Date): Promise<string[]>;
    readAudit(filter: {
        hosts?: ReadonlySet<string>;
        sinceMs?: number;
        limit: number;
    }): Promise<AuditEntry[]>;
    /** Append one inspection, keeping only the newest `retention.inspectionRecords` per host. */
    appendHistory(host: string, record: HistoryRecord): Promise<void>;
    readHistory(host: string, limit: number): Promise<HistoryRecord[]>;
    /** The latest successful inspection, used as the trend baseline. */
    lastHealthy(host: string): Promise<HistoryRecord | undefined>;
    diskSnapshot(host: string, path: string): Promise<DiskSnapshot | undefined>;
    saveDiskSnapshot(host: string, snapshot: DiskSnapshot): Promise<void>;
    probes(): Promise<Record<string, HostProbe>>;
    saveProbes(update: Record<string, HostProbe>): Promise<void>;
    /** Append to a bounded per-key JSON Lines log under `sub/`. */
    recordChange(record: ChangeRecord): Promise<void>;
    readChanges(host: string, limit: number): Promise<ChangeRecord[]>;
    appendBounded<T>(sub: string, key: string, row: T, keep?: number): Promise<void>;
    readBounded<T>(sub: string, key: string): Promise<T[]>;
}
