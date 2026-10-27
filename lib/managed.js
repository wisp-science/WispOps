import { join } from 'node:path';
import { Config } from "./config.js";
import { LocalState } from "./local-state.js";
export function managedStore(dataDir) {
    return new LocalState(join(dataDir, 'managed.json'), () => ({ version: 1, hosts: [], bindings: {}, tasks: [] }), value => {
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
        return { version: 1, hosts: parsed.hosts, tasks: parsed.tasks, bindings };
    });
}
