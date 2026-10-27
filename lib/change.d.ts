import type { RiskAssessment } from './risk.ts';
export interface ChangePlan {
    host: string;
    files: string[];
    command: string;
    verify: string;
    afterRollback?: string;
    reason: string;
    sudo?: boolean;
    timeoutMs?: number;
}
export declare function validateChange(value: unknown): ChangePlan;
export declare function changeCommands(p: ChangePlan): string[];
export declare function changeRisk(p: ChangePlan, extraRead: ReadonlySet<string>): RiskAssessment;
export declare function describeChange(p: ChangePlan): string;
/** One remote transaction: no second SSH connection is needed to start rollback. */
export declare function changeScript(p: ChangePlan, seconds: number, backupRoot?: string): string;
