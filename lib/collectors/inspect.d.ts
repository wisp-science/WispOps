/**
 * Fleet inspection (巡检): one read-only round trip per host collects
 * load, CPU, memory, disks, inodes, failed units, top processes, GPUs,
 * Slurm state, kernel errors, OOM kills and network traffic; the runner
 * adds the login latency. Thresholds turn them into findings, and the
 * previous inspection supplies growth trends.
 * @module dsh-wisp-ops/collectors/inspect
 */
import type { ThresholdsSpec } from '../config.ts';
import type { FsUsage, InodeUsage } from './sections.ts';
export declare const INSPECT_SCRIPT: string;
export type Severity = 'crit' | 'warn' | 'info';
export interface Finding {
    readonly severity: Severity;
    readonly code: string;
    readonly message: string;
}
export interface ProcessSample {
    readonly pid: number;
    readonly user: string;
    readonly cpuPct: number;
    readonly memPct: number;
    readonly elapsedSec: number;
    readonly command: string;
}
export interface GpuSample {
    readonly index: number;
    readonly name: string;
    readonly utilPct?: number;
    readonly memUsedMb?: number;
    readonly memTotalMb?: number;
    readonly tempC?: number;
    readonly processes: {
        readonly pid: number;
        readonly memMb?: number;
        readonly name: string;
    }[];
}
export interface SlurmState {
    readonly nodeStates: Record<string, number>;
    readonly problemNodes: {
        readonly node: string;
        readonly state: string;
        readonly reason: string;
    }[];
    readonly jobs: Record<string, number>;
}
/** Traffic over the one-second sample; rates are bytes per second. */
export interface NetworkSample {
    /** Totals over interfaces backed by a device, or every interface but `lo` when none is. */
    readonly rxBps: number;
    readonly txBps: number;
    readonly interfaces: {
        readonly name: string;
        readonly rxBps: number;
        readonly txBps: number;
    }[];
    readonly tcpEstablished?: number;
    /** Retransmitted share of TCP segments sent during the sample; absent when too few were sent to tell. */
    readonly tcpRetransPct?: number;
}
export interface HostInspection {
    /** Milliseconds from starting ssh until the remote shell answered, measured locally. */
    readonly loginMs?: number;
    readonly hostname?: string;
    readonly os?: string;
    readonly kernel?: string;
    readonly cores?: number;
    readonly uptimeSec?: number;
    readonly load?: {
        readonly m1: number;
        readonly m5: number;
        readonly m15: number;
        readonly perCore?: number;
    };
    readonly cpuPct?: number;
    readonly mem?: {
        readonly totalKb: number;
        readonly availKb: number;
        readonly availPct: number;
        readonly swapTotalKb: number;
        readonly swapUsedPct: number;
    };
    readonly disks: FsUsage[];
    readonly inodes: InodeUsage[];
    readonly failedUnits: string[];
    readonly topCpu: ProcessSample[];
    readonly topMem: ProcessSample[];
    readonly gpus: GpuSample[];
    readonly slurm?: SlurmState;
    readonly zombies?: number;
    readonly oom24h?: number;
    readonly kernelErrors24h?: number;
    readonly kernelErrorSamples: string[];
    readonly rebootRequired?: boolean;
    readonly ntpSynced?: boolean;
    readonly net?: NetworkSample;
}
/** Compact metrics kept per inspection for trends. */
export interface InspectionMetrics {
    readonly at: string;
    readonly diskPct: Record<string, number>;
    readonly memAvailPct?: number;
    readonly load1?: number;
    readonly cpuPct?: number;
    readonly loginMs?: number;
    readonly rxBps?: number;
    readonly txBps?: number;
    readonly tcpEstablished?: number;
    readonly tcpRetransPct?: number;
}
/** Parse the inspection script's output. */
export declare function parseInspection(output: string): HostInspection;
/** Compact metrics for the trend history. */
export declare function metricsOf(report: HostInspection, at: Date): InspectionMetrics;
/** Turn an inspection into findings, comparing against the previous one when present. */
export declare function evaluate(report: HostInspection, t: ThresholdsSpec, previous?: InspectionMetrics): Finding[];
/** The most severe finding level, or `ok` when there are none above info. */
export declare function worstSeverity(findings: readonly Finding[]): Severity | 'ok';
export declare function sortFindings(findings: readonly Finding[]): Finding[];
