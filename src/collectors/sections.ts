/**
 * Collector scripts print `@@<name>` marker lines between sections so that
 * one round trip returns many independent probes. A probe that is missing on
 * the host (no GPU, no Slurm, no systemd) prints nothing and its section is
 * simply empty.
 * @module dsh-wisp-ops/collectors/sections
 */

/** Split collector output into named sections. */
export function parseSections(output: string): Map<string, string[]> {
  const sections = new Map<string, string[]>()
  let current: string[] | undefined
  for (const line of output.split('\n')) {
    const marker = /^@@([a-z0-9_]+)$/.exec(line)
    if (marker !== null) {
      current = []
      sections.set(marker[1] as string, current)
      continue
    }
    if (current !== undefined && line.length > 0) current.push(line)
  }
  return sections
}

/** Number or undefined for a non-numeric field. */
export function num(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

export interface FsUsage {
  readonly filesystem: string
  readonly type?: string
  readonly sizeKb: number
  readonly usedKb: number
  readonly availKb: number
  readonly usePct: number
  readonly mount: string
}

/** Parse `df -PkT` (with type) or `df -Pk` output. */
export function parseDf(lines: readonly string[]): FsUsage[] {
  const result: FsUsage[] = []
  for (const line of lines) {
    if (/^Filesystem\s/.test(line)) continue
    const fields = line.trim().split(/\s+/)
    const withType = fields.length >= 7
    const [filesystem, type, size, used, avail, pct, ...mount] = withType ? fields : [fields[0], undefined, ...fields.slice(1)]
    const usePct = num(pct?.replace('%', ''))
    const sizeKb = num(size)
    if (filesystem === undefined || usePct === undefined || sizeKb === undefined) continue
    result.push({
      filesystem,
      ...type === undefined ? {} : { type },
      sizeKb,
      usedKb: num(used) ?? 0,
      availKb: num(avail) ?? 0,
      usePct,
      mount: mount.join(' '),
    })
  }
  return result
}

export interface InodeUsage {
  readonly mount: string
  readonly usePct: number
}

/** Parse `df -Pi`; filesystems without inode accounting report `-`. */
export function parseDfInodes(lines: readonly string[]): InodeUsage[] {
  const result: InodeUsage[] = []
  for (const line of lines) {
    if (/^Filesystem\s/.test(line)) continue
    const fields = line.trim().split(/\s+/)
    const usePct = num(fields[4]?.replace('%', ''))
    if (usePct === undefined) continue
    result.push({ mount: fields.slice(5).join(' '), usePct })
  }
  return result
}

/** Human-readable size from kilobytes. */
export function formatKb(kb: number): string {
  const units = ['K', 'M', 'G', 'T', 'P']
  let value = kb
  let unit = 0
  while (Math.abs(value) >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)}${units[unit]}`
}
