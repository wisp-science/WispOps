/**
 * Model-facing tools. Every tool that touches a host requires the voucher
 * the permission gate issued for this exact execution; without it the tool
 * refuses, so authorization cannot be skipped by composition order.
 * @module dsh-wisp-ops/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolExecution } from '@deepseek-ai/dsh-tools';
import type { OpsService } from './service.ts';
import type { Voucher } from './gate.ts';
/** Vouchers issued by the gate, keyed by execution token and consumed once. */
export declare class VoucherBook {
    private readonly vouchers;
    issue(token: unknown, voucher: Voucher): void;
    take(exec: Pick<ToolExecution, 'token' | 'name'>, hosts: readonly string[]): Voucher;
}
export declare function registerTools(ctx: Context, service: OpsService, vouchers: VoucherBook): void;
