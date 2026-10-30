/**
 * Service checks: what must be up on a server, as the owner lists it in the panel — a systemd unit active, a TCP
 * port listening, an HTTP URL answering — checked read-only on the server during every inspection. Each value is
 * validated and single-quoted, so a check cannot add shell syntax to the inspection script.
 * @module dsh-wisp-ops/service-checks
 */
import { shellQuote } from './ssh.ts'

export type ServiceCheck = { kind: 'unit'; name: string } | { kind: 'port'; port: number } | { kind: 'http'; url: string }
export interface ServiceResult { readonly kind: ServiceCheck['kind']; readonly target: string; readonly result: string; readonly ok: boolean }

export const MAX_CHECKS = 20
const UNIT = /^[A-Za-z0-9][A-Za-z0-9@._:-]{0,127}$/

/** Validate a host's check list; anything malformed is rejected rather than dropped. */
export function validateChecks(value: unknown): ServiceCheck[] {
  if (!Array.isArray(value) || value.length > MAX_CHECKS) throw new Error(`Service checks must be a list of at most ${MAX_CHECKS}`)
  const checks = value.map((raw): ServiceCheck => {
    const check = raw as Record<string, unknown>
    if (check?.kind === 'unit' && typeof check.name === 'string' && UNIT.test(check.name)) return { kind: 'unit', name: check.name }
    if (check?.kind === 'port' && Number.isInteger(check.port) && (check.port as number) >= 1 && (check.port as number) <= 65535) return { kind: 'port', port: check.port as number }
    if (check?.kind === 'http' && typeof check.url === 'string' && check.url.length <= 2048 && !/\s/.test(check.url)) {
      let url: URL
      try { url = new URL(check.url) } catch { throw new Error(`Invalid URL ${check.url.slice(0, 80)}`) }
      if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password) return { kind: 'http', url: check.url }
    }
    throw new Error('Invalid service check')
  })
  const keys = checks.map(describeCheck)
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate service check')
  return checks
}

export function describeCheck(check: ServiceCheck): string {
  return check.kind === 'unit' ? check.name : check.kind === 'port' ? String(check.port) : check.url
}

/** The shell line that runs one check; also what the deny list is matched against. */
export function checkLine(check: ServiceCheck): string {
  const target = shellQuote(describeCheck(check))
  switch (check.kind) {
    case 'unit': return `printf 'unit\\t%s\\t%s\\n' ${target} "$(systemctl is-active ${target} 2>/dev/null | head -n 1)"`
    case 'port': return `printf 'port\\t%s\\t%s\\n' ${target} "$( (ss -tln 2>/dev/null || netstat -tln 2>/dev/null) | awk '{print $4}' | grep -qE '[:.]'${target}'$' && echo listening || echo closed)"`
    case 'http': return `printf 'http\\t%s\\t%s\\n' ${target} "$(if command -v curl >/dev/null 2>&1; then curl -ksS -o /dev/null -m 8 -w '%{http_code}' ${target} 2>/dev/null; elif command -v wget >/dev/null 2>&1; then wget -q -O /dev/null -T 8 --no-check-certificate --server-response ${target} 2>&1 | awk '/^  HTTP\\//{c=$2} END{print c}'; else echo no-client; fi)"`
  }
}

/** The inspection script with this host's checks added before its end marker. */
export function withServiceChecks(script: string, checks: readonly ServiceCheck[] | undefined): string {
  if (!checks?.length) return script
  const end = script.lastIndexOf('echo @@end')
  return `${script.slice(0, end)}echo @@svc\n${checks.map(checkLine).join('\n')}\n${script.slice(end)}`
}

/** Results of the `@@svc` section; an HTTP check passes on 2xx and 3xx. */
export function parseServiceResults(lines: readonly string[]): ServiceResult[] {
  return lines.flatMap(text => {
    const [kind, target, result = ''] = text.split('\t')
    if ((kind !== 'unit' && kind !== 'port' && kind !== 'http') || !target) return []
    const ok = kind === 'unit' ? result === 'active' : kind === 'port' ? result === 'listening' : /^[23]\d\d$/.test(result)
    return [{ kind, target, result: result.slice(0, 40), ok }]
  })
}
