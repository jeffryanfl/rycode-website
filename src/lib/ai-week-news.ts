import feedHistory from '../../public/ai-feed-history.json';
import {
  formatFeedDateLabel,
  sortFeedItems,
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

export { formatFeedDateLabel as formatNewsDateLabel, sortFeedItems, todayYmdLocal };

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

/** Weekdays strictly after `from` through `to` (local calendar days, Mon–Fri). */
export function weekdaysAfter(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let count = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function lastUpdatedLine(updatedIso: string, now = new Date()): string | null {
  const updated = new Date(updatedIso);
  if (Number.isNaN(updated.getTime())) return null;
  if (weekdaysAfter(updated, now) <= 2) return null;
  const y = updated.getFullYear();
  const m = updated.getMonth();
  const d = updated.getDate();
  return `Last updated ${d} ${MONTHS[m]} ${y}`;
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
  const sorted = sortFeedItems(items, todayYmd);
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
