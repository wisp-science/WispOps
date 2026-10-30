/**
 * Fleet inspection (巡检): one read-only round trip per host collects
 * load, CPU, memory, disks, inodes, failed units, top processes, GPUs,
 * Slurm state, kernel errors, OOM kills and network traffic; the runner
 * adds the login latency. Thresholds turn them into findings, and the
 * previous inspection supplies growth trends.
 * @module dsh-wisp-ops/collectors/inspect
 */

import type { ThresholdsSpec } from '../config.ts'
import { formatKb, num, parseDf, parseDfInodes, parseSections } from './sections.ts'
import type { FsUsage, InodeUsage } from './sections.ts'

export const INSPECT_SCRIPT = String.raw`export LC_ALL=C
echo @@kv
echo "hostname=$(hostname 2>/dev/null)"
echo "kernel=$(uname -sr 2>/dev/null)"
echo "os=$( (. /etc/os-release 2>/dev/null; echo "$PRETTY_NAME") )"
echo "cores=$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)"
echo "uptime=$(cut -d' ' -f1 /proc/uptime 2>/dev/null)"
echo "loadavg=$(cat /proc/loadavg 2>/dev/null)"
echo "zombies=$(ps -eo stat= 2>/dev/null | grep -c '^Z')"
echo "reboot_required=$([ -f /var/run/reboot-required ] && echo yes || echo no)"
echo "ntp=$(timedatectl show -p NTPSynchronized --value 2>/dev/null)"
if command -v journalctl >/dev/null 2>&1 && journalctl -k -n 1 -q --no-pager >/dev/null 2>&1; then
  echo "oom_24h=$(journalctl -k --since -24h --no-pager -q 2>/dev/null | grep -ciE 'out of memory|oom-kill|killed process')"
  echo "kerr_24h=$(journalctl -k -p err --since -24h --no-pager -q 2>/dev/null | wc -l)"
fi
echo @@meminfo
grep -E '^(MemTotal|MemAvailable|SwapTotal|SwapFree):' /proc/meminfo 2>/dev/null
echo @@cpu
head -n 1 /proc/stat 2>/dev/null; n0=$(cat /proc/net/dev 2>/dev/null); t0=$(grep '^Tcp:' /proc/net/snmp 2>/dev/null); sleep 1; head -n 1 /proc/stat 2>/dev/null
echo @@netdev
printf '%s\n' "$n0"; echo --; cat /proc/net/dev 2>/dev/null
echo @@netphys
for i in /sys/class/net/*; do [ -e "$i/device" ] && echo "$i"; done 2>/dev/null
echo @@tcp
printf '%s\n' "$t0"; grep '^Tcp:' /proc/net/snmp 2>/dev/null
echo @@df
d=$(df -PkT -x tmpfs -x devtmpfs -x overlay -x squashfs -x efivarfs 2>/dev/null); [ "$(printf '%s\n' "$d" | wc -l)" -ge 2 ] || d=$(df -Pk 2>/dev/null); printf '%s\n' "$d"
echo @@dfi
d=$(df -Pi -x tmpfs -x devtmpfs -x overlay -x squashfs -x efivarfs 2>/dev/null); [ "$(printf '%s\n' "$d" | wc -l)" -ge 2 ] || d=$(df -Pi 2>/dev/null); printf '%s\n' "$d"
echo @@failed
systemctl list-units --state=failed --no-legend --plain --no-pager 2>/dev/null | awk '{print $1}'
echo @@topcpu
ps -eo pid=,user=,pcpu=,pmem=,etimes=,comm= --sort=-pcpu 2>/dev/null | head -n 5
echo @@topmem
ps -eo pid=,user=,pcpu=,pmem=,etimes=,comm= --sort=-pmem 2>/dev/null | head -n 5
echo @@gpu
nvidia-smi --query-gpu=index,uuid,name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits 2>/dev/null
echo @@gpuapps
nvidia-smi --query-compute-apps=gpu_uuid,pid,used_memory,process_name --format=csv,noheader,nounits 2>/dev/null
echo @@slurm
command -v sinfo >/dev/null 2>&1 && sinfo -h -o '%T|%D' 2>/dev/null
echo @@slurmbad
command -v sinfo >/dev/null 2>&1 && sinfo -h -N -t drain,draining,down,fail,failing,not_responding -o '%N|%T|%E' 2>/dev/null | sort -u | head -n 50
echo @@squeue
command -v squeue >/dev/null 2>&1 && squeue -h -o '%T' 2>/dev/null | sort | uniq -c
echo @@kerr
if command -v journalctl >/dev/null 2>&1; then journalctl -k -p err --since -24h --no-pager -q 2>/dev/null | tail -n 5; fi
echo @@end
`

