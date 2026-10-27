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
