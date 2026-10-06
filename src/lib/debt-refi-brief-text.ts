/**
 * Sentences for "Where we stand" and "What we're watching" in the debt
 * refinancing brief (/risk/when-the-spender-runs-the-printer/). Pure
 * functions: numbers in, sentences out. No imports, so a test can feed altered
 * numbers with plain Node. briefs.ts gathers the numbers from the same feeds,
 * windows, and recent averages the /risk/ watch-list chain uses, so the
 * averages and gaps here match the row.
 *
 * Strain rule (used for the closing line):
 *   Borrow is strained when the latest quarter is above its 4-quarter average.
 *   Auctions are strained when the row marks the latest auction "weaker than
 *   recent" (bid-to-cover below its 6-auction average).
 *   Costs are strained when the mortgage rate is above its 13-week average.
 */

export interface Dated {
  date: string;
  value: number;
  status?: string;
}

/** Average as the row rounds it, and latest minus average at the same rounding. */
export interface Compare {
  average: number;
  diff: number;
  n: number;
  label: string;
  flagged?: boolean;
}

export interface DebtRefiInput {
  borrow: { points: Dated[]; compare: Compare; lastActual: Dated | null };
  auctions: { points: Dated[]; compare: Compare; highYield: Dated; previousHighYield: Dated | null };
  costs: { points: Dated[]; compare: Compare; previous: Dated | null };
}

export interface DebtRefiText {
  asOf: string;
  borrow: string;
  auctions: string;
  costs: string;
  strain: string;
  watch: string[];
  strained: { borrow: boolean; auctions: boolean; costs: boolean };
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parts = (iso: string) => iso.split('-').map(Number);

function dayLabel(iso: string, refYear?: number): string {
  const [y, m, d] = parts(iso);
  return refYear === y ? `${d} ${SHORT[m - 1]}` : `${d} ${SHORT[m - 1]} ${y}`;
}

/** Calendar quarter from its first day: 2026-10-01 is "Oct to Dec 2026". */
function quarter(iso: string): string {
  const [y, m] = parts(iso);
  return `${SHORT[m - 1]} to ${SHORT[m + 1]} ${y}`;
}

const billions = (v: number) => `${v < 0 ? '-' : ''}$${Math.round(Math.abs(v)).toLocaleString('en-US')}B`;
const ratio = (v: number) => v.toFixed(2);
const pct = (v: number) => `${v.toFixed(2)}%`;
const pct3 = (v: number) => `${v.toFixed(3)}%`;
const bpText = (n: number) => `${n} basis ${n === 1 ? 'point' : 'points'}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function extremes(points: Dated[]) {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if (p.value >= hi.value) hi = p;
    if (p.value <= lo.value) lo = p;
  }
  return { hi, lo };
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function debtRefiBrief(input: DebtRefiInput): DebtRefiText {
  /* ---------- Step 1, Borrow ---------- */
  const bp = input.borrow.points;
  const b = bp[bp.length - 1];
  const bc = input.borrow.compare;
  const estimate = b.status === 'estimate';
  let borrow = estimate
    ? `Treasury estimates it will borrow ${billions(b.value)} in ${quarter(b.date)}, counting the marketable debt it sells to private investors minus the debt it pays off.`
    : `Treasury borrowed ${billions(b.value)} in ${quarter(b.date)}, counting the marketable debt it sold to private investors minus the debt it paid off.`;
  borrow +=
    bc.diff === 0
      ? ` That is level with its ${bc.label} of ${billions(bc.average)}.`
      : ` That is ${billions(Math.abs(bc.diff))} ${bc.diff > 0 ? 'above' : 'below'} its ${bc.label} of ${billions(bc.average)}.`;
  const la = input.borrow.lastActual;
  if (estimate && la) borrow += ` The latest actual figure, for ${quarter(la.date)}, was ${billions(la.value)}.`;
  const { hi: bHi, lo: bLo } = extremes(bp);
  if (bHi.date === b.date) borrow += ` It is the largest of the last ${bp.length} quarters.`;
  else if (bLo.date === b.date) borrow += ` It is the smallest of the last ${bp.length} quarters.`;
  else borrow += ` Across the last ${bp.length} quarters it has ranged from ${billions(bLo.value)} in ${quarter(bLo.date)} to ${billions(bHi.value)} in ${quarter(bHi.date)}.`;

  /* ---------- Step 2, Auctions ---------- */
  const ap = input.auctions.points;
  const a = ap[ap.length - 1];
  const ay = parts(a.date)[0];
  const ac = input.auctions.compare;
  const hy = input.auctions.highYield;
  const phy = input.auctions.previousHighYield;
  let auctions = `At the latest 10-year note auction, on ${dayLabel(a.date)}, buyers bid $${ratio(a.value)} for every $1 of notes on offer, a bid-to-cover ratio of ${ratio(a.value)}. The notes sold at a high yield, the top rate Treasury accepted, of ${pct3(hy.value)}`;
  if (phy) {
    auctions +=
      phy.value === hy.value
        ? `, the same as at the ${dayLabel(phy.date, ay)} auction.`
        : `, ${hy.value > phy.value ? 'up' : 'down'} from ${pct3(phy.value)} at the ${dayLabel(phy.date, ay)} auction.`;
  } else {
    auctions += '.';
  }
  if (ac.flagged) {
    auctions +=
      ac.diff === 0
        ? ` The ratio is just under its ${ac.label} of ${ratio(ac.average)}, so the row marks it weaker than recent.`
        : ` The ratio is ${ratio(Math.abs(ac.diff))} below its ${ac.label} of ${ratio(ac.average)}, so the row marks it weaker than recent.`;
  } else {
    auctions +=
      ac.diff === 0
        ? ` The ratio is level with its ${ac.label} of ${ratio(ac.average)}.`
        : ` The ratio is ${ratio(Math.abs(ac.diff))} above its ${ac.label} of ${ratio(ac.average)}, so demand was stronger than recent.`;
  }
  const { hi: aHi, lo: aLo } = extremes(ap);
  if (aHi.date === a.date) auctions += ` It is the strongest ratio of the last ${ap.length} auctions.`;
  else if (aLo.date === a.date) auctions += ` It is the weakest ratio of the last ${ap.length} auctions.`;
  else auctions += ` Over the last ${ap.length} auctions the ratio has ranged from ${ratio(aLo.value)} to ${ratio(aHi.value)}.`;

  /* ---------- Step 3, Costs ---------- */
  const cp = input.costs.points;
  const c = cp[cp.length - 1];
  const cy = parts(c.date)[0];
  const cc = input.costs.compare;
  const prev = input.costs.previous;
  let costs = `Freddie Mac's average 30-year fixed mortgage rate was ${pct(c.value)} in the week of ${dayLabel(c.date)}`;
  if (prev) {
    const move = Math.round(Math.abs(c.value - prev.value) * 100);
    costs +=
      move === 0
        ? `, unchanged from the week before.`
        : `, ${c.value > prev.value ? 'up' : 'down'} ${bpText(move)} from ${pct(prev.value)} the week before.`;
  } else {
    costs += '.';
  }
  const ccGap = Math.round(Math.abs(cc.diff) * 100);
  costs += cc.diff === 0 ? ` That is level with its ${cc.label} of ${pct(cc.average)}` : ` That is ${bpText(ccGap)} ${cc.diff > 0 ? 'above' : 'below'} its ${cc.label} of ${pct(cc.average)}`;
  const { hi: cHi, lo: cLo } = extremes(cp);
  if (cHi.date === c.date) costs += ` and the highest in 52 weeks. The low in that window was ${pct(cLo.value)} on ${dayLabel(cLo.date, cy)}.`;
  else if (cLo.date === c.date) costs += ` and the lowest in 52 weeks. The high in that window was ${pct(cHi.value)} on ${dayLabel(cHi.date, cy)}.`;
  else costs += `. Over 52 weeks it has ranged from ${pct(cLo.value)} on ${dayLabel(cLo.date, cy)} to ${pct(cHi.value)} on ${dayLabel(cHi.date, cy)}.`;

