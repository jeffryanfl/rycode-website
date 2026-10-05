/**
 * Sentences for the "Where we stand" and "What we're watching" parts of the
 * AI build-out contagion brief (/risk/when-force-majeure-hits-the-ai-build-out/).
 * Pure functions: numbers in, sentences out. No imports, so a test can feed
 * altered numbers with plain Node. ai-contagion-brief.ts gathers the numbers
 * from the same feeds and windows the /risk/ watch-list row uses.
 *
 * Strain rule (documented on purpose, used for the closing line):
 *   Build is strained when construction spending fell from the month before.
 *   Chips and Market are strained when the close is 5% or more below the
 *   52-week closing peak.
 */

export interface Dated {
  date: string;
  value: number;
  status?: string;
}

export interface BriefInput {
  /** Census monthly spending, millions of dollars, the row's window, oldest first. */
  build: Dated[];
  /** SMH closes, the row's 52-week window, oldest first. */
  chips: Dated[];
  /** S&P 500 closes, the row's 52-week window, oldest first. */
  market: Dated[];
  top10: { date: string; share: number } | null;
  /** Drops from the peak, as fractions: 0.1 and 0.2. */
  correction: number;
  bear: number;
}

export interface BriefText {
  build: string;
  chips: string;
  market: string;
  strain: string;
  asOf: string;
  watch: string[];
  strained: { build: boolean; chips: boolean; market: boolean };
}

export const STRAIN_DROP = 5;

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parts = (iso: string) => iso.split('-').map(Number);
const yearOf = (iso: string) => parts(iso)[0];

function dayLabel(iso: string, refYear?: number): string {
  const [y, m, d] = parts(iso);
  return refYear === y ? `${d} ${SHORT[m - 1]}` : `${d} ${SHORT[m - 1]} ${y}`;
}

function monthYear(iso: string): string {
  const [y, m] = parts(iso);
  return `${SHORT[m - 1]} ${y}`;
}

const millions = (v: number) => `$${Math.round(v).toLocaleString('en-US')}M`;
const two = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dollars = (v: number) => `$${two(v)}`;

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

