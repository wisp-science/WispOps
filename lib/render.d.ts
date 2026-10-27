/**
 * Model-facing renderings shared by tools, tasks, and commands.
 * @module dsh-wisp-ops/render
 */
import type { FleetInspection } from './service.ts';
import type { RunResult } from './ssh.ts';
/** Render fleet output, folding hosts whose output and exit code are identical. */
export declare function renderRuns(results: readonly RunResult[], perHostChars: number): string;
export declare function renderInspection(fleet: FleetInspection, detail: boolean): string;
