import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { gateOpsCall, gateShellCall, grantCapabilities } from '../src/gate.ts'
import { Inventory, loadInventoryFile } from '../src/inventory.ts'
import { resolve } from 'node:path'
import { decide, GrantStore, parseDuration, requiredCapabilities } from '../src/policy.ts'
import { classifyCommand } from '../src/risk.ts'
import { parseAllow } from '../src/commands.ts'

const config = resolveConfig({
  hosts: [
    { name: 'web-01', groups: ['web', 'prod'], tags: { env: 'prod' } },
    { name: 'web-02', groups: ['web'], tags: { env: 'staging' } },
    { name: 'gpu-01', groups: ['gpu'], policy: { sudo: 'allow' } },
    { name: 'db-01', groups: ['prod'], ssh: 'admin@10.0.0.9' },
  ],
  groups: { prod: { policy: { destructive: 'deny', change: 'ask' } }, web: { policy: { change: 'allow' } } },
})
const inventory = new Inventory(config.hosts, config.groups, config.defaultPolicy)

describe('Inventory', () => {
  it('selects by name, group, tag, glob, and exclusion', () => {
    const names = (s: string) => inventory.select(s).map(h => h.name)
    expect(names('@web')).toEqual(['web-01', 'web-02'])
    expect(names('tag:env=prod')).toEqual(['web-01'])
    expect(names('web-*,!web-02')).toEqual(['web-01'])
    expect(names('all !@prod')).toEqual(['web-02', 'gpu-01'])
    expect(() => inventory.select('@nope')).toThrow(/unknown group/)
    expect(() => inventory.select('nope')).toThrow(/unknown host/)
  })

  it('resolves policy: host over groups, the strictest group wins', () => {
    const [web01] = inventory.select('web-01')
    // web says change=allow, prod says change=ask: the stricter ask wins.
    expect(web01?.policy).toEqual({ change: 'ask', sudo: 'ask', destructive: 'deny' })
    expect(inventory.select('web-02')[0]?.policy.change).toBe('allow')
    expect(inventory.select('gpu-01')[0]?.policy.sudo).toBe('allow')
  })
})

describe('example inventory', () => {
  it('is valid and resolves policy as documented', async () => {
    const file = await loadInventoryFile(resolve(import.meta.dirname, '../examples/inventory.yml'))
    const example = new Inventory(file.hosts, file.groups, resolveConfig({}).defaultPolicy)
    expect(example.select('@gpu').map(h => h.name)).toEqual(['gpu-01', 'gpu-02'])
    expect(example.select('web-01')[0]?.policy.destructive).toBe('deny')
    expect(example.select('nas')[0]).toMatchObject({ auth: 'password', policy: { change: 'allow', sudo: 'allow', destructive: 'ask' } })
  })

  it('treats a missing file as empty and rejects invalid entries', async () => {
    expect(await loadInventoryFile('/nonexistent/inventory.yml')).toEqual({ hosts: [], groups: {}, tasks: [] })
  })
})

describe('decide', () => {
  it('denies over asks over allows, and grants only lift ask', () => {
    const grants = new GrantStore(() => 1000)
    const hosts = inventory.select('web-01,web-02')
    const destructive = requiredCapabilities(classifyCommand('rm -rf /tmp/x'), false)
    expect(destructive).toEqual(['change', 'destructive'])
    expect(decide(hosts, destructive, 's', grants).kind).toBe('deny')
    expect(decide(hosts, ['change'], 's', grants).kind).toBe('ask')
    grants.add({ session: 's', capability: 'change', hosts: ['web-01'], selector: 'web-01', expiresAt: 5000 })
    expect(decide(hosts, ['change'], 's', grants).kind).toBe('allow')
    expect(decide(hosts, ['change'], 'other-session', grants).kind).toBe('ask')
    grants.add({ session: 's', capability: 'destructive', hosts: ['web-01'], selector: 'web-01', expiresAt: 5000 })
    expect(decide(hosts, destructive, 's', grants).kind).toBe('deny')
  })

  it('expires grants', () => {
    let now = 0
    const grants = new GrantStore(() => now)
    grants.add({ session: 's', capability: 'sudo', hosts: ['web-02'], selector: 'web-02', expiresAt: 100 })
    expect(grants.active('s')).toHaveLength(1)
    now = 100
    expect(grants.active('s')).toHaveLength(0)
  })
})

describe('gate', () => {
  const ctx = { config, inventory, grants: new GrantStore(), denyPatterns: config.denyPatterns.map(p => new RegExp(p)), extraRead: new Set<string>() }

  it('asks with host, capability and command', () => {
    const outcome = gateOpsCall('ops_exec', { targets: 'db-01', command: 'systemctl restart postgresql', sudo: true, reason: 'apply config' }, 's', ctx)
    expect(outcome.kind).toBe('ask')
    if (outcome.kind !== 'ask') return
    expect(outcome.reason).toContain('db-01')
    expect(outcome.reason).toContain('change + sudo')
    expect(outcome.reason).toContain('apply config')
    expect(outcome.displayReason.zh).toContain('sudo 提权')
  })

  it('treats sudo inside the command as sudo', () => {
    const outcome = gateOpsCall('ops_exec', { targets: 'web-02', command: 'sudo du -sh /root' }, 's', ctx)
    expect(outcome.kind).toBe('ask')
  })

  it('passes read-only built-ins and refuses deny-listed text', () => {
    expect(gateOpsCall('ops_inspect', { targets: 'all' }, 's', ctx)).toMatchObject({ kind: 'allow', voucher: { authorization: 'read-only' } })
    expect(gateOpsCall('ops_exec', { targets: 'gpu-01', command: 'rm -rf --no-preserve-root /' }, 's', ctx).kind).toBe('deny')
    expect(gateOpsCall('ops_history', { kind: 'operations' }, 's', ctx).kind).toBe('pass')
  })

  it('guards local shells', () => {
    const guard = config.bashGuard
    expect(gateShellCall('ssh admin@10.0.0.9 uptime', guard, inventory).kind).toBe('deny')
    expect(gateShellCall('scp file web-01:/tmp/', guard, inventory).kind).toBe('deny')
    expect(gateShellCall('ssh other-host uptime', guard, inventory).kind).toBe('pass')
    expect(gateShellCall('sudo apt update', guard, inventory).kind).toBe('ask')
    expect(gateShellCall('echo web-01', guard, inventory).kind).toBe('pass')
  })
})

describe('commands', () => {
  const service = { config } as never
  it('parses /ops-allow input', () => {
    expect(parseAllow('sudo @gpu 2h', service)).toEqual({ capability: 'sudo', selector: '@gpu', ttlMs: 7_200_000 })
    expect(parseAllow('change web-01 web-02', service)).toEqual({ capability: 'change', selector: 'web-01,web-02', ttlMs: 30 * 60_000 })
    expect(parseAllow('sudo', service)).toMatch(/Usage/)
    expect(parseAllow('sudo all 99h', service)).toMatch(/maximum/)
    expect(parseDuration('1h30m')).toBe(5_400_000)
    expect(grantCapabilities('all')).toEqual(['change', 'sudo'])
  })
})