export type Severity = 'crit' | 'warn' | 'info'

export interface Finding {
  readonly severity: Severity
  readonly code: string
  readonly message: string
}

export interface ProcessSample {
  readonly pid: number
  readonly user: string
  readonly cpuPct: number
  readonly memPct: number
  readonly elapsedSec: number
  readonly command: string
}

export interface GpuSample {
  readonly index: number
  readonly name: string
  readonly utilPct?: number
  readonly memUsedMb?: number
  readonly memTotalMb?: number
  readonly tempC?: number
  readonly processes: { readonly pid: number; readonly memMb?: number; readonly name: string }[]
}

export interface SlurmState {
  readonly nodeStates: Record<string, number>
  readonly problemNodes: { readonly node: string; readonly state: string; readonly reason: string }[]
  readonly jobs: Record<string, number>
}

/** Traffic over the one-second sample; rates are bytes per second. */
export interface NetworkSample {
  /** Totals over interfaces backed by a device, or every interface but `lo` when none is. */
  readonly rxBps: number
  readonly txBps: number
  readonly interfaces: { readonly name: string; readonly rxBps: number; readonly txBps: number }[]
  readonly tcpEstablished?: number
  /** Retransmitted share of TCP segments sent during the sample; absent when too few were sent to tell. */
  readonly tcpRetransPct?: number
}

export interface HostInspection {
  /** Milliseconds from starting ssh until the remote shell answered, measured locally. */
  readonly loginMs?: number
  readonly hostname?: string
  readonly os?: string
  readonly kernel?: string
  readonly cores?: number
  readonly uptimeSec?: number
  readonly load?: { readonly m1: number; readonly m5: number; readonly m15: number; readonly perCore?: number }
  readonly cpuPct?: number
  readonly mem?: { readonly totalKb: number; readonly availKb: number; readonly availPct: number; readonly swapTotalKb: number; readonly swapUsedPct: number }
  readonly disks: FsUsage[]
  readonly inodes: InodeUsage[]
  readonly failedUnits: string[]
  readonly topCpu: ProcessSample[]
  readonly topMem: ProcessSample[]
  readonly gpus: GpuSample[]
  readonly slurm?: SlurmState
  readonly zombies?: number
  readonly oom24h?: number
  readonly kernelErrors24h?: number
  readonly kernelErrorSamples: string[]
  readonly rebootRequired?: boolean
  readonly ntpSynced?: boolean
  readonly net?: NetworkSample
}

/** Compact metrics kept per inspection for trends. */
export interface InspectionMetrics {
  readonly at: string
  readonly diskPct: Record<string, number>
  readonly memAvailPct?: number
  readonly load1?: number
  readonly cpuPct?: number
  readonly loginMs?: number
  readonly rxBps?: number
  readonly txBps?: number
  readonly tcpEstablished?: number
  readonly tcpRetransPct?: number
}

/** Fewer TCP segments sent in the sample than this make a retransmit share meaningless. */
const MIN_RETRANS_SAMPLE = 100

const IGNORED_MOUNT = /^\/(?:proc|sys|dev|run|snap)(?:\/|$)|^\/boot\/efi$/
const IGNORED_FS_TYPE = new Set(['tmpfs', 'devtmpfs', 'overlay', 'squashfs', 'efivarfs', 'proc', 'sysfs', 'nsfs', 'autofs'])

function parseProcesses(lines: readonly string[]): ProcessSample[] {
  return lines.flatMap(line => {
    const [pid, user, cpu, mem, elapsed, ...command] = line.trim().split(/\s+/)
    const p = num(pid)
    if (p === undefined || user === undefined) return []
    return [{ pid: p, user, cpuPct: num(cpu) ?? 0, memPct: num(mem) ?? 0, elapsedSec: num(elapsed) ?? 0, command: command.join(' ') }]
  })
}

