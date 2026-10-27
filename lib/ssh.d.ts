/**
 * Remote execution through the system OpenSSH client.
 *
 * Using the user's own `ssh` keeps ~/.ssh/config, agents, jump hosts,
 * certificates, and known_hosts exactly as the operator configured them.
 * Scripts travel on stdin to `sh -s`, so no remote quoting is involved and
 * fish/csh login shells work. Key hosts use `BatchMode=yes` so any prompt
 * fails instead of hanging; password hosts answer exactly one prompt through
 * a one-shot askpass (OpenSSH ≥ 8.4). Repeated authentication failures block
 * a host for a while, because retried logins look like brute force and get
 * operators' addresses banned.
 * @module dsh-wisp-ops/ssh
 */
import type { SshSpec } from './config.ts';
import type { Host } from './inventory.ts';
export type RunStatus = 'ok' | 'failed' | 'unreachable' | 'auth-failed' | 'blocked' | 'sudo-required' | 'timeout' | 'cancelled';
export interface RunResult {
    readonly host: string;
    readonly status: RunStatus;
    /** Remote exit status, or null when the command never reported one. */
    readonly exitCode: number | null;
    readonly stdout: string;
    readonly stderr: string;
    readonly truncated: boolean;
    readonly durationMs: number;
}
export interface RunRequest {
    readonly host: Host;
    readonly script: string;
    readonly sudo: boolean;
    /**
     * Password for sudo, supplied by a secret provider and never by the model.
     * It travels as the first stdin line, is consumed by `read` in the remote
     * wrapper, and is redacted from captured output.
     */
    readonly sudoPassword?: string;
    /** Login password for `auth: password` hosts, answered through askpass. */
    readonly loginPassword?: string;
    readonly timeoutMs: number;
    readonly signal?: AbortSignal;
    /** Per-stream capture limit for built-in collectors whose output is bounded by construction. */
    readonly maxOutputBytes?: number;
}
/** Exit status the password wrapper uses when sudo rejects the password. */
export declare const SUDO_REJECTED_EXIT = 97;
/** Single-quote a value for POSIX sh. */
export declare function shellQuote(value: string): string;
/** Classify a finished ssh process. */
export declare function classifyExit(code: number | null, stderr: string, sudo: boolean, withPassword?: boolean): RunStatus;
/**
 * Windows OpenSSH reports system errors such as "No such host is known" in the
 * ANSI code page (GBK on Chinese Windows), which has no runtime API in Node;
 * guess it from the user locale. Undefined elsewhere: POSIX ssh speaks UTF-8.
 */
export declare function legacyDecoder(platform?: NodeJS.Platform, locale?: string): TextDecoder | undefined;
/**
 * Decode ssh stderr line by line, so the remote's UTF-8 survives next to
 * local messages in the legacy code page. OpenSSH also writes non-ASCII bytes
 * of its own messages as `\NNN` octal escapes; those runs are decoded too.
 */
export declare function decodeStderr(bytes: Buffer, legacy: TextDecoder | undefined): string;
/**
 * Remote command that validates sudo with a password read from stdin, then
 * runs the rest of stdin through the cached credential. Both sudo calls keep
 * the same parent shell: replacing it with exec changes the ppid timestamp
 * scope on sessions without a tty and loses the successful authentication.
 * The password reaches only the `read` builtin and sudo's own stdin: if sudo needs no
 * password (NOPASSWD or a cached timestamp) the piped line is discarded by
 * sudo, so it can never be executed as a script line.
 */
export declare function passwordSudoCommand(sudoUser: string | undefined): string;
/**
 * Script prelude: extend PATH with site directories and, optionally, adopt
 * the PATH a login shell would have. Profiles are sourced in a subshell with
 * output discarded, so a profile that prints, exits, or execs another shell
 * cannot break the session.
 */
export declare function prelude(spec: Pick<SshSpec, 'loadProfile' | 'extraPath'>): string;
/** Per-host login backoff after authentication failures. */
export declare class AuthGuard {
    private readonly blockMs;
    private readonly now;
    private readonly blocked;
    constructor(blockMs: number, now?: () => number);
    check(host: string): string | undefined;
    record(host: string, stderr: string): void;
    clear(host: string | 'all'): string[];
    list(): {
        host: string;
        until: string;
    }[];
}
export declare class SshRunner {
    private readonly spec;
    private readonly maxOutputBytes;
    private readonly controlDir;
    private readonly legacy;
    readonly guard: AuthGuard;
    constructor(spec: SshSpec, maxOutputBytes: number, dataDir: string);
    /** Resolve ssh_config aliases locally, without opening a connection or decrypting a login password. */
    loginUser(host: Host, signal?: AbortSignal): Promise<string>;
    /** The argv for one host; the destination always follows `--`, so it cannot be parsed as an option. */
    argv(host: Host, sudo: boolean, withPassword?: boolean): string[];
    run(request: RunRequest): Promise<RunResult>;
    private spawnOnce;
    /** Run one request per host with bounded parallelism, preserving host order. */
    runMany(hosts: readonly Host[], build: (host: Host) => RunRequest | Promise<RunRequest>): Promise<RunResult[]>;
}
