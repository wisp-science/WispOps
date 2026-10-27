/**
 * Knowledge about sequencing and analysis files: what a file is, whether it
 * is raw data, a final result, a regenerable intermediate, or a cache, and
 * what to do about it. Rules are advisory — every suggestion keeps raw data
 * and final results, and asks for a check that the producing run finished.
 * @module dsh-wisp-ops/collectors/omics
 */
/** How valuable a file is to keep. */
export type Retention = 
/** Instrument output or downloaded raw reads: keep, archive to cold storage. */
'raw'
/** Pipeline deliverables: keep. */
 | 'final'
/** Regenerable from inputs once the run succeeded. */
 | 'intermediate'
/** Same content in a smaller form (compression, CRAM, bigWig). */
 | 'reducible'
/** Re-downloadable or rebuildable caches. */
 | 'cache'
/** Scratch and temporary files. */
 | 'temp'
/** Logs: keep recent, compress or rotate old. */
 | 'log'
/** Unknown value: ask the owner. */
 | 'review';
export interface FileKind {
    readonly id: string;
    readonly label: string;
    readonly retention: Retention;
    readonly advice: string;
}
export declare function classifyPath(path: string): FileKind;
export declare function kindById(id: string): FileKind;
export interface Redundancy {
    readonly path: string;
    /** The file that makes this one redundant. */
    readonly supersededBy: string;
    readonly reason: string;
}
/**
 * Files made redundant by a sibling: SAM next to BAM/CRAM, BAM next to CRAM,
 * an earlier-stage BAM next to a later-stage BAM of the same sample, plain
 * FASTQ/VCF next to the compressed copy, SRA next to its FASTQ.
 */
export declare function findRedundant(paths: readonly string[]): Redundancy[];
export declare const RETENTION_ORDER: readonly Retention[];
export declare const RETENTION_LABEL: Record<Retention, string>;
