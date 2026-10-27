/**
 * Per-server recurring tasks: a task binds hosts to a built-in read-only
 * playbook (or a custom instruction) and an optional schedule. Scheduling
 * goes through the host's DSH Schedule service, which wakes the original
 * Session at the due time; the agent then calls `ops_task` and writes the
 * report. Every run is kept so the next report can say what changed.
 * @module dsh-wisp-ops/tasks
 */
import { renderDisk } from "./collectors/disk.js";
import { renderFiles } from "./collectors/files.js";
import { renderSecurity } from "./collectors/security.js";
import { renderInspection, renderRuns } from "./render.js";
export const SCHEDULE_TITLE_PREFIX = 'WispOps: ';
/** The message a scheduled delivery puts in the Session. */
export function taskPrompt(task) {
    return `[WispOps scheduled task "${task.name}"] Call ops_task with name="${task.name}", then write the report it asks for. Do not make changes; recommend actions instead.`;
}
/** Translate a task schedule into a DSH Schedule create request. */
export function scheduleRequest(task, config) {
    const s = task.schedule;
    if (s === undefined)
        throw new Error(`task "${task.name}" has no schedule`);
    const time_zone = s.timeZone ?? config.timeZone;
    const base = { title: `${SCHEDULE_TITLE_PREFIX}${task.name}`.slice(0, 120), prompt: taskPrompt(task) };
    if (s.daily !== undefined) {
        // DSH Schedule takes HH:mm:ss.
        const time = `${s.daily}:00`;
        return s.weekdays === undefined || s.weekdays.length === 0
            ? { ...base, daily: { time, time_zone } }
            : { ...base, weekly: { time, time_zone, weekdays: [...new Set(s.weekdays)].sort() } };
    }
    if (s.cron !== undefined)
        return { ...base, cron: { expression: s.cron, time_zone } };
    return { ...base, every_seconds: (s.everyMinutes ?? 60) * 60 };
}
export function describeSchedule(task, config) {
    const s = task.schedule;
    if (s === undefined)
        return 'on demand';
    const zone = s.timeZone ?? config.timeZone;
    if (s.daily !== undefined)
        return s.weekdays === undefined ? `daily ${s.daily} ${zone}` : `${s.daily} ${zone} on ISO weekdays ${s.weekdays.join(',')}`;
    if (s.cron !== undefined)
        return `cron "${s.cron}" ${zone}`;
    return `every ${s.everyMinutes} min`;
}
const REPORT_GUIDE = `Report format (use the user's language):
1. One status line: overall healthy / needs attention / urgent, with the count of affected hosts.
2. What changed since the previous run (new problems, resolved problems, growth), if a previous run exists.
3. Findings by severity, each with host, evidence (numbers, paths, processes), and likely cause.
4. Recommended actions, ordered by urgency, each marked read-only check / change needing approval.
Keep it short enough to read on a phone; put long lists in an appendix.`;
/** Run one task's playbook and return model-facing text plus a run record. */
export async function runTask(service, task, options) {
    const hosts = service.select(task.targets);
    const common = { sudo: options.sudo, tool: `ops_task:${task.name}`, authorization: options.authorization, ...options.signal === undefined ? {} : { signal: options.signal }, ...options.session === undefined ? {} : { session: options.session } };
    const counts = {};
    const bump = (key, n = 1) => { counts[key] = (counts[key] ?? 0) + n; };
    let body;
    switch (task.playbook) {
        case 'inspect': {
            const fleet = await service.inspect(hosts, common);
            for (const [k, v] of Object.entries(fleet.counts))
                if (v > 0)
                    bump(k, v);
            body = renderInspection(fleet, true);
            break;
        }
        case 'disk': {
            const parts = [];
            for (const host of hosts) {
                for (const path of task.paths ?? ['/']) {
                    const { report, result } = await service.disk(host, { ...common, path, depth: 2, top: 15, minFileMb: 100, recentMinFileMb: 10, recentMinutes: 1440, walkTimeoutSec: 120 });
                    parts.push(report === undefined ? renderRuns([result], 2000) : renderDisk(host.name, report));
                    if (report?.filesystem !== undefined && report.filesystem.usePct >= service.config.thresholds.diskWarnPct)
                        bump('warn');
                }
            }
            body = parts.join('\n\n');
            break;
        }
        case 'new-files': {
            const parts = [];
            for (const host of hosts) {
                const { report, result } = await service.files(host, { ...common, paths: task.paths ?? ['/'], days: task.days ?? 1, depth: 3, listMinMb: 10, maxFiles: 5000, top: 20, walkTimeoutSec: 300 });
                if (report === undefined) {
                    parts.push(renderRuns([result], 2000));
                    bump('unreachable');
                    continue;
                }
                bump('newBytes', report.totalBytes);
                bump('reclaimableBytes', report.plan.reduce((sum, item) => sum + item.reclaimBytes, 0));
                parts.push(renderFiles(host.name, report));
            }
            body = parts.join('\n\n');
            break;
        }
        case 'security': {
            const hours = task.hours ?? 24;
            const results = await service.security(hosts, hours, common);
            body = results.map(r => {
                if (r.report === undefined) {
                    bump('unreachable');
                    return renderRuns([r.result], 2000);
                }
                for (const f of r.report.findings)
                    bump(f.severity);
                return renderSecurity(r.host, r.report, hours);
            }).join('\n\n');
            break;
        }
        case 'custom':
            body = `No built-in collector: gather the evidence yourself with read-only ops_exec / ops_inspect calls on ${hosts.map(h => h.name).join(', ')}.`;
            break;
    }
    const history = await service.store.readBounded('tasks', task.name);
    const previous = history.at(-1);
    const record = { at: new Date().toISOString(), hosts: hosts.map(h => h.name), playbook: task.playbook, counts, excerpt: body.slice(0, 6000) };
    await service.store.appendBounded('tasks', task.name, record, 90);
    const header = [
        `# WispOps task "${task.name}" (${task.playbook}) on ${record.hosts.join(', ')} — ${record.at}`,
        task.description === undefined ? undefined : `Description: ${task.description}`,
        task.instruction === undefined ? undefined : `What the user wants from this task: ${task.instruction}`,
        previous === undefined
            ? 'No previous run recorded.'
            : `Previous run ${previous.at}: ${Object.entries(previous.counts).map(([k, v]) => `${k}=${v}`).join(', ') || 'no findings'}. Its excerpt follows the current data for comparison.`,
        REPORT_GUIDE,
    ].filter(Boolean).join('\n');
    const tail = previous === undefined ? '' : `\n\n---\nPrevious run excerpt (${previous.at}):\n${previous.excerpt.slice(0, 2500)}`;
    return { text: `${header}\n\n${body}${tail}`, record, ...previous === undefined ? {} : { previous } };
}
