import type { HistoryRecord } from './store.ts';
export declare function renderTrends(rows: readonly HistoryRecord[]): string[];
/** Inspections read for forecasts and availability: a week at five-minute intervals, bounded by retention anyway. */
export declare const STATS_ROWS = 2016;
/** How far back a disk-full forecast looks. */
export declare const FORECAST_WINDOW_DAYS = 7;
/**
 * When a mount fills at its recent growth rate: a least-squares line through its used % over the last week, from at
 * least three points spanning six hours, extended from the newest value. Undefined when it is not growing (under 0.05
 * points a day), the data is too thin, or full is more than a year away.
 */
export declare function forecastFull(points: readonly {
    at: number;
    pct: number;
}[]): {
    days: number;
    perDay: number;
} | undefined;
/** Share of inspections that connected and the 95th-percentile login time, over the history since `since`. */
export declare function reachability(rows: readonly HistoryRecord[], since: number): {
    pct?: number;
    loginP95?: number;
};
