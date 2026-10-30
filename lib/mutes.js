export const MAX_MUTES = 50;
/** What a finding is about: its recorded subject, or for older records the leading path of its message. */
export function findingSubject(finding) {
    return finding.subject ?? /^(\/\S*)/.exec(finding.message)?.[1];
}
export function validateMutes(value) {
    if (!Array.isArray(value) || value.length > MAX_MUTES)
        throw new Error(`Mutes must be a list of at most ${MAX_MUTES}`);
    return value.map(raw => {
        const mute = raw;
        if (typeof mute?.code !== 'string' || !/^[a-z0-9-]{1,40}$/.test(mute.code))
            throw new Error('Invalid mute');
        if (mute.subject !== undefined && (typeof mute.subject !== 'string' || mute.subject.length === 0 || mute.subject.length > 2048))
            throw new Error('Invalid mute subject');
        if (mute.until !== undefined && (typeof mute.until !== 'string' || !Number.isFinite(Date.parse(mute.until))))
            throw new Error('Invalid mute end');
        return { code: mute.code, ...mute.subject === undefined ? {} : { subject: mute.subject }, ...mute.until === undefined ? {} : { until: mute.until } };
    });
}
/** The mute covering a finding at `now`, if any. */
export function muteFor(finding, mutes, now) {
    return mutes?.find(m => m.code === finding.code && (m.subject === undefined || m.subject === findingSubject(finding)) && (m.until === undefined || Date.parse(m.until) > now));
}
