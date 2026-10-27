/**
 * Read host aliases out of OpenSSH client configuration so they can be added to
 * the inventory in one step. Only literal `Host` entries are offered; wildcard
 * patterns and `Match` blocks are skipped. Imported hosts connect through their
 * alias, so the keys, jump hosts and options in ssh_config keep applying.
 * @module dsh-wisp-ops/ssh-config
 */
import type { HostSpec } from './config.ts';
export declare const DEFAULT_SSH_CONFIG = "~/.ssh/config";
export interface SshConfigHost {
    alias: string;
    hostName?: string;
    user?: string;
    port?: number;
    identityFile?: string;
    proxyJump?: string;
    /** File the alias was read from. */
    source: string;
}
/** Parse one file. The first block naming an alias wins, as in OpenSSH. */
export declare function parseSshConfig(text: string, source?: string): {
    hosts: SshConfigHost[];
    includes: string[];
};
/** Read a configuration and the files it includes (relative paths resolve against the main file's directory). */
export declare function loadSshConfigHosts(path?: string): Promise<{
    path: string;
    hosts: SshConfigHost[];
}>;
/** An inventory name for an alias; OpenSSH allows characters the inventory does not, and `all` is a selector. */
export declare function inventoryNameFor(alias: string): string;
/** Human-readable destination for the panel. */
export declare function describeSshConfigHost(host: SshConfigHost): string;
/**
 * The inventory entry for an alias. It connects through the alias itself, so ProxyJump,
 * IdentityFile and every other option stay in ssh_config; only display details are copied.
 */
export declare function sshConfigHostSpec(host: SshConfigHost): HostSpec;
