import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import * as plugin from '../src/index.ts'
import { resolveConfig } from '../src/config.ts'
import type { Config } from '../src/config.ts'

const FIXTURES = resolve(import.meta.dirname, 'fixtures')

interface Harness {
  ctx: Context
  approval: ReturnType<typeof vi.fn>
  dataDir: string
  sshLog: string
  call(name: string, args: Record<string, unknown>): Promise<ToolExecutionResult>
}

let harness: Harness
let n = 0

async function mount(overrides: Partial<Config> = {}, answer = 'allowed-once'): Promise<Harness> {
  const dataDir = await mkdtemp(join(tmpdir(), 'wisp-ops-test-'))
  const sshLog = join(dataDir, 'ssh.log')
  process.env.FAKE_SSH_LOG = sshLog
  process.env.FAKE_BIN = join(FIXTURES, 'bin')
  process.env.FAKE_SUDO_STATE = join(dataDir, 'sudo-state')
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  const approval = vi.fn(async () => answer)
  ctx.provide('approval', { request: approval })
  ctx.tools.register(defineTool({
    name: 'write',
    description: 'test write',
    parameters: { file_path: { type: 'string', required: true }, content: { type: 'string', required: true } },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    execute: async args => `wrote ${args.file_path}`,
  }))
  // A stand-in local shell tool so the bash guard can be exercised.
  ctx.tools.register(defineTool({
    name: 'bash',
    description: 'test shell',
    parameters: { command: { type: 'string', required: true } },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    execute: async args => `ran ${args.command}`,
  }))
  const config = resolveConfig({
    hosts: [
      { name: 'web-01', groups: ['web'] },
      { name: 'web-02', groups: ['web'] },
      { name: 'gpu-01', groups: ['gpu'], policy: { destructive: 'deny' } },
      { name: 'trusted', policy: { change: 'allow', sudo: 'allow' } },
      { name: 'down-01' },
      { name: 'locked-01' },
    ],
    tasks: [
      { name: 'a-mcp', targets: 'web-01', playbook: 'custom', instruction: '观察 MCP 的调度情况，每天早上汇报' },
      { name: 'b-files', targets: 'web-02', playbook: 'new-files', paths: ['/tmp'], days: 1 },
      { name: 'c-security', targets: 'gpu-01', playbook: 'security', sudo: true },
    ],
    ssh: { binary: join(FIXTURES, 'fake-ssh.sh'), connectTimeoutSec: 5, controlPersistSec: 0, extraArgs: [], concurrency: 4, loadProfile: false, extraPath: [], authFailureBlockMinutes: 15 },
    dataDir,
    inventoryFile: join(dataDir, 'inventory.yml'),
    ...overrides,
  })
  await ctx.plugin(plugin, config)
  const agent = { id: 'session-1' }
  return {
    ctx,
    approval,
    dataDir,
    sshLog,
    call: (name, args) => ctx.tools.execute({ callId: `call-${++n}` as never, name, arguments: args, agent: agent as never, signal: new AbortController().signal }),
  }
}

const text = (r: ToolExecutionResult) => r.content.map(b => (b.type === 'text' ? b.text : '')).join('\n')
const touched = async (h: Harness) => (await readFile(h.sshLog, 'utf8').catch(() => '')).split('\n').filter(Boolean)

