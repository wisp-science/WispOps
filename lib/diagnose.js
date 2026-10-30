/**
 * Connection diagnosis for the panel: where the path to a server breaks, without logging in. The destination is
 * resolved the way ssh resolves it (`ssh -G`), then the name is looked up, a TCP connection is opened to the SSH
 * port (or the first ProxyJump hop) and the server's identification line is read. Nothing is authenticated or run
 * and no credential is touched; the server only sees one connection that closes before key exchange.
 * @module dsh-wisp-ops/diagnose
 */
import { lookup } from 'node:dns/promises';
import { isIP, Socket } from 'node:net';
/** The destination fields of `ssh -G` output. */
export function parseSshG(output, fallback) {
    const kv = new Map();
    for (const line of output.split('\n')) {
        const m = /^(\S+)\s+(.*)$/.exec(line.trim());
        if (m && !kv.has(m[1].toLowerCase()))
            kv.set(m[1].toLowerCase(), m[2].trim());
    }
    const set = (key) => {
        const value = kv.get(key);
        return value === undefined || value === '' || value.toLowerCase() === 'none' ? undefined : value;
    };
    const port = Number(set('port'));
    const jump = set('proxyjump')?.split(',')[0]?.replace(/^ssh:\/\//, '').replace(/^[^@]*@/, '');
    return {
        hostname: set('hostname') ?? fallback.hostname,
        port: Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback.port ?? 22,
        ...jump ? { proxyJump: jump } : {},
        ...set('proxycommand') ? { proxyCommand: true } : {},
    };
}
/** `host`, `host:port` or `[v6]:port` of a jump hop. */
function splitHop(hop) {
    const bracket = /^\[([^\]]+)\](?::(\d+))?$/.exec(hop);
    if (bracket)
        return { hostname: bracket[1], port: Number(bracket[2] ?? 22) };
    const colon = hop.lastIndexOf(':');
    if (colon > 0 && hop.indexOf(':') === colon)
        return { hostname: hop.slice(0, colon), port: Number(hop.slice(colon + 1)) || 22 };
    return { hostname: hop, port: 22 };
}
/** Keep a remote identification line printable and short before it reaches the panel. */
const printable = (line) => line.replace(/[^\x20-\x7e]/g, '').slice(0, 120);
function connect(address, port, timeoutMs) {
    const started = Date.now();
    return new Promise(resolve => {
        const socket = new Socket();
        const done = (error) => {
            socket.removeAllListeners('connect').removeAllListeners('timeout');
            if (error)
                socket.destroy();
            resolve({ ...error ? { error } : { socket }, ms: Date.now() - started });
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => { socket.setTimeout(0); done(); });
        socket.once('timeout', () => done('ETIMEDOUT'));
        socket.once('error', (e) => done(e.code ?? e.message));
        socket.connect(port, address);
    });
}
function readBanner(socket, timeoutMs) {
    const started = Date.now();
    return new Promise(resolve => {
        let buffer = '';
        const finish = (result) => {
            clearTimeout(timer);
            socket.removeAllListeners('data');
            socket.destroy();
            resolve({ ...result, ms: Date.now() - started });
        };
        const timer = setTimeout(() => finish({ error: 'no identification within the time limit' }), timeoutMs);
        socket.on('data', (chunk) => {
            buffer += chunk.toString('latin1');
            // Servers may print other lines before the identification string (RFC 4253 §4.2).
            for (const line of buffer.split(/\r?\n/).slice(0, -1))
                if (line.startsWith('SSH-'))
                    return finish({ line: printable(line) });
            if (buffer.length > 8192)
                finish({ error: 'no SSH identification line' });
        });
        socket.once('close', () => finish({ error: buffer ? 'no SSH identification line' : 'closed without an identification line' }));
        socket.once('error', (e) => finish({ error: e.code ?? e.message }));
    });
}
/** Diagnose the path to one resolved target. */
export async function diagnoseTarget(host, target, options) {
    if (target.proxyCommand && !target.proxyJump)
        return { host, target: target.hostname, port: target.port, via: 'proxy-command', steps: [], verdict: 'proxy-command' };
    const hop = target.proxyJump ? splitHop(target.proxyJump) : { hostname: target.hostname, port: target.port };
    const base = { host, target: hop.hostname, port: hop.port, ...target.proxyJump ? { via: 'proxy-jump' } : {} };
    const steps = [];
    let address = hop.hostname;
    if (isIP(hop.hostname) === 0) {
        const started = Date.now();
        try {
            address = (await lookup(hop.hostname)).address;
            steps.push({ step: 'dns', ok: true, ms: Date.now() - started, detail: address });
        }
        catch (error) {
            steps.push({ step: 'dns', ok: false, ms: Date.now() - started, detail: error.code ?? 'lookup failed' });
            return { ...base, steps, verdict: 'dns' };
        }
    }
    const tcp = await connect(address, hop.port, options.timeoutMs);
    if (!tcp.socket) {
        steps.push({ step: 'tcp', ok: false, ms: tcp.ms, detail: tcp.error ?? 'connect failed' });
        return { ...base, steps, verdict: 'tcp' };
    }
    steps.push({ step: 'tcp', ok: true, ms: tcp.ms, detail: `${address}:${hop.port}` });
    const banner = await readBanner(tcp.socket, Math.min(options.timeoutMs, 10_000));
    steps.push(banner.line ? { step: 'banner', ok: true, ms: banner.ms, detail: banner.line } : { step: 'banner', ok: false, ms: banner.ms, detail: banner.error ?? 'no identification' });
    return { ...base, steps, verdict: banner.line ? 'ok' : 'banner' };
}
