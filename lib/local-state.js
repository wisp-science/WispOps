/** Private atomic JSON files with optimistic revisions and cross-process write exclusion. */
import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
export class LocalState {
    path;
    empty;
    validate;
    constructor(path, empty, validate) {
        this.path = path;
        this.empty = empty;
        this.validate = validate;
    }
    async raw() {
        return await readFile(this.path, 'utf8').catch(error => {
            if (error.code === 'ENOENT')
                return '';
            throw error;
        });
    }
    async read() {
        const raw = await this.raw();
        return { revision: createHash('sha256').update(raw).digest('hex'), value: raw === '' ? this.empty() : this.validate(JSON.parse(raw)) };
    }
    /** Stage under the write lock; a participant may commit another file first.
     * If the participant fails after committing this file, restore its exact preimage.
     * This handles write errors, not process crashes between two file renames.
     */
    async change(revision, update, participate) {
        await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
        const lock = `${this.path}.lock`;
        await mkdir(lock, { mode: 0o700 }).catch(error => {
            if (error.code === 'EEXIST')
                throw new Error('另一个保存操作正在进行，请稍后刷新重试。');
            throw error;
        });
        const temp = `${this.path}.${randomUUID()}.tmp`;
        let previous = '', committed = false;
        try {
            previous = await this.raw();
            if (createHash('sha256').update(previous).digest('hex') !== revision)
                throw new Error('数据已更新，请刷新后再保存，避免覆盖其他修改。');
            const current = previous === '' ? this.empty() : this.validate(JSON.parse(previous));
            const next = this.validate(await update(current));
            await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
            await chmod(temp, 0o600);
            const commit = async () => {
                if (committed)
                    throw new Error('保存操作不能重复提交。');
                await rename(temp, this.path);
                committed = true;
            };
            if (participate)
                await participate(commit);
            else
                await commit();
            if (!committed)
                throw new Error('保存操作未完成提交。');
        }
        catch (error) {
            if (committed) {
                try {
                    if (previous === '')
                        await rm(this.path, { force: true });
                    else {
                        await writeFile(temp, previous, { mode: 0o600, flag: 'wx' });
                        await rename(temp, this.path);
                    }
                }
                catch {
                    throw new Error('保存未完成，且无法恢复原数据。请刷新检查凭据及服务器关联后重试。');
                }
            }
            throw error;
        }
        finally {
            await rm(temp, { force: true });
            await rm(lock, { recursive: true, force: true });
        }
    }
}
