import { describe, expect, it, vi, afterEach } from 'vitest'
import { inQuietHours, localClock, notificationSummary, notifyTask, problemSignature, webhookRequest } from '../src/notifier.ts'
import type { TaskSpec } from '../src/config.ts'
const task: TaskSpec = { name: 'daily', targets: 'a', playbook: 'inspect', notify: ['chat'] }
const record = { at: '2026-10-27T00:00:00Z', hosts: ['a'], playbook: 'inspect' as const, counts: { warn: 1 }, excerpt: '磁盘告警'.repeat(2000) }
afterEach(() => vi.unstubAllEnvs())
describe('task notifications', () => {
  it('bounds UTF-8 summaries and signs the provider-specific payloads', () => {
    const text = notificationSummary(task, record)
    expect(Buffer.byteLength(text)).toBeLessThan(3500)
    expect(text).not.toContain('�')
    const env = { URL: 'https://example.org/hook?token=private', SECRET: 'secret' }
    const d = webhookRequest({ kind: 'dingtalk', urlEnv: 'URL', secretEnv: 'SECRET' }, 'hello', env, 1000000)
    expect(d.url.searchParams.get('timestamp')).toBe('1000000')
    expect(d.url.searchParams.get('sign')).toBeTruthy()
    expect(d.body).toMatchObject({ msgtype: 'markdown', markdown: { text: 'hello' } })
    const f = webhookRequest({ kind: 'feishu', urlEnv: 'URL', secretEnv: 'SECRET' }, 'hello', env, 1000000)
    expect(f.body).toMatchObject({ timestamp: '1000', msg_type: 'interactive' })
    expect(webhookRequest({ kind: 'wecom', urlEnv: 'URL' }, 'hello', env).body).toEqual({ msgtype: 'markdown', markdown: { content: 'hello' } })
  })
  it('rejects unsafe URLs and missing secrets without exposing them', async () => {
    expect(() => webhookRequest({ kind: 'webhook', urlEnv: 'URL' }, 'x', { URL: 'http://example.org' })).toThrow('HTTPS')
    vi.stubEnv('HOOK', 'https://example.org/secret-token')
    const send = vi.fn().mockRejectedValue(new Error('secret-token'))
    const results = await notifyTask({ notifications: { chat: { kind: 'webhook', urlEnv: 'HOOK' } } }, task, record, undefined, send)
    expect(results[0]?.status).toBe('failed')
    expect(JSON.stringify(results)).not.toContain('secret-token')
    expect(send.mock.calls[0]?.[1].redirect).toBe('error')
  })
  it('checks provider errors even on HTTP 200 and preserves per-channel results', async () => {
    vi.stubEnv('HOOK', 'https://example.org')
    const send = vi.fn().mockResolvedValue(new Response('{"errcode":93000,"errmsg":"token-secret"}'))
    const results = await notifyTask({ notifications: { chat: { kind: 'wecom', urlEnv: 'HOOK' } } }, { ...task, notify: ['chat', 'missing', 'chat'] }, record, undefined, send)
    expect(results.map(r => r.status)).toEqual(['failed', 'failed'])
    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(results)).not.toContain('token-secret')
  })
  it('skips healthy runs in problems-only mode but sends incomplete runs', async () => {
    vi.stubEnv('HOOK', 'https://example.org')
    const send = vi.fn().mockImplementation(async () => new Response(null, { status: 204 }))
    const config = { notifications: { chat: { kind: 'webhook' as const, urlEnv: 'HOOK' } } }
    expect((await notifyTask(config, { ...task, notifyOnlyProblems: true }, { ...record, counts: {} }, undefined, send))[0]?.status).toBe('skipped')
    expect(send).not.toHaveBeenCalled()
    expect((await notifyTask(config, { ...task, notifyOnlyProblems: true }, { ...record, counts: { incomplete: 1 } }, undefined, send))[0]?.status).toBe('sent')
  })
})
describe('notification windows', () => {
  it('delivers only when problem counts change, with the first run as baseline', async () => {
    vi.stubEnv('HOOK', 'https://example.org')
    const send = vi.fn().mockImplementation(async () => new Response(null, { status: 204 }))
    const config = { notifications: { chat: { kind: 'webhook' as const, urlEnv: 'HOOK' } } }
    const changing: TaskSpec = { ...task, notifyOnChange: true }
    expect((await notifyTask(config, changing, record, undefined, send))[0]?.status).toBe('sent')
    expect((await notifyTask(config, changing, record, undefined, send, { previous: record }))[0]).toMatchObject({ status: 'skipped', detail: expect.stringContaining('unchanged') })
    expect((await notifyTask(config, changing, { ...record, counts: { warn: 2 } }, undefined, send, { previous: record }))[0]?.status).toBe('sent')
    // The same counts in another key order or with extra non-problem keys still count as unchanged.
    expect((await notifyTask(config, changing, { ...record, counts: { newBytes: 5, warn: 1 } }, undefined, send, { previous: { ...record, counts: { warn: 1, newBytes: 9 } } }))[0]?.status).toBe('skipped')
    expect(problemSignature({ crit: 1 })).not.toBe(problemSignature({ warn: 1 }))
    expect(send).toHaveBeenCalledTimes(2)
  })
  it('stays silent during quiet hours, including windows that cross midnight, in the task zone', async () => {
    vi.stubEnv('HOOK', 'https://example.org')
    const send = vi.fn().mockImplementation(async () => new Response(null, { status: 204 }))
    const config = { notifications: { chat: { kind: 'webhook' as const, urlEnv: 'HOOK' } } }
    const quiet: TaskSpec = { ...task, quietHours: { start: '22:00', end: '08:00', timeZone: 'Asia/Shanghai' } }
    // 2026-10-27T00:00Z is 08:00 in Shanghai: the window has just ended.
    expect((await notifyTask(config, quiet, record, undefined, send))[0]?.status).toBe('sent')
    expect((await notifyTask(config, quiet, { ...record, at: '2026-10-26T23:59:00Z' }, undefined, send))[0]).toMatchObject({ status: 'skipped', detail: expect.stringContaining('quiet hours') })
    expect((await notifyTask(config, quiet, { ...record, at: '2026-10-27T15:00:00Z' }, undefined, send))[0]?.status).toBe('skipped')
    expect((await notifyTask(config, { ...task, quietHours: { start: '09:00', end: '17:00' } }, { ...record, at: '2026-10-27T12:00:00Z' }, undefined, send, { timeZone: 'UTC' }))[0]?.status).toBe('skipped')
    expect((await notifyTask(config, { ...task, quietHours: { start: '09:00', end: '17:00' } }, { ...record, at: '2026-10-27T12:00:00Z' }, undefined, send, { timeZone: 'Asia/Shanghai' }))[0]?.status).toBe('sent')
    expect(inQuietHours({ start: '22:00', end: '08:00' }, Date.parse('2026-10-27T23:00:00Z'), 'UTC')).toBe(true)
    expect(inQuietHours({ start: '22:00', end: '08:00' }, Date.parse('2026-10-27T08:00:00Z'), 'UTC')).toBe(false)
    expect(inQuietHours({ start: '22:00', end: '08:00', timeZone: 'Not/AZone' }, Date.parse('2026-10-27T23:00:00Z'), 'UTC')).toBe(true)
    expect(localClock(Date.parse('2026-10-27T00:30:00Z'), 'Asia/Shanghai')).toBe('08:30')
    expect(send).toHaveBeenCalledTimes(2)
  })
})
