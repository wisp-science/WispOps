var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { Config, Task, PLAYBOOKS } from "./config.js";
import { Inventory, expandHome } from "./inventory.js";
import { managedStore, validatePolicy } from "./managed.js";
import { scheduleRequest, SCHEDULE_TITLE_PREFIX, summarizeRecord, taskPrompt } from "./tasks.js";
import { deniedScriptLine, parseScriptResult, scriptDraftStore, scriptStore, validateScript, MAX_SCRIPT_TIMEOUT_SEC } from "./check-scripts.js";
import { TaskRunner, timerTask } from "./runner.js";
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { listVault, wisptermConfigDir } from "./wispterm.js";
import { draftTask } from "./task-draft.js";
import { builtinTemplates, templateDraftStore, templateStore, validateTemplate } from "./task-library.js";
import { renderTemplate, renderTemplateCommands } from "./task-template-content.js";
import { describeSshConfigHost, inventoryNameFor, loadSshConfigHosts, sshConfigHostSpec } from "./ssh-config.js";
import { missedRun } from "./schedule.js";
import { OpsSync } from "./sync.js";
import { OpsUpdates } from "./updates.js";
import { buildOverview, overviewLimit } from "./overview.js";
function string(request, key) {
    if (typeof request[key] !== 'string' || !request[key])
        throw new Error(`缺少 ${key}。`);
    return request[key];
}
function object(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('请求格式不正确。');
    return value;
}
const titleOf = (name) => `${SCHEDULE_TITLE_PREFIX}${name}`.slice(0, 120);
/** Host fields the panel edits; an absent value clears the field. */
const HOST_FORM_FIELDS = ['ssh', 'user', 'port', 'description', 'groups', 'identityFile'];
export class OpsManager {
    service;
    vault;
    scheduler;
    updates;
    agents;
    runner;
    state;
    library;
    drafts;
    scripts;
    scriptDrafts;
    pending = Promise.resolve();
    sync;
    constructor(service, vault, scheduler, updates, agents, runner) {
        this.service = service;
        this.vault = vault;
        this.scheduler = scheduler;
        this.updates = updates;
        this.agents = agents;
        this.runner = runner;
        this.state = managedStore(service.config.dataDir);
        this.library = templateStore(service.config.dataDir);
        this.drafts = templateDraftStore(service.config.dataDir);
        this.scripts = scriptStore(service.config.dataDir);
        this.scriptDrafts = scriptDraftStore(service.config.dataDir);
        this.sync = new OpsSync(service, vault, async () => (await this.scheduleRecords()).some(r => r.title.startsWith(SCHEDULE_TITLE_PREFIX) && r.status === 'active'));
    }
    /** Serialize writes spanning credentials, bindings, and scheduler membership; long read-only lookups bypass the queue. */
    dispatch(value) {
        const request = object(value);
        if (request.action === 'probeHosts' || request.action === 'auditLog')
            return this.handle(request);
        const next = this.pending.then(() => this.handle(request));
        this.pending = next.catch(() => { });
        return next;
    }
    /** Owner-initiated capability probe of a few servers, read-only and without sudo; results join the saved probes. */
    async probeHosts(request) {
        if (!Array.isArray(request.hosts) || request.hosts.length === 0 || request.hosts.length > 64 || request.hosts.some(name => typeof name !== 'string' || !this.service.inventory.hosts.has(name)))
            throw new Error('请选择有效的服务器。');
        const hosts = this.service.select([...new Set(request.hosts)].join(','));
        const results = await this.service.probe(hosts, { tool: 'wispOps:probeHosts' });
        return { results: results.map(r => ({ host: r.host, status: r.status, ...r.probe === undefined ? {} : { probe: r.probe }, error: r.error ?? '' })) };
    }
    /** The audit log the model sees through ops_history, for the panel: bounded rows, newest last, no secrets. */
    async auditLog(request) {
        const host = request.host === undefined || request.host === '' ? undefined : request.host;
        if (host !== undefined && (typeof host !== 'string' || !this.service.inventory.hosts.has(host)))
            throw new Error('服务器不存在。');
        const limit = Math.min(Math.max(Math.trunc(Number(request.limit ?? 100)) || 100, 1), 500);
        const sinceHours = Math.min(Math.max(Number(request.sinceHours ?? 24 * 30) || 24 * 30, 1), 24 * 366);
        const rows = await this.service.store.readAudit({ ...host === undefined ? {} : { hosts: new Set([host]) }, sinceMs: Date.now() - sinceHours * 3_600_000, limit });
        return { rows: rows.map(r => ({ ...r, command: r.command.length > 400 ? `${r.command.slice(0, 400)}…` : r.command, ...r.reason === undefined ? {} : { reason: r.reason.slice(0, 300) } })), limit, sinceHours, retentionMonths: this.service.config.retention.auditMonths };
    }
    async scheduleRecords() {
        return await this.scheduler()?.catalog() ?? [];
    }
    async update(revision, edit, participate) {
        await this.state.change(revision, async (state) => {
            await edit(state);
            // Validate the combined inventory before replacing any file.
            await Inventory.load(this.service.config, this.service.imported, state);
            return state;
        }, participate);
        // Immediately visible to tools, commands, and the next scheduled run.
        this.service.inventory = await Inventory.load(this.service.config, this.service.imported);
    }
    async handle(request) {
        await this.service.refresh();
        const action = string(request, 'action');
        if (action === 'snapshot')
            return this.snapshot();
        if (action === 'overview')
            return this.overview(request);
        if (action === 'probeHosts')
            return this.probeHosts(request);
        if (action === 'auditLog')
            return this.auditLog(request);
        if (['updateStatus', 'updateSettings', 'updateCheck', 'updateInstall'].includes(action)) {
            if (!this.updates)
                throw new Error('Update service is unavailable');
            return this.updates.dispatch(action, request);
        }
        if (['syncList', 'syncPush', 'syncPreview', 'syncPull'].includes(action))
            return this.sync.handle(action, request);
        if (action === 'saveTemplate') {
            const template = validateTemplate(request.template);
            await this.library.change(string(request, 'revision'), state => {
                const exists = state.entries.some(t => t.id === template.id);
                if (request.edit === true && !exists)
                    throw new Error('模板已被删除，请刷新后重试。');
                if (request.edit !== true && exists)
                    throw new Error('模板标识已存在。');
                state.entries = [...state.entries.filter(t => t.id !== template.id), template];
                return state;
            });
            // A reviewed AI draft leaves the queue once it is in the library.
            if (typeof request.draftId === 'string')
                await this.discardDraft(request.draftId).catch(() => { });
            return { message: '已保存到任务库。可稍后关联服务器，已有例行任务不会改变。' };
        }
        if (action === 'templateDrafts')
            return { ids: (await this.drafts.read()).value.entries.map(d => d.id) };
        if (action === 'discardTemplateDraft') {
            await this.discardDraft(string(request, 'id'));
            return { message: '草稿已丢弃。' };
        }
        if (action === 'draftTemplateInChat') {
            // The owner's request goes to an open session; the agent can only submit a draft, which the owner reviews here.
            const sessionId = string(request, 'sessionId'), prompt = string(request, 'prompt');
            if (prompt.length > 20000)
                throw new Error('需求内容过长。');
            const agent = this.agents?.(sessionId);
            if (!agent)
                throw new Error('所选会话当前未打开，请先打开该会话再生成。');
            agent.followup(createUserMessage({ content: [{ type: 'text', text: prompt }], source: { kind: 'user' } }));
            return { message: '已发送到对话。在对话中补充需求，agent 提交的草稿会出现在任务库的「待审核草稿」中。' };
        }
        if (action === 'saveScript') {
            const script = validateScript(request.script);
            const denied = deniedScriptLine(script.content, this.denyPatterns());
            if (denied !== undefined)
                throw new Error(`脚本被部署级 deny 规则（${denied.source}）拒绝：${denied.line}`);
            await this.scripts.change(string(request, 'revision'), state => {
                const exists = state.entries.some(e => e.id === script.id);
                if (request.edit === true && !exists)
                    throw new Error('脚本已被删除，请刷新后重试。');
                if (request.edit !== true && exists)
                    throw new Error('脚本标识已存在。');
                state.entries = [...state.entries.filter(e => e.id !== script.id), script];
                return state;
            });
            if (typeof request.draftId === 'string')
                await this.discardScriptDraft(request.draftId).catch(() => { });
            return { message: request.edit === true ? '脚本已更新，关联任务的下一次运行将使用新内容。' : '脚本已保存。可关联服务器并选择汇报方式。' };
        }
        if (action === 'deleteScript') {
            const name = string(request, 'name');
            const users = [...this.service.inventory.tasks.values()].filter(t => t.script === name).map(t => t.name);
            if (users.length)
                throw new Error(`脚本仍被任务使用：${users.join('、')}。请先删除或修改这些任务。`);
            await this.scripts.change(string(request, 'revision'), state => {
                if (!state.entries.some(e => e.id === name))
                    throw new Error('脚本已不存在。');
                state.entries = state.entries.filter(e => e.id !== name);
                return state;
            });
            return { message: '脚本已删除。' };
        }
        if (action === 'scriptDrafts')
            return { ids: (await this.scriptDrafts.read()).value.entries.map(d => d.id) };
        if (action === 'discardScriptDraft') {
            await this.discardScriptDraft(string(request, 'id'));
            return { message: '草稿已丢弃。' };
        }
        if (action === 'testScript') {
            // The owner tries unsaved content on one server, read-only and without sudo; the deny list still applies.
            const name = string(request, 'host'), content = string(request, 'content');
            const host = this.service.inventory.hosts.get(name);
            if (!host)
                throw new Error('服务器不存在。');
            const script = validateScript({ id: 'test', title: 'test', content, timeoutSec: request.timeoutSec });
            const denied = deniedScriptLine(script.content, this.denyPatterns());
            if (denied !== undefined)
                throw new Error(`脚本被部署级 deny 规则（${denied.source}）拒绝：${denied.line}`);
            const [result] = await this.service.execute([host], script.content, { sudo: false, authorization: 'read-only', risk: 'read', tool: 'wispOps:testScript', timeoutMs: Math.min(script.timeoutSec, MAX_SCRIPT_TIMEOUT_SEC) * 1000, auditCommand: `(check script test sha256:${script.sha256.slice(0, 12)})` });
            const outcome = parseScriptResult(result);
            return { host: name, verdict: outcome.verdict, exitCode: outcome.exitCode, summary: outcome.summary, evidence: outcome.evidence.slice(0, 4000), ...outcome.metrics === undefined ? {} : { metrics: outcome.metrics }, durationMs: result.durationMs };
        }
        if (action === 'deleteTemplate') {
            const name = string(request, 'name');
            await this.library.change(string(request, 'revision'), state => {
                if (!state.entries.some(t => t.id === name))
                    throw new Error('预设不可删除，或模板已不存在。');
                state.entries = state.entries.filter(t => t.id !== name);
                return state;
            });
            return { message: '模板已删除，已关联的例行任务仍保留原有规则。' };
        }
        if (action === 'draftTask') {
            if (!Array.isArray(request.hosts) || !request.hosts.length || request.hosts.some(name => typeof name !== 'string' || !this.service.inventory.hosts.has(name)))
                throw new Error('请选择有效的服务器。');
            const hosts = this.service.select([...new Set(request.hosts)].join(','));
            if (!PLAYBOOKS.includes(request.playbook) || request.playbook === 'script')
                throw new Error('请选择检查内容。');
            if (request.refreshProbe !== undefined && typeof request.refreshProbe !== 'boolean')
                throw new Error('探测选项无效。');
            const warnings = [];
            if (request.refreshProbe === true) {
                const results = await this.service.probe(hosts, { tool: 'wispOps:draftTask' });
                for (const result of results)
                    if (!result.probe)
                        warnings.push(`${result.host} 本次探测未完成（${result.status}），使用已有记录或通用规则。`);
            }
            const probes = await this.service.store.probes();
            const observations = await Promise.all(hosts.map(async (host) => ({ host, probe: probes[host.name], history: await this.service.store.lastHealthy(host.name) })));
            const draft = draftTask(observations, request.playbook, this.service.config, new Set(this.service.inventory.tasks.keys()));
            draft.warnings.unshift(...warnings);
            return draft;
        }
        if (action === 'saveCredential') {
            const input = object(request.credential);
            const exists = (await this.vault.list()).entries.some(e => e.name === input.name);
            if (request.edit !== true && exists)
                throw new Error('凭据名称已存在，请编辑已有凭据或使用新名称。');
            if (request.edit === true && !exists)
                throw new Error('凭据已被删除，请刷新后重试。');
            const vaultRevision = string(request, 'revision');
            // Older clients may still save metadata without changing server links.
            if (request.associations === undefined) {
                await this.vault.save(input, vaultRevision);
                return { message: '凭据已加密保存。' };
            }
            if (!Array.isArray(request.associations))
                throw new Error('服务器关联格式不正确。');
            const associations = new Map();
            for (const value of request.associations) {
                const row = object(value), name = string(row, 'host');
                if (typeof row.login !== 'boolean' || typeof row.sudo !== 'boolean' || (!row.login && !row.sudo) || associations.has(name))
                    throw new Error('请选择服务器的凭据用途，且不要重复关联。');
                associations.set(name, { login: row.login, sudo: row.sudo });
            }
            if (!exists && !associations.size)
                throw new Error('新增凭据需要关联至少一台服务器。');
            const ref = `local:${input.name}`;
            const isOwn = (value) => value === ref || (this.service.config.secrets.provider === 'local' && value === input.name);
            await this.update(string(request, 'managedRevision'), async (state) => {
                const inventory = await Inventory.load(this.service.config, this.service.imported, state);
                for (const name of associations.keys())
                    if (!inventory.hosts.has(name))
                        throw new Error(`服务器 ${name} 不存在，请刷新后重试。`);
                for (const host of inventory.hosts.values()) {
                    const selected = associations.get(host.name);
                    if (!selected && !isOwn(host.loginSecret) && !isOwn(host.sudoSecret))
                        continue;
                    const binding = { auth: host.auth ?? 'key', loginSecret: host.loginSecret, sudoSecret: host.sudoSecret };
                    for (const [role, field] of [['login', 'loginSecret'], ['sudo', 'sudoSecret']]) {
                        if (selected?.[role]) {
                            // Retaining a dormant login reference must not switch a key-based host.
                            if (role === 'login' && !isOwn(host[field]))
                                binding.auth = 'password';
                            binding[field] = ref;
                        }
                        else if (isOwn(host[field])) {
                            binding[field] = undefined;
                            if (role === 'login' && binding.auth === 'password')
                                binding.auth = 'key';
                        }
                    }
                    Object.defineProperty(state.bindings, host.name, { value: binding, enumerable: true, writable: true, configurable: true });
                }
            }, commit => this.vault.save(input, vaultRevision, commit));
            return { message: `凭据已加密保存，已更新 ${associations.size} 台服务器的关联。` };
        }
        if (action === 'deleteCredential') {
            const name = string(request, 'name');
            const isOwn = (ref) => ref === `local:${name}` || (this.service.config.secrets.provider === 'local' && ref === name);
            const refs = [...this.service.inventory.hosts.values()].filter(h => isOwn(h.loginSecret) || isOwn(h.sudoSecret));
            if (!refs.length) {
                await this.vault.remove(name, string(request, 'revision'));
                return { message: '凭据已删除。' };
            }
            if (request.force !== true)
                throw new Error(`凭据仍被 ${refs.map(h => h.name).join('、')} 使用，请先解除关联。`);
            // Forced deletion returns each linked purpose to its default: SSH key login, sudo without a stored password.
            await this.update(string(request, 'managedRevision'), async (state) => {
                const inventory = await Inventory.load(this.service.config, this.service.imported, state);
                for (const host of inventory.hosts.values()) {
                    const login = isOwn(host.loginSecret), sudo = isOwn(host.sudoSecret);
                    if (!login && !sudo)
                        continue;
                    const binding = { auth: login ? 'key' : host.auth ?? 'key', loginSecret: login ? undefined : host.loginSecret, sudoSecret: sudo ? undefined : host.sudoSecret };
                    Object.defineProperty(state.bindings, host.name, { value: binding, enumerable: true, writable: true, configurable: true });
                }
            }, commit => this.vault.remove(name, string(request, 'revision'), commit));
            return { message: `凭据已删除，${refs.length} 台服务器的对应用途已恢复默认。` };
        }
        if (action === 'bindCredentials') {
            const name = string(request, 'host');
            if (!this.service.inventory.hosts.has(name))
                throw new Error('服务器不存在。');
            const raw = object(request.binding);
            if (raw.auth !== 'key' && raw.auth !== 'password')
                throw new Error('请选择登录方式。');
            const entries = (await this.vault.list()).entries;
            const binding = { auth: raw.auth };
            for (const key of ['loginSecret', 'sudoSecret']) {
                const ref = raw[key];
                if (ref === '' || ref === undefined)
                    continue;
                if (typeof ref !== 'string')
                    throw new Error('凭据引用格式不正确。');
                // Existing legacy references may be retained; new selections use the local vault.
                if (ref !== this.service.inventory.hosts.get(name)?.[key] && (!ref.startsWith('local:') || !entries.some(e => `local:${e.name}` === ref)))
                    throw new Error('所选凭据不存在。');
                binding[key] = ref;
            }
            if (binding.auth === 'password' && !binding.loginSecret)
                throw new Error('密码登录需要选择登录凭据。');
            await this.update(string(request, 'revision'), state => {
                Object.defineProperty(state.bindings, name, { value: binding, enumerable: true, writable: true, configurable: true });
            });
            return { message: '服务器凭据关联已保存。' };
        }
        if (action === 'testBinding') {
            // Owner-initiated check of one purpose on one server, before or after linking; never a model tool.
            const name = string(request, 'host');
            const host = this.service.inventory.hosts.get(name);
            if (!host)
                throw new Error('服务器不存在。');
            const role = request.role;
            if (role !== 'login' && role !== 'sudo')
                throw new Error('请选择要测试的用途。');
            const ref = request.ref === undefined ? '' : request.ref;
            if (typeof ref !== 'string')
                throw new Error('凭据引用格式不正确。');
            const field = role === 'login' ? 'loginSecret' : 'sudoSecret';
            if (ref !== '' && ref !== host[field] && (!ref.startsWith('local:') || !(await this.vault.list()).entries.some(e => `local:${e.name}` === ref)))
                throw new Error('所选凭据不存在。');
            const candidate = role === 'login'
                ? { ...host, auth: ref ? 'password' : 'key', ...(ref ? { loginSecret: ref } : {}) }
                : { ...host, ...(ref ? { sudoSecret: ref } : {}) };
            if (role === 'login' && !ref)
                delete candidate.loginSecret;
            if (role === 'sudo' && !ref)
                delete candidate.sudoSecret;
            const [result] = await this.service.execute([candidate], 'id -un', {
                sudo: role === 'sudo',
                timeoutMs: this.service.config.ssh.connectTimeoutSec * 1000 + 15_000,
                tool: 'wispOps:testBinding',
                risk: 'read',
                authorization: 'read-only',
                reason: `panel test of ${role} binding`,
            });
            if (!result)
                throw new Error('测试未返回结果。');
            // stderr may carry ssh diagnostics but never the password; keep it short for the panel.
            return { status: result.status, user: result.status === 'ok' ? result.stdout.trim().split('\n')[0] ?? '' : '', error: result.status === 'ok' ? '' : result.stderr.trim().slice(0, 300) };
        }
        if (action === 'inspectNow') {
            // Owner-initiated read-only inspection of one server without sudo; the result joins the same history ops_inspect writes.
            const name = string(request, 'host');
            const host = this.service.inventory.hosts.get(name);
            if (!host)
                throw new Error('服务器不存在。');
            const result = await this.service.inspect([host], { sudo: false, authorization: 'read-only', tool: 'wispOps:panelInspect' });
            const entry = result.hosts[0];
            if (!entry)
                throw new Error('巡检未返回结果。');
            return { at: result.at, status: entry.status, severity: entry.severity, findings: entry.findings.length, error: entry.error ?? '', durationMs: entry.durationMs };
        }
        if (action === 'setPolicy') {
            // Owner-only: the panel's override wins over the host's YAML, group and default policy for the listed capabilities.
            const name = string(request, 'host');
            if (!this.service.inventory.hosts.has(name))
                throw new Error('服务器不存在。');
            let policy;
            try {
                policy = validatePolicy(request.policy);
            }
            catch {
                throw new Error('操作权限取值不正确，请选择 allow、ask 或 deny。');
            }
            await this.update(string(request, 'revision'), state => {
                if (Object.keys(policy).length === 0)
                    delete state.policies[name];
                else
                    Object.defineProperty(state.policies, name, { value: policy, enumerable: true, writable: true, configurable: true });
            });
            return { message: '操作权限已保存，下一次调用即生效。' };
        }
        if (action === 'addHost' || action === 'editHost') {
            const input = object(request.host);
            const allowed = ['name', 'ssh', 'user', 'port', 'description', 'groups', 'identityFile', 'proxyJump'];
            const host = Config({ hosts: [Object.fromEntries(allowed.filter(k => input[k] !== undefined).map(k => [k, input[k]]))] }).hosts[0];
            if (host.port !== undefined && host.port < 1)
                throw new Error('端口必须为 1–65535。');
            if (action === 'addHost') {
                if (host.name === 'all' || this.service.inventory.hosts.has(host.name))
                    throw new Error('服务器名称已存在或为保留名称。');
                await this.update(string(request, 'revision'), state => {
                    if (state.excludedHosts.includes(host.name))
                        throw new Error('同名服务器已从 WispOps 移除，请先在“已移除的服务器”中恢复。');
                    state.hosts.push(host);
                });
                return { message: '服务器已添加，可在详情中关联密码库。', added: [host.name] };
            }
            // The name keys bindings, policies, tasks and history, so it never changes; neither do fields the form does not show.
            await this.update(string(request, 'revision'), state => {
                const existing = state.hosts.find(h => h.name === host.name);
                if (!existing)
                    throw new Error(this.service.inventory.hosts.has(host.name) ? '该服务器由配置文件或 WispTerm 管理，请在原处编辑。' : '服务器已被删除，请刷新后重试。');
                const edited = { ...existing };
                for (const key of HOST_FORM_FIELDS) {
                    if (host[key] === undefined)
                        delete edited[key];
                    else
                        Object.assign(edited, { [key]: host[key] });
                }
                state.hosts = state.hosts.map(h => h === existing ? edited : h);
            });
            // A login pause was about the old destination.
            this.service.runner.guard.clear(host.name);
            return { message: '服务器已更新，下次连接即生效。' };
        }
        if (action === 'sshConfigHosts') {
            // Candidates only: nothing is added until the owner picks aliases in importSshConfigHosts.
            const { path, hosts } = await loadSshConfigHosts(this.service.config.sshConfigFile);
            const excluded = new Set((await this.state.read()).value.excludedHosts);
            return {
                path,
                hosts: hosts.map(h => {
                    const name = inventoryNameFor(h.alias);
                    return { alias: h.alias, name, target: describeSshConfigHost(h), source: h.source, excluded: excluded.has(name), existing: this.service.inventory.hosts.has(name) || [...this.service.inventory.hosts.values()].some(x => x.ssh === h.alias) };
                }),
            };
        }
        if (action === 'importSshConfigHosts') {
            if (!Array.isArray(request.aliases) || request.aliases.length === 0 || request.aliases.length > 200 || request.aliases.some(a => typeof a !== 'string'))
                throw new Error('请选择要导入的 ssh_config 主机。');
            const wanted = new Set(request.aliases);
            const { hosts } = await loadSshConfigHosts(this.service.config.sshConfigFile);
            const specs = hosts.filter(h => wanted.has(h.alias)).map(sshConfigHostSpec);
            const missing = [...wanted].filter(alias => !hosts.some(h => h.alias === alias));
            if (missing.length)
                throw new Error(`ssh_config 中没有这些主机：${missing.join('、')}，请刷新后重试。`);
            const added = [];
            await this.update(string(request, 'revision'), state => {
                for (const spec of specs) {
                    if (spec.name === 'all' || this.service.inventory.hosts.has(spec.name) || state.hosts.some(h => h.name === spec.name) || state.excludedHosts.includes(spec.name))
                        continue;
                    state.hosts.push(spec);
                    added.push(spec.name);
                }
                if (!added.length)
                    throw new Error('所选主机都已存在或已从 WispOps 移除，请先恢复已移除的服务器。');
            });
            return { message: `已从 ssh_config 导入 ${added.length} 台服务器，连接仍使用 ssh_config 中的别名和密钥。`, added, skipped: specs.length - added.length };
        }
        if (action === 'deleteHost') {
            const name = string(request, 'name');
            if (!this.service.inventory.hosts.has(name))
                throw new Error('服务器已被删除，请刷新后重试。');
            const tasks = [...this.service.inventory.tasks.values()].filter(t => t.targets.split(/[\s,]+/).some(term => term.replace(/^!/, '') === name));
            if (tasks.length)
                throw new Error(`服务器仍被例行任务 ${tasks.map(t => t.name).join('、')} 使用，请先编辑或删除这些任务。`);
            let excluded = false;
            await this.update(string(request, 'revision'), state => {
                if (!state.hosts.some(h => h.name === name)) {
                    // Keep bindings and restrictive policies for restoration; never edit YAML, WispTerm or ssh_config.
                    state.excludedHosts.push(name);
                    excluded = true;
                    return;
                }
                state.hosts = state.hosts.filter(h => h.name !== name);
                delete state.bindings[name];
                delete state.policies[name];
            });
            this.service.runner.guard.clear(name);
            if (excluded)
                return { message: '已从 WispOps 移除，刷新或重启后仍保持移除。原始配置、凭据关联和权限设置保留，可在“已移除的服务器”中恢复。' };
            return { message: '服务器已删除，其凭据关联和操作权限一并移除，密码库中的凭据保留。' };
        }
        if (action === 'restoreHost') {
            const name = string(request, 'name');
            await this.update(string(request, 'revision'), state => {
                if (!state.excludedHosts.includes(name))
                    throw new Error('服务器不在移除列表中，请刷新后重试。');
                state.excludedHosts = state.excludedHosts.filter(host => host !== name);
            });
            return { message: this.service.inventory.hosts.has(name) ? '服务器已恢复，沿用原有凭据关联和权限设置。' : '已取消移除；原始配置再次提供该服务器时会显示在列表中。' };
        }
        if (action === 'saveTask') {
            let input = object(request.task);
            if (request.templateId !== undefined) {
                if (request.edit === true)
                    throw new Error('已有任务请直接编辑，或重新创建模板关联。');
                const library = await this.library.read();
                if (library.revision !== string(request, 'templateRevision'))
                    throw new Error('任务库已更新，请刷新后重新关联。');
                const template = [...builtinTemplates(this.service.config), ...library.value.entries].find(t => t.id === string(request, 'templateId'));
                if (!template)
                    throw new Error('模板已不存在，请刷新任务库。');
                const values = object(request.templateValues ?? {});
                const instruction = renderTemplate(template, values);
                const commands = renderTemplateCommands(template, values);
                if (input.instruction !== undefined && typeof input.instruction !== 'string')
                    throw new Error('报告要求格式不正确。');
                // Copy the trusted definition. Template changes never modify an existing task.
                input = { ...template.definition, ...Object.fromEntries(['name', 'description', 'targets', 'schedule', 'sudo', 'paths', 'days', 'hours', 'notify', 'notifyOnlyProblems', 'notifyOnChange', 'quietHours', 'report'].filter(k => input[k] !== undefined).map(k => [k, input[k]])),
                    template: template.id, instruction: instruction + (input.instruction ? `\n补充要求：${input.instruction}` : ''), ...commands.length ? { commands } : {} };
            }
            else if (request.edit !== true) {
                delete input.template;
            }
            const task = Task(input);
            if (task.notify?.some(name => !this.service.config.notifications[name]))
                throw new Error('Unknown notification channel');
            if (task.name.length > 100 || task.name === 'all')
                throw new Error('任务名称最多 100 个字符，不能使用 all。');
            if (request.edit !== true && this.service.inventory.tasks.has(task.name))
                throw new Error('任务名称已存在。');
            if (request.edit === true && !(await this.state.read()).value.tasks.some(t => t.name === task.name))
                throw new Error('该任务由 YAML 配置管理，请在原配置中编辑。');
            const hosts = this.service.select(task.targets);
            // UI tasks bind exact hosts; group additions never silently expand authorization.
            task.targets = hosts.map(h => h.name).join(',');
            if (task.sudo && hosts.some(h => h.policy.sudo === 'deny'))
                throw new Error('所选服务器禁止 sudo，请关闭任务 sudo 或调整服务器策略。');
            if (task.schedule?.timeZone) {
                try {
                    new Intl.DateTimeFormat('en', { timeZone: task.schedule.timeZone });
                }
                catch {
                    throw new Error('时区无效，请使用 Asia/Shanghai 等 IANA 时区。');
                }
            }
            if (task.playbook === 'script' && !(await this.scripts.read()).value.entries.some(e => e.id === task.script))
                throw new Error('所选脚本已不存在，请刷新脚本库。');
            if (await this.scheduleActive(task.name))
                throw new Error('请先停用此任务的调度，再编辑任务。');
            await this.update(string(request, 'revision'), state => {
                state.tasks = [...state.tasks.filter(t => t.name !== task.name), task];
            });
            return { message: '任务已保存。点击“启用调度”后开始按时间运行。' };
        }
        if (action === 'deleteTask') {
            const name = string(request, 'name');
            if (!(await this.state.read()).value.tasks.some(t => t.name === name))
                throw new Error('该任务由 YAML 配置管理，请在原配置中删除。');
            if (await this.scheduleActive(name))
                throw new Error('请先停用此任务的所有调度。');
            await this.update(string(request, 'revision'), state => { state.tasks = state.tasks.filter(t => t.name !== name); });
            return { message: '任务已删除。' };
        }
        if (action === 'scheduleTask') {
            const name = string(request, 'name');
            if (typeof request.enabled !== 'boolean')
                throw new Error('调度状态无效。');
            const timed = this.service.inventory.tasks.get(name);
            if (timerTask(timed)) {
                // Runs on the WispOps timer: no DSH schedule, no session wake-up unless a run found problems.
                if (!this.runner)
                    throw new Error('当前运行环境没有 WispOps 定时器。');
                if (!request.enabled) {
                    await this.runner.disable(name);
                    return { message: '定时运行已停用。' };
                }
                if (!timed.schedule)
                    throw new Error('请先为任务设置运行时间。');
                const sessionId = typeof request.sessionId === 'string' && request.sessionId ? request.sessionId : undefined;
                if (timed.report === 'problems' && sessionId === undefined)
                    throw new Error('仅异常时汇报需要选择一个汇报会话。');
                await this.assertAutomationReady(timed);
                await this.runner.enable(name, sessionId);
                const status = await this.runner.status(timed, (await this.service.store.readBounded('tasks', name)).at(-1)?.at);
                return { message: timed.report === 'never' ? `定时运行已启用，结果只记录和通知，不唤醒 agent。${status?.nextAt ? `下次运行：${status.nextAt}` : ''}` : `定时运行已启用，发现异常时才通知所选会话的 agent。${status?.nextAt ? `下次运行：${status.nextAt}` : ''}` };
            }
            const scheduler = this.scheduler();
            if (!scheduler)
                throw new Error('当前运行环境没有 DSH 调度服务，任务已保存，可用 /ops-run 手动运行。');
            const sessionId = string(request, 'sessionId');
            const records = (await scheduler.catalog()).filter(r => r.title === titleOf(name) && r.sessionId === sessionId && r.status === 'active');
            if (!request.enabled) {
                for (const row of records) {
                    if (!(await scheduler.delete({ id: row.id, sessionId })).deleted)
                        throw new Error('调度已变化，请刷新后重试。');
                }
                return { message: '此会话的调度已停用。' };
            }
            const task = this.service.inventory.tasks.get(name);
            if (!task?.schedule)
                throw new Error('请先为任务设置运行时间。');
            // Idempotent enable: a lost response or double click cannot duplicate a reminder.
            if (records.length)
                return { message: '此任务已在所选会话启用。' };
            await this.assertAutomationReady(task);
            const record = await scheduler.create(sessionId, scheduleRequest(task, this.service.config));
            return { message: `调度已启用，下次运行：${record.scheduledAt}` };
        }
        if (action === 'runTaskNow') {
            // One immediate run: queue the same prompt a scheduled delivery would send, into the session the owner picked.
            const name = string(request, 'name'), sessionId = string(request, 'sessionId');
            const task = this.service.inventory.tasks.get(name);
            if (!task)
                throw new Error('任务不存在，请刷新后重试。');
            await this.assertAutomationReady(task);
            if (timerTask(task)) {
                if (!this.runner)
                    throw new Error('当前运行环境没有 WispOps 定时器。');
                const outcome = await this.runner.run(task, task.report === 'problems' ? sessionId : undefined);
                if (outcome.record === undefined)
                    throw new Error(outcome.error ?? '运行失败。');
                const { verdict, summary } = summarizeRecord(outcome.record);
                return { message: `任务「${name}」已运行：${verdict}。${summary}${outcome.escalated ? '\n已通知所选会话的 agent 解读。' : outcome.error ? `\n${outcome.error}` : ''}`, record: outcome.record };
            }
            const agent = this.agents?.(sessionId);
            if (!agent)
                throw new Error('所选会话当前未打开，请先打开该会话再运行。');
            agent.followup(createUserMessage({ content: [{ type: 'text', text: taskPrompt(task) }], source: { kind: 'user' } }));
            return { message: `任务「${name}」已发送到所选会话，报告将在该会话中生成。` };
        }
        throw new Error('未知的管理操作。');
    }
    async discardDraft(id) {
        await this.drafts.change((await this.drafts.read()).revision, state => ({ ...state, entries: state.entries.filter(d => d.id !== id) }));
    }
    async discardScriptDraft(id) {
        await this.scriptDrafts.change((await this.scriptDrafts.read()).revision, state => ({ ...state, entries: state.entries.filter(d => d.id !== id) }));
    }
    denyPatterns() {
        return this.service.config.denyPatterns.map(source => new RegExp(source));
    }
    /** Enabled anywhere: a DSH schedule in any session, or the WispOps timer. */
    async scheduleActive(name) {
        if ((await this.scheduleRecords()).some(r => r.title === titleOf(name) && r.status === 'active'))
            return true;
        return this.runner !== undefined && (await this.runner.entries())[name] !== undefined;
    }
    /** Credentials and sudo policy a scheduled or immediate run would need, checked before anything is queued. */
    async assertAutomationReady(task) {
        const hosts = this.service.select(task.targets);
        const entries = (await this.vault.list()).entries;
        for (const host of hosts) {
            if (task.sudo && host.policy.sudo === 'deny')
                throw new Error(`${host.name} 禁止 sudo。`);
            for (const ref of [host.auth === 'password' ? host.loginSecret : undefined, task.sudo ? host.sudoSecret : undefined]) {
                if (!ref || (!ref.startsWith('local:') && this.service.config.secrets.provider !== 'local'))
                    continue;
                const entry = entries.find(e => e.name === ref.replace(/^local:/, ''));
                if (!entry?.agent || !entry.hasSecret)
                    throw new Error(`${host.name} 的凭据不可用于自动化，请检查密码库。`);
            }
        }
    }
    /** Recent inspection history for every host: read-only, bounded, no command output. */
    async overview(request) {
        const limit = overviewLimit(request.limit);
        const hosts = await Promise.all([...this.service.inventory.hosts.values()].map(async (host) => ({ name: host.name, groups: host.groups, history: await this.service.store.readHistory(host.name, limit) })));
        return buildOverview(hosts, limit);
    }
    async snapshot() {
        const state = await this.state.read(), vault = await this.vault.list();
        const library = await this.library.read();
        const warnings = [];
        let scheduled = [];
        try {
            scheduled = await this.scheduleRecords();
        }
        catch {
            warnings.push('无法读取调度状态，请刷新后重试。');
        }
        let external = [];
        if (this.service.config.secrets.provider === 'wispterm') {
            try {
                external = await listVault(expandHome(this.service.config.secrets.wisptermDir ?? wisptermConfigDir()));
            }
            catch {
                warnings.push('无法读取可选的 WispTerm 密码库，内置密码库仍可使用。');
            }
        }
        const scripts = await this.scripts.read();
        const tasks = await Promise.all([...this.service.inventory.tasks.values()].map(async (t) => {
            const last = (await this.service.store.readBounded('tasks', t.name)).at(-1);
            const lastRun = last?.at;
            const timer = timerTask(t) && this.runner ? await this.runner.status(t, lastRun) : undefined;
            // A timer task shows its timer as its one schedule, so the panel treats both kinds alike.
            const active = timer !== undefined ? [{ id: 'wisp-ops-timer', title: titleOf(t.name), sessionId: timer.sessionId ?? '', scheduledAt: timer.nextAt ?? '', status: 'active' }] : scheduled.filter(r => r.title === titleOf(t.name) && r.status === 'active');
            // Only a task someone enabled can miss a slot; cron schedules are not evaluated.
            let missed = { missed: false };
            if (active.length && t.schedule) {
                try {
                    missed = missedRun(t.schedule, this.service.config.timeZone, lastRun);
                }
                catch {
                    missed = { missed: false };
                }
            }
            const lastOutcome = last === undefined ? undefined : { at: last.at, ...summarizeRecord(last) };
            return { ...t, hosts: this.service.inventory.select(t.targets).map(h => h.name), editable: state.value.tasks.some(m => m.name === t.name), scheduled: active, ...lastRun === undefined ? {} : { lastRun }, ...missed.dueAt === undefined ? {} : { dueAt: missed.dueAt }, missed: missed.missed, ...lastOutcome === undefined ? {} : { lastOutcome }, ...timer?.lastError === undefined ? {} : { timerError: timer.lastError }, ...timer?.pendingEscalation === undefined ? {} : { pendingEscalation: timer.pendingEscalation } };
        }));
        const reference = (ref) => {
            if (!ref)
                return null;
            const local = ref.startsWith('local:') || this.service.config.secrets.provider === 'local';
            const entry = local ? vault.entries.find(e => e.name === ref.replace(/^local:/, '')) : external.find(e => e.name.toLowerCase() === ref.toLowerCase());
            return { ref, name: ref.replace(/^local:/, ''), username: entry?.username ?? '', provider: local ? 'local' : this.service.config.secrets.provider, status: !entry ? 'missing' : !entry.agent ? 'disabled' : entry.hasSecret ? 'ready' : 'empty' };
        };
        const probes = await this.service.store.probes();
        const hosts = [...this.service.inventory.hosts.values()].map(h => ({ ...h, editable: state.value.hosts.some(m => m.name === h.name), credentials: { login: reference(h.loginSecret), sudo: reference(h.sudoSecret) }, tasks: tasks.filter(t => t.hosts.includes(h.name)).map(t => t.name), probe: probes[h.name] ?? null }));
        const drafts = (await this.drafts.read()).value.entries;
        const templates = { revision: library.revision, drafts, entries: [...builtinTemplates(this.service.config), ...library.value.entries].map(t => ({ ...t, builtin: t.id.startsWith('builtin.'), uses: tasks.filter(task => task.template === t.id).length })) };
        const scriptLibrary = { revision: scripts.revision, drafts: (await this.scriptDrafts.read()).value.entries, entries: scripts.value.entries.map(e => ({ ...e, uses: tasks.filter(task => task.script === e.id).length })) };
        return { revision: state.revision, vault, hosts, excludedHosts: state.value.excludedHosts, tasks, templates, scripts: scriptLibrary, notificationChannels: Object.keys(this.service.config.notifications), timeZone: this.service.config.timeZone, schedulerAvailable: this.scheduler() !== undefined, timerAvailable: this.runner !== undefined, warnings };
    }
}
let OpsManagement = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _manage_decorators;
    return class OpsManagement extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _manage_decorators = [Remote];
            __esDecorate(this, null, _manage_decorators, { kind: "method", name: "manage", static: false, private: false, access: { has: obj => "manage" in obj, get: obj => obj.manage }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        manager = __runInitializers(this, _instanceExtraInitializers);
        constructor(ctx, options) {
            super(ctx, 'wispOps');
            const updates = new OpsUpdates(options.service.config.dataDir, () => ctx.get('pluginManager'), () => ctx.get('hmr') !== undefined);
            const agents = () => ctx.get('agents');
            const runner = new TaskRunner(options.service, id => agents()?.get(id));
            this.manager = new OpsManager(options.service, options.vault, () => ctx.get('schedule'), updates, id => agents()?.get(id), runner);
            ctx.effect(() => runner.start());
            ctx.effect(() => {
                const tick = () => { void updates.dispatch('updateTick').catch(() => { }); };
                const timer = setInterval(tick, 15 * 60_000);
                timer.unref();
                tick();
                return () => clearInterval(timer);
            });
        }
        async manage(request) {
            // Do not expose credentials or configuration mutations to non-owner API peers.
            if (this.ctx.invocation?.peer.principal.kind !== 'owner')
                return { ok: false, error: '仅宿主所有者可管理 WispOps。' };
            try {
                return { ok: true, value: JSON.parse(JSON.stringify(await this.manager.dispatch(request))) };
            }
            catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : '保存失败，请重试。' };
            }
        }
    };
})();
export { OpsManagement };
