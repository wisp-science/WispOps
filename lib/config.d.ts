/**
 * Plugin configuration: inventory, permission policy, transport, and
 * inspection thresholds. Every deployment-varying value lives here so that
 * cordis.yml can change it without a code edit.
 * @module dsh-wisp-ops/config
 */
import z from '@deepseek-ai/schemastery';
/** How a capability is handled for a host: run, ask the human, or refuse. */
export type Permission = 'allow' | 'ask' | 'deny';
/** Capabilities a remote action may require. `read` is always allowed. */
export type Capability = 'change' | 'sudo' | 'destructive';
export declare const CAPABILITIES: readonly Capability[];
/** Partial per-capability permission table. */
export type PolicySpec = Partial<Record<Capability, Permission>>;
/** One managed host. */
export interface HostSpec {
    /** Stable name used by tools and commands. */
    name: string;
    /** OpenSSH destination: an ssh_config alias or `user@host`; defaults to `name`. */
    ssh?: string;
    port?: number;
    user?: string;
    /** Group memberships. */
    groups?: string[];
    /** Free-form labels, selectable as `tag:key=value`. */
    tags?: Record<string, string>;
    description?: string;
    /** Per-host overrides; win over every group and the default policy. */
    policy?: PolicySpec;
    /** Run sudo as this user instead of root. */
    sudoUser?: string;
    /** `ssh -J`; otherwise put ProxyJump in ~/.ssh/config. */
    proxyJump?: string;
    /** `ssh -i` with IdentitiesOnly=yes. */
    identityFile?: string;
    /** `key` (default) uses BatchMode; `password` logs in with the password of `loginSecret`. */
    auth?: 'key' | 'password';
    /** Password Store entry holding the login password (auth: password). */
    loginSecret?: string;
    /** Password Store entry holding the sudo password; without one sudo runs `sudo -n`. */
    sudoSecret?: string;
}
/** Built-in read-only analyses a task can run. */
export type Playbook = 'inspect' | 'disk' | 'space' | 'new-files' | 'security' | 'custom' | 'script';
export declare const PLAYBOOKS: readonly Playbook[];
/**
 * Who writes the report after a run. `always` is a DSH schedule that wakes the agent every
 * time; `problems` and `never` run inside WispOps on its own timer, record and notify
 * without the model, and `problems` queues the agent only when a run found something.
 */
