/**
 * Wall-clock arithmetic for task schedules without a calendar library: when a
 * daily or weekly task was last due in its zone, and whether a scheduled task
 * appears to have skipped that slot. Cron expressions are not evaluated.
 * @module dsh-wisp-ops/schedule
 */
const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const formatters = new Map();
function formatter(timeZone) {
    let f = formatters.get(timeZone);
    if (f === undefined) {
        f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' });
        formatters.set(timeZone, f);
    }
    return f;
}
/** Calendar fields of an instant in a zone. Throws RangeError for an unknown zone. */
export function zonedParts(ms, timeZone) {
    const parts = {};
    for (const part of formatter(timeZone).formatToParts(new Date(ms)))
        parts[part.type] = part.value;
    return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour) % 24, minute: Number(parts.minute), weekday: WEEKDAYS[parts.weekday ?? ''] ?? 0 };
}
/** The instant of a wall-clock time in a zone; on an ambiguous DST hour, the first occurrence. */
export function zonedToUtc(wall, timeZone) {
    const naive = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
    let guess = naive;
    for (let i = 0; i < 3; i++) {
        const z = zonedParts(guess, timeZone);
        const diff = naive - Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute);
        if (diff === 0)
            break;
        guess += diff;
    }
    return guess;
}
/** The latest instant at or before `now` when a daily or weekly schedule was due; undefined for cron and intervals. */
export function previousDue(schedule, defaultZone, now = Date.now()) {
    if (schedule.daily === undefined)
        return undefined;
    const [hour, minute] = schedule.daily.split(':').map(Number);
    const zone = schedule.timeZone ?? defaultZone;
    const weekdays = schedule.weekdays !== undefined && schedule.weekdays.length > 0 ? new Set(schedule.weekdays) : undefined;
    let probe = now;
    for (let back = 0; back < 9; back++) {
        const z = zonedParts(probe, zone);
        const due = zonedToUtc({ year: z.year, month: z.month, day: z.day, hour, minute }, zone);
        if (due <= now && (weekdays === undefined || weekdays.has(z.weekday)))
            return due;
        probe -= 86_400_000;
    }
    return undefined;
}
/** How late a run may be before the panel calls it missed. */
export const MISSED_GRACE_MS = 30 * 60_000;
/**
 * Whether a scheduled task appears to have skipped its latest slot: no run recorded at or
 * after the due time once the grace period passed. Intervals compare against the last run;
 * cron schedules are not evaluated and never report a miss.
 */
export function missedRun(schedule, defaultZone, lastRun, now = Date.now()) {
    if (schedule.everyMinutes !== undefined) {
        if (lastRun === undefined || !Number.isFinite(Date.parse(lastRun)))
            return { missed: false };
        const due = Date.parse(lastRun) + schedule.everyMinutes * 60_000;
        return { dueAt: new Date(due).toISOString(), missed: now - due > Math.max(MISSED_GRACE_MS, schedule.everyMinutes * 60_000) };
    }
    const due = previousDue(schedule, defaultZone, now);
    if (due === undefined)
        return { missed: false };
    // A run slightly before the slot (clock skew, a manual run) still covers it.
    const covered = lastRun !== undefined && Number.isFinite(Date.parse(lastRun)) && Date.parse(lastRun) >= due - 5 * 60_000;
    return { dueAt: new Date(due).toISOString(), missed: !covered && now - due > MISSED_GRACE_MS };
}
