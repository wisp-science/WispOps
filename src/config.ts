/**
 * Plugin configuration: inventory, permission policy, transport, and
 * inspection thresholds. Every deployment-varying value lives here so that
 * cordis.yml can change it without a code edit.
 * @module dsh-wisp-ops/config
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'

/** How a capability is handled for a host: run, ask the human, or refuse. */
export type Permission = 'allow' | 'ask' | 'deny'

/** Capabilities a remote action may require. `read` is always allowed. */
export type Capability = 'change' | 'sudo' | 'destructive'

export const CAPABILITIES: readonly Capability[] = ['change', 'sudo', 'destructive']

/** Partial per-capability permission table. */
export type PolicySpec = Partial<Record<Capability, Permission>>

/** One managed host. */
export interface HostSpec {
  /** Stable name used by tools and commands. */
  name: string
  /** OpenSSH destination: an ssh_config alias or `user@host`; defaults to `name`. */
  ssh?: string
  port?: number
  user?: string
  /** Group memberships. */
  groups?: string[]
  /** Free-form labels, selectable as `tag:key=value`. */
  tags?: Record<string, string>
  description?: string
  /** Per-host overrides; win over every group and the default policy. */
  policy?: PolicySpec
  /** Run sudo as this user instead of root. */
  sudoUser?: string
  /** `ssh -J`; otherwise put ProxyJump in ~/.ssh/config. */
  proxyJump?: string
  /** `ssh -i` with IdentitiesOnly=yes. */
  identityFile?: string
  /** `key` (default) uses BatchMode; `password` logs in with the password of `loginSecret`. */
  auth?: 'key' | 'password'
  /** Password Store entry holding the login password (auth: password). */
  loginSecret?: string
  /** Password Store entry holding the sudo password; without one sudo runs `sudo -n`. */
  sudoSecret?: string
}

/** Built-in read-only analyses a task can run. */
export type Playbook = 'inspect' | 'disk' | 'space' | 'new-files' | 'security' | 'custom' | 'script'

export const PLAYBOOKS: readonly Playbook[] = ['inspect', 'disk', 'space', 'new-files', 'security', 'custom', 'script']
/**
 * Who writes the report after a run. `always` is a DSH schedule that wakes the agent every
 * time; `problems` and `never` run inside WispOps on its own timer, record and notify
 * without the model, and `problems` queues the agent only when a run found something.
 */
export type ReportMode = 'always' | 'problems' | 'never'
export const REPORT_MODES: readonly ReportMode[] = ['always', 'problems', 'never']

/** When a task runs; one of daily, weekly (daily + weekdays), cron, or everyMinutes. */
export interface TaskSchedule {
  /** Local time `HH:MM`; with `weekdays` it runs weekly. */
  daily?: string
  /** ISO weekdays, Monday 1 … Sunday 7. */
  weekdays?: number[]
  /** Five-field cron expression. */
  cron?: string
  everyMinutes?: number
  /** IANA zone; defaults to the plugin's `timeZone`. */
  timeZone?: string
}

/** Local wall-clock window during which a task's external notifications are not sent. */
export interface QuietHours {
  /** `HH:MM`; a window that crosses midnight (22:00 → 07:00) is allowed. */
  start: string
  end: string
  /** IANA zone; defaults to the schedule's zone, then the plugin's `timeZone`. */
  timeZone?: string
}

/** A recurring job for some servers, e.g. a morning report. */
export interface TaskSpec {
  name: string
  /** Human-configured channel names; credentials never enter task records. */
  notify?: string[]
  notifyOnlyProblems?: boolean
  /** Deliver only when the problem counts differ from the previous run (first run always delivers). */
  notifyOnChange?: boolean
  quietHours?: QuietHours
  /** Origin template; execution uses the saved copy, never a live template. */
  template?: string
  description?: string
  /** Host selector. */
  targets: string
  playbook: Playbook
  /** What the report should cover, in the user's words; required for `custom`. */
  instruction?: string
  schedule?: TaskSchedule
  /** Roots for `new-files`, `disk` and `space`. */
  paths?: string[]
  /** Window for `new-files`, in days. */
  days?: number
  /** Window for `security`, in hours. */
  hours?: number
  /**
   * Read-only shell commands the task runs on every target after its collector,
   * so a `custom` task delivers evidence without the model gathering it. Each
   * command must classify as read-only at load time; anything else is rejected.
   */
  commands?: string[]
  /** Check script from the owner-reviewed script library; required by the `script` playbook. */
  script?: string
  /** Default `always`: the agent writes a report after every run. */
  report?: ReportMode
  /**
   * Run the built-in collector as root. Writing this in the human-managed
   * inventory pre-authorizes sudo for this task's read-only collector, so an
   * unattended morning run does not stop at an approval prompt. A host policy
   * `sudo: deny` still wins.
   */
  sudo?: boolean
}

