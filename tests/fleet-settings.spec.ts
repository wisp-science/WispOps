import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AutoInspector, alertMessage } from '../src/auto-inspect.ts'
import { evaluate, INSPECT_SCRIPT, parseInspection } from '../src/collectors/inspect.ts'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { OpsManager } from '../src/management.ts'
import { muteFor } from '../src/mutes.ts'
import { overviewRows, recordState } from '../src/overview.ts'
import { noSecrets } from '../src/secrets.ts'
import { OpsService } from '../src/service.ts'
import { parseServiceResults, validateChecks, withServiceChecks } from '../src/service-checks.ts'
import type { RunResult } from '../src/ssh.ts'
import type { HistoryRecord } from '../src/store.ts'
import { LocalVault, routeSecrets } from '../src/vault.ts'

describe('service checks', () => {
  it('accepts units, ports and http(s) URLs and rejects anything else', () => {
    expect(validateChecks([{ kind: 'unit', name: 'nginx.service' }, { kind: 'port', port: 443 }, { kind: 'http', url: 'https://127.0.0.1:8443/health' }])).toHaveLength(3)
    for (const bad of [[{ kind: 'unit', name: 'x; rm -rf /' }], [{ kind: 'port', port: 70000 }], [{ kind: 'http', url: 'file:///etc/passwd' }], [{ kind: 'http', url: 'http://u:p@h/' }], [{ kind: 'http', url: 'http://h/a b' }], [{ kind: 'unit', name: 'a' }, { kind: 'unit', name: 'a' }], [{ kind: 'exec', cmd: 'id' }], 'nginx']) {
      expect(() => validateChecks(bad)).toThrow()
    }
    expect(() => validateChecks(Array.from({ length: 21 }, (_, i) => ({ kind: 'port', port: i + 1 })))).toThrow()
  })
  it('adds quoted checks before the end marker, keeping the script valid shell', () => {
    const script = withServiceChecks(INSPECT_SCRIPT, validateChecks([{ kind: 'unit', name: 'nginx' }, { kind: 'port', port: 8080 }, { kind: 'http', url: "http://127.0.0.1/a'$(id)'" }]))
    expect(script.indexOf('@@svc')).toBeLessThan(script.lastIndexOf('@@end'))
    expect(script).toContain(`'http://127.0.0.1/a'\\''$(id)'\\'''`)
    expect(() => execFileSync('sh', ['-n'], { input: script })).not.toThrow()
    expect(withServiceChecks(INSPECT_SCRIPT, [])).toBe(INSPECT_SCRIPT)
  })
  it('turns failing checks into critical findings about each service', () => {
    const results = parseServiceResults(['unit\tnginx\tactive', 'unit\tredis\tfailed', 'port\t8080\tclosed', 'http\thttps://h/health\t200', 'http\thttps://h/api\t502', 'http\thttps://h/x\t000', 'bogus\tline'])
    expect(results.map(r => r.ok)).toEqual([true, false, false, true, false, false])
    const report = parseInspection(`@@kv\n@@svc\n${['unit\tredis\tfailed', 'port\t8080\tclosed', 'http\thttps://h/x\t000'].join('\n')}\n@@end\n`)
    expect(evaluate(report, resolveConfig().thresholds).filter(f => f.code === 'service-down').map(f => [f.severity, f.subject, f.message])).toEqual([
      ['crit', 'redis', 'redis is failed'], ['crit', '8080', 'port 8080 is not listening'], ['crit', 'https://h/x', 'https://h/x answered nothing'],
    ])
  })
})

describe('mutes', () => {
  const disk: HistoryRecord = { at: '2026-10-29T00:00:00Z', status: 'ok', diskPct: { '/data5': 99 }, findings: [{ severity: 'crit', code: 'disk-full', message: '/data5 99% used', subject: '/data5' }, { severity: 'warn', code: 'memory-low', message: 'memory available 9%' }] }
  const now = Date.parse('2026-10-29T12:00:00Z')
  it('covers one subject or a whole code until the mute ends', () => {
    expect(muteFor(disk.findings[0]!, [{ code: 'disk-full', subject: '/data5' }], now)).toBeDefined()
    expect(muteFor(disk.findings[0]!, [{ code: 'disk-full', subject: '/home' }], now)).toBeUndefined()
    // Older records have no subject; the leading path of the message stands in.
    expect(muteFor({ code: 'disk-full', message: '/data5 99% used' }, [{ code: 'disk-full', subject: '/data5' }], now)).toBeDefined()
    expect(muteFor(disk.findings[0]!, [{ code: 'disk-full', until: '2026-10-29T11:00:00Z' }], now)).toBeUndefined()
  })
  it('stops a muted problem from coloring the server, and lists it last with its mute', () => {
    expect(recordState(disk, undefined, now)).toBe('crit')
    expect(recordState(disk, [{ code: 'disk-full', subject: '/data5' }], now)).toBe('warn')
    expect(recordState(disk, [{ code: 'disk-full' }, { code: 'memory-low' }], now)).toBe('ok')
    const [row] = overviewRows([disk], [{ code: 'disk-full', subject: '/data5', until: '2026-11-05T00:00:00Z' }], now)
    expect(row!.state).toBe('warn')
    expect(row!.findings.map(f => [f.code, f.subject, f.mute?.until])).toEqual([['memory-low', undefined, undefined], ['disk-full', '/data5', '2026-11-05T00:00:00Z']])
  })
})

