/**
 * Automatic fleet inspection: the owner picks an interval in the fleet
 * overview, and the plugin inspects every server whose newest saved
 * inspection is older than that, read-only and without sudo, whether or not
 * the panel is open. Inspections from tools, tasks and the panel count too,
 * so a server is never inspected more often than the interval asks. The
 * interval is local to this device and is not synced.
 * @module dsh-wisp-ops/auto-inspect
 */
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { INSPECT_SCRIPT } from './collectors/inspect.ts'
import type { Host } from './inventory.ts'
import { LocalState } from './local-state.ts'
import type { OpsService } from './service.ts'

/** Intervals the panel offers, in minutes; 0 is off. */
export const AUTO_INSPECT_MINUTES: readonly number[] = [0, 5, 15, 30, 60, 180, 360, 720, 1440]
const TICK_MS = 60_000

export interface AutoInspectState { version: 1; intervalMinutes: number }
export interface AutoInspectStatus { intervalMinutes: number; running: boolean; nextAt?: string }

export function autoInspectStore(dataDir: string) {
  return new LocalState<AutoInspectState>(join(dataDir, 'auto-inspect.json'), () => ({ version: 1, intervalMinutes: 0 }), value => {
    const raw = value as AutoInspectState
    if (raw?.version !== 1 || !AUTO_INSPECT_MINUTES.includes(raw.intervalMinutes)) throw new Error('Invalid auto inspection state')
    return { version: 1, intervalMinutes: raw.intervalMinutes }
  })
}

/** Audit rows name the built-in script by digest; its full text every few minutes would swamp the log. */
export const AUTO_INSPECT_AUDIT = `built-in inspection script sha256:${createHash('sha256').update(INSPECT_SCRIPT).digest('hex').slice(0, 16)}`

export class AutoInspector {
  readonly state
  private running = false
  constructor(private readonly service: OpsService, private readonly inspect: (host: Host) => Promise<unknown>, private readonly now: () => number = Date.now) {
    this.state = autoInspectStore(service.config.dataDir)
  }

  /** Start ticking; the returned function stops the timer. */
  start(tickMs = TICK_MS): () => void {
    const tick = () => { void this.tick().catch(() => {}) }
    const timer = setInterval(tick, tickMs)
    timer.unref()
    tick()
    return () => clearInterval(timer)
  }

  async interval(): Promise<number> {
    return (await this.state.read()).value.intervalMinutes
  }

  async set(minutes: unknown): Promise<number> {
    if (typeof minutes !== 'number' || !AUTO_INSPECT_MINUTES.includes(minutes)) throw new Error('自动巡检间隔不正确。')
    const { revision } = await this.state.read()
    await this.state.change(revision, () => ({ version: 1, intervalMinutes: minutes }))
    // Servers already overdue start now rather than on the next tick.
    if (minutes > 0) void this.tick().catch(() => {})
    return minutes
  }

  /** The interval and when the next server falls due, from each server's newest inspection time. */
  async status(latest: readonly (string | undefined)[]): Promise<AutoInspectStatus> {
    const intervalMinutes = await this.interval()
    if (intervalMinutes === 0 || latest.length === 0) return { intervalMinutes, running: this.running }
    const now = this.now()
    const due = latest.map(at => {
      const time = at === undefined ? Number.NaN : Date.parse(at)
      return Number.isFinite(time) ? time + intervalMinutes * 60_000 : now
    })
    return { intervalMinutes, running: this.running, nextAt: new Date(Math.max(now, Math.min(...due))).toISOString() }
  }

  /** One pass: inspect every server whose newest inspection is older than the interval. */
  async tick(): Promise<void> {
    if (this.running) return
    const minutes = await this.interval()
    if (minutes === 0) return
    this.running = true
    try {
      await this.service.refresh()
      // Half a tick of slack, so a five-minute interval does not slip to six on a one-minute timer.
      const cutoff = this.now() - minutes * 60_000 + TICK_MS / 2
      const due: Host[] = []
      for (const host of this.service.inventory.hosts.values()) {
        const at = (await this.service.store.readHistory(host.name, 1))[0]?.at
        if (at === undefined || !(Date.parse(at) > cutoff)) due.push(host)
      }
      let next = 0
      const worker = async () => {
        while (next < due.length) await this.inspect(due[next++] as Host).catch(() => {})
      }
      await Promise.all(Array.from({ length: Math.min(this.service.config.ssh.concurrency, due.length) }, worker))
    } finally {
      this.running = false
    }
  }
}
