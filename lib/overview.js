/**
 * Fleet overview for the management panel: the recent inspection history
 * of every inventory host, reduced to what a status matrix and sparklines
 * need. Read-only, owner-only, and bounded: at most `MAX_OVERVIEW_ROWS`
 * inspections per host, a few non-informational findings per inspection,
 * and no command output or credentials.
 * @module dsh-wisp-ops/overview
 */
import { worstSeverity } from "./collectors/inspect.js";
import { forecastFull, reachability } from "./trends.js";
import { findingSubject, muteFor } from "./mutes.js";
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
/** State of one stored inspection under the owner's current mutes. */
export function recordState(record, mutes, now) {
    if (record.status !== 'ok')
        return 'unreachable';
    const worst = worstSeverity((record.findings ?? []).filter(f => !muteFor(f, mutes, now)));
    return worst === 'info' ? 'ok' : worst;
}
/** Reduce one host's stored inspections (oldest first) to overview rows, applying the owner's current mutes. */
export function overviewRows(records, mutes, now = Date.now()) {
    return records.map(record => ({
        at: record.at,
        state: recordState(record, mutes, now),
        ...record.status === 'ok' ? {} : { status: record.status },
        diskPct: Object.fromEntries(Object.entries(record.diskPct ?? {}).filter(([, pct]) => typeof pct === 'number' && Number.isFinite(pct))),
        ...record.memAvailPct === undefined ? {} : { memAvailPct: record.memAvailPct },
        ...record.load1 === undefined ? {} : { load1: record.load1 },
        ...record.cpuPct === undefined ? {} : { cpuPct: record.cpuPct },
        ...finite('loginMs', record.loginMs),
        ...finite('rxBps', record.rxBps),
        ...finite('txBps', record.txBps),
        ...finite('tcpEstablished', record.tcpEstablished),
        ...finite('tcpRetransPct', record.tcpRetransPct),
        ...finite('gpuUtilPct', record.gpuUtilPct),
        ...finite('gpuMemPct', record.gpuMemPct),
        ...finite('gpuTempC', record.gpuTempC),
        ...finite('sshFailures1h', record.sshFailures1h),
        findings: (record.findings ?? [])
            .filter((f) => f.severity === 'crit' || f.severity === 'warn')
            .map(f => ({ f, mute: muteFor(f, mutes, now) }))
            // Live problems first, critical before warning; muted ones last.
            .sort((a, b) => Number(!!a.mute) - Number(!!b.mute) || (a.f.severity === b.f.severity ? 0 : a.f.severity === 'crit' ? -1 : 1))
            .slice(0, MAX_FINDINGS)
            .map(({ f, mute }) => {
            const subject = findingSubject(f);
            return { severity: f.severity, code: f.code, message: f.message.length > MAX_MESSAGE ? `${f.message.slice(0, MAX_MESSAGE)}…` : f.message, ...subject === undefined ? {} : { subject }, ...mute === undefined ? {} : { mute } };
        }),
    }));
}
/** Days to full per mount of the newest successful inspection, rounded to a tenth. */
export function hostForecast(history) {
    const ok = history.filter(r => r.status === 'ok' && r.diskPct);
    const latest = ok.at(-1);
    if (latest === undefined)
        return {};
    return Object.fromEntries(Object.keys(latest.diskPct).flatMap(mount => {
        const forecast = forecastFull(ok.flatMap(r => typeof r.diskPct[mount] === 'number' ? [{ at: Date.parse(r.at), pct: r.diskPct[mount] }] : []));
        return forecast === undefined ? [] : [[mount, Math.round(forecast.days * 10) / 10]];
    }));
}
/**
 * Assemble the overview from per-host histories, keeping inventory order. Rows are the newest `limit` inspections;
 * forecasts and reachability use the whole history passed in.
 */
export function buildOverview(hosts, limit, now = new Date()) {
    const summary = { ok: 0, warn: 0, crit: 0, unreachable: 0, never: 0 };
    const result = hosts.map(host => {
        const rows = overviewRows(host.history.slice(-limit), host.mutes, now.getTime());
        const latest = rows.at(-1)?.state ?? 'never';
        summary[latest] += 1;
        const day = reachability(host.history, now.getTime() - 86_400_000);
        const week = reachability(host.history, now.getTime() - 7 * 86_400_000);
        const reach = { ...day.pct === undefined ? {} : { day: day.pct }, ...week.pct === undefined ? {} : { week: week.pct }, ...day.loginP95 === undefined ? {} : { loginP95: day.loginP95 } };
        return { name: host.name, groups: [...host.groups], rows, latest, forecast: hostForecast(host.history), reach };
    });
    return { generatedAt: now.toISOString(), limit, hosts: result, summary };
}
