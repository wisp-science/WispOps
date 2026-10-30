export function renderTrends(rows) {
    const good = rows.filter(row => row.status === 'ok');
    if (good.length < 2)
        return ['Trend: at least two successful inspections are required.'];
    const describe = (label, values) => {
        if (values.length < 2)
            return undefined;
        const first = values[0], last = values.at(-1);
        const delta = last.value - first.value;
        return `${label}: ${values.map(v => `${v.value.toFixed(1)}%`).join(' → ')} (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} percentage points; ${first.at} → ${last.at})`;
    };
    const lines = [describe('Memory available', good.flatMap(r => r.memAvailPct === undefined ? [] : [{ at: r.at, value: r.memAvailPct }]))];
    for (const mount of new Set(good.flatMap(row => Object.keys(row.diskPct))))
        lines.push(describe(`Disk ${mount}`, good.flatMap(r => r.diskPct[mount] === undefined ? [] : [{ at: r.at, value: r.diskPct[mount] }])));
    return lines.filter((line) => line !== undefined);
}
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Inspections read for forecasts and availability: a week at five-minute intervals, bounded by retention anyway. */
export const STATS_ROWS = 2016;
/** How far back a disk-full forecast looks. */
export const FORECAST_WINDOW_DAYS = 7;
/**
 * When a mount fills at its recent growth rate: a least-squares line through its used % over the last week, from at
 * least three points spanning six hours, extended from the newest value. Undefined when it is not growing (under 0.05
 * points a day), the data is too thin, or full is more than a year away.
 */
export function forecastFull(points) {
    const last = points.at(-1);
    if (last === undefined)
        return undefined;
    const recent = points.filter(p => Number.isFinite(p.at) && Number.isFinite(p.pct) && p.at >= last.at - FORECAST_WINDOW_DAYS * DAY && p.at <= last.at);
    const first = recent[0];
    if (recent.length < 3 || first === undefined || last.at - first.at < 6 * HOUR)
        return undefined;
    const xs = recent.map(p => (p.at - last.at) / DAY);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = recent.reduce((a, p) => a + p.pct, 0) / recent.length;
    let sxx = 0, sxy = 0;
    recent.forEach((p, i) => { const dx = xs[i] - mx; sxx += dx * dx; sxy += dx * (p.pct - my); });
    const perDay = sxx === 0 ? 0 : sxy / sxx;
    if (!(perDay >= 0.05))
        return undefined;
    const days = Math.max(0, (100 - last.pct) / perDay);
    return days > 365 ? undefined : { days, perDay };
}
/** Share of inspections that connected and the 95th-percentile login time, over the history since `since`. */
export function reachability(rows, since) {
    const window = rows.filter(r => Date.parse(r.at) >= since);
    if (window.length === 0)
        return {};
    const ok = window.filter(r => r.status === 'ok');
    const logins = ok.flatMap(r => typeof r.loginMs === 'number' && Number.isFinite(r.loginMs) ? [r.loginMs] : []).sort((a, b) => a - b);
    return {
        pct: Math.round((ok.length / window.length) * 1000) / 10,
        ...logins.length === 0 ? {} : { loginP95: logins[Math.min(logins.length - 1, Math.ceil(logins.length * 0.95) - 1)] },
    };
}
