/**
 * Shell command risk classification.
 *
 * The classifier is fail-closed: a command is `read` only when every simple
 * command in it is a known read-only program used in a read-only way and no
 * output is redirected into a file. Anything unrecognized is at least
 * `change`. Pattern matching can never fully understand shell, so this is a
 * policy input, not a sandbox: approval and grants are the enforcement.
 * @module dsh-wisp-ops/risk
 */
/** Ordered risk levels; each level includes everything below it. */
export type RiskLevel = 'read' | 'change' | 'destructive';
export declare const RISK_ORDER: Record<RiskLevel, number>;
/** Classification of one command string. */
export interface RiskAssessment {
    /** Highest level found in any segment. */
    readonly level: RiskLevel;
    /** Whether the command itself escalates privilege (sudo, su, doas, pkexec). */
    readonly elevates: boolean;
    /** Human-readable reasons for every non-read finding, deduplicated. */
    readonly reasons: readonly string[];
}
/** One simple-command span; `masked` has quoted operators blanked, same length as `text`. */
export interface Segment {
    readonly text: string;
    readonly masked: string;
}
/** Split a command into simple-command segments on shell operators and substitutions. */
export declare function splitSegments(command: string): Segment[];
/** Whitespace tokenization that keeps quoted spans together and strips the quotes. */
export declare function tokenize(segment: string): string[];
/** Blank shell operators inside quoted spans, preserving every offset. */
export declare function maskQuoted(command: string): string;
/** Classify one shell command string. */
export declare function classifyCommand(command: string, extraReadPrograms?: ReadonlySet<string>): RiskAssessment;
