import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises'
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
  // A reading tool the protect.fileTools map does not know about.
  ctx.tools.register(defineTool({
    name: 'peek',
    description: 'test read',
    parameters: { path: { type: 'string', required: true }, extra: { type: 'object', additionalProperties: true } },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    execute: async args => `read ${args.path}`,
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

  it('rolls a managed change out host by host, stops at the first failure and lists retained backups', async () => {
    const backups = join(harness.dataDir, 'backups')
    await mkdir(backups)
    harness = await mount({ change: { backupRoot: backups, backupRetentionDays: 7 } })
    const file = join(harness.dataDir, 'managed.conf')
    await writeFile(file, 'v1')
    const r = await harness.call('ops_change', { targets: 'web-01,web-02,trusted', files: [file], command: `case "$FAKE_HOST" in web-02) exit 1;; esac; printf v2 > '${file}'`, verify: `test "$(cat '${file}')" = v2`, reason: 'rollout test' })
    expect(r.isError).toBe(false)
    expect(harness.approval).toHaveBeenCalledTimes(1)
    expect((harness.approval.mock.calls[0]?.[0] as { reason: string }).reason).toContain('web-01, web-02, trusted')
    expect(text(r)).toContain('- web-01: verified')
    expect(text(r)).toContain('- web-02: rolled-back')
    expect(text(r)).toContain('- trusted: skipped')
    expect(text(r)).toContain('not attempted: trusted')
    expect(await touched(harness)).toEqual(['web-01', 'web-02'])
    // web-02 restored its own backup, which already held web-01's verified result.
    expect(await readFile(file, 'utf8')).toBe('v2')
    expect((await readdir(backups)).filter(n => n.startsWith('wispops-change.'))).toHaveLength(2)
    const history = await harness.call('ops_history', { kind: 'changes', targets: 'all' })
    expect(text(history)).toContain('Backup retention: 7 days')
    expect(text(history)).toMatch(/## web-01\n\S+ verified .*managed\.conf .*retained until/)
    expect(text(history)).toMatch(/## web-02\n\S+ rolled-back /)
    expect(text(history)).not.toContain('## trusted')
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

  it('keeps the agent from reading the vault key, ciphertext and state through any tool', async () => {
    // Read-only shell commands used to pass; on Linux the vault key is a plain 0600 file in the data directory.
    for (const command of [`cat ${join(harness.dataDir, 'vault.key')}`, `base64 ${join(harness.dataDir, 'vault.json')}`, `cat ${join(harness.dataDir, 'inventory.yml')}`, `tar czf /tmp/x.tgz ${harness.dataDir}`, 'cat ~/.dsh-wisp-ops/vault.key', 'cd ~/.dsh-wisp-ops && cat vault.key']) {
      const r = await harness.call('bash', { command })
      expect(r.isError, command).toBe(true)
      expect(text(r)).toContain('never reads or modifies')
    }
    // A reading tool with no entry in protect.fileTools is caught by its arguments alone.
    const r = await harness.call('peek', { path: join(harness.dataDir, 'vault.json') })
    expect(r.isError).toBe(true)
    expect(text(r)).toContain('never read or written')
    const nested = await harness.call('peek', { path: '/etc/hostname', extra: { paths: [join(harness.dataDir, 'audit')] } })
    expect(nested.isError).toBe(true)
    expect((await harness.call('peek', { path: '/etc/hostname' })).isError).toBe(false)
    expect((await harness.call('bash', { command: 'cat /etc/hostname' })).isError).toBe(false)
    expect(harness.approval).not.toHaveBeenCalled()
    expect(await touched(harness)).toEqual([])
  })

  it('runs a task\'s read-only commands on every target and refuses non-read or deny-listed ones', async () => {
    // The deny list is the last word even for commands the classifier accepts as read-only.
    harness = await mount({ denyPatterns: ['secret-file'], tasks: [
      { name: 'cmds', targets: 'web-01,web-02', playbook: 'custom', instruction: '检查服务', commands: ['echo svc-$FAKE_HOST', 'false'] },
      { name: 'denied', targets: 'web-01', playbook: 'custom', instruction: 'x', commands: ['ls /tmp', 'cat /etc/secret-file'] },
    ] })
    const r = await harness.call('ops_task', { name: 'cmds' })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('Read-only commands (2)')
    expect(text(r)).toContain('svc-web-01')
    expect(text(r)).toContain('svc-web-02')
    expect(text(r)).not.toContain('No built-in collector')
    const record = JSON.parse(await readFile(join(harness.dataDir, 'tasks', 'cmds.jsonl'), 'utf8')).counts
    expect(record.commandFailed).toBe(2)
    expect(record.incomplete).toBeUndefined()
    expect(harness.approval).not.toHaveBeenCalled()
    expect((await harness.call('ops_task', {})).content.map(b => b.type === 'text' ? b.text : '').join('')).toContain('cmds: custom on web-01,web-02, on demand, 2 read-only command(s)')
    const denied = await harness.call('ops_task', { name: 'denied' })
    expect(denied.isError).toBe(true)
    expect(text(denied)).toContain('deny list')
    // Hosts run concurrently, so only the multiset of connections is deterministic.
    expect((await touched(harness)).sort()).toEqual(['web-01', 'web-01', 'web-02', 'web-02'])
    await expect(mount({ tasks: [{ name: 'bad', targets: 'web-01', playbook: 'custom', instruction: 'x', commands: ['systemctl restart nginx'] }] })).rejects.toThrow(/not read-only/)
    await expect(mount({ tasks: [{ name: 'bad', targets: 'web-01', playbook: 'custom', instruction: 'x', commands: ['sudo cat /etc/shadow'] }] })).rejects.toThrow(/not read-only/)
  })

  it('submits template drafts for review without touching the library or any host', async () => {
    const r = await harness.call('ops_template_draft', { id: 'nginx-health', title: 'Nginx 可用性', category: '应用服务', description: '检查 nginx', playbook: 'custom', instruction: '检查 {{service}} 是否运行。', parameters: [{ key: 'service', label: '服务', hint: '服务名', required: true }] })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('Drafts to review')
    const drafts = JSON.parse(await readFile(join(harness.dataDir, 'template-drafts.json'), 'utf8'))
    expect(drafts.entries[0].template).toMatchObject({ id: 'nginx-health', parameters: [{ key: 'service' }], definition: { playbook: 'custom', schedule: { daily: '08:30' } } })
    await expect(readFile(join(harness.dataDir, 'task-templates.json'), 'utf8')).rejects.toThrow()
    expect((await harness.call('ops_template_draft', { id: 'builtin.health', title: 't', category: 'c', description: '', playbook: 'inspect', instruction: 'x' })).isError).toBe(true)
    expect((await harness.call('ops_template_draft', { id: 'bad', title: 't', category: 'c', description: '', playbook: 'custom', instruction: '检查 {{missing}}' })).isError).toBe(true)
    expect(await touched(harness)).toEqual([])
    expect(harness.approval).not.toHaveBeenCalled()
  })

  it('lists the inventory with policy', async () => {
    const r = await harness.call('ops_hosts', {})
    expect(text(r)).toContain('gpu-01')
    expect(text(r)).toContain('destructive=deny')
    expect(text(r)).toContain('/ops-allow')
  })
})

describe('check scripts through the tools', () => {
  afterEach(async () => {
    harness.ctx.registry.delete(plugin)
    await rm(harness.dataDir, { recursive: true, force: true })
  })
  it('runs an owner-saved script on every target, reads the stored run back, and refuses deny-listed scripts', async () => {
    harness = await mount({ denyPatterns: ['secret-file'], tasks: [
      { name: 'load', targets: 'web-01,web-02', playbook: 'script', script: 'load', report: 'problems', schedule: { everyMinutes: 30 } },
      { name: 'denied', targets: 'web-01', playbook: 'script', script: 'denied', report: 'never' },
    ] })
    const { scriptStore, validateScript } = await import('../src/check-scripts.ts')
    const store = scriptStore(harness.dataDir)
    await store.change((await store.read()).revision, state => ({ ...state, entries: [
      validateScript({ id: 'load', title: 'Load', content: 'echo "load ok on $FAKE_HOST"\necho "procs 42"\necho \'WISPOPS-JSON: {"procs": 42}\'\n[ "$FAKE_HOST" = web-02 ] && exit 1\nexit 0\n' }),
      validateScript({ id: 'denied', title: 'Denied', content: 'cat /etc/secret-file' }),
    ] }))
    expect(text(await harness.call('ops_task', { name: 'load', mode: 'last' }))).toContain('no recorded run yet')
    const r = await harness.call('ops_task', { name: 'load' })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('- web-01: ok — load ok on web-01 {procs=42}')
    expect(text(r)).toContain('- web-02: warn — load ok on web-02 {procs=42}')
    expect(text(r)).toContain('### web-02 (warn, exit 1)\nprocs 42')
    expect(harness.approval).not.toHaveBeenCalled()
    const record = JSON.parse(await readFile(join(harness.dataDir, 'tasks', 'load.jsonl'), 'utf8'))
    expect(record).toMatchObject({ playbook: 'script', counts: { ok: 1, warn: 1 }, outcomes: [{ host: 'web-01', verdict: 'ok', metrics: { procs: 42 } }, { host: 'web-02', verdict: 'warn' }] })
    const audit = (await readFile(join(harness.dataDir, 'audit', `${new Date().toISOString().slice(0, 7)}.jsonl`), 'utf8')).trim().split('\n').map(l => JSON.parse(l))
    expect(audit.map(a => a.command)).toEqual(expect.arrayContaining([expect.stringContaining('(check script load sha256:')]))
    expect(audit.some(a => a.command.includes('echo'))).toBe(false)
    // mode=last replays the stored record: no connection, same evidence.
    const before = (await touched(harness)).length
    const last = await harness.call('ops_task', { name: 'load', mode: 'last' })
    expect(last.isError).toBe(false)
    expect(text(last)).toContain('web-02: warn')
    expect(text(last)).toContain('Recorded run')
    expect((await touched(harness)).length).toBe(before)
    expect(text(await harness.call('ops_task', {}))).toContain('load: script "load" on web-01,web-02, every 30 min, runs on the WispOps timer and reports only problems')
    const denied = await harness.call('ops_task', { name: 'denied' })
    expect(denied.isError).toBe(true)
    expect(text(denied)).toContain('deny list')
  })
  it('submits script drafts for review without saving or running anything', async () => {
    harness = await mount()
    const r = await harness.call('ops_script_draft', { id: 'gpu-idle', title: 'GPU idle', description: 'warn when idle', content: 'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader\nexit 0', timeoutSec: 30 })
    expect(r.isError).toBe(false)
    expect(text(r)).toContain('Drafts to review')
    const drafts = JSON.parse(await readFile(join(harness.dataDir, 'check-script-drafts.json'), 'utf8'))
    expect(drafts.entries[0].script).toMatchObject({ id: 'gpu-idle', timeoutSec: 30 })
    await expect(readFile(join(harness.dataDir, 'check-scripts.json'), 'utf8')).rejects.toThrow()
    expect((await harness.call('ops_script_draft', { id: 'bad id', title: 't', description: '', content: 'x' })).isError).toBe(true)
    expect(await touched(harness)).toEqual([])
    expect(harness.approval).not.toHaveBeenCalled()
  })
})
