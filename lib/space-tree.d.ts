/**
 * Directory-size trees built from `du` rows. Pure and import-free, so the
 * collector renders the same tree for the model that the panel draws as a map.
 * @module dsh-wisp-ops/space-tree
 */
export interface SpaceNode {
    /** Last path segment; the scanned root keeps its full path. */
    readonly name: string;
    readonly path: string;
    /** Size including every subdirectory, in KB. */
    readonly kb: number;
    /** Files directly in this directory plus subdirectories too small to list, in KB. */
    readonly restKb: number;
    /** Listed subdirectories, largest first. */
    readonly children: SpaceNode[];
}
/** `/data/` → `/data`; the filesystem root stays `/`. */
export declare function normalizeRoot(path: string): string;
/**
 * Nest `[path, kb]` rows under `root`. A directory missing from the rows (cut by the size
 * floor or an interrupted walk) is rebuilt from its listed subdirectories, so a partial
 * scan still nests correctly with sizes as lower bounds.
 */
export declare function buildSpaceTree(root: string, dirs: readonly (readonly [string, number])[]): SpaceNode;
/** The node at `path`, or undefined when the tree does not list it. */
export declare function findSpaceNode(tree: SpaceNode, path: string): SpaceNode | undefined;
