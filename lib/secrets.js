/**
 * Password sources for sudo and password logins. A provider returns a
 * password only to the SSH runner, which hands it to sudo or ssh-askpass;
 * nothing returned here ever reaches a tool argument, a tool result, the
 * audit log, or the model.
 * @module dsh-wisp-ops/secrets
 */
/** No stored passwords: sudo runs non-interactively and password hosts cannot log in. */
export const noSecrets = {
    sudoPassword: () => Promise.resolve(undefined),
    loginPassword: () => Promise.resolve(undefined),
};
