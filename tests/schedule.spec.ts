import { describe, expect, it } from 'vitest'
import { missedRun, previousDue, zonedParts, zonedToUtc } from '../src/schedule.ts'

describe('schedule arithmetic', () => {
  it('converts wall-clock times in a zone, including DST transitions', () => {
    expect(zonedToUtc({ year: 2026, month: 10, day: 27, hour: 8, minute: 30 }, 'Asia/Shanghai')).toBe(Date.parse('2026-10-27T00:30:00Z'))
    expect(zonedToUtc({ year: 2026, month: 10, day: 27, hour: 8, minute: 30 }, 'UTC')).toBe(Date.parse('2026-10-27T08:30:00Z'))
    // New York leaves DST on 2026-11-01: 08:30 local is 12:30Z before and 13:30Z after.
    expect(zonedToUtc({ year: 2026, month: 10, day: 31, hour: 8, minute: 30 }, 'America/New_York')).toBe(Date.parse('2026-10-31T12:30:00Z'))
    expect(zonedToUtc({ year: 2026, month: 11, day: 2, hour: 8, minute: 30 }, 'America/New_York')).toBe(Date.parse('2026-11-02T13:30:00Z'))
    expect(zonedParts(Date.parse('2026-10-27T00:30:00Z'), 'Asia/Shanghai')).toEqual({ year: 2026, month: 10, day: 27, hour: 8, minute: 30, weekday: 2 })
    expect(() => zonedParts(0, 'Not/AZone')).toThrow()
  })

  it('finds the latest daily and weekly slot at or before now', () => {
    const now = Date.parse('2026-10-27T01:00:00Z') // Tuesday 09:00 in Shanghai
    expect(previousDue({ daily: '08:30' }, 'Asia/Shanghai', now)).toBe(Date.parse('2026-10-27T00:30:00Z'))
    expect(previousDue({ daily: '09:30' }, 'Asia/Shanghai', now)).toBe(Date.parse('2026-10-26T01:30:00Z'))
    expect(previousDue({ daily: '09:00' }, 'Asia/Shanghai', now)).toBe(now)
    expect(previousDue({ daily: '08:30', timeZone: 'UTC' }, 'Asia/Shanghai', now)).toBe(Date.parse('2026-10-26T08:30:00Z'))
    // Weekly on Mondays and Fridays: the Monday slot was the last one.
    expect(previousDue({ daily: '08:30', weekdays: [1, 5] }, 'Asia/Shanghai', now)).toBe(Date.parse('2026-10-26T00:30:00Z'))
    expect(previousDue({ daily: '10:00', weekdays: [2] }, 'Asia/Shanghai', now)).toBe(Date.parse('2026-10-20T02:00:00Z'))
    expect(previousDue({ cron: '0 8 * * *' }, 'UTC', now)).toBeUndefined()
    expect(previousDue({ everyMinutes: 30 }, 'UTC', now)).toBeUndefined()
  })

  it('reports a missed slot only after the grace period and when no run covered it', () => {
    const due = Date.parse('2026-10-27T00:30:00Z')
    const schedule = { daily: '08:30', timeZone: 'Asia/Shanghai' }
    expect(missedRun(schedule, 'UTC', undefined, due + 10 * 60_000)).toEqual({ dueAt: new Date(due).toISOString(), missed: false })
    expect(missedRun(schedule, 'UTC', undefined, due + 45 * 60_000)).toEqual({ dueAt: new Date(due).toISOString(), missed: true })
    expect(missedRun(schedule, 'UTC', new Date(due + 2 * 60_000).toISOString(), due + 45 * 60_000).missed).toBe(false)
    expect(missedRun(schedule, 'UTC', new Date(due - 3 * 60_000).toISOString(), due + 45 * 60_000).missed).toBe(false)
    expect(missedRun(schedule, 'UTC', new Date(due - 86_400_000).toISOString(), due + 45 * 60_000).missed).toBe(true)
    expect(missedRun({ everyMinutes: 15 }, 'UTC', undefined, due).missed).toBe(false)
    expect(missedRun({ everyMinutes: 15 }, 'UTC', new Date(due).toISOString(), due + 20 * 60_000).missed).toBe(false)
    expect(missedRun({ everyMinutes: 15 }, 'UTC', new Date(due).toISOString(), due + 50 * 60_000)).toEqual({ dueAt: new Date(due + 15 * 60_000).toISOString(), missed: true })
    expect(missedRun({ cron: '0 8 * * *' }, 'UTC', undefined, due + 86_400_000)).toEqual({ missed: false })
  })
})
