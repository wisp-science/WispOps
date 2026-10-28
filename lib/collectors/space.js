/**
 * Directory space map of one path: `du` sizes of every directory down to a
 * fixed depth on the same filesystem, keeping the largest ones so the panel
 * can draw a map the owner opens level by level. Read-only; the scan is
 * stored per host so the next one can report growth.
 * @module dsh-wisp-ops/collectors/space
 */
import { shellQuote } from "../ssh.js";
import { buildSpaceTree, normalizeRoot } from "../space-tree.js";
import { formatKb, num, parseDf, parseSections } from "./sections.js";
/** Build the scan script; every user value is single-quoted. */
export function spaceScript(o) {
    return String.raw `export LC_ALL=C
P=${shellQuote(normalizeRoot(o.path))}; D=${o.depth}; N=${o.maxDirs}; MIN=${o.minKb}
TO=""
if command -v timeout >/dev/null 2>&1; then TO="timeout ${o.walkTimeoutSec}"; fi
echo @@whoami
id -u
echo @@df
d=$(df -PkT "$P" 2>/dev/null); [ "$(printf '%s\n' "$d" | wc -l)" -ge 2 ] || d=$(df -Pk "$P" 2>/dev/null); printf '%s\n' "$d"
echo @@du
{ $TO du -xk -d "$D" "$P" 2>/dev/null; printf '@@rc\t%s\n' "$?"; } \
  | awk -F'\t' -v min="$MIN" '$1 == "@@rc" || $1 >= min' \
  | sort -rn \
  | awk -F'\t' -v n="$N" '$1 == "@@rc" { rc = $2; next } { c++ } c <= n { print } END { print "@@du_rc"; print rc + 0; print "@@du_count"; print c + 0 }'
echo @@end
`;
}
/** Parse the scan script's output. */
export function parseSpace(output, options) {
    const s = parseSections(output);
    const path = normalizeRoot(options.path);
    const filesystem = parseDf(s.get('df') ?? [])[0];
    const fullVisibility = (s.get('whoami') ?? [])[0] === '0';
    const rc = num((s.get('du_rc') ?? [])[0]);
    const dirs = (s.get('du') ?? []).flatMap((line) => {
        const tab = line.indexOf('\t');
        const kb = num(line.slice(0, tab));
        return tab < 0 || kb === undefined ? [] : [[normalizeRoot(line.slice(tab + 1)), kb]];
    });
    const dirCount = Math.max(num((s.get('du_count') ?? [])[0]) ?? 0, dirs.length);
    const walkIncomplete = rc === 124;
    const permissionDenied = rc !== undefined && rc !== 0 && rc !== 124;
    const notes = [];
    if (walkIncomplete)
        notes.push(`the du walk hit the ${options.walkTimeoutSec}s deadline; directories it had not finished (often the largest, including the root) are rebuilt from their listed subdirectories, so sizes are lower bounds`);
    if (permissionDenied)
        notes.push(`du could not read some directories${fullVisibility ? '' : ' (not running as root)'}; sizes are lower bounds — enable sudo on the task for full totals`);
    if (dirCount > dirs.length)
        notes.push(`${dirCount} directories are at least ${formatKb(options.minKb)}; only the ${dirs.length} largest are kept`);
    if (filesystem === undefined)
        notes.push(`df returned nothing for ${path}; the path may not exist`);
    return {
        path,
        ...filesystem === undefined ? {} : { filesystem },
        depth: options.depth,
        fullVisibility,
        walkIncomplete,
        permissionDenied,
        dirs,
        dirCount,
        minKb: options.minKb,
        notes,
    };
}
/** Model-facing rendering: the largest directories nested a few levels, with growth since the previous scan. */
export function renderSpace(host, r, previous) {
    const lines = [];
    const fs = r.filesystem;
    lines.push(fs === undefined
        ? `## ${host}:${r.path} — directory space`
        : `## ${host}:${r.path} — directory space on ${fs.mount} (${fs.filesystem}) ${fs.usePct}% used, ${formatKb(fs.availKb)} free of ${formatKb(fs.sizeKb)}`);
    const tree = buildSpaceTree(r.path, r.dirs);
    lines.push(`Directories under ${r.path} total ${formatKb(tree.kb)} (same filesystem, ${r.depth} levels deep).`);
    for (const note of r.notes)
        lines.push(`Note: ${note}`);
    if (tree.kb === 0)
        return lines.join('\n');
    const before = previous === undefined ? undefined : new Map(previous.dirs);
    const delta = (node) => {
        const old = before?.get(node.path);
        if (old === undefined)
            return '';
        const d = node.kb - old;
        return Math.abs(d) < Math.max(1024, old * 0.01) ? '' : `  (${d > 0 ? '+' : '-'}${formatKb(Math.abs(d))} since ${previous.at})`;
    };
    // Enough levels to name the real space users without flooding the report.
    const floor = Math.max(tree.kb * 0.01, 1024);
    let budget = 60;
    lines.push('', 'Largest directories (nested, share of the scanned total):');
    const walk = (node, level) => {
        for (const child of node.children.slice(0, 8)) {
            if (child.kb < floor || budget-- <= 0)
                return;
            const pct = (child.kb / tree.kb * 100).toFixed(child.kb / tree.kb >= 0.1 ? 0 : 1);
            const files = child.children.length > 0 && child.restKb >= Math.max(floor, child.kb * 0.1) ? `  [files directly here ${formatKb(child.restKb)}]` : '';
            lines.push(`${'  '.repeat(level)}${formatKb(child.kb).padStart(7)}  ${pct.padStart(3)}%  ${child.path}${files}${delta(child)}`);
            if (level < 3)
                walk(child, level + 1);
        }
    };
    walk(tree, 1);
    if (tree.restKb >= floor)
        lines.push(`  ${formatKb(tree.restKb).padStart(7)}        files directly in ${r.path} and smaller directories`);
    if (before !== undefined) {
        const grown = r.dirs
            .flatMap(([path, kb]) => { const old = before.get(path); return old === undefined || path === r.path ? [] : [{ path, d: kb - old }]; })
            .filter(g => g.d >= Math.max(floor, 1024 * 1024))
            .sort((a, b) => b.d - a.d)
            // A parent grows with its child; name the deepest directory that explains the growth.
            .filter((g, _i, all) => !all.some(o => o !== g && o.path.startsWith(`${g.path}/`) && o.d >= g.d * 0.8))
            .slice(0, 5);
        if (grown.length > 0)
            lines.push('', `Grew most since the previous scan (${previous.at}): ${grown.map(g => `${g.path} +${formatKb(g.d)}`).join(', ')}`);
    }
    return lines.join('\n');
}
