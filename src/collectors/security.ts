/**
 * Security triage (网络攻击排查), read-only: SSH brute force and successful
 * logins by source, connection floods, listening services, crypto-miner and
 * deleted-binary processes, processes running from world-writable places,
 * outbound connections to common mining/C2 ports, and recently changed
 * persistence points (authorized_keys, cron, systemd units, extra UID 0).
 * Root (sudo) sees the auth log and every process; without it the report
 * says what it could not read.
 * @module dsh-wisp-ops/collectors/security
 */

import { num, parseSections } from './sections.ts'
import type { Finding } from './inspect.ts'

export interface SecurityOptions {
  /** Look-back window for logins and changed files, in hours. */
  readonly hours: number
}

export const MINER_NAMES = /^(?:xmrig|xmr-stak|kdevtmpfsi|kinsing|minerd|cpuminer|ethminer|nbminer|t-rex|lolminer|phoenixminer|teamredminer|nanominer|srbminer|gminer|bminer|xmrig-notls|\.?sysupdate|networkservice|dbused|kthreaddi)$/i

/** Tool and package-manager locations whose binaries disappear on ordinary upgrades. */
const MANAGED_TOOL_PATH = /\/\.(?:nvm|pyenv|rbenv|rustup|cargo|sdkman|volta|bun|deno)\/|\/(?:mini|ana)?conda\d?\/|\/miniforge\d?\/|\/mambaforge\/|^\/usr\/(?:lib|libexec|bin|sbin|local\/bin)\/|^\/opt\/|^\/snap\//

export const SUSPICIOUS_PORTS = [3333, 4444, 5555, 6666, 7777, 14433, 14444, 45560, 45700, 6667, 1337, 31337]

export function securityScript(o: SecurityOptions): string {
  const days = Math.max(1, Math.ceil(o.hours / 24))
  return String.raw`export LC_ALL=C
H=${o.hours}
echo @@whoami
id -u
authlog() {
  j=""
  if command -v journalctl >/dev/null 2>&1; then
    j=$( { journalctl -q --no-pager --since "-$H h" _COMM=sshd; journalctl -q --no-pager --since "-$H h" -u ssh -u sshd; } 2>/dev/null )
  fi
  if [ -n "$j" ]; then printf '%s\n' "$j"; return; fi
  # Without a readable journal, fall back to the tail of the classic files (not windowed by time).
  for f in /var/log/auth.log /var/log/secure; do [ -r "$f" ] && tail -n 200000 "$f"; done
}
lines=$(authlog | grep -E 'sshd\[' | sort -u)
echo @@authsrc
if [ -n "$lines" ]; then echo readable; else echo unreadable; fi
echo @@failed
printf '%s\n' "$lines" | grep -E 'Failed (password|publickey)|Invalid user|authentication failure|Connection closed by authenticating user|Disconnected from invalid user' \
  | grep -oE '(from|rhost=) ?[0-9a-fA-F:.]+' | awk '{ print $NF }' | sed 's/^rhost=//' | sort | uniq -c | sort -rn | head -n 20
echo @@accepted
printf '%s\n' "$lines" | grep -E 'Accepted (password|publickey|keyboard-interactive)' \
  | sed -E 's/.*Accepted ([a-z-]+) for ([^ ]+) from ([^ ]+).*/\1 \2 \3/' | sort | uniq -c | sort -rn | head -n 30
echo @@who
who 2>/dev/null
echo @@listen
ss -H -lntup 2>/dev/null | awk '{ print $1 "\t" $5 "\t" $7 }' | head -n 100
echo @@estab
ss -H -tn state established 2>/dev/null | awk '{ print $4 }' | sed -E 's/:[0-9]+$//; s/^\[|\]$//g' | sort | uniq -c | sort -rn | head -n 15
echo @@synrecv
ss -H -tn state syn-recv 2>/dev/null | wc -l
echo @@outbound
ss -H -tnp state established 2>/dev/null | awk '{ print $4 "\t" $5 }' | head -n 2000
echo @@procs
ps -eo pid=,user=,pcpu=,etimes=,comm=,args= --sort=-pcpu 2>/dev/null | head -n 40 | cut -c1-240
echo @@badexe
for p in /proc/[0-9]*; do
  e=$(readlink "$p/exe" 2>/dev/null) || continue
  # Kernel usermode helpers (children of kthreadd, e.g. bpfilter_umh) run from memory and show as "/ (deleted)".
  [ "$(awk '/^PPid:/ { print $2 }' "$p/status" 2>/dev/null)" = 2 ] && continue
  case "$e" in
    (*" (deleted)")
      # A binary replaced by an upgrade leaves a new file at the same path.
      f=${'$'}{e% (deleted)}; r=missing; [ -n "$f" ] && [ "$f" != / ] && [ -e "$f" ] && r=replaced
      printf '%s\t%s\t%s\t%s\n' "${'$'}{p#/proc/}" "$(cat "$p/comm" 2>/dev/null)" "$e" "$r" ;;
    (/tmp/*|/var/tmp/*|/dev/shm/*|/run/user/*/tmp*) printf '%s\t%s\t%s\t-\n' "${'$'}{p#/proc/}" "$(cat "$p/comm" 2>/dev/null)" "$e" ;;
  esac
done | head -n 50
echo @@uid0
awk -F: '$3 == 0 { print $1 }' /etc/passwd 2>/dev/null
echo @@keys
for f in /root/.ssh/authorized_keys /root/.ssh/authorized_keys2 /home/*/.ssh/authorized_keys /home/*/.ssh/authorized_keys2; do
  [ -f "$f" ] && find "$f" -mtime -${days} -printf '%T@\t%u\t%p\n' 2>/dev/null
done
echo @@cron
find /etc/crontab /etc/cron.d /etc/cron.hourly /etc/cron.daily /var/spool/cron /var/spool/cron/crontabs -xdev -type f -mtime -${days} -printf '%T@\t%u\t%p\n' 2>/dev/null | head -n 50
echo @@units
find /etc/systemd/system /lib/systemd/system /usr/lib/systemd/system -maxdepth 2 -type f -name '*.service' -mtime -${days} -printf '%T@\t%u\t%p\n' 2>/dev/null | head -n 50
echo @@sshd
(sshd -T 2>/dev/null || cat /etc/ssh/sshd_config 2>/dev/null) | grep -iE '^(permitrootlogin|passwordauthentication|pubkeyauthentication|port) ' | head -n 10
echo @@fail2ban
command -v fail2ban-client >/dev/null 2>&1 && fail2ban-client status sshd 2>/dev/null | grep -E 'Currently banned|Total banned' | tr -s ' \t' ' '
echo @@end
`
}

