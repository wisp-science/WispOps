import { describe, expect, it } from 'vitest'
import { buildOverview, DEFAULT_OVERVIEW_ROWS, MAX_OVERVIEW_ROWS, overviewLimit, overviewRows } from '../src/overview.ts'
import type { HistoryRecord } from '../src/store.ts'

const ok = (at: string, extra: Partial<HistoryRecord> = {}): HistoryRecord => ({ at, status: 'ok', diskPct: { '/': 40 }, memAvailPct: 60, findings: [], ...extra })

describe('fleet overview', () => {
  it('clamps the requested row count and falls back to the default', () => {
    expect(overviewLimit(undefined)).toBe(DEFAULT_OVERVIEW_ROWS)
    expect(overviewLimit('90')).toBe(DEFAULT_OVERVIEW_ROWS)
    expect(overviewLimit(Number.NaN)).toBe(DEFAULT_OVERVIEW_ROWS)
    expect(overviewLimit(0)).toBe(1)
    expect(overviewLimit(12.9)).toBe(12)
    expect(overviewLimit(10_000)).toBe(MAX_OVERVIEW_ROWS)
  })
  it('colors each inspection by its worst finding and marks failed runs unreachable', () => {
    const rows = overviewRows([
      ok('2026-10-01T00:00:00Z', { findings: [{ severity: 'info', code: 'note', message: 'fine' }] }),
      ok('2026-10-02T00:00:00Z', { findings: [{ severity: 'warn', code: 'disk-high', message: '/ 85%' }] }),
      ok('2026-10-03T00:00:00Z', { findings: [{ severity: 'warn', code: 'disk-high', message: '/ 91%' }, { severity: 'crit', code: 'disk-full', message: '/data 97%' }] }),
      { at: '2026-10-04T00:00:00Z', status: 'unreachable', diskPct: {}, findings: [{ severity: 'crit', code: 'unreachable', message: 'ssh: connect timed out' }] },
    ])
    expect(rows.map(r => r.state)).toEqual(['ok', 'warn', 'crit', 'unreachable'])
    // Informational findings are dropped; critical ones come first.
    expect(rows[0]!.findings).toEqual([])
    expect(rows[2]!.findings.map(f => f.code)).toEqual(['disk-full', 'disk-high'])
  })
  it('bounds findings per inspection, truncates long messages and drops non-numeric disk values', () => {
    const findings = Array.from({ length: 9 }, (_, i) => ({ severity: 'warn' as const, code: `w${i}`, message: 'x'.repeat(500) }))
    const [row] = overviewRows([ok('2026-10-01T00:00:00Z', { findings, diskPct: { '/': 40, '/bad': Number.NaN, '/str': 'n/a' as unknown as number } })])
    expect(row!.findings).toHaveLength(6)
    expect(row!.findings[0]!.message.length).toBeLessThanOrEqual(241)
    expect(row!.findings[0]!.message.endsWith('…')).toBe(true)
    expect(Object.keys(row!.diskPct)).toEqual(['/'])
  })
  it('keeps inventory order, applies the limit per host and summarizes the latest state', () => {
    const history = Array.from({ length: 5 }, (_, i) => ok(`2026-10-0${i + 1}T00:00:00Z`, { diskPct: { '/': 40 + i } }))
    const view = buildOverview([
      { name: 'b', groups: ['gpu'], history },
      { name: 'a', groups: [], history: [] },
      { name: 'c', groups: [], history: [ok('2026-10-01T00:00:00Z', { findings: [{ severity: 'crit', code: 'disk-full', message: 'x' }] })] },
    ], 3, new Date('2026-10-27T00:00:00Z'))
    expect(view.hosts.map(h => h.name)).toEqual(['b', 'a', 'c'])
    expect(view.hosts[0]!.rows.map(r => r.diskPct['/'])).toEqual([42, 43, 44])
    expect(view.hosts.map(h => h.latest)).toEqual(['ok', 'never', 'crit'])
    expect(view.summary).toEqual({ ok: 1, warn: 0, crit: 1, unreachable: 0, never: 1 })
    expect(view).toMatchObject({ limit: 3, generatedAt: '2026-10-27T00:00:00.000Z' })
  })
})
