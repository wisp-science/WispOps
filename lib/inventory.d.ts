/**
 * Host inventory: membership, selectors, and the effective permission table
 * of each host. The model can only address hosts by inventory name, so it
 * never supplies an SSH destination of its own.
 * @module dsh-wisp-ops/inventory
 */
import { Config } from './config.ts';
import type { Capability, GroupSpec, HostSpec, Permission, PolicySpec, TaskSpec, ThresholdsSpec } from './config.ts';
import type { Mute } from './mutes.ts';
import type { ServiceCheck } from './service-checks.ts';
import type { ManagedState } from './managed.ts';
/** A host with its effective policy resolved. */
export interface Host extends HostSpec {
    readonly groups: string[];
    readonly tags: Record<string, string>;
    readonly policy: Record<Capability, Permission>;
    /** Effective policy before the panel override, so the panel can show what "inherit" means. */
    readonly inheritedPolicy: Record<Capability, Permission>;
    /** Capabilities set in the panel; absent when nothing is overridden. */
    readonly policyOverride?: PolicySpec;
    /** Panel-set service checks, threshold overrides and muted findings for this host. */
    readonly serviceChecks?: ServiceCheck[];
    readonly thresholdOverride?: Partial<ThresholdsSpec>;
    readonly mutes?: Mute[];
}
/** The stricter of two permissions. */
export declare function stricter(a: Permission, b: Permission): Permission;
/** Expand a leading `~/` against the home directory. */
export declare function expandHome(path: string): string;
/** Read an inventory file; YAML is a superset of JSON so one parser serves both. A missing file is an empty inventory. */
export declare function loadInventoryFile(path: string): Promise<{
    hosts: HostSpec[];
    groups: Record<string, GroupSpec>;
    tasks: TaskSpec[];
}>;
export declare class Inventory {
    readonly hosts: ReadonlyMap<string, Host>;
    readonly groups: ReadonlyMap<string, GroupSpec>;
    readonly tasks: ReadonlyMap<string, TaskSpec>;
    constructor(hosts: readonly (HostSpec & {
        policyOverride?: PolicySpec;
        serviceChecks?: ServiceCheck[];
        thresholdOverride?: Partial<ThresholdsSpec>;
        mutes?: Mute[];
    })[], groups: Record<string, GroupSpec>, defaults: Record<Capability, Permission>, tasks?: readonly TaskSpec[], extraRead?: ReadonlySet<string>);
    /**
     * Build from config: imported hosts (e.g. WispTerm profiles) first, then
     * inline entries, then the inventory file. A configured host replaces an
     * imported one of the same name; two configured hosts with one name fail.
     */
    static load(config: Config, imported?: readonly HostSpec[], managed?: ManagedState): Promise<Inventory>;
    /**
     * Resolve a selector list. Each comma- or space-separated term is a host
     * name, `@group`, `tag:key=value`, a `*` glob over names, or `all`. A term
     * prefixed with `!` removes matches. Unknown names fail loudly.
     */
    select(selector: string): Host[];
    private match;
    /** Every token that would address an inventory host from a raw ssh command line. */
    addressTokens(): Set<string>;
}
