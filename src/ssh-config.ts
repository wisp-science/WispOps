/**
 * Read host aliases out of OpenSSH client configuration so they can be added to
 * the inventory in one step. Only literal `Host` entries are offered; wildcard
 * patterns and `Match` blocks are skipped. Imported hosts connect through their
 * alias, so the keys, jump hosts and options in ssh_config keep applying.
 * @module dsh-wisp-ops/ssh-config
 */

import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import type { HostSpec } from './config.ts'
import { expandHome } from './inventory.ts'

export const DEFAULT_SSH_CONFIG = '~/.ssh/config'
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const MAX_FILES = 30
const MAX_DEPTH = 3

export interface SshConfigHost {
  alias: string
  hostName?: string
  user?: string
  port?: number
  identityFile?: string
  proxyJump?: string
  /** File the alias was read from. */
  source: string
}

/** Keyword and arguments of one line; OpenSSH accepts `Key Value`, `Key=Value` and double quotes. */
function splitLine(line: string): [string, string[]] | undefined {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.startsWith('#')) return undefined
  const match = /^(\S+?)(?:\s*=\s*|\s+)(.*)$/.exec(trimmed)
  if (match === null) return [trimmed.toLowerCase(), []]
  const args = [...(match[2] as string).matchAll(/"([^"]*)"|(\S+)/g)].map(m => m[1] ?? m[2] ?? '')
  return [(match[1] as string).toLowerCase(), args]
}

/** Parse one file. The first block naming an alias wins, as in OpenSSH. */
export function parseSshConfig(text: string, source = DEFAULT_SSH_CONFIG): { hosts: SshConfigHost[]; includes: string[] } {
  const hosts: SshConfigHost[] = []
  const includes: string[] = []
  const seen = new Set<string>()
  let current: SshConfigHost[] = []
  let skipping = false
  for (const line of text.split(/\r?\n/)) {
    const parsed = splitLine(line)
    if (parsed === undefined) continue
    const [key, args] = parsed
    if (key === 'include') { includes.push(...args); continue }
    if (key === 'match') { current = []; skipping = true; continue }
    if (key === 'host') {
      current = []
      skipping = false
      for (const pattern of args) {
        // Patterns, option-like words and names with whitespace cannot be inventory destinations.
        if (/[*?!\s]/.test(pattern) || pattern.startsWith('-') || seen.has(pattern)) continue
        seen.add(pattern)
        const entry: SshConfigHost = { alias: pattern, source }
        current.push(entry)
        hosts.push(entry)
      }
      continue
    }
    if (skipping || current.length === 0) continue
    const value = args[0]
    if (value === undefined || value.length === 0) continue
    for (const host of current) {
      if (key === 'hostname' && host.hostName === undefined) host.hostName = value
      else if (key === 'user' && host.user === undefined) host.user = value
      else if (key === 'port' && host.port === undefined && /^\d{1,5}$/.test(value) && Number(value) > 0 && Number(value) <= 65535) host.port = Number(value)
      else if (key === 'identityfile' && host.identityFile === undefined) host.identityFile = value
      else if (key === 'proxyjump' && host.proxyJump === undefined) host.proxyJump = value
    }
  }
  return { hosts, includes }
}

/** Read a configuration and the files it includes (relative paths resolve against the main file's directory). */
export async function loadSshConfigHosts(path = DEFAULT_SSH_CONFIG): Promise<{ path: string; hosts: SshConfigHost[] }> {
  const root = expandHome(path)
  const hosts: SshConfigHost[] = []
  const seen = new Set<string>()
  const visited = new Set<string>()
  const queue: { file: string; depth: number }[] = [{ file: root, depth: 0 }]
  while (queue.length > 0 && visited.size < MAX_FILES) {
    const { file, depth } = queue.shift() as { file: string; depth: number }
    if (visited.has(file)) continue
    visited.add(file)
    let text: string
    try {
      text = await readFile(file, 'utf8')
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT' || code === 'ENOTDIR' || code === 'EISDIR' || code === 'EACCES') continue
      throw error
    }
    const parsed = parseSshConfig(text, file)
    for (const host of parsed.hosts) {
      if (seen.has(host.alias)) continue
      seen.add(host.alias)
      hosts.push(host)
    }
    if (depth >= MAX_DEPTH) continue
    for (const pattern of parsed.includes) {
      const expanded = isAbsolute(pattern) || pattern.startsWith('~') ? expandHome(pattern) : join(dirname(root), pattern)
      const dir = dirname(expanded), base = basename(expanded)
      if (/[*?[\]]/.test(dir)) continue
      if (/[*?[\]]/.test(base)) {
        const re = new RegExp(`^${base.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\[|\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`)
        const names = await readdir(dir).catch(() => [] as string[])
        for (const name of names.filter(n => re.test(n)).sort()) queue.push({ file: join(dir, name), depth: depth + 1 })
      } else {
        queue.push({ file: expanded, depth: depth + 1 })
      }
    }
  }
  return { path: root, hosts }
}

/** An inventory name for an alias; OpenSSH allows characters the inventory does not, and `all` is a selector. */
export function inventoryNameFor(alias: string): string {
  const cleaned = alias.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[^A-Za-z0-9]+/, '').slice(0, 100)
  return NAME.test(cleaned) && cleaned !== 'all' ? cleaned : `host-${cleaned || 'x'}`.slice(0, 100)
}

/** Human-readable destination for the panel. */
export function describeSshConfigHost(host: SshConfigHost): string {
  return `${host.user === undefined ? '' : `${host.user}@`}${host.hostName ?? host.alias}${host.port === undefined ? '' : `:${host.port}`}`
}

/**
 * The inventory entry for an alias. It connects through the alias itself, so ProxyJump,
 * IdentityFile and every other option stay in ssh_config; only display details are copied.
 */
export function sshConfigHostSpec(host: SshConfigHost): HostSpec {
  const name = inventoryNameFor(host.alias)
  return {
    name,
    ...name === host.alias ? {} : { ssh: host.alias },
    groups: ['ssh-config'],
    description: `ssh_config ${host.alias}${host.hostName === undefined && host.user === undefined && host.port === undefined ? '' : ` → ${describeSshConfigHost(host)}`}`,
  }
}
