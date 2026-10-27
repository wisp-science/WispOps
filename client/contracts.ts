export interface Credential { name: string; username: string; note: string; agent: boolean; hasSecret: boolean }
export interface CredentialRef { ref: string; name: string; provider: string; status: string }
export interface Host {
  name: string; ssh?: string; user?: string; port?: number; description?: string; groups: string[];
  auth?: 'key' | 'password'; loginSecret?: string; sudoSecret?: string;
  credentials: { login: CredentialRef | null; sudo: CredentialRef | null }; tasks: string[];
  policy: Record<string, string>; probe: { os?: string; cores?: number; at: string } | null;
}
export interface Task {
  notify?: string[]; notifyOnlyProblems?: boolean;
  name: string; template?: string; targets: string; hosts: string[]; playbook: string; instruction?: string; description?: string;
  paths?: string[]; days?: number; hours?: number; sudo?: boolean; editable: boolean;
  schedule?: { daily?: string; weekdays?: number[]; cron?: string; everyMinutes?: number; timeZone?: string };
  scheduled: { id: string; sessionId: string; scheduledAt: string }[];
}
export type TaskDefinition = Omit<Task, 'hosts' | 'editable' | 'scheduled'>
export interface TaskDraft {
  task: TaskDefinition
  evidence: { host: string; summary: string; probeAt?: string; inspectionAt?: string }[]
  warnings: string[]
}
export interface Snapshot {
  notificationChannels?: string[];
  revision: string; vault: { revision: string; entries: Credential[] }; hosts: Host[]; tasks: Task[];
  templates: { revision: string; entries: (import('../src/task-template-content').TaskTemplate & { builtin: boolean; uses: number })[] };
  timeZone: string; schedulerAvailable: boolean; warnings: string[];
}
export type Api = (request: Record<string, unknown>) => Promise<any>
export interface SessionList { ids: string[]; byId: Record<string, { displayTitle: string; parentId?: string; retainedBy?: { mainView?: number } }> }
export interface PageProps { api: Api; sidebar?: boolean; defaultSessionId?: string; useSessions?: (selector: (state: SessionList) => SessionList) => SessionList }
