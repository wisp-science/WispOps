/**
 * Fleet overview for the management panel: the recent inspection history
 * of every inventory host, reduced to what a status matrix and sparklines
 * need. Read-only, owner-only, and bounded: at most `MAX_OVERVIEW_ROWS`
 * inspections per host, a few non-informational findings per inspection,
 * and no command output or credentials.
 * @module dsh-wisp-ops/overview
 */
import { worstSeverity } from "./collectors/inspect.js";
export const DEFAULT_OVERVIEW_ROWS = 30;
export const MAX_OVERVIEW_ROWS = 200;
const MAX_FINDINGS = 6;
const MAX_MESSAGE = 240;
/** Clamp a client-supplied row count; anything that is not a finite number is the default. */
export function overviewLimit(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return DEFAULT_OVERVIEW_ROWS;
    return Math.min(MAX_OVERVIEW_ROWS, Math.max(1, Math.floor(value)));
}
/** `{ key: value }` for a finite number, else nothing, so rows never carry NaN or strings from a damaged file. */
const finite = (key, value) => (typeof value === 'number' && Number.isFinite(value) ? { [key]: value } : {});
function stateOf(record) {
    if (record.status !== 'ok')
        return 'unreachable';
    const worst = worstSeverity(record.findings);
    return worst === 'info' ? 'ok' : worst;
}
/** Reduce one host's stored inspections (oldest first) to overview rows. */
export function overviewRows(records) {
    return records.map(record => ({
        at: record.at,
        state: stateOf(record),
        diskPct: Object.fromEntries(Object.entries(record.diskPct ?? {}).filter(([, pct]) => typeof pct === 'number' && Number.isFinite(pct))),
        ...record.memAvailPct === undefined ? {} : { memAvailPct: record.memAvailPct },
        ...record.load1 === undefined ? {} : { load1: record.load1 },
        ...record.cpuPct === undefined ? {} : { cpuPct: record.cpuPct },
        ...finite('loginMs', record.loginMs),
        ...finite('rxBps', record.rxBps),
        ...finite('txBps', record.txBps),
        ...finite('tcpEstablished', record.tcpEstablished),
        ...finite('tcpRetransPct', record.tcpRetransPct),
        findings: (record.findings ?? [])
            .filter((f) => f.severity === 'crit' || f.severity === 'warn')
            .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'crit' ? -1 : 1))
            .slice(0, MAX_FINDINGS)
            .map(f => ({ severity: f.severity, code: f.code, message: f.message.length > MAX_MESSAGE ? `${f.message.slice(0, MAX_MESSAGE)}…` : f.message })),
    }));
}
/** Assemble the overview from per-host histories, keeping inventory order. */
export function buildOverview(hosts, limit, now = new Date()) {
    const summary = { ok: 0, warn: 0, crit: 0, unreachable: 0, never: 0 };
    const result = hosts.map(host => {
        const rows = overviewRows(host.history.slice(-limit));
        const latest = rows.at(-1)?.state ?? 'never';
        summary[latest] += 1;
        return { name: host.name, groups: [...host.groups], rows, latest };
    });
    return { generatedAt: now.toISOString(), limit, hosts: result, summary };
}
