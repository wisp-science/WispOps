import { LocalState } from './local-state.ts';
import type { RunResult } from './ssh.ts';
export interface CheckScript {
    id: string;
    title: string;
    description: string;
    /** POSIX shell, run with `sh -s` on every linked server. */
    content: string;
    /** Of `content`, recomputed on every save so a task record can name the exact script it ran. */
    sha256: string;
    timeoutSec: number;
    updatedAt: string;
}
export type ScriptVerdict = 'ok' | 'warn' | 'crit' | 'failed' | 'unreachable';
export interface ScriptOutcome {
    host: string;
    verdict: ScriptVerdict;
    exitCode: number | null;
    /** First non-empty stdout line, bounded. */
    summary: string;
    /** Remaining output, bounded; stored only in the run excerpt. */
    evidence: string;
    metrics?: Record<string, number>;
}
export declare const MAX_SCRIPT_BYTES: number;
export declare const DEFAULT_SCRIPT_TIMEOUT_SEC = 120;
export declare const MAX_SCRIPT_TIMEOUT_SEC = 3600;
export declare const SCRIPT_CONTRACT = "Exit 0 = ok, 1 = warning, 2 = critical, other = failed. The first non-empty stdout line is the one-line summary (it goes into notifications and to the agent); everything after it is evidence. An optional line \"WISPOPS-JSON: {\"key\": number}\" records metrics.";
export declare function scriptDigest(content: string): string;
export declare function validateScript(value: unknown): CheckScript;
/** The first script line the deploy-wide deny list refuses; the same last word commands get. */
export declare function deniedScriptLine(content: string, patterns: readonly RegExp[]): {
    line: string;
    source: string;
} | undefined;
export declare function scriptStore(dataDir: string): LocalState<{
    version: 1;
    entries: CheckScript[];
}>;
export interface ScriptDraft {
    id: string;
    createdAt: string;
    script: CheckScript;
}
/** Scripts the model proposed. Only the owner moves one into the library, from the panel form. */
export declare function scriptDraftStore(dataDir: string): LocalState<{
    version: 1;
    entries: ScriptDraft[];
}>;
export declare function addScriptDraft(dataDir: string, script: unknown): Promise<ScriptDraft>;
/** Judge one host's run by the output contract. Transport failures never count as script verdicts. */
export declare function parseScriptResult(result: RunResult): ScriptOutcome;
/** Model-facing body: summaries first so a bounded excerpt never loses them, evidence after. */
export declare function renderScriptOutcomes(script: Pick<CheckScript, 'id' | 'title' | 'sha256'>, outcomes: readonly ScriptOutcome[]): string;
export declare function worstVerdict(outcomes: readonly Pick<ScriptOutcome, 'verdict'>[]): ScriptVerdict;
