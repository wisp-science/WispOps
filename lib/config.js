/**
 * Plugin configuration: inventory, permission policy, transport, and
 * inspection thresholds. Every deployment-varying value lives here so that
 * cordis.yml can change it without a code edit.
 * @module dsh-wisp-ops/config
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import z from '@deepseek-ai/schemastery';
export const CAPABILITIES = ['change', 'sudo', 'destructive'];
export const PLAYBOOKS = ['inspect', 'disk', 'space', 'new-files', 'security', 'custom', 'script'];
export const REPORT_MODES = ['always', 'problems', 'never'];
const DEFAULT_EXTRA_PATH = ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/sbin', '/usr/local/cuda/bin', '/opt/slurm/bin', '/usr/lpp/mmfs/bin'];
function defaultSsh() {
    return {
        binary: 'ssh',
        connectTimeoutSec: 10,
        controlPersistSec: process.platform === 'win32' ? 0 : 60,
        extraArgs: [],
        concurrency: 8,
        loadProfile: true,
        extraPath: DEFAULT_EXTRA_PATH,
        authFailureBlockMinutes: 15,
    };
}
const permission = z.union(['allow', 'ask', 'deny']);
const policy = z.object({
    change: permission,
    sudo: permission,
    destructive: permission,
});
const host = z.object({
    name: z.string().pattern(/^[A-Za-z0-9][A-Za-z0-9._-]*$/).required(),
    ssh: z.string().pattern(/^[^-\s][^\s]*$/),
    port: z.natural().max(65535),
    user: z.string().pattern(/^[^-\s][^\s]*$/),
    groups: z.array(z.string().pattern(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)),
    tags: z.dict(z.string()),
    description: z.string(),
    policy,
    sudoUser: z.string().pattern(/^[A-Za-z0-9_][A-Za-z0-9._-]*$/),
    proxyJump: z.string().pattern(/^[^-\s][^\s]*$/),
    identityFile: z.string(),
    auth: z.union(['key', 'password']),
    loginSecret: z.string(),
    sudoSecret: z.string(),
});
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const HHMM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
/** Upper bound on `commands` per task, so one task cannot turn into a fleet-wide batch job. */
export const MAX_TASK_COMMANDS = 20;
export const Task = z.object({
    name: z.string().pattern(NAME).required(),
    notify: z.array(z.string().pattern(NAME)),
    notifyOnlyProblems: z.boolean(),
    notifyOnChange: z.boolean(),
    quietHours: z.object({
        start: z.string().pattern(HHMM),
        end: z.string().pattern(HHMM),
        timeZone: z.string(),
    }),
    template: z.string().pattern(NAME),
    description: z.string(),
    targets: z.string().required(),
    playbook: z.union(['inspect', 'disk', 'space', 'new-files', 'security', 'custom', 'script']).required(),
    instruction: z.string(),
    schedule: z.object({
        daily: z.string().pattern(HHMM),
        weekdays: z.array(z.natural().min(1).max(7)),
        cron: z.string().pattern(/^\S+(?:\s+\S+){4}$/),
        everyMinutes: z.natural().min(1),
        timeZone: z.string(),
    }),
    paths: z.array(z.string().pattern(/^\//)),
    days: z.natural().min(1),
    hours: z.natural().min(1),
    commands: z.array(z.string().max(2000)).max(MAX_TASK_COMMANDS),
    script: z.string().pattern(NAME),
    report: z.union(['always', 'problems', 'never']),
    sudo: z.boolean(),
});
const group = z.object({
    description: z.string(),
    policy,
});
export const Config = z.object({
    hosts: z.array(host).default([]),
    groups: z.dict(group).default({}),
    tasks: z.array(Task).default([]),
    notifications: z.dict(z.object({
        kind: z.union(['wecom', 'dingtalk', 'feishu', 'webhook']).required(),
        urlEnv: z.string().pattern(/^[A-Za-z_][A-Za-z0-9_]*$/).required(),
        secretEnv: z.string().pattern(/^[A-Za-z_][A-Za-z0-9_]*$/),
    })).default({}),
    timeZone: z.string().default(Intl.DateTimeFormat().resolvedOptions().timeZone),
    protect: z.object({
        fileTools: z.dict(z.string()).default({ write: 'file_path', edit: 'file_path', str_replace_editor: 'path' }),
    }).default({ fileTools: { write: 'file_path', edit: 'file_path', str_replace_editor: 'path' } }),
    inventoryFile: z.string().default('~/.dsh-wisp-ops/inventory.yml'),
    sshConfigFile: z.string().default('~/.ssh/config'),
    defaultPolicy: z.object({
        change: permission.default('ask'),
        sudo: permission.default('ask'),
        destructive: permission.default('ask'),
    }).default({ change: 'ask', sudo: 'ask', destructive: 'ask' }),
    denyPatterns: z.array(z.string()).default([
        String.raw `\brm\s+(?:-\S+\s+)*(?:--no-preserve-root\b|/\*?(?:\s|$))`,
        String.raw `:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:`,
        String.raw `\bchmod\s+(?:-\S+\s+)*[0-7]*777\s+/(?:\s|$)`,
    ]),
    extraReadPrograms: z.array(z.string()).default([]),
    ssh: z.object({
        binary: z.string().default('ssh'),
        connectTimeoutSec: z.natural().min(1).default(10),
        // Win32-OpenSSH has no ControlMaster.
        controlPersistSec: z.natural().default(process.platform === 'win32' ? 0 : 60),
        extraArgs: z.array(z.string()).default([]),
        concurrency: z.natural().min(1).default(8),
        loadProfile: z.boolean().default(true),
        extraPath: z.array(z.string().pattern(/^\/[^:\s'"]*$/)).default(DEFAULT_EXTRA_PATH),
        authFailureBlockMinutes: z.natural().default(15),
    }).default(defaultSsh()),
    secrets: z.object({
        provider: z.union(['none', 'local', 'wispterm']).default('local'),
        wisptermDir: z.string(),
        importWisptermHosts: z.boolean().default(false),
    }).default({ provider: 'local', importWisptermHosts: false }),
    limits: z.object({
        defaultTimeoutMs: z.natural().min(1000).default(60_000),
        maxTimeoutMs: z.natural().min(1000).default(30 * 60_000),
        maxOutputBytes: z.natural().min(1024).default(64 * 1024),
        maxTargets: z.natural().min(1).default(64),
    }).default({ defaultTimeoutMs: 60_000, maxTimeoutMs: 30 * 60_000, maxOutputBytes: 64 * 1024, maxTargets: 64 }),
    change: z.object({
        backupRoot: z.string().pattern(/^\/[^\0\r\n]*[^\/\0\r\n]$/).default('/var/tmp'),
        backupRetentionDays: z.natural().default(14),
    }).default({ backupRoot: '/var/tmp', backupRetentionDays: 14 }),
    grants: z.object({
        defaultTtlMinutes: z.natural().min(1).default(30),
        maxTtlMinutes: z.natural().min(1).default(8 * 60),
        allowDestructive: z.boolean().default(false),
    }).default({ defaultTtlMinutes: 30, maxTtlMinutes: 8 * 60, allowDestructive: false }),
    bashGuard: z.object({
        tools: z.array(z.string()).default(['bash']),
        sudo: permission.default('ask'),
        inventorySsh: permission.default('deny'),
    }).default({ tools: ['bash'], sudo: 'ask', inventorySsh: 'deny' }),
    thresholds: z.object({
        diskWarnPct: z.number().default(80),
        diskCritPct: z.number().default(90),
        inodeWarnPct: z.number().default(80),
        inodeCritPct: z.number().default(90),
        memAvailWarnPct: z.number().default(10),
        memAvailCritPct: z.number().default(5),
        swapWarnPct: z.number().default(50),
        loadPerCoreWarn: z.number().default(1.5),
        loadPerCoreCrit: z.number().default(3),
        gpuTempWarnC: z.number().default(85),
        zombieWarn: z.natural().default(10),
        diskGrowthWarnPts: z.number().default(5),
        diskFullForecastDays: z.number().default(7),
        loginWarnMs: z.natural().default(3000),
        tcpRetransWarnPct: z.number().default(5),
        sshFailWarnPerHour: z.natural().default(100),
    }).default(defaultThresholds()),
    retention: z.object({
        inspectionRecords: z.natural().min(10).default(1000),
        auditMonths: z.natural().default(12),
    }).default({ inspectionRecords: 1000, auditMonths: 12 }),
    dataDir: z.string().default(join(homedir(), '.dsh-wisp-ops')),
});
function defaultThresholds() {
    return {
        diskWarnPct: 80,
        diskCritPct: 90,
        inodeWarnPct: 80,
        inodeCritPct: 90,
        memAvailWarnPct: 10,
        memAvailCritPct: 5,
        swapWarnPct: 50,
        loadPerCoreWarn: 1.5,
        loadPerCoreCrit: 3,
        gpuTempWarnC: 85,
        zombieWarn: 10,
        diskGrowthWarnPts: 5,
        diskFullForecastDays: 7,
        loginWarnMs: 3000,
        tcpRetransWarnPct: 5,
        sshFailWarnPerHour: 100,
    };
}
/** Resolve a config through its schema, filling every default. */
export function resolveConfig(input = {}) {
    return Config(input);
}
