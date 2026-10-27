/**
 * Read-only interoperation with WispTerm's Password Store and SSH profiles,
 * so operators keep one vault and one host list.
 *
 * Password Store: `<config>/passwords` is a JSON array of
 * `{name, username, secret, note, agent}`; `secret` is
 * base64(nonce[24] ‖ ciphertext ‖ tag[16]) under XChaCha20-Poly1305 with empty
 * AAD. The 32-byte key is held by the OS: macOS login Keychain (service
 * "WispTerm Password Store", account "vault-key"), Windows DPAPI user scope in
 * `<config>/passwords.key` with entropy "WispTerm Password Store", elsewhere
 * a raw 0600 `<config>/passwords.key`. This module never writes the store and
 * never creates a key: two writers could mint different keys.
 *
 * SSH profiles: `<config>/ssh_hosts`, one tab-separated line per profile with
 * every field uppercase-hex encoded. Its password field is not encrypted by
 * WispTerm, so this module never decodes it.
 * @module dsh-wisp-ops/wispterm
 */

import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import type { HostSpec } from './config.ts'
import type { Host } from './inventory.ts'
import type { SecretProvider, SudoCredential } from './secrets.ts'

export const KEYCHAIN_SERVICE = 'WispTerm Password Store'
export const KEYCHAIN_ACCOUNT = 'vault-key'
const DPAPI_ENTROPY = 'WispTerm Password Store'

/** WispTerm's config directory for this platform. */
export function wisptermConfigDir(platform: NodeJS.Platform = process.platform, env: NodeJS.ProcessEnv = process.env): string {
  if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'wispterm')
  if (platform === 'win32' && env.APPDATA !== undefined && env.APPDATA.length > 0) return join(env.APPDATA, 'wispterm')
  const xdg = env.XDG_CONFIG_HOME
  return join(xdg !== undefined && xdg.length > 0 ? xdg : join(homedir(), '.config'), 'wispterm')
}

/** A vault entry without its secret. */
export interface VaultEntry {
  readonly name: string
  readonly username: string
  readonly note: string
  readonly agent: boolean
  readonly hasSecret: boolean
}

interface RawEntry {
  name?: unknown
  username?: unknown
  secret?: unknown
  note?: unknown
  agent?: unknown
}

async function readVaultFile(dir: string): Promise<RawEntry[]> {
  const text = await readFile(join(dir, 'passwords'), 'utf8')
  if (!text.trimStart().startsWith('[')) {
    throw new Error('the WispTerm Password Store is still in its legacy plaintext format; open the Password Store page in WispTerm once so it encrypts the file')
  }
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) throw new Error('the WispTerm Password Store is not a JSON array')
  return (parsed as RawEntry[]).filter(entry => typeof entry?.name === 'string' && entry.name.length > 0)
}

/** List entries (names, usernames, notes, agent flag) without decrypting anything. */
export async function listVault(dir: string): Promise<VaultEntry[]> {
  return (await readVaultFile(dir)).map(entry => ({
    name: entry.name as string,
    username: typeof entry.username === 'string' ? entry.username : '',
    note: typeof entry.note === 'string' ? entry.note : '',
    agent: entry.agent !== false,
    hasSecret: typeof entry.secret === 'string' && entry.secret.length > 0,
  }))
}

/** Open one sealed secret with the vault key. */
export function openSecret(sealed: string, key: Uint8Array): string {
  const blob = Buffer.from(sealed, 'base64')
  if (blob.length < 24 + 16) throw new Error('sealed secret is too short')
  const nonce = blob.subarray(0, 24)
  const plain = xchacha20poly1305(key, nonce).decrypt(blob.subarray(24))
  return Buffer.from(plain).toString('utf8')
}

function run(file: string, args: string[], env?: NodeJS.ProcessEnv): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { encoding: 'buffer', timeout: 120_000, ...env === undefined ? {} : { env: { ...process.env, ...env } } }, (error, stdout) => {
      if (error !== null) reject(error)
      else resolve(stdout)
    })
  })
}

/** Decode the key `security -w` printed: hex for binary items, otherwise the raw bytes. */
export function decodeKeychainOutput(stdout: Buffer): Uint8Array {
  const text = stdout.toString('latin1').replace(/\n$/, '')
  if (/^[0-9a-fA-F]{64}$/.test(text)) return Buffer.from(text, 'hex')
  const raw = stdout.at(-1) === 0x0a ? stdout.subarray(0, -1) : stdout
  if (raw.length === 32) return raw
  throw new Error(`unexpected WispTerm vault key format from the Keychain (${raw.length} bytes)`)
}

