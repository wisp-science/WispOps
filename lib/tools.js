/**
 * Model-facing tools. Every tool that touches a host requires the voucher
 * the permission gate issued for this exact execution; without it the tool
 * refuses, so authorization cannot be skipped by composition order.
 * @module dsh-wisp-ops/tools
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { renderDisk } from "./collectors/disk.js";
import { renderFiles } from "./collectors/files.js";
import { renderSecurity } from "./collectors/security.js";
import { describeSchedule, runTask } from "./tasks.js";
import { renderInspection, renderRuns } from "./render.js";
/** Vouchers issued by the gate, keyed by execution token and consumed once. */
export class VoucherBook {
    vouchers = new Map();
    issue(token, voucher) {
        const cutoff = Date.now() - 6 * 60 * 60_000;
        for (const [key, value] of this.vouchers)
            if (value.issuedAt < cutoff)
                this.vouchers.delete(key);
        this.vouchers.set(token, voucher);
    }
    take(exec, hosts) {
        const voucher = this.vouchers.get(exec.token);
        this.vouchers.delete(exec.token);
        if (voucher === undefined)
            throw new Error(`${exec.name}: no authorization record for this call; the dsh-wisp-ops permission gate did not run, so nothing was executed`);
        const same = voucher.hosts.length === hosts.length && hosts.every(h => voucher.hosts.includes(h));
        if (!same)
            throw new Error(`${exec.name}: the authorized host set differs from the resolved one (the inventory changed during the call); nothing was executed`);
        return voucher;
    }
}
/** Detach a value into plain JSON for the canonical tool result. */
function json(value) {
    return JSON.parse(JSON.stringify(value));
}
const SESSION = (exec) => (exec.agent === undefined ? undefined : String(exec.agent.id));
export function registerTools(ctx, service, vouchers) {
    const { config } = service;
    ctx.tools.register(defineTool({
        name: 'ops_hosts',
        description: 'List managed servers from the dsh-wisp-ops inventory: names, groups, tags, per-host permission policy (change/sudo/destructive = allow|ask|deny), stored-password configuration, last capability probe (OS, cores, GPUs, scheduler, privilege), login blocks, and the permissions the user granted in this session. Set probe=true to (re)probe capabilities over SSH (read-only). Use this first to learn what exists before running anything.',
        parameters: {
            targets: { type: 'string', description: 'Selector: host names, @group, tag:key=value, globs like gpu-*, all; comma separated; prefix ! to exclude. Default all.' },
            probe: { type: 'boolean', description: 'Probe the selected hosts over SSH before listing (read-only).' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
            const hosts = service.select(args.targets ?? 'all');
            if (args.probe === true) {
                vouchers.take(exec, hosts.map(h => h.name));
                await service.probe(hosts, { signal: exec.signal, tool: 'ops_hosts', ...SESSION(exec) === undefined ? {} : { session: SESSION(exec) } });
            }
            const probes = await service.store.probes();
            const session = SESSION(exec);
            const grants = session === undefined ? [] : service.grants.active(session);
            const blocks = service.runner.guard.list();
            const lines = [`${hosts.length} host(s). Policy defaults: change=${config.defaultPolicy.change}, sudo=${config.defaultPolicy.sudo}, destructive=${config.defaultPolicy.destructive}.`];
            for (const h of hosts) {
                const p = probes[h.name];
                const parts = [
                    `ssh ${h.user === undefined ? '' : `${h.user}@`}${h.ssh ?? h.name}${h.port === undefined ? '' : `:${h.port}`}${h.proxyJump === undefined ? '' : ` via ${h.proxyJump}`}`,
                    h.groups.length > 0 ? `groups ${h.groups.join(',')}` : undefined,
                    Object.keys(h.tags).length > 0 ? `tags ${Object.entries(h.tags).map(([k, v]) => `${k}=${v}`).join(',')}` : undefined,
                    `policy change=${h.policy.change} sudo=${h.policy.sudo} destructive=${h.policy.destructive}`,
                    h.auth === 'password' ? 'password login' : undefined,
                    h.sudoSecret === undefined ? undefined : 'sudo password stored',
                    p === undefined ? 'not probed' : `${p.os ?? '?'} ${p.arch ?? ''}, ${p.cores ?? '?'} cores, ${p.gpus} GPU, scheduler ${p.scheduler}, ${p.privilege}, docker ${p.docker} (probed ${p.at})`,
                ].filter(Boolean);
                lines.push(`- ${h.name}${h.description === undefined ? '' : ` (${h.description})`}: ${parts.join('; ')}`);
            }
            if (blocks.length > 0)
                lines.push('', `Login paused: ${blocks.map(b => `${b.host} until ${b.until}`).join(', ')} (the user runs /ops-unblock).`);
            lines.push('', grants.length === 0
                ? 'No session grants. Actions needing an "ask" capability will prompt the user once per call; the user can pre-authorize with /ops-allow <change|sudo|destructive|all> <selector> [duration].'
                : `Session grants: ${grants.map(g => `${g.capability} on ${g.hosts.join(',')} until ${new Date(g.expiresAt).toISOString()}`).join('; ')}`);
            return json({ text: lines.join('\n'), hosts: hosts.map(h => ({ name: h.name, groups: h.groups, tags: h.tags, policy: h.policy, probe: probes[h.name] ?? null })), grants: grants.map(g => ({ ...g })) });
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_exec',
        description: 'Run a POSIX shell command on one or more inventory servers over SSH (parallel for fleets; identical outputs are folded). The command is risk-classified (read / change / destructive, plus sudo); per-host policy and user grants decide whether it runs, asks the user to approve this exact call, or is refused. Set sudo=true instead of writing "sudo" in the command; passwords are supplied from the user\'s Password Store and never visible to you. Never ask the user for passwords. Prefer read-only diagnosis first, and explain the purpose in reason.',
        parameters: {
            targets: { type: 'string', required: true, description: 'Selector: host names, @group, tag:key=value, globs, all; comma separated; ! excludes.' },
            command: { type: 'string', required: true, description: 'Shell script run by sh on each host.' },
            sudo: { type: 'boolean', description: 'Run as root (or the host\'s sudoUser).' },
            reason: { type: 'string', description: 'Why this is needed; shown to the user in approval prompts and kept in the audit log. Required for anything that is not read-only.' },
            timeoutMs: { type: 'integer', description: `Per-host deadline; default ${config.limits.defaultTimeoutMs}, max ${config.limits.maxTimeoutMs}.` },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => false,
        presentCall: args => ({ card: 'terminal', title: String(args.command ?? ''), description: `${args.sudo === true ? 'sudo ' : ''}on ${String(args.targets ?? '')}` }),
        async execute(args, exec) {
            if (args.command.trim().length === 0)
                throw new Error('command must not be empty');
            const hosts = service.select(args.targets);
            const voucher = vouchers.take(exec, hosts.map(h => h.name));
            if (voucher.risk.level !== 'read' && (args.reason === undefined || args.reason.trim().length === 0)) {
                throw new Error('reason is required for commands that change state; nothing was executed');
            }
            const session = SESSION(exec);
            const results = await service.execute(hosts, args.command, {
                sudo: voucher.sudo && args.sudo === true,
                timeoutMs: service.clampTimeout(args.timeoutMs),
                signal: exec.signal,
                tool: 'ops_exec',
                risk: voucher.risk.level,
                authorization: voucher.authorization,
                ...args.reason === undefined ? {} : { reason: args.reason },
                ...session === undefined ? {} : { session },
            });
            const perHost = Math.max(2000, Math.floor(48_000 / Math.max(1, new Set(results.map(r => r.stdout)).size)));
            return json({
                text: `Risk: ${voucher.risk.level}${voucher.sudo ? ' + sudo' : ''}; authorized by ${voucher.authorization}.\n\n${renderRuns(results, perHost)}`,
                results,
            });
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_inspect',
        description: 'Fleet health inspection (巡检), read-only: load, CPU, memory, swap, disk and inode usage, failed systemd units, top processes, NVIDIA GPUs and their processes, Slurm node and job states, OOM kills and kernel errors in the last 24h, NTP sync, pending reboot. Thresholds turn these into critical/warning findings, disk growth is compared with the previous inspection, and results are saved to history. Run this for any "check the servers" request, then drill down with ops_disk or ops_exec.',
        parameters: {
            targets: { type: 'string', description: 'Selector; default all.' },
            detail: { type: 'boolean', description: 'Include top processes, GPU processes, per-mount usage and kernel error samples.' },
            sudo: { type: 'boolean', description: 'Run the collector as root for complete journal access (needs sudo permission).' },
        },
        output: {
            schema: { type: 'json' },
            render: (args, value) => [{ type: 'text', text: renderInspection(value, args.detail === true) }],
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
            const hosts = service.select(args.targets ?? 'all');
            const voucher = vouchers.take(exec, hosts.map(h => h.name));
            const session = SESSION(exec);
            const fleet = await service.inspect(hosts, {
                sudo: voucher.sudo && args.sudo === true,
                signal: exec.signal,
                tool: 'ops_inspect',
                authorization: voucher.authorization,
                ...session === undefined ? {} : { session },
            });
            return json(fleet);
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_disk',
        description: 'Diagnose a full or growing filesystem on one server, read-only: usage and inodes, largest directories (with growth since the previous diagnosis of the same path), largest and recently modified large files, which of them are held open by processes or sit inside running Slurm job directories, space pinned by deleted-but-open files, journal/docker/package/conda/pip caches, rotated logs. Every file gets a verdict (in-use, job-directory, rotated-log, core-dump, recently-written, review). Propose a cleanup plan from this, execute it with ops_exec (it will need approval), then run ops_disk again on the same path to verify the space was freed.',
        parameters: {
            host: { type: 'string', required: true, description: 'One inventory host name.' },
            path: { type: 'string', description: 'Absolute path on the filesystem to diagnose; default /.' },
            depth: { type: 'integer', description: 'Directory depth for sizes; default 2.' },
            top: { type: 'integer', description: 'Rows per list; default 15.' },
            minFileMb: { type: 'integer', description: 'Large-file threshold in MiB; default 100.' },
            recentMinutes: { type: 'integer', description: 'Window for recently modified files; default 1440 (24h).' },
            walkTimeoutSec: { type: 'integer', description: 'Deadline for each directory walk; default 60.' },
            sudo: { type: 'boolean', description: 'Run as root to see all directories and every process holding files (recommended for system paths; needs sudo permission).' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
            const [host] = service.select(args.host);
            if (host === undefined || service.select(args.host).length !== 1)
                throw new Error('ops_disk takes exactly one host');
            const path = args.path ?? '/';
            if (!path.startsWith('/'))
                throw new Error('path must be absolute');
            const voucher = vouchers.take(exec, [host.name]);
            const session = SESSION(exec);
            const clamp = (value, fallback, min, max) => Math.min(Math.max(Math.trunc(value ?? fallback), min), max);
            const { report, result } = await service.disk(host, {
                path,
                depth: clamp(args.depth, 2, 1, 6),
                top: clamp(args.top, 15, 1, 100),
                minFileMb: clamp(args.minFileMb, 100, 1, 1_000_000),
                recentMinFileMb: Math.max(1, Math.floor(clamp(args.minFileMb, 100, 1, 1_000_000) / 10)),
                recentMinutes: clamp(args.recentMinutes, 1440, 1, 60 * 24 * 90),
                walkTimeoutSec: clamp(args.walkTimeoutSec, 60, 5, 1800),
                sudo: voucher.sudo && args.sudo === true,
                signal: exec.signal,
                tool: 'ops_disk',
                authorization: voucher.authorization,
                ...session === undefined ? {} : { session },
            });
            if (report === undefined) {
                return json({ text: renderRuns([result], 4000), report: null });
            }
            return json({ text: renderDisk(host.name, report), report });
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_files',
        description: 'Recent-file analysis (近期新增文件分析) on one server, read-only: files modified in the last N days under the given roots — total volume, where it landed (with growth since the previous scan), owners, what kind of data it is with sequencing/bioinformatics knowledge (raw FASTQ/BCL/POD5, SAM/BAM/CRAM, VCF/gVCF, trimmed reads, SRA, Nextflow/Snakemake/STAR/Cell Ranger working directories, analysis objects, logs, caches), which files are still open or inside running Slurm job directories, which are superseded by a processed or compressed sibling, and a cleanup plan ordered by reclaimable space with the checks to run first. Never deletes anything; execute chosen steps with ops_exec.',
        parameters: {
            host: { type: 'string', required: true, description: 'One inventory host.' },
            paths: { type: 'string', required: true, description: 'Absolute roots to scan, comma separated (e.g. /data,/home).' },
            days: { type: 'integer', description: 'Window in days; default 7.' },
            depth: { type: 'integer', description: 'Directory aggregation depth below each root; default 3.' },
            listMinMb: { type: 'integer', description: 'Classify files at least this large individually; default 10.' },
            walkTimeoutSec: { type: 'integer', description: 'Deadline per root; default 300.' },
            sudo: { type: 'boolean', description: 'Scan as root to see every user\'s files and every holder process (needs sudo permission).' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
            const hosts = service.select(args.host);
            const host = hosts[0];
            if (host === undefined || hosts.length !== 1)
                throw new Error('ops_files takes exactly one host');
            const paths = args.paths.split(',').map(p => p.trim()).filter(Boolean);
            if (paths.length === 0 || paths.some(p => !p.startsWith('/')))
                throw new Error('paths must be absolute');
            const voucher = vouchers.take(exec, [host.name]);
            const session = SESSION(exec);
            const clamp = (value, fallback, min, max) => Math.min(Math.max(Math.trunc(value ?? fallback), min), max);
            const { report, result } = await service.files(host, {
                paths,
                days: clamp(args.days, 7, 1, 3650),
                depth: clamp(args.depth, 3, 1, 8),
                listMinMb: clamp(args.listMinMb, 10, 1, 1_000_000),
                maxFiles: 5000,
                top: 20,
                walkTimeoutSec: clamp(args.walkTimeoutSec, 300, 10, 3600),
                sudo: voucher.sudo && args.sudo === true,
                signal: exec.signal,
                tool: 'ops_files',
                authorization: voucher.authorization,
                ...session === undefined ? {} : { session },
            });
            if (report === undefined)
                return json({ text: renderRuns([result], 4000), report: null });
            return json({ text: renderFiles(host.name, report), report });
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_security',
        description: 'Security triage (网络攻击排查) on servers, read-only: SSH brute force by source and successful logins (flagging logins from addresses that also brute-forced), connection and SYN floods, listening services, crypto-miner-like processes, processes running deleted binaries or from /tmp and /dev/shm, outbound connections to common mining/C2 ports, extra UID-0 accounts, and recently changed authorized_keys, cron and systemd units. Use sudo=true for the auth log and all processes. Findings are leads to confirm, not verdicts; containment (blocking IPs, killing processes) goes through ops_exec with approval.',
        parameters: {
            targets: { type: 'string', description: 'Selector; default all.' },
            hours: { type: 'integer', description: 'Look-back window in hours; default 24.' },
            sudo: { type: 'boolean', description: 'Run as root (recommended; needs sudo permission).' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
            const hosts = service.select(args.targets ?? 'all');
            const voucher = vouchers.take(exec, hosts.map(h => h.name));
            const hours = Math.min(Math.max(Math.trunc(args.hours ?? 24), 1), 24 * 90);
            const session = SESSION(exec);
            const results = await service.security(hosts, hours, {
                sudo: voucher.sudo && args.sudo === true,
                signal: exec.signal,
                tool: 'ops_security',
                authorization: voucher.authorization,
                ...session === undefined ? {} : { session },
            });
            const text = results.map(r => r.report === undefined ? renderRuns([r.result], 2000) : renderSecurity(r.host, r.report, hours)).join('\n\n');
            return json({ text, hosts: results.map(r => ({ host: r.host, status: r.result.status, report: r.report ?? null })) });
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_task',
        description: 'Run a predefined per-server task from the dsh-wisp-ops inventory (for example a morning report on one server, recent-file analysis on another, security triage on a third) and get its data, the user\'s instruction for the report, and the previous run for comparison. Scheduled deliveries ask you to call this. Without name, lists the tasks. Write the report as instructed; do not change anything during a task.',
        parameters: {
            name: { type: 'string', description: 'Task name; omit to list tasks.' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
            if (args.name === undefined) {
                const tasks = [...service.inventory.tasks.values()];
                const text = tasks.length === 0
                    ? 'No tasks are defined. The user adds them under `tasks:` in the inventory file.'
                    : tasks.map(t => `- ${t.name}: ${t.playbook} on ${t.targets}, ${describeSchedule(t, service.config)}${t.sudo === true ? ', sudo' : ''}${t.description === undefined ? '' : ` — ${t.description}`}`).join('\n');
                return json({ text, tasks });
            }
            const task = service.inventory.tasks.get(args.name);
            if (task === undefined)
                throw new Error(`unknown task "${args.name}"; call ops_task without a name to list tasks`);
            const hosts = service.select(task.targets);
            const voucher = vouchers.take(exec, hosts.map(h => h.name));
            const session = SESSION(exec);
            const { text, record } = await runTask(service, task, {
                sudo: voucher.sudo && task.sudo === true,
                signal: exec.signal,
                authorization: voucher.authorization,
                ...session === undefined ? {} : { session },
            });
            return json({ text, record });
        },
    }));
    ctx.tools.register(defineTool({
        name: 'ops_history',
        description: 'Read past operations (the audit log of every remote command, with risk, authorization and result) or past inspections (health findings and metrics over time) for some servers. Use it for "what changed", "when did this start", and failure history.',
        parameters: {
            kind: { type: 'string', enum: ['operations', 'inspections'], required: true },
            targets: { type: 'string', description: 'Selector; default all.' },
            sinceHours: { type: 'number', description: 'Only entries newer than this; default 168 (7 days).' },
            limit: { type: 'integer', description: 'Maximum entries (per host for inspections); default 50.' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        isConcurrencySafe: () => true,
        async execute(args) {
            const hosts = service.select(args.targets ?? 'all');
            const sinceMs = Date.now() - (args.sinceHours ?? 168) * 3_600_000;
            const limit = Math.min(Math.max(Math.trunc(args.limit ?? 50), 1), 1000);
            if (args.kind === 'operations') {
                const rows = await service.store.readAudit({ hosts: new Set(hosts.map(h => h.name)), sinceMs, limit });
                const text = rows.length === 0
                    ? 'No recorded operations in this window.'
                    : rows.map(r => `${r.at} ${r.host} [${r.risk}${r.sudo ? '+sudo' : ''}, ${r.authorization}] ${r.status}${r.exitCode === null ? '' : `/${r.exitCode}`} ${r.tool}: ${r.command.split('\n')[0]?.slice(0, 160)}${r.reason === undefined ? '' : ` — ${r.reason.slice(0, 120)}`}`).join('\n');
                return json({ text, rows });
            }
            const out = {};
            const lines = [];
            for (const host of hosts) {
                const rows = (await service.store.readHistory(host.name, limit)).filter(r => Date.parse(r.at) >= sinceMs);
                out[host.name] = rows;
                if (rows.length === 0)
                    continue;
                lines.push(`## ${host.name}`);
                for (const r of rows) {
                    const disks = Object.entries(r.diskPct).map(([m, p]) => `${m} ${p}%`).join(' ');
                    const problems = r.findings.filter(f => f.severity !== 'info').map(f => f.code);
                    lines.push(`${r.at} ${r.status}${r.load1 === undefined ? '' : ` load ${r.load1}`}${r.memAvailPct === undefined ? '' : ` mem ${r.memAvailPct}%`} ${disks}${problems.length > 0 ? ` | ${problems.join(', ')}` : ''}`);
                }
            }
            return json({ text: lines.length === 0 ? 'No inspections recorded in this window; run ops_inspect.' : lines.join('\n'), history: out });
        },
    }));
}