describe('dsh-wisp-ops plugin', () => {
  beforeEach(async () => { harness = await mount() })
  afterEach(async () => {
    harness.ctx.registry.delete(plugin)
    await rm(harness.dataDir, { recursive: true, force: true })
    delete process.env.FAKE_SUDO_NOPASSWD
  })

  it('runs read-only commands without asking and records them', async () => {
    const r = await harness.call('ops_exec', { targets: 'web-01', command: 'echo hello from $FAKE_HOST' })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('hello from web-01')
    expect(text(r)).toContain('authorized by read-only')
    expect(harness.approval).not.toHaveBeenCalled()
    const audit = await readFile(join(harness.dataDir, 'audit', `${new Date().toISOString().slice(0, 7)}.jsonl`), 'utf8')
    expect(JSON.parse(audit.trim())).toMatchObject({ host: 'web-01', risk: 'read', authorization: 'read-only', status: 'ok', exitCode: 0 })
  })

  it('folds identical fleet output', async () => {
    const r = await harness.call('ops_exec', { targets: '@web', command: 'echo same' })
    expect(text(r)).toContain('### web-01, web-02 — ok exit 0')
  })

  it('asks before a change and runs it once approved', async () => {
    const r = await harness.call('ops_exec', { targets: 'web-01', command: 'touch /tmp/wisp-ops-test-$$ && rm -f /tmp/wisp-ops-test-$$; echo changed', reason: 'test' })
    expect(harness.approval).toHaveBeenCalledTimes(1)
    const request = harness.approval.mock.calls[0]?.[0] as { reason: string; toolName: string }
    expect(request.toolName).toBe('ops_exec')
    expect(request.reason).toContain('web-01')
    expect(request.reason).toContain('destructive')
    expect(text(r)).toContain('changed')
    expect(text(r)).toContain('authorized by approval')
  })

  it('runs nothing when the user rejects', async () => {
    harness = await mount({}, 'rejected')
    const r = await harness.call('ops_exec', { targets: 'web-01', command: 'systemctl restart nginx', reason: 'test' })
    expect(r.isError).toBe(true)
    expect(await touched(harness)).toEqual([])
  })

  it('refuses policy deny without asking', async () => {
    const r = await harness.call('ops_exec', { targets: 'gpu-01', command: 'rm -rf /data/tmp', reason: 'cleanup' })
    expect(r.isError).toBe(true)
    expect(text(r)).toContain('Denied by host policy')
    expect(harness.approval).not.toHaveBeenCalled()
    expect(await touched(harness)).toEqual([])
  })

  it('lets a policy allow and a human grant skip the prompt', async () => {
    process.env.FAKE_SUDO_NOPASSWD = '1'
    const allowed = await harness.call('ops_exec', { targets: 'trusted', command: 'echo root=$FAKE_ROOT', sudo: true, reason: 'check' })
    expect(text(allowed)).toContain('root=1')
    expect(text(allowed)).toContain('authorized by policy')
    expect(harness.approval).not.toHaveBeenCalled()
  })

  it('refuses deny-listed commands even when everything else allows', async () => {
    const r = await harness.call('ops_exec', { targets: 'trusted', command: 'rm -rf /', reason: 'x' })
    expect(r.isError).toBe(true)
    expect(text(r)).toMatch(/deny list/)
    expect(await touched(harness)).toEqual([])
  })

  it('stops bash from reaching inventory hosts directly and asks for local sudo', async () => {
    const ssh = await harness.call('bash', { command: 'ssh web-01 uptime' })
    expect(ssh.isError).toBe(true)
    expect(text(ssh)).toContain('ops_exec')
    const sudo = await harness.call('bash', { command: 'sudo ls /root' })
    expect(harness.approval).toHaveBeenCalledTimes(1)
    expect(text(sudo)).toContain('ran sudo ls /root')
    const plain = await harness.call('bash', { command: 'ls -la' })
    expect(text(plain)).toContain('ran ls -la')
  })

  it('reports unreachable hosts and pauses logins after an auth failure', async () => {
    const r = await harness.call('ops_exec', { targets: 'down-01,locked-01', command: 'uptime' })
    expect(text(r)).toContain('down-01 — unreachable')
    expect(text(r)).toContain('locked-01 — auth-failed')
    const again = await harness.call('ops_exec', { targets: 'locked-01', command: 'uptime' })
    expect(text(again)).toContain('blocked')
    expect(text(again)).toContain('/ops-unblock')
    expect((await touched(harness)).filter(h => h === 'locked-01')).toHaveLength(1)
  })

  it('rejects unknown hosts without contacting anything', async () => {
    const r = await harness.call('ops_exec', { targets: 'nope', command: 'uptime' })
    expect(r.isError).toBe(true)
    expect(text(r)).toContain('unknown host "nope"')
  })

  it('inspects a fleet and stores history', async () => {
    const r = await harness.call('ops_inspect', { targets: '@web' })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('Fleet inspection')
    expect(text(r)).toContain('web-01')
    const history = await harness.call('ops_history', { kind: 'inspections', targets: '@web' })
    expect(text(history)).toContain('## web-01')
  })

  it('diagnoses a disk read-only', async () => {
    const r = await harness.call('ops_disk', { host: 'web-01', path: tmpdir(), walkTimeoutSec: 10 })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain(`web-01:${tmpdir().replace(/\/+$/, '')}`)
    expect(harness.approval).not.toHaveBeenCalled()
  })

  it('picks up inventory file edits without a restart', async () => {
    const file = join(harness.dataDir, 'inventory.yml')
    await writeFile(file, 'hosts:\n  - name: new-01\n    groups: [lab]\n')
    await utimes(file, new Date(), new Date(Date.now() + 5000))
    const r = await harness.call('ops_exec', { targets: '@lab', command: 'echo hi $FAKE_HOST' })
    expect(text(r)).toContain('hi new-01')
  })

  it('runs per-server tasks and remembers the previous run', async () => {
    const list = await harness.call('ops_task', {})
    expect(text(list)).toContain('a-mcp: custom on web-01')
    const first = await harness.call('ops_task', { name: 'a-mcp' })
    expect(text(first)).toContain('观察 MCP 的调度情况')
    expect(text(first)).toContain('No previous run recorded')
    const second = await harness.call('ops_task', { name: 'a-mcp' })
    expect(text(second)).toContain('Previous run')
    expect(harness.approval).not.toHaveBeenCalled()
  })

  it('treats task sudo as authorized by the task definition', async () => {
    process.env.FAKE_SUDO_NOPASSWD = '1'
    const r = await harness.call('ops_task', { name: 'c-security' })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('gpu-01: security triage')
    expect(harness.approval).not.toHaveBeenCalled()
    const audit = (await readFile(join(harness.dataDir, 'audit', `${new Date().toISOString().slice(0, 7)}.jsonl`), 'utf8')).trim().split('\n').map(l => JSON.parse(l))
    expect(audit.at(-1)).toMatchObject({ host: 'gpu-01', sudo: true, authorization: 'task' })
  })

  it('runs recent-file analysis and security triage read-only', async () => {
    const files = await harness.call('ops_files', { host: 'web-02', paths: tmpdir(), days: 1, walkTimeoutSec: 20 })
    expect(files.isError).toBe(false)
    expect(text(files)).toContain('web-02: files modified in the last 1 day(s)')
    const sec = await harness.call('ops_security', { targets: 'web-01', hours: 1 })
    expect(sec.isError).toBe(false)
    expect(text(sec)).toContain('web-01: security triage')
    expect(harness.approval).not.toHaveBeenCalled()
  })

  it('keeps the agent from editing its own permissions', async () => {
    const w = await harness.call('write', { file_path: join(harness.dataDir, 'inventory.yml'), content: 'defaultPolicy: {}' })
    expect(w.isError).toBe(true)
    expect(text(w)).toContain('managed by the user only')
    const b = await harness.call('bash', { command: `echo 'policy: allow' >> ${join(harness.dataDir, 'inventory.yml')}` })
    expect(b.isError).toBe(true)
    const ok = await harness.call('write', { file_path: join(tmpdir(), 'elsewhere.txt'), content: 'x' })
    expect(ok.isError).toBe(false)
  })

  it('lists the inventory with policy', async () => {
    const r = await harness.call('ops_hosts', {})
    expect(text(r)).toContain('gpu-01')
    expect(text(r)).toContain('destructive=deny')
    expect(text(r)).toContain('/ops-allow')
  })
})