/** Read the vault key the way WispTerm stores it on this platform. */
export async function readVaultKey(dir: string, platform: NodeJS.Platform = process.platform): Promise<Uint8Array> {
  if (platform === 'darwin') {
    try {
      // macOS shows its own Keychain prompt the first time; "Always Allow" trusts this Node binary.
      return decodeKeychainOutput(await run('/usr/bin/security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w']))
    } catch (error) {
      throw new Error(`could not read the WispTerm vault key from the Keychain (${error instanceof Error ? error.message.split('\n')[0] : String(error)}); allow access in the Keychain prompt, or check that WispTerm has created the Password Store`)
    }
  }
  if (platform === 'win32') {
    const script = `Add-Type -AssemblyName System.Security; $b=[IO.File]::ReadAllBytes($env:WISP_KEY_FILE); $e=[Text.Encoding]::ASCII.GetBytes('${DPAPI_ENTROPY}'); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Unprotect($b,$e,[Security.Cryptography.DataProtectionScope]::CurrentUser))`
    const out = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { WISP_KEY_FILE: join(dir, 'passwords.key') })
    const key = Buffer.from(out.toString('utf8').trim(), 'base64')
    if (key.length !== 32) throw new Error('unexpected WispTerm vault key length from DPAPI')
    return key
  }
  const key = await readFile(join(dir, 'passwords.key'))
  if (key.length !== 32) throw new Error('unexpected WispTerm vault key length')
  return key
}

/**
 * Passwords from the WispTerm Password Store, by the entry named in a host's
 * `sudoSecret` or `loginSecret`. Entries marked "not for agents" are refused. The key
 * is cached for the plugin lifetime so the Keychain asks once.
 */
export class WispTermSecrets implements SecretProvider {
  private key: Uint8Array | undefined

  constructor(readonly dir: string, private readonly readKey: (dir: string) => Promise<Uint8Array> = readVaultKey) {}

  async sudoPassword(host: Host): Promise<string | undefined> {
    return (await this.sudoCredential(host))?.password
  }

  sudoCredential(host: Host): Promise<SudoCredential | undefined> {
    return this.open(host.sudoSecret, host.name)
  }

  async loginPassword(host: Host): Promise<string | undefined> {
    return (await this.open(host.loginSecret, host.name))?.password
  }

  private async open(name: string | undefined, hostName: string): Promise<SudoCredential | undefined> {
    if (name === undefined) return undefined
    const wanted = name.toLowerCase()
    const entry = (await readVaultFile(this.dir)).find(e => (e.name as string).toLowerCase() === wanted)
    if (entry === undefined) throw new Error(`WispTerm Password Store has no entry named "${name}" (host ${hostName})`)
    if (entry.agent === false) throw new Error(`WispTerm Password Store entry "${name}" is marked not for agents`)
    if (typeof entry.secret !== 'string' || entry.secret.length === 0) throw new Error(`WispTerm Password Store entry "${name}" has no password`)
    this.key ??= await this.readKey(this.dir)
    return { password: openSecret(entry.secret, this.key), username: typeof entry.username === 'string' ? entry.username : '' }
  }

  dispose(): void {
    this.key?.fill(0)
    this.key = undefined
  }
}

function hexField(field: string | undefined): string {
  return field === undefined || field.length === 0 ? '' : Buffer.from(field, 'hex').toString('utf8')
}

/** Inventory names allow letters, digits, dot, dash, underscore. */
function inventoryName(name: string): string {
  return name.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[^A-Za-z0-9]+/, '') || 'host'
}

/**
 * Import WispTerm SSH profiles as inventory hosts in group `wispterm`.
 * Field order: name, host, user, password (never decoded), port, proxy_jump,
 * auth_method, identity_file.
 */
export function parseSshHosts(text: string): HostSpec[] {
  const hosts: HostSpec[] = []
  const seen = new Set<string>()
  for (const line of text.split(/\r?\n/)) {
    if (line.length === 0 || line.startsWith('#')) continue
    const f = line.split('\t')
    const label = hexField(f[0])
    const address = hexField(f[1])
    if (label.length === 0 || address.length === 0) continue
    let name = inventoryName(label)
    for (let i = 2; seen.has(name); i++) name = `${inventoryName(label)}-${i}`
    seen.add(name)
    const user = hexField(f[2])
    const port = Number(hexField(f[4]))
    const proxyJump = hexField(f[5])
    const auth = hexField(f[6])
    const identityFile = hexField(f[7])
    hosts.push({
      name,
      ssh: address,
      ...user.length > 0 ? { user } : {},
      ...Number.isInteger(port) && port > 0 && port !== 22 ? { port } : {},
      ...proxyJump.length > 0 ? { proxyJump } : {},
      ...identityFile.length > 0 && auth !== 'password' ? { identityFile } : {},
      groups: ['wispterm'],
      ...label !== name ? { description: label } : {},
      // The profile's own password field is plaintext; a password host needs a Password Store entry instead.
      ...auth === 'password' ? { auth: 'password' as const, loginSecret: label } : {},
    })
  }
  return hosts
}

export async function loadWispTermHosts(dir: string): Promise<HostSpec[]> {
  try {
    return parseSshHosts(await readFile(join(dir, 'ssh_hosts'), 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

