/**
 * Local durable state: the operation audit log, inspection history, and
 * disk snapshots, as JSON Lines under the configured data directory. Host
 * names are validated by the config schema, so they are safe file names.
 * @module dsh-wisp-ops/store
 */
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
async function readJsonLines(path) {
    let text;
    try {
        text = await readFile(path, 'utf8');
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return [];
        throw error;
    }
    const rows = [];
    for (const line of text.split('\n')) {
        if (line.trim().length === 0)
            continue;
        try {
            rows.push(JSON.parse(line));
        }
        catch {
            // A torn final line from an interrupted append is skipped, not fatal.
        }
    }
    return rows;
}
export class OpsStore {
    dir;
    constructor(dir) {
        this.dir = dir;
    }
    async ensure(sub = '') {
        const path = join(this.dir, sub);
        await mkdir(path, { recursive: true, mode: 0o700 });
        return path;
    }
    async audit(entry) {
        await appendFile(join(await this.ensure(), 'audit.jsonl'), `${JSON.stringify(entry)}\n`, { mode: 0o600 });
    }
    async readAudit(filter) {
        const rows = await readJsonLines(join(this.dir, 'audit.jsonl'));
        return rows
            .filter(row => (filter.hosts === undefined || filter.hosts.has(row.host)) && (filter.sinceMs === undefined || Date.parse(row.at) >= filter.sinceMs))
            .slice(-filter.limit);
    }
    async appendHistory(host, record) {
        await appendFile(join(await this.ensure('inspections'), `${host}.jsonl`), `${JSON.stringify(record)}\n`, { mode: 0o600 });
    }
    async readHistory(host, limit) {
        return (await readJsonLines(join(this.dir, 'inspections', `${host}.jsonl`))).slice(-limit);
    }
    /** The latest successful inspection, used as the trend baseline. */
    async lastHealthy(host) {
        return (await this.readHistory(host, 50)).filter(r => r.status === 'ok').at(-1);
    }
    async diskSnapshot(host, path) {
        const rows = await readJsonLines(join(this.dir, 'disk', `${host}.jsonl`));
        return rows.filter(row => row.path === path).at(-1);
    }
    async saveDiskSnapshot(host, snapshot) {
        const dir = await this.ensure('disk');
        const file = join(dir, `${host}.jsonl`);
        // Keep a bounded tail so the file never grows without limit.
        const rows = (await readJsonLines(file)).slice(-49);
        rows.push(snapshot);
        await writeFile(file, rows.map(row => JSON.stringify(row)).join('\n') + '\n', { mode: 0o600 });
    }
    async probes() {
        try {
            return JSON.parse(await readFile(join(this.dir, 'probes.json'), 'utf8'));
        }
        catch (error) {
            if (error.code === 'ENOENT' || error instanceof SyntaxError)
                return {};
            throw error;
        }
    }
    async saveProbes(update) {
        const merged = { ...await this.probes(), ...update };
        const file = join(await this.ensure(), 'probes.json');
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(merged, null, 2), { mode: 0o600 });
        await rename(tmp, file);
    }
    /** Append to a bounded per-key JSON Lines log under `sub/`. */
    async appendBounded(sub, key, row, keep = 200) {
        const file = join(await this.ensure(sub), `${key}.jsonl`);
        const rows = (await readJsonLines(file)).slice(-(keep - 1));
        rows.push(row);
        await writeFile(file, rows.map(r => JSON.stringify(r)).join('\n') + '\n', { mode: 0o600 });
    }
    async readBounded(sub, key) {
        return readJsonLines(join(this.dir, sub, `${key}.jsonl`));
    }
}
