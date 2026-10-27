import { randomBytes } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { Inventory } from '../src/inventory.ts'
import type { Host } from '../src/inventory.ts'
import { resolveConfig } from '../src/config.ts'
import { decodeKeychainOutput, listVault, openSecret, parseSshHosts, wisptermConfigDir, WispTermSecrets } from '../src/wispterm.ts'

/** Seal the way WispTerm's store.zig does: base64(nonce ‖ ciphertext ‖ tag), empty AAD. */
function seal(secret: string, key: Uint8Array): string {
  const nonce = randomBytes(24)
  return Buffer.concat([nonce, xchacha20poly1305(key, nonce).encrypt(Buffer.from(secret))]).toString('base64')
}

const hex = (s: string) => Buffer.from(s).toString('hex').toUpperCase()

let dir: string
const key = randomBytes(32)

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wisp-ops-wispterm-'))
  await writeFile(join(dir, 'passwords'), JSON.stringify([
    { name: 'gpu-root', username: 'root', secret: seal('s3cret!', key), note: 'GPU nodes', agent: true },
    { name: 'bank', secret: seal('no', key), agent: false },
    { name: 'empty', secret: '' },
  ], null, 2))
})
afterAll(async () => { await rm(dir, { recursive: true, force: true }) })

const host = (spec: Record<string, unknown>) => new Inventory([{ name: 'h', ...spec }], {}, resolveConfig({}).defaultPolicy).select('h')[0] as Host

describe('WispTerm Password Store', () => {
  it('lists entries without secrets', async () => {
    const entries = await listVault(dir)
    expect(entries.map(e => [e.name, e.agent, e.hasSecret])).toEqual([['gpu-root', true, true], ['bank', false, true], ['empty', true, false]])
    expect(JSON.stringify(entries)).not.toContain('s3cret')
  })

  it('opens the sudo password case-insensitively and honours the agent flag', async () => {
    const secrets = new WispTermSecrets(dir, async () => key)
    expect(await secrets.sudoPassword(host({ sudoSecret: 'GPU-Root' }))).toBe('s3cret!')
    expect(await secrets.sudoCredential(host({ sudoSecret: 'GPU-Root' }))).toEqual({ password: 's3cret!', username: 'root' })
    expect(await secrets.sudoPassword(host({}))).toBeUndefined()
    await expect(secrets.sudoPassword(host({ sudoSecret: 'bank' }))).rejects.toThrow(/not for agents/)
    await expect(secrets.sudoPassword(host({ sudoSecret: 'empty' }))).rejects.toThrow(/no password/)
    await expect(secrets.loginPassword(host({ loginSecret: 'missing' }))).rejects.toThrow(/no entry/)
  })

  it('rejects a wrong key', () => {
    expect(() => openSecret(seal('x', key), randomBytes(32))).toThrow()
  })

  it('decodes Keychain output', () => {
    expect(Buffer.from(decodeKeychainOutput(Buffer.from(`${key.toString('hex')}\n`)))).toEqual(key)
    expect(Buffer.from(decodeKeychainOutput(Buffer.concat([key, Buffer.from('\n')])))).toEqual(key)
  })

  it('knows the platform directories', () => {
    expect(wisptermConfigDir('darwin')).toMatch(/Library\/Application Support\/wispterm$/)
    expect(wisptermConfigDir('linux', { XDG_CONFIG_HOME: '/x' })).toBe('/x/wispterm')
    expect(wisptermConfigDir('win32', { APPDATA: 'C:\\Users\\a\\AppData\\Roaming' })).toContain('wispterm')
  })
})

describe('WispTerm SSH profiles', () => {
  it('imports profiles without decoding their passwords', () => {
    const line = (...f: string[]) => f.map(hex).join('\t')
    const text = [
      '# wispterm ssh hosts v1',
      line('Lab GPU', '10.0.0.5', 'alice', 'plaintext-pw', '2222', 'bastion', 'key', '~/.ssh/id_lab'),
      line('nas', 'nas.local', 'root', 'hunter2', '22', '', 'password', ''),
      line('nas', 'nas2.local', '', '', '', '', 'key', ''),
    ].join('\n')
    const hosts = parseSshHosts(text)
    expect(hosts).toEqual([
      { name: 'Lab-GPU', ssh: '10.0.0.5', user: 'alice', port: 2222, proxyJump: 'bastion', identityFile: '~/.ssh/id_lab', groups: ['wispterm'], description: 'Lab GPU' },
      { name: 'nas', ssh: 'nas.local', user: 'root', groups: ['wispterm'], auth: 'password', loginSecret: 'nas' },
      { name: 'nas-2', ssh: 'nas2.local', groups: ['wispterm'], description: 'nas' },
    ])
    expect(JSON.stringify(hosts)).not.toContain('hunter2')
    expect(JSON.stringify(hosts)).not.toContain('plaintext-pw')
  })
})
