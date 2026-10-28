import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { OpsService } from '../src/service.ts'
import { noSecrets } from '../src/secrets.ts'
import { TaskRunner } from '../src/runner.ts'
import { dueNow, nextDue } from '../src/schedule.ts'
import { scriptStore, validateScript } from '../src/check-scripts.ts'
import type { RunResult } from '../src/ssh.ts'

describe('timer arithmetic', () => {
  const zone = 'Asia/Shanghai'
  const slot = Date.parse('2026-10-27T00:30:00Z') // 08:30 Tuesday in Shanghai
  it('waits for the first slot after enabling and runs each slot once', () => {
    const enabledAt = new Date(slot - 2 * 3_600_000).toISOString()
    expect(dueNow({ daily: '08:30' }, zone, undefined, enabledAt, slot - 60_000)).toBe(false)
    expect(dueNow({ daily: '08:30' }, zone, undefined, enabledAt, slot + 60_000)).toBe(true)
    expect(dueNow({ daily: '08:30' }, zone, new Date(slot + 30_000).toISOString(), enabledAt, slot + 3_600_000)).toBe(false)
    expect(dueNow({ daily: '08:30' }, zone, new Date(slot - 86_400_000).toISOString(), enabledAt, slot + 3_600_000)).toBe(true)
    // Enabled after today's slot: nothing until tomorrow.
    expect(dueNow({ daily: '08:30' }, zone, undefined, new Date(slot + 3_600_000).toISOString(), slot + 2 * 3_600_000)).toBe(false)
    expect(nextDue({ daily: '08:30' }, zone, undefined, new Date(slot + 3_600_000).toISOString(), slot + 2 * 3_600_000)).toBe(slot + 86_400_000)
    expect(nextDue({ daily: '08:30' }, zone, undefined, enabledAt, slot + 60_000)).toBe(slot + 60_000)
    // Weekly on Fridays: next slot is Friday.
    expect(nextDue({ daily: '08:30', weekdays: [5] }, zone, undefined, enabledAt, slot + 60_000)).toBe(slot + 3 * 86_400_000)
    expect(dueNow({ cron: '0 8 * * *' }, zone, undefined, enabledAt, slot + 60_000)).toBe(false)
    expect(nextDue({ cron: '0 8 * * *' }, zone, undefined, enabledAt, slot)).toBeUndefined()
  })
  it('counts intervals from the later of the last run and enabling', () => {
    const enabledAt = new Date(slot).toISOString()
    expect(dueNow({ everyMinutes: 30 }, zone, undefined, enabledAt, slot + 29 * 60_000)).toBe(false)
    expect(dueNow({ everyMinutes: 30 }, zone, undefined, enabledAt, slot + 30 * 60_000)).toBe(true)
    expect(dueNow({ everyMinutes: 30 }, zone, new Date(slot + 40 * 60_000).toISOString(), enabledAt, slot + 60 * 60_000)).toBe(false)
    expect(nextDue({ everyMinutes: 30 }, zone, new Date(slot + 40 * 60_000).toISOString(), enabledAt, slot + 60 * 60_000)).toBe(slot + 70 * 60_000)
  })
})

