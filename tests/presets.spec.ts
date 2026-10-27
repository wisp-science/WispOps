import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { parseFiles, renderFiles } from '../src/collectors/files.ts'
import type { FilesOptions } from '../src/collectors/files.ts'
import { classifyPath, findRedundant } from '../src/collectors/omics.ts'
import { parseSecurity, renderSecurity } from '../src/collectors/security.ts'
import { resolveConfig } from '../src/config.ts'
import type { TaskSpec } from '../src/config.ts'
import { Inventory } from '../src/inventory.ts'
import { parseSkill, SKILL_ROOT } from '../src/skills.ts'
import { scheduleRequest, taskPrompt } from '../src/tasks.ts'
import { registerCommands } from '../src/commands.ts'

describe('omics rules', () => {
  it.each([
    ['/data/run1/Sample_R1.fastq.gz', 'fastq', 'raw'],
    ['/data/run1/trimmed/Sample_R1_val_1.fq.gz', 'fastq-trimmed', 'intermediate'],
    ['/data/run1/Sample.fastq', 'fastq-plain', 'reducible'],
    ['/data/aln/S1.sam', 'sam', 'reducible'],
    ['/data/aln/S1.sorted.markdup.bam', 'bam', 'reducible'],
    ['/data/aln/S1.Aligned.out.bam', 'bam-unsorted', 'intermediate'],
    ['/data/aln/S1.cram', 'cram', 'final'],
    ['/data/proj/work/3f/a1b2c3d4e5f60718293a4b5c6d7e8f/S1.bam', 'nextflow-work', 'intermediate'],
    ['/data/proj/.snakemake/shadow/tmpx/out.txt', 'snakemake-meta', 'intermediate'],
    ['/data/sc/S1/SC_RNA_COUNTER_CS/SC_RNA_COUNTER/x.h5', 'cellranger-pipeline', 'intermediate'],
    ['/data/sra/SRR123.sra', 'sra', 'intermediate'],
    ['/data/ont/run/x.pod5', 'nanopore-raw', 'raw'],
    ['/data/vc/cohort.g.vcf.gz', 'gvcf', 'review'],
    ['/data/vc/cohort.vcf', 'vcf-plain', 'reducible'],
    ['/data/vc/cohort.vcf.gz', 'vcf', 'final'],
    ['/home/alice/analysis/obj.h5ad', 'sc-object', 'review'],
    ['/home/alice/.cache/pip/http/x', 'cache', 'cache'],
    ['/data/logs/slurm-12345.out', 'log', 'log'],
    ['/data/random/blob.dat', 'other', 'review'],
  ])('%s → %s', (path, id, retention) => {
    const kind = classifyPath(path)
    expect(kind.id).toBe(id)
    expect(kind.retention).toBe(retention)
  })

  it('finds files a sibling supersedes', () => {
    const redundant = findRedundant([
      '/d/S1.sam', '/d/S1.bam',
      '/d/S2.sorted.bam', '/d/S2.sorted.markdup.bam',
      '/d/S3.bam', '/d/S3.cram',
      '/d/SRR9.sra', '/d/SRR9_1.fastq.gz',
      '/d/x.fastq', '/d/x.fastq.gz',
      '/d/other/S1.bam',
    ])
    const by = Object.fromEntries(redundant.map(r => [r.path, r.supersededBy]))
    expect(by).toEqual({
      '/d/S1.sam': '/d/S1.bam',
      '/d/S2.sorted.bam': '/d/S2.sorted.markdup.bam',
      '/d/S3.bam': '/d/S3.cram',
      '/d/SRR9.sra': '/d/SRR9_1.fastq.gz',
      '/d/x.fastq': '/d/x.fastq.gz',
    })
  })
})

const NOW = 1_793_000_000
const OPTIONS: FilesOptions = { paths: ['/data'], days: 7, depth: 3, listMinMb: 10, maxFiles: 5000, top: 20, walkTimeoutSec: 300 }
const G = 1024 ** 3
const FILES = `@@whoami
0
@@gnufind
ok
@@now
${NOW}
@@total
${300 * G}\t120345
@@rc
0\t/data
@@dirs
${200 * G}\t1000\t/data/proj/alice
${80 * G}\t119000\t/data/proj/bob/work
@@users
${200 * G}\t1000\talice
${100 * G}\t119345\tbob
@@files
${60 * G}\t${NOW - 3600}\talice\t/data/proj/alice/S1.sam
${40 * G}\t${NOW - 3500}\talice\t/data/proj/alice/S1.bam
${30 * G}\t${NOW - 100}\talice\t/data/proj/alice/S2.sorted.bam
${20 * G}\t${NOW - 50}\talice\t/data/proj/alice/raw/S2_R1.fastq.gz
${15 * G}\t${NOW - 7200}\tbob\t/data/proj/bob/trimmed/S3_R1_val_1.fq.gz
${10 * G}\t${NOW - 7200}\tbob\t/data/proj/bob/S3.fastq
@@open
4242\t-\t/data/proj/alice/S2.sorted.bam
@@procs
 4242 alice 600 samtools
@@jobs
@@pipelines
${80 * 1024 * 1024}\t${NOW - 86400}\tcomplete\t/data/proj/bob/work
${5 * 1024 * 1024}\t${NOW - 600}\tlocked-running\t/data/proj/carol/.snakemake
@@end
`