function cpuBusyPct(lines: readonly string[]): number | undefined {
  const parse = (line: string | undefined) => line?.trim().split(/\s+/).slice(1).map(Number)
  const a = parse(lines[0])
  const b = parse(lines[1])
  if (a === undefined || b === undefined || a.length < 4 || b.length < 4) return undefined
  const idle = (v: number[]) => (v[3] ?? 0) + (v[4] ?? 0)
  const total = (v: number[]) => v.reduce((sum, x) => sum + (Number.isFinite(x) ? x : 0), 0)
  const dt = total(b) - total(a)
  if (dt <= 0) return undefined
  return Math.round(((dt - (idle(b) - idle(a))) / dt) * 1000) / 10
}

/** Receive and transmit byte counters per interface from /proc/net/dev. */
function netCounters(lines: readonly string[]): Map<string, { rx: number; tx: number }> {
  const counters = new Map<string, { rx: number; tx: number }>()
  for (const line of lines) {
    const m = /^\s*([^\s:|]+):\s*(.*)$/.exec(line)
    if (m === null) continue
    const fields = (m[2] as string).trim().split(/\s+/).map(Number)
    if (fields.length >= 9 && Number.isFinite(fields[0]) && Number.isFinite(fields[8])) counters.set(m[1] as string, { rx: fields[0] as number, tx: fields[8] as number })
  }
  return counters
}

/** The `Tcp:` header/value line pairs of /proc/net/snmp, in sample order. */
function tcpSamples(lines: readonly string[]): Map<string, number>[] {
  const samples: Map<string, number>[] = []
  for (let i = 0; i + 1 < lines.length; i++) {
    const names = (lines[i] as string).split(/\s+/).slice(1)
    const values = (lines[i + 1] as string).split(/\s+/).slice(1)
    if (names.length === 0 || names.some(n => /^-?\d+$/.test(n)) || values.some(v => !/^-?\d+$/.test(v))) continue
    samples.push(new Map(names.map((name, j) => [name, Number(values[j])])))
    i++
  }
  return samples
}

function parseNetwork(dev: readonly string[], physical: readonly string[], tcp: readonly string[]): NetworkSample | undefined {
  const split = dev.indexOf('--')
  const before = netCounters(split === -1 ? [] : dev.slice(0, split))
  const after = netCounters(split === -1 ? [] : dev.slice(split + 1))
  const rate = (a: number, b: number) => Math.max(0, b - a)
  const interfaces = [...after].flatMap(([name, b]) => {
    const a = before.get(name)
    return a === undefined ? [] : [{ name, rxBps: rate(a.rx, b.rx), txBps: rate(a.tx, b.tx) }]
  })
  const [t0, t1] = tcpSamples(tcp)
  if (interfaces.length === 0 && t1 === undefined) return undefined
  const devices = new Set(physical.map(path => path.slice(path.lastIndexOf('/') + 1)))
  const counted = interfaces.some(i => devices.has(i.name)) ? interfaces.filter(i => devices.has(i.name)) : interfaces.filter(i => i.name !== 'lo')
  const established = t1?.get('CurrEstab')
  const sent = t0 && t1 ? (t1.get('OutSegs') ?? 0) - (t0.get('OutSegs') ?? 0) : 0
  const retrans = t0 && t1 ? (t1.get('RetransSegs') ?? 0) - (t0.get('RetransSegs') ?? 0) : 0
  return {
    rxBps: counted.reduce((sum, i) => sum + i.rxBps, 0),
    txBps: counted.reduce((sum, i) => sum + i.txBps, 0),
    interfaces: interfaces.filter(i => i.name !== 'lo').sort((a, b) => b.rxBps + b.txBps - a.rxBps - a.txBps).slice(0, 8),
    ...established === undefined || !Number.isFinite(established) ? {} : { tcpEstablished: established },
    ...sent >= MIN_RETRANS_SAMPLE && retrans >= 0 ? { tcpRetransPct: Math.round((retrans / sent) * 1000) / 10 } : {},
  }
}