describe('WispOps timer', () => {
  let dir: string, service: OpsService, now: number
  const result = (host: string, over: Partial<RunResult> = {}): RunResult => ({ host, status: 'ok', exitCode: 0, stdout: 'fine\n', stderr: '', truncated: false, durationMs: 1, ...over })
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'wisp-runner-'))
    now = Date.parse('2026-10-27T00:31:00Z')
    const config = resolveConfig({ dataDir: dir, inventoryFile: join(dir, 'inventory.yml'), timeZone: 'Asia/Shanghai', denyPatterns: ['secret-file'], hosts: [{ name: 'a' }, { name: 'b', policy: { sudo: 'deny' } }], tasks: [
      { name: 'quiet', targets: 'a', playbook: 'script', script: 'load', report: 'problems', schedule: { daily: '08:30' } },
      { name: 'silent', targets: 'a,b', playbook: 'script', script: 'load', report: 'never', schedule: { everyMinutes: 30 } },
      { name: 'manual', targets: 'a', playbook: 'inspect', report: 'problems' },
      { name: 'agent', targets: 'a', playbook: 'inspect', schedule: { daily: '08:30' } },
      { name: 'elevated', targets: 'b', playbook: 'script', script: 'load', report: 'never', sudo: true, schedule: { everyMinutes: 5 } },
      { name: 'denied', targets: 'a', playbook: 'script', script: 'denied', report: 'never', schedule: { everyMinutes: 5 } },
    ] })
    service = new OpsService(config, await Inventory.load(config), noSecrets)
    await service.refresh()
    const store = scriptStore(dir)
    await store.change((await store.read()).revision, state => ({ ...state, entries: [validateScript({ id: 'load', title: 'Load', content: 'uptime' }), validateScript({ id: 'denied', title: 'Denied', content: 'cat /etc/secret-file' })] }))
  })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('runs due tasks without an agent, records and escalates only problems to an open session', async () => {
    const execute = vi.spyOn(service, 'execute').mockImplementation(async hosts => hosts.map(h => result(h.name)))
    const followup = vi.fn()
    const runner = new TaskRunner(service, id => id === 'live' ? { followup } : undefined, () => now)
    await runner.enable('quiet', 'live')
    await runner.enable('silent', undefined)
    await runner.enable('agent', 'live')
    // Enabled one minute after today's slot: the daily task waits until tomorrow, the interval task until 30 minutes pass.
    await runner.tick()
    expect(execute).not.toHaveBeenCalled()
    // A task that reports through the agent never belongs to the timer.
    expect(Object.keys(await runner.entries()).sort()).toEqual(['quiet', 'silent'])
    now += 30 * 60_000
    await runner.tick()
    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls[0]![2]).toMatchObject({ authorization: 'task', sudo: false, risk: 'read', tool: 'ops_task:silent', timeoutMs: 120_000 })
    expect(execute.mock.calls[0]![2].auditCommand).toContain('check script load sha256:')
    const silent = JSON.parse((await readFile(join(dir, 'tasks', 'silent.jsonl'), 'utf8')).trim())
    expect(silent).toMatchObject({ playbook: 'script', counts: { ok: 2 }, outcomes: [{ host: 'a', verdict: 'ok', summary: 'fine' }, { host: 'b', verdict: 'ok' }] })
    expect(silent.outcomes[0].evidence).toBeUndefined()
    expect(silent.scriptSha256).toHaveLength(64)
    expect(followup).not.toHaveBeenCalled()
    // Tomorrow's slot: the problems task finds a warning and queues the read-only escalation.
    execute.mockImplementation(async hosts => hosts.map(h => result(h.name, { status: 'failed', exitCode: 1, stdout: 'load 9.5 on 4 cores\n' })))
    now = Date.parse('2026-10-28T00:31:00Z')
    await runner.tick()
    expect(followup).toHaveBeenCalledTimes(1)
    const prompt = JSON.stringify(followup.mock.calls[0]![0])
    expect(prompt).toContain('mode=\\"last\\"')
    expect(prompt).toContain('do not run the task again')
    expect((await runner.entries()).quiet?.pendingEscalation).toBeUndefined()
    // The same slot is not run twice.
    await runner.tick()
    expect(followup).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls.filter(c => c[2].tool === 'ops_task:quiet')).toHaveLength(1)
    const lastRun = JSON.parse((await readFile(join(dir, 'tasks', 'quiet.jsonl'), 'utf8')).trim()).at as string
    expect((await runner.status(service.inventory.tasks.get('quiet')!, lastRun))?.nextAt).toBe('2026-10-29T00:30:00.000Z')
    // Without any recorded run the panel shows the slot as due now.
    expect((await runner.status(service.inventory.tasks.get('quiet')!, undefined))?.nextAt).toBe(new Date(now).toISOString())
  })

  it('keeps an escalation pending while the session is closed and delivers it later', async () => {
    vi.spyOn(service, 'execute').mockImplementation(async hosts => hosts.map(h => result(h.name, { status: 'failed', exitCode: 2, stdout: 'disk full\n' })))
    const followup = vi.fn()
    let open = false
    const runner = new TaskRunner(service, id => open && id === 'live' ? { followup } : undefined, () => now)
    const outcome = await runner.run(service.inventory.tasks.get('quiet')!, 'live')
    expect(outcome.record?.counts).toEqual({ crit: 1 })
    expect(outcome.escalated).toBe(false)
    expect(followup).not.toHaveBeenCalled()
    await runner.enable('quiet', 'live')
    await runner.run(service.inventory.tasks.get('quiet')!, 'live')
    expect((await runner.entries()).quiet).toMatchObject({ pendingEscalation: expect.any(String), lastError: expect.stringContaining('未打开') })
    open = true
    await runner.tick()
    expect(followup).toHaveBeenCalledTimes(1)
    expect((await runner.entries()).quiet?.pendingEscalation).toBeUndefined()
    expect((await runner.entries()).quiet?.lastError).toBeUndefined()
  })

  it('fails closed on denied sudo and deny-listed scripts, recording the reason without running anything', async () => {
    const execute = vi.spyOn(service, 'execute')
    const runner = new TaskRunner(service, undefined, () => now)
    await runner.enable('elevated', undefined)
    await runner.enable('denied', undefined)
    now += 6 * 60_000
    await runner.tick()
    expect(execute).not.toHaveBeenCalled()
    const entries = await runner.entries()
    expect(entries.elevated?.lastError).toContain('denies sudo')
    expect(entries.denied?.lastError).toContain('deny list')
    await expect(readFile(join(dir, 'tasks', 'denied.jsonl'), 'utf8')).rejects.toThrow()
  })
})
