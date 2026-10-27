export declare class LocalState<T> {
    readonly path: string;
    private readonly empty;
    private readonly validate;
    constructor(path: string, empty: () => T, validate: (value: unknown) => T);
    private raw;
    read(): Promise<{
        revision: string;
        value: T;
    }>;
    /** Stage under the write lock; a participant may commit another file first.
     * If the participant fails after committing this file, restore its exact preimage.
     * This handles write errors, not process crashes between two file renames.
     */
    change(revision: string, update: (value: T) => Promise<T> | T, participate?: (commit: () => Promise<void>) => Promise<void>): Promise<void>;
}
