/**
 * Wall-clock arithmetic for task schedules without a calendar library: when a
 * daily or weekly task was last due in its zone, and whether a scheduled task
 * appears to have skipped that slot. Cron expressions are not evaluated.
 * @module dsh-wisp-ops/schedule
 */
import type { TaskSchedule } from './config.ts';
export interface ZonedParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number; /** ISO weekday, Monday 1 … Sunday 7. */
    weekday: number;
}
/** Calendar fields of an instant in a zone. Throws RangeError for an unknown zone. */
export declare function zonedParts(ms: number, timeZone: string): ZonedParts;
/** The instant of a wall-clock time in a zone; on an ambiguous DST hour, the first occurrence. */
export declare function zonedToUtc(wall: Omit<ZonedParts, 'weekday'>, timeZone: string): number;
/** The latest instant at or before `now` when a daily or weekly schedule was due; undefined for cron and intervals. */
export declare function previousDue(schedule: TaskSchedule, defaultZone: string, now?: number): number | undefined;
/** How late a run may be before the panel calls it missed. */
export declare const MISSED_GRACE_MS: number;
export interface MissedRun {
    dueAt?: string;
    missed: boolean;
}
/**
 * Whether a scheduled task appears to have skipped its latest slot: no run recorded at or
 * after the due time once the grace period passed. Intervals compare against the last run;
 * cron schedules are not evaluated and never report a miss.
 */
export declare function missedRun(schedule: TaskSchedule, defaultZone: string, lastRun: string | undefined, now?: number): MissedRun;
