import { mkdir, mkdtemp, writeFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { OpsStore, auditCutoffMonth, reverseJsonLines } from '../src/store.ts'
import type { AuditEntry } from '../src/store.ts'
import { renderTrends } from '../src/trends.ts'
let dir: string
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'wisp-store-')) })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
const row = (at: string, host = 'a'): AuditEntry => ({ at, host, tool: 'test', risk: 'read', sudo: false, authorization: 'read-only', command: 'true', status: 'ok', exitCode: 0, durationMs: 1 })
it('partitions audit months and reads filtered tails with legacy history', async () => {
  const store = new OpsStore(dir)
  await writeFile(join(dir, 'audit.jsonl'), JSON.stringify(row('2026-08-01T00:00:00Z')) + '\n')
  await store.audit(row('2026-09-30T23:59:00Z'))
  await store.audit(row('2026-10-01T00:00:00Z', 'b'))
  await store.audit(row('2026-10-01T01:00:00Z'))
  expect((await readdir(join(dir, 'audit'))).sort()).toEqual(['2026-09.jsonl', '2026-10.jsonl'])
  expect((await store.readAudit({ limit: 2, hosts: new Set(['a']) })).map(r => r.at)).toEqual(['2026-09-30T23:59:00Z', '2026-10-01T01:00:00Z'])
  expect(await store.readAudit({ limit: 10 })).toHaveLength(4)
  expect(await store.readAudit({ limit: 10, sinceMs: Date.parse('2026-10-01') })).toHaveLength(2)
})
it('handles split UTF-8, missing files, malformed lines and unfinished tails', async () => {
  const file = join(dir, 'utf8.jsonl'), values = Array.from({ length: 1000 }, (_, i) => ({ i, text: '中文🙂'.repeat(20) }))
  await writeFile(file, values.map(r => JSON.stringify(r)).join('\n') + '\nnot-json\n{"torn":')
  const read: unknown[] = []
  for await (const value of reverseJsonLines(file)) read.push(value)
  expect(read).toEqual(values.reverse())
  expect(await Array.fromAsync(reverseJsonLines(join(dir, 'missing')))).toEqual([])
})
it('renders chronological disk and memory trends without treating failures as zeros', () => {
  const rows = [{ at: 'a', status: 'ok' as const, diskPct: { '/': 50 }, memAvailPct: 30, findings: [] }, { at: 'b', status: 'failed' as const, diskPct: {}, findings: [] }, { at: 'c', status: 'ok' as const, diskPct: { '/': 75 }, memAvailPct: 10, findings: [] }]
  expect(renderTrends(rows).join('\n')).toContain('+25.0 percentage points')
  expect(renderTrends(rows).join('\n')).toContain('-20.0 percentage points')
})
it('keeps only the newest inspection records per host and prunes audit months past retention', async () => {
  const store = new OpsStore(dir, { inspectionRecords: 10, auditMonths: 3 })
  for (let i = 0; i < 25; i++) await store.appendHistory('a', { at: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z`, status: 'ok', diskPct: { '/': i }, findings: [] })
  const kept = await store.readHistory('a', 100)
  expect(kept).toHaveLength(10)
  expect(kept[0]?.diskPct['/']).toBe(15)
  expect(kept.at(-1)?.diskPct['/']).toBe(24)
  expect((await readdir(join(dir, 'inspections'))).filter(n => n.endsWith('.tmp'))).toEqual([])
  await mkdir(join(dir, 'audit'), { recursive: true })
  for (const month of ['2026-02', '2026-07', '2026-08']) await writeFile(join(dir, 'audit', `${month}.jsonl`), JSON.stringify(row(`${month}-15T00:00:00Z`)) + '\n')
  await store.audit(row('2026-10-01T00:00:00Z'))
  expect((await readdir(join(dir, 'audit'))).sort()).toEqual(['2026-08.jsonl', '2026-10.jsonl'])
  expect(auditCutoffMonth(3, new Date('2026-10-15T00:00:00Z'))).toBe('2026-08')
  expect(auditCutoffMonth(12, new Date('2026-01-15T00:00:00Z'))).toBe('2025-02')
  // Legacy single-file history and a zero retention are left alone.
  const forever = new OpsStore(dir, { inspectionRecords: 10, auditMonths: 0 })
  await writeFile(join(dir, 'audit', '2020-01.jsonl'), JSON.stringify(row('2020-01-15T00:00:00Z')) + '\n')
  await forever.audit(row('2026-10-02T00:00:00Z'))
  expect(await forever.pruneAudit()).toEqual([])
  expect((await readdir(join(dir, 'audit'))).sort()).toEqual(['2020-01.jsonl', '2026-08.jsonl', '2026-10.jsonl'])
})