describe('recent-file analysis', () => {
  const previous = { at: '2026-10-20T00:00:00.000Z', roots: ['/data'], days: 7, totalBytes: 250 * G, totalFiles: 1000, dirs: { '/data/proj/alice': 150 * G } }
  const { report, snapshot } = parseFiles(FILES, OPTIONS, previous)

  it('aggregates and compares with the previous scan', () => {
    expect(report.totalBytes).toBe(300 * G)
    expect(report.sincePrevious?.deltaBytes).toBe(50 * G)
    expect(report.dirs[0]).toMatchObject({ path: '/data/proj/alice', deltaBytes: 50 * G })
    expect(report.classifiedShare).toBeCloseTo(175 / 300)
    expect(snapshot.dirs['/data/proj/bob/work']).toBe(80 * G)
  })

  it('plans cleanup without touching raw data, open files, or running pipelines', () => {
    const titles = report.plan.map(p => p.title)
    const paths = report.plan.flatMap(p => p.paths)
    expect(paths).toContain('/data/proj/alice/S1.sam')
    expect(paths).toContain('/data/proj/bob/work')
    expect(paths).toContain('/data/proj/bob/trimmed/S3_R1_val_1.fq.gz')
    expect(paths).toContain('/data/proj/bob/S3.fastq')
    expect(paths).not.toContain('/data/proj/alice/S2.sorted.bam')
    expect(paths).not.toContain('/data/proj/alice/raw/S2_R1.fastq.gz')
    expect(paths).not.toContain('/data/proj/carol/.snakemake')
    expect(report.plan[0]?.reclaimBytes).toBeGreaterThanOrEqual(report.plan.at(-1)?.reclaimBytes ?? 0)
    expect(titles.some(t => t.includes('nextflow'))).toBe(true)
  })

  it('renders holders, raw-data notice, and checks', () => {
    const text = renderFiles('seq-01', report)
    expect(text).toContain('held by samtools[4242 alice]')
    expect(text).toContain('Raw FASTQ')
    expect(text).toContain('never a cleanup candidate')
    expect(text).toContain('samtools quickcheck')
  })
})

const SECURITY = `@@whoami
0
@@authsrc
readable
@@failed
   2400 203.0.113.9
    150 198.51.100.7
@@accepted
      3 publickey alice 10.0.0.5
      1 password root 203.0.113.9
@@who
alice pts/0 2026-10-27 08:00 (10.0.0.5)
@@listen
tcp\t0.0.0.0:22\tusers:(("sshd",pid=900,fd=3))
@@estab
    250 192.0.2.44
@@synrecv
12
@@outbound
10.0.0.8:51234\t198.18.0.10:3333
@@procs
  31337 www-data 390.0 3600 kdevtmpfsi /tmp/kdevtmpfsi
  1200 alice 50.0 100 python python train.py
@@badexe
31337\tkdevtmpfsi\t/tmp/kdevtmpfsi\t-
2247\tnode\t/home/u/.nvm/node (deleted)\treplaced
77\tx\t/home/u/x (deleted)\tmissing
78\tnode\t/home/u/.nvm/versions/node/v18/bin/node (deleted)\tmissing
@@uid0
root
toor
@@keys
${NOW}\troot\t/root/.ssh/authorized_keys
@@cron
@@units
@@sshd
permitrootlogin yes
passwordauthentication yes
@@fail2ban
@@end
`

describe('security triage', () => {
  const report = parseSecurity(SECURITY, { hours: 24 })
  it('raises the right alarms', () => {
    const codes = report.findings.map(f => `${f.severity}:${f.code}`)
    expect(codes).toEqual(expect.arrayContaining([
      'crit:ssh-bruteforce', 'warn:ssh-bruteforce', 'crit:login-after-bruteforce', 'warn:root-password-login',
      'warn:connection-flood', 'crit:crypto-miner', 'crit:suspicious-exe', 'warn:suspicious-outbound',
      'info:binary-replaced', 'warn:deleted-exe', 'info:binary-removed', 'crit:extra-uid0', 'warn:authorized-keys-changed', 'warn:sshd-weak', 'info:no-fail2ban',
    ]))
    expect(report.miners.map(m => m.pid)).toEqual([31337])
    expect(renderSecurity('web-01', report, 24)).toContain('203.0.113.9 ×2400')
  })

  it('is quiet on a clean host', () => {
    const clean = parseSecurity('@@whoami\n0\n@@authsrc\nreadable\n@@synrecv\n0\n@@uid0\nroot\n@@end\n', { hours: 24 })
    expect(clean.findings).toEqual([])
  })
})

