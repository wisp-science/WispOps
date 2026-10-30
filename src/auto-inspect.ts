/**
 * Automatic fleet inspection: the owner picks an interval in the fleet
 * overview, and the plugin inspects every server whose newest saved
 * inspection is older than that, read-only and without sudo, whether or not
 * the panel is open. Inspections from tools, tasks and the panel count too,
 * so a server is never inspected more often than the interval asks. The
 * interval is local to this device and is not synced.
 *
 * While it is on, each pass also compares every server's newest state (with
 * the owner's mutes applied) with the state it last reported, and sends the
 * changes — worse, unreachable, recovered — to the chosen notification
 * channels. The first state seen for a server is a baseline, not an alert.
 * @module dsh-wisp-ops/auto-inspect
 */
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { INSPECT_SCRIPT } from './collectors/inspect.ts'
import type { Host } from './inventory.ts'
import { LocalState } from './local-state.ts'
import { muteFor } from './mutes.ts'
import type { Mute } from './mutes.ts'
import { deliver } from './notifier.ts'
import { recordState } from './overview.ts'
import type { OverviewState } from './overview.ts'
import type { OpsService } from './service.ts'
import type { HistoryRecord } from './store.ts'

/** Intervals the panel offers, in minutes; 0 is off. */
export const AUTO_INSPECT_MINUTES: readonly number[] = [0, 5, 15, 30, 60, 180, 360, 720, 1440]
const TICK_MS = 60_000
const STATES: readonly OverviewState[] = ['ok', 'warn', 'crit', 'unreachable']

export interface AutoInspectState {
  version: 1
  intervalMinutes: number
  /** Notification channels that receive state changes. */
  notify: string[]
  /** The state last reported per server, so only changes are sent. */
  notified: Record<string, OverviewState>
  /** The latest alert and the channels it could not reach. */
  lastAlert?: { at: string; failed: string[] }
}
export interface AutoInspectStatus { intervalMinutes: number; running: boolean; nextAt?: string; notify: string[]; lastAlert?: { at: string; failed: string[] } }

export function autoInspectStore(dataDir: string) {
  const empty = (): AutoInspectState => ({ version: 1, intervalMinutes: 0, notify: [], notified: {} })
  return new LocalState<AutoInspectState>(join(dataDir, 'auto-inspect.json'), empty, value => {
    const raw = value as AutoInspectState
    if (raw?.version !== 1 || !AUTO_INSPECT_MINUTES.includes(raw.intervalMinutes)) throw new Error('Invalid auto inspection state')
    // Files from before alerts have neither field.
    const notify = raw.notify ?? []
    if (!Array.isArray(notify) || notify.some(c => typeof c !== 'string')) throw new Error('Invalid auto inspection channels')
    const notified: Record<string, OverviewState> = {}
    for (const [name, state] of Object.entries(raw.notified ?? {})) {
      if (!STATES.includes(state)) throw new Error('Invalid auto inspection state')
      Object.defineProperty(notified, name, { value: state, enumerable: true, writable: true, configurable: true })
    }
    const last = raw.lastAlert
    return {
      version: 1, intervalMinutes: raw.intervalMinutes, notify: [...new Set(notify)], notified,
      ...last && typeof last.at === 'string' && Array.isArray(last.failed) ? { lastAlert: { at: last.at, failed: last.failed.filter(c => typeof c === 'string') } } : {},
    }
  })
}

/** Audit rows name the built-in script by digest; its full text every few minutes would swamp the log. */
export const AUTO_INSPECT_AUDIT = `built-in inspection script sha256:${createHash('sha256').update(INSPECT_SCRIPT).digest('hex').slice(0, 16)}`

const LABEL: Record<OverviewState, string> = { ok: 'healthy', warn: 'warning', crit: 'critical', unreachable: 'unreachable' }

