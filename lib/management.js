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
import { managedStore } from "./managed.js";
import { scheduleRequest, SCHEDULE_TITLE_PREFIX } from "./tasks.js";
import { listVault, wisptermConfigDir } from "./wispterm.js";
import { draftTask } from "./task-draft.js";
import { builtinTemplates, templateStore, validateTemplate } from "./task-library.js";
import { renderTemplate } from "./task-template-content.js";
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
export class OpsManager {
    service;
    vault;
    scheduler;
    state;
    library;
    pending = Promise.resolve();
    constructor(service, vault, scheduler) {
        this.service = service;
        this.vault = vault;
        this.scheduler = scheduler;
        this.state = managedStore(service.config.dataDir);
        this.library = templateStore(service.config.dataDir);
    }
    /** Serialize writes spanning credentials, bindings, and scheduler membership. */
    dispatch(value) {
        const next = this.pending.then(() => this.handle(object(value)));
        this.pending = next.catch(() => { });
        return next;
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
            return { message: '已保存到任务库。可稍后关联服务器，已有例行任务不会改变。' };
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
            if (!PLAYBOOKS.includes(request.playbook))
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
            const refs = [...this.service.inventory.hosts.values()].filter(h => [h.loginSecret, h.sudoSecret].some(ref => ref === `local:${name}` || (this.service.config.secrets.provider === 'local' && ref === name)));
            if (refs.length)
                throw new Error(`凭据仍被 ${refs.map(h => h.name).join('、')} 使用，请先解除关联。`);
            await this.vault.remove(name, string(request, 'revision'));
            return { message: '凭据已删除。' };
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
        if (action === 'addHost') {
            const input = object(request.host);
            const allowed = ['name', 'ssh', 'user', 'port', 'description', 'groups', 'identityFile', 'proxyJump'];
            const host = Config({ hosts: [Object.fromEntries(allowed.filter(k => input[k] !== undefined).map(k => [k, input[k]]))] }).hosts[0];
            if (host.name === 'all' || this.service.inventory.hosts.has(host.name))
                throw new Error('服务器名称已存在或为保留名称。');
            if (host.port !== undefined && host.port < 1)
                throw new Error('端口必须为 1–65535。');
            await this.update(string(request, 'revision'), state => { state.hosts.push(host); });
            return { message: '服务器已添加，可在详情中关联密码库。' };
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
                const instruction = renderTemplate(template, object(request.templateValues ?? {}));
                if (input.instruction !== undefined && typeof input.instruction !== 'string')
                    throw new Error('报告要求格式不正确。');
                // Copy the trusted definition. Template changes never modify an existing task.
                input = { ...template.definition, ...Object.fromEntries(['name', 'description', 'targets', 'schedule', 'sudo', 'paths', 'days', 'hours'].filter(k => input[k] !== undefined).map(k => [k, input[k]])),
                    template: template.id, instruction: instruction + (input.instruction ? `\n补充要求：${input.instruction}` : '') };
            }
            else if (request.edit !== true) {
                delete input.template;
            }
            const task = Task(input);
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
            if ((await this.scheduleRecords()).some(r => r.title === titleOf(task.name) && r.status === 'active'))
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
            if ((await this.scheduleRecords()).some(r => r.title === titleOf(name) && r.status === 'active'))
                throw new Error('请先停用此任务的所有调度。');
            await this.update(string(request, 'revision'), state => { state.tasks = state.tasks.filter(t => t.name !== name); });
            return { message: '任务已删除。' };
        }
        if (action === 'scheduleTask') {
            const scheduler = this.scheduler();
            if (!scheduler)
                throw new Error('当前运行环境没有 DSH 调度服务，任务已保存，可用 /ops-run 手动运行。');
            const name = string(request, 'name'), sessionId = string(request, 'sessionId');
            if (typeof request.enabled !== 'boolean')
                throw new Error('调度状态无效。');
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
            const record = await scheduler.create(sessionId, scheduleRequest(task, this.service.config));
            return { message: `调度已启用，下次运行：${record.scheduledAt}` };
        }
        throw new Error('未知的管理操作。');
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
        const tasks = [...this.service.inventory.tasks.values()].map(t => ({ ...t, hosts: this.service.inventory.select(t.targets).map(h => h.name), editable: state.value.tasks.some(m => m.name === t.name), scheduled: scheduled.filter(r => r.title === titleOf(t.name) && r.status === 'active') }));
        const reference = (ref) => {
            if (!ref)
                return null;
            const local = ref.startsWith('local:') || this.service.config.secrets.provider === 'local';
            const entry = local ? vault.entries.find(e => e.name === ref.replace(/^local:/, '')) : external.find(e => e.name.toLowerCase() === ref.toLowerCase());
            return { ref, name: ref.replace(/^local:/, ''), provider: local ? 'local' : this.service.config.secrets.provider, status: !entry ? 'missing' : !entry.agent ? 'disabled' : entry.hasSecret ? 'ready' : 'empty' };
        };
        const probes = await this.service.store.probes();
        const hosts = [...this.service.inventory.hosts.values()].map(h => ({ ...h, credentials: { login: reference(h.loginSecret), sudo: reference(h.sudoSecret) }, tasks: tasks.filter(t => t.hosts.includes(h.name)).map(t => t.name), probe: probes[h.name] ?? null }));
        const templates = { revision: library.revision, entries: [...builtinTemplates(this.service.config), ...library.value.entries].map(t => ({ ...t, builtin: t.id.startsWith('builtin.'), uses: tasks.filter(task => task.template === t.id).length })) };
        return { revision: state.revision, vault, hosts, tasks, templates, timeZone: this.service.config.timeZone, schedulerAvailable: this.scheduler() !== undefined, warnings };
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
            this.manager = new OpsManager(options.service, options.vault, () => ctx.get('schedule'));
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
