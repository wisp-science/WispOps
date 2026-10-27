import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, mkdtemp, readdir, stat, utimes, writeFile, readFile, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { changeScript, parseChangeOutput, validateChange } from '../src/change.ts'
import { gateOpsCall } from '../src/gate.ts'
import { resolveConfig } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { GrantStore } from '../src/policy.ts'
const exec = promisify(execFile)
let dir: string, file: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wisp-change-')); file = join(dir, 'config with spaces')
  await writeFile(file, 'before')
  // Transaction tests exercise stage failures. GNU timeout itself is tested by the Linux CI integration.
  await writeFile(join(dir, 'timeout'), '#!/bin/sh\nshift; shift; shift; exec "$@"\n', { mode: 0o700 })
})
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
const plan = () => ({ targets: 'a', files: [file], command: `printf after > '${file}'`, verify: `test "$(cat '${file}')" = after`, reason: 'Update config' })
async function run(p: Parameters<typeof changeScript>[0] = plan(), options: Parameters<typeof changeScript>[2] = {}) {
  return exec('sh', ['-c', changeScript(p, 2, { backupRoot: dir, ...options })], { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` } }).then(r => ({ ...r, code: 0 }), e => ({ stdout: e.stdout as string, stderr: e.stderr as string, code: e.code as number }))
}
it('backs up and verifies a successful change', async () => {
  const result = await run()
  expect(result.code).toBe(0); expect(result.stdout).toContain('WISPOPS_CHANGE=verified')
  const backup = result.stdout.match(/Backup directory: (.+)/)?.[1]
  expect(await readFile(join(backup!, 'f0'), 'utf8')).toBe('before')
  expect(await readFile(join(backup!, 'manifest'), 'utf8')).toBe(`file\t${file}\n`)
  expect(await readFile(file, 'utf8')).toBe('after')
})
it.each(['apply', 'verify'])('restores the backup when %s fails', async stage => {
  const p = plan()
  if (stage === 'apply') p.command += '; false; echo must-not-run'
  else p.verify = 'false'
  const result = await run(p)
  expect(result.code).not.toBe(0); expect(result.stdout).toContain('WISPOPS_CHANGE=rolled-back')
  expect(result.stdout).not.toContain('must-not-run')
  expect(await readFile(file, 'utf8')).toBe('before')
})
it('refuses missing files or symlinks before executing changes', async () => {
  await symlink(file, join(dir, 'link'))
  expect((await run({ ...plan(), files: [join(dir, 'link')] })).code).toBe(20)
  expect((await run({ ...plan(), files: [join(dir, 'missing')] })).code).toBe(20)
  expect(await readFile(file, 'utf8')).toBe('before')
  expect(() => validateChange({ ...plan(), files: ['/a/../b'] })).toThrow()
  expect(() => validateChange({ ...plan(), files: [], newFiles: [] })).toThrow(/at least one path/)
  expect(() => validateChange({ ...plan(), newFiles: [file] })).toThrow(/duplicate/)
  expect(() => validateChange({ ...plan(), directories: ['/etc/'] })).toThrow()
  // `host` keeps working as an alias of `targets`.
  expect(validateChange({ ...plan(), targets: undefined, host: 'b' }).targets).toBe('b')
})
it('deletes listed new files on rollback and refuses paths that already exist', async () => {
  const created = join(dir, 'new.conf')
  const p = { ...plan(), files: [], newFiles: [created], command: `printf fresh > '${created}'`, verify: 'false' }
  const result = await run(p)
  expect(result.code).toBe(23); expect(result.stdout).toContain('WISPOPS_CHANGE=rolled-back')
  expect(await stat(created).catch(() => undefined)).toBeUndefined()
  const ok = await run({ ...p, verify: 'true' })
  expect(ok.code).toBe(0); expect(await readFile(created, 'utf8')).toBe('fresh')
  // Now it exists, so the same plan is refused before anything runs.
  expect((await run({ ...p, command: 'echo must-not-run' })).code).toBe(20)
  expect((await run({ ...p, newFiles: [join(dir, 'missing-parent', 'x.conf')] })).code).toBe(20)
})
it('archives listed directories with tar and replaces them from the archive on failure', async () => {
  const conf = join(dir, 'conf.d')
  await mkdir(conf); await writeFile(join(conf, 'a.conf'), 'A'); await writeFile(join(conf, 'b.conf'), 'B')
  const p = { ...plan(), files: [], directories: [conf], command: `rm -f '${join(conf, 'a.conf')}'; printf C > '${join(conf, 'c.conf')}'; printf B2 > '${join(conf, 'b.conf')}'`, verify: 'false' }
  const result = await run(p)
  expect(result.code).toBe(23); expect(result.stdout).toContain('WISPOPS_CHANGE=rolled-back')
  expect((await readdir(conf)).sort()).toEqual(['a.conf', 'b.conf'])
  expect(await readFile(join(conf, 'b.conf'), 'utf8')).toBe('B')
  expect((await readdir(dir)).filter(n => n.includes('wispops-restore'))).toEqual([])
  const backup = result.stdout.match(/Backup directory: (.+)/)?.[1]
  expect((await readdir(backup!)).sort()).toEqual(['d0.tar', 'manifest'])
  expect((await run({ ...p, directories: [file] })).code).toBe(20)
})
it('prunes expired backup directories according to the retention and keeps them with retention 0', async () => {
  const old = join(dir, 'wispops-change.oldold'), recent = join(dir, 'wispops-change.recent')
  await mkdir(old); await mkdir(recent)
  const past = new Date(Date.now() - 40 * 86_400_000)
  await utimes(old, past, past)
  await run(plan(), { retentionDays: 0 })
  expect(await stat(old).catch(() => undefined)).toBeDefined()
  await run(plan(), { retentionDays: 14 })
  expect(await stat(old).catch(() => undefined)).toBeUndefined()
  expect(await stat(recent).catch(() => undefined)).toBeDefined()
})
it('parses transaction markers from host output', () => {
  expect(parseChangeOutput('Backup directory: /var/tmp/wispops-change.abc\nWISPOPS_STAGE=apply\nWISPOPS_CHANGE=verified\n', 0)).toEqual({ outcome: 'verified', backupDir: '/var/tmp/wispops-change.abc' })
  expect(parseChangeOutput('Backup directory: /x\nWISPOPS_CHANGE=rollback-failed\n', 24)).toMatchObject({ outcome: 'rollback-failed' })
  expect(parseChangeOutput('GNU timeout is required\n', 20)).toEqual({ outcome: 'refused' })
  expect(parseChangeOutput('', null)).toEqual({ outcome: 'unknown' })
})
it('reports a failed post-restore check instead of claiming a successful rollback', async () => {
  const p = { ...plan(), verify: 'false', afterRollback: 'false' }
  const result = await run(p)
  expect(result.code).toBe(24)
  expect(result.stdout).toContain('WISPOPS_CHANGE=rollback-failed')
  expect(await readFile(file, 'utf8')).toBe('before')
})
it.skipIf(process.platform !== 'linux')('rolls back when GNU timeout terminates an apply stage', async () => {
  const p = { ...plan(), command: `printf after > '${file}'; sleep 10` }
  const result = await exec('sh', ['-c', changeScript(p, 1, { backupRoot: dir })], { env: { ...process.env, PATH: '/usr/bin:/bin' } }).catch(e => e)
  expect(result.code).toBe(22)
  expect(result.stdout).toContain('WISPOPS_CHANGE=rolled-back')
  expect(await readFile(file, 'utf8')).toBe('before')
})
it('checks all phases for destructive risk and deployment denials; approval contains the entire plan', async () => {
  const config = resolveConfig({ hosts: [{ name: 'a' }], inventoryFile: undefined })
  const context = { config, inventory: await Inventory.load(config), grants: new GrantStore(), denyPatterns: [new RegExp('forbidden$')], extraRead: new Set<string>() }
  expect(gateOpsCall('ops_change', { ...plan(), verify: 'forbidden' }, 's', context).kind).toBe('deny')
  const outcome = gateOpsCall('ops_change', { ...plan(), afterRollback: 'rm -f /tmp/old', command: 'echo x'.repeat(500) }, 's', context)
  expect(outcome.kind).toBe('ask')
  if (outcome.kind === 'ask') { expect(outcome.reason).toContain('rm -f /tmp/old'); expect(outcome.reason).toContain('echo x'.repeat(500)); expect(outcome.voucher.risk.level).toBe('destructive') }
  const fleet = gateOpsCall('ops_change', { ...plan(), targets: 'a,b', directories: ['/etc/nginx'] }, 's', { ...context, inventory: await Inventory.load(resolveConfig({ hosts: [{ name: 'a' }, { name: 'b' }], inventoryFile: undefined })) })
  expect(fleet.kind).toBe('ask')
  if (fleet.kind === 'ask') { expect(fleet.voucher.hosts).toEqual(['a', 'b']); expect(fleet.reason).toContain('/etc/nginx'); expect(fleet.voucher.risk.reasons.join(' ')).toContain('tar backup') }
})