let dir: string, service: OpsService, manager: OpsManager
const OUTPUT = `@@login\n@@kv\nhostname=a\n@@df\nFilesystem Type 1024-blocks Used Available Capacity Mounted on\n/dev/sda1 ext4 1000 850 150 85% /\n@@svc\nunit\tnginx\tfailed\n@@end\n`
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wisp-settings-'))
  process.env.WISP_TEST_HOOK = 'https://hooks.example.invalid/wisp'
  const config = resolveConfig({ dataDir: dir, hosts: [{ name: 'a', ssh: '192.0.2.1' }, { name: 'b', ssh: '192.0.2.2' }], notifications: { ops: { kind: 'webhook', urlEnv: 'WISP_TEST_HOOK' } } })
  service = new OpsService(config, await Inventory.load(config), routeSecrets(new LocalVault(dir, async () => new Uint8Array(32).fill(7)), noSecrets))
  await service.refresh()
  manager = new OpsManager(service, new LocalVault(dir, async () => new Uint8Array(32).fill(7)), () => undefined)
})
afterEach(async () => { delete process.env.WISP_TEST_HOOK; vi.restoreAllMocks(); await rm(dir, { recursive: true, force: true }) })
const revision = async () => (await manager.dispatch({ action: 'snapshot' }) as any).revision as string
/** Answers every inspection with OUTPUT and keeps the scripts that would have run. */
function fakeRunner() {
  const scripts: Record<string, string> = {}
  vi.spyOn(service.runner, 'runMany').mockImplementation(async (hosts, build) => Promise.all(hosts.map(async host => {
    scripts[host.name] = (await build(host)).script
    return { host: host.name, status: 'ok', exitCode: 0, stdout: OUTPUT, stderr: '', truncated: false, durationMs: 5, firstOutputMs: 120 } satisfies RunResult
  })))
  return scripts
}

describe('per-server settings', () => {
  it('runs each server with its own checks and thresholds, and keeps muted problems out of its severity', async () => {
    await manager.dispatch({ action: 'setServiceChecks', host: 'a', checks: [{ kind: 'unit', name: 'nginx' }], revision: await revision() })
    await manager.dispatch({ action: 'setThresholds', host: 'b', thresholds: { diskWarnPct: 90 }, revision: await revision() })
    await expect(manager.dispatch({ action: 'setThresholds', host: 'b', thresholds: { noSuch: 1 }, revision: await revision() })).rejects.toThrow('巡检阈值格式不正确')
    await expect(manager.dispatch({ action: 'setServiceChecks', host: 'a', checks: [{ kind: 'unit', name: '$(id)' }], revision: await revision() })).rejects.toThrow('服务检查格式不正确')
    const snapshot = await manager.dispatch({ action: 'snapshot' }) as any
    expect(snapshot.hosts.find((h: any) => h.name === 'a').serviceChecks).toEqual([{ kind: 'unit', name: 'nginx' }])
    expect(snapshot.thresholds.diskWarnPct).toBe(80)
    const scripts = fakeRunner()
    const fleet = await service.inspect([...service.inventory.hosts.values()], { sudo: false, authorization: 'read-only', tool: 'test' })
    expect(scripts.a).toContain("systemctl is-active 'nginx'")
    expect(scripts.b).not.toContain('@@svc')
    const codes = (name: string) => fleet.hosts.find(h => h.host === name)!.findings.map(f => f.code)
    expect(codes('a')).toEqual(expect.arrayContaining(['service-down', 'disk-high']))
    expect(codes('b')).not.toContain('disk-high')
    expect(fleet.hosts.find(h => h.host === 'a')!.report?.loginMs).toBe(120)

    await manager.dispatch({ action: 'muteFinding', host: 'a', code: 'service-down', subject: 'nginx', days: 7 })
    await manager.dispatch({ action: 'muteFinding', host: 'a', code: 'disk-high' })
    await expect(manager.dispatch({ action: 'muteFinding', host: 'a', code: 'x', days: 0 })).rejects.toThrow('1–365')
    const again = await service.inspect([service.inventory.hosts.get('a')!], { sudo: false, authorization: 'read-only', tool: 'test' })
    expect(again.hosts[0]).toMatchObject({ severity: 'ok' })
    expect(again.hosts[0]!.findings.filter(f => f.muted).map(f => f.code).sort()).toEqual(['disk-high', 'service-down'])
    const view = await manager.dispatch({ action: 'overview' }) as any
    expect(view.hosts[0].latest).toBe('ok')
    // Unmuting the disk brings its warning back; the service stays muted for its seven days.
    await manager.dispatch({ action: 'unmuteFinding', host: 'a', code: 'disk-high' })
    expect((await manager.dispatch({ action: 'overview' }) as any).hosts[0].latest).toBe('warn')
  })
})

