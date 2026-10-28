/**
 * The WispOps timer: runs tasks whose report mode is `problems` or `never` inside the
 * plugin, so a green run costs no model tokens. Each run is recorded and notified exactly
 * like an agent-driven run; a `problems` run that found something queues a short prompt
 * into the owner's chosen session, where the agent reads the stored evidence with
 * `ops_task mode=last` instead of collecting it again.
 * @module dsh-wisp-ops/runner
 */
import { join } from 'node:path';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { LocalState } from "./local-state.js";
import { dueNow, nextDue } from "./schedule.js";
import { hasProblems, runTask, taskPrompt } from "./tasks.js";
export function timerStore(dataDir) {
    return new LocalState(join(dataDir, 'task-timer.json'), () => ({ version: 1, tasks: {} }), value => {
        const raw = value;
        if (raw?.version !== 1 || !raw.tasks || typeof raw.tasks !== 'object' || Array.isArray(raw.tasks))
            throw new Error('Invalid task timer state');
        const tasks = {};
        for (const [name, entry] of Object.entries(raw.tasks)) {
            if (!entry || typeof entry.enabledAt !== 'string')
                throw new Error('Invalid task timer entry');
            tasks[name] = { enabledAt: entry.enabledAt, ...typeof entry.sessionId === 'string' ? { sessionId: entry.sessionId } : {}, ...typeof entry.pendingEscalation === 'string' ? { pendingEscalation: entry.pendingEscalation } : {}, ...typeof entry.lastError === 'string' ? { lastError: entry.lastError } : {} };
        }
        return { version: 1, tasks };
    });
}
/** Runs on the WispOps timer: defined, enabled here, and not reporting through a DSH schedule. */
export function timerTask(task) {
    return task !== undefined && task.report !== undefined && task.report !== 'always';
}
export class TaskRunner {
    service;
    agents;
    now;
    state;
    running = new Set();
    constructor(service, agents, now = Date.now) {
        this.service = service;
        this.agents = agents;
        this.now = now;
        this.state = timerStore(service.config.dataDir);
    }
    /** Start ticking; the returned function stops the timer. */
    start(intervalMs = 60_000) {
        const tick = () => { void this.tick().catch(() => { }); };
        const timer = setInterval(tick, intervalMs);
        timer.unref();
        tick();
        return () => clearInterval(timer);
    }
    async enable(name, sessionId) {
        await this.edit(state => { state.tasks[name] = { enabledAt: new Date(this.now()).toISOString(), ...sessionId === undefined ? {} : { sessionId } }; });
    }
    async disable(name) {
        await this.edit(state => { delete state.tasks[name]; });
    }
    async entries() {
        return (await this.state.read()).value.tasks;
    }
    /** What the panel shows for an enabled task: the next slot and any pending escalation or error. */
    async status(task, lastRun) {
        const entry = (await this.entries())[task.name];
        if (entry === undefined)
            return undefined;
        const next = task.schedule === undefined ? undefined : nextDue(task.schedule, this.service.config.timeZone, lastRun, entry.enabledAt, this.now());
        return { ...entry, ...next === undefined ? {} : { nextAt: new Date(next).toISOString() } };
    }
    /** One pass: deliver pending escalations, then run every enabled task whose slot is due. */
    async tick() {
        await this.service.refresh();
        const entries = await this.entries();
        for (const [name, entry] of Object.entries(entries)) {
            const task = this.service.inventory.tasks.get(name);
            if (!timerTask(task)) {
                // Deleted, or edited back to agent reporting: the timer forgets it rather than running a stale definition.
                await this.disable(name).catch(() => { });
                continue;
            }
            if (entry.pendingEscalation !== undefined)
                await this.escalate(task, entry.sessionId);
            if (task.schedule === undefined || this.running.has(name))
                continue;
            const lastRun = (await this.service.store.readBounded('tasks', name)).at(-1)?.at;
            if (!dueNow(task.schedule, this.service.config.timeZone, lastRun, entry.enabledAt, this.now()))
                continue;
            await this.run(task, entry.sessionId);
        }
    }
    /** Run a timer task now: record, notify, and escalate when the mode asks for it. Errors are kept per task, never thrown to the timer. */
    async run(task, sessionId) {
        if (this.running.has(task.name))
            return { escalated: false, error: '任务正在运行。' };
        this.running.add(task.name);
        try {
            const hosts = this.service.select(task.targets);
            // Fail closed on sudo exactly as the tool gate does; the task definition is the authorization for everything else.
            const refused = task.sudo === true ? hosts.filter(h => h.policy.sudo === 'deny').map(h => h.name) : [];
            if (refused.length > 0)
                throw new Error(`host policy denies sudo on ${refused.join(', ')}`);
            const { record } = await runTask(this.service, task, { sudo: task.sudo === true, authorization: 'task' });
            const escalate = task.report === 'problems' && hasProblems(record);
            await this.edit(state => {
                const entry = state.tasks[task.name];
                if (entry === undefined)
                    return;
                delete entry.lastError;
                if (escalate)
                    entry.pendingEscalation = record.at;
            });
            const escalated = escalate ? await this.escalate(task, sessionId) : false;
            return { record, escalated };
        }
        catch (error) {
            const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
            await this.edit(state => { const entry = state.tasks[task.name]; if (entry !== undefined)
                entry.lastError = message; }).catch(() => { });
            return { escalated: false, error: message };
        }
        finally {
            this.running.delete(task.name);
        }
    }
    /** Queue the "read the evidence" prompt; a closed session keeps the escalation pending for the next tick. */
    async escalate(task, sessionId) {
        const agent = sessionId === undefined ? undefined : this.agents?.(sessionId);
        if (agent === undefined) {
            await this.edit(state => { const entry = state.tasks[task.name]; if (entry !== undefined)
                entry.lastError = sessionId === undefined ? '未设置汇报会话，无法通知 agent。' : '汇报会话未打开，发现问题后将在会话打开时通知 agent。'; }).catch(() => { });
            return false;
        }
        agent.followup(createUserMessage({ content: [{ type: 'text', text: taskPrompt(task, 'last') }], source: { kind: 'user' } }));
        await this.edit(state => { const entry = state.tasks[task.name]; if (entry !== undefined) {
            delete entry.pendingEscalation;
            delete entry.lastError;
        } }).catch(() => { });
        return true;
    }
    async edit(update) {
        const { revision } = await this.state.read();
        await this.state.change(revision, state => { update(state); return state; });
    }
}
