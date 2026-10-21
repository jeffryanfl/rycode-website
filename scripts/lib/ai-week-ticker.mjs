/**
 * /ai week news ticker: latest morning card (id YYYY-MM-DD prefix) + future Calendar items.
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

/** @param {string} id */
export function cardDayFromId(id) {
  const match = /^(\d{4}-\d{2}-\d{2})-/.exec(String(id ?? ''));
  return match ? match[1] : '';
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
 * Latest card day from id prefix, plus future Calendar rows, id order, cap 10.
 * @param {import('./ai-feed-history-core.mjs').FeedItem[]} items
 * @param {string} todayYmd
 * @param {number} [cap]
 */
export function selectTickerItems(items, todayYmd, cap = 10) {
  const windowed = feedItemsInWindow(items, todayYmd);
  let cardDay = '';
  for (const item of windowed) {
    const day = cardDayFromId(item.id);
    if (day && (!cardDay || day > cardDay)) cardDay = day;
  }
  const picked = windowed.filter((item) => {
    if (item.tag === 'Calendar' && isFutureCalendarItem(item, todayYmd)) return true;
    return cardDay && cardDayFromId(item.id) === cardDay;
  });
  picked.sort((a, b) => a.id.localeCompare(b.id));
  return { cardDay, items: picked.slice(0, cap) };
}
