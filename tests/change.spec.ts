import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, readFile, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { changeScript, validateChange } from '../src/change.ts'
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
const plan = () => ({ host: 'a', files: [file], command: `printf after > '${file}'`, verify: `test "$(cat '${file}')" = after`, reason: 'Update config' })
async function run(p = plan()) {
  return exec('sh', ['-c', changeScript(p, 2, dir)], { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` } }).then(r => ({ ...r, code: 0 }), e => ({ stdout: e.stdout as string, stderr: e.stderr as string, code: e.code as number }))
}
it('backs up and verifies a successful change', async () => {
  const result = await run()
  expect(result.code).toBe(0); expect(result.stdout).toContain('WISPOPS_CHANGE=verified')
  const backup = result.stdout.match(/Backup directory: (.+)/)?.[1]
  expect(await readFile(join(backup!, '0'), 'utf8')).toBe('before')
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
  const result = await exec('sh', ['-c', changeScript(p, 1, dir)], { env: { ...process.env, PATH: '/usr/bin:/bin' } }).catch(e => e)
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
})
