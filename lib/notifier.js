import { createHmac } from 'node:crypto';
/** Keep within the smallest provider limit, without splitting a UTF-8 character. */
export function notificationSummary(task, record) {
    const counts = Object.entries(record.counts).map(([key, value]) => `${key}=${value}`).join(', ');
    const text = `## WispOps: ${task.name}\n${record.at}\nHosts: ${record.hosts.join(', ')}\n${counts || 'No findings reported'}\n\n${record.excerpt}`;
    let result = '', size = 0;
    for (const char of text) {
        size += Buffer.byteLength(char);
        if (size > 3400)
            return result + '\n… (truncated; full report in DSH)';
        result += char;
    }
    return result;
}
export function webhookRequest(channel, markdown, env = process.env, now = Date.now()) {
    const raw = env[channel.urlEnv];
    if (!raw)
        throw new Error('missing endpoint environment variable');
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('endpoint must be HTTPS without user info');
    const secret = channel.secretEnv ? env[channel.secretEnv] : undefined;
    if (channel.secretEnv && !secret)
        throw new Error('missing secret environment variable');
    const headers = { 'content-type': 'application/json' };
    let body;
    switch (channel.kind) {
        case 'wecom':
            body = { msgtype: 'markdown', markdown: { content: markdown } };
            break;
        case 'dingtalk':
            if (secret) {
                url.searchParams.set('timestamp', String(now));
                url.searchParams.set('sign', createHmac('sha256', secret).update(`${now}\n${secret}`).digest('base64'));
            }
            body = { msgtype: 'markdown', markdown: { title: 'WispOps', text: markdown } };
            break;
        case 'feishu': {
            const timestamp = String(Math.floor(now / 1000));
            body = { msg_type: 'interactive', card: { elements: [{ tag: 'markdown', content: markdown }] },
                ...(secret ? { timestamp, sign: createHmac('sha256', `${timestamp}\n${secret}`).update('').digest('base64') } : {}) };
            break;
        }
        case 'webhook':
            if (secret)
                headers.authorization = `Bearer ${secret}`;
            body = { title: 'WispOps', markdown };
    }
    return { url, body, headers };
}
async function responseJson(response) {
    if (!response.body)
        throw new Error('empty response');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
        for (;;) {
            const { value, done } = await reader.read();
            if (done)
                break;
            size += value.byteLength;
            if (size > 16_384)
                throw new Error('response too large');
            chunks.push(value);
        }
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    finally {
        await reader.cancel().catch(() => { });
    }
}
/** Opt-in delivery after durable task recording. Failures never discard the inspection. */
export async function notifyTask(config, task, record, signal, send = fetch) {
    const problem = ['warn', 'crit', 'unreachable', 'incomplete'].some(key => (record.counts[key] ?? 0) > 0);
    return Promise.all([...new Set(task.notify ?? [])].map(async (channelName) => {
        if (task.notifyOnlyProblems && !problem)
            return { channel: channelName, status: 'skipped' };
        const channel = config.notifications[channelName];
        if (!channel)
            return { channel: channelName, status: 'failed', detail: 'unknown channel' };
        try {
            const request = webhookRequest(channel, notificationSummary(task, record));
            const timeout = AbortSignal.timeout(10_000);
            const response = await send(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify(request.body), redirect: 'error', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
            if (!response.ok) {
                await response.body?.cancel();
                throw new Error('HTTP failure');
            }
            if (channel.kind !== 'webhook') {
                const result = await responseJson(response);
                const code = channel.kind === 'feishu' ? result.code ?? result.StatusCode : result.errcode;
                if (code !== 0)
                    throw new Error('provider rejected message');
            }
            else
                await response.body?.cancel();
            return { channel: channelName, status: 'sent' };
        }
        catch {
            // Fetch errors and provider response bodies may contain URLs/tokens. Never persist them.
            return { channel: channelName, status: 'failed', detail: 'Delivery failed; check channel configuration, network and provider limits.' };
        }
    }));
}
