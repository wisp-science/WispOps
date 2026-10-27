import type { Host } from './inventory.ts';
import type { SecretProvider } from './secrets.ts';
export interface Credential {
    name: string;
    username: string;
    note: string;
    agent: boolean;
}
export interface CredentialInput extends Credential {
    password?: string;
}
/** macOS Keychain, Windows DPAPI, or an owner-only key file on other systems. */
export declare function localVaultKey(dir: string, create: boolean): Promise<Uint8Array>;
export declare class LocalVault implements SecretProvider {
    readonly dir: string;
    private readonly keyProvider;
    private readonly state;
    constructor(dir: string, keyProvider?: typeof localVaultKey);
    list(): Promise<{
        revision: string;
        entries: {
            hasSecret: boolean;
            name: string;
            username: string;
            note: string;
            agent: boolean;
        }[];
    }>;
    save(input: CredentialInput, revision: string, commitAssociations?: () => Promise<void>): Promise<void>;
    remove(name: string, revision: string): Promise<void>;
    password(reference: string | undefined): Promise<string | undefined>;
    sudoPassword(host: Host): Promise<string | undefined>;
    loginPassword(host: Host): Promise<string | undefined>;
}
/** Explicit local references work even when the optional legacy provider is selected. */
export declare function routeSecrets(local: LocalVault, fallback: SecretProvider): SecretProvider;
