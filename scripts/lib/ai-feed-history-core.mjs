/**
 * Shared merge and retention rules for public/ai-feed-history.json.
 * Used by scripts/update-ai-feed-history.mjs and local tests.
 */

/** @typedef {{ id: string, date: string, tag: string, headline: string, why: string, url: string, source: string, status: string }} FeedItem */

/**
 * @param {string} todayYmd - YYYY-MM-DD (UTC or local; caller must be consistent)
 * @param {FeedItem} item
 */
export function keepFeedItem(todayYmd, item) {
  const date = item.date;
  if (!date || typeof date !== 'string') return false;
  if (item.tag === 'Calendar') {
    if (date > todayYmd) return true;
    return false;
  }
  const cutoff = addDaysYmd(todayYmd, -7);
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
  merged.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return b.id.localeCompare(a.id);
  });
  return merged;
}

/** @param {string} ymd */
export function todayYmdLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
