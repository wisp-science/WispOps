/**
 * Collector scripts print `@@<name>` marker lines between sections so that
 * one round trip returns many independent probes. A probe that is missing on
 * the host (no GPU, no Slurm, no systemd) prints nothing and its section is
 * simply empty.
 * @module dsh-wisp-ops/collectors/sections
 */
/** Split collector output into named sections. */
export declare function parseSections(output: string): Map<string, string[]>;
/** Number or undefined for a non-numeric field. */
export declare function num(value: string | undefined): number | undefined;
export interface FsUsage {
    readonly filesystem: string;
    readonly type?: string;
    readonly sizeKb: number;
    readonly usedKb: number;
    readonly availKb: number;
    readonly usePct: number;
    readonly mount: string;
}
/** Parse `df -PkT` (with type) or `df -Pk` output. */
export declare function parseDf(lines: readonly string[]): FsUsage[];
export interface InodeUsage {
    readonly mount: string;
    readonly usePct: number;
}
/** Parse `df -Pi`; filesystems without inode accounting report `-`. */
export declare function parseDfInodes(lines: readonly string[]): InodeUsage[];
/** Human-readable size from kilobytes. */
export declare function formatKb(kb: number): string;
