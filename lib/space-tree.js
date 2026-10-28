/**
 * Directory-size trees built from `du` rows. Pure and import-free, so the
 * collector renders the same tree for the model that the panel draws as a map.
 * @module dsh-wisp-ops/space-tree
 */
/** `/data/` → `/data`; the filesystem root stays `/`. */
export function normalizeRoot(path) {
    return path.replace(/\/+$/, '') || '/';
}
function parentOf(path) {
    const cut = path.lastIndexOf('/');
    return cut <= 0 ? '/' : path.slice(0, cut);
}
function under(path, root) {
    return root === '/' ? path.startsWith('/') && path !== '/' : path.startsWith(`${root}/`);
}
/**
 * Nest `[path, kb]` rows under `root`. A directory missing from the rows (cut by the size
 * floor or an interrupted walk) is rebuilt from its listed subdirectories, so a partial
 * scan still nests correctly with sizes as lower bounds.
 */
export function buildSpaceTree(root, dirs) {
    const top = normalizeRoot(root);
    const reported = new Map();
    const children = new Map();
    for (const [raw, kb] of dirs) {
        const path = normalizeRoot(raw);
        if (path !== top && !under(path, top))
            continue;
        reported.set(path, Math.max(kb, reported.get(path) ?? 0));
        for (let child = path; child !== top;) {
            const parent = parentOf(child);
            const set = children.get(parent) ?? new Set();
            if (set.has(child))
                break;
            set.add(child);
            children.set(parent, set);
            child = parent;
        }
    }
    const build = (path) => {
        const kids = [...children.get(path) ?? []].map(build).sort((a, b) => b.kb - a.kb || a.name.localeCompare(b.name));
        const sum = kids.reduce((total, k) => total + k.kb, 0);
        const kb = Math.max(reported.get(path) ?? 0, sum);
        return { name: path === top ? top : path.slice(path.lastIndexOf('/') + 1), path, kb, restKb: kb - sum, children: kids };
    };
    return build(top);
}
/** The node at `path`, or undefined when the tree does not list it. */
export function findSpaceNode(tree, path) {
    if (tree.path === path)
        return tree;
    const next = tree.children.find(child => path === child.path || path.startsWith(`${child.path}/`));
    return next === undefined ? undefined : findSpaceNode(next, path);
}
