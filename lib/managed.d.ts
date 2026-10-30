import type { HostSpec, PolicySpec, TaskSpec, ThresholdsSpec } from './config.ts';
import { LocalState } from './local-state.ts';
import type { Mute } from './mutes.ts';
import type { ServiceCheck } from './service-checks.ts';
export interface CredentialBinding {
    auth: 'key' | 'password';
    loginSecret?: string;
    sudoSecret?: string;
}
/** Per-host permission overrides set in the panel; they apply to same-named YAML or WispTerm hosts too. */
export interface ManagedState {
    version: 1;
    hosts: HostSpec[];
    bindings: Record<string, CredentialBinding>;
    tasks: TaskSpec[];
    policies: Record<string, PolicySpec>;
    /** Owner-excluded inventory names; external source files are never changed. */
    excludedHosts: string[];
    /** Per-host service checks, threshold overrides and muted findings set in the panel; absent in older files. */
    checks: Record<string, ServiceCheck[]>;
    thresholds: Record<string, Partial<ThresholdsSpec>>;
    mutes: Record<string, Mute[]>;
}
export declare function managedStore(dataDir: string): LocalState<ManagedState>;
export declare function validateManaged(value: unknown): ManagedState;
/** A partial threshold table: only known keys, each a finite number of at least zero. */
export declare function validateThresholds(value: unknown): Partial<ThresholdsSpec>;
/** A partial capability table with only allow / ask / deny values and no unknown keys. */
export declare function validatePolicy(value: unknown): PolicySpec;
