import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { describeSshConfigHost, inventoryNameFor, loadSshConfigHosts, parseSshConfig, sshConfigHostSpec } from '../src/ssh-config.ts'
import { Config } from '../src/config.ts'

const SAMPLE = `# lab machines
Host gpu-01 gpu-02
    HostName 10.0.0.11
    User alice
    Port 2222
    IdentityFile ~/.ssh/id_lab

Host bastion
  HostName bastion.example.com
  User ops

Host web-*
    ProxyJump bastion

Host "quoted name"
    HostName 10.0.0.9

Host gpu-01
    User bob

Match host gpu-02
    User eve

Host nas=
    HostName 192.168.1.20
Host all
    HostName 10.9.9.9
Host *
    ServerAliveInterval 30
`

describe('ssh_config parsing', () => {
  it('collects literal Host aliases, first block wins, wildcards and Match blocks are skipped', () => {
    const { hosts } = parseSshConfig(SAMPLE, '/x/config')
    expect(hosts.map(h => h.alias)).toEqual(['gpu-01', 'gpu-02', 'bastion', 'nas=', 'all'])
    expect(hosts[0]).toEqual({ alias: 'gpu-01', hostName: '10.0.0.11', user: 'alice', port: 2222, identityFile: '~/.ssh/id_lab', source: '/x/config' })
    expect(hosts[1]?.user).toBe('alice')
    expect(hosts.find(h => h.alias === 'bastion')).toMatchObject({ hostName: 'bastion.example.com', user: 'ops' })
    expect(hosts.find(h => h.alias === 'bastion')?.port).toBeUndefined()
    expect(parseSshConfig('Include ~/.ssh/conf.d/*\nInclude extra.conf').includes).toEqual(['~/.ssh/conf.d/*', 'extra.conf'])
    expect(parseSshConfig('Host  a\n  Port 99999\n  Port=2200').hosts[0]?.port).toBe(2200)
  })

  it('derives inventory names and connects through the alias', () => {
    expect(inventoryNameFor('gpu-01')).toBe('gpu-01')
    expect(inventoryNameFor('lab:gpu')).toBe('lab-gpu')
    expect(inventoryNameFor('all')).toBe('host-all')
    expect(inventoryNameFor('_x')).toBe('x')
    expect(sshConfigHostSpec({ alias: 'gpu-01', hostName: '10.0.0.11', user: 'alice', port: 2222, source: 'c' })).toEqual({ name: 'gpu-01', groups: ['ssh-config'], description: 'ssh_config gpu-01 → alice@10.0.0.11:2222' })
    expect(sshConfigHostSpec({ alias: 'lab:gpu', source: 'c' })).toEqual({ name: 'lab-gpu', ssh: 'lab:gpu', groups: ['ssh-config'], description: 'ssh_config lab:gpu' })
    expect(() => Config({ hosts: [sshConfigHostSpec({ alias: 'lab:gpu', source: 'c' })] } as never)).not.toThrow()
    expect(describeSshConfigHost({ alias: 'b', hostName: 'h', source: 'c' })).toBe('h')
    // Every spec the importer produces must satisfy the inventory schema.
    for (const host of parseSshConfig(SAMPLE).hosts) expect(() => Config({ hosts: [sshConfigHostSpec(host)] } as never)).not.toThrow()
  })
})

describe('ssh_config files', () => {
  let dir: string
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'wisp-sshconfig-')) })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('follows Include globs relative to the main file, bounded, and tolerates a missing file', async () => {
    await mkdir(join(dir, 'conf.d'))
    await writeFile(join(dir, 'config'), `Include conf.d/*.conf\nInclude ${join(dir, 'absolute.conf')}\nInclude missing.conf\nHost main\n  HostName 10.0.0.1\n`)
    await writeFile(join(dir, 'conf.d', 'a.conf'), 'Host a-host\n  HostName 10.0.0.2\nHost main\n  HostName ignored\n')
    await writeFile(join(dir, 'conf.d', 'b.conf'), `Include ${join(dir, 'config')}\nHost b-host\n  HostName 10.0.0.3\n`)
    await writeFile(join(dir, 'conf.d', 'notes.txt'), 'Host not-included\n')
    await writeFile(join(dir, 'absolute.conf'), 'Host abs\n  User root\n')
    const { path, hosts } = await loadSshConfigHosts(join(dir, 'config'))
    expect(path).toBe(join(dir, 'config'))
    expect(hosts.map(h => h.alias)).toEqual(['main', 'a-host', 'b-host', 'abs'])
    expect(hosts[0]?.hostName).toBe('10.0.0.1')
    expect((await loadSshConfigHosts(join(dir, 'nope'))).hosts).toEqual([])
  })
})
