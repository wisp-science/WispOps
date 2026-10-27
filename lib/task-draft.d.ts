/** Build editable task drafts from observed capabilities and inspection history. */
import type { Config, Playbook, TaskSpec } from './config.ts';
import type { HostProbe } from './collectors/probe.ts';
import type { Host } from './inventory.ts';
import type { HistoryRecord } from './store.ts';
export interface DraftEvidence {
    host: string;
    summary: string;
    probeAt?: string;
    inspectionAt?: string;
}
export interface TaskDraft {
    task: TaskSpec;
    evidence: DraftEvidence[];
    warnings: string[];
}
export interface HostObservation {
    host: Host;
    probe?: HostProbe;
    history?: HistoryRecord;
}
export declare function draftTask(observations: HostObservation[], playbook: Playbook, config: Pick<Config, 'thresholds' | 'timeZone'>, existingNames: ReadonlySet<string>, now?: number): TaskDraft;
