import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { draftTask } from '../src/task-draft.ts'
import type { HostObservation } from '../src/task-draft.ts'
import type { HostProbe } from '../src/collectors/probe.ts'

const config = resolveConfig({ hosts: [{ name: 'gpu' }, { name: 'cpu', policy: { sudo: 'deny' } }], timeZone: 'Asia/Shanghai' })
const hosts = new Inventory(config.hosts, config.groups, config.defaultPolicy).hosts
const at = '2026-10-27T08:00:00Z', now = Date.parse(at)
const probe: HostProbe = { at, os: 'Test Linux', cores: 64, gpus: 4, privilege: 'sudo-nopasswd', scheduler: 'slurm', docker: 'usable', systemd: true }
const observed: HostObservation = { host: hosts.get('gpu')!, probe, history: { at, status: 'ok', diskPct: { '/': 93, '/data': 82 }, findings: [] } }

describe('automatic task drafts', () => {
  it('adapts to observed GPU, scheduler, containers, disk pressure and configured thresholds', () => {
    const before = JSON.stringify(observed)
    const result = draftTask([observed], 'custom', config, new Set(), now)
    expect(result.task).toMatchObject({ targets: 'gpu', playbook: 'custom', sudo: false, schedule: { daily: '08:30', timeZone: 'Asia/Shanghai' } })
    for (const text of ['GPU', '85°C', 'Slurm', '容器', '93%', at, 'ops_security', '80%', '不自动启用 sudo']) expect(result.task.instruction).toContain(text)
    expect(result.evidence[0]).toMatchObject({ host: 'gpu', probeAt: at, inspectionAt: at })
    expect(result.warnings).toEqual([])
    expect(JSON.stringify(observed)).toBe(before)
  })
  it('does not invent capabilities when no probe exists and respects denied sudo', () => {
    const result = draftTask([{ host: hosts.get('cpu')! }], 'inspect', config, new Set(), now)
    expect(result.task.instruction).not.toContain('检查 GPU')
    expect(result.task.instruction).not.toContain('检查 Slurm')
    expect(result.task.instruction).toContain('策略禁止 sudo')
    expect(result.task.sudo).toBe(false)
    expect(result.warnings).toContain('cpu 未探测，GPU、容器和调度器能力尚未确认。')
  })
  it('avoids name collisions, freezes exact targets and only suggests common observed data mounts', () => {
    const cpu = { host: hosts.get('cpu')!, history: { at, status: 'ok' as const, diskPct: { '/data': 20, '/home': 10 }, findings: [] } }
    const result = draftTask([observed, cpu], 'new-files', config, new Set(['gpu-fleet-new-files-daily', 'gpu-fleet-new-files-daily-2']), now)
    expect(result.task).toMatchObject({ name: 'gpu-fleet-new-files-daily-3', targets: 'gpu,cpu', paths: ['/data'], days: 1, sudo: false })
    const fallback = draftTask([{ host: hosts.get('cpu')! }], 'new-files', config, new Set(), now)
    expect(fallback.task.paths).toEqual(['/var/log'])
    expect(fallback.warnings.join(' ')).toContain('尚未确认')
  })
  it('labels stale observations and never claims history is the current state', () => {
    const result = draftTask([observed], 'disk', config, new Set(), now + 8 * 86_400_000)
    expect(result.warnings).toHaveLength(2)
    expect(result.task.instruction).toContain('以本次采集为准')
    expect(result.task.paths).toEqual(['/'])
    expect(result.task.instruction).not.toContain('检查 GPU')
  })
})