export interface GroupSpec {
  description?: string
  policy?: PolicySpec
}

export interface SshSpec {
  /** OpenSSH client executable. */
  binary: string
  connectTimeoutSec: number
  /** Reuse one master connection per host for this many seconds; 0 disables multiplexing. */
  controlPersistSec: number
  /** Extra `ssh` arguments, inserted before the destination. */
  extraArgs: string[]
  /** Parallel hosts per fleet operation. */
  concurrency: number
  /** Source /etc/profile and ~/.profile (output discarded) so non-login sessions find site tools. */
  loadProfile: boolean
  /** Directories appended to the remote PATH, for tools such as nvidia-smi or sinfo outside it. */
  extraPath: string[]
  /** After an authentication or host-key failure, refuse new logins to that host for this long (avoids IP bans). */
  authFailureBlockMinutes: number
}

export interface SecretsSpec {
  /** Where sudo and login passwords come from. */
  provider: 'none' | 'local' | 'wispterm'
  /** WispTerm config directory; defaults to the platform location. */
  wisptermDir?: string
  /** Add WispTerm SSH profiles to the inventory (group `wispterm`); their stored plaintext passwords are never read. */
  importWisptermHosts: boolean
}

export interface LimitsSpec {
  defaultTimeoutMs: number
  maxTimeoutMs: number
  /** Captured bytes per stream per host; the remainder is dropped and reported. */
  maxOutputBytes: number
  /** Largest fleet one call may address. */
  maxTargets: number
}

export interface ChangeSpec {
  /** Directory on each host where ops_change keeps `wispops-change.*` backups. */
  backupRoot: string
  /** Backups older than this many days are pruned at the start of the next ops_change on that host; 0 keeps them. */
  backupRetentionDays: number
}

export interface GrantsSpec {
  defaultTtlMinutes: number
  maxTtlMinutes: number
  /** Whether `/ops-allow destructive` is accepted at all. */
  allowDestructive: boolean
}

export interface BashGuardSpec {
  /** Tool names treated as local shells. */
  tools: string[]
  /** `sudo`/`su`/`doas` in a local shell call. */
  sudo: Permission
  /** `ssh`/`scp`/`rsync` to an inventory host from a local shell call, bypassing this plugin's policy. */
  inventorySsh: Permission
}

export interface ThresholdsSpec {
  diskWarnPct: number
  diskCritPct: number
  inodeWarnPct: number
  inodeCritPct: number
  memAvailWarnPct: number
  memAvailCritPct: number
  swapWarnPct: number
  loadPerCoreWarn: number
  loadPerCoreCrit: number
  gpuTempWarnC: number
  zombieWarn: number
  /** Disk growth since the previous inspection that is reported, in percentage points. */
  diskGrowthWarnPts: number
  /** SSH login slower than this is a warning; 0 disables the check. */
  loginWarnMs: number
  /** TCP retransmit share during the inspection sample that is a warning; 0 disables the check. */
  tcpRetransWarnPct: number
}

export interface ProtectSpec {
  /** File-writing tools and the argument holding their path; writes to the inventory file or data directory are refused. */
  fileTools: Record<string, string>
}

export interface RetentionSpec {
  /** Inspection records kept per host in `dataDir/inspections`; older ones are dropped when a new one is written. */
  inspectionRecords: number
  /** Monthly audit partitions kept, counting the current month; 0 keeps every month. */
  auditMonths: number
}