describe('deny list', () => {
  it('refuses a service check at save time and skips it at run time when a later rule denies it', async () => {
    const strict = resolveConfig({ dataDir: dir, hosts: [{ name: 'a', ssh: '192.0.2.1' }, { name: 'b', ssh: '192.0.2.2' }], denyPatterns: ['curl .*internal'] })
    const vault = new LocalVault(dir, async () => new Uint8Array(32).fill(7))
    const guarded = new OpsService(strict, await Inventory.load(strict), routeSecrets(vault, noSecrets))
    const panel = new OpsManager(guarded, vault, () => undefined)
    const rev = async () => (await panel.dispatch({ action: 'snapshot' }) as any).revision as string
    await expect(panel.dispatch({ action: 'setServiceChecks', host: 'a', checks: [{ kind: 'http', url: 'http://internal/health' }], revision: await rev() })).rejects.toThrow('deny')
    // Saved before the rule existed, through the manager without it that shares this data directory.
    await manager.dispatch({ action: 'setServiceChecks', host: 'a', checks: [{ kind: 'http', url: 'http://internal/health' }, { kind: 'port', port: 22 }], revision: await revision() })
    guarded.inventory = await Inventory.load(strict)
    const scripts: Record<string, string> = {}
    vi.spyOn(guarded.runner, 'runMany').mockImplementation(async (hosts, build) => Promise.all(hosts.map(async host => {
      scripts[host.name] = (await build(host)).script
      return { host: host.name, status: 'ok', exitCode: 0, stdout: OUTPUT, stderr: '', truncated: false, durationMs: 5 } satisfies RunResult
    })))
    const fleet = await guarded.inspect([guarded.inventory.hosts.get('a')!], { sudo: false, authorization: 'read-only', tool: 'test' })
    expect(scripts.a).not.toContain('internal')
    expect(scripts.a).toContain("'22'")
    expect(fleet.hosts[0]!.findings.find(f => f.code === 'service-check-refused')).toMatchObject({ subject: 'http://internal/health' })
  })
})

describe('state-change alerts', () => {
  it('sets a baseline, then sends only changes that mutes do not cover', async () => {
    const send = vi.fn(async () => new Response(null, { status: 200 }))
    const auto = new AutoInspector(service, async () => {}, Date.now, send as unknown as typeof fetch)
    await expect(auto.setNotify(['nope'])).rejects.toThrow('通知渠道不存在')
    await auto.setNotify(['ops'])
    const record = (at: string, findings: HistoryRecord['findings'], status: HistoryRecord['status'] = 'ok'): HistoryRecord => ({ at, status, diskPct: {}, findings })
    await service.store.appendHistory('a', record('2026-10-29T08:00:00Z', []))
    await auto.alert()
    expect(send).not.toHaveBeenCalled()
    await service.store.appendHistory('a', record('2026-10-29T08:05:00Z', [{ severity: 'crit', code: 'unreachable', message: 'ssh: connect timed out' }], 'timeout'))
    await service.store.appendHistory('b', record('2026-10-29T08:05:00Z', []))
    await auto.alert()
    expect(send).toHaveBeenCalledTimes(1)
    const body = JSON.parse((send.mock.calls[0] as unknown as [URL, RequestInit])[1].body as string)
    expect(body.markdown).toContain('**a**: healthy → unreachable — ssh: connect timed out')
    expect(body.markdown).not.toContain('**b**')
    // Unchanged state sends nothing; a muted problem does not count as a change.
    await auto.alert()
    await manager.dispatch({ action: 'muteFinding', host: 'b', code: 'memory-low' })
    await service.store.appendHistory('b', record('2026-10-29T08:10:00Z', [{ severity: 'warn', code: 'memory-low', message: 'memory available 9%' }]))
    await service.refresh()
    await auto.alert()
    expect(send).toHaveBeenCalledTimes(1)
    send.mockResolvedValueOnce(new Response(null, { status: 500 }))
    await service.store.appendHistory('a', record('2026-10-29T08:15:00Z', []))
    await auto.alert()
    expect(JSON.parse((send.mock.calls[1] as unknown as [URL, RequestInit])[1].body as string).markdown).toContain('**a**: unreachable → healthy')
    expect((await auto.status([])).lastAlert?.failed).toEqual(['ops'])
  })
  it('keeps alert text short and free of muted problems', () => {
    const text = alertMessage([{ host: 'h', before: 'ok', after: 'crit', record: { at: '', status: 'ok', diskPct: {}, findings: [{ severity: 'crit', code: 'disk-full', message: '/ 99% used' }, { severity: 'warn', code: 'swap-high', message: 'swap 90% used' }] }, mutes: [{ code: 'swap-high' }] }], Date.parse('2026-10-29T00:00:00Z'))
    expect(text).toBe('## WispOps: server state changed\n2026-10-29T00:00:00.000Z\n\n- **h**: healthy → critical — / 99% used')
  })
})
