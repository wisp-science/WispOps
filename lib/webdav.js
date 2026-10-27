import { MAX_SYNC_BYTES } from "./sync-crypto.js";
export const SNAPSHOT_NAME = /^wispops-\d{8}T\d{9}Z-[a-f0-9-]{36}\.json$/;
export class WebDav {
    send;
    url;
    authorization;
    constructor(settings, send = fetch) {
        this.send = send;
        this.url = new URL(settings.url.endsWith('/') ? settings.url : settings.url + '/');
        if (this.url.protocol !== 'https:' || this.url.username || this.url.password || this.url.search || this.url.hash)
            throw new Error('WebDAV requires an HTTPS collection URL without credentials or query');
        if (!settings.username || !settings.password || /[:\r\n]/.test(settings.username) || /[\r\n]/.test(settings.password))
            throw new Error('WebDAV username and application password are required');
        this.authorization = `Basic ${Buffer.from(`${settings.username}:${settings.password}`).toString('base64')}`;
    }
    async request(method, name = '', body, headers = {}) {
        if (name && !SNAPSHOT_NAME.test(name))
            throw new Error('Invalid snapshot name');
        try {
            return await this.send(new URL(name, this.url), { method, body, headers: { authorization: this.authorization, ...headers }, redirect: 'error', signal: AbortSignal.timeout(30_000) });
        }
        catch {
            throw new Error('WebDAV connection failed; check address, application password and network');
        }
    }
    async text(response) {
        if (!response.body)
            return '';
        const reader = response.body.getReader(), chunks = [];
        let size = 0;
        try {
            for (;;) {
                const { value, done } = await reader.read();
                if (done)
                    return Buffer.concat(chunks).toString('utf8');
                size += value.length;
                if (size > MAX_SYNC_BYTES)
                    throw new Error('WebDAV response too large');
                chunks.push(value);
            }
        }
        finally {
            await reader.cancel().catch(() => { });
        }
    }
    async list() {
        const response = await this.request('PROPFIND', '', '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>', { depth: '1', 'content-type': 'application/xml' });
        if (response.status === 404) {
            await response.body?.cancel();
            return [];
        }
        if (response.status !== 207) {
            await response.body?.cancel();
            throw new Error(`WebDAV listing failed (HTTP ${response.status})`);
        }
        const xml = await this.text(response);
        const names = [...xml.matchAll(/<(?:[\w-]+:)?href\b[^>]*>([^<]+)<\/(?:[\w-]+:)?href>/g)].flatMap(match => {
            try {
                const href = new URL(match[1].replace(/&amp;/g, '&'), this.url);
                if (href.origin !== this.url.origin || href.pathname.slice(0, href.pathname.lastIndexOf('/') + 1) !== this.url.pathname)
                    return [];
                const name = decodeURIComponent(href.pathname.split('/').at(-1));
                return SNAPSHOT_NAME.test(name) ? [name] : [];
            }
            catch {
                return [];
            }
        });
        return [...new Set(names)].sort().reverse();
    }
    async upload(name, body) {
        if (Buffer.byteLength(body) > MAX_SYNC_BYTES)
            throw new Error('Sync snapshot too large');
        const collection = await this.request('MKCOL');
        await collection.body?.cancel();
        if (![201, 405].includes(collection.status))
            throw new Error(`Cannot create WebDAV folder (HTTP ${collection.status}); create its parent folder first`);
        const response = await this.request('PUT', name, body, { 'content-type': 'application/json', 'if-none-match': '*' });
        await response.body?.cancel();
        if (![200, 201, 204].includes(response.status))
            throw new Error(`WebDAV upload failed (HTTP ${response.status})`);
    }
    async download(name) {
        const response = await this.request('GET', name);
        if (!response.ok) {
            await response.body?.cancel();
            throw new Error(`WebDAV download failed (HTTP ${response.status})`);
        }
        return this.text(response);
    }
}
