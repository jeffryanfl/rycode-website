/**
 * Numbers for the watch-list briefs, read at build time from the same feeds,
 * windows, and averages as the rows on /risk/ (src/data/risk-watch.json).
 * Each after-close feed push moves a brief with its row. The sentence
 * templates live in the *-brief-text.ts files, which take plain numbers.
 * The AI build-out contagion brief has its own adapter, ai-contagion-brief.ts.
 */
import { chainStepWindows, feedPoints, rowWindows, type StepWindow } from './risk-watch';
import { thirtyYearBrief, type ThirtyYearText } from './thirty-year-brief-text';
import { oilBrief, type OilText } from './oil-brief-text';
import { debtRefiBrief, type DebtRefiText } from './debt-refi-brief-text';

type Point = { date: string; [key: string]: unknown };

const asDated = (p: Point, key: string) => ({
  date: p.date,
  value: p[key] as number,
  status: typeof p.status === 'string' ? p.status : undefined,
});

/** First watch level for the 30-year, named in the old essay ("holds above 5.75 percent, then 6 percent"). */
export const THIRTY_YEAR_WATCH_LEVEL = 5.75;

export function thirtyYearBriefNow(): ThirtyYearText {
  const w = rowWindows('thirty-year');
  if (w.riskLine === null) throw new Error('BRIEF: thirty-year row needs a risk line');
  return thirtyYearBrief({
    year: w.year.map((p) => asDated(p, w.key)),
    previous: w.previous ? asDated(w.previous, w.key) : null,
    line: w.riskLine,
    watchLevel: THIRTY_YEAR_WATCH_LEVEL,
  });
}

/** The date of the first rate hike under Chair Warsh (FOMC statement, 16 Sep 2026). */
export const FIRST_HIKE_DATE = '2026-09-16';
/** The ten-year level the old essay named ("the ten-year near 5 percent"). */
export const TEN_YEAR_LINE = 5;

export function oilBriefNow(): OilText {
  const w = rowWindows('wti');
  if (w.riskLine === null) throw new Error('BRIEF: wti row needs a risk line');
  const hike = w.year.find((p) => p.date === FIRST_HIKE_DATE);
  const ten = feedPoints({ feed: 'public/macro-history.json', key: 'y10' });
  const tenLast = ten[ten.length - 1];
  if (!tenLast) throw new Error('BRIEF: no y10 points in public/macro-history.json');
  const tenHike = ten.find((p) => p.date === FIRST_HIKE_DATE);
  return oilBrief({
    year: w.year.map((p) => asDated(p, w.key)),
    previous: w.previous ? asDated(w.previous, w.key) : null,
    hike: hike ? asDated(hike, w.key) : null,
    line: w.riskLine,
    tenYear: { last: asDated(tenLast, 'y10'), hike: tenHike ? asDated(tenHike, 'y10') : null },
    rateLine: TEN_YEAR_LINE,
  });
}

function stepCompare(step: StepWindow) {
  if (!step.compare) throw new Error(`BRIEF: debt-refi step "${step.id}" needs a compare average`);
  return step.compare;
}

export function debtRefiBriefNow(): DebtRefiText {
  const w = chainStepWindows('debt-refi');
  const yields = feedPoints({ feed: 'public/debt-refi.json', series: 'auctions10y', key: 'highYield' });
  const hy = w.auctions.extra;
  if (!hy || !w.auctions.extraKey || hy.date !== w.auctions.last.date) {
    throw new Error('BRIEF: the latest 10-year auction needs a high yield on the same date');
  }
  const prevHy = yields[yields.length - 2];
  return debtRefiBrief({
    borrow: {
      points: w.borrow.windowPoints.map((p) => asDated(p, w.borrow.key)),
      compare: stepCompare(w.borrow),
      lastActual: w.borrow.extra && w.borrow.extraKey ? asDated(w.borrow.extra, w.borrow.extraKey) : null,
    },
    auctions: {
      points: w.auctions.windowPoints.map((p) => asDated(p, w.auctions.key)),
      compare: stepCompare(w.auctions),
      highYield: asDated(hy, w.auctions.extraKey),
      previousHighYield: prevHy ? asDated(prevHy, 'highYield') : null,
    },
    costs: {
      points: w.costs.windowPoints.map((p) => asDated(p, w.costs.key)),
      compare: stepCompare(w.costs),
      previous: w.costs.extra && w.costs.extraKey ? asDated(w.costs.extra, w.costs.extraKey) : null,
    },
  });
}
