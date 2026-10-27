/**
 * Disk-full diagnosis on one host: where the space is, what grew, which
 * large files are still held open by processes or sit in running Slurm job
 * directories, how much space deleted-but-open files pin, and which caches
 * are usually reclaimable. Everything here is read-only; cleanup goes
 * through `ops_exec` and its approval gate, and a later diagnosis of the
 * same path verifies the effect against the stored snapshot.
 * @module dsh-wisp-ops/collectors/disk
 */
import type { FsUsage } from './sections.ts';
export interface DiskOptions {
    /** Absolute path whose filesystem is diagnosed. */
    readonly path: string;
    /** `du` depth below the path. */
    readonly depth: number;
    /** Rows kept per list. */
    readonly top: number;
    /** Files at least this large are listed as large files. */
    readonly minFileMb: number;
    /** Files at least this large and modified within `recentMinutes` are growth suspects. */
    readonly recentMinFileMb: number;
    readonly recentMinutes: number;
    /** Deadline for each `du`/`find` walk. */
    readonly walkTimeoutSec: number;
}
/**
 * Shell lines that print `@@open` (pid, size-if-deleted, target for every open
 * fd whose target is listed in `$<listVar>` field 4 or is deleted),
 * `@@procs` for those pids, and `@@jobs` (running Slurm jobs and their
 * working directories). Shared by the disk and new-file collectors; the
 * caller defines `TAB`.
 */
export declare function holdersScript(listVar: string): string;
/** Build the diagnosis script; every user value is single-quoted. */
export declare function diskScript(o: DiskOptions): string;
export interface Holder {
    readonly pid: number;
    readonly user?: string;
    readonly command?: string;
    readonly elapsedSec?: number;
}
/** Why a large file is or is not a cleanup candidate. */
export type FileVerdict = 'in-use' | 'job-directory' | 'rotated-log' | 'core-dump' | 'recently-written' | 'review';
export interface FileEntry {
    readonly path: string;
    readonly bytes: number;
    readonly modified: string;
    readonly owner: string;
    readonly holders: Holder[];
    readonly job?: RunningJob;
    readonly verdict: FileVerdict;
}
export interface DeletedOpen {
    readonly pid: number;
    readonly bytes: number;
    readonly path: string;
    readonly holder: Holder;
}
export interface KnownDir {
    readonly path: string;
    readonly kb?: number;
    readonly mount?: string;
    readonly sameFilesystem: boolean;
    readonly hint: string;
}
export interface DirUsage {
    readonly path: string;
    readonly kb: number;
    /** Change since the previous snapshot of the same path, when one exists. */
    readonly deltaKb?: number;
}
/** Stored per host and path to compute growth and verify cleanups. */
export interface DiskSnapshot {
    readonly at: string;
    readonly path: string;
    readonly usedKb: number;
    readonly availKb: number;
    readonly usePct: number;
    readonly dirs: Record<string, number>;
}
export interface DiskReport {
    readonly path: string;
    readonly filesystem?: FsUsage;
    readonly inodeUsePct?: number;
    /** Whether /proc of other users was visible (root); without it holders are partial. */
    readonly fullVisibility: boolean;
    readonly walkIncomplete: boolean;
    readonly topDirs: DirUsage[];
    readonly largeFiles: FileEntry[];
    readonly recentFiles: FileEntry[];
    readonly deletedOpen: DeletedOpen[];
    readonly deletedOpenBytes: number;
    readonly journal?: string;
    readonly docker: string[];
    readonly knownDirs: KnownDir[];
    readonly rotatedLogs?: {
        readonly bytes: number;
        readonly count: number;
    };
    /** Comparison against the previous diagnosis of the same path. */
    readonly sincePrevious?: {
        readonly at: string;
        readonly usedDeltaKb: number;
        readonly usePctBefore: number;
    };
    readonly notes: string[];
}
export interface RunningJob {
    readonly id: string;
    readonly user: string;
    readonly workdir: string;
    readonly scheduler?: 'slurm' | 'pbs' | 'lsf';
}
/** Parse the sections printed by {@link holdersScript}. */
export declare function parseHolders(s: ReadonlyMap<string, readonly string[]>): {
    openBy: Map<string, Holder[]>;
    deleted: DeletedOpen[];
    jobs: RunningJob[];
};
export declare function isUnder(path: string, dir: string): boolean;
/** Parse the diagnosis script's output, comparing against the previous snapshot. */
export declare function parseDisk(output: string, options: DiskOptions, previous?: DiskSnapshot): {
    report: DiskReport;
    snapshot?: DiskSnapshot;
};
export declare function bytes(n: number): string;
export declare function holderText(holders: readonly Holder[]): string;
/** Model-facing rendering of one diagnosis. */
export declare function renderDisk(host: string, r: DiskReport): string;
