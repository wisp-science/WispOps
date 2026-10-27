/**
 * Local durable state: the operation audit log, inspection history, and
 * disk snapshots, as JSON Lines under the configured data directory. Host
 * names are validated by the config schema, so they are safe file names.
 * @module dsh-wisp-ops/store
 */

import { appendFile, mkdir, open, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
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

/** One host's outcome of a managed change, kept so retained backups can be listed later. */
export interface ChangeRecord {
  readonly at: string
  readonly session?: string
  readonly host: string
  readonly outcome: 'verified' | 'rolled-back' | 'rollback-failed' | 'refused' | 'unknown'
  readonly status: RunStatus
  readonly exitCode: number | null
  /** Remote backup directory, when the transaction got far enough to create one. */
  readonly backupDir?: string
  readonly files: readonly string[]
  readonly newFiles: readonly string[]
  readonly directories: readonly string[]
  readonly reason: string
  readonly sudo: boolean
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

export interface StoreRetention {
  /** Inspection records kept per host. */
  readonly inspectionRecords: number
  /** Monthly audit partitions kept, counting the current one; 0 keeps all. */
  readonly auditMonths: number
}

export const DEFAULT_RETENTION: StoreRetention = { inspectionRecords: 1000, auditMonths: 12 }

/** First month that `auditMonths` retention keeps, as `YYYY-MM`. */
export function auditCutoffMonth(auditMonths: number, now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (auditMonths - 1), 1))
  return d.toISOString().slice(0, 7)
}

export class OpsStore {
  private prunedFor: string | undefined

  constructor(private readonly dir: string, private readonly retention: StoreRetention = DEFAULT_RETENTION) {}

  private async ensure(sub = ''): Promise<string> {
    const path = join(this.dir, sub)
    await mkdir(path, { recursive: true, mode: 0o700 })
    return path
  }

  /** Replace a JSON Lines file with the newest `keep` rows plus `row`, through a rename so readers never see a torn file. */
  private async writeBounded<T>(file: string, rows: readonly T[], row: T, keep: number): Promise<void> {
    const kept = [...rows.slice(-(Math.max(1, keep) - 1)), row]
    const tmp = `${file}.${process.pid}.${Date.now().toString(36)}.tmp`
    await writeFile(tmp, kept.map(r => JSON.stringify(r)).join('\n') + '\n', { mode: 0o600 })
    await rename(tmp, file)
  }

  async audit(entry: AuditEntry): Promise<void> {
    const month = new Date(entry.at).toISOString().slice(0, 7)
    const dir = await this.ensure('audit')
    await appendFile(join(dir, `${month}.jsonl`), `${JSON.stringify(entry)}\n`, { mode: 0o600 })
    if (this.retention.auditMonths > 0 && this.prunedFor !== month) {
      this.prunedFor = month
      await this.pruneAudit(new Date(entry.at))
    }
  }

  /** Delete monthly audit partitions older than the retention window; the legacy `audit.jsonl` is left alone. */
  async pruneAudit(now = new Date()): Promise<string[]> {
    if (this.retention.auditMonths <= 0) return []
    const cutoff = auditCutoffMonth(this.retention.auditMonths, now)
    const names = (await readdir(join(this.dir, 'audit')).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [] as string[]
      throw error
    })).filter(name => /^\d{4}-\d{2}\.jsonl$/.test(name) && name.slice(0, 7) < cutoff)
    for (const name of names) await rm(join(this.dir, 'audit', name), { force: true })
    return names
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

  /** Append one inspection, keeping only the newest `retention.inspectionRecords` per host. */
  async appendHistory(host: string, record: HistoryRecord): Promise<void> {
    const file = join(await this.ensure('inspections'), `${host}.jsonl`)
    const rows = await readJsonLines<HistoryRecord>(file)
    if (rows.length + 1 <= this.retention.inspectionRecords) {
      await appendFile(file, `${JSON.stringify(record)}\n`, { mode: 0o600 })
      return
    }
    await this.writeBounded(file, rows, record, this.retention.inspectionRecords)
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
    const file = join(await this.ensure('disk'), `${host}.jsonl`)
    // Keep a bounded tail so the file never grows without limit.
    await this.writeBounded(file, await readJsonLines<DiskSnapshot>(file), snapshot, 50)
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
  async recordChange(record: ChangeRecord): Promise<void> {
    await this.appendBounded('changes', record.host, record, 200)
  }

  async readChanges(host: string, limit: number): Promise<ChangeRecord[]> {
    return (await this.readBounded<ChangeRecord>('changes', host)).filter(row => row && typeof row.at === 'string' && typeof row.outcome === 'string').slice(-Math.max(0, limit))
  }

  async appendBounded<T>(sub: string, key: string, row: T, keep = 200): Promise<void> {
    const file = join(await this.ensure(sub), `${key}.jsonl`)
    await this.writeBounded(file, await readJsonLines<T>(file), row, keep)
  }

  async readBounded<T>(sub: string, key: string): Promise<T[]> {
    return readJsonLines<T>(join(this.dir, sub, `${key}.jsonl`))
  }
}
