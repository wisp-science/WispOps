/**
 * Shell command risk classification.
 *
 * The classifier is fail-closed: a command is `read` only when every simple
 * command in it is a known read-only program used in a read-only way and no
 * output is redirected into a file. Anything unrecognized is at least
 * `change`. Pattern matching can never fully understand shell, so this is a
 * policy input, not a sandbox: approval and grants are the enforcement.
 * @module dsh-wisp-ops/risk
 */

/** Ordered risk levels; each level includes everything below it. */
export type RiskLevel = 'read' | 'change' | 'destructive'

export const RISK_ORDER: Record<RiskLevel, number> = { read: 0, change: 1, destructive: 2 }

/** Classification of one command string. */
export interface RiskAssessment {
  /** Highest level found in any segment. */
  readonly level: RiskLevel
  /** Whether the command itself escalates privilege (sudo, su, doas, pkexec). */
  readonly elevates: boolean
  /** Human-readable reasons for every non-read finding, deduplicated. */
  readonly reasons: readonly string[]
}

/** Destructive patterns are matched against the whole command text. */
const DESTRUCTIVE_PATTERNS: readonly (readonly [RegExp, string])[] = [
  [/(?:^|[\s;&|(`'"])(?:rm|unlink|shred|rmdir)(?=\s|$)/, 'deletes files'],
  [/\bfind\b[^;&|]*\s-delete\b/, 'bulk-deletes files with find -delete'],
  [/\bfind\b[^;&|]*\s-exec(?:dir)?\s+(?:\S*\/)?(?:rm|unlink|shred)\b/, 'bulk-deletes files with find -exec rm'],
  [/\bxargs\b[^;&|]*\b(?:rm|unlink|shred)\b/, 'bulk-deletes files with xargs rm'],
  [/\b(?:python3?|perl|ruby|php|node)\b.*\b(?:unlink(?:Sync)?|rmtree|rmSync|os\.remove|shutil\.rmtree)\b/, 'deletes files from an interpreter'],
  [/\b(?:mkfs(?:\.\w+)?|wipefs|fdisk|sfdisk|parted|sgdisk|mkswap)\b/, 'formats or repartitions a disk'],
  [/\bdd\b[^;&|]*\bof=/, 'writes raw data with dd'],
  [/>\s*\/dev\/(?:sd|nvme|vd|xvd|hd|md|dm-|mapper\/)/, 'overwrites a block device'],
  [/\btruncate\b[^;&|]*\s-s\b/, 'truncates files'],
  [/(?:^|[\s;&|(`'"])(?:reboot|shutdown|poweroff|halt)\b/, 'reboots or shuts down the host'],
  [/\binit\s+[06]\b/, 'reboots or shuts down the host'],
  [/\bsystemctl\s+(?:\S+\s+)*(?:reboot|poweroff|halt|kexec|rescue|emergency)\b/, 'reboots or shuts down the host'],
  [/\bkill\s+(?:-\S+\s+)*-?1\b(?!\d)/, 'signals every process (kill -1 / kill 1)'],
  [/\bdocker\s+(?:(?:container|image|volume|network|system|builder)\s+)?(?:rm|rmi|prune)\b/, 'removes containers, images, or volumes'],
  [/\b(?:kubectl\s+delete|helm\s+(?:uninstall|delete)|terraform\s+destroy)\b/, 'destroys deployed resources'],
  [/\b(?:drop\s+(?:database|schema|table|user)|truncate\s+table)\b/i, 'destroys database objects'],
  [/\bgit\s+(?:clean\s+-\S*f|reset\s+--hard|push\s+(?:\S+\s+)*(?:-f|--force))\b/, 'irreversibly discards git state'],
  [/\b(?:userdel|groupdel)\b/, 'deletes accounts'],
  [/\bcrontab\s+(?:\S+\s+)*-r\b/, 'removes a crontab'],
  [/\b(?:lvremove|vgremove|pvremove|zfs\s+destroy|zpool\s+destroy|btrfs\s+subvolume\s+delete)\b/, 'destroys storage volumes'],
  [/\b(?:iptables|ip6tables|nft)\s+(?:\S+\s+)*(?:-F|--flush|flush)\b/, 'flushes firewall rules'],
  [/\bchmod\s+(?:\S+\s+)*-R\s+(?:\S+\s+)?\/(?:\s|$)|\bchown\s+(?:\S+\s+)*-R\s+(?:\S+\s+)?\/(?:\s|$)/, 'recursively changes permissions on /'],
  [/\bjournalctl\b[^;&|]*--vacuum-/, 'deletes journal files'],
  [/\b(?:apt-get|apt|yum|dnf|zypper|apk|pacman)\s+(?:\S+\s+)*(?:remove|purge|autoremove|erase|del)\b/, 'removes packages'],
  [/\bscancel\b[^;&|]*(?:\s-u\b|--user|\s--all\b)/, 'cancels jobs in bulk'],
]

/** Programs that only read state when used without write flags. */
const READ_PROGRAMS = new Set([
  'ls', 'cat', 'head', 'tail', 'grep', 'egrep', 'fgrep', 'zgrep', 'zcat', 'less', 'more',
  'wc', 'sort', 'uniq', 'cut', 'tr', 'column', 'nl', 'rev', 'tac', 'paste', 'join', 'comm', 'diff', 'cmp',
  'echo', 'printf', 'true', 'false', 'test', '[', 'date', 'cal', 'sleep', 'seq', 'expr', 'basename', 'dirname',
  'readlink', 'realpath', 'stat', 'file', 'md5sum', 'sha1sum', 'sha256sum', 'cksum', 'tree', 'pwd', 'cd',
  'hostname', 'hostnamectl', 'uname', 'whoami', 'id', 'groups', 'who', 'w', 'last', 'lastlog', 'users', 'getent',
  'uptime', 'free', 'df', 'du', 'ps', 'pgrep', 'pstree', 'top', 'htop', 'vmstat', 'iostat', 'mpstat', 'pidstat',
  'sar', 'nproc', 'lscpu', 'lsblk', 'blkid', 'lsmem', 'lspci', 'lsusb', 'lsmod', 'lsof', 'fuser', 'findmnt',
  'dmesg', 'journalctl', 'systemctl', 'service', 'timedatectl', 'loginctl', 'ss', 'netstat', 'ip', 'ifconfig',
  'route', 'ping', 'traceroute', 'tracepath', 'dig', 'nslookup', 'host', 'curl', 'which', 'whereis', 'type',
  'command', 'env', 'printenv', 'locale', 'getconf', 'ulimit', 'sysctl', 'find', 'sed', 'awk', 'gawk', 'mawk',
  'jq', 'xargs', 'nvidia-smi', 'nvtop', 'gpustat', 'rocm-smi', 'sinfo', 'squeue', 'sacct', 'sshare', 'sprio',
  'sstat', 'scontrol', 'docker', 'podman', 'crictl', 'kubectl', 'crontab', 'git', 'apt', 'dpkg', 'dpkg-query',
  'rpm', 'pip', 'pip3', 'conda', 'mamba', 'module', 'smartctl', 'mdadm', 'zpool', 'zfs', 'mount', 'quota',
  'repquota', 'iotop', 'tcpdump', 'strings', 'od', 'hexdump', 'xxd', 'base64', 'timeout', 'nice', 'ionice',
  'time', 'stdbuf', 'nohup', 'exec', 'watch', 'openssl', 'ldd', 'cat', 'python', 'python3', 'tmux', 'screen',
])

/** Wrapper programs whose real command follows their own options. */
const WRAPPERS = new Set(['sudo', 'doas', 'timeout', 'nice', 'ionice', 'time', 'stdbuf', 'nohup', 'exec', 'command', 'env', 'xargs', 'watch'])

const ELEVATORS = new Set(['sudo', 'su', 'doas', 'pkexec', 'run0'])

/** One simple-command span; `masked` has quoted operators blanked, same length as `text`. */
export interface Segment {
  readonly text: string
  readonly masked: string
}

/** Split a command into simple-command segments on shell operators and substitutions. */
export function splitSegments(command: string): Segment[] {
  const source = command.replace(/\\\n/g, '  ')
  const masked = maskQuoted(source)
  const segments: Segment[] = []
  const separator = /\|\||&&|\|&?|;|(?<![<>])&(?!>)|\n|`|\$\(|[(){}]/g
  let start = 0
  const push = (end: number) => {
    const text = source.slice(start, end)
    if (text.trim().length > 0) segments.push({ text: text.trim(), masked: masked.slice(start, end).trim() })
  }
  for (let m = separator.exec(masked); m !== null; m = separator.exec(masked)) {
    push(m.index)
    start = m.index + m[0].length
  }
  push(source.length)
  return segments
}

/** Whitespace tokenization that keeps quoted spans together and strips the quotes. */
export function tokenize(segment: string): string[] {
  const tokens: string[] = []
  const re = /"((?:\\.|[^"\\])*)"|'([^']*)'|(\S+)/g
  for (let m = re.exec(segment); m !== null; m = re.exec(segment)) {
    tokens.push(m[1] ?? m[2] ?? m[3] ?? '')
  }
  return tokens
}

/** Program name after leading assignments; the basename of a path. */
function programOf(tokens: readonly string[], start: number): { program: string; index: number } | undefined {
  let index = start
  while (index < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index] ?? '')) index++
  const token = tokens[index]
  if (token === undefined) return undefined
  return { program: token.slice(token.lastIndexOf('/') + 1), index }
}

/** Skip a wrapper's own options (and the duration argument of timeout). */
function skipWrapperArgs(program: string, tokens: readonly string[], index: number): number {
  let i = index + 1
  const takesValue: Record<string, ReadonlySet<string>> = {
    sudo: new Set(['-u', '-g', '-C', '-D', '-h', '-p', '-r', '-t', '-U']),
    nice: new Set(['-n']),
    ionice: new Set(['-c', '-n', '-p']),
    timeout: new Set(['-s', '-k', '--signal', '--kill-after']),
    xargs: new Set(['-n', '-P', '-I', '-L', '-s', '-d', '-E', '-a']),
    watch: new Set(['-n', '-d']),
    stdbuf: new Set(['-i', '-o', '-e']),
  }
  const valued = takesValue[program] ?? new Set<string>()
  while (i < tokens.length) {
    const token = tokens[i] ?? ''
    if (token === '--') { i++; break }
    if (!token.startsWith('-')) break
    i += valued.has(token) ? 2 : 1
  }
  if (program === 'timeout' && i < tokens.length) i++
  if (program === 'env') {
    while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i] ?? '')) i++
  }
  return i
}

/** Decide whether one known-read program is used in a writing way. */
function readProgramWrites(program: string, args: readonly string[]): string | undefined {
  const joined = ` ${args.join(' ')} `
  const first = args.find(a => !a.startsWith('-'))
  switch (program) {
    case 'systemctl':
    case 'service': {
      const verbs = /\s(start|stop|restart|reload|try-restart|reload-or-restart|enable|disable|mask|unmask|kill|isolate|daemon-reload|set-property|edit|link|revert|preset|reset-failed)\s/
      return verbs.test(joined) ? `${program} changes service state` : undefined
    }
    case 'journalctl':
      return /\s--(?:rotate|flush|sync|relinquish-var|setup-keys)\b/.test(joined) ? 'journalctl maintenance' : undefined
    case 'find':
      return /\s-(?:exec|execdir|ok|okdir|fprint|fprint0|fprintf|fls)\s/.test(joined) ? 'find runs commands or writes files' : undefined
    case 'sed':
      return /\s(?:-i\S*|--in-place\S*)\s|\s-[a-zA-Z]*i[a-zA-Z]*\s/.test(joined) ? 'sed edits files in place' : undefined
    case 'awk': case 'gawk': case 'mawk':
      return /system\s*\(|print[^;}]*>|\|\s*getline|-i\s+inplace/.test(joined) ? 'awk runs commands or writes files' : undefined
    case 'curl':
      return /\s(?:-o|-O|--output|--remote-name|-T|--upload-file|-d|--data\S*|-F|--form)\s|\s-X\s*(?:POST|PUT|DELETE|PATCH)\b|\s--request\s+(?:POST|PUT|DELETE|PATCH)\b/i.test(joined) ? 'curl writes files or sends data' : undefined
    case 'ip':
      return /\s(?:add|del|delete|change|replace|set|flush|append)\s/.test(joined) ? 'ip changes network configuration' : undefined
    case 'sysctl':
      return /\s-w\s|=|\s-p\b|\s--load\b|\s--system\b/.test(joined) ? 'sysctl writes kernel parameters' : undefined
    case 'docker': case 'podman': {
      const readVerbs = new Set(['ps', 'images', 'inspect', 'logs', 'info', 'version', 'stats', 'top', 'port', 'history', 'events', 'df', 'ls', 'diff'])
      const nouns = new Set(['system', 'container', 'image', 'volume', 'network', 'compose', 'buildx', 'node', 'service'])
      const words = args.filter(a => !a.startsWith('-'))
      const verb = nouns.has(words[0] ?? '') ? words[1] : words[0]
      if (words[0] === 'stats' && !joined.includes('--no-stream')) return 'docker stats streams forever; add --no-stream'
      return verb !== undefined && readVerbs.has(verb) ? undefined : `${program} ${words.slice(0, 2).join(' ')} changes containers`
    }
    case 'crictl':
      return ['ps', 'images', 'inspect', 'logs', 'info', 'version', 'stats', 'pods'].includes(first ?? '') ? undefined : 'crictl changes containers'
    case 'kubectl':
      return ['get', 'describe', 'logs', 'top', 'version', 'explain', 'api-resources', 'cluster-info', 'config'].includes(first ?? '') && !/\sconfig\s+(?:set|use|delete|rename)/.test(joined) ? undefined : 'kubectl changes cluster state'
    case 'scontrol':
      return ['show', 'ping', 'version', 'listpids'].includes(first ?? '') ? undefined : 'scontrol changes Slurm state'
    case 'crontab':
      return /\s-l\s/.test(joined) ? undefined : 'crontab edits schedules'
    case 'git':
      return ['status', 'log', 'diff', 'show', 'branch', 'remote', 'rev-parse', 'describe', 'blame', 'ls-files', 'shortlog', 'tag'].includes(first ?? '') && !/\s(?:-d|-D|--delete|add|set-url|remove|rm)\s/.test(joined) ? undefined : 'git changes the repository'
    case 'apt':
      return ['list', 'show', 'policy', 'search', 'depends', 'rdepends'].includes(first ?? '') ? undefined : 'apt changes packages'
    case 'dpkg':
      return /\s-(?:i|r|P|-install|-remove|-purge|-configure|-unpack)\b/.test(joined) ? 'dpkg changes packages' : undefined
    case 'rpm':
      return /\s-(?:i|U|F|e)\S*|\s--(?:install|upgrade|freshen|erase|import|rebuilddb)\b/.test(joined) ? 'rpm changes packages' : undefined
    case 'pip': case 'pip3':
      return ['list', 'show', 'freeze', 'check', 'config', 'cache'].includes(first ?? '') && !/\scache\s+(?:purge|remove)\b/.test(joined) ? undefined : 'pip changes packages'
    case 'conda': case 'mamba':
      return ['list', 'info', 'search', 'env'].includes(first ?? '') && !/\senv\s+(?:create|remove|update)\b/.test(joined) ? undefined : 'conda changes environments'
    case 'mount':
      return args.length === 0 || /^\s+(?:-l|-t\s+\S+)\s*$/.test(joined) ? undefined : 'mount changes mounts'
    case 'zpool': case 'zfs':
      return ['list', 'status', 'get', 'iostat', 'history'].includes(first ?? '') ? undefined : `${program} changes storage`
    case 'mdadm':
      return /\s--(?:detail|examine|query)\b|\s-D\b|\s-E\b|\s-Q\b/.test(joined) ? undefined : 'mdadm changes arrays'
    case 'nvidia-smi':
      return /\s(?:-pm|-r|--gpu-reset|-pl|--power-limit|-ac|--applications-clocks|-rac|-c|--compute-mode|-e|--ecc-config|-mig|-lgc|-rgc|-lmc|-rmc)\b/.test(joined) ? 'nvidia-smi changes GPU settings' : undefined
    case 'smartctl':
      return /\s(?:-s|--smart|-t|--test|-X|--abort|-o|--offlineauto)\b/.test(joined) ? 'smartctl changes drive settings' : undefined
    case 'openssl':
      return /\s-out\s/.test(joined) ? 'openssl writes files' : undefined
    case 'python': case 'python3':
      return args.length === 0 || /^\s+(?:-V|--version)\s*$/.test(joined) ? undefined : 'runs an interpreter script'
    case 'tmux': case 'screen':
      return /\s(?:ls|list-sessions|-ls|-list)\s/.test(joined) ? undefined : `${program} starts or controls sessions`
    case 'tcpdump':
      return /\s-w\s/.test(joined) ? 'tcpdump writes capture files' : undefined
    default:
      return undefined
  }
}

/** Output redirection into anything but /dev/null or another descriptor writes a file. */
function redirectsToFile(segment: string): boolean {
  const re = /(?:^|[^<>&0-9])(?:\d|&)?>>?\|?\s*(\S+)?/g
  for (let m = re.exec(segment); m !== null; m = re.exec(segment)) {
    const target = m[1]
    if (target === undefined) return true
    if (target.startsWith('&') || target === '/dev/null' || target.startsWith('/dev/null')) continue
    if (/^(?:\/dev\/std(?:out|err)|\/dev\/fd\/\d)$/.test(target)) continue
    return true
  }
  return false
}

/** Blank shell operators inside quoted spans, preserving every offset. */
export function maskQuoted(command: string): string {
  return command.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, span => span.replace(/[;&|`()<>{}\n$]/g, ' '))
}

/** Classify one shell command string. */
export function classifyCommand(command: string, extraReadPrograms: ReadonlySet<string> = new Set()): RiskAssessment {
  const reasons = new Set<string>()
  let level: RiskLevel = 'read'
  let elevates = false
  const raise = (to: RiskLevel, reason: string) => {
    if (RISK_ORDER[to] > RISK_ORDER[level]) level = to
    reasons.add(reason)
  }

  // Quoted text is matched too: `sh -c 'rm -rf x'` must not hide a deletion,
  // at the cost of flagging `grep 'reboot' log` for approval.
  for (const [pattern, reason] of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) raise('destructive', reason)
  }

  for (const segment of splitSegments(command)) {
    if (redirectsToFile(segment.masked)) raise('change', 'redirects output into a file')
    const tokens = tokenize(segment.text)
    let found = programOf(tokens, 0)
    while (found !== undefined && WRAPPERS.has(found.program)) {
      if (ELEVATORS.has(found.program)) elevates = true
      if (found.program === 'command' && /^-[vV]$/.test(tokens[found.index + 1] ?? '')) { found = undefined; break }
      if (found.program === 'env' && found.index + 1 >= tokens.length) { found = undefined; break }
      found = programOf(tokens, skipWrapperArgs(found.program, tokens, found.index))
    }
    if (found === undefined) continue
    const { program, index } = found
    if (ELEVATORS.has(program)) {
      elevates = true
      raise('change', `${program} opens a privileged shell`)
      continue
    }
    if (program.startsWith('-') || program === '!' || program === 'then' || program === 'do' || program === 'else' || program === 'fi' || program === 'done' || program === 'esac') continue
    if (/^(?:for|while|until|if|case|in|function|select|local|export|readonly|declare|set|shift|return|break|continue|unset|read)$/.test(program)) continue
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(program)) continue
    if (!READ_PROGRAMS.has(program) && !extraReadPrograms.has(program)) {
      raise('change', `runs ${program}`)
      continue
    }
    const writes = readProgramWrites(program, tokens.slice(index + 1))
    if (writes !== undefined) raise('change', writes)
  }
  return { level, elevates, reasons: [...reasons] }
}
