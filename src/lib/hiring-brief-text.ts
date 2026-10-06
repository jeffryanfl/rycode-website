/**
 * Sentences for "Where we stand" and "What we're watching" in the hiring brief
 * (/economics/jobs-print-was-strong-mix-is-the-story/). Pure functions: numbers
 * in, sentences out. No imports, so a test can feed altered numbers with plain
 * Node. briefs.ts gathers the numbers from the same feeds and windows the
 * /economics/ watch-list row "Hiring slows" uses.
 *
 * Strain rule (used for the closing line):
 *   Payrolls are strained when the latest change is below the prior 3-month
 *   average. Unemployment is strained when the rate is at or above the August
 *   4.1% marker. Claims are strained when the latest week is above the 4-week
 *   average.
 */

export interface Dated {
  date: string;
  value: number;
  status?: string;
}

export interface HiringInput {
  /** Monthly payroll changes (thousands), oldest first; last is the latest. */
  payrolls: Dated[];
  payrollsCompare: { average: number; diff: number; flagged: boolean; n: number; label: string };
  /** Average hourly earnings, year over year, percent. */
  earningsYoy: Dated | null;
  /** Monthly unemployment rate, percent. */
  unemployment: Dated[];
  /** Named marker on the row (August 4.1%). */
  unemploymentMarker: number;
  unemploymentMarkerLabel: string;
  /** Weekly initial claims. */
  claims: Dated[];
  claimsCompare: { average: number; diff: number; flagged: boolean; n: number; label: string } | null;
  /**
   * First-print August payroll change (thousands) named in Backstory, and the
   * feed's current reading for that month. When they differ, Where we stand
   * states the revision. Units match payrolls: thousands of jobs.
   */
  augustFirstPrint: { date: string; change: number };
  augustCurrent: Dated | null;
}

export interface HiringText {
  asOf: string;
  payrolls: string;
  /** Set when the feed's August reading differs from the Backstory first print. */
  augustRevision: string | null;
  unemployment: string;
  claims: string;
  strain: string;
  watch: string[];
  strained: { payrolls: boolean; unemployment: boolean; claims: boolean };
}

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

function monthName(iso: string, refYear?: number): string {
  const [y, m] = parts(iso);
  return refYear === y ? LONG[m - 1] : `${LONG[m - 1]} ${y}`;
}

const jobs = (v: number) => {
  const n = Math.round(Math.abs(v) * 1000);
  const body = n.toLocaleString('en-US');
  if (v > 0) return `+${body}`;
  if (v < 0) return `−${body}`;
  return '0';
};

const jobsPlain = (v: number) => Math.round(Math.abs(v) * 1000).toLocaleString('en-US');
const pct1 = (v: number) => `${v.toFixed(1)}%`;
const count = (v: number) => Math.round(v).toLocaleString('en-US');

function extremes(points: Dated[]) {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if (p.value >= hi.value) hi = p;
    if (p.value <= lo.value) lo = p;
  }
  return { hi, lo };
}

