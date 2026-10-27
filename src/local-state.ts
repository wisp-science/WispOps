/** Private atomic JSON files with optimistic revisions and cross-process write exclusion. */
import { createHash, randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export class LocalState<T> {
  constructor(readonly path: string, private readonly empty: () => T, private readonly validate: (value: unknown) => T) {}

  async read(): Promise<{ revision: string; value: T }> {
    const raw = await readFile(this.path, 'utf8').catch(error => {
      if (error.code === 'ENOENT') return ''
      throw error
    })
    return { revision: createHash('sha256').update(raw).digest('hex'), value: raw === '' ? this.empty() : this.validate(JSON.parse(raw)) }
  }

  async change(revision: string, update: (value: T) => Promise<T> | T): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 })
    const lock = `${this.path}.lock`
    await mkdir(lock, { mode: 0o700 }).catch(error => {
      if (error.code === 'EEXIST') throw new Error('另一个保存操作正在进行，请稍后刷新重试。')
      throw error
    })
    const temp = `${this.path}.${randomUUID()}.tmp`
    try {
      const current = await this.read()
      if (current.revision !== revision) throw new Error('数据已更新，请刷新后再保存，避免覆盖其他修改。')
      const next = this.validate(await update(current.value))
      await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600, flag: 'wx' })
      await chmod(temp, 0o600)
      await rename(temp, this.path)
    } finally {
      await rm(temp, { force: true })
      await rm(lock, { recursive: true, force: true })
    }
  }
}
