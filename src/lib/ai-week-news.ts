import feedHistory from '../../public/ai-feed-history.json';
import {
  formatFeedDateLabel,
  isLastUpdatedStale,
  keepFeedItem,
  sortFeedItems,
  todayYmdInTimeZone,
  todayYmdLocal,
} from '../../scripts/lib/ai-feed-history-core.mjs';
import { safeHref } from './safe-href';

export type AiFeedItem = {
  id: string;
  date: string;
  tag: string;
  headline: string;
  why: string;
  url: string;
  source: string;
  status: 'confirmed' | 'reported' | 'claim' | string;
};

export type AiFeedHistory = {
  schema: string;
  updated: string;
  items: AiFeedItem[];
};

const history = feedHistory as AiFeedHistory;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "21 Oct" for display; datetime stays YYYY-MM-DD on <time>. */
export function formatNewsDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${d} ${MONTHS[m - 1] ?? ''}`.trim();
}

export { formatFeedDateLabel as formatNewsDateLabel, keepFeedItem, sortFeedItems, todayYmdLocal };

/** Drop items outside the 7-day window (same rules as the morning history script). */
export function feedItemsInWindow(items: AiFeedItem[], todayYmd = todayYmdLocal()): AiFeedItem[] {
  return items.filter((item) => keepFeedItem(todayYmd, item));
}

export function statusLabel(status: string): string | null {
  const s = status?.toLowerCase();
  if (s === 'confirmed') return 'Confirmed';
  if (s === 'reported') return 'Reported';
  if (s === 'claim') return 'Claim';
  return null;
}

export function isOutlinedStatus(status: string): boolean {
  const s = status?.toLowerCase();
  return s === 'reported' || s === 'claim';
}

export function lastUpdatedLine(updatedIso: string, now = new Date()): string | null {
  const updated = new Date(updatedIso);
  if (Number.isNaN(updated.getTime())) return null;
  if (!isLastUpdatedStale(updatedIso, now)) return null;
  const updatedYmd = todayYmdInTimeZone(updated);
  const [y, m, d] = updatedYmd.split('-').map(Number);
  return `Last updated ${d} ${MONTHS[m - 1]} ${y}`;
}

export type WeekNewsRow = {
  id: string;
  dateYmd: string;
  dateLabel: string;
  headline: string;
  href: string | null;
  source: string;
  status: string;
  statusText: string | null;
  outlined: boolean;
};

export function weekNewsRows(items: AiFeedItem[], cap = 12, todayYmd = todayYmdLocal()): WeekNewsRow[] {
  const sorted = sortFeedItems(feedItemsInWindow(items, todayYmd), todayYmd);
  const rows: WeekNewsRow[] = [];
  for (const item of sorted.slice(0, cap)) {
    const statusText = statusLabel(item.status);
    rows.push({
      id: item.id,
      dateYmd: item.date,
      dateLabel: formatFeedDateLabel(item, todayYmd),
      headline: item.headline,
      href: safeHref(item.url),
      source: item.source,
      status: item.status,
      statusText,
      outlined: isOutlinedStatus(item.status),
    });
  }
  return rows;
}

export function loadWeekNews(): { updated: string; rows: WeekNewsRow[] } {
  const items = Array.isArray(history.items) ? history.items : [];
  return {
    updated: history.updated ?? '',
    rows: weekNewsRows(items),
  };
}