export interface SecurityReport {
  readonly authLogReadable: boolean
  readonly fullVisibility: boolean
  readonly failedBySource: { source: string; count: number }[]
  readonly accepted: { method: string; user: string; source: string; count: number }[]
  readonly currentSessions: string[]
  readonly listening: { proto: string; local: string; process: string }[]
  readonly establishedBySource: { source: string; count: number }[]
  readonly synRecv: number
  readonly suspiciousOutbound: { local: string; remote: string }[]
  readonly miners: { pid: number; user: string; cpuPct: number; command: string }[]
  readonly badExecutables: { pid: number; comm: string; exe: string; replaced: boolean }[]
  readonly extraUid0: string[]
  readonly changedKeys: { path: string; owner: string; modified: string }[]
  readonly changedCron: { path: string; owner: string; modified: string }[]
  readonly changedUnits: { path: string; owner: string; modified: string }[]
  readonly sshd: Record<string, string>
  readonly fail2ban: string[]
  readonly findings: Finding[]
}

function counted(lines: readonly string[]): { count: number; rest: string }[] {
  return lines.flatMap(line => {
    const m = /^\s*(\d+)\s+(.*)$/.exec(line)
    return m === null ? [] : [{ count: Number(m[1]), rest: (m[2] as string).trim() }]
  })
}

function changed(lines: readonly string[]): { path: string; owner: string; modified: string }[] {
  return lines.flatMap(line => {
    const [t, owner, ...p] = line.split('\t')
    const at = num(t)
    return at === undefined || owner === undefined ? [] : [{ path: p.join('\t'), owner, modified: new Date(at * 1000).toISOString() }]
  })
}

const PRIVATE = /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|::1$|fe80:|fc|fd)/i

