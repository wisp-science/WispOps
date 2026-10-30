/**
 * Model-facing renderings shared by tools, tasks, and commands.
 * @module dsh-wisp-ops/render
 */
import { formatKb } from "./collectors/sections.js";
const formatRate = (bps) => bps < 1024 ? `${Math.round(bps)}B/s` : `${formatKb(bps / 1024)}/s`;
function statusLine(r) {
    const exit = r.exitCode === null ? '' : ` exit ${r.exitCode}`;
    return `${r.status}${exit}, ${(r.durationMs / 1000).toFixed(1)}s${r.truncated ? ', output truncated' : ''}`;
}
/** Render fleet output, folding hosts whose output and exit code are identical. */
export function renderRuns(results, perHostChars) {
    const groups = new Map();
    for (const r of results) {
        const key = JSON.stringify([r.status, r.exitCode, r.stdout, r.stderr]);
        groups.set(key, [...groups.get(key) ?? [], r]);
    }
    const clip = (text) => text.length > perHostChars ? `${text.slice(0, perHostChars)}\n… [${text.length - perHostChars} more characters]` : text;
    const blocks = [];
    for (const members of groups.values()) {
        const first = members[0];
        const names = members.map(m => m.host).join(', ');
        const lines = [`### ${names} — ${statusLine(first)}`];
        if (first.stdout.trim().length > 0)
            lines.push(clip(first.stdout.trimEnd()));
        if (first.stderr.trim().length > 0)
            lines.push(`[stderr]\n${clip(first.stderr.trimEnd())}`);
        if (first.status === 'sudo-required')
            lines.push('Hint: sudo needs a password on this host. Configure sudoSecret to a Password Store entry, a NOPASSWD rule, or ask the user to run it.');
        if (first.status === 'timeout')
            lines.push('Hint: the local ssh was stopped; the remote command may still be running. Check before retrying.');
        blocks.push(lines.join('\n'));
    }
    const summary = `${results.length} host(s): ${['ok', 'failed', 'unreachable', 'auth-failed', 'blocked', 'sudo-required', 'timeout', 'cancelled']
        .map(s => [s, results.filter(r => r.status === s).length]).filter(([, n]) => n > 0).map(([s, n]) => `${n} ${s}`).join(', ')}`;
    return [summary, ...blocks].join('\n\n');
}
export function renderInspection(fleet, detail) {
    const c = fleet.counts;
    const lines = [`Fleet inspection ${fleet.at}: ${fleet.hosts.length} hosts — ${c.crit} critical, ${c.warn} warning, ${c.unreachable} unreachable, ${c.ok + c.info} healthy`];
    for (const h of fleet.hosts) {
        const r = h.report;
        const facts = r === undefined
            ? h.error ?? h.status
            : [
                r.load === undefined ? undefined : `load ${r.load.m1}${r.cores === undefined ? '' : `/${r.cores}c`}`,
                r.cpuPct === undefined ? undefined : `cpu ${r.cpuPct}%`,
                r.mem === undefined ? undefined : `mem avail ${r.mem.availPct}%`,
                r.disks.length === 0 ? undefined : `disk max ${Math.max(...r.disks.map(d => d.usePct))}%`,
                r.gpus.length === 0 ? undefined : `gpu ${r.gpus.map(g => `${g.utilPct ?? '?'}%`).join('/')}`,
                r.slurm === undefined ? undefined : `slurm ${Object.entries(r.slurm.nodeStates).map(([s, n]) => `${n} ${s}`).join(', ')}`,
                r.loginMs === undefined ? undefined : `login ${r.loginMs} ms`,
                r.sshFailures1h === undefined ? undefined : `${r.sshFailures1h} failed ssh logins/h`,
                r.net === undefined ? undefined : `net rx ${formatRate(r.net.rxBps)} tx ${formatRate(r.net.txBps)}${r.net.tcpEstablished === undefined ? '' : `, ${r.net.tcpEstablished} tcp`}${r.net.tcpRetransPct === undefined ? '' : ` (${r.net.tcpRetransPct}% retrans)`}`,
            ].filter(Boolean).join(', ');
        lines.push(`- ${h.host} [${h.severity.toUpperCase()}] ${facts}`);
        for (const f of h.findings.filter(f => detail || f.severity !== 'info'))
            lines.push(`    ${f.severity}: ${f.message}${f.muted ? ' (muted by the owner as known)' : ''}`);
        if (detail && r !== undefined) {
            if (r.topCpu.length > 0)
                lines.push(`    top cpu: ${r.topCpu.slice(0, 3).map(p => `${p.command}[${p.pid} ${p.user}] ${p.cpuPct}%`).join(', ')}`);
            if (r.topMem.length > 0)
                lines.push(`    top mem: ${r.topMem.slice(0, 3).map(p => `${p.command}[${p.pid} ${p.user}] ${p.memPct}%`).join(', ')}`);
            for (const g of r.gpus)
                lines.push(`    gpu ${g.index} ${g.name}: ${g.utilPct ?? '?'}% util, ${g.memUsedMb ?? '?'}/${g.memTotalMb ?? '?'} MiB, ${g.tempC ?? '?'}°C${g.processes.length > 0 ? `, pids ${g.processes.map(p => p.pid).join(' ')}` : ''}`);
            if (r.kernelErrorSamples.length > 0)
                lines.push(`    recent kernel errors:\n${r.kernelErrorSamples.map(l => `      ${l}`).join('\n')}`);
            for (const d of r.disks)
                lines.push(`    ${d.mount}: ${d.usePct}% of ${formatKb(d.sizeKb)}`);
            if (r.listeners !== undefined && r.listeners.length > 0)
                lines.push(`    listening: ${r.listeners.join(', ')}`);
            if (r.loginSources !== undefined && r.loginSources.length > 0)
                lines.push(`    recent login sources: ${r.loginSources.join(', ')}`);
            if (r.net !== undefined && r.net.interfaces.length > 0)
                lines.push(`    interfaces: ${r.net.interfaces.map(i => `${i.name} rx ${formatRate(i.rxBps)} tx ${formatRate(i.txBps)}`).join(', ')}`);
        }
    }
    return lines.join('\n');
}
