/**
 * dsh-wisp-ops — multi-host server operations for DeepSeek Harness.
 *
 * Inventory with groups and tags, fleet inspection (巡检) with thresholds and
 * trends, disk-full diagnosis, and fleet command execution over the system
 * OpenSSH client, under a per-host permission model: read runs freely;
 * change, sudo, and destructive actions follow host policy, human grants
 * (/ops-allow), or a one-shot approval of the exact call through the host's
 * approval UI. Passwords come from the independent encrypted vault (or an optional WispTerm source) and never
 * reach the model.
 * @module dsh-wisp-ops
 */
import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
export { Config };
export declare const name = "dsh-wisp-ops";
export declare const inject: string[];
export declare function apply(ctx: Context, config: Config): Promise<void>;
