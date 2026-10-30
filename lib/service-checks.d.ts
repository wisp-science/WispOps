export type ServiceCheck = {
    kind: 'unit';
    name: string;
} | {
    kind: 'port';
    port: number;
} | {
    kind: 'http';
    url: string;
};
export interface ServiceResult {
    readonly kind: ServiceCheck['kind'];
    readonly target: string;
    readonly result: string;
    readonly ok: boolean;
}
export declare const MAX_CHECKS = 20;
/** Validate a host's check list; anything malformed is rejected rather than dropped. */
export declare function validateChecks(value: unknown): ServiceCheck[];
export declare function describeCheck(check: ServiceCheck): string;
/** The shell line that runs one check; also what the deny list is matched against. */
export declare function checkLine(check: ServiceCheck): string;
/** The inspection script with this host's checks added before its end marker. */
export declare function withServiceChecks(script: string, checks: readonly ServiceCheck[] | undefined): string;
/** Results of the `@@svc` section; an HTTP check passes on 2xx and 3xx. */
export declare function parseServiceResults(lines: readonly string[]): ServiceResult[];
