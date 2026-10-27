/**
 * Password sources for sudo and password logins. A provider returns a
 * password only to the SSH runner, which hands it to sudo or ssh-askpass;
 * nothing returned here ever reaches a tool argument, a tool result, the
 * audit log, or the model.
 * @module dsh-wisp-ops/secrets
 */

import type { Host } from './inventory.ts'

export interface SecretProvider {
  /**
   * The sudo password for one host, or undefined to run `sudo -n` (NOPASSWD
   * rules or no password configured).
   */
  sudoPassword(host: Host, signal?: AbortSignal): Promise<string | undefined>
  /** The login password of a host with `auth: password`. */
  loginPassword(host: Host, signal?: AbortSignal): Promise<string | undefined>
}

/** No stored passwords: sudo runs non-interactively and password hosts cannot log in. */
export const noSecrets: SecretProvider = {
  sudoPassword: () => Promise.resolve(undefined),
  loginPassword: () => Promise.resolve(undefined),
}
