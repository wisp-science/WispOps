/**
 * Directory-size trees built from `du` rows. Pure and import-free, so the
 * collector renders the same tree for the model that the panel draws as a map.
 * @module dsh-wisp-ops/space-tree
 */

export interface SpaceNode {
  /** Last path segment; the scanned root keeps its full path. */
  readonly name: string
  readonly path: string
  /** Size including every subdirectory, in KB. */
  readonly kb: number
  /** Files directly in this directory plus subdirectories too small to list, in KB. */
  readonly restKb: number
  /** Listed subdirectories, largest first. */
  readonly children: SpaceNode[]
}

/** `/data/` → `/data`; the filesystem root stays `/`. */
export function normalizeRoot(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

function parentOf(path: string): string {
  const cut = path.lastIndexOf('/')
  return cut <= 0 ? '/' : path.slice(0, cut)
}

function under(path: string, root: string): boolean {
  return root === '/' ? path.startsWith('/') && path !== '/' : path.startsWith(`${root}/`)
}

/**
 * Nest `[path, kb]` rows under `root`. A directory missing from the rows (cut by the size
 * floor or an interrupted walk) is rebuilt from its listed subdirectories, so a partial
 * scan still nests correctly with sizes as lower bounds.
 */
export function buildSpaceTree(root: string, dirs: readonly (readonly [string, number])[]): SpaceNode {
  const top = normalizeRoot(root)
  const reported = new Map<string, number>()
  const children = new Map<string, Set<string>>()
  for (const [raw, kb] of dirs) {
    const path = normalizeRoot(raw)
    if (path !== top && !under(path, top)) continue
    reported.set(path, Math.max(kb, reported.get(path) ?? 0))
    for (let child = path; child !== top;) {
      const parent = parentOf(child)
      const set = children.get(parent) ?? new Set<string>()
      if (set.has(child)) break
      set.add(child)
      children.set(parent, set)
      child = parent
    }
  }
  const build = (path: string): SpaceNode => {
    const kids = [...children.get(path) ?? []].map(build).sort((a, b) => b.kb - a.kb || a.name.localeCompare(b.name))
    const sum = kids.reduce((total, k) => total + k.kb, 0)
    const kb = Math.max(reported.get(path) ?? 0, sum)
    return { name: path === top ? top : path.slice(path.lastIndexOf('/') + 1), path, kb, restKb: kb - sum, children: kids }
  }
  return build(top)
}

/** The node at `path`, or undefined when the tree does not list it. */
export function findSpaceNode(tree: SpaceNode, path: string): SpaceNode | undefined {
  if (tree.path === path) return tree
  const next = tree.children.find(child => path === child.path || path.startsWith(`${child.path}/`))
  return next === undefined ? undefined : findSpaceNode(next, path)
}
