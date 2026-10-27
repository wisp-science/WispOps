/**
 * Security triage (网络攻击排查), read-only: SSH brute force and successful
 * logins by source, connection floods, listening services, crypto-miner and
 * deleted-binary processes, processes running from world-writable places,
 * outbound connections to common mining/C2 ports, and recently changed
 * persistence points (authorized_keys, cron, systemd units, extra UID 0).
 * Root (sudo) sees the auth log and every process; without it the report
 * says what it could not read.
 * @module dsh-wisp-ops/collectors/security
 */
import type { Finding } from './inspect.ts';
export interface SecurityOptions {
    /** Look-back window for logins and changed files, in hours. */
    readonly hours: number;
}
export declare const MINER_NAMES: RegExp;
export declare const SUSPICIOUS_PORTS: number[];
export declare function securityScript(o: SecurityOptions): string;
export interface SecurityReport {
    readonly authLogReadable: boolean;
    readonly fullVisibility: boolean;
    readonly failedBySource: {
        source: string;
        count: number;
    }[];
    readonly accepted: {
        method: string;
        user: string;
        source: string;
        count: number;
    }[];
    readonly currentSessions: string[];
    readonly listening: {
        proto: string;
        local: string;
        process: string;
    }[];
    readonly establishedBySource: {
        source: string;
        count: number;
    }[];
    readonly synRecv: number;
    readonly suspiciousOutbound: {
        local: string;
        remote: string;
    }[];
    readonly miners: {
        pid: number;
        user: string;
        cpuPct: number;
        command: string;
    }[];
    readonly badExecutables: {
        pid: number;
        comm: string;
        exe: string;
        replaced: boolean;
    }[];
    readonly extraUid0: string[];
    readonly changedKeys: {
        path: string;
        owner: string;
        modified: string;
    }[];
    readonly changedCron: {
        path: string;
        owner: string;
        modified: string;
    }[];
    readonly changedUnits: {
        path: string;
        owner: string;
        modified: string;
    }[];
    readonly sshd: Record<string, string>;
    readonly fail2ban: string[];
    readonly findings: Finding[];
}
export declare function parseSecurity(output: string, o: SecurityOptions): SecurityReport;
export declare function renderSecurity(host: string, r: SecurityReport, hours: number): string;
