import { join } from 'node:path';
import { CAPABILITIES, Config } from "./config.js";
import { LocalState } from "./local-state.js";
export function managedStore(dataDir) {
    return new LocalState(join(dataDir, 'managed.json'), () => ({ version: 1, hosts: [], bindings: {}, tasks: [], policies: {} }), validateManaged);
}
export function validateManaged(value) {
    const raw = value;
    if (raw?.version !== 1 || !Array.isArray(raw.hosts) || !Array.isArray(raw.tasks) || !raw.bindings || typeof raw.bindings !== 'object' || Array.isArray(raw.bindings))
        throw new Error('Invalid WispOps management file');
    const parsed = Config({ hosts: raw.hosts, tasks: raw.tasks });
    const bindings = {};
    for (const [name, binding] of Object.entries(raw.bindings)) {
        if (binding?.auth !== 'key' && binding?.auth !== 'password')
            throw new Error('Invalid credential binding');
        for (const key of ['loginSecret', 'sudoSecret'])
            if (binding[key] !== undefined && typeof binding[key] !== 'string')
                throw new Error('Invalid credential reference');
        Object.defineProperty(bindings, name, { value: { auth: binding.auth, loginSecret: binding.loginSecret, sudoSecret: binding.sudoSecret }, enumerable: true, writable: true, configurable: true });
    }
    const policies = {};
    // Older files have no policies; an absent map means no overrides.
    if (raw.policies !== undefined) {
        if (!raw.policies || typeof raw.policies !== 'object' || Array.isArray(raw.policies))
            throw new Error('Invalid policy overrides');
        for (const [name, policy] of Object.entries(raw.policies)) {
            Object.defineProperty(policies, name, { value: validatePolicy(policy), enumerable: true, writable: true, configurable: true });
        }
    }
    return { version: 1, hosts: parsed.hosts, tasks: parsed.tasks, bindings, policies };
}
/** A partial capability table with only allow / ask / deny values and no unknown keys. */
export function validatePolicy(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid policy');
    const policy = {};
    for (const [key, permission] of Object.entries(value)) {
        if (!CAPABILITIES.includes(key))
            throw new Error(`Unknown capability "${key}"`);
        if (permission !== 'allow' && permission !== 'ask' && permission !== 'deny')
            throw new Error(`Invalid permission for ${key}`);
        policy[key] = permission;
    }
    return policy;
}
