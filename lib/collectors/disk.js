/**
 * Disk-full diagnosis on one host: where the space is, what grew, which
 * large files are still held open by processes or sit in running Slurm job
 * directories, how much space deleted-but-open files pin, and which caches
 * are usually reclaimable. Everything here is read-only; cleanup goes
 * through `ops_exec` and its approval gate, and a later diagnosis of the
 * same path verifies the effect against the stored snapshot.
 * @module dsh-wisp-ops/collectors/disk
 */
import { shellQuote } from "../ssh.js";
import { formatKb, num, parseDf, parseDfInodes, parseSections } from "./sections.js";
/** Directories that commonly hold reclaimable data. */
const KNOWN_DIRS = [
    '/var/log', '/var/log/journal', '/var/cache/apt/archives', '/var/cache/yum', '/var/cache/dnf',
    '/var/lib/docker', '/var/lib/containerd', '/var/crash', '/var/lib/systemd/coredump', '/tmp', '/var/tmp',
    '$HOME/.cache/pip', '$HOME/.cache/huggingface', '$HOME/.conda/pkgs', '$HOME/miniconda3/pkgs',
    '$HOME/anaconda3/pkgs', '/opt/conda/pkgs', '/root/.cache',
];
/**
 * Shell lines that print `@@open` (pid, size-if-deleted, target for every open
 * fd whose target is listed in `$<listVar>` field 4 or is deleted),
 * `@@procs` for those pids, and `@@jobs` (running Slurm jobs and their
 * working directories). Shared by the disk and new-file collectors; the
 * caller defines `TAB`.
 */