  costs += ' A basis point is a hundredth of a percentage point.';

  /* ---------- Closing line: which steps show strain ---------- */
  const strained = { borrow: bc.diff > 0, auctions: Boolean(ac.flagged), costs: cc.diff > 0 };
  const names: [keyof typeof strained, string, string][] = [
    ['borrow', 'borrowing', 'shows'],
    ['auctions', 'auction demand', 'shows'],
    ['costs', 'mortgage rates', 'show'],
  ];
  const hit = names.filter(([k]) => strained[k]);
  let first: string;
  if (hit.length === 0) first = 'Today no step shows strain.';
  else if (hit.length === 1) first = `Today only ${hit[0][1]} ${hit[0][2]} strain.`;
  else if (hit.length === 2) first = `Today ${hit[0][1]} and ${hit[1][1]} show strain.`;
  else first = 'Today all three steps show strain.';
  const calm: string[] = [];
  if (!strained.borrow) calm.push(`borrowing is at or below its ${bc.label}`);
  if (!strained.auctions) calm.push('auction demand is holding up');
  if (!strained.costs) calm.push(`mortgage rates are at or below their ${cc.label}`);
  const second = calm.length
    ? `${cap(joinList(calm))}.`
    : `${cap(joinList([`borrowing is above its ${bc.label}`, 'the latest auction was weaker than recent', `mortgage rates are above their ${cc.label}`]))}.`;

  /* ---------- What we're watching: levels from the feed ---------- */
  const watch: string[] = [];
  watch.push(`A 10-year auction bid-to-cover below ${ratio(ac.average)}, the current ${ac.label}, which the row would mark weaker than recent.`);
  if (cHi.date === c.date) {
    watch.push(`The 30-year mortgage rate climbing past ${pct(c.value)}, already its highest in 52 weeks, or falling back below ${pct(cc.average)}, its ${cc.label}.`);
  } else {
    watch.push(`The 30-year mortgage rate moving above ${pct(cHi.value)}, its 52-week high, or ${c.value > cc.average ? 'falling below' : 'rising above'} ${pct(cc.average)}, its ${cc.label}.`);
  }
  watch.push(
    estimate
      ? `Treasury's next quarterly refunding estimates, which will update the ${billions(b.value)} figure for ${quarter(b.date)}.`
      : `Treasury's next quarterly refunding estimates, set against the ${billions(b.value)} it borrowed in ${quarter(b.date)}.`,
  );

  const asOfDate = [a.date, c.date].sort().pop() as string;
  return {
    asOf: `Numbers as of ${dayLabel(asOfDate)}.`,
    borrow,
    auctions,
    costs,
    strain: `${first} ${second}`,
    watch,
    strained,
  };
}
