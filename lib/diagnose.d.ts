export interface SshTarget {
    readonly hostname: string;
    readonly port: number;
    /** First ProxyJump hop as `host[:port]`, when the connection goes through one. */
    readonly proxyJump?: string;
    readonly proxyCommand?: boolean;
}
export type DiagnosisStepName = 'dns' | 'tcp' | 'banner';
export interface DiagnosisStep {
    readonly step: DiagnosisStepName;
    readonly ok: boolean;
    readonly ms?: number;
    readonly detail: string;
}
export interface Diagnosis {
    readonly host: string;
    /** What this machine actually connects to: the server, or the first jump host. */
    readonly target: string;
    readonly port: number;
    readonly via?: 'proxy-jump' | 'proxy-command';
    readonly steps: DiagnosisStep[];
    /** The first failing step, `proxy-command` when nothing can be tested directly, or `ok`. */
    readonly verdict: 'ok' | DiagnosisStepName | 'proxy-command';
}
/** The destination fields of `ssh -G` output. */
export declare function parseSshG(output: string, fallback: {
    hostname: string;
    port?: number;
}): SshTarget;
/** Diagnose the path to one resolved target. */
export declare function diagnoseTarget(host: string, target: SshTarget, options: {
    timeoutMs: number;
}): Promise<Diagnosis>;
