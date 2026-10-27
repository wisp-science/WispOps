import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'

describe('Config', () => {
  it('fills defaults', () => {
    const config = resolveConfig({})
    expect(config.defaultPolicy).toEqual({ change: 'ask', sudo: 'ask', destructive: 'ask' })
    expect(config.ssh.binary).toBe('ssh')
    expect(config.thresholds.diskCritPct).toBe(90)
    expect(config.grants.allowDestructive).toBe(false)
    expect(config.bashGuard.inventorySsh).toBe('deny')
  })

  it('accepts a host inventory', () => {
    const config = resolveConfig({
      hosts: [{ name: 'gpu-01', ssh: 'alice@10.0.0.5', groups: ['gpu'], policy: { sudo: 'allow' } }],
      groups: { gpu: { policy: { destructive: 'deny' } } },
    })
    expect(config.hosts[0]?.policy?.sudo).toBe('allow')
  })

  it('rejects option-injecting destinations and bad permissions', () => {
    expect(() => resolveConfig({ hosts: [{ name: 'x', ssh: '-oProxyCommand=evil' }] })).toThrow()
    expect(() => resolveConfig({ hosts: [{ name: 'x', policy: { sudo: 'yes' as never } }] })).toThrow()
  })
})
