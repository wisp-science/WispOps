export interface Credential { name: string; username: string; note: string; agent: boolean; hasSecret: boolean }
export interface CredentialRef { ref: string; name: string; username?: string; provider: string; status: string }
/** Mirrors src/collectors/probe.ts HostProbe; the panel only reads it. */
export interface HostProbe { at: string; os?: string; kernel?: string; arch?: string; hostname?: string; cores?: number; user?: string; privilege?: string; gpus?: number; scheduler?: string; docker?: string; systemd?: boolean }
export interface Host {
  name: string; ssh?: string; user?: string; port?: number; description?: string; groups: string[]; identityFile?: string;
  /** Added in the panel; YAML and WispTerm hosts are edited where they are defined. */
  editable: boolean;
  auth?: 'key' | 'password'; loginSecret?: string; sudoSecret?: string;
  credentials: { login: CredentialRef | null; sudo: CredentialRef | null }; tasks: string[];
  policy: Record<string, string>; inheritedPolicy: Record<string, string>; policyOverride?: Record<string, string>; probe: HostProbe | null;
}
export interface QuietHours { start: string; end: string; timeZone?: string }
export interface Task {
  notify?: string[]; notifyOnlyProblems?: boolean; notifyOnChange?: boolean; quietHours?: QuietHours;
  name: string; template?: string; targets: string; hosts: string[]; playbook: string; instruction?: string; description?: string;
  paths?: string[]; days?: number; hours?: number; commands?: string[]; sudo?: boolean; editable: boolean;
  schedule?: { daily?: string; weekdays?: number[]; cron?: string; everyMinutes?: number; timeZone?: string };
  scheduled: { id: string; sessionId: string; scheduledAt: string }[];
  /** Latest recorded run, the slot it should have covered, and whether that slot was skipped. */
  lastRun?: string; dueAt?: string; missed?: boolean;
}
export type TaskDefinition = Omit<Task, 'hosts' | 'editable' | 'scheduled' | 'lastRun' | 'dueAt' | 'missed'>
export interface TaskDraft {
  task: TaskDefinition
  evidence: { host: string; summary: string; probeAt?: string; inspectionAt?: string }[]
  warnings: string[]
}
export interface Snapshot {
  notificationChannels?: string[];
  revision: string; vault: { revision: string; entries: Credential[] }; hosts: Host[]; tasks: Task[];
  templates: { revision: string; entries: (import('../src/task-template-content').TaskTemplate & { builtin: boolean; uses: number })[]; drafts: TemplateDraft[] };
  timeZone: string; schedulerAvailable: boolean; warnings: string[];
}
/** A template the agent submitted with ops_template_draft, waiting for the owner to review and save. */
export interface TemplateDraft { id: string; createdAt: string; template: import('../src/task-template-content').TaskTemplate }
export type Api = (request: Record<string, unknown>) => Promise<any>
export interface SessionList { ids: string[]; byId: Record<string, { displayTitle: string; parentId?: string; retainedBy?: { mainView?: number } }> }
export interface PageProps { api: Api; sidebar?: boolean; defaultSessionId?: string; useSessions?: (selector: (state: SessionList) => SessionList) => SessionList }
/** Mirrors src/overview.ts; the panel only reads these shapes. */
export type OverviewState = 'ok' | 'warn' | 'crit' | 'unreachable'
export interface OverviewRow { at: string; state: OverviewState; diskPct: Record<string, number>; memAvailPct?: number; load1?: number; cpuPct?: number; findings: { severity: 'warn' | 'crit'; code: string; message: string }[] }
export interface OverviewHost { name: string; groups: string[]; rows: OverviewRow[]; latest: OverviewState | 'never' }
export interface Overview { generatedAt: string; limit: number; hosts: OverviewHost[]; summary: Record<OverviewState | 'never', number> }
/** One audit entry as the `auditLog` action returns it (mirrors src/store.ts AuditEntry, command truncated). */
export interface AuditRow { at: string; session?: string; tool: string; host: string; risk: string; sudo: boolean; authorization: string; command: string; reason?: string; status: string; exitCode: number | null; durationMs: number }
export interface AuditLog { rows: AuditRow[]; limit: number; sinceHours: number; retentionMonths: number }
/** A `Host` alias found in ssh_config by the `sshConfigHosts` action. */
export interface SshConfigCandidate { alias: string; name: string; target: string; source: string; existing: boolean }
export interface ProbeResult { host: string; status: string; probe?: HostProbe; error: string }
