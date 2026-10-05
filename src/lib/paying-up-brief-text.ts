/**
 * Sentences for "Where we stand" and "What we're watching" in the paying-up
 * brief (/economics/still-1998-not-1999/). Pure functions: numbers in,
 * sentences out. No imports, so a test can feed altered numbers with plain
 * Node. briefs.ts gathers the numbers from the same feeds and 52-week window
 * the /economics/ watch-list row "Paying up for the boom" uses.
 *
 * Strain rule (used for the closing line):
 *   The market is strained when the S&P 500 close is 5% or more below its
 *   52-week closing peak (the same tripwire as the AI build-out contagion
 *   brief's Market step).
 */

export interface Dated {
  date: string;
  value: number;
}

export interface PayingUpInput {
  /** S&P 500 closes, the row's 52-week window, oldest first. */
  market: Dated[];
  top10: { date: string; share: number } | null;
  /** Drops from the peak, as fractions: 0.1 and 0.2. */
  correction: number;
  bear: number;
}

export interface PayingUpText {
  asOf: string;
  market: string;
  top10: string;
  strain: string;
  watch: string[];
  strained: boolean;
}

export const STRAIN_DROP = 5;

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parts = (iso: string) => iso.split('-').map(Number);

function dayLabel(iso: string, refYear?: number): string {
  const [y, m, d] = parts(iso);
  return refYear === y ? `${d} ${SHORT[m - 1]}` : `${d} ${SHORT[m - 1]} ${y}`;
}

const two = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => `${v.toFixed(2)}%`;

function extremes(points: Dated[]) {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if (p.value >= hi.value) hi = p;
    if (p.value <= lo.value) lo = p;
  }
  return { hi, lo };
}

export function payingUpBrief(input: PayingUpInput): PayingUpText {
  const corr = input.correction * 100;
  const bear = input.bear * 100;
  const points = input.market;
  const close = points[points.length - 1];
  const prev = points[points.length - 2];
  const y = parts(close.date)[0];
  const { hi, lo } = extremes(points);
  const below = Math.max((1 - close.value / hi.value) * 100, 0);
  const atPeak = hi.date === close.date;
  const strained = below >= STRAIN_DROP;

  let market = `The S&P 500 closed at ${two(close.value)} on ${dayLabel(close.date)}`;
  if (prev) {
    const dir = close.value > prev.value ? 'up from' : close.value < prev.value ? 'down from' : 'unchanged from';
    market += `, ${dir} ${two(prev.value)} on ${dayLabel(prev.date, y)}`;
  }
  market += '. ';
  if (atPeak) {
    market += `That is the highest close of the past 52 weeks.`;
  } else {
    market += `It is ${below.toFixed(1)}% below the peak of ${two(hi.value)} on ${dayLabel(hi.date, y)}.`;
    if (below < corr) {
      market += ` That leaves ${(corr - below).toFixed(1)} points to a correction, a ${corr.toFixed(0)}% drop from the peak.`;
    } else if (below < bear) {
      market += ` It is already in a correction and ${(bear - below).toFixed(1)} points from a bear market, a ${bear.toFixed(0)}% drop from the peak.`;
    } else {
      market += ` It is in a bear market, more than ${bear.toFixed(0)}% below the peak.`;
    }
  }
  market += ` The low in that window was ${two(lo.value)} on ${dayLabel(lo.date, y)}.`;

  let top10 = '';
  if (input.top10) {
    top10 = `The ten largest holdings in SPY, the main S&P 500 exchange-traded fund, made up ${pct(input.top10.share)} of the fund on ${dayLabel(input.top10.date, y)}.`;
  }

  let strain: string;
  if (atPeak) {
    strain = `Today the boom shows no price strain. The index is at a 52-week high.`;
  } else if (!strained) {
    strain = `Today the boom shows no price strain. The index is ${below.toFixed(1)}% under the peak, short of the ${STRAIN_DROP}% tripwire.`;
  } else if (below < corr) {
    strain = `Today the boom shows price strain. The index is ${below.toFixed(1)}% under the peak, past the ${STRAIN_DROP}% tripwire and ${(corr - below).toFixed(1)} points short of a correction.`;
  } else if (below < bear) {
    strain = `Today the boom shows price strain. The index is in a correction, ${below.toFixed(1)}% under the peak.`;
  } else {
    strain = `Today the boom shows price strain. The index is in a bear market, ${below.toFixed(1)}% under the peak.`;
  }

  const watch: string[] = [];
  const corrLevel = hi.value * (1 - input.correction);
  const bearLevel = hi.value * (1 - input.bear);
  if (below < corr) {
    watch.push(`A close below ${two(corrLevel)}, which would be a ${corr.toFixed(0)}% drop from the peak of ${two(hi.value)} and a correction.`);
    watch.push(`A close below ${two(bearLevel)}, which would be a ${bear.toFixed(0)}% drop from that peak and a bear market.`);
  } else if (below < bear) {
    watch.push(`A close back above ${two(corrLevel)}, which would leave the correction.`);
    watch.push(`A close below ${two(bearLevel)}, which would be a ${bear.toFixed(0)}% drop from the peak of ${two(hi.value)} and a bear market.`);
  } else {
    watch.push(`A close back above ${two(bearLevel)}, which would leave the bear market.`);
    watch.push(`A close back above ${two(corrLevel)}, which would leave the correction.`);
  }
  if (input.top10) {
    watch.push(`The top-ten share of SPY moving away from ${pct(input.top10.share)}, the latest reading.`);
  }

  return {
    asOf: `Numbers as of ${dayLabel(close.date)}.`,
    market,
    top10,
    strain,
    watch,
    strained,
  };
}
