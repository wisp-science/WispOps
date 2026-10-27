/**
 * The permission gate on `tools/pre-execute`.
 *
 * For this plugin's tools it classifies the action, settles each required
 * capability per host (policy → grant → ask), and returns `deny`, `ask`
 * (the host's approval UI asks the human about this exact call), or defers
 * to later listeners. Every non-denied call receives a voucher keyed by the
 * execution token; the tools refuse to run without one, so a composition that
 * skips this gate fails closed instead of executing unchecked.
 *
 * For local shell tools (bash) it catches `sudo` and raw `ssh` to inventory
 * hosts, which would otherwise bypass the per-host policy.
 * @module dsh-wisp-ops/gate
 */
import type { Capability, Config } from './config.ts';
import type { Inventory } from './inventory.ts';
import type { GrantStore } from './policy.ts';
import type { RiskAssessment } from './risk.ts';
import type { Authorization } from './store.ts';
/** What the gate concluded for one tool call, consumed once by the tool. */
export interface Voucher {
    readonly hosts: readonly string[];
    readonly risk: RiskAssessment;
    readonly sudo: boolean;
    readonly authorization: Authorization;
    readonly issuedAt: number;
}
/** The remote action a tool call would perform, derived from its arguments alone. */
export interface PlannedAction {
    readonly selector: string;
    readonly command: string;
    readonly risk: RiskAssessment;
    readonly sudo: boolean;
    /** Sudo pre-authorized by a human-written task definition (still refused by a policy deny). */
    readonly taskSudo?: boolean;
}
/** Interpret one of this plugin's tool calls; undefined for tools that touch no host. */
export declare function planAction(tool: string, args: unknown, extraRead: ReadonlySet<string>, inventory?: Inventory): PlannedAction | undefined;
export type GateOutcome = {
    readonly kind: 'pass';
} | {
    readonly kind: 'allow';
    readonly voucher: Voucher;
} | {
    readonly kind: 'ask';
    readonly voucher: Voucher;
    readonly reason: string;
    readonly displayReason: {
        readonly en: string;
        readonly zh: string;
    };
} | {
    readonly kind: 'deny';
    readonly reason: string;
};
/** Matches any configured deny pattern. */
export declare function deniedByPattern(command: string, patterns: readonly RegExp[]): RegExp | undefined;
/** Settle one of this plugin's tool calls. */
export declare function gateOpsCall(tool: string, args: unknown, session: string | undefined, context: {
    config: Config;
    inventory: Inventory;
    grants: GrantStore;
    denyPatterns: readonly RegExp[];
    extraRead: ReadonlySet<string>;
}, now?: number): GateOutcome;
export type ShellOutcome = {
    readonly kind: 'pass';
} | {
    readonly kind: 'ask';
    readonly reason: string;
    readonly displayReason: {
        readonly en: string;
        readonly zh: string;
    };
} | {
    readonly kind: 'deny';
    readonly reason: string;
};
/** Settle a local shell call: privilege escalation and raw ssh to inventory hosts. */
export declare function gateShellCall(command: string, guard: Config['bashGuard'], inventory: Inventory): ShellOutcome;
/** Grants a human may issue for a capability word typed after /ops-allow. */
export declare function grantCapabilities(word: string): Capability[] | undefined;
