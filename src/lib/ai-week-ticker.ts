import feedHistory from '../../public/ai-feed-history.json';
import {
  asOfLabelFromYmd,
  feedItemsInWindow,
  selectTickerItems,
  tickerItemTag,
  tickerItemText,
} from '../../scripts/lib/ai-week-ticker.mjs';
import { todayYmdLocal } from '../../scripts/lib/ai-feed-history-core.mjs';
import { safeHref } from './safe-href';
import type { AiFeedHistory, AiFeedItem } from './ai-week-news';

export type TickerTapeItem = {
  id: string;
  tag: string;
  headline: string;
  href: string | null;
};

export function buildTickerTape(
  items: AiFeedItem[],
  todayYmd = todayYmdLocal(),
  cap = 10,
): { asOfLabel: string; items: TickerTapeItem[] } {
  const { latestDate, items: picked } = selectTickerItems(items, todayYmd, cap);
  const tapeItems: TickerTapeItem[] = [];
  for (const item of picked) {
    const href = safeHref(item.url);
    if (!href) continue;
    tapeItems.push({
      id: item.id,
      tag: tickerItemTag(item, todayYmd),
      headline: item.headline,
      href,
    });
  }
  return {
    asOfLabel: latestDate ? asOfLabelFromYmd(latestDate) : '',
    items: tapeItems,
  };
}

export function loadAiWeekTicker(todayYmd = todayYmdLocal()) {
  const history = feedHistory as AiFeedHistory;
  const raw = Array.isArray(history.items) ? history.items : [];
  const { asOfLabel, items } = buildTickerTape(raw, todayYmd);
  return { asOfLabel, items, hidden: items.length === 0 };
}

export { feedItemsInWindow, selectTickerItems, tickerItemTag, tickerItemText, asOfLabelFromYmd };
