/**
 * /ai week news ticker: latest date group + future Calendar items (build + tests).
 */
import { formatFeedDateLabel, isFutureCalendarItem, keepFeedItem } from './ai-feed-history-core.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @param {import('./ai-feed-history-core.mjs').FeedItem[]} items @param {string} todayYmd */
export function feedItemsInWindow(items, todayYmd) {
  return items.filter((item) => keepFeedItem(todayYmd, item));
}

/** @param {import('./ai-feed-history-core.mjs').FeedItem} item @param {string} todayYmd */
export function tickerItemTag(item, todayYmd) {
  if (item.tag === 'Calendar' && isFutureCalendarItem(item, todayYmd)) {
    return formatFeedDateLabel(item, todayYmd);
  }
  const s = String(item.status ?? '').toLowerCase();
  if (s === 'reported') return 'REPORTED';
  if (s === 'claim') return 'CLAIM';
  return '';
}

/** @param {import('./ai-feed-history-core.mjs').FeedItem} item @param {string} todayYmd */
export function tickerItemText(item, todayYmd) {
  const tag = tickerItemTag(item, todayYmd);
  const headline = String(item.headline ?? '').trim();
  return tag ? `${tag} · ${headline}` : headline;
}

/** @param {string} ymd */
export function asOfLabelFromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(dt);
  return `${weekday} ${d} ${MONTHS[m - 1] ?? ''}`.trim();
}

/**
 * Latest calendar date among non-future-calendar rows, plus future Calendar rows, id order, cap 10.
 * @param {import('./ai-feed-history-core.mjs').FeedItem[]} items
 * @param {string} todayYmd
 * @param {number} [cap]
 */
export function selectTickerItems(items, todayYmd, cap = 10) {
  const windowed = feedItemsInWindow(items, todayYmd);
  const regular = windowed.filter((item) => !(item.tag === 'Calendar' && isFutureCalendarItem(item, todayYmd)));
  let latestDate = '';
  for (const item of regular) {
    if (!latestDate || item.date > latestDate) latestDate = item.date;
  }
  const picked = windowed.filter((item) => {
    if (item.tag === 'Calendar' && isFutureCalendarItem(item, todayYmd)) return true;
    return latestDate && item.date === latestDate;
  });
  picked.sort((a, b) => a.id.localeCompare(b.id));
  return { latestDate, items: picked.slice(0, cap) };
}
