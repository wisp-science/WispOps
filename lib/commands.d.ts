/**
 * Human-only slash commands. These are the only way to widen permissions
 * beyond deployment policy: the model cannot invoke a command, and a grant
 * never overrides a policy `deny`.
 * @module dsh-wisp-ops/commands
 */
import type { Context } from '@deepseek-ai/cordis';
import type { OpsService } from './service.ts';
export declare function parseAllow(rawInput: string, service: OpsService): {
    capability: string;
    selector: string;
    ttlMs: number;
} | string;
export declare function registerCommands(ctx: Context, service: OpsService): void;
