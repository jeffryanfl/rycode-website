/**
 * Shared merge and retention rules for public/ai-feed-history.json.
 * Used by scripts/update-ai-feed-history.mjs and local tests.
 */

/** @typedef {{ id: string, date: string, tag: string, headline: string, why: string, url: string, source: string, status: string }} FeedItem */

/**
 * @param {string} todayYmd - YYYY-MM-DD calendar day (usually America/New_York via todayYmdLocal)
 * @param {FeedItem} item
 */
export function keepFeedItem(todayYmd, item) {
  const date = item.date;
  if (!date || typeof date !== 'string') return false;
  if (item.tag === 'Calendar') {
    return date >= todayYmd;
  }
  const cutoff = addDaysYmd(todayYmd, -6);
  return date >= cutoff;
}

/** @param {string} ymd @param {number} days */
export function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/**
 * Merge history with today's feed, dedupe by id (newer feed wins), filter, sort newest first.
 * @param {FeedItem[]} historyItems
 * @param {FeedItem[]} feedItems
 * @param {string} todayYmd
 */
export function mergeAiFeedHistory(historyItems, feedItems, todayYmd) {
  const byId = new Map();
  for (const item of historyItems) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const item of feedItems) {
    if (item?.id) byId.set(item.id, item);
  }
  const merged = [...byId.values()].filter((item) => keepFeedItem(todayYmd, item));
  return sortFeedItems(merged, todayYmd);
}

const NY_TIME_ZONE = 'America/New_York';

/** @param {Date} [date] @param {string} [timeZone] */
export function todayYmdInTimeZone(date = new Date(), timeZone = NY_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function todayYmdLocal() {
  return todayYmdInTimeZone();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @param {string} ymd */
export function formatYmdShort(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${d} ${MONTHS[m - 1] ?? ''}`.trim();
}

/** @param {FeedItem} item @param {string} todayYmd */
export function isFutureCalendarItem(item, todayYmd) {
  return item.tag === 'Calendar' && item.date >= todayYmd;
}

/**
 * Past and today items newest first; future Calendar items at the bottom, soonest first.
 * @param {FeedItem[]} items
 * @param {string} todayYmd
 */
export function sortFeedItems(items, todayYmd) {
  const regular = [];
  const futureCal = [];
  for (const item of items) {
    if (isFutureCalendarItem(item, todayYmd)) futureCal.push(item);
    else regular.push(item);
  }
  regular.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return a.id.localeCompare(b.id);
  });
  futureCal.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.id.localeCompare(b.id);
  });
  return [...regular, ...futureCal];
}

/** @param {FeedItem} item @param {string} todayYmd */
export function formatFeedDateLabel(item, todayYmd) {
  const base = formatYmdShort(item.date);
  if (isFutureCalendarItem(item, todayYmd)) return `Due ${base}`;
  return base;
}

/** Weekdays strictly after fromYmd through toYmd (Mon–Fri, calendar YMD strings). */
export function weekdaysAfterYmd(fromYmd, toYmd) {
  const start = addDaysYmd(fromYmd, 0);
  const end = addDaysYmd(toYmd, 0);
  let count = 0;
  let cursor = addDaysYmd(start, 1);
  while (cursor <= end) {
    const day = new Date(`${cursor}T12:00:00.000Z`).getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor = addDaysYmd(cursor, 1);
  }
  return count;
}

/** True when the feed updated timestamp is more than two NY weekdays behind NY today. */
export function isLastUpdatedStale(updatedIso, now = new Date()) {
  const updated = new Date(updatedIso);
  if (Number.isNaN(updated.getTime())) return false;
  const todayYmd = todayYmdInTimeZone(now);
  const updatedYmd = todayYmdInTimeZone(updated);
  return weekdaysAfterYmd(updatedYmd, todayYmd) > 2;
}
