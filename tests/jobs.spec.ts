import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { JOBS_SCRIPT, parseSchedulerJobs } from '../src/collectors/jobs.ts'
import { parseSections } from '../src/collectors/sections.ts'
import { parseDisk } from '../src/collectors/disk.ts'
import { parseFiles } from '../src/collectors/files.ts'

it('extracts active PBS jobs from wrapped qstat records without returning environment secrets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wisp-pbs-'))
  try {
    await writeFile(join(dir, 'qstat'), `#!/bin/sh
cat <<'DATA'
Job Id: 123.server
    Job_Owner = alice@submit
    job_state = R
    Variable_List = TOKEN=do-not-return,PBS_O_WORKDIR=/data/long/
        run,PBS_O_HOME=/home/alice
    queue = workq
Job Id: 124.server
    Job_Owner = bob@submit
    job_state = Q
    Variable_List = PBS_O_WORKDIR=/data/queued
Job Id: 125.server
    Job_Owner = alice@submit
    job_state = E
    Variable_List = PBS_O_WORKDIR=/data/finishing
DATA
`, { mode: 0o700 })
    const { stdout } = await promisify(execFile)('sh', ['-c', JOBS_SCRIPT], { env: { ...process.env, PATH: `${dir}:/usr/bin:/bin` } }).catch(e => ({ stdout: String(e.stdout) }))
    expect(stdout).not.toContain('do-not-return')
    expect(parseSchedulerJobs(parseSections(stdout))).toEqual([{ id: '123.server', user: 'alice', workdir: '/data/long/run', scheduler: 'pbs' }, { id: '125.server', user: 'alice', workdir: '/data/finishing', scheduler: 'pbs' }])
  } finally { await rm(dir, { recursive: true, force: true }) }
})
it('uses LSF execution cwd with submission fallback and skips completed/queued jobs', () => {
  const rows = parseSchedulerJobs(parseSections('@@lsf_jobs\n1|RUN|alice|/data/run|/home/alice\n2|SSUSP|bob|-|/data/fallback\n3|DONE|alice|/data/old|/home/alice\n4|PEND|bob|-|/data/queued\n5|RUN|alice|-|relative'))
  expect(rows.map(r => r.workdir)).toEqual(['/data/run', '/data/fallback'])
})
it('protects PBS/LSF directories in both disk verdicts and cleanup plans', () => {
  const data = '@@pbs_jobs\n123|alice|/data/pbs\n@@lsf_jobs\n456|RUN|bob|/data/lsf|/tmp\n@@big\n1000\t1700000000\talice\t/data/pbs/sample.sam\n@@files\n1000\t1700000000\talice\t/data/pbs/sample.sam\n200\t1700000000\talice\t/data/pbs/sample.bam\n2000\t1700000000\tbob\t/data/lsf/_STARtmp/tmp\n@@now\n1800000000\n@@gnufind\nok'
  const disk = parseDisk(data, { path: '/data', depth: 2, top: 15, minFileMb: 1, recentMinFileMb: 1, recentMinutes: 1440, walkTimeoutSec: 10 }).report
  expect(disk.largeFiles[0]?.verdict).toBe('job-directory')
  const files = parseFiles(data, { paths: ['/data'], days: 1, depth: 2, listMinMb: 1, maxFiles: 100, top: 10, walkTimeoutSec: 10 }).report
  expect(files.files.every(f => f.job)).toBe(true)
  expect(files.plan).toEqual([])
})
