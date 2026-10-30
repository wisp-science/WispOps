import { describe, expect, it } from 'vitest'
import { parseDisk, renderDisk } from '../src/collectors/disk.ts'
import type { DiskOptions } from '../src/collectors/disk.ts'
import { evaluate, metricsOf, parseInspection, worstSeverity } from '../src/collectors/inspect.ts'
import { parseProbe } from '../src/collectors/probe.ts'
import { resolveConfig } from '../src/config.ts'

const T = resolveConfig({}).thresholds

const INSPECT = `Welcome to the cluster! Unauthorized access is prohibited.
@@kv
hostname=gpu-01
kernel=Linux 5.15.0-91-generic
os=Ubuntu 22.04.3 LTS
cores=32
uptime=864000.12
loadavg=60.10 55.00 40.00 3/1200 4242
zombies=12
reboot_required=yes
ntp=no
oom_24h=2
kerr_24h=4
@@meminfo
MemTotal:       263842256 kB
MemAvailable:    10553690 kB
SwapTotal:        8388604 kB
SwapFree:         2097151 kB
@@cpu
cpu  1000 0 1000 8000 0 0 0 0 0 0
cpu  1900 0 1000 8100 0 0 0 0 0 0
@@df
Filesystem     Type 1024-blocks      Used Available Capacity Mounted on
/dev/nvme0n1p2 ext4   960000000 912000000  48000000      95% /
/dev/sdb1      xfs   7000000000 5600000000 1400000000    80% /data
tmpfs          tmpfs   32000000         0  32000000       0% /dev/shm
@@dfi
Filesystem       Inodes   IUsed    IFree IUse% Mounted on
/dev/nvme0n1p2 61054976 1000000 60054976    2% /
/dev/sdb1             -       -        -     - /data
@@failed
slurmd.service
@@topcpu
  4242 alice  3190.0 12.5  86400 python
@@topmem
  4242 alice  3190.0 12.5  86400 python
@@gpu
0, GPU-aaa, NVIDIA A100-SXM4-80GB, 98, 79000, 81920, 87
1, GPU-bbb, NVIDIA A100-SXM4-80GB, 0, 70000, 81920, 40
@@gpuapps
GPU-aaa, 4242, 79000, python
GPU-bbb, 5151, 70000, jupyter
@@slurm
mixed|3
drained|1
@@slurmbad
gpu-02|drained|Kill task failed
@@squeue
     12 RUNNING
      3 PENDING
@@kerr
Oct 26 10:00:00 gpu-01 kernel: NVRM: Xid 79
@@netdev
Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:    5000      50    0    0    0     0          0         0     5000      50    0    0    0     0       0          0
  eth0: 1000000     900    0    0    0     0          0         0  2000000     800    0    0    0     0       0          0
  eth1:9000000      900    0    0    0     0          0         0      100     800    0    0    0     0       0          0
docker0:    100       1    0    0    0     0          0         0      100       1    0    0    0     0       0          0
--
Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:    9000      90    0    0    0     0          0         0     9000      90    0    0    0     0       0          0
  eth0: 1524288     950    0    0    0     0          0         0  2001024     810    0    0    0     0       0          0
  eth1:9100000      950    0    0    0     0          0         0      200     810    0    0    0     0       0          0
docker0: 5000100     99    0    0    0     0          0         0  5000100      99    0    0    0     0       0          0
@@netphys
/sys/class/net/eth0
/sys/class/net/eth1
@@tcp
Tcp: RtoAlgorithm RtoMin RtoMax MaxConn ActiveOpens PassiveOpens AttemptFails EstabResets CurrEstab InSegs OutSegs RetransSegs InErrs OutRsts InCsumErrors
Tcp: 1 200 120000 -1 100 200 0 0 40 10000 20000 100 0 0 0
Tcp: RtoAlgorithm RtoMin RtoMax MaxConn ActiveOpens PassiveOpens AttemptFails EstabResets CurrEstab InSegs OutSegs RetransSegs InErrs OutRsts InCsumErrors
Tcp: 1 200 120000 -1 100 200 0 0 42 10300 20400 140 0 0 0
@@end
`

