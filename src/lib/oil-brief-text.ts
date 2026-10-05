/**
 * Sentences for "Where we stand" and "What we're watching" in the oil brief
 * (/economics/warsh-first-hike-oil-and-five-percent-ten-year/). Pure
 * functions: numbers in, sentences out. No imports, so a test can feed altered
 * numbers with plain Node. briefs.ts gathers the numbers from the same feeds
 * and 52-week window the /risk/ watch-list row uses. No oil number is written
 * here or in the page; every one comes from the feed.
 *
 * Strain rule (used for the closing line):
 *   Oil is strained when WTI closes at or above $100, the row's risk line.
 *   Long rates are strained when the 10-year Treasury yield closes at or above 5%.
 */

export interface Dated {
  date: string;
  value: number;
}

export interface OilInput {
  /** WTI closes, the row's 52-week window, oldest first; the last point is the latest close. */
  year: Dated[];
  previous: Dated | null;
  /** WTI close on the day of the first hike, from the same window. */
  hike: Dated | null;
  line: number;
  /** 10-year Treasury yield: latest close and the close on the day of the hike. */
  tenYear: { last: Dated; hike: Dated | null };
  rateLine: number;
}

export interface OilText {
  asOf: string;
  level: string;
  range: string;
  rates: string;
  strain: string;
  watch: string[];
  strained: { oil: boolean; rates: boolean };
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parts = (iso: string) => iso.split('-').map(Number);

function dayLabel(iso: string, refYear?: number): string {
  const [y, m, d] = parts(iso);
  return refYear === y ? `${d} ${SHORT[m - 1]}` : `${d} ${SHORT[m - 1]} ${y}`;
}

const dollars = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v: number) => `${v.toFixed(2)}%`;
const cents = (v: number) => Math.round(Math.abs(v) * 100);
const bp = (gap: number) => Math.round(Math.abs(gap) * 100);
const bpText = (n: number) => `${n} basis ${n === 1 ? 'point' : 'points'}`;

function extremes(points: Dated[]) {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if (p.value >= hi.value) hi = p;
    if (p.value <= lo.value) lo = p;
  }
  return { hi, lo };
}

export function oilBrief(input: OilInput): OilText {
  const { year, previous, hike, line, tenYear, rateLine } = input;
  const close = year[year.length - 1];
  const y = parts(close.date)[0];
  const { hi, lo } = extremes(year);
  const lineLabel = `$${line}`;

  /* Level, distance to the line, day-over-day move, and the hike day */
  const gap = line - close.value;
  const dist = cents(gap) === 0 ? `right at the ${lineLabel} line` : `${dollars(Math.abs(gap))} ${gap > 0 ? 'below' : 'above'} the ${lineLabel} line`;
  let level = `WTI crude futures closed at ${dollars(close.value)} a barrel on ${dayLabel(close.date)}, ${dist}`;
  if (previous) {
    const move = cents(close.value - previous.value);
    level += move === 0
      ? `, unchanged from ${dollars(previous.value)} on ${dayLabel(previous.date, y)}.`
      : `, ${close.value > previous.value ? 'up' : 'down'} from ${dollars(previous.value)} on ${dayLabel(previous.date, y)}.`;
  } else {
    level += '.';
  }
  if (hike) {
    const since = close.value - hike.value;
    level += cents(since) === 0
      ? ` That is the same as its ${dollars(hike.value)} close on ${dayLabel(hike.date, y)}, the day of the hike.`
      : ` On ${dayLabel(hike.date, y)}, the day of the hike, it closed at ${dollars(hike.value)}, so oil is ${dollars(Math.abs(since))} ${since < 0 ? 'lower' : 'higher'} since then.`;
  }

  /* 52-week framing */
  let range: string;
  if (hi.date === close.date) {
    range = `That is the highest close of the past 52 weeks. The low in that window was ${dollars(lo.value)} on ${dayLabel(lo.date, y)}.`;
  } else if (lo.date === close.date) {
    range = `That is the lowest close of the past 52 weeks. The high in that window was ${dollars(hi.value)} on ${dayLabel(hi.date, y)}.`;
  } else {
    range = `Over the past 52 weeks it has ranged from ${dollars(lo.value)} on ${dayLabel(lo.date, y)} to ${dollars(hi.value)} on ${dayLabel(hi.date, y)}.`;
  }
  if (gap > 0 && cents(gap) > 0 && lo.date !== close.date) {
    range += ` It sits ${Math.round(((close.value - lo.value) / (line - lo.value)) * 100)}% of the way from that low to ${lineLabel}.`;
  }

  /* 10-year yield */
  const t = tenYear.last;
  const tGap = bp(t.value - rateLine);
  const tDist = tGap === 0 ? `right at ${rateLine}%` : `${bpText(tGap)} ${t.value > rateLine ? 'above' : 'below'} ${rateLine}%`;
  let rates = `The 10-year Treasury yield closed at ${pct(t.value)} on ${dayLabel(t.date, y)}, ${tDist}.`;
  if (tenYear.hike) {
    const move = bp(t.value - tenYear.hike.value);
    rates += move === 0
      ? ` That is unchanged from ${pct(tenYear.hike.value)} on the day of the hike.`
      : ` That is ${t.value > tenYear.hike.value ? 'up' : 'down'} from ${pct(tenYear.hike.value)} on the day of the hike.`;
  }

  /* Closing line: strain */
  /* Compared at the shown precision, so a close that reads $100.00 or 5.00% counts as at the line. */
  const strained = { oil: cents(gap) === 0 || gap < 0, rates: tGap === 0 || t.value > rateLine };
  const oilWhere = !strained.oil ? `oil sits below ${lineLabel}` : cents(gap) === 0 ? `oil is at ${lineLabel}` : `oil is above ${lineLabel}`;
  const rateWhere = !strained.rates ? `the 10-year is below ${rateLine}%` : tGap === 0 ? `the 10-year is at ${rateLine}%` : `the 10-year is above ${rateLine}%`;
  let strain: string;
  if (strained.oil && strained.rates) strain = `Today oil and long rates both show strain: ${oilWhere} and ${rateWhere}.`;
  else if (strained.oil) strain = `Today only oil shows strain: ${oilWhere} while ${rateWhere}.`;
  else if (strained.rates) strain = `Today only long rates show strain: ${rateWhere} while ${oilWhere}.`;
  else strain = `Today neither oil nor long rates show strain: ${oilWhere} and ${rateWhere}.`;

  /* What we're watching: levels from the feed */
  const watch: string[] = [];
  watch.push(
    strained.oil
      ? `WTI holding ${cents(gap) === 0 ? 'at or above' : 'above'} ${lineLabel}, or falling back below it.`
      : `WTI closing ${hi.value >= line ? 'back ' : ''}above ${lineLabel}, ${dollars(gap)} above the latest close.`,
  );
  watch.push(
    hi.date === close.date
      ? `Each WTI close above ${dollars(hi.value)}, which would set another 52-week high.`
      : `A WTI close above ${dollars(hi.value)}, which would be a new 52-week high.`,
  );
  watch.push(
    strained.rates
      ? `The 10-year yield staying ${tGap === 0 ? 'at or above' : 'above'} ${rateLine}%, or falling back below it.`
      : `The 10-year yield moving above ${rateLine}%.`,
  );

  return {
    asOf: `Numbers as of ${dayLabel([close.date, t.date].sort().pop() as string)}.`,
    level,
    range,
    rates,
    strain,
    watch,
    strained,
  };
}