describe('tasks', () => {
  const config = resolveConfig({ timeZone: 'Asia/Shanghai' })
  const task = (t: Partial<TaskSpec>): TaskSpec => ({ name: 't', targets: 'a', playbook: 'inspect', ...t })

  it('translates schedules into DSH schedule requests', () => {
    expect(scheduleRequest(task({ schedule: { daily: '08:30' } }), config)).toMatchObject({ title: 'WispOps: t', daily: { time: '08:30:00', time_zone: 'Asia/Shanghai' } })
    expect(scheduleRequest(task({ schedule: { daily: '09:00', weekdays: [5, 1, 1], timeZone: 'UTC' } }), config)).toMatchObject({ weekly: { time: '09:00:00', time_zone: 'UTC', weekdays: [1, 5] } })
    expect(scheduleRequest(task({ schedule: { cron: '0 */6 * * *' } }), config)).toMatchObject({ cron: { expression: '0 */6 * * *' } })
    expect(scheduleRequest(task({ schedule: { everyMinutes: 30 } }), config)).toMatchObject({ every_seconds: 1800 })
    expect(taskPrompt(task({ name: 'morning' }))).toContain('ops_task with name="morning"')
  })

  it('validates task definitions at load', () => {
    const hosts = [{ name: 'a' }]
    const make = (t: Partial<TaskSpec>) => () => new Inventory(hosts, {}, config.defaultPolicy, [task(t)])
    expect(make({ targets: 'nope' })).toThrow(/task "t" targets "nope"/)
    expect(make({ playbook: 'custom' })).toThrow(/needs an instruction/)
    expect(make({ playbook: 'new-files' })).toThrow(/needs paths/)
    expect(make({ schedule: { daily: '08:00', cron: '* * * * *' } })).toThrow(/exactly one/)
    expect(make({ playbook: 'custom', instruction: '观察 MCP 的调度情况' })).not.toThrow()
  })

  it('schedules and runs tasks through human commands', async () => {
    const commands = new Map<string, { handler: (i: unknown) => Promise<{ kind: string; text?: string }> }>()
    const created: Record<string, unknown>[] = []
    const scheduler = {
      list: vi.fn(async () => [{ id: 'old', title: 'WispOps: mcp-morning', scheduledAt: 'x' }]),
      create: vi.fn(async (_s: unknown, r: Record<string, unknown>) => { created.push(r); return { id: 'n', title: String(r.title), scheduledAt: '2026-10-28T00:30:00Z' } }),
      delete: vi.fn(async () => ({ deleted: true })),
    }
    const ctx = { commands: { register: (d: { name: string; handler: never }) => commands.set(d.name, d) }, get: (name: string) => (name === 'schedule' ? scheduler : undefined) }
    const inventory = new Inventory([{ name: 'server-a' }, { name: 'server-b' }], {}, config.defaultPolicy, [
      { name: 'mcp-morning', targets: 'server-a', playbook: 'custom', instruction: '观察 MCP 的调度情况', schedule: { daily: '08:00' } },
      { name: 'b-files', targets: 'server-b', playbook: 'new-files', paths: ['/data'], days: 1 },
    ])
    const service = { config, inventory, refresh: async () => {} } as never
    registerCommands(ctx as never, service)
    const followup = vi.fn()
    const invocation = (rawInput: string) => ({ rawInput, agent: { id: 'session-1', followup }, signal: new AbortController().signal, attachments: [] })

    const scheduled = await commands.get('ops-schedule')?.handler(invocation('all'))
    expect(scheduled?.kind).toBe('success')
    expect(scheduler.delete).toHaveBeenCalledWith({ sessionId: 'session-1', id: 'old' }, expect.anything())
    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({ title: 'WispOps: mcp-morning', daily: { time: '08:00:00', time_zone: 'Asia/Shanghai' } })
    expect(scheduled?.text).toContain('b-files: no schedule')

    const run = await commands.get('ops-run')?.handler(invocation('b-files'))
    expect(run?.kind).toBe('success')
    expect(JSON.stringify(followup.mock.calls[0]?.[0])).toContain('ops_task with name=\\"b-files\\"')

    const listed = await commands.get('ops-tasks')?.handler(invocation(''))
    expect(listed?.text).toContain('mcp-morning: custom on server-a, daily 08:00 Asia/Shanghai')
  })
})

describe('bundled skills', () => {
  it('are well-formed and named after their directories', () => {
    const names = readdirSync(SKILL_ROOT)
    expect(names).toEqual(expect.arrayContaining(['wisp-disk-full', 'wisp-omics-cleanup', 'wisp-security-triage', 'wisp-daily-report', 'wisp-safe-change', 'wisp-hpc-gpu']))
    for (const name of names) {
      const path = join(SKILL_ROOT, name, 'SKILL.md')
      const skill = parseSkill(readFileSync(path, 'utf8'), path)
      expect(skill.name).toBe(name)
      expect(skill.content.length).toBeGreaterThan(200)
    }
  })
})
