/**
 * Read-only interoperation with WispTerm's Password Store and SSH profiles,
 * so operators keep one vault and one host list.
 *
 * Password Store: `<config>/passwords` is a JSON array of
 * `{name, username, secret, note, agent}`; `secret` is
 * base64(nonce[24] ‖ ciphertext ‖ tag[16]) under XChaCha20-Poly1305 with empty
 * AAD. The 32-byte key is held by the OS: macOS login Keychain (service
 * "WispTerm Password Store", account "vault-key"), Windows DPAPI user scope in
 * `<config>/passwords.key` with entropy "WispTerm Password Store", elsewhere
 * a raw 0600 `<config>/passwords.key`. This module never writes the store and
 * never creates a key: two writers could mint different keys.
 *
 * SSH profiles: `<config>/ssh_hosts`, one tab-separated line per profile with
 * every field uppercase-hex encoded. Its password field is not encrypted by
 * WispTerm, so this module never decodes it.
 * @module dsh-wisp-ops/wispterm
 */
import type { HostSpec } from './config.ts';
import type { Host } from './inventory.ts';
import type { SecretProvider } from './secrets.ts';
export declare const KEYCHAIN_SERVICE = "WispTerm Password Store";
export declare const KEYCHAIN_ACCOUNT = "vault-key";
/** WispTerm's config directory for this platform. */
export declare function wisptermConfigDir(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): string;
/** A vault entry without its secret. */
export interface VaultEntry {
    readonly name: string;
    readonly username: string;
    readonly note: string;
    readonly agent: boolean;
    readonly hasSecret: boolean;
}
/** List entries (names, usernames, notes, agent flag) without decrypting anything. */
export declare function listVault(dir: string): Promise<VaultEntry[]>;
/** Open one sealed secret with the vault key. */
export declare function openSecret(sealed: string, key: Uint8Array): string;
/** Decode the key `security -w` printed: hex for binary items, otherwise the raw bytes. */
export declare function decodeKeychainOutput(stdout: Buffer): Uint8Array;
/** Read the vault key the way WispTerm stores it on this platform. */
export declare function readVaultKey(dir: string, platform?: NodeJS.Platform): Promise<Uint8Array>;
/**
 * Passwords from the WispTerm Password Store, by the entry named in a host's
 * `sudoSecret` or `loginSecret`. Entries marked "not for agents" are refused. The key
 * is cached for the plugin lifetime so the Keychain asks once.
 */
export declare class WispTermSecrets implements SecretProvider {
    readonly dir: string;
    private readonly readKey;
    private key;
    constructor(dir: string, readKey?: (dir: string) => Promise<Uint8Array>);
    sudoPassword(host: Host): Promise<string | undefined>;
    loginPassword(host: Host): Promise<string | undefined>;
    private open;
    dispose(): void;
}
/**
 * Import WispTerm SSH profiles as inventory hosts in group `wispterm`.
 * Field order: name, host, user, password (never decoded), port, proxy_jump,
 * auth_method, identity_file.
 */
export declare function parseSshHosts(text: string): HostSpec[];
export declare function loadWispTermHosts(dir: string): Promise<HostSpec[]>;
