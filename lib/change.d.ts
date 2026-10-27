/**
 * Managed changes: back up → apply → verify → restore on failure, as one
 * remote shell transaction per host. A plan names every path it touches:
 * existing regular files (copied), new files (must not exist; rollback
 * deletes them) and existing directories (tar archive; rollback replaces the
 * directory). A fleet selector rolls the same plan out host by host and
 * stops at the first host that does not verify.
 * @module dsh-wisp-ops/change
 */
import type { RiskAssessment } from './risk.ts';
export interface ChangePlan {
    /** Inventory selector; `host` is accepted as an alias when validating. */
    targets: string;
    /** Existing regular files, backed up with `cp -a`. */
    files: string[];
    /** Paths that must not exist yet; rollback removes them. */
    newFiles?: string[];
    /** Existing directories, backed up as tar archives; rollback replaces them. */
    directories?: string[];
    command: string;
    verify: string;
    afterRollback?: string;
    reason: string;
    sudo?: boolean;
    timeoutMs?: number;
}
export type ChangeOutcome = 'verified' | 'rolled-back' | 'rollback-failed' | 'refused' | 'unknown';
export declare const MAX_PATHS_PER_KIND = 30;
export declare function validateChange(value: unknown): ChangePlan;
export declare function changeCommands(p: ChangePlan): string[];
export declare function changeRisk(p: ChangePlan, extraRead: ReadonlySet<string>): RiskAssessment;
export declare function describeChange(p: ChangePlan): string;
export interface ChangeScriptOptions {
    /** Where `wispops-change.*` backup directories are created. */
    backupRoot?: string;
    /** Backup directories older than this are pruned at the start of each run; 0 keeps them forever. */
    retentionDays?: number;
}
/**
 * One remote transaction: no second SSH connection is needed to start rollback.
 * Backups are stored as `f<i>` (files) and `d<i>.tar` (directories) with a manifest.
 */
export declare function changeScript(p: ChangePlan, seconds: number, options?: ChangeScriptOptions | string): string;
/** Read the transaction markers out of a host's output. */
export declare function parseChangeOutput(stdout: string, exitCode: number | null): {
    outcome: ChangeOutcome;
    backupDir?: string;
};