describe('inspection', () => {
  const report = parseInspection(INSPECT)

  it('parses through banners and probes', () => {
    expect(report.hostname).toBe('gpu-01')
    expect(report.load).toEqual({ m1: 60.1, m5: 55, m15: 40, perCore: 1.88 })
    expect(report.cpuPct).toBe(90)
    expect(report.mem?.availPct).toBe(4)
    expect(report.mem?.swapUsedPct).toBe(75)
    expect(report.disks.map(d => d.mount)).toEqual(['/', '/data'])
    expect(report.inodes).toEqual([{ mount: '/', usePct: 2 }])
    expect(report.gpus[0]).toMatchObject({ index: 0, utilPct: 98, tempC: 87, processes: [{ pid: 4242, memMb: 79000, name: 'python' }] })
    expect(report.slurm).toEqual({ nodeStates: { mixed: 3, drained: 1 }, problemNodes: [{ node: 'gpu-02', state: 'drained', reason: 'Kill task failed' }], jobs: { RUNNING: 12, PENDING: 3 } })
    expect(report.ntpSynced).toBe(false)
  })

  it('turns thresholds and trends into findings', () => {
    const findings = evaluate(report, T, { at: '2026-10-25T00:00:00.000Z', diskPct: { '/': 85, '/data': 80 } })
    const codes = findings.map(f => `${f.severity}:${f.code}`)
    expect(codes).toEqual(expect.arrayContaining([
      'crit:disk-full', 'warn:disk-high', 'warn:disk-growth', 'crit:memory-low', 'warn:swap-high', 'warn:load-high',
      'warn:units-failed', 'warn:zombies', 'warn:oom-kills', 'info:kernel-errors', 'warn:gpu-hot', 'info:gpu-idle-held',
      'warn:slurm-nodes', 'warn:ntp-unsynced', 'info:reboot-required',
    ]))
    expect(codes).not.toContain('warn:disk-growth:/data')
    expect(worstSeverity(findings)).toBe('crit')
  })

  it('measures traffic on device-backed interfaces and TCP over the one-second sample', () => {
    // Bridges, veths and bonds have no backing device, so container traffic is not counted twice.
    expect(report.net).toEqual({
      rxBps: 524288 + 100000,
      txBps: 1024 + 100,
      interfaces: [{ name: 'docker0', rxBps: 5000000, txBps: 5000000 }, { name: 'eth0', rxBps: 524288, txBps: 1024 }, { name: 'eth1', rxBps: 100000, txBps: 100 }],
      tcpEstablished: 42,
      tcpRetransPct: 10,
    })
    // Without device information every interface but loopback counts; too few segments give no retransmit share.
    const bare = parseInspection(INSPECT.replace(/@@netphys\n[^@]*/, '').replace('10300 20400 140', '10300 20050 101'))
    expect(bare.net).toMatchObject({ rxBps: 5000000 + 524288 + 100000, tcpEstablished: 42 })
    expect(bare.net?.tcpRetransPct).toBeUndefined()
    expect(parseInspection('@@kv\nhostname=x\n@@end\n').net).toBeUndefined()
  })

  it('warns about a slow login and retransmits, and keeps network metrics for trends', () => {
    const slow = { ...report, loginMs: 4200 }
    const codes = evaluate(slow, T).map(f => `${f.severity}:${f.code}`)
    expect(codes).toEqual(expect.arrayContaining(['warn:login-slow', 'warn:tcp-retrans']))
    expect(evaluate({ ...report, loginMs: 800 }, T).map(f => f.code)).not.toContain('login-slow')
    expect(evaluate(slow, { ...T, loginWarnMs: 0, tcpRetransWarnPct: 0 }).map(f => f.code)).not.toEqual(expect.arrayContaining(['login-slow']))
    expect(evaluate(slow, { ...T, loginWarnMs: 0, tcpRetransWarnPct: 0 }).map(f => f.code)).not.toContain('tcp-retrans')
    expect(metricsOf(slow, new Date('2026-10-29T00:00:00Z'))).toMatchObject({ loginMs: 4200, rxBps: 624288, txBps: 1124, tcpEstablished: 42, tcpRetransPct: 10 })
  })
})