function windowName(n: number): string {
  if (n === 24) return 'two years';
  if (n === 12) return 'a year';
  return `${n} months`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface PeakRead {
  close: Dated;
  peak: Dated;
  below: number;
  atPeak: boolean;
}

function peakRead(points: Dated[]): PeakRead {
  const close = points[points.length - 1];
  const { hi } = extremes(points);
  const below = Math.max((1 - close.value / hi.value) * 100, 0);
  return { close, peak: hi, below, atPeak: hi.date === close.date };
}

export function aiContagionBrief(input: BriefInput): BriefText {
  const corr = input.correction * 100;
  const bear = input.bear * 100;

  /* ---------- Step 1, Build ---------- */
  const b = input.build;
  const latest = b[b.length - 1];
  const prior = b[b.length - 2];
  const { hi: bHi, lo: bLo } = extremes(b);
  const span = windowName(b.length);
  const dir = latest.value > prior.value ? 'up from' : latest.value < prior.value ? 'down from' : 'unchanged from';
  const priorMonth = LONG[parts(prior.date)[1] - 1] + (yearOf(prior.date) === yearOf(latest.date) ? '' : ` ${yearOf(prior.date)}`);
  const prelim = latest.status === 'preliminary' ? ' (preliminary)' : '';
  let build = `The Census Bureau puts US data-center construction spending at ${millions(latest.value)} in ${monthYear(latest.date)}${prelim}, ${dir} ${millions(prior.value)} in ${priorMonth}`;
  if (bHi.date === latest.date) {
    build += ` and the highest in ${span}.`;
    const ratio = latest.value / bLo.value;
    const grew =
      ratio >= 3 ? 'more than tripled' : ratio >= 2 ? 'more than doubled' : `risen ${Math.round((ratio - 1) * 100)}%`;
    build += ` The low in that window was ${millions(bLo.value)} in ${monthYear(bLo.date)}, so monthly spending has ${grew}.`;
  } else if (bLo.date === latest.date) {
    build += ` and the lowest in ${span}. The high in that window was ${millions(bHi.value)} in ${monthYear(bHi.date)}.`;
  } else {
    build += `. Over ${span} it has ranged from ${millions(bLo.value)} in ${monthYear(bLo.date)} to ${millions(bHi.value)} in ${monthYear(bHi.date)}.`;
  }

  /* ---------- Step 2, Chips ---------- */
  const c = peakRead(input.chips);
  const cYear = yearOf(c.close.date);
  const cPeakDay = dayLabel(c.peak.date, cYear);
  let chips = `The SMH chip ETF, a fund that holds the large semiconductor companies, closed at ${dollars(c.close.value)} on ${dayLabel(c.close.date)}.`;
  if (c.atPeak) {
    chips += ` That is its highest close of the past 52 weeks. A correction, the market term for a 10% fall from a peak, would start below ${dollars(c.peak.value * (1 - input.correction))}.`;
  } else if (c.below < corr) {
    chips += ` That is ${c.below.toFixed(1)}% below its ${cPeakDay} peak of ${dollars(c.peak.value)} and ${(corr - c.below).toFixed(1)} points short of a correction, the market term for a 10% fall from a peak.`;
  } else if (c.below < bear) {
    chips += ` That is ${c.below.toFixed(1)}% below its ${cPeakDay} peak of ${dollars(c.peak.value)}, which puts it in a correction, the market term for a 10% fall from a peak, and ${(bear - c.below).toFixed(1)} points short of a bear market.`;
  } else {
    chips += ` That is ${c.below.toFixed(1)}% below its ${cPeakDay} peak of ${dollars(c.peak.value)}, which puts it in a bear market, a fall of 20% or more from a peak.`;
  }

  /* ---------- Step 3, Market ---------- */
  const m = peakRead(input.market);
  const mPeakDay = dayLabel(m.peak.date, yearOf(m.close.date));
  let market = `The S&P 500 closed at ${two(m.close.value)} on ${dayLabel(m.close.date, cYear)}`;
  if (m.atPeak) {
    market += ', its highest close of the past 52 weeks.';
  } else if (m.below < corr) {
    market += `, ${m.below.toFixed(1)}% below its ${mPeakDay} peak of ${two(m.peak.value)} and ${(corr - m.below).toFixed(1)} points from a correction.`;
  } else if (m.below < bear) {
    market += `, ${m.below.toFixed(1)}% below its ${mPeakDay} peak of ${two(m.peak.value)}, which puts it in a correction, ${(bear - m.below).toFixed(1)} points from a bear market.`;
  } else {
    market += `, ${m.below.toFixed(1)}% below its ${mPeakDay} peak of ${two(m.peak.value)}, which puts it in a bear market.`;
  }
  if (input.top10) {
    market += ` The ten largest companies make up ${input.top10.share.toFixed(2)}% of SPY, the main S&P 500 fund, as of ${dayLabel(input.top10.date, cYear)}.`;
  }

  /* ---------- Closing line: which steps show strain ---------- */
  const strained = {
    build: latest.value < prior.value,
    chips: c.below >= STRAIN_DROP,
    market: m.below >= STRAIN_DROP,
  };
  const names: [keyof typeof strained, string, string][] = [
    ['build', 'building', 'shows'],
    ['chips', 'chips', 'show'],
    ['market', 'the S&P 500', 'shows'],
  ];
  const hit = names.filter(([k]) => strained[k]);
  let first: string;
  if (hit.length === 0) first = 'Today no step shows strain.';
  else if (hit.length === 1) first = `Today only ${hit[0][1]} ${hit[0][2]} strain.`;
  else if (hit.length === 2) first = `Today ${hit[0][1]} and ${hit[1][1]} show strain.`;
  else first = 'Today all three steps show strain.';

  const calm: string[] = [];
  if (!strained.build) {
    calm.push(
      latest.value > prior.value
        ? bHi.date === latest.date
          ? 'building is still accelerating'
          : 'building is still rising'
        : 'building is flat',
    );
  }
  if (!strained.chips) calm.push(c.below < 2 ? 'chips sit near their high' : 'chips are within 5% of their high');
  if (!strained.market) calm.push(m.below < 2 ? 'the S&P 500 sits near its high' : 'the S&P 500 is within 5% of its high');
  let second: string;
  if (calm.length) {
    second = `${cap(joinList(calm))}.`;
  } else {
    second = `${cap(
      joinList([
        'construction spending fell from the month before',
        `chips are ${c.below.toFixed(1)}% below their peak`,
        `the S&P 500 is ${m.below.toFixed(1)}% below its peak`,
      ]),
    )}.`;
  }

  /* ---------- What we're watching: levels from the peaks ---------- */
  const cCorr = c.peak.value * (1 - input.correction);
  const cBear = c.peak.value * (1 - input.bear);
  const mCorr = m.peak.value * (1 - input.correction);
  const watch: string[] = [];
  watch.push(
    strained.build
      ? `Census data-center construction spending falling again after the ${SHORT[parts(latest.date)[1] - 1]} print.`
      : `Census data-center construction spending stalling or falling after the ${SHORT[parts(latest.date)[1] - 1]} print.`,
  );
  if (c.close.value > cCorr) {
    watch.push(
      `SMH closing below ${dollars(cCorr)}, its 10% correction line, or below ${dollars(cBear)}, its 20% bear-market line. A bear market is a fall of 20% or more from a peak.`,
    );
  } else if (c.close.value > cBear) {
    watch.push(
      `SMH closing below ${dollars(cBear)}, its 20% bear-market line, or back above ${dollars(cCorr)}, its 10% correction line. A bear market is a fall of 20% or more from a peak.`,
    );
  } else {
    watch.push(`SMH staying below ${dollars(cBear)}, its 20% bear-market line, or recovering above ${dollars(cCorr)}, its 10% correction line.`);
  }
  watch.push(
    m.close.value > mCorr
      ? `The S&P 500 closing below ${two(mCorr)}, which is 10% under its ${mPeakDay} peak.`
      : `The S&P 500 holding below ${two(mCorr)}, which is 10% under its ${mPeakDay} peak.`,
  );

  const asOfDate = [c.close.date, m.close.date].sort().pop() as string;

  return {
    build,
    chips,
    market,
    strain: `${first} ${second}`,
    asOf: `Numbers as of ${dayLabel(asOfDate)}.`,
    watch,
    strained,
  };
}
