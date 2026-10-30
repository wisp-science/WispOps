import { join } from 'node:path'
import { CAPABILITIES, Config, resolveConfig } from './config.ts'
import type { HostSpec, PolicySpec, TaskSpec, ThresholdsSpec } from './config.ts'
import { LocalState } from './local-state.ts'
import { validateMutes } from './mutes.ts'
import type { Mute } from './mutes.ts'
import { validateChecks } from './service-checks.ts'
import type { ServiceCheck } from './service-checks.ts'

export interface CredentialBinding { auth: 'key' | 'password'; loginSecret?: string; sudoSecret?: string }
/** Per-host permission overrides set in the panel; they apply to same-named YAML or WispTerm hosts too. */
export interface ManagedState {
  version: 1; hosts: HostSpec[]; bindings: Record<string, CredentialBinding>; tasks: TaskSpec[]; policies: Record<string, PolicySpec>
  /** Owner-excluded inventory names; external source files are never changed. */
  excludedHosts: string[]
  /** Per-host service checks, threshold overrides and muted findings set in the panel; absent in older files. */
  checks: Record<string, ServiceCheck[]>
  thresholds: Record<string, Partial<ThresholdsSpec>>
  mutes: Record<string, Mute[]>
}

export function managedStore(dataDir: string): LocalState<ManagedState> {
  return new LocalState(join(dataDir, 'managed.json'), () => ({ version: 1, hosts: [], bindings: {}, tasks: [], policies: {}, excludedHosts: [], checks: {}, thresholds: {}, mutes: {} }), validateManaged)
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
  const policies: Record<string, PolicySpec> = {}
  // Older files have no policies; an absent map means no overrides.
  if (raw.policies !== undefined) {
    if (!raw.policies || typeof raw.policies !== 'object' || Array.isArray(raw.policies)) throw new Error('Invalid policy overrides')
    for (const [name, policy] of Object.entries(raw.policies)) {
      Object.defineProperty(policies, name, { value: validatePolicy(policy), enumerable: true, writable: true, configurable: true })
    }
  }
  // Absent in older files and sync snapshots. Reject malformed exclusions instead of re-enabling hosts.
  const excludedHosts = raw.excludedHosts === undefined ? [] : raw.excludedHosts
  if (!Array.isArray(excludedHosts) || excludedHosts.some(name => typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name))) throw new Error('Invalid excluded hosts')
  return {
    version: 1, hosts: parsed.hosts, tasks: parsed.tasks, bindings, policies, excludedHosts: [...new Set(excludedHosts)],
    checks: perHost(raw.checks, 'service checks', validateChecks),
    thresholds: perHost(raw.thresholds, 'threshold overrides', validateThresholds),
    mutes: perHost(raw.mutes, 'mutes', validateMutes),
  }
}

/** A per-host map from an optional field, each value validated; empty values are dropped. */
function perHost<T>(value: unknown, what: string, validate: (value: unknown) => T): Record<string, T> {
  const out: Record<string, T> = {}
  if (value === undefined) return out
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${what}`)
  for (const [name, entry] of Object.entries(value)) {
    const valid = validate(entry)
    if (Array.isArray(valid) ? valid.length > 0 : Object.keys(valid as object).length > 0) Object.defineProperty(out, name, { value: valid, enumerable: true, writable: true, configurable: true })
  }
  return out
}

/** A partial threshold table: only known keys, each a finite number of at least zero. */
export function validateThresholds(value: unknown): Partial<ThresholdsSpec> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid thresholds')
  const known = resolveConfig().thresholds
  const out: Partial<ThresholdsSpec> = {}
  for (const [key, number] of Object.entries(value)) {
    if (!Object.hasOwn(known, key)) throw new Error(`Unknown threshold "${key}"`)
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) throw new Error(`Invalid value for ${key}`)
    out[key as keyof ThresholdsSpec] = number
  }
  return out
}

/** A partial capability table with only allow / ask / deny values and no unknown keys. */
export function validatePolicy(value: unknown): PolicySpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid policy')
  const policy: PolicySpec = {}
  for (const [key, permission] of Object.entries(value)) {
    if (!(CAPABILITIES as readonly string[]).includes(key)) throw new Error(`Unknown capability "${key}"`)
    if (permission !== 'allow' && permission !== 'ask' && permission !== 'deny') throw new Error(`Invalid permission for ${key}`)
    policy[key as keyof PolicySpec] = permission
  }
  return policy
}