const OPTIONS: DiskOptions = { path: '/data', depth: 2, top: 10, minFileMb: 100, recentMinFileMb: 10, recentMinutes: 1440, walkTimeoutSec: 60 }
const NOW = 1_793_000_000
const DISK = `@@whoami
0
@@gnufind
ok
@@df
Filesystem     Type 1024-blocks       Used  Available Capacity Mounted on
/dev/sdb1      xfs   1000000000  950000000   50000000      95% /data
@@dfi
Filesystem     Inodes IUsed IFree IUse% Mounted on
/dev/sdb1      100    10    90    10% /data
@@du
950000000\t/data
600000000\t/data/projects
300000000\t/data/projects/alice
40000000\t/data/scratch
@@du_rc
0
@@big
50000000000\t${NOW - 60}\talice\t/data/projects/alice/train.log
20000000000\t${NOW - 86400 * 30}\tbob\t/data/projects/bob/model.ckpt
9000000000\t${NOW - 86400 * 3}\troot\t/data/logs/app.log.1.gz
3000000000\t${NOW - 86400 * 3}\tcarol\t/data/scratch/core.1234
@@recent
50000000000\t${NOW - 60}\talice\t/data/projects/alice/train.log
@@find_rc
0
@@now
${NOW}
@@open
4242\t-\t/data/projects/alice/train.log
777\t8000000000\t/data/tmp/old.log (deleted)
@@procs
 4242 alice 86400 python
  777 root 999999 rsyslogd
@@jobs
1001|bob|/data/projects/bob
@@journal
Archived and active journals take up 3.9G in the file system.
@@docker
@@known
4000000\t/\t/var/log
2000000\t/data\t/data/conda/pkgs
@@rotated
1048576\t3
@@end
`

describe('disk diagnosis', () => {
  const previous = { at: '2026-10-20T00:00:00.000Z', path: '/data', usedKb: 900000000, availKb: 100000000, usePct: 90, dirs: { '/data/projects': 550000000, '/data/scratch': 40000000 } }
  const { report, snapshot } = parseDisk(DISK, OPTIONS, previous)

  it('classifies files by who still needs them', () => {
    const verdict = Object.fromEntries(report.largeFiles.map(f => [f.path, f.verdict]))
    expect(verdict).toEqual({
      '/data/projects/alice/train.log': 'in-use',
      '/data/projects/bob/model.ckpt': 'job-directory',
      '/data/logs/app.log.1.gz': 'rotated-log',
      '/data/scratch/core.1234': 'core-dump',
    })
    expect(report.largeFiles[0]?.holders).toEqual([{ pid: 4242, user: 'alice', elapsedSec: 86400, command: 'python' }])
    expect(report.largeFiles[1]?.job).toEqual({ id: '1001', user: 'bob', workdir: '/data/projects/bob', scheduler: 'slurm' })
  })

  it('finds pinned space and growth against the previous snapshot', () => {
    expect(report.deletedOpenBytes).toBe(8_000_000_000)
    expect(report.deletedOpen[0]?.holder.command).toBe('rsyslogd')
    expect(report.topDirs.find(d => d.path === '/data/projects')?.deltaKb).toBe(50_000_000)
    expect(report.sincePrevious).toEqual({ at: previous.at, usedDeltaKb: 50_000_000, usePctBefore: 90 })
    expect(report.knownDirs[0]).toMatchObject({ path: '/var/log', sameFilesystem: false })
    expect(snapshot?.dirs['/data/scratch']).toBe(40_000_000)
    expect(report.fullVisibility).toBe(true)
  })

  it('renders an actionable summary', () => {
    const text = renderDisk('nas-01', report)
    expect(text).toContain('nas-01:/data — /data (/dev/sdb1) 95% used')
    expect(text).toContain('IN USE')
    expect(text).toContain('python[4242 alice]')
    expect(text).toContain('job 1001 of bob')
    expect(text).toContain('Deleted but still open')
    expect(text).toContain('/data/projects +47.7G')
    expect(text).toContain('conda clean')
  })

  it('reports partial walks', () => {
    const { report: partial } = parseDisk(DISK.replace('@@du_rc\n0', '@@du_rc\n124').replace('@@whoami\n0', '@@whoami\n1000'), OPTIONS)
    expect(partial.walkIncomplete).toBe(true)
    expect(partial.notes.join(' ')).toMatch(/deadline/)
    expect(partial.notes.join(' ')).toMatch(/not running as root/)
  })
})

describe('probe', () => {
  it('parses capabilities', () => {
    const probe = parseProbe('motd\n@@kv\nos=Rocky Linux 9\narch=x86_64\ncores=64\nuid=1000\nuser=alice\nsudo=password\ngpus=8\nscheduler=slurm\ndocker=no-permission\nsystemd=yes\n@@end\n', new Date(0))
    expect(probe).toMatchObject({ privilege: 'sudo-password', gpus: 8, scheduler: 'slurm', docker: 'no-permission', cores: 64 })
    expect(parseProbe('restricted shell', new Date(0))).toBeUndefined()
  })
})