export function holdersScript(listVar) {
    return String.raw `opn=$( { printf '%s\n' "$${listVar}" | cut -f4; echo '@@SPLIT@@'; find /proc/[0-9]*/fd -maxdepth 1 -type l -printf '%p\t%l\n' 2>/dev/null; } \
  | awk -F'\t' 'phase == 0 { if ($0 == "@@SPLIT@@") { phase = 1; next } want[$0] = 1; next }
      (($2 in want) || index($2, "(deleted)") > 0) { split($1, a, "/"); print a[3] "\t" $1 "\t" $2 }' \
  | while IFS="$TAB" read -r pid fd target; do
      case "$target" in (*"(deleted)") s=$(stat -L -c %s "$fd" 2>/dev/null || echo 0) ;; (*) s=- ;; esac
      printf '%s\t%s\t%s\n' "$pid" "$s" "$target"
    done | sort -u | head -n 2000 )
echo @@open
printf '%s\n' "$opn"
echo @@procs
pids=$(printf '%s\n' "$opn" | cut -f1 | grep -E '^[0-9]+$' | sort -un | head -n 500 | tr '\n' ',' | sed 's/,$//')
[ -n "$pids" ] && ps -o pid=,user=,etimes=,comm= -p "$pids" 2>/dev/null
echo @@jobs
command -v squeue >/dev/null 2>&1 && squeue -h -t R -o '%i|%u|%Z' 2>/dev/null | head -n 500
`;
}
/** Build the diagnosis script; every user value is single-quoted. */
export function diskScript(o) {
    const known = KNOWN_DIRS.map(d => d.startsWith('$HOME') ? `"$HOME${d.slice(5)}"` : shellQuote(d)).join(' ');
    const knownTimeout = Math.max(5, Math.min(15, Math.floor(o.walkTimeoutSec / 4)));
    return String.raw `export LC_ALL=C
P=${shellQuote(o.path)}; D=${o.depth}; N=${o.top}; MIN=${o.minFileMb}; RMIN=${o.recentMinFileMb}; REC=${o.recentMinutes}
TO=""; TK=""
if command -v timeout >/dev/null 2>&1; then TO="timeout ${o.walkTimeoutSec}"; TK="timeout ${knownTimeout}"; fi
TAB=$(printf '\t')
echo @@whoami
id -u
echo @@gnufind
find / -maxdepth 0 -printf 'ok\n' 2>/dev/null
echo @@df
d=$(df -PkT "$P" 2>/dev/null); [ "$(printf '%s\n' "$d" | wc -l)" -ge 2 ] || d=$(df -Pk "$P" 2>/dev/null); printf '%s\n' "$d"
echo @@dfi
df -Pi "$P" 2>/dev/null
echo @@du
out=$($TO du -xk -d "$D" "$P" 2>/dev/null); rc=$?
printf '%s\n' "$out" | sort -rn | head -n $((N + 1))
echo @@du_rc
echo "$rc"
NOW=$(date +%s)
files=$($TO find "$P" -xdev -type f -size +"$RMIN"M -printf '%s\t%T@\t%u\t%p\n' 2>/dev/null); frc=$?
echo @@big
printf '%s\n' "$files" | awk -F'\t' -v m=$((MIN * 1048576)) '$1 >= m' | sort -rn | head -n "$N"
echo @@recent
printf '%s\n' "$files" | awk -F'\t' -v t=$((NOW - REC * 60)) '$2 >= t' | sort -rn | head -n "$N"
echo @@find_rc
echo "$frc"
echo @@now
echo "$NOW"
${holdersScript('files')}echo @@journal
command -v journalctl >/dev/null 2>&1 && journalctl --disk-usage 2>/dev/null
echo @@docker
command -v docker >/dev/null 2>&1 && $TK docker system df 2>/dev/null
echo @@known
for d in ${known}; do
  [ -d "$d" ] || continue
  k=$($TK du -sxk "$d" 2>/dev/null | cut -f1)
  m=$(df -P "$d" 2>/dev/null | awk 'NR == 2 { print $NF }')
  printf '%s\t%s\t%s\n' "${'$'}{k:--}" "$m" "$d"
done
echo @@rotated
find /var/log -xdev -type f \( -name '*.gz' -o -name '*.xz' -o -name '*.bz2' -o -name '*.[0-9]' -o -name '*.old' \) -printf '%s\n' 2>/dev/null | awk '{ s += $1; n++ } END { print s + 0 "\t" n + 0 }'
echo @@end
`;
}
const KNOWN_HINTS = [
    [/\/var\/log\/journal$/, 'systemd journal: `journalctl --vacuum-size=<size>` or `--vacuum-time=<days>d` (sudo)'],
    [/\/var\/log$/, 'logs: check rotation (logrotate), compress or remove rotated *.gz files'],
    [/\/var\/cache\/apt\/archives$/, 'package cache: `apt-get clean` (sudo)'],
    [/\/var\/cache\/(?:yum|dnf)$/, 'package cache: `dnf clean all` / `yum clean all` (sudo)'],
    [/\/var\/lib\/(?:docker|containerd)$/, 'container storage: inspect `docker system df -v`; prune only unused images/volumes after confirming'],
    [/\/var\/crash$|\/coredump$/, 'crash dumps: inspect, then delete old dumps'],
    [/^\/(?:var\/)?tmp$/, 'temporary files: remove files older than a few days that no process holds'],
    [/\.cache\/pip$/, 'pip cache: `pip cache purge` as the owning user'],
    [/\.cache\/huggingface$/, 'model cache: weights may be in use by jobs; `huggingface-cli scan-cache` before deleting'],
    [/(?:conda|miniconda3|anaconda3)\/pkgs$/, 'conda package cache: `conda clean --all` as the owning user'],
    [/\/root\/\.cache$/, 'root user cache: review contents'],
];
function hintFor(path) {
    return KNOWN_HINTS.find(([re]) => re.test(path))?.[1] ?? 'review contents';
}
/** Parse the sections printed by {@link holdersScript}. */
export function parseHolders(s) {
    const procs = new Map();
    for (const line of s.get('procs') ?? []) {
        const [pid, user, elapsed, ...comm] = line.trim().split(/\s+/);
        const p = num(pid);
        if (p !== undefined)
            procs.set(p, { pid: p, ...user === undefined ? {} : { user }, ...num(elapsed) === undefined ? {} : { elapsedSec: num(elapsed) }, command: comm.join(' ') });
    }
    const holderOf = (pid) => procs.get(pid) ?? { pid };
    const openBy = new Map();
    const deleted = [];
    for (const line of s.get('open') ?? []) {
        const [pidText, size, ...rest] = line.split('\t');
        const pid = num(pidText);
        const target = rest.join('\t');
        if (pid === undefined)
            continue;
        if (target.endsWith(' (deleted)')) {
            const bytes = num(size) ?? 0;
            if (bytes > 0)
                deleted.push({ pid, bytes, path: target.slice(0, -' (deleted)'.length), holder: holderOf(pid) });
            continue;
        }
        const holders = openBy.get(target) ?? [];
        if (!holders.some(h => h.pid === pid))
            holders.push(holderOf(pid));
        openBy.set(target, holders);
    }
    deleted.sort((a, b) => b.bytes - a.bytes);
    const jobs = (s.get('jobs') ?? []).flatMap(line => {
        const [id, user, workdir] = line.split('|');
        return id === undefined || user === undefined || workdir === undefined || workdir.length === 0 ? [] : [{ id, user, workdir }];
    });
    return { openBy, deleted, jobs };
}
export function isUnder(path, dir) {
    const base = dir.endsWith('/') ? dir : `${dir}/`;
    return path === dir || path.startsWith(base);
}
/** Parse the diagnosis script's output, comparing against the previous snapshot. */
export function parseDisk(output, options, previous) {
    const s = parseSections(output);
    const notes = [];
    const filesystem = parseDf(s.get('df') ?? [])[0];
    const inodeUsePct = parseDfInodes(s.get('dfi') ?? [])[0]?.usePct;
    const fullVisibility = (s.get('whoami') ?? [])[0] === '0';
    const now = num((s.get('now') ?? [])[0]) ?? Date.now() / 1000;
    const duRc = num((s.get('du_rc') ?? [])[0]);
    const findRc = num((s.get('find_rc') ?? [])[0]);
    const walkIncomplete = duRc === 124 || findRc === 124;
    if (walkIncomplete)
        notes.push(`a directory walk hit the ${options.walkTimeoutSec}s deadline; lists are partial — narrow the path or raise walkTimeoutSec`);
    if (duRc !== undefined && duRc !== 0 && duRc !== 124)
        notes.push('du could not read some directories (permission denied); sizes are lower bounds — rerun with sudo for full totals');
    if (!fullVisibility)
        notes.push('not running as root: only your own processes are visible as file holders, and deleted-open totals cover only them');
    if ((s.get('gnufind') ?? [])[0] !== 'ok')
        notes.push('this host has no GNU find (-printf); large-file lists are empty — the diagnosis supports GNU/Linux targets');
    const dirs = (s.get('du') ?? []).flatMap(line => {
        const tab = line.indexOf('\t');
        const kb = num(line.slice(0, tab));
        return tab < 0 || kb === undefined ? [] : [{ path: line.slice(tab + 1), kb }];
    });
    const normalizedPath = options.path.length > 1 ? options.path.replace(/\/+$/, '') : options.path;
    const topDirs = dirs
        .filter(d => d.path !== normalizedPath)
        .slice(0, options.top)
        .map(d => {
        const before = previous?.dirs[d.path];
        return before === undefined ? d : { ...d, deltaKb: d.kb - before };
    });
    const { openBy, deleted, jobs } = parseHolders(s);
    // A deleted file no longer has a path on disk; attribute it by mount prefix.
    const deletedOpen = deleted.filter(d => filesystem === undefined || isUnder(d.path, filesystem.mount));
    const toEntry = (line) => {
        const [size, mtime, owner, ...path] = line.split('\t');
        const bytes = num(size);
        const modified = num(mtime);
        if (bytes === undefined || modified === undefined || owner === undefined)
            return undefined;
        const file = path.join('\t');
        const holders = openBy.get(file) ?? [];
        const job = jobs.find(j => isUnder(file, j.workdir));
        const recent = now - modified < 3600;
        const verdict = holders.length > 0
            ? 'in-use'
            : job !== undefined
                ? 'job-directory'
                : /\/core(?:\.\d+)?$|\.core$/.test(file)
                    ? 'core-dump'
                    : /\.(?:log\.\d+|\d+\.gz|gz|xz|bz2|old)$/.test(file) && /\/log(?:s)?\//.test(file)
                        ? 'rotated-log'
                        : recent
                            ? 'recently-written'
                            : 'review';
        return {
            path: file,
            bytes,
            modified: new Date(modified * 1000).toISOString(),
            owner,
            holders,
            ...job === undefined ? {} : { job },
            verdict,
        };
    };
    const largeFiles = (s.get('big') ?? []).map(toEntry).filter((e) => e !== undefined);
    const recentFiles = (s.get('recent') ?? []).map(toEntry).filter((e) => e !== undefined);
    const knownDirs = (s.get('known') ?? []).flatMap(line => {
        const [kb, mount, ...path] = line.split('\t');
        const dir = path.join('\t');
        if (dir.length === 0)
            return [];
        const size = num(kb);
        return [{
                path: dir,
                ...size === undefined ? {} : { kb: size },
                ...mount === undefined || mount.length === 0 ? {} : { mount },
                sameFilesystem: filesystem !== undefined && mount === filesystem.mount,
                hint: hintFor(dir),
            }];
    }).sort((a, b) => (b.kb ?? 0) - (a.kb ?? 0));
    const rotatedLine = (s.get('rotated') ?? [])[0]?.split('\t');
    const rotatedLogs = rotatedLine === undefined ? undefined : { bytes: num(rotatedLine[0]) ?? 0, count: num(rotatedLine[1]) ?? 0 };
    if (filesystem === undefined)
        notes.push(`df returned nothing for ${options.path}; the path may not exist`);
    const snapshot = filesystem === undefined
        ? undefined
        : {
            at: new Date().toISOString(),
            path: normalizedPath,
            usedKb: filesystem.usedKb,
            availKb: filesystem.availKb,
            usePct: filesystem.usePct,
            dirs: Object.fromEntries(dirs.map(d => [d.path, d.kb])),
        };
    const report = {
        path: normalizedPath,
        ...filesystem === undefined ? {} : { filesystem },
        ...inodeUsePct === undefined ? {} : { inodeUsePct },
        fullVisibility,
        walkIncomplete,
        topDirs,
        largeFiles,
        recentFiles,
        deletedOpen: deletedOpen.slice(0, options.top),
        deletedOpenBytes: deletedOpen.reduce((sum, d) => sum + d.bytes, 0),
        ...(s.get('journal') ?? []).length > 0 ? { journal: (s.get('journal') ?? []).join(' ') } : {},
        docker: s.get('docker') ?? [],
        knownDirs,
        ...rotatedLogs === undefined ? {} : { rotatedLogs },
        ...previous !== undefined && filesystem !== undefined
            ? { sincePrevious: { at: previous.at, usedDeltaKb: filesystem.usedKb - previous.usedKb, usePctBefore: previous.usePct } }
            : {},
        notes,
    };
    return snapshot === undefined ? { report } : { report, snapshot };
}
const VERDICT_TEXT = {
    'in-use': 'IN USE — do not delete; truncate or rotate only after checking the holder',
    'job-directory': 'inside a running Slurm job directory — ask the job owner',
    'rotated-log': 'rotated log — usually safe to remove',
    'core-dump': 'core dump — inspect, then usually safe to remove',
    'recently-written': 'written within the last hour — likely still growing',
    review: 'not held open — review before removing',
};
export function bytes(n) {
    return formatKb(n / 1024);
}
export function holderText(holders) {
    return holders.slice(0, 3).map(h => `${h.command ?? '?'}[${h.pid}${h.user === undefined ? '' : ` ${h.user}`}]`).join(', ');
}
/** Model-facing rendering of one diagnosis. */
export function renderDisk(host, r) {
    const lines = [];
    const fs = r.filesystem;
    lines.push(fs === undefined
        ? `## ${host}:${r.path}`
        : `## ${host}:${r.path} — ${fs.mount} (${fs.filesystem}) ${fs.usePct}% used, ${formatKb(fs.availKb)} free of ${formatKb(fs.sizeKb)}${r.inodeUsePct === undefined ? '' : `, inodes ${r.inodeUsePct}%`}`);
    if (r.sincePrevious !== undefined) {
        const d = r.sincePrevious.usedDeltaKb;
        lines.push(`Since previous diagnosis (${r.sincePrevious.at}): used ${d >= 0 ? '+' : '-'}${formatKb(Math.abs(d))} (${r.sincePrevious.usePctBefore}% → ${fs?.usePct}%)`);
    }
    for (const note of r.notes)
        lines.push(`Note: ${note}`);
    if (r.topDirs.length > 0) {
        lines.push('', 'Largest directories:');
        for (const d of r.topDirs) {
            lines.push(`  ${formatKb(d.kb).padStart(7)}  ${d.path}${d.deltaKb === undefined || d.deltaKb === 0 ? '' : `  (${d.deltaKb > 0 ? '+' : '-'}${formatKb(Math.abs(d.deltaKb))} since previous)`}`);
        }
    }
    const growing = r.topDirs.filter(d => (d.deltaKb ?? 0) > 0).sort((a, b) => (b.deltaKb ?? 0) - (a.deltaKb ?? 0));
    if (growing.length > 0)
        lines.push('', `Growth since previous diagnosis: ${growing.slice(0, 5).map(d => `${d.path} +${formatKb(d.deltaKb ?? 0)}`).join(', ')}`);
    const fileLine = (f) => `  ${bytes(f.bytes).padStart(7)}  ${f.path}  [${f.owner}, modified ${f.modified}] — ${VERDICT_TEXT[f.verdict]}${f.holders.length > 0 ? ` (held by ${holderText(f.holders)})` : ''}${f.job === undefined ? '' : ` (job ${f.job.id} of ${f.job.user})`}`;
    if (r.recentFiles.length > 0) {
        lines.push('', 'Large files modified recently (growth suspects):');
        for (const f of r.recentFiles)
            lines.push(fileLine(f));
    }
    if (r.largeFiles.length > 0) {
        lines.push('', 'Largest files:');
        for (const f of r.largeFiles)
            lines.push(fileLine(f));
    }
    if (r.deletedOpenBytes > 0) {
        lines.push('', `Deleted but still open: ${bytes(r.deletedOpenBytes)} is pinned by processes; deleting more files will not free it. Restart/reload the holder, or truncate through /proc/<pid>/fd after confirming:`);
        for (const d of r.deletedOpen)
            lines.push(`  ${bytes(d.bytes).padStart(7)}  ${d.path}  held by ${holderText([d.holder])}`);
    }
    const known = r.knownDirs.filter(k => (k.kb ?? 0) >= 100 * 1024);
    if (known.length > 0) {
        lines.push('', 'Common reclaimable locations:');
        for (const k of known)
            lines.push(`  ${formatKb(k.kb ?? 0).padStart(7)}  ${k.path}${k.sameFilesystem ? '' : ` (on ${k.mount ?? 'another filesystem'})`} — ${k.hint}`);
    }
    if (r.rotatedLogs !== undefined && r.rotatedLogs.count > 0)
        lines.push(`Rotated logs under /var/log: ${r.rotatedLogs.count} files, ${bytes(r.rotatedLogs.bytes)}`);
    if (r.journal !== undefined)
        lines.push(`Journal: ${r.journal}`);
    if (r.docker.length > 0)
        lines.push('', 'docker system df:', ...r.docker.map(l => `  ${l}`));
    return lines.join('\n');
}
