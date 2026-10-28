/**
 * Directory space map of one path: `du` sizes of every directory down to a
 * fixed depth on the same filesystem, keeping the largest ones so the panel
 * can draw a map the owner opens level by level. Read-only; the scan is
 * stored per host so the next one can report growth.
 * @module dsh-wisp-ops/collectors/space
 */
import type { FsUsage } from './sections.ts';
export interface SpaceOptions {
    /** Absolute path whose directories are measured. */
    readonly path: string;
    /** `du` depth below the path. */
    readonly depth: number;
    /** Largest directories kept, across all depths. */
    readonly maxDirs: number;
    /** Directories smaller than this are dropped before sorting. */
    readonly minKb: number;
    /** Deadline for the `du` walk. */
    readonly walkTimeoutSec: number;
}
export interface SpaceReport {
    readonly path: string;
    readonly filesystem?: FsUsage;
    readonly depth: number;
    /** Whether the walk ran as root; otherwise unreadable directories are missing from the sizes. */
    readonly fullVisibility: boolean;
    readonly walkIncomplete: boolean;
    readonly permissionDenied: boolean;
    /** `[path, kb]` of the largest directories, largest first. */
    readonly dirs: [string, number][];
    /** Directories at or above `minKb`; more than `dirs.length` means the list was cut. */
    readonly dirCount: number;
    readonly minKb: number;
    readonly notes: string[];
}
/** One stored scan; the panel draws the latest per path. */
export interface SpaceSnapshot extends SpaceReport {
    readonly at: string;
}
/** Build the scan script; every user value is single-quoted. */
export declare function spaceScript(o: SpaceOptions): string;
/** Parse the scan script's output. */
export declare function parseSpace(output: string, options: SpaceOptions): SpaceReport;
/** Model-facing rendering: the largest directories nested a few levels, with growth since the previous scan. */
export declare function renderSpace(host: string, r: SpaceReport, previous?: SpaceSnapshot): string;
