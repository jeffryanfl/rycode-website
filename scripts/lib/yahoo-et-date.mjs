/**
 * Yahoo Finance chart bars are Unix seconds at period start (UTC). Trading dates
 * follow America/New_York. Do not use meta.gmtoffset for every bar; that offset
 * is for the current session and shifts October bars after DST ends.
 */
const NY_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** ISO calendar date (YYYY-MM-DD) for a Yahoo daily bar in US Eastern time. */
export function yahooBarDateUtcSeconds(ts) {
  return NY_DATE.format(new Date(ts * 1000));
}

/** Previous bug: one offset from meta applied to every bar in the window. */
export function yahooBarDateLegacy(ts, gmtoffset = -14400) {
  return new Date((ts + gmtoffset) * 1000).toISOString().slice(0, 10);
}