export interface Config {
  hosts: HostSpec[]
  groups: Record<string, GroupSpec>
  tasks: TaskSpec[]
  notifications: Record<string, NotificationChannel>
  /** Default IANA zone for task schedules. */
  timeZone: string
  /** Keep the agent from editing the human-managed inventory and state. */
  protect: ProtectSpec
  /**
   * YAML or JSON file with `hosts` and `groups`, merged after the inline
   * inventory and reloaded when it changes. A missing file is an empty inventory.
   */
  inventoryFile?: string
  /** OpenSSH client configuration the panel offers to import hosts from. */
  sshConfigFile: string
  /** Policy for capabilities no host or group sets. */
  defaultPolicy: Record<Capability, Permission>
  /** Regular expressions that are refused on every host, regardless of approval or grants. */
  denyPatterns: string[]
  /** Programs a deployment trusts as read-only in addition to the built-in list. */
  extraReadPrograms: string[]
  ssh: SshSpec
  secrets: SecretsSpec
  limits: LimitsSpec
  change: ChangeSpec
  grants: GrantsSpec
  bashGuard: BashGuardSpec
  thresholds: ThresholdsSpec
  retention: RetentionSpec
  /** Inspection history, disk snapshots, and the audit log. */
  dataDir: string
}

export interface NotificationChannel {
  kind: 'wecom' | 'dingtalk' | 'feishu' | 'webhook'
  /** Environment variable holding the HTTPS endpoint, including its token. */
  urlEnv: string
  /** Optional DingTalk/Feishu signing secret, or generic webhook bearer token. */
  secretEnv?: string
}

const DEFAULT_EXTRA_PATH = ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/sbin', '/usr/local/cuda/bin', '/opt/slurm/bin', '/usr/lpp/mmfs/bin']

function defaultSsh(): SshSpec {
  return {
    binary: 'ssh',
    connectTimeoutSec: 10,
    controlPersistSec: process.platform === 'win32' ? 0 : 60,
    extraArgs: [],
    concurrency: 8,
    loadProfile: true,
    extraPath: DEFAULT_EXTRA_PATH,
    authFailureBlockMinutes: 15,
  }
}

const permission = z.union(['allow', 'ask', 'deny'] as const)
const policy: z<PolicySpec> = z.object({
  change: permission,
  sudo: permission,
  destructive: permission,
})

const host: z<HostSpec> = z.object({
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
  auth: z.union(['key', 'password'] as const),
  loginSecret: z.string(),
  sudoSecret: z.string(),
})

const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const HHMM = /^(?:[01]\d|2[0-3]):[0-5]\d$/
/** Upper bound on `commands` per task, so one task cannot turn into a fleet-wide batch job. */
export const MAX_TASK_COMMANDS = 20

export const Task: z<TaskSpec> = z.object({
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
  playbook: z.union(['inspect', 'disk', 'space', 'new-files', 'security', 'custom', 'script'] as const).required(),
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
  report: z.union(['always', 'problems', 'never'] as const),
  sudo: z.boolean(),
})

const group: z<GroupSpec> = z.object({
  description: z.string(),
  policy,
})

export const Config: z<Config> = z.object({
  hosts: z.array(host).default([]),
  groups: z.dict(group).default({}),
  tasks: z.array(Task).default([]),
  notifications: z.dict(z.object({
    kind: z.union(['wecom', 'dingtalk', 'feishu', 'webhook'] as const).required(),
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
    String.raw`\brm\s+(?:-\S+\s+)*(?:--no-preserve-root\b|/\*?(?:\s|$))`,
    String.raw`:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:`,
    String.raw`\bchmod\s+(?:-\S+\s+)*[0-7]*777\s+/(?:\s|$)`,
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
    provider: z.union(['none', 'local', 'wispterm'] as const).default('local'),
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
    loginWarnMs: z.natural().default(3000),
    tcpRetransWarnPct: z.number().default(5),
  }).default(defaultThresholds()),
  retention: z.object({
    inspectionRecords: z.natural().min(10).default(1000),
    auditMonths: z.natural().default(12),
  }).default({ inspectionRecords: 1000, auditMonths: 12 }),
  dataDir: z.string().default(join(homedir(), '.dsh-wisp-ops')),
})

function defaultThresholds(): ThresholdsSpec {
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
    loginWarnMs: 3000,
    tcpRetransWarnPct: 5,
  }
}

/** Resolve a config through its schema, filling every default. */
export function resolveConfig(input: Partial<Config> = {}): Config {
  return Config(input as Config)
}
