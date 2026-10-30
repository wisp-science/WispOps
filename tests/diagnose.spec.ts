import { createServer } from 'node:net'
import type { Server } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { diagnoseTarget, parseSshG } from '../src/diagnose.ts'

let servers: Server[] = []
afterEach(async () => { await Promise.all(servers.map(s => new Promise(resolve => s.close(resolve)))); servers = [] })
/** A local listener that writes `greeting` to each connection, on a free port. */
async function listen(greeting: string): Promise<number> {
  const server = createServer(socket => { socket.on('error', () => {}); socket.write(greeting) })
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return (server.address() as { port: number }).port
}

describe('connection diagnosis', () => {
  it('reads the destination ssh would use, including the first ProxyJump hop', () => {
    expect(parseSshG('user alice\nhostname 10.0.0.5\nport 2222\nproxyjump none\n', { hostname: 'box' })).toEqual({ hostname: '10.0.0.5', port: 2222 })
    expect(parseSshG('hostname inner\nport 22\nproxyjump ops@bastion.example:2200,second\n', { hostname: 'x' })).toEqual({ hostname: 'inner', port: 22, proxyJump: 'bastion.example:2200' })
    expect(parseSshG('hostname h\nproxycommand nc %h %p\n', { hostname: 'x', port: 2022 })).toEqual({ hostname: 'h', port: 2022, proxyCommand: true })
    expect(parseSshG('', { hostname: 'fallback' })).toEqual({ hostname: 'fallback', port: 22 })
  })
  it('passes every step when an SSH server answers, skipping DNS for an address', async () => {
    const port = await listen('Welcome\r\nSSH-2.0-OpenSSH_9.6\r\n')
    const result = await diagnoseTarget('box', { hostname: '127.0.0.1', port }, { timeoutMs: 2000 })
    expect(result).toMatchObject({ host: 'box', target: '127.0.0.1', port, verdict: 'ok' })
    expect(result.steps.map(s => [s.step, s.ok])).toEqual([['tcp', true], ['banner', true]])
    expect(result.steps[1]!.detail).toBe('SSH-2.0-OpenSSH_9.6')
  })
  it('names the step that fails', async () => {
    const http = await listen('HTTP/1.1 400 Bad Request\r\n\r\n')
    expect((await diagnoseTarget('web', { hostname: '127.0.0.1', port: http }, { timeoutMs: 1000 })).verdict).toBe('banner')
    const closed = await listen('')
    servers.pop()!.close()
    const refused = await diagnoseTarget('down', { hostname: '127.0.0.1', port: closed }, { timeoutMs: 1000 })
    expect(refused).toMatchObject({ verdict: 'tcp', steps: [{ step: 'tcp', ok: false, detail: 'ECONNREFUSED' }] })
    const dns = await diagnoseTarget('typo', { hostname: 'no-such-host.invalid', port: 22 }, { timeoutMs: 1000 })
    expect(dns).toMatchObject({ verdict: 'dns', steps: [{ step: 'dns', ok: false }] })
    expect(await diagnoseTarget('pc', { hostname: 'h', port: 22, proxyCommand: true }, { timeoutMs: 1000 })).toMatchObject({ verdict: 'proxy-command', steps: [] })
  })
  it('tests the jump host when the connection goes through one', async () => {
    const port = await listen('SSH-2.0-bastion\r\n')
    expect(await diagnoseTarget('inner', { hostname: 'inner.internal', port: 22, proxyJump: `127.0.0.1:${port}` }, { timeoutMs: 2000 })).toMatchObject({ target: '127.0.0.1', port, via: 'proxy-jump', verdict: 'ok' })
  })
})
