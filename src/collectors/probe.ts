/**
 * Capability probe: what a host is (OS, cores, GPUs, scheduler, containers)
 * and what this login may do (root, passwordless sudo). The result becomes
 * planning guidance: no GPU means no GPU work, no sudo means no privileged
 * plan without a stored sudo password.
 * @module dsh-wisp-ops/collectors/probe
 */

import { parseSections } from './sections.ts'

export const PROBE_SCRIPT = String.raw`export LC_ALL=C
echo @@kv
echo "os=$( (. /etc/os-release 2>/dev/null; echo "$PRETTY_NAME") )"
echo "kernel=$(uname -sr 2>/dev/null)"
echo "arch=$(uname -m 2>/dev/null)"
echo "hostname=$(hostname 2>/dev/null)"
echo "cores=$(getconf _NPROCESSORS_ONLN 2>/dev/null || nproc 2>/dev/null)"
echo "uid=$(id -u 2>/dev/null)"
echo "user=$(id -un 2>/dev/null)"
if command -v sudo >/dev/null 2>&1; then sudo -n true >/dev/null 2>&1 && echo "sudo=nopasswd" || echo "sudo=password"; else echo "sudo=absent"; fi
echo "gpus=$(nvidia-smi -L 2>/dev/null | grep -c '^GPU')"
if command -v sbatch >/dev/null 2>&1; then echo "scheduler=slurm"
elif command -v qsub >/dev/null 2>&1 && qsub --version 2>&1 | grep -qi pbs; then echo "scheduler=pbs"
elif [ -n "$SGE_ROOT" ] || command -v qconf >/dev/null 2>&1; then echo "scheduler=sge"
elif command -v bsub >/dev/null 2>&1; then echo "scheduler=lsf"
else echo "scheduler=none"; fi
echo "docker=$(command -v docker >/dev/null 2>&1 && (docker info >/dev/null 2>&1 && echo usable || echo no-permission) || echo absent)"
echo "systemd=$( [ -d /run/systemd/system ] && echo yes || echo no )"
echo @@end
`

export interface HostProbe {
  readonly at: string
  readonly os?: string
  readonly kernel?: string
  readonly arch?: string
  readonly hostname?: string
  readonly cores?: number
  readonly user?: string
  /** root, passwordless sudo, sudo that needs a password, or none. */
  readonly privilege: 'root' | 'sudo-nopasswd' | 'sudo-password' | 'none'
  readonly gpus: number
  readonly scheduler: 'slurm' | 'pbs' | 'sge' | 'lsf' | 'none'
  readonly docker: 'usable' | 'no-permission' | 'absent'
  readonly systemd: boolean
}

export function parseProbe(output: string, at: Date): HostProbe | undefined {
  const s = parseSections(output)
  if (!s.has('end')) return undefined
  const kv = new Map<string, string>()
  for (const line of s.get('kv') ?? []) {
    const eq = line.indexOf('=')
    if (eq > 0) kv.set(line.slice(0, eq), line.slice(eq + 1).trim())
  }
  const get = (key: string) => {
    const value = kv.get(key)
    return value === undefined || value.length === 0 ? undefined : value
  }
  const sudo = get('sudo')
  const privilege = get('uid') === '0' ? 'root' : sudo === 'nopasswd' ? 'sudo-nopasswd' : sudo === 'password' ? 'sudo-password' : 'none'
  const scheduler = get('scheduler')
  const docker = get('docker')
  const cores = Number(get('cores'))
  return {
    at: at.toISOString(),
    ...get('os') === undefined ? {} : { os: get('os') },
    ...get('kernel') === undefined ? {} : { kernel: get('kernel') },
    ...get('arch') === undefined ? {} : { arch: get('arch') },
    ...get('hostname') === undefined ? {} : { hostname: get('hostname') },
    ...Number.isInteger(cores) && cores > 0 ? { cores } : {},
    ...get('user') === undefined ? {} : { user: get('user') },
    privilege,
    gpus: Number(get('gpus')) || 0,
    scheduler: scheduler === 'slurm' || scheduler === 'pbs' || scheduler === 'sge' || scheduler === 'lsf' ? scheduler : 'none',
    docker: docker === 'usable' || docker === 'no-permission' ? docker : 'absent',
    systemd: get('systemd') === 'yes',
  }
}
