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
import { randomUUID } from 'node:crypto';
export class GrantStore {
    now;
    grants = new Map();
    constructor(now = Date.now) {
        this.now = now;
    }
    add(grant) {
        const full = { ...grant, id: randomUUID().slice(0, 8), createdAt: this.now() };
        this.grants.set(full.id, full);
        return full;
    }
    /** Active grants of one session, pruning expired ones. */
    active(session) {
        const now = this.now();
        const result = [];
        for (const [id, grant] of this.grants) {
            if (grant.expiresAt <= now)
                this.grants.delete(id);
            else if (grant.session === session)
                result.push(grant);
        }
        return result;
    }
    /** The grant covering one capability on one host, if any. */
    find(session, host, capability) {
        return this.active(session).find(grant => grant.capability === capability && grant.hosts.includes(host));
    }
    /** Revoke one grant by id, or every grant of the session with `all`. */
    revoke(session, id) {
        const revoked = this.active(session).filter(grant => id === 'all' || grant.id === id);
        for (const grant of revoked)
            this.grants.delete(grant.id);
        return revoked;
    }
    clear() {
        this.grants.clear();
    }
}
/** Capabilities a classified action needs. Destructive actions are also changes. */
export function requiredCapabilities(risk, sudo) {
    const caps = [];
    if (risk.level !== 'read')
        caps.push('change');
    if (risk.level === 'destructive')
        caps.push('destructive');
    if (sudo || risk.elevates)
        caps.push('sudo');
    return caps;
}
/** Settle the capabilities of one action on a set of hosts. Deny beats ask beats allow. */
export function decide(hosts, capabilities, session, grants) {
    const rulings = [];
    for (const host of hosts) {
        for (const capability of capabilities) {
            const permission = host.policy[capability];
            if (permission === 'ask' && session !== undefined) {
                const grant = grants.find(session, host.name, capability);
                if (grant !== undefined) {
                    rulings.push({ host: host.name, capability, permission: 'allow', grant: grant.id });
                    continue;
                }
            }
            rulings.push({ host: host.name, capability, permission });
        }
    }
    const denied = rulings.filter(ruling => ruling.permission === 'deny');
    if (denied.length > 0)
        return { kind: 'deny', rulings, denied };
    const pending = rulings.filter(ruling => ruling.permission === 'ask');
    if (pending.length > 0)
        return { kind: 'ask', rulings, pending };
    return { kind: 'allow', rulings };
}
/** Parse a human duration: `45` (minutes), `30m`, `2h`, `1h30m`. */
export function parseDuration(text) {
    const trimmed = text.trim().toLowerCase();
    if (/^\d+$/.test(trimmed))
        return Number(trimmed) * 60_000;
    const match = /^(?:(\d+)h)?(?:(\d+)m)?$/.exec(trimmed);
    if (match === null || (match[1] === undefined && match[2] === undefined))
        return undefined;
    return (Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0)) * 60_000;
}
/** Compact a ruling list into `host: cap, cap` lines for prompts and results. */
export function describeRulings(rulings) {
    const byHost = new Map();
    for (const ruling of rulings) {
        const list = byHost.get(ruling.host) ?? [];
        list.push(ruling.grant === undefined ? ruling.capability : `${ruling.capability} (grant ${ruling.grant})`);
        byHost.set(ruling.host, list);
    }
    return [...byHost].map(([host, caps]) => `${host}: ${caps.join(', ')}`).join('; ');
}
