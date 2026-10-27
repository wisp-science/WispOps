/** Independent WispOps vault. Only the SSH secret provider can decrypt entries. */
import { randomBytes, createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { chmod, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { LocalState } from './local-state.ts'
import type { Host } from './inventory.ts'
import type { SecretProvider, SudoCredential } from './secrets.ts'

export interface Credential { name: string; username: string; note: string; agent: boolean }
interface SealedCredential extends Credential { secret: string }
interface VaultFile { version: 1; entries: SealedCredential[] }
export interface CredentialInput extends Credential { password?: string }
export interface PortableCredential extends Credential { password: string }

// Secrets travel on stdin, never in process arguments or error messages.
function run(file: string, args: string[], input = ''): Promise<Buffer> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(file, args, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120_000 })
    const out: Buffer[] = []
    child.stdout.on('data', b => out.push(b))
    child.stderr.resume()
    child.stdin.on('error', () => {})
    child.on('error', () => reject(new Error('无法访问系统密码库。')))
    child.on('close', code => code === 0 ? resolveResult(Buffer.concat(out)) : reject(new Error('系统密码库未授权或密钥不可用。')))
    child.stdin.end(input)
  })
}

/** macOS Keychain, Windows DPAPI, or an owner-only key file on other systems. */
export async function localVaultKey(dir: string, create: boolean): Promise<Uint8Array> {
  const file = join(dir, 'vault.key')
  if (process.platform === 'darwin') {
    const account = `vault-${createHash('sha256').update(resolve(dir)).digest('hex').slice(0, 24)}`
    if (create) {
      const key = randomBytes(32).toString('hex')
      // No -U: never replace an existing key, including after a lost response.
      await run('/usr/bin/security', ['-i'], `add-generic-password -s "WispOps Password Store" -a "${account}" -w "${key}"\n`).catch(() => {})
    }
    const out = await run('/usr/bin/security', ['find-generic-password', '-s', 'WispOps Password Store', '-a', account, '-w'])
    const hex = out.toString().trim()
    if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error('WispOps 密钥格式不正确。')
    return Buffer.from(hex, 'hex')
  }
  let stored: Buffer | undefined = await readFile(file).catch(error => { if (error.code === 'ENOENT') return undefined; throw error })
  if (stored === undefined) {
    if (!create) throw new Error('WispOps 密钥丢失，不能创建新密钥覆盖已有密码库。')
    const key = randomBytes(32)
    stored = process.platform === 'win32' ? await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "Add-Type -AssemblyName System.Security; $k=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($k,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))"], key.toString('base64')).then(b => Buffer.from(b.toString().trim(), 'base64')) : key
    await writeFile(file, stored!, { mode: 0o600, flag: 'wx' })
  }
  if (stored === undefined) throw new Error('WispOps 密钥不可用。')
  await chmod(file, 0o600)
  const key = process.platform === 'win32' ? await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "Add-Type -AssemblyName System.Security; $k=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Unprotect($k,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))"], stored.toString('base64')).then(b => Buffer.from(b.toString().trim(), 'base64')) : stored
  if (key.length !== 32) throw new Error('WispOps 密钥格式不正确。')
  return key
}

