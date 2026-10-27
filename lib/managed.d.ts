import type { HostSpec, PolicySpec, TaskSpec } from './config.ts';
import { LocalState } from './local-state.ts';
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
}
export declare function managedStore(dataDir: string): LocalState<ManagedState>;
export declare function validateManaged(value: unknown): ManagedState;
/** A partial capability table with only allow / ask / deny values and no unknown keys. */
export declare function validatePolicy(value: unknown): PolicySpec;
