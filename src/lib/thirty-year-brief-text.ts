/**
 * Sentences for "Where we stand" and "What we're watching" in the 30-year
 * brief (/risk/six-percent-that-stays/). Pure functions: numbers in,
 * sentences out. No imports, so a test can feed altered numbers with plain
 * Node. briefs.ts gathers the numbers from the same feeds and 52-week window
 * the /risk/ watch-list row uses.
 *
 * Strain rule (used for the closing line):
 *   The 30-year is strained when it closes at or above the first watch level
 *   (5.75%, named in the old essay), and at the risk line when it closes at or
 *   above 6%.
 */

export interface Dated {
  date: string;
  value: number;
}

export interface ThirtyYearInput {
  /** The row's 52-week window, oldest first; the last point is the latest close. */
  year: Dated[];
  previous: Dated | null;
  /** The risk line (6) and the first watch level (5.75), in percent. */
  line: number;
  watchLevel: number;
}

export interface ThirtyYearText {
  asOf: string;
  level: string;
  range: string;
  strain: string;
  watch: string[];
  strained: boolean;
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parts = (iso: string) => iso.split('-').map(Number);

function dayLabel(iso: string, refYear?: number): string {
  const [y, m, d] = parts(iso);
  return refYear === y ? `${d} ${SHORT[m - 1]}` : `${d} ${SHORT[m - 1]} ${y}`;
}

const pct = (v: number) => `${v.toFixed(2)}%`;
const bp = (gap: number) => Math.round(Math.abs(gap) * 100);
const bpText = (n: number) => `${n} basis ${n === 1 ? 'point' : 'points'}`;

/** Highest and lowest point. Ties go to the latest date, the same rule as the row. */
function extremes(points: Dated[]) {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if (p.value >= hi.value) hi = p;
    if (p.value <= lo.value) lo = p;
  }
  return { hi, lo };
}

export function thirtyYearBrief(input: ThirtyYearInput): ThirtyYearText {
  const { year, previous, line, watchLevel } = input;
  const close = year[year.length - 1];
  const y = parts(close.date)[0];
  const { hi, lo } = extremes(year);
  const lineLabel = `${line}%`;
  const watchLabel = `${watchLevel}%`;

  /* Level and distance to the line */
  const gap = bp(line - close.value);
  const dist =
    gap === 0 ? `right at ${lineLabel}` : `${bpText(gap)} ${close.value < line ? 'below' : 'above'} ${lineLabel}`;
  let level = `The 30-year Treasury yield closed at ${pct(close.value)} on ${dayLabel(close.date)}, ${dist}. A basis point is a hundredth of a percentage point.`;
  if (previous) {
    const move = bp(close.value - previous.value);
    level +=
      move === 0
        ? ` That is unchanged from ${pct(previous.value)} on ${dayLabel(previous.date, y)}.`
        : ` That is ${close.value > previous.value ? 'up' : 'down'} ${bpText(move)} from ${pct(previous.value)} on ${dayLabel(previous.date, y)}.`;
  }

  /* 52-week framing */
  let range: string;
  if (hi.date === close.date) {
    range = `That is the highest close of the past 52 weeks. The low in that window was ${pct(lo.value)} on ${dayLabel(lo.date, y)}.`;
  } else if (lo.date === close.date) {
    range = `That is the lowest close of the past 52 weeks. The high in that window was ${pct(hi.value)} on ${dayLabel(hi.date, y)}.`;
  } else {
    range = `Over the past 52 weeks it has ranged from ${pct(lo.value)} on ${dayLabel(lo.date, y)} to ${pct(hi.value)} on ${dayLabel(hi.date, y)}.`;
  }
  if (close.value < line && line > lo.value && lo.date !== close.date) {
    const share = Math.round(((close.value - lo.value) / (line - lo.value)) * 100);
    range += ` It sits ${share}% of the way from that low to ${lineLabel}.`;
  }

  /* Closing line: strain */
  /* Compared at the shown precision (whole basis points). */
  const atOrAbove = (level: number) => bp(level - close.value) === 0 || close.value > level;
  const strained = atOrAbove(watchLevel);
  let strain: string;
  if (atOrAbove(line)) {
    strain = `Today the 30-year is ${gap === 0 ? 'at' : 'above'} ${lineLabel}. The risk now is whether it holds there through a long-term borrowing date.`;
  } else if (strained) {
    strain = `Today the 30-year shows strain. It is ${bp(watchLevel - close.value) === 0 ? 'at' : 'above'} ${watchLabel}, the first watch level, and ${bpText(gap)} short of ${lineLabel}.`;
  } else {
    const under = bp(watchLevel - close.value);
    strain = `Today the 30-year shows no strain. It is ${bpText(under)} under ${watchLabel}, the first watch level, and `;
    strain +=
      hi.value >= line
        ? `has fallen back since closing at ${pct(hi.value)} on ${dayLabel(hi.date, y)}.`
        : `has not closed at ${lineLabel} in the past 52 weeks.`;
  }

  /* What we're watching: levels from the feed */
  const watch: string[] = [];
  if (!strained) {
    watch.push(`The 30-year closing above ${watchLabel}, the first watch level, then above ${lineLabel}, and staying there through a long-term borrowing date rather than for one day.`);
  } else if (!atOrAbove(line)) {
    watch.push(`The 30-year closing above ${lineLabel} and staying there through a long-term borrowing date rather than for one day.`);
  } else {
    watch.push(`The 30-year staying above ${lineLabel} through the next long-term borrowing date, or falling back below it.`);
  }
  watch.push(
    hi.date === close.date
      ? `Each close above ${pct(hi.value)}, which would set another 52-week high.`
      : `A close above ${pct(hi.value)}, which would be a new 52-week high.`,
  );

  return {
    asOf: `Numbers as of ${dayLabel(close.date)}.`,
    level,
    range,
    strain,
    watch,
    strained,
  };
}
