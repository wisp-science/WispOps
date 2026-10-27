/**
 * Recent-file analysis (近期新增文件分析): what appeared or changed under some
 * paths in the last N days, where it landed, who wrote it, what kind of data
 * it is (with sequencing and analysis-pipeline knowledge), which of it is
 * still in use, which files a sibling makes redundant, which pipeline work
 * directories belong to finished runs, and a cleanup plan ordered by
 * reclaimable space. Read-only; the plan is executed through ops_exec.
 * @module dsh-wisp-ops/collectors/files
 */
import type { Holder, RunningJob } from './disk.ts';
import type { FileKind, Redundancy, Retention } from './omics.ts';
export interface FilesOptions {
    /** Absolute roots to scan. */
    readonly paths: readonly string[];
    /** Window: files modified within this many days. */
    readonly days: number;
    /** Directory aggregation depth below each root. */
    readonly depth: number;
    /** Files at least this large are listed and classified individually. */
    readonly listMinMb: number;
    /** Most individually listed files. */
    readonly maxFiles: number;
    readonly top: number;
    readonly walkTimeoutSec: number;
}
/** Build the scan script; every root is single-quoted. */
export declare function filesScript(o: FilesOptions): string;
export interface RecentFile {
    readonly path: string;
    readonly bytes: number;
    readonly modified: string;
    readonly owner: string;
    readonly kind: FileKind;
    readonly holders: Holder[];
    readonly job?: RunningJob;
    readonly redundantWith?: Redundancy;
}
export interface PipelineDir {
    readonly path: string;
    readonly kb?: number;
    readonly modified: string;
    /** Run state as far as markers tell (complete, failed, incomplete-jobs, locked-running, ...). */
    readonly state: string;
    readonly kind: 'nextflow' | 'snakemake' | 'star' | 'cellranger' | 'tmp';
}
export interface CleanupItem {
    readonly title: string;
    readonly reclaimBytes: number;
    readonly paths: readonly string[];
    readonly why: string;
    /** Checks to run before acting. */
    readonly verify: string;
    readonly retention: Retention;
}
export interface FilesSnapshot {
    readonly at: string;
    readonly roots: readonly string[];
    readonly days: number;
    readonly totalBytes: number;
    readonly totalFiles: number;
    readonly dirs: Record<string, number>;
}
export interface FilesReport {
    readonly roots: readonly string[];
    readonly days: number;
    readonly totalBytes: number;
    readonly totalFiles: number;
    /** Share of the window's bytes that the individually classified files cover. */
    readonly classifiedShare: number;
    readonly incompleteRoots: string[];
    readonly fullVisibility: boolean;
    readonly dirs: {
        path: string;
        bytes: number;
        files: number;
        deltaBytes?: number;
    }[];
    readonly users: {
        user: string;
        bytes: number;
        files: number;
    }[];
    readonly byKind: {
        kind: FileKind;
        bytes: number;
        files: number;
    }[];
    readonly files: RecentFile[];
    readonly pipelines: PipelineDir[];
    readonly plan: CleanupItem[];
    readonly sincePrevious?: {
        at: string;
        deltaBytes: number;
    };
    readonly notes: string[];
}
/** Parse the scan output and build the cleanup plan. */
export declare function parseFiles(output: string, options: FilesOptions, previous?: FilesSnapshot): {
    report: FilesReport;
    snapshot: FilesSnapshot;
};
/** Model-facing rendering. */
export declare function renderFiles(host: string, r: FilesReport): string;
