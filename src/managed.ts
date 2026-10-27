import { join } from 'node:path'
import { Config } from './config.ts'
import type { HostSpec, TaskSpec } from './config.ts'
import { LocalState } from './local-state.ts'

export interface CredentialBinding { auth: 'key' | 'password'; loginSecret?: string; sudoSecret?: string }
export interface ManagedState { version: 1; hosts: HostSpec[]; bindings: Record<string, CredentialBinding>; tasks: TaskSpec[] }

export function managedStore(dataDir: string): LocalState<ManagedState> {
  return new LocalState(join(dataDir, 'managed.json'), () => ({ version: 1, hosts: [], bindings: {}, tasks: [] }), validateManaged)
}
export function validateManaged(value: unknown): ManagedState {
  const raw = value as ManagedState
  if (raw?.version !== 1 || !Array.isArray(raw.hosts) || !Array.isArray(raw.tasks) || !raw.bindings || typeof raw.bindings !== 'object' || Array.isArray(raw.bindings)) throw new Error('Invalid WispOps management file')
  const parsed = Config({ hosts: raw.hosts, tasks: raw.tasks } as Config)
  const bindings: Record<string, CredentialBinding> = {}
  for (const [name, binding] of Object.entries(raw.bindings)) {
    if (binding?.auth !== 'key' && binding?.auth !== 'password') throw new Error('Invalid credential binding')
    for (const key of ['loginSecret', 'sudoSecret'] as const) if (binding[key] !== undefined && typeof binding[key] !== 'string') throw new Error('Invalid credential reference')
    Object.defineProperty(bindings, name, { value: { auth: binding.auth, loginSecret: binding.loginSecret, sudoSecret: binding.sudoSecret }, enumerable: true, writable: true, configurable: true })
  }
  return { version: 1, hosts: parsed.hosts, tasks: parsed.tasks, bindings }
}
