/**
 * Local durable state: the operation audit log, inspection history, and
 * disk snapshots, as JSON Lines under the configured data directory. Host
 * names are validated by the config schema, so they are safe file names.
 * @module dsh-wisp-ops/store
 */

import { appendFile, mkdir, open, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DiskSnapshot } from './collectors/disk.ts'
import type { HostProbe } from './collectors/probe.ts'
import type { Finding, InspectionMetrics } from './collectors/inspect.ts'
import type { RiskLevel } from './risk.ts'
import type { RunStatus } from './ssh.ts'

/** How a non-read action was authorized. */
export type Authorization = 'read-only' | 'policy' | 'grant' | 'approval' | 'task'

export interface AuditEntry {
  readonly at: string
  readonly session?: string
  readonly tool: string
  readonly host: string
  readonly risk: RiskLevel
  readonly sudo: boolean
  readonly authorization: Authorization
  readonly command: string
  readonly reason?: string
  readonly status: RunStatus
  readonly exitCode: number | null
  readonly durationMs: number
}

export interface HistoryRecord extends InspectionMetrics {
  readonly status: RunStatus
  readonly findings: readonly Finding[]
}

async function readJsonLines<T>(path: string): Promise<T[]> {
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const rows: T[] = []
  for (const line of text.split('\n')) {
    if (line.trim().length === 0) continue
    try {
      rows.push(JSON.parse(line) as T)
    } catch {
      // A torn final line from an interrupted append is skipped, not fatal.
    }
  }
  return rows
}

/** Read newest first in fixed-size chunks; buffers preserve split UTF-8 characters. */
export async function* reverseJsonLines<T>(path: string): AsyncGenerator<T> {
  const file = await open(path, 'r').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  if (!file) return
  try {
    let pos = (await file.stat()).size
    let tail = Buffer.alloc(0)
    let oversized = false
    while (pos > 0) {
      const size = Math.min(64 * 1024, pos)
      pos -= size
      const block = Buffer.alloc(size)
      const { bytesRead } = await file.read(block, 0, size, pos)
      const data = Buffer.concat([block.subarray(0, bytesRead), tail])
      let end = data.length
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i] !== 10) continue
        if (!oversized) {
          try { yield JSON.parse(data.subarray(i + 1, end).toString('utf8')) as T } catch { /* torn/malformed line */ }
        }
        oversized = false
        end = i
      }
      tail = data.subarray(0, end)
      if (tail.length > 1024 * 1024) { tail = Buffer.alloc(0); oversized = true }
    }
    if (!oversized && tail.length) {
      try { yield JSON.parse(tail.toString('utf8')) as T } catch { /* torn/malformed line */ }
    }
  } finally { await file.close() }
}

export class OpsStore {
  constructor(private readonly dir: string) {}

  private async ensure(sub = ''): Promise<string> {
    const path = join(this.dir, sub)
    await mkdir(path, { recursive: true, mode: 0o700 })
    return path
  }

  async audit(entry: AuditEntry): Promise<void> {
    const month = new Date(entry.at).toISOString().slice(0, 7)
    await appendFile(join(await this.ensure('audit'), `${month}.jsonl`), `${JSON.stringify(entry)}\n`, { mode: 0o600 })
  }

  async readAudit(filter: { hosts?: ReadonlySet<string>; sinceMs?: number; limit: number }): Promise<AuditEntry[]> {
    if (filter.limit <= 0) return []
    const names = (await readdir(join(this.dir, 'audit')).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [] as string[]
      throw error
    })).filter(name => /^\d{4}-\d{2}\.jsonl$/.test(name)).sort().reverse()
    const month = filter.sinceMs === undefined ? undefined : new Date(filter.sinceMs).toISOString().slice(0, 7)
    const paths = [...names.filter(name => month === undefined || name.slice(0, 7) >= month).map(name => join(this.dir, 'audit', name)), join(this.dir, 'audit.jsonl')]
    const rows: AuditEntry[] = []
    for (const path of paths) {
      for await (const row of reverseJsonLines<AuditEntry>(path)) {
        if (!row || typeof row.host !== 'string' || !Number.isFinite(Date.parse(row.at))) continue
        if ((filter.hosts === undefined || filter.hosts.has(row.host)) && (filter.sinceMs === undefined || Date.parse(row.at) >= filter.sinceMs)) rows.push(row)
        if (rows.length >= filter.limit) return rows.reverse()
      }
    }
    return rows.reverse()
  }

  async appendHistory(host: string, record: HistoryRecord): Promise<void> {
    await appendFile(join(await this.ensure('inspections'), `${host}.jsonl`), `${JSON.stringify(record)}\n`, { mode: 0o600 })
  }

  async readHistory(host: string, limit: number): Promise<HistoryRecord[]> {
    const rows: HistoryRecord[] = []
    if (limit <= 0) return rows
    for await (const row of reverseJsonLines<HistoryRecord>(join(this.dir, 'inspections', `${host}.jsonl`))) {
      if (!row || !row.diskPct || !Array.isArray(row.findings)) continue
      rows.push(row)
      if (rows.length >= limit) break
    }
    return rows.reverse()
  }

  /** The latest successful inspection, used as the trend baseline. */
  async lastHealthy(host: string): Promise<HistoryRecord | undefined> {
    return (await this.readHistory(host, 50)).filter(r => r.status === 'ok').at(-1)
  }

  async diskSnapshot(host: string, path: string): Promise<DiskSnapshot | undefined> {
    const rows = await readJsonLines<DiskSnapshot>(join(this.dir, 'disk', `${host}.jsonl`))
    return rows.filter(row => row.path === path).at(-1)
  }

  async saveDiskSnapshot(host: string, snapshot: DiskSnapshot): Promise<void> {
    const dir = await this.ensure('disk')
    const file = join(dir, `${host}.jsonl`)
    // Keep a bounded tail so the file never grows without limit.
    const rows = (await readJsonLines<DiskSnapshot>(file)).slice(-49)
    rows.push(snapshot)
    await writeFile(file, rows.map(row => JSON.stringify(row)).join('\n') + '\n', { mode: 0o600 })
  }

  async probes(): Promise<Record<string, HostProbe>> {
    try {
      return JSON.parse(await readFile(join(this.dir, 'probes.json'), 'utf8')) as Record<string, HostProbe>
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) return {}
      throw error
    }
  }

  async saveProbes(update: Record<string, HostProbe>): Promise<void> {
    const merged = { ...await this.probes(), ...update }
    const file = join(await this.ensure(), 'probes.json')
    const tmp = `${file}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(merged, null, 2), { mode: 0o600 })
    await rename(tmp, file)
  }

  /** Append to a bounded per-key JSON Lines log under `sub/`. */
  async appendBounded<T>(sub: string, key: string, row: T, keep = 200): Promise<void> {
    const file = join(await this.ensure(sub), `${key}.jsonl`)
    const rows = (await readJsonLines<T>(file)).slice(-(keep - 1))
    rows.push(row)
    await writeFile(file, rows.map(r => JSON.stringify(r)).join('\n') + '\n', { mode: 0o600 })
  }

  async readBounded<T>(sub: string, key: string): Promise<T[]> {
    return readJsonLines<T>(join(this.dir, sub, `${key}.jsonl`))
  }
}