export function parseSecurity(output: string, o: SecurityOptions): SecurityReport {
  const s = parseSections(output)
  const get = (k: string) => s.get(k) ?? []
  const findings: Finding[] = []
  const add = (severity: Finding['severity'], code: string, message: string) => findings.push({ severity, code, message })

  const fullVisibility = get('whoami')[0] === '0'
  const authLogReadable = get('authsrc')[0] === 'readable'
  const failedBySource = counted(get('failed')).map(c => ({ source: c.rest, count: c.count }))
  const accepted = counted(get('accepted')).flatMap(c => {
    const [method, user, source] = c.rest.split(' ')
    return method === undefined || user === undefined || source === undefined ? [] : [{ method, user, source, count: c.count }]
  })
  const listening = get('listen').flatMap(line => {
    const [proto, local, process] = line.split('\t')
    return proto === undefined || local === undefined ? [] : [{ proto, local, process: (process ?? '').replace(/^users:\(\("?/, '').replace(/".*$/, '') }]
  })
  const establishedBySource = counted(get('estab')).map(c => ({ source: c.rest, count: c.count }))
  const synRecv = num(get('synrecv')[0]) ?? 0
  const suspiciousOutbound = get('outbound').flatMap(line => {
    const [local, remote] = line.split('\t')
    const port = num(remote?.slice(remote.lastIndexOf(':') + 1))
    return local !== undefined && remote !== undefined && port !== undefined && SUSPICIOUS_PORTS.includes(port) ? [{ local, remote }] : []
  })
  const miners = get('procs').flatMap(line => {
    const [pid, user, cpu, _elapsed, comm, ...args] = line.trim().split(/\s+/)
    const p = num(pid)
    if (p === undefined || user === undefined || comm === undefined) return []
    const command = [comm, ...args].join(' ')
    const named = MINER_NAMES.test(comm) || /stratum\+tcp:|--donate-level|-o\s+\S*pool\S*:\d+/i.test(command)
    return named ? [{ pid: p, user, cpuPct: num(cpu) ?? 0, command }] : []
  })
  const badExecutables = get('badexe').flatMap(line => {
    const [pid, comm, exe, state] = line.split('\t')
    const p = num(pid)
    return p === undefined || exe === undefined ? [] : [{ pid: p, comm: comm ?? '', exe, replaced: state === 'replaced' }]
  })
  const extraUid0 = get('uid0').filter(name => name !== 'root')
  const sshd: Record<string, string> = {}
  for (const line of get('sshd')) {
    const [k, ...v] = line.trim().split(/\s+/)
    if (k !== undefined) sshd[k.toLowerCase()] = v.join(' ').toLowerCase()
  }

  if (!authLogReadable) add('info', 'auth-log-unreadable', 'SSH auth log not readable; run with sudo for login analysis')
  if (!fullVisibility) add('info', 'partial-visibility', 'not running as root: other users\' processes and sockets may be hidden')
  const total = failedBySource.reduce((n, f) => n + f.count, 0)
  for (const f of failedBySource.slice(0, 5)) {
    if (f.count >= 1000) add('crit', 'ssh-bruteforce', `${f.count} failed SSH logins from ${f.source} in ${o.hours}h`)
    else if (f.count >= 100) add('warn', 'ssh-bruteforce', `${f.count} failed SSH logins from ${f.source} in ${o.hours}h`)
  }
  if (total >= 100 && failedBySource.length >= 20) add('warn', 'ssh-distributed', `failed SSH logins from at least ${failedBySource.length} sources (${total} total) in ${o.hours}h`)
  const attackers = new Set(failedBySource.filter(f => f.count >= 20).map(f => f.source))
  for (const a of accepted) {
    if (attackers.has(a.source)) add('crit', 'login-after-bruteforce', `successful ${a.method} login as ${a.user} from ${a.source}, which also had many failed attempts`)
    if (a.user === 'root' && a.method === 'password') add('warn', 'root-password-login', `root logged in with a password from ${a.source}`)
  }
  const publicSources = accepted.filter(a => !PRIVATE.test(a.source))
  if (publicSources.length > 0) add('info', 'public-logins', `logins from public addresses: ${[...new Set(publicSources.map(a => `${a.user}@${a.source}`))].slice(0, 8).join(', ')}`)
  if (synRecv >= 200) add('warn', 'syn-flood', `${synRecv} half-open (SYN-RECV) connections: possible SYN flood`)
  const flood = establishedBySource.find(e => e.count >= 200 && !PRIVATE.test(e.source))
  if (flood !== undefined) add('warn', 'connection-flood', `${flood.count} established connections from ${flood.source}`)
  for (const m of miners) add('crit', 'crypto-miner', `crypto-miner-like process ${m.command.slice(0, 120)} [pid ${m.pid}, ${m.user}, ${m.cpuPct}% CPU]`)
  for (const b of badExecutables) {
    if (b.replaced) add('info', 'binary-replaced', `process ${b.comm}[${b.pid}] still runs a binary replaced since it started (${b.exe}); usually an upgrade — restart it to pick up the new version`)
    else if (b.exe.endsWith(' (deleted)') && MANAGED_TOOL_PATH.test(b.exe)) add('info', 'binary-removed', `process ${b.comm}[${b.pid}] runs ${b.exe}, removed by an upgrade or uninstall of a managed tool; restart it if it should keep running`)
    else if (b.exe.endsWith(' (deleted)')) add('warn', 'deleted-exe', `process ${b.comm}[${b.pid}] runs a binary that no longer exists on disk (${b.exe}); malware often deletes itself after starting`)
    else add('crit', 'suspicious-exe', `process ${b.comm}[${b.pid}] runs from a world-writable location: ${b.exe}`)
  }
  for (const out of suspiciousOutbound.slice(0, 5)) add('warn', 'suspicious-outbound', `outbound connection ${out.local} → ${out.remote} (port often used by miners/C2)`)
  if (extraUid0.length > 0) add('crit', 'extra-uid0', `accounts with UID 0 besides root: ${extraUid0.join(', ')}`)
  const keys = changed(get('keys'))
  const cron = changed(get('cron'))
  const units = changed(get('units'))
  for (const k of keys) add('warn', 'authorized-keys-changed', `${k.path} changed at ${k.modified}`)
  if (cron.length > 0) add('info', 'cron-changed', `cron files changed: ${cron.slice(0, 5).map(c => c.path).join(', ')}`)
  if (units.length > 0) add('info', 'units-changed', `systemd units changed: ${units.slice(0, 5).map(u => u.path).join(', ')}`)
  if (sshd.permitrootlogin === 'yes' && sshd.passwordauthentication === 'yes') add('warn', 'sshd-weak', 'sshd allows root login with passwords (PermitRootLogin yes, PasswordAuthentication yes)')
  if (total >= 100 && get('fail2ban').length === 0) add('info', 'no-fail2ban', 'brute force is ongoing and fail2ban (sshd jail) is not active')

  return {
    authLogReadable,
    fullVisibility,
    failedBySource,
    accepted,
    currentSessions: get('who'),
    listening,
    establishedBySource,
    synRecv,
    suspiciousOutbound,
    miners,
    badExecutables,
    extraUid0,
    changedKeys: keys,
    changedCron: cron,
    changedUnits: units,
    sshd,
    fail2ban: get('fail2ban'),
    findings,
  }
}

export function renderSecurity(host: string, r: SecurityReport, hours: number): string {
  const sev = { crit: 0, warn: 1, info: 2 }
  const lines = [`## ${host}: security triage, last ${hours}h`]
  const sorted = [...r.findings].sort((a, b) => sev[a.severity] - sev[b.severity])
  lines.push(sorted.length === 0 ? 'No findings.' : sorted.map(f => `${f.severity}: ${f.message}`).join('\n'))
  if (r.failedBySource.length > 0) lines.push('', `Failed SSH logins by source: ${r.failedBySource.slice(0, 10).map(f => `${f.source} ×${f.count}`).join(', ')}`)
  if (r.accepted.length > 0) lines.push(`Successful logins: ${r.accepted.slice(0, 10).map(a => `${a.user}@${a.source} (${a.method}) ×${a.count}`).join(', ')}`)
  if (r.currentSessions.length > 0) lines.push(`Logged in now: ${r.currentSessions.slice(0, 8).join(' | ')}`)
  if (r.listening.length > 0) lines.push('', `Listening: ${r.listening.slice(0, 25).map(l => `${l.local}${l.process ? ` ${l.process}` : ''}`).join(', ')}`)
  if (r.establishedBySource.length > 0) lines.push(`Established connections by peer: ${r.establishedBySource.slice(0, 8).map(e => `${e.source} ×${e.count}`).join(', ')}; SYN-RECV ${r.synRecv}`)
  if (Object.keys(r.sshd).length > 0) lines.push(`sshd: ${Object.entries(r.sshd).map(([k, v]) => `${k}=${v}`).join(', ')}`)
  if (r.fail2ban.length > 0) lines.push(`fail2ban sshd: ${r.fail2ban.join('; ')}`)
  lines.push('', 'Treat findings as leads: confirm with logs and process details before blocking addresses or killing processes; containment steps (firewall rules, killing processes, disabling accounts) are changes that need approval.')
  return lines.join('\n')
}
