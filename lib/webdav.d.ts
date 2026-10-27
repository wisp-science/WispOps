export interface WebDavSettings {
    url: string;
    username: string;
    password: string;
}
export declare const SNAPSHOT_NAME: RegExp;
export declare class WebDav {
    private readonly send;
    readonly url: URL;
    private readonly authorization;
    constructor(settings: WebDavSettings, send?: typeof fetch);
    private request;
    private text;
    list(): Promise<string[]>;
    upload(name: string, body: string): Promise<void>;
    download(name: string): Promise<string>;
}