export class LocalVault implements SecretProvider {
  private readonly state: LocalState<VaultFile>
  constructor(readonly dir: string, private readonly keyProvider = localVaultKey) {
    this.state = new LocalState(join(dir, 'vault.json'), () => ({ version: 1, entries: [] }), value => {
      const raw = value as VaultFile
      if (raw?.version !== 1 || !Array.isArray(raw.entries)) throw new Error('Invalid WispOps vault')
      const names = new Set<string>()
      for (const entry of raw.entries) {
        if (!entry || typeof entry.name !== 'string' || !entry.name || typeof entry.secret !== 'string' || typeof entry.agent !== 'boolean' || typeof entry.username !== 'string' || typeof entry.note !== 'string' || names.has(entry.name)) throw new Error('Invalid WispOps vault entry')
        names.add(entry.name)
      }
      return raw
    })
  }
  async list() {
    const { revision, value } = await this.state.read()
    return { revision, entries: value.entries.map(({ secret, ...entry }) => ({ ...entry, hasSecret: secret.length > 0 })) }
  }
  async save(input: CredentialInput, revision: string, commitAssociations?: () => Promise<void>): Promise<void> {
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100 || /[\r\n]/.test(input.name)) throw new Error('凭据名称不能为空，且不能超过 100 字符。')
    if (typeof input.agent !== 'boolean' || typeof input.username !== 'string' || typeof input.note !== 'string') throw new Error('凭据字段不正确。')
    if (input.password !== undefined && (typeof input.password !== 'string' || input.password.length > 16384 || /[\r\n\0]/.test(input.password))) throw new Error('密码格式不正确（不支持换行或 NUL）。')
    await this.state.change(revision, async value => {
      const old = value.entries.find(e => e.name === input.name)
      let secret = old?.secret
      if (input.password) {
        const key = await this.keyProvider(this.dir, value.entries.length === 0)
        try {
          const nonce = randomBytes(24)
          // Bind ciphertext to its entry name; swapping records fails authentication.
          secret = Buffer.concat([nonce, xchacha20poly1305(key, nonce, Buffer.from(input.name)).encrypt(Buffer.from(input.password))]).toString('base64')
        } finally { key.fill(0) }
      }
      if (!secret) throw new Error('新增凭据需要填写密码。')
      const entry = { name: input.name, username: input.username, note: input.note, agent: input.agent, secret }
      return { version: 1, entries: [...value.entries.filter(e => e.name !== input.name), entry] }
    }, commitAssociations ? async commit => { await commit(); await commitAssociations() } : undefined)
  }
  async remove(name: string, revision: string, commitAssociations?: () => Promise<void>): Promise<void> {
    await this.state.change(revision, value => ({ ...value, entries: value.entries.filter(e => e.name !== name) }), commitAssociations ? async commit => { await commit(); await commitAssociations() } : undefined)
  }
  /** Owner-only backup path; never expose its return value through RPC or model tools. */
  async exportForSync(): Promise<{ revision: string; entries: PortableCredential[] }> {
    const { revision, value } = await this.state.read()
    if (!value.entries.length) return { revision, entries: [] }
    const key = await this.keyProvider(this.dir, false)
    try {
      return { revision, entries: value.entries.map(({ secret, ...entry }) => {
        const data = Buffer.from(secret, 'base64')
        const plain = xchacha20poly1305(key, data.subarray(0, 24), Buffer.from(entry.name)).decrypt(data.subarray(24))
        try { return { ...entry, password: Buffer.from(plain).toString('utf8') } } finally { plain.fill(0) }
      }) }
    } finally { key.fill(0) }
  }
  async replaceFromSync(entries: PortableCredential[], revision: string, participate: (commit: () => Promise<void>) => Promise<void>): Promise<void> {
    const names = new Set<string>()
    for (const e of entries) {
      if (!e || typeof e.name !== 'string' || !e.name || e.name.length > 100 || names.has(e.name) || /[\r\n\0]/.test(e.name) || typeof e.password !== 'string' || !e.password || e.password.length > 16384 || /[\r\n\0]/.test(e.password) || typeof e.username !== 'string' || typeof e.note !== 'string' || typeof e.agent !== 'boolean') throw new Error('Invalid sync credential')
      names.add(e.name)
    }
    await this.state.change(revision, async old => {
      if (!entries.length) return { version: 1, entries: [] }
      const key = await this.keyProvider(this.dir, old.entries.length === 0)
      try {
        return { version: 1, entries: entries.map(({ password, ...entry }) => {
          const nonce = randomBytes(24), plain = Buffer.from(password)
          try { return { ...entry, secret: Buffer.concat([nonce, xchacha20poly1305(key, nonce, Buffer.from(entry.name)).encrypt(plain)]).toString('base64') } }
          finally { plain.fill(0) }
        }) }
      } finally { key.fill(0) }
    }, participate)
  }
  private async credential(reference: string | undefined): Promise<SudoCredential | undefined> {
    if (!reference) return undefined
    const name = reference.replace(/^local:/, '')
    const entry = (await this.state.read()).value.entries.find(e => e.name === name)
    if (!entry) throw new Error(`WispOps 密码库中找不到凭据 ${name}。`)
    if (!entry.agent) throw new Error(`凭据 ${name} 不允许自动化使用。`)
    const key = await this.keyProvider(this.dir, false)
    try {
      const data = Buffer.from(entry.secret, 'base64')
      return { password: Buffer.from(xchacha20poly1305(key, data.subarray(0, 24), Buffer.from(name)).decrypt(data.subarray(24))).toString('utf8'), username: entry.username }
    } finally { key.fill(0) }
  }
  async password(reference: string | undefined): Promise<string | undefined> { return (await this.credential(reference))?.password }
  sudoCredential(host: Host) { return this.credential(host.sudoSecret) }
  sudoPassword(host: Host) { return this.password(host.sudoSecret) }
  loginPassword(host: Host) { return this.password(host.loginSecret) }
}

/** Explicit local references work even when the optional legacy provider is selected. */
export function routeSecrets(local: LocalVault, fallback: SecretProvider): SecretProvider {
  return {
    sudoPassword: (host, signal) => host.sudoSecret?.startsWith('local:') ? local.sudoPassword(host) : fallback.sudoPassword(host, signal),
    sudoCredential: async (host, signal) => {
      const provider = host.sudoSecret?.startsWith('local:') ? local : fallback
      if (provider.sudoCredential) return provider.sudoCredential(host, signal)
      const password = await provider.sudoPassword(host, signal)
      return password === undefined ? undefined : { password }
    },
    loginPassword: (host, signal) => host.loginSecret?.startsWith('local:') ? local.loginPassword(host) : fallback.loginPassword(host, signal),
  }
}