function countStates(lines: readonly string[]): Record<string, number> {
  const states: Record<string, number> = {}
  for (const line of lines) {
    const [state, count] = line.split('|')
    if (state !== undefined && state.length > 0) states[state] = (states[state] ?? 0) + (num(count) ?? 0)
  }
  return states
}

/** Parse the inspection script's output. */
export function parseInspection(output: string): HostInspection {
  const s = parseSections(output)
  const kv = new Map<string, string>()
  for (const line of s.get('kv') ?? []) {
    const eq = line.indexOf('=')
    if (eq > 0) kv.set(line.slice(0, eq), line.slice(eq + 1).trim())
  }
  const nonEmpty = (key: string) => {
    const value = kv.get(key)
    return value === undefined || value.length === 0 ? undefined : value
  }
  const cores = num(kv.get('cores'))
  const loadFields = (kv.get('loadavg') ?? '').split(/\s+/).map(Number)
  const load = loadFields.length >= 3 && loadFields.slice(0, 3).every(Number.isFinite)
    ? {
        m1: loadFields[0] as number,
        m5: loadFields[1] as number,
        m15: loadFields[2] as number,
        ...cores === undefined || cores === 0 ? {} : { perCore: Math.round(((loadFields[0] as number) / cores) * 100) / 100 },
      }
    : undefined

  const meminfo = new Map<string, number>()
  for (const line of s.get('meminfo') ?? []) {
    const m = /^(\w+):\s+(\d+)/.exec(line)
    if (m !== null) meminfo.set(m[1] as string, Number(m[2]))
  }
  const totalKb = meminfo.get('MemTotal')
  const availKb = meminfo.get('MemAvailable')
  const swapTotalKb = meminfo.get('SwapTotal') ?? 0
  const swapFreeKb = meminfo.get('SwapFree') ?? 0
  const mem = totalKb !== undefined && availKb !== undefined && totalKb > 0
    ? {
        totalKb,
        availKb,
        availPct: Math.round((availKb / totalKb) * 1000) / 10,
        swapTotalKb,
        swapUsedPct: swapTotalKb > 0 ? Math.round(((swapTotalKb - swapFreeKb) / swapTotalKb) * 1000) / 10 : 0,
      }
    : undefined

  const disks = parseDf(s.get('df') ?? []).filter(fs => !IGNORED_MOUNT.test(fs.mount) && !IGNORED_FS_TYPE.has(fs.type ?? '') && fs.sizeKb > 0)
  const inodes = parseDfInodes(s.get('dfi') ?? []).filter(fs => !IGNORED_MOUNT.test(fs.mount))

  const gpuApps = (s.get('gpuapps') ?? []).map(line => line.split(',').map(f => f.trim()))
  const gpus: GpuSample[] = (s.get('gpu') ?? []).flatMap(line => {
    const [index, uuid, name, util, used, total, temp] = line.split(',').map(f => f.trim())
    const i = num(index)
    if (i === undefined || name === undefined) return []
    const pick = (value: string | undefined) => num(value)
    const gpu: GpuSample = {
      index: i,
      name,
      ...pick(util) === undefined ? {} : { utilPct: pick(util) },
      ...pick(used) === undefined ? {} : { memUsedMb: pick(used) },
      ...pick(total) === undefined ? {} : { memTotalMb: pick(total) },
      ...pick(temp) === undefined ? {} : { tempC: pick(temp) },
      processes: gpuApps
        .filter(app => app[0] === uuid)
        .flatMap(app => {
          const pid = num(app[1])
          return pid === undefined ? [] : [{ pid, ...num(app[2]) === undefined ? {} : { memMb: num(app[2]) }, name: app[3] ?? '' }]
        }),
    }
    return [gpu]
  })

  const slurmLines = s.get('slurm') ?? []
  const slurm: SlurmState | undefined = slurmLines.length === 0 && (s.get('squeue') ?? []).length === 0
    ? undefined
    : {
        nodeStates: countStates(slurmLines),
        problemNodes: (s.get('slurmbad') ?? []).flatMap(line => {
          const [node, state, ...reason] = line.split('|')
          return node === undefined || state === undefined ? [] : [{ node, state, reason: reason.join('|') }]
        }),
        jobs: Object.fromEntries((s.get('squeue') ?? []).flatMap(line => {
          const m = /^\s*(\d+)\s+(\S+)/.exec(line)
          return m === null ? [] : [[m[2] as string, Number(m[1])]]
        })),
      }

  const ntp = kv.get('ntp')
  const net = parseNetwork(s.get('netdev') ?? [], s.get('netphys') ?? [], s.get('tcp') ?? [])
  return {
    ...nonEmpty('hostname') === undefined ? {} : { hostname: nonEmpty('hostname') },
    ...nonEmpty('os') === undefined ? {} : { os: nonEmpty('os') },
    ...nonEmpty('kernel') === undefined ? {} : { kernel: nonEmpty('kernel') },
    ...cores === undefined ? {} : { cores },
    ...num(kv.get('uptime')) === undefined ? {} : { uptimeSec: Math.round(num(kv.get('uptime')) as number) },
    ...load === undefined ? {} : { load },
    ...cpuBusyPct(s.get('cpu') ?? []) === undefined ? {} : { cpuPct: cpuBusyPct(s.get('cpu') ?? []) },
    ...mem === undefined ? {} : { mem },
    disks,
    inodes,
    failedUnits: s.get('failed') ?? [],
    topCpu: parseProcesses(s.get('topcpu') ?? []),
    topMem: parseProcesses(s.get('topmem') ?? []),
    gpus,
    ...slurm === undefined ? {} : { slurm },
    ...num(kv.get('zombies')) === undefined ? {} : { zombies: num(kv.get('zombies')) },
    ...num(kv.get('oom_24h')) === undefined ? {} : { oom24h: num(kv.get('oom_24h')) },
    ...num(kv.get('kerr_24h')) === undefined ? {} : { kernelErrors24h: num(kv.get('kerr_24h')) },
    kernelErrorSamples: s.get('kerr') ?? [],
    ...kv.has('reboot_required') ? { rebootRequired: kv.get('reboot_required') === 'yes' } : {},
    ...ntp === 'yes' || ntp === 'no' ? { ntpSynced: ntp === 'yes' } : {},
    ...net === undefined ? {} : { net },
  }
}

