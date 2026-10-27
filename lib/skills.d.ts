/**
 * Bundled WispOps skills (disk full, omics cleanup, security triage, daily
 * reports, safe changes, GPU/Slurm), registered with the DSH skill registry
 * when one is composed.
 * @module dsh-wisp-ops/skills
 */
import type { Context } from '@deepseek-ai/cordis';
/** Packaged skills directory, next to lib/ and src/. */
export declare const SKILL_ROOT: string;
export declare function parseSkill(raw: string, path: string): {
    name: string;
    description: string;
    content: string;
};
export declare function registerSkills(ctx: Context, root?: string): void;
