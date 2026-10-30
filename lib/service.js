/**
 * The operations core shared by tools and human commands: fleet command
 * execution, inspection, and disk diagnosis over the inventory, with every
 * remote action written to the audit log. Authorization is decided before
 * this layer (see gate.ts); this layer only executes and records.
 * @module dsh-wisp-ops/service
 */
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { diskScript, parseDisk } from "./collectors/disk.js";
import { evaluate, INSPECT_SCRIPT, metricsOf, parseInspection, sortFindings, worstSeverity } from "./collectors/inspect.js";
import { filesScript, parseFiles } from "./collectors/files.js";
import { parseSecurity, securityScript } from "./collectors/security.js";
import { parseSpace, spaceScript } from "./collectors/space.js";
import { parseProbe, PROBE_SCRIPT } from "./collectors/probe.js";
import { Inventory } from "./inventory.js";
import { GrantStore } from "./policy.js";
import { SshRunner } from "./ssh.js";
import { normalizeRoot } from "./space-tree.js";
import { OpsStore } from "./store.js";
import { STATS_ROWS } from "./trends.js";
import { muteFor } from "./mutes.js";
import { checkLine, describeCheck, withServiceChecks } from "./service-checks.js";
import { deniedByPattern } from "./gate.js";
export class OpsService {
    config;
    inventory;
    secrets;
    imported;
    runner;
    store;
    grants = new GrantStore();
    fileStamp;
    constructor(config, inventory, secrets, imported = []) {
        this.config = config;
        this.inventory = inventory;
        this.secrets = secrets;
        this.imported = imported;
        this.runner = new SshRunner(config.ssh, config.limits.maxOutputBytes, config.dataDir);
        this.store = new OpsStore(config.dataDir, config.retention);
    }
    /**
     * Reload the inventory when its file changed since the last load, so edits
     * apply without a restart. A broken edit keeps the previous inventory and
     * reports the error.
     */
    async refresh() {
        const paths = [join(this.config.dataDir, 'managed.json'), ...this.config.inventoryFile === undefined ? [] : [this.config.inventoryFile]];
        const mtime = (await Promise.all(paths.map(path => stat(path).then(s => `${s.mtimeMs}:${s.ctimeMs}:${s.size}`, error => {
            if (error.code === 'ENOENT')
                return 'missing';
            throw error;
        })))).join('|');
        if (this.fileStamp === undefined) {
            this.fileStamp = mtime;
            return;
        }
        if (mtime === this.fileStamp)
            return;
        this.inventory = await Inventory.load(this.config, this.imported);
        this.fileStamp = mtime;
    }
    /** Resolve a selector and enforce the fleet size limit. */
    select(selector) {
        if (this.inventory.hosts.size === 0) {
            throw new Error(`the inventory is empty; add hosts to ${this.config.inventoryFile ?? 'the dsh-wisp-ops `hosts` config'} (see the dsh-wisp-ops README)`);
        }
        const hosts = this.inventory.select(selector);
        if (hosts.length === 0)
            throw new Error(`selector "${selector}" matches no hosts`);
        if (hosts.length > this.config.limits.maxTargets) {
            throw new Error(`selector "${selector}" matches ${hosts.length} hosts; the limit is ${this.config.limits.maxTargets} (limits.maxTargets)`);
        }
        return hosts;
    }
    clampTimeout(timeoutMs) {
        return Math.min(Math.max(timeoutMs ?? this.config.limits.defaultTimeoutMs, 1000), this.config.limits.maxTimeoutMs);
    }
    /** Run one script on each host (or one built per host), recording every attempt. */
    async execute(hosts, script, options) {
        const scriptFor = (host) => typeof script === 'string' ? script : script(host);
        const results = await this.runner.runMany(hosts, async (host) => {
            const sudoCredential = !options.sudo ? undefined : this.secrets.sudoCredential
                ? await this.secrets.sudoCredential(host, options.signal)
                : { password: await this.secrets.sudoPassword(host, options.signal) };
            const sudoPassword = sudoCredential?.password;
            const sudoAccount = sudoCredential && 'username' in sudoCredential ? sudoCredential.username?.trim() : undefined;
            // Keep the inventory name and permission table; only the transport account changes.
            // An explicit -l overrides a user embedded in the destination and ssh_config.
            if (sudoAccount && !/^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(sudoAccount))
                throw new Error('sudo 凭据的用户名格式不正确，请在密码库中填写实际系统账号，或留空沿用 SSH 登录账号。');
            const loginAccount = sudoAccount ? await this.runner.loginUser(host, options.signal) : undefined;
            const alternateAccount = !!sudoAccount && sudoAccount !== loginAccount;
            const connectionHost = alternateAccount ? { ...host, user: sudoAccount, auth: 'password' } : host;
            const loginPassword = alternateAccount ? sudoPassword : host.auth === 'password' ? await this.secrets.loginPassword(host, options.signal) : undefined;
            return {
                host: connectionHost,
                script: scriptFor(host),
                sudo: options.sudo,
                ...sudoPassword === undefined ? {} : { sudoPassword },
                ...loginPassword === undefined ? {} : { loginPassword },
                timeoutMs: options.timeoutMs,
                ...options.signal === undefined ? {} : { signal: options.signal },
                ...options.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes },
                ...options.timeLogin === undefined ? {} : { timeLogin: options.timeLogin },
            };
        });
        const at = new Date().toISOString();
        const auditFor = (name) => {
            const host = hosts.find(h => h.name === name);
            if (typeof options.auditCommand === 'string')
                return options.auditCommand;
            if (options.auditCommand !== undefined && host !== undefined)
                return options.auditCommand(host);
            const text = host === undefined ? (typeof script === 'string' ? script : '') : scriptFor(host);
            return text.length > 4000 ? `${text.slice(0, 4000)}…` : text;
        };
        await Promise.all(results.map(result => this.store.audit({
            at,
            ...options.session === undefined ? {} : { session: options.session },
            tool: options.tool,
            host: result.host,
            risk: options.risk,
            sudo: options.sudo,
            authorization: options.authorization,
            command: auditFor(result.host),
            ...options.reason === undefined ? {} : { reason: options.reason },
            status: result.status,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
        })));
        return results;
    }
    /** Inspect a fleet, evaluate thresholds and trends, and record history. */
    async inspect(hosts, options) {
        // The deny list has the last word over owner-listed checks too, so a rule added later stops a saved check.
        const patterns = this.config.denyPatterns.map(source => new RegExp(source));
        const allowed = (host) => (host.serviceChecks ?? []).filter(check => deniedByPattern(checkLine(check), patterns) === undefined);
        const results = await this.execute(hosts, host => withServiceChecks(INSPECT_SCRIPT, allowed(host)), {
            sudo: options.sudo,
            timeoutMs: this.clampTimeout(this.config.ssh.connectTimeoutSec * 1000 + 45_000),
            tool: options.tool,
            risk: 'read',
            authorization: options.authorization,
            timeLogin: true,
            // A compact audit command still names each host's service checks, which change the script.
            ...options.auditCommand === undefined ? {} : { auditCommand: (host) => `${options.auditCommand}${allowed(host).length ? ` + service checks: ${allowed(host).map(describeCheck).join(', ')}` : ''}` },
            ...options.signal === undefined ? {} : { signal: options.signal },
            ...options.session === undefined ? {} : { session: options.session },
        });
        const now = new Date();
        const hostResults = await Promise.all(results.map(async (result) => {
            // The collector tolerates individual probe failures, so a non-zero exit with output is still usable.
            if (result.status !== 'ok' && result.status !== 'failed' || !result.stdout.includes('@@end')) {
                const error = (result.stderr.trim() || (result.status === 'ok' || result.status === 'failed'
                    ? 'connected but the inspection produced no result: a restricted shell, a forced command, or a login script that exits early'
                    : `inspection ${result.status}`)).slice(0, 500);
                await this.store.appendHistory(result.host, { at: now.toISOString(), diskPct: {}, status: result.status === 'ok' ? 'failed' : result.status, findings: [{ severity: 'crit', code: 'unreachable', message: error }] });
                return { host: result.host, status: result.status, severity: 'unreachable', findings: [{ severity: 'crit', code: result.status === 'ok' || result.status === 'failed' ? 'no-output' : result.status, message: error }], error, durationMs: result.durationMs };
            }
            const parsed = parseInspection(result.stdout);
            const report = result.firstOutputMs === undefined ? parsed : { ...parsed, loginMs: result.firstOutputMs };
            const history = (await this.store.readHistory(result.host, STATS_ROWS)).filter(r => r.status === 'ok');
            const host = hosts.find(h => h.name === result.host);
            const refused = host === undefined ? [] : (host.serviceChecks ?? []).filter(check => !allowed(host).includes(check));
            const findings = sortFindings([
                ...evaluate(report, { ...this.config.thresholds, ...host?.thresholdOverride }, history.at(-1), { history, at: now }),
                ...refused.map(check => ({ severity: 'warn', code: 'service-check-refused', message: `service check ${describeCheck(check)} was not run: the deny list refuses it`, subject: describeCheck(check) })),
            ]);
            await this.store.appendHistory(result.host, { ...metricsOf(report, now), status: 'ok', findings });
            // History keeps every finding; what the owner muted is marked for the reader and does not set the severity.
            const marked = findings.map(f => muteFor(f, host?.mutes, now.getTime()) ? { ...f, muted: true } : f);
            return { host: result.host, status: 'ok', severity: worstSeverity(marked.filter(f => !f.muted)), findings: marked, report, durationMs: result.durationMs };
        }));
        const counts = { ok: 0, info: 0, warn: 0, crit: 0, unreachable: 0 };
        for (const host of hostResults)
            counts[host.severity]++;
        return { at: now.toISOString(), hosts: hostResults, counts };
    }
    /** Diagnose one filesystem and store a snapshot for the next comparison. */
    async disk(host, options) {
        const normalized = options.path.length > 1 ? options.path.replace(/\/+$/, '') : options.path;
        const previous = await this.store.diskSnapshot(host.name, normalized);
        const [result] = await this.execute([host], diskScript(options), {
            sudo: options.sudo,
            // Two walks plus the known-directory sizes, each bounded by walkTimeoutSec.
            timeoutMs: this.clampTimeout((options.walkTimeoutSec * 3 + 30) * 1000 + this.config.ssh.connectTimeoutSec * 1000),
            tool: options.tool,
            risk: 'read',
            authorization: options.authorization,
            ...options.signal === undefined ? {} : { signal: options.signal },
            ...options.session === undefined ? {} : { session: options.session },
        });
        if (result === undefined)
            throw new Error('no result');
        if (!result.stdout.includes('@@end'))
            return { result };
        const { report, snapshot } = parseDisk(result.stdout, options, previous);
        if (snapshot !== undefined)
            await this.store.saveDiskSnapshot(host.name, snapshot);
        return { report, result };
    }
    /** Probe capabilities and remember them; key hosts never prompt, so this is safe to run fleet-wide. */
    async probe(hosts, options) {
        const results = await this.execute(hosts, PROBE_SCRIPT, {
            sudo: false,
            timeoutMs: this.clampTimeout(this.config.ssh.connectTimeoutSec * 1000 + 20_000),
            tool: options.tool,
            risk: 'read',
            authorization: 'read-only',
            ...options.signal === undefined ? {} : { signal: options.signal },
            ...options.session === undefined ? {} : { session: options.session },
        });
        const now = new Date();
        const out = results.map(result => {
            const probe = result.status === 'ok' ? parseProbe(result.stdout, now) : undefined;
            return probe === undefined
                ? { host: result.host, status: result.status, error: (result.stderr.trim() || 'connected but the probe produced no result (restricted shell or forced command?)').slice(0, 300) }
                : { host: result.host, status: result.status, probe };
        });
        const update = {};
        for (const entry of out)
            if (entry.probe !== undefined)
                update[entry.host] = entry.probe;
        if (Object.keys(update).length > 0)
            await this.store.saveProbes(update);
        return out;
    }
    /** Recent-file analysis on one host, compared with the previous scan of the same roots and window. */
    async files(host, options) {
        const key = `${options.paths.join(',')}|${options.days}`;
        const previous = (await this.store.readBounded('files', host.name)).filter(r => r.key === key).at(-1);
        const [result] = await this.execute([host], filesScript(options), {
            ...this.collector(options),
            timeoutMs: this.clampTimeout((options.walkTimeoutSec * (options.paths.length + 1) + 60) * 1000),
            maxOutputBytes: 8 * 1024 * 1024,
        });
        if (result === undefined)
            throw new Error('no result');
        if (!result.stdout.includes('@@end'))
            return { result };
        const { report, snapshot } = parseFiles(result.stdout, options, previous);
        await this.store.appendBounded('files', host.name, { ...snapshot, key }, 60);
        return { report, result };
    }
    /** Directory sizes under one path for the space map, stored with the previous scan of the same path for growth. */
    async space(host, options) {
        const path = normalizeRoot(options.path);
        const previous = (await this.store.readBounded('space', host.name)).filter(s => s.path === path).at(-1);
        const [result] = await this.execute([host], spaceScript({ ...options, path }), {
            ...this.collector(options),
            timeoutMs: this.clampTimeout((options.walkTimeoutSec + 60) * 1000 + this.config.ssh.connectTimeoutSec * 1000),
            maxOutputBytes: 2 * 1024 * 1024,
        });
        if (result === undefined)
            throw new Error('no result');
        if (!result.stdout.includes('@@end'))
            return { result };
        const report = parseSpace(result.stdout, { ...options, path });
        await this.store.appendBounded('space', host.name, { at: new Date().toISOString(), ...report }, 20);
        return { report, ...previous === undefined ? {} : { previous }, result };
    }
    /** Security triage on a set of hosts. */
    async security(hosts, hoursBack, options) {
        const results = await this.execute(hosts, securityScript({ hours: hoursBack }), {
            ...this.collector(options),
            timeoutMs: this.clampTimeout(90_000 + this.config.ssh.connectTimeoutSec * 1000),
            maxOutputBytes: 2 * 1024 * 1024,
        });
        return results.map(result => result.stdout.includes('@@end')
            ? { host: result.host, report: parseSecurity(result.stdout, { hours: hoursBack }), result }
            : { host: result.host, result });
    }
    collector(options) {
        return {
            sudo: options.sudo,
            timeoutMs: this.config.limits.defaultTimeoutMs,
            tool: options.tool,
            risk: 'read',
            authorization: options.authorization,
            ...options.signal === undefined ? {} : { signal: options.signal },
            ...options.session === undefined ? {} : { session: options.session },
        };
    }
}