function statusTag(p: Dated): string {
  return p.status === 'preliminary' ? ', preliminary' : '';
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function hiringBrief(input: HiringInput): HiringText {
  const pay = input.payrolls;
  const latestPay = pay[pay.length - 1];
  const priorPay = pay[pay.length - 2];
  const y = yearOf(latestPay.date);
  const { hi: pHi, lo: pLo } = extremes(pay);
  const cmp = input.payrollsCompare;
  const payStrained = cmp.flagged;

  let payrolls = `Employers added ${jobs(latestPay.value)} jobs in ${monthYear(latestPay.date)}${statusTag(latestPay)}`;
  if (priorPay) {
    payrolls += `, ${latestPay.value > priorPay.value ? 'up from' : latestPay.value < priorPay.value ? 'down from' : 'unchanged from'} ${jobs(priorPay.value)} in ${monthName(priorPay.date, y)}`;
  }
  payrolls += `. That is ${jobsPlain(Math.abs(cmp.diff))} jobs ${cmp.diff < 0 ? 'below' : cmp.diff > 0 ? 'above' : 'in line with'} its ${cmp.label} of ${jobs(cmp.average)}.`;
  if (pHi.date === latestPay.date) {
    payrolls += ` It is the highest monthly gain in the past ${pay.length} months.`;
  } else if (pLo.date === latestPay.date) {
    payrolls += ` It is the weakest monthly print in the past ${pay.length} months.`;
  } else {
    payrolls += ` Over the past ${pay.length} months the gain has ranged from ${jobs(pLo.value)} in ${monthYear(pLo.date)} to ${jobs(pHi.value)} in ${monthYear(pHi.date)}.`;
  }
  if (input.earningsYoy) {
    const e = input.earningsYoy;
    payrolls += ` Average hourly earnings were up ${pct1(e.value)} over the year in ${monthYear(e.date)}${statusTag(e)}.`;
  }

  let augustRevision: string | null = null;
  const first = input.augustFirstPrint;
  const aug = input.augustCurrent;
  if (aug && Math.round(aug.value) !== Math.round(first.change)) {
    augustRevision = `August has since been revised to ${jobs(aug.value)} from the first ${jobs(first.change)}.`;
  }

  const un = input.unemployment;
  const latestUn = un[un.length - 1];
  const priorUn = un[un.length - 2];
  const marker = input.unemploymentMarker;
  const unStrained = latestUn.value >= marker;
  const unGap = Math.round((latestUn.value - marker) * 10) / 10;
  let unemployment = `The unemployment rate, the share of people looking for work among everyone working or looking, was ${pct1(latestUn.value)} in ${monthYear(latestUn.date)}${statusTag(latestUn)}`;
  if (priorUn) {
    const move = Math.round((latestUn.value - priorUn.value) * 10) / 10;
    unemployment +=
      move === 0
        ? `, unchanged from ${monthName(priorUn.date, yearOf(latestUn.date))}`
        : `, ${move > 0 ? 'up' : 'down'} from ${pct1(priorUn.value)} in ${monthName(priorUn.date, yearOf(latestUn.date))}`;
  }
  unemployment += `. That is ${
    unGap === 0
      ? `at the ${input.unemploymentMarkerLabel} marker`
      : `${Math.abs(unGap).toFixed(1)} point${Math.abs(unGap) === 0.1 ? '' : 's'} ${unGap > 0 ? 'above' : 'below'} the ${input.unemploymentMarkerLabel} marker`
  }.`;

  let claims = '';
  let claimsStrained = false;
  if (input.claims.length && input.claimsCompare) {
    const c = input.claims;
    const latestC = c[c.length - 1];
    const cc = input.claimsCompare;
    claimsStrained = latestC.value > cc.average;
    const gap = Math.abs(Math.round(latestC.value - cc.average));
    claims = `New claims for unemployment benefits came in at ${count(latestC.value)} for the week of ${dayLabel(latestC.date)}${statusTag(latestC)}. That is ${
      gap === 0 ? `in line with` : `${count(gap)} ${latestC.value > cc.average ? 'above' : 'below'}`
    } its ${cc.label} of ${count(cc.average)}.`;
  }

  const flags: string[] = [];
  if (payStrained) flags.push('payrolls');
  if (unStrained) flags.push('unemployment');
  if (claimsStrained) flags.push('claims');
  let strain: string;
  if (flags.length === 0) {
    strain = 'Today hiring shows no strain. Payrolls are at or above the recent average, unemployment is under the August marker, and claims are not running hot against their four-week average.';
  } else if (flags.length === 3) {
    strain = 'Today hiring shows strain on all three steps: payrolls are slower than the recent average, unemployment is at or above the August marker, and claims are running above their four-week average.';
  } else {
    strain = `Today hiring shows strain on ${joinList(flags)}.`;
  }

  const watch: string[] = [];
  watch.push(
    payStrained
      ? `A payroll month back above the prior ${cmp.n}-month average of ${jobs(cmp.average)}, or another month below it.`
      : `A payroll month below the prior ${cmp.n}-month average of ${jobs(cmp.average)}.`,
  );
  watch.push(
    unStrained
      ? `Unemployment falling back under ${pct1(marker)}, the ${input.unemploymentMarkerLabel} marker, or another tenth of a point higher.`
      : `Unemployment closing at or above ${pct1(marker)}, the ${input.unemploymentMarkerLabel} marker.`,
  );
  if (input.claimsCompare) {
    const cc = input.claimsCompare;
    watch.push(
      claimsStrained
        ? `Weekly claims falling back under the ${cc.label} of ${count(cc.average)}.`
        : `Weekly claims rising above the ${cc.label} of ${count(cc.average)}.`,
    );
  }

  return {
    asOf: `Numbers as of ${monthYear(latestPay.date)}${latestPay.status === 'preliminary' ? ' (preliminary)' : ''}.`,
    payrolls,
    augustRevision,
    unemployment,
    claims,
    strain,
    watch,
    strained: { payrolls: payStrained, unemployment: unStrained, claims: claimsStrained },
  };
}
