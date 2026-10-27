import type { HostSpec, TaskSpec } from './config.ts';
import { LocalState } from './local-state.ts';
export interface CredentialBinding {
    auth: 'key' | 'password';
    loginSecret?: string;
    sudoSecret?: string;
}
export interface ManagedState {
    version: 1;
    hosts: HostSpec[];
    bindings: Record<string, CredentialBinding>;
    tasks: TaskSpec[];
}
export declare function managedStore(dataDir: string): LocalState<ManagedState>;
export declare function validateManaged(value: unknown): ManagedState;
