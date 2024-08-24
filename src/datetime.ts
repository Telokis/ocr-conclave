export function msUntil(date: Date | string | number) {
    const dateAsDate = new Date(date);
    const now = new Date();

    return dateAsDate.getTime() - now.getTime();
}

export function secondsUntil(date: Date | string | number) {
    return msUntil(date) / 1000;
}

export function minutesUntil(date: Date | string | number) {
    return secondsUntil(date) / 60;
}

export function msSince(date: Date | string | number) {
    return -msUntil(date);
}

export function secondsSince(date: Date | string | number) {
    return -secondsUntil(date);
}

export function minutesSince(date: Date | string | number) {
    return -minutesUntil(date);
}

export const pad = (num: string | number, padLength = 2, padStr = "0") =>
    String(num).padStart(padLength, padStr);

// prettier-ignore
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatDate = (date = new Date(), format = "%Y-%M-%D") =>
    format
        .replace(/%Mon/g, `${months[date.getMonth()]}`)
        .replace(/%Y/g, `${date.getFullYear()}`)
        .replace(/%M/g, pad(date.getMonth() + 1))
        .replace(/%D/g, pad(date.getDate()))
        .replace(/%h/g, pad(date.getHours()))
        .replace(/%m/g, pad(date.getMinutes()))
        .replace(/%s/g, pad(date.getSeconds()))
        .replace(/%S/g, pad(date.getMilliseconds(), 3));

/**
 * Formatting options:
 *   %ms : Remainder of miliseconds
 *   %MS : Elapsed time in miliseconds
 *   %s  : Remainder of seconds
 *   %S  : Elapsed time in seconds (rounded down)
 *   %m  : Remainder of minutes
 *   %M  : Elapsed time in minutes (rounded down)
 *   %h  : Remainder of hours
 *   %H  : Elapsed time in hours (rounded down)
 *
 * @example
 *  formatDuration(1234, "%S.%ms") // "1.234"
 *  formatDuration(1234, "%s.%ms") // "01.234"
 *  formatDuration(71234, "%Mm %ss %msms") // "1m 11s 234ms"
 *
 * @param duration Elapsed time in miliseconds
 * @param format Format string. See description for details
 * @returns Formatted string
 */
const formatDuration = (duration: number, format = "%S.%mss") => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(duration / (1000 * 60 * 60));

    return format
        .replace(/%ms/g, `${pad(duration % 1000)}`)
        .replace(/%MS/g, `${duration}`)
        .replace(/%s/g, `${pad(seconds % 60)}`)
        .replace(/%S/g, `${seconds}`)
        .replace(/%m/g, `${pad(minutes % 60)}`)
        .replace(/%M/g, `${minutes}`)
        .replace(/%h/g, `${pad(hours % 24)}`)
        .replace(/%H/g, `${hours}`);
};

export default formatDuration;
