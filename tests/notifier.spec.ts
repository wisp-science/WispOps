import { describe, expect, it, vi, afterEach } from 'vitest'
import { notificationSummary, notifyTask, webhookRequest } from '../src/notifier.ts'
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