/** Compact metrics for the trend history. */
export function metricsOf(report: HostInspection, at: Date): InspectionMetrics {
  return {
    at: at.toISOString(),
    diskPct: Object.fromEntries(report.disks.map(d => [d.mount, d.usePct])),
    ...report.mem === undefined ? {} : { memAvailPct: report.mem.availPct },
    ...report.load === undefined ? {} : { load1: report.load.m1 },
    ...report.cpuPct === undefined ? {} : { cpuPct: report.cpuPct },
    ...report.loginMs === undefined ? {} : { loginMs: report.loginMs },
    ...report.net === undefined ? {} : { rxBps: report.net.rxBps, txBps: report.net.txBps },
    ...report.net?.tcpEstablished === undefined ? {} : { tcpEstablished: report.net.tcpEstablished },
    ...report.net?.tcpRetransPct === undefined ? {} : { tcpRetransPct: report.net.tcpRetransPct },
  }
}

/** Turn an inspection into findings, comparing against the previous one when present. */
export function evaluate(report: HostInspection, t: ThresholdsSpec, previous?: InspectionMetrics): Finding[] {
  const findings: Finding[] = []
  const add = (severity: Severity, code: string, message: string) => findings.push({ severity, code, message })

  for (const disk of report.disks) {
    const detail = `${disk.mount} ${disk.usePct}% used (${formatKb(disk.availKb)} free of ${formatKb(disk.sizeKb)})`
    if (disk.usePct >= t.diskCritPct) add('crit', 'disk-full', detail)
    else if (disk.usePct >= t.diskWarnPct) add('warn', 'disk-high', detail)
    const before = previous?.diskPct[disk.mount]
    if (before !== undefined && disk.usePct - before >= t.diskGrowthWarnPts) {
      add('warn', 'disk-growth', `${disk.mount} grew ${before}% → ${disk.usePct}% since ${previous?.at}`)
    }
  }
  for (const inode of report.inodes) {
    if (inode.usePct >= t.inodeCritPct) add('crit', 'inodes-full', `${inode.mount} inodes ${inode.usePct}% used`)
    else if (inode.usePct >= t.inodeWarnPct) add('warn', 'inodes-high', `${inode.mount} inodes ${inode.usePct}% used`)
  }
  if (report.mem !== undefined) {
    const m = report.mem
    const detail = `memory available ${m.availPct}% (${formatKb(m.availKb)} of ${formatKb(m.totalKb)})`
    if (m.availPct <= t.memAvailCritPct) add('crit', 'memory-low', detail)
    else if (m.availPct <= t.memAvailWarnPct) add('warn', 'memory-low', detail)
    if (m.swapUsedPct >= t.swapWarnPct) add('warn', 'swap-high', `swap ${m.swapUsedPct}% used`)
  }
  if (report.load?.perCore !== undefined) {
    const detail = `load ${report.load.m1}/${report.load.m5}/${report.load.m15} on ${report.cores} cores (${report.load.perCore} per core)`
    if (report.load.perCore >= t.loadPerCoreCrit) add('crit', 'load-high', detail)
    else if (report.load.perCore >= t.loadPerCoreWarn) add('warn', 'load-high', detail)
  }
  if (report.failedUnits.length > 0) add('warn', 'units-failed', `failed systemd units: ${report.failedUnits.join(', ')}`)
  if ((report.zombies ?? 0) >= t.zombieWarn) add('warn', 'zombies', `${report.zombies} zombie processes`)
  if ((report.oom24h ?? 0) > 0) add('warn', 'oom-kills', `${report.oom24h} OOM-killer messages in the last 24h`)
  if ((report.kernelErrors24h ?? 0) > 0) add('info', 'kernel-errors', `${report.kernelErrors24h} kernel error lines in the last 24h`)
  for (const gpu of report.gpus) {
    if (gpu.tempC !== undefined && gpu.tempC >= t.gpuTempWarnC) add('warn', 'gpu-hot', `GPU ${gpu.index} at ${gpu.tempC}°C`)
    if (gpu.utilPct === 0 && gpu.memUsedMb !== undefined && gpu.memTotalMb !== undefined && gpu.memTotalMb > 0 && gpu.memUsedMb / gpu.memTotalMb > 0.5) {
      add('info', 'gpu-idle-held', `GPU ${gpu.index} holds ${gpu.memUsedMb}/${gpu.memTotalMb} MiB at 0% utilization (pids ${gpu.processes.map(p => p.pid).join(', ') || 'unknown'})`)
    }
  }
  if (report.slurm !== undefined && report.slurm.problemNodes.length > 0) {
    const listed = report.slurm.problemNodes.slice(0, 10).map(n => `${n.node} ${n.state}${n.reason ? ` (${n.reason})` : ''}`)
    add('warn', 'slurm-nodes', `Slurm nodes need attention: ${listed.join('; ')}${report.slurm.problemNodes.length > 10 ? ' …' : ''}`)
  }
  if (t.loginWarnMs > 0 && report.loginMs !== undefined && report.loginMs >= t.loginWarnMs) add('warn', 'login-slow', `SSH login took ${(report.loginMs / 1000).toFixed(1)} s`)
  if (t.tcpRetransWarnPct > 0 && report.net?.tcpRetransPct !== undefined && report.net.tcpRetransPct >= t.tcpRetransWarnPct) add('warn', 'tcp-retrans', `${report.net.tcpRetransPct}% of TCP segments were retransmitted during the sample`)
  if (report.ntpSynced === false) add('warn', 'ntp-unsynced', 'system clock is not NTP-synchronized')
  if (report.rebootRequired === true) add('info', 'reboot-required', 'a package update requires a reboot')
  return findings
}

const SEVERITY_RANK: Record<Severity, number> = { crit: 2, warn: 1, info: 0 }

/** The most severe finding level, or `ok` when there are none above info. */
export function worstSeverity(findings: readonly Finding[]): Severity | 'ok' {
  let worst: Severity | 'ok' = 'ok'
  for (const finding of findings) {
    if (finding.severity === 'info') continue
    if (worst === 'ok' || SEVERITY_RANK[finding.severity] > SEVERITY_RANK[worst]) worst = finding.severity
  }
  return worst
}

export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
}
