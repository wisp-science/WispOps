/**
 * Permission decisions and human-issued grants.
 *
 * Three sources can authorize a capability on a host: deployment policy
 * (`allow`), a time-boxed grant the human issued with `/ops-allow`, or a
 * one-shot approval of the exact call. `deny` in policy is absolute: neither
 * grants nor approvals override it. Grants are created only by human
 * commands; no tool can create or widen one.
 * @module dsh-wisp-ops/policy
 */
import type { Capability, Permission } from './config.ts';
import type { Host } from './inventory.ts';
import type { RiskAssessment } from './risk.ts';
/** A human-issued, session-scoped, expiring permission. */
export interface Grant {
    readonly id: string;
    /** Session the grant belongs to. */
    readonly session: string;
    readonly capability: Capability;
    /** Host names resolved when the grant was issued; later inventory additions are not covered. */
    readonly hosts: readonly string[];
    /** The selector the human typed, for display. */
    readonly selector: string;
    readonly createdAt: number;
    readonly expiresAt: number;
}
export declare class GrantStore {
    private readonly now;
    private readonly grants;
    constructor(now?: () => number);
    add(grant: Omit<Grant, 'id' | 'createdAt'>): Grant;
    /** Active grants of one session, pruning expired ones. */
    active(session: string): Grant[];
    /** The grant covering one capability on one host, if any. */
    find(session: string, host: string, capability: Capability): Grant | undefined;
    /** Revoke one grant by id, or every grant of the session with `all`. */
    revoke(session: string, id: string): Grant[];
    clear(): void;
}
/** Capabilities a classified action needs. Destructive actions are also changes. */
export declare function requiredCapabilities(risk: RiskAssessment, sudo: boolean): Capability[];
/** How one capability on one host was settled. */
export interface CapabilityRuling {
    readonly host: string;
    readonly capability: Capability;
    readonly permission: Permission;
    /** Set when an active grant turned `ask` into `allow`. */
    readonly grant?: string;
}
export type Decision = {
    readonly kind: 'allow';
    readonly rulings: readonly CapabilityRuling[];
} | {
    readonly kind: 'ask';
    readonly rulings: readonly CapabilityRuling[];
    readonly pending: readonly CapabilityRuling[];
} | {
    readonly kind: 'deny';
    readonly rulings: readonly CapabilityRuling[];
    readonly denied: readonly CapabilityRuling[];
};
/** Settle the capabilities of one action on a set of hosts. Deny beats ask beats allow. */
export declare function decide(hosts: readonly Host[], capabilities: readonly Capability[], session: string | undefined, grants: GrantStore): Decision;
/** Parse a human duration: `45` (minutes), `30m`, `2h`, `1h30m`. */
export declare function parseDuration(text: string): number | undefined;
/** Compact a ruling list into `host: cap, cap` lines for prompts and results. */
export declare function describeRulings(rulings: readonly CapabilityRuling[]): string;