/** One line per server whose state changed, with what it is about now. */
export function alertMessage(changes: readonly { host: string; before: OverviewState; after: OverviewState; record: HistoryRecord; mutes?: readonly Mute[] }[], now: number): string {
  const lines = changes.map(({ host, before, after, record, mutes }) => {
    const live = (record.findings ?? []).filter(f => (f.severity === 'crit' || f.severity === 'warn') && !muteFor(f, mutes, now))
    const detail = after === 'ok' ? '' : ` — ${live.slice(0, 2).map(f => f.message.slice(0, 160)).join('; ')}${live.length > 2 ? ` (+${live.length - 2})` : ''}`
    return `- **${host}**: ${LABEL[before]} → ${LABEL[after]}${detail}`
  })
  return `## WispOps: server state changed\n${new Date(now).toISOString()}\n\n${lines.join('\n')}`.slice(0, 3400)
}

export class AutoInspector {
  readonly state
  private running = false
  constructor(private readonly service: OpsService, private readonly inspect: (host: Host) => Promise<unknown>, private readonly now: () => number = Date.now, private readonly send: typeof fetch = fetch) {
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
    await this.edit(state => { state.intervalMinutes = minutes })
    // Servers already overdue start now rather than on the next tick.
    if (minutes > 0) void this.tick().catch(() => {})
    return minutes
  }

  /** Choose the channels for state-change alerts; only channels in the configuration are accepted. */
  async setNotify(channels: unknown): Promise<string[]> {
    if (!Array.isArray(channels) || channels.some(c => typeof c !== 'string' || !Object.hasOwn(this.service.config.notifications, c))) throw new Error('通知渠道不存在，请检查 notifications 配置。')
    const notify = [...new Set(channels as string[])]
    await this.edit(state => { state.notify = notify })
    return notify
  }

  /** The interval and when the next server falls due, from each server's newest inspection time. */
  async status(latest: readonly (string | undefined)[]): Promise<AutoInspectStatus> {
    const { intervalMinutes, notify, lastAlert } = (await this.state.read()).value
    const base = { intervalMinutes, running: this.running, notify, ...lastAlert === undefined ? {} : { lastAlert } }
    if (intervalMinutes === 0 || latest.length === 0) return base
    const now = this.now()
    const due = latest.map(at => {
      const time = at === undefined ? Number.NaN : Date.parse(at)
      return Number.isFinite(time) ? time + intervalMinutes * 60_000 : now
    })
    return { ...base, nextAt: new Date(Math.max(now, Math.min(...due))).toISOString() }
  }

  /** One pass: inspect every server whose newest inspection is older than the interval, then report state changes. */
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
      await this.alert()
    } finally {
      this.running = false
    }
  }

  /** Compare each server's newest state with the one last reported, and send the changes to the chosen channels. */
  async alert(): Promise<void> {
    const { value } = await this.state.read()
    const now = this.now()
    const notified: Record<string, OverviewState> = {}
    const changes: Parameters<typeof alertMessage>[0][number][] = []
    for (const host of this.service.inventory.hosts.values()) {
      const record = (await this.service.store.readHistory(host.name, 1))[0]
      if (record === undefined) continue
      const after = recordState(record, host.mutes, now)
      Object.defineProperty(notified, host.name, { value: after, enumerable: true, writable: true, configurable: true })
      const before = Object.hasOwn(value.notified, host.name) ? value.notified[host.name] : undefined
      if (before !== undefined && before !== after) changes.push({ host: host.name, before, after, record, ...host.mutes === undefined ? {} : { mutes: host.mutes } })
    }
    if (JSON.stringify(notified) === JSON.stringify(value.notified)) return
    const deliveries = changes.length > 0 && value.notify.length > 0
      ? await Promise.all(value.notify.map(channel => deliver(this.service.config, channel, alertMessage(changes, now), undefined, this.send)))
      : undefined
    await this.edit(state => {
      state.notified = notified
      if (deliveries !== undefined) state.lastAlert = { at: new Date(now).toISOString(), failed: deliveries.filter(d => d.status === 'failed').map(d => d.channel) }
    })
  }

  private async edit(update: (state: AutoInspectState) => void): Promise<void> {
    const { revision } = await this.state.read()
    await this.state.change(revision, state => { update(state); return state })
  }
}
