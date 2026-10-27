/**
 * Capability probe: what a host is (OS, cores, GPUs, scheduler, containers)
 * and what this login may do (root, passwordless sudo). The result becomes
 * planning guidance: no GPU means no GPU work, no sudo means no privileged
 * plan without a stored sudo password.
 * @module dsh-wisp-ops/collectors/probe
 */
export declare const PROBE_SCRIPT: string;
export interface HostProbe {
    readonly at: string;
    readonly os?: string;
    readonly kernel?: string;
    readonly arch?: string;
    readonly hostname?: string;
    readonly cores?: number;
    readonly user?: string;
    /** root, passwordless sudo, sudo that needs a password, or none. */
    readonly privilege: 'root' | 'sudo-nopasswd' | 'sudo-password' | 'none';
    readonly gpus: number;
    readonly scheduler: 'slurm' | 'pbs' | 'sge' | 'lsf' | 'none';
    readonly docker: 'usable' | 'no-permission' | 'absent';
    readonly systemd: boolean;
}
export declare function parseProbe(output: string, at: Date): HostProbe | undefined;
