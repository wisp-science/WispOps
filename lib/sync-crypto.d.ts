export declare const MAX_SYNC_BYTES: number;
export declare function sealSync(value: unknown, passphrase: string): Promise<string>;
export declare function openSync(text: string, passphrase: string): Promise<unknown>;