export type ReportMode = 'always' | 'problems' | 'never';
export declare const REPORT_MODES: readonly ReportMode[];
/** When a task runs; one of daily, weekly (daily + weekdays), cron, or everyMinutes. */
export interface TaskSchedule {
    /** Local time `HH:MM`; with `weekdays` it runs weekly. */
    daily?: string;
    /** ISO weekdays, Monday 1 … Sunday 7. */
    weekdays?: number[];
    /** Five-field cron expression. */
    cron?: string;
    everyMinutes?: number;
    /** IANA zone; defaults to the plugin's `timeZone`. */
    timeZone?: string;
}
/** Local wall-clock window during which a task's external notifications are not sent. */
export interface QuietHours {
    /** `HH:MM`; a window that crosses midnight (22:00 → 07:00) is allowed. */
    start: string;
    end: string;
    /** IANA zone; defaults to the schedule's zone, then the plugin's `timeZone`. */
    timeZone?: string;
}
/** A recurring job for some servers, e.g. a morning report. */
export interface TaskSpec {
    name: string;
    /** Human-configured channel names; credentials never enter task records. */
    notify?: string[];
    notifyOnlyProblems?: boolean;
    /** Deliver only when the problem counts differ from the previous run (first run always delivers). */
    notifyOnChange?: boolean;
    quietHours?: QuietHours;
    /** Origin template; execution uses the saved copy, never a live template. */
    template?: string;
    description?: string;
    /** Host selector. */
    targets: string;
    playbook: Playbook;
    /** What the report should cover, in the user's words; required for `custom`. */
    instruction?: string;
    schedule?: TaskSchedule;
    /** Roots for `new-files`, `disk` and `space`. */
    paths?: string[];
    /** Window for `new-files`, in days. */
    days?: number;
    /** Window for `security`, in hours. */
    hours?: number;
    /**
     * Read-only shell commands the task runs on every target after its collector,
     * so a `custom` task delivers evidence without the model gathering it. Each
     * command must classify as read-only at load time; anything else is rejected.
     */
    commands?: string[];
    /** Check script from the owner-reviewed script library; required by the `script` playbook. */
    script?: string;
    /** Default `always`: the agent writes a report after every run. */
    report?: ReportMode;
    /**
     * Run the built-in collector as root. Writing this in the human-managed
     * inventory pre-authorizes sudo for this task's read-only collector, so an
     * unattended morning run does not stop at an approval prompt. A host policy
     * `sudo: deny` still wins.
     */
    sudo?: boolean;
}
export interface GroupSpec {
    description?: string;
    policy?: PolicySpec;
}
export interface SshSpec {
    /** OpenSSH client executable. */
    binary: string;
    connectTimeoutSec: number;
    /** Reuse one master connection per host for this many seconds; 0 disables multiplexing. */
    controlPersistSec: number;
    /** Extra `ssh` arguments, inserted before the destination. */
    extraArgs: string[];
    /** Parallel hosts per fleet operation. */
    concurrency: number;
    /** Source /etc/profile and ~/.profile (output discarded) so non-login sessions find site tools. */
    loadProfile: boolean;
    /** Directories appended to the remote PATH, for tools such as nvidia-smi or sinfo outside it. */
    extraPath: string[];
    /** After an authentication or host-key failure, refuse new logins to that host for this long (avoids IP bans). */
    authFailureBlockMinutes: number;
}
export interface SecretsSpec {
    /** Where sudo and login passwords come from. */
    provider: 'none' | 'local' | 'wispterm';
    /** WispTerm config directory; defaults to the platform location. */
    wisptermDir?: string;
    /** Add WispTerm SSH profiles to the inventory (group `wispterm`); their stored plaintext passwords are never read. */
    importWisptermHosts: boolean;
}
export interface LimitsSpec {
    defaultTimeoutMs: number;
    maxTimeoutMs: number;
    /** Captured bytes per stream per host; the remainder is dropped and reported. */
    maxOutputBytes: number;
    /** Largest fleet one call may address. */
    maxTargets: number;
}
export interface ChangeSpec {
    /** Directory on each host where ops_change keeps `wispops-change.*` backups. */
    backupRoot: string;
    /** Backups older than this many days are pruned at the start of the next ops_change on that host; 0 keeps them. */
    backupRetentionDays: number;
}
export interface GrantsSpec {
    defaultTtlMinutes: number;
    maxTtlMinutes: number;
    /** Whether `/ops-allow destructive` is accepted at all. */
    allowDestructive: boolean;
}
export interface BashGuardSpec {
    /** Tool names treated as local shells. */
    tools: string[];
    /** `sudo`/`su`/`doas` in a local shell call. */
    sudo: Permission;
    /** `ssh`/`scp`/`rsync` to an inventory host from a local shell call, bypassing this plugin's policy. */
    inventorySsh: Permission;
}
export interface ThresholdsSpec {
    diskWarnPct: number;
    diskCritPct: number;
    inodeWarnPct: number;
    inodeCritPct: number;
    memAvailWarnPct: number;
    memAvailCritPct: number;
    swapWarnPct: number;
    loadPerCoreWarn: number;
    loadPerCoreCrit: number;
    gpuTempWarnC: number;
    zombieWarn: number;
    /** Disk growth since the previous inspection that is reported, in percentage points. */
    diskGrowthWarnPts: number;
    /** SSH login slower than this is a warning; 0 disables the check. */
    loginWarnMs: number;
    /** TCP retransmit share during the inspection sample that is a warning; 0 disables the check. */
    tcpRetransWarnPct: number;
}
export interface ProtectSpec {
    /** File-writing tools and the argument holding their path; writes to the inventory file or data directory are refused. */
    fileTools: Record<string, string>;
}
export interface RetentionSpec {
    /** Inspection records kept per host in `dataDir/inspections`; older ones are dropped when a new one is written. */
    inspectionRecords: number;
    /** Monthly audit partitions kept, counting the current month; 0 keeps every month. */
    auditMonths: number;
}
export interface Config {
    hosts: HostSpec[];
    groups: Record<string, GroupSpec>;
    tasks: TaskSpec[];
    notifications: Record<string, NotificationChannel>;
    /** Default IANA zone for task schedules. */
    timeZone: string;
    /** Keep the agent from editing the human-managed inventory and state. */
    protect: ProtectSpec;
    /**
     * YAML or JSON file with `hosts` and `groups`, merged after the inline
     * inventory and reloaded when it changes. A missing file is an empty inventory.
     */
    inventoryFile?: string;
    /** OpenSSH client configuration the panel offers to import hosts from. */
    sshConfigFile: string;
    /** Policy for capabilities no host or group sets. */
    defaultPolicy: Record<Capability, Permission>;
    /** Regular expressions that are refused on every host, regardless of approval or grants. */
    denyPatterns: string[];
    /** Programs a deployment trusts as read-only in addition to the built-in list. */
    extraReadPrograms: string[];
    ssh: SshSpec;
    secrets: SecretsSpec;
    limits: LimitsSpec;
    change: ChangeSpec;
    grants: GrantsSpec;
    bashGuard: BashGuardSpec;
    thresholds: ThresholdsSpec;
    retention: RetentionSpec;
    /** Inspection history, disk snapshots, and the audit log. */
    dataDir: string;
}
export interface NotificationChannel {
    kind: 'wecom' | 'dingtalk' | 'feishu' | 'webhook';
    /** Environment variable holding the HTTPS endpoint, including its token. */
    urlEnv: string;
    /** Optional DingTalk/Feishu signing secret, or generic webhook bearer token. */
    secretEnv?: string;
}
/** Upper bound on `commands` per task, so one task cannot turn into a fleet-wide batch job. */
export declare const MAX_TASK_COMMANDS = 20;
export declare const Task: z<TaskSpec>;
export declare const Config: z<Config>;
/** Resolve a config through its schema, filling every default. */
export declare function resolveConfig(input?: Partial<Config>): Config;
