/**
 * Recent-file analysis (近期新增文件分析): what appeared or changed under some
 * paths in the last N days, where it landed, who wrote it, what kind of data
 * it is (with sequencing and analysis-pipeline knowledge), which of it is
 * still in use, which files a sibling makes redundant, which pipeline work
 * directories belong to finished runs, and a cleanup plan ordered by
 * reclaimable space. Read-only; the plan is executed through ops_exec.
 * @module dsh-wisp-ops/collectors/files
 */
import { shellQuote } from "../ssh.js";
import { bytes, holdersScript, holderText, isUnder, parseHolders } from "./disk.js";
import { classifyPath, findRedundant, kindById, RETENTION_LABEL, RETENTION_ORDER } from "./omics.js";
import { formatKb, num, parseSections } from "./sections.js";
/** Build the scan script; every root is single-quoted. */
export function filesScript(o) {
    const roots = o.paths.map(shellQuote).join(' ');
    const pipelineTimeout = Math.max(5, Math.min(30, Math.floor(o.walkTimeoutSec / 4)));
    return String.raw `export LC_ALL=C
DAYS=${o.days}; D=${o.depth}; N=${o.top}; LIST=$((${o.listMinMb} * 1048576)); MAXF=${o.maxFiles}
TO=""; TK=""
if command -v timeout >/dev/null 2>&1; then TO="timeout ${o.walkTimeoutSec}"; TK="timeout ${pipelineTimeout}"; fi
TAB=$(printf '\t')
echo @@whoami
id -u
echo @@gnufind
find / -maxdepth 0 -printf 'ok\n' 2>/dev/null
echo @@now
date +%s
scan() {
  for R in ${roots}; do
    printf 'ROOT\t%s\n' "$R"
    $TO find "$R" -xdev -type f -mtime -"$DAYS" -printf '%s\t%T@\t%u\t%p\n' 2>/dev/null
    printf 'RC\t%s\t%s\n' "$?" "$R"
  done
}
agg=$(scan | awk -F'\t' -v depth="$D" -v list="$LIST" '
  $1 == "ROOT" { root = $2; next }
  $1 == "RC" { print "R\t" $2 "\t" $3; next }
  {
    size = $1; total += size; n++
    rel = substr($4, length(root) + 2); m = split(rel, parts, "/")
    k = root; for (i = 1; i <= depth && i < m; i++) k = k "/" parts[i]
    ds[k] += size; dn[k]++
    us[$3] += size; un[$3]++
    if (size >= list) print "F\t" $0
  }
  END {
    print "T\t" total + 0 "\t" n + 0
    for (k in ds) print "D\t" ds[k] "\t" dn[k] "\t" k
    for (u in us) print "U\t" us[u] "\t" un[u] "\t" u
  }')
echo @@total
printf '%s\n' "$agg" | awk -F'\t' '$1 == "T" { print $2 "\t" $3 }'
echo @@rc
printf '%s\n' "$agg" | awk -F'\t' '$1 == "R" { print $2 "\t" $3 }'
echo @@dirs
printf '%s\n' "$agg" | awk -F'\t' '$1 == "D" { print $2 "\t" $3 "\t" $4 }' | sort -rn | head -n "$N"
echo @@users
printf '%s\n' "$agg" | awk -F'\t' '$1 == "U" { print $2 "\t" $3 "\t" $4 }' | sort -rn | head -n 20
echo @@files
flist=$(printf '%s\n' "$agg" | awk -F'\t' '$1 == "F" { print $2 "\t" $3 "\t" $4 "\t" $5 }' | sort -rn | head -n "$MAXF")
printf '%s\n' "$flist"
${holdersScript('flist')}echo @@pipelines
for R in ${roots}; do
  $TO find "$R" -xdev -maxdepth 6 -type d \( -name work -o -name .snakemake -o -name _STARtmp -o -name 'SC_*_CS' -o -name '*_tmp' -o -name tmp \) -prune -print 2>/dev/null
done | head -n 100 | while IFS= read -r d; do
  base=$(basename "$d"); parent=$(dirname "$d"); state=-
  case "$base" in
    (work)
      ls "$d" 2>/dev/null | grep -qE '^[0-9a-f]{2}$' || continue
      if [ -f "$parent/.nextflow.log" ]; then
        if tail -n 50 "$parent/.nextflow.log" 2>/dev/null | grep -q 'Execution complete -- Goodbye'; then state=complete
        elif tail -n 300 "$parent/.nextflow.log" 2>/dev/null | grep -qiE 'Execution aborted|Session aborted|ERROR ~'; then state=failed
        else state=running-or-unknown; fi
      fi ;;
    (.snakemake)
      if [ -n "$(ls -A "$d/incomplete" 2>/dev/null)" ]; then state=incomplete-jobs; elif [ -d "$d/locks" ] && [ -n "$(ls -A "$d/locks" 2>/dev/null)" ]; then state=locked-running; else state=idle; fi ;;
    (SC_*_CS)
      if [ -f "$parent/outs/web_summary.html" ]; then state=complete; else state=no-outs; fi ;;
  esac
  k=$($TK du -sxk "$d" 2>/dev/null | cut -f1)
  m=$(find "$d" -maxdepth 0 -printf '%T@' 2>/dev/null)
  printf '%s\t%s\t%s\t%s\n' "${'$'}{k:--}" "${'$'}{m:-0}" "$state" "$d"
done
echo @@end
`;
}
function pipelineKind(path) {
    const base = path.slice(path.lastIndexOf('/') + 1);
    if (base === 'work')
        return 'nextflow';
    if (base === '.snakemake')
        return 'snakemake';
    if (base === '_STARtmp')
        return 'star';
    if (/^SC_.*_CS$/.test(base))
        return 'cellranger';
    return 'tmp';
}
/** Parse the scan output and build the cleanup plan. */
export function parseFiles(output, options, previous) {
    const s = parseSections(output);
    const notes = ['Job-directory checks cover visible Slurm/PBS/LSF jobs, up to 500 per scheduler. Missing tools, permissions or scheduler failures can hide active jobs; verify with the owner before cleanup.'];
    const fullVisibility = (s.get('whoami') ?? [])[0] === '0';
    const [totalText, countText] = (s.get('total') ?? [])[0]?.split('\t') ?? [];
    const totalBytes = num(totalText) ?? 0;
    const totalFiles = num(countText) ?? 0;
    const incompleteRoots = (s.get('rc') ?? []).flatMap(line => {
        const [rc, root] = line.split('\t');
        return rc === '124' && root !== undefined ? [root] : [];
    });
    if (incompleteRoots.length > 0)
        notes.push(`the scan of ${incompleteRoots.join(', ')} hit the ${options.walkTimeoutSec}s deadline; totals are partial — narrow the paths or raise walkTimeoutSec`);
    if (!fullVisibility)
        notes.push('not running as root: unreadable directories are skipped and only your own processes show up as file holders');
    if ((s.get('gnufind') ?? [])[0] !== 'ok')
        notes.push('this host has no GNU find (-printf); file lists are empty — the analysis supports GNU/Linux targets');
    const dirs = (s.get('dirs') ?? []).flatMap(line => {
        const [b, f, ...p] = line.split('\t');
        const path = p.join('\t');
        const size = num(b);
        if (size === undefined || path.length === 0)
            return [];
        const before = previous?.dirs[path];
        return [{ path, bytes: size, files: num(f) ?? 0, ...before === undefined ? {} : { deltaBytes: size - before } }];
    });
    const users = (s.get('users') ?? []).flatMap(line => {
        const [b, f, user] = line.split('\t');
        return user === undefined || num(b) === undefined ? [] : [{ user, bytes: num(b), files: num(f) ?? 0 }];
    });
    const { openBy, jobs } = parseHolders(s);
    const raw = (s.get('files') ?? []).flatMap(line => {
        const [b, mtime, owner, ...p] = line.split('\t');
        const size = num(b);
        const modified = num(mtime);
        const path = p.join('\t');
        return size === undefined || modified === undefined || owner === undefined || path.length === 0 ? [] : [{ path, bytes: size, modifiedSec: modified, owner }];
    });
    const redundant = new Map(findRedundant(raw.map(f => f.path)).map(r => [r.path, r]));
    const files = raw.map(f => {
        const job = jobs.find(j => isUnder(f.path, j.workdir));
        const redundantWith = redundant.get(f.path);
        return {
            path: f.path,
            bytes: f.bytes,
            modified: new Date(f.modifiedSec * 1000).toISOString(),
            owner: f.owner,
            kind: classifyPath(f.path),
            holders: openBy.get(f.path) ?? [],
            ...job === undefined ? {} : { job },
            ...redundantWith === undefined ? {} : { redundantWith },
        };
    });
    const classifiedBytes = files.reduce((sum, f) => sum + f.bytes, 0);
    const classifiedShare = totalBytes > 0 ? Math.min(1, classifiedBytes / totalBytes) : 1;
    const kindTotals = new Map();
    for (const f of files) {
        const entry = kindTotals.get(f.kind.id) ?? { kind: f.kind, bytes: 0, files: 0 };
        entry.bytes += f.bytes;
        entry.files++;
        kindTotals.set(f.kind.id, entry);
    }
    const byKind = [...kindTotals.values()].sort((a, b) => b.bytes - a.bytes);
    const pipelines = (s.get('pipelines') ?? []).flatMap(line => {
        const [kb, mtime, state, ...p] = line.split('\t');
        const path = p.join('\t');
        if (path.length === 0)
            return [];
        return [{
                path,
                ...num(kb) === undefined ? {} : { kb: num(kb) },
                modified: new Date((num(mtime) ?? 0) * 1000).toISOString(),
                state: state ?? '-',
                kind: pipelineKind(path),
            }];
    }).sort((a, b) => (b.kb ?? 0) - (a.kb ?? 0));
    const plan = buildPlan(files, pipelines, jobs);
    const snapshot = {
        at: new Date().toISOString(),
        roots: options.paths,
        days: options.days,
        totalBytes,
        totalFiles,
        dirs: Object.fromEntries(dirs.map(d => [d.path, d.bytes])),
    };
    return {
        report: {
            roots: options.paths,
            days: options.days,
            totalBytes,
            totalFiles,
            classifiedShare,
            incompleteRoots,
            fullVisibility,
            dirs,
            users,
            byKind,
            files,
            pipelines,
            plan,
            ...previous === undefined ? {} : { sincePrevious: { at: previous.at, deltaBytes: totalBytes - previous.totalBytes } },
            notes,
        },
        snapshot,
    };
}
/** Never offered for cleanup: in use, inside a running job, or kept by policy. */
function blocked(f) {
    return f.holders.length > 0 || f.job !== undefined;
}
function buildPlan(files, pipelines, jobs) {
    const plan = [];
    const redundant = files.filter(f => f.redundantWith !== undefined && !blocked(f));
    if (redundant.length > 0) {
        plan.push({
            title: 'Duplicates superseded by a processed or compressed copy',
            reclaimBytes: redundant.reduce((s, f) => s + f.bytes, 0),
            paths: redundant.map(f => f.path),
            why: [...new Set(redundant.map(f => f.redundantWith?.reason ?? ''))].join('; '),
            verify: 'For each pair, validate the kept file (`samtools quickcheck`, `gzip -t`, `zstd -t`, or record counts) before deleting the superseded one.',
            retention: 'intermediate',
        });
    }
    const grouped = new Map();
    for (const f of files) {
        if (blocked(f) || f.redundantWith !== undefined)
            continue;
        if (!['intermediate', 'temp', 'reducible', 'cache'].includes(f.kind.retention))
            continue;
        grouped.set(f.kind.id, [...grouped.get(f.kind.id) ?? [], f]);
    }
    for (const [id, group] of grouped) {
        const kind = kindById(id);
        const size = group.reduce((s, f) => s + f.bytes, 0);
        plan.push({
            title: `${kind.label} (${RETENTION_LABEL[kind.retention]})`,
            // Compression and conversion reclaim only part of the size.
            reclaimBytes: kind.retention === 'reducible' ? Math.round(size * 0.5) : size,
            paths: group.map(f => f.path),
            why: kind.advice,
            verify: kind.retention === 'reducible'
                ? 'Convert, validate the new file, and only then remove the original.'
                : 'Confirm the producing run finished successfully and its outputs were checked; nothing holds these files open.',
            retention: kind.retention,
        });
    }
    for (const p of pipelines) {
        const running = jobs.some(j => isUnder(p.path, j.workdir) || isUnder(j.workdir, p.path));
        if (running)
            continue;
        const finished = (p.kind === 'nextflow' || p.kind === 'cellranger') && p.state === 'complete';
        const idleSnake = p.kind === 'snakemake' && p.state === 'idle';
        if (!finished && !idleSnake && p.kind !== 'star')
            continue;
        plan.push({
            title: `${p.kind} working directory of a ${p.state === '-' ? 'finished' : p.state} run`,
            reclaimBytes: (p.kb ?? 0) * 1024,
            paths: [p.path],
            why: p.kind === 'nextflow'
                ? 'The run log ends with "Execution complete"; task scratch is only needed to -resume. Use `nextflow clean -f` in the launch directory or remove work/.'
                : p.kind === 'cellranger'
                    ? 'outs/web_summary.html exists, so the stage directory is no longer needed.'
                    : p.kind === 'snakemake'
                        ? 'No incomplete jobs or locks; shadow/ and conda/ can be rebuilt.'
                        : 'STAR temporary directory with no running alignment.',
            verify: 'Confirm results were published/copied and nobody plans to resume the run.',
            retention: 'intermediate',
        });
    }
    const order = (r) => RETENTION_ORDER.indexOf(r);
    return plan.sort((a, b) => b.reclaimBytes - a.reclaimBytes || order(a.retention) - order(b.retention));
}
function gb(n) {
    return bytes(n);
}
/** Model-facing rendering. */
export function renderFiles(host, r) {
    const lines = [`## ${host}: files modified in the last ${r.days} day(s) under ${r.roots.join(', ')}`];
    lines.push(`${r.totalFiles} files, ${gb(r.totalBytes)}${r.sincePrevious === undefined ? '' : ` (previous scan ${r.sincePrevious.at}: ${r.sincePrevious.deltaBytes >= 0 ? '+' : '-'}${gb(Math.abs(r.sincePrevious.deltaBytes))})`}; individually classified files cover ${Math.round(r.classifiedShare * 100)}% of the bytes.`);
    for (const note of r.notes)
        lines.push(`Note: ${note}`);
    if (r.dirs.length > 0) {
        lines.push('', 'Where it landed:');
        for (const d of r.dirs)
            lines.push(`  ${gb(d.bytes).padStart(7)}  ${String(d.files).padStart(7)} files  ${d.path}${d.deltaBytes === undefined || d.deltaBytes === 0 ? '' : `  (${d.deltaBytes > 0 ? '+' : '-'}${gb(Math.abs(d.deltaBytes))} vs previous scan)`}`);
    }
    if (r.users.length > 0)
        lines.push('', `By owner: ${r.users.slice(0, 8).map(u => `${u.user} ${gb(u.bytes)}`).join(', ')}`);
    if (r.byKind.length > 0) {
        lines.push('', 'By kind (large files):');
        for (const k of r.byKind)
            lines.push(`  ${gb(k.bytes).padStart(7)}  ${String(k.files).padStart(5)}×  ${k.kind.label} — ${RETENTION_LABEL[k.kind.retention]}`);
    }
    const inUse = r.files.filter(f => f.holders.length > 0 || f.job !== undefined);
    if (inUse.length > 0) {
        lines.push('', 'Still in use (excluded from the plan):');
        for (const f of inUse.slice(0, 10))
            lines.push(`  ${gb(f.bytes).padStart(7)}  ${f.path}${f.holders.length > 0 ? ` held by ${holderText(f.holders)}` : ''}${f.job === undefined ? '' : ` in running job ${f.job.id} (${f.job.user})`}`);
    }
    if (r.pipelines.length > 0) {
        lines.push('', 'Pipeline working directories:');
        for (const p of r.pipelines.slice(0, 15))
            lines.push(`  ${formatKb(p.kb ?? 0).padStart(7)}  ${p.kind} [${p.state}] ${p.path} (modified ${p.modified})`);
    }
    if (r.plan.length > 0) {
        lines.push('', 'Cleanup suggestions (largest first; nothing has been changed):');
        r.plan.forEach((item, i) => {
            lines.push(`${i + 1}. ${item.title}: ~${gb(item.reclaimBytes)} in ${item.paths.length} path(s)`);
            lines.push(`   why: ${item.why}`);
            lines.push(`   before acting: ${item.verify}`);
            for (const p of item.paths.slice(0, 5))
                lines.push(`   - ${p}`);
            if (item.paths.length > 5)
                lines.push(`   - … ${item.paths.length - 5} more`);
        });
    }
    else {
        lines.push('', 'No cleanup candidates among the large recent files.');
    }
    const raw = r.byKind.filter(k => k.kind.retention === 'raw');
    if (raw.length > 0)
        lines.push('', `Raw data (${raw.map(k => `${k.kind.label} ${gb(k.bytes)}`).join(', ')}) is never a cleanup candidate; archive it to cold storage if space is tight.`);
    return lines.join('\n');
}
