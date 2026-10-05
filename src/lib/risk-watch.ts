/**
 * Resolve /risk watch-list rows against their feeds at build time.
 * src/data/risk-watch.json names the feed, series, and key; this file reads
 * the feeds (read-only) and returns the latest reading, the trend, the high and
 * low over the trend and over the last 52 weeks, and the distance to the risk
 * line when the row has one. No number lives in the rows file except riskLine,
 * which is a level the linked page already names.
 */
import fs from 'node:fs';
import path from 'node:path';
import watchFile from '../data/risk-watch.json';

type Format = 'percent' | 'percent3' | 'dollars' | 'trillions' | 'billions' | 'millions' | 'index' | 'ratio';
type Point = { date: string; [key: string]: unknown };
type FeedRef = { feed: string; series?: string; key: string };

interface RiskLine {
  value: number;
  label: string;
  source: string;
  quote: string;
}

interface RowSpec {
  id: string;
  risk: string;
  brief?: string;
  tracker: string;
  trackerHref: string;
  reading: FeedRef & { format: Format };
  history?: FeedRef | null;
  trend?: { points: number };
  riskLine?: RiskLine | null;
  why: string;
}

export interface Extreme {
  value: string;
  date: string;
  dateLabel: string;
}

export interface WatchRow {
  id: string;
  risk: string;
  brief?: string;
  tracker: string;
  trackerHref: string;
  why: string;
  value: string;
  date: string;
  dateLabel: string;
  trend: number[];
  trendFrom: string;
  periodHigh: Extreme;
  periodLow: Extreme;
  yearHigh: Extreme;
  yearLow: Extreme;
  riskLine: (RiskLine & { distance: string; low: string; pct: number }) | null;
  usesBasisPoints: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86_400_000;
const feedCache = new Map<string, unknown>();

function readFeed(file: string): any {
  if (!feedCache.has(file)) {
    feedCache.set(file, JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')));
  }
  return feedCache.get(file);
}

/** Dated points with a number at ref.key, oldest first. */
function pointsFor(ref: FeedRef): Point[] {
  const feed = readFeed(ref.feed);
  const list = Array.isArray(feed?.series) ? feed.series : [];
  let points: Point[] = list;
  if (ref.series) {
    const found = list.find((s: { id?: string }) => s?.id === ref.series);
    if (!found) throw new Error(`RISK WATCH: no series "${ref.series}" in ${ref.feed}`);
    points = Array.isArray(found.points) ? found.points : [];
  }
  return points
    .filter((p) => typeof p?.date === 'string' && typeof p[ref.key] === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));
}

function format(value: number, kind: Format): string {
  if (kind === 'percent') return `${value.toFixed(2)}%`;
  if (kind === 'percent3') return `${value.toFixed(3)}%`;
  if (kind === 'ratio') return value.toFixed(2);
  if (kind === 'billions') return `${value < 0 ? '-' : ''}$${Math.round(Math.abs(value)).toLocaleString('en-US')}B`;
  if (kind === 'trillions') return `$${(value / 1e12).toFixed(2)}T`;
  if (kind === 'millions') return `$${Math.round(value).toLocaleString('en-US')}M`;
  if (kind === 'index') return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$${value.toFixed(2)}`;
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Calendar quarter from its first day: 2026-10-01 is "Oct to Dec 2026". */
function quarterLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} to ${MONTHS[m + 1]} ${y}`;
}

/** Half-up rounding that ignores binary float noise (2.4949999 counts as 2.495). */
function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round((value + Math.sign(value) * 1e-9) * f) / f;
}

const DIGITS: Record<Format, number> = {
  percent: 2,
  percent3: 3,
  dollars: 2,
  trillions: 2,
  billions: 0,
  millions: 0,
  index: 2,
  ratio: 2,
};

export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Highest and lowest point. Ties go to the most recent date. */
function extremes(points: Point[], key: string, kind: Format): { high: Extreme; low: Extreme } {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if ((p[key] as number) >= (hi[key] as number)) hi = p;
    if ((p[key] as number) <= (lo[key] as number)) lo = p;
  }
  const pack = (p: Point): Extreme => ({ value: format(p[key] as number, kind), date: p.date, dateLabel: dateLabel(p.date) });
  return { high: pack(hi), low: pack(lo) };
}

function distanceText(value: number, line: RiskLine, kind: Format): string {
  const gap = line.value - value;
  const side = gap >= 0 ? 'below' : 'above';
  if (kind === 'percent') {
    const bp = Math.round(Math.abs(gap) * 100);
    if (bp === 0) return `At ${line.label}`;
    return `${bp} basis ${bp === 1 ? 'point' : 'points'} ${side} ${line.label}`;
  }
  const abs = Math.abs(gap);
  if (abs < 0.005) return `At ${line.label}`;
  return `${format(abs, kind)} ${side} ${line.label}`;
}

export function riskWatchRows(): WatchRow[] {
  const rows = (watchFile as unknown as { rows: (RowSpec & { kind?: string })[] }).rows.filter((r) => !r.kind);
  return rows.map((row) => {
    const { reading, history, trend: trendSpec, riskLine, ...rest } = row;
    const key = reading.key;
    const points = pointsFor(reading);
    const last = points[points.length - 1];
    if (!last) throw new Error(`RISK WATCH: no "${key}" points in ${reading.feed}`);
    const latest = last[key] as number;

    const n = Math.max(trendSpec?.points ?? 2, 2);
    const shown = points.slice(-n);
    const period = extremes(shown, key, reading.format);

    /* 52 weeks back from the reading date. Longer feed first, then any newer reading-feed points. */
    const start = new Date(new Date(`${last.date}T00:00:00Z`).getTime() - 364 * DAY).toISOString().slice(0, 10);
    let year: Point[];
    if (history) {
      const longer = pointsFor(history).map((p) => ({ date: p.date, [key]: p[history.key] }) as Point);
      const longerEnd = longer.length ? longer[longer.length - 1].date : '';
      year = [...longer, ...points.filter((p) => p.date > longerEnd)];
    } else {
      year = points;
    }
    year = year.filter((p) => p.date >= start && p.date <= last.date);
    const yr = extremes(year, key, reading.format);

    let line: WatchRow['riskLine'] = null;
    if (riskLine && typeof riskLine.value === 'number') {
      const lowValue = Math.min(...year.map((p) => p[key] as number));
      const span = riskLine.value - lowValue;
      const pct = span > 0 ? Math.min(Math.max(((latest - lowValue) / span) * 100, 0), 100) : 100;
      line = {
        ...riskLine,
        distance: distanceText(latest, riskLine, reading.format),
        low: format(lowValue, reading.format),
        pct,
      };
    }

    return {
      ...rest,
      value: format(latest, reading.format),
      date: last.date,
      dateLabel: dateLabel(last.date),
      trend: shown.map((p) => p[key] as number),
      trendFrom: shown[0].date,
      periodHigh: period.high,
      periodLow: period.low,
      yearHigh: yr.high,
      yearLow: yr.low,
      riskLine: line,
      usesBasisPoints: Boolean(line && reading.format === 'percent'),
    };
  });
}

/* ---------- Chain rows: steps side by side, each on its own feed ---------- */

interface PeakLine {
  fromPeak: number;
  label: string;
}

interface StepSpec {
  id: string;
  step: string;
  title: string;
  tracker: string;
  trackerHref: string;
  reading: FeedRef & { format: Format; frequency?: 'monthly' | 'daily' | 'quarterly' };
  history?: FeedRef | null;
  trend: { points?: number; weeks?: number; all?: boolean; unit?: string };
  riskLines?: PeakLine[];
  /* Average line. prior: the n readings before the latest. trailing: the n readings ending with the latest. */
  compare?: { type: 'prior' | 'trailing'; n: number; label: string; short: string; flagBelow?: string };
  extra?: {
    label: string;
    href?: string;
    pick?: 'latest' | 'previous';
    where?: { key: string; equals: string };
    reading: FeedRef & { format: Format; frequency?: 'monthly' | 'daily' | 'quarterly' };
  };
  list?: boolean;
  why: string;
}

interface ChainSpec {
  id: string;
  kind: 'chain';
  risk: string;
  brief?: string;
  why: string;
  key?: string;
  steps: StepSpec[];
}

export interface ChainStep {
  id: string;
  step: string;
  title: string;
  tracker: string;
  trackerHref: string;
  why: string;
  value: string;
  date: string;
  dateLabel: string;
  status?: string;
  windowLabel: string;
  trend: number[];
  high: Extreme;
  low: Extreme;
  lines: { value: number; label: string; short: string }[];
  peak: { value: string; dateLabel: string; below: string; distance: string; pct: number; markPct: number[] } | null;
  extra: { label: string; href?: string; value: string; dateLabel: string; status?: string } | null;
  compare: { text: string; average: string; label: string; flag: string | null } | null;
  list: { date: string; label: string; value: string; status?: string }[] | null;
  /** One short phrase for the collapsed chain summary, e.g. "Chips 4.3 pts from correction". */
  headline: string;
}

export interface ChainRow {
  id: string;
  risk: string;
  brief?: string;
  why: string;
  key?: string;
  steps: ChainStep[];
}

/** Reading-feed points, with a longer history feed in front when one is named. */
function mergedPoints(reading: FeedRef, history?: FeedRef | null): Point[] {
  const points = pointsFor(reading);
  if (!history) return points;
  const longer = pointsFor(history).map((p) => ({ date: p.date, [reading.key]: p[history.key] }) as Point);
  const longerEnd = longer.length ? longer[longer.length - 1].date : '';
  return [...longer, ...points.filter((p) => p.date > longerEnd)];
}

function peakDistance(below: number, lines: PeakLine[]): string {
  const sorted = [...lines].sort((a, b) => a.fromPeak - b.fromPeak);
  for (const line of sorted) {
    const level = line.fromPeak * 100;
    if (below < level) {
      const gap = level - below;
      const prefix = sorted.indexOf(line) > 0 ? `In a ${sorted[sorted.indexOf(line) - 1].label}. ` : '';
      return `${prefix}${gap.toFixed(1)} points from a ${line.label}`;
    }
  }
  return `In a ${sorted[sorted.length - 1].label}`;
}

/** Shorter value for a summary line: millions of dollars read as billions once past $1,000M. */
function shortValue(value: number, kind: Format): string {
  if (kind === 'millions' && Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(2)}B`;
  return format(value, kind);
}

function peakShort(below: number, lines: PeakLine[]): string {
  const sorted = [...lines].sort((a, b) => a.fromPeak - b.fromPeak);
  for (let i = 0; i < sorted.length; i++) {
    const level = sorted[i].fromPeak * 100;
    if (below < level) {
      const prefix = i > 0 ? `in ${sorted[i - 1].label}, ` : '';
      return `${prefix}${(level - below).toFixed(1)} pts from ${sorted[i].label}`;
    }
  }
  return `in ${sorted[sorted.length - 1].label}`;
}

/** The latest reading and the trend window for one chain step. The row and the brief both use this. */
function stepWindow(step: StepSpec) {
  const { reading } = step;
  const monthly = reading.frequency === 'monthly';
  const all = mergedPoints(reading, step.history);
  const readingPoints = pointsFor(reading);
  const last = readingPoints[readingPoints.length - 1];
  if (!last) throw new Error(`RISK WATCH: no "${reading.key}" points in ${reading.feed}`);
  const upTo = all.filter((p) => p.date <= last.date);

  let windowPoints: Point[];
  let windowLabel: string;
  if (step.trend.weeks) {
    const start = new Date(new Date(`${last.date}T00:00:00Z`).getTime() - step.trend.weeks * 7 * DAY + DAY)
      .toISOString()
      .slice(0, 10);
    windowPoints = upTo.filter((p) => p.date >= start);
    windowLabel = `${step.trend.weeks} weeks`;
  } else {
    windowPoints = step.trend.all ? upTo : upTo.slice(-(step.trend.points ?? 24));
    windowLabel = step.trend.unit
      ? `${windowPoints.length} ${step.trend.unit}`
      : monthly
        ? `${windowPoints.length} months`
        : `${windowPoints.length} readings`;
  }
  return { last, upTo, windowPoints, windowLabel };
}

export interface StepWindow {
  id: string;
  key: string;
  last: Point;
  windowPoints: Point[];
  riskLines: PeakLine[];
  extra: Point | null;
  extraKey: string | null;
}

/** Raw readings and windows for each step of one chain, keyed by step id. Pages that write about a chain use this so their numbers match the row. */
export function chainStepWindows(chainId: string): Record<string, StepWindow> {
  const row = (watchFile as unknown as { rows: (ChainSpec | RowSpec)[] }).rows.find(
    (r): r is ChainSpec => (r as ChainSpec).kind === 'chain' && r.id === chainId,
  );
  if (!row) throw new Error(`RISK WATCH: no chain "${chainId}"`);
  const out: Record<string, StepWindow> = {};
  for (const step of row.steps) {
    const { last, windowPoints } = stepWindow(step);
    let extra: Point | null = null;
    if (step.extra) {
      const ep = pointsFor(step.extra.reading);
      extra = ep[ep.length - 1] ?? null;
    }
    out[step.id] = {
      id: step.id,
      key: step.reading.key,
      last,
      windowPoints,
      riskLines: step.riskLines ?? [],
      extra,
      extraKey: step.extra?.reading.key ?? null,
    };
  }
  return out;
}

export function riskWatchChains(): ChainRow[] {
  const rows = (watchFile as unknown as { rows: (ChainSpec | RowSpec)[] }).rows.filter(
    (r): r is ChainSpec => (r as ChainSpec).kind === 'chain',
  );
  return rows.map((row) => ({
    id: row.id,
    risk: row.risk,
    brief: row.brief,
    why: row.why,
    key: row.key,
    steps: row.steps.map((step) => {
      const { reading } = step;
      const key = reading.key;
      const monthly = reading.frequency === 'monthly';
      const label = monthly ? monthLabel : reading.frequency === 'quarterly' ? quarterLabel : dateLabel;
      const { last, upTo, windowPoints, windowLabel } = stepWindow(step);
      const ext = extremes(windowPoints, key, reading.format);
      const relabel = (e: Extreme): Extreme => ({ ...e, dateLabel: label(e.date) });
      const latest = last[key] as number;

      let lines: ChainStep['lines'] = [];
      let peak: ChainStep['peak'] = null;
      let belowPeak: number | null = null;
      if (step.riskLines?.length) {
        const peakPoint = windowPoints.reduce((a, b) => ((b[key] as number) >= (a[key] as number) ? b : a));
        const peakValue = peakPoint[key] as number;
        const below = (1 - latest / peakValue) * 100;
        belowPeak = Math.max(below, 0);
        const deepest = Math.max(...step.riskLines.map((l) => l.fromPeak)) * 100;
        lines = step.riskLines.map((l) => ({
          value: peakValue * (1 - l.fromPeak),
          label: l.label,
          short: `\u2212${Math.round(l.fromPeak * 100)}%`,
        }));
        peak = {
          value: format(peakValue, reading.format),
          dateLabel: label(peakPoint.date),
          below: `${Math.max(below, 0).toFixed(1)}% below the peak`,
          distance: peakDistance(below, step.riskLines),
          pct: Math.min(Math.max((below / deepest) * 100, 0), 100),
          markPct: step.riskLines.map((l) => ((l.fromPeak * 100) / deepest) * 100),
        };
      }

      let compare: ChainStep['compare'] = null;
      if (step.compare) {
        const c = step.compare;
        const base = c.type === 'prior' ? upTo.slice(-(c.n + 1), -1) : upTo.slice(-c.n);
        if (base.length === c.n) {
          const digits = DIGITS[reading.format];
          const raw = base.reduce((sum, p) => sum + (p[key] as number), 0) / base.length;
          const average = roundTo(raw, digits);
          const diff = roundTo(latest - average, digits);
          const side = diff > 0 ? 'above' : 'below';
          let gap: string;
          if (reading.format === 'percent') {
            const bp = Math.round(Math.abs(diff) * 100);
            gap = `${bp} basis ${bp === 1 ? 'point' : 'points'}`;
          } else {
            gap = format(Math.abs(diff), reading.format);
          }
          const avgText = format(average, reading.format);
          compare = {
            text: diff === 0 ? `Level with its ${c.label} of ${avgText}` : `${gap} ${side} its ${c.label} of ${avgText}`,
            average: avgText,
            label: c.label,
            flag: c.flagBelow && latest < raw ? c.flagBelow : null,
          };
          lines = [...lines, { value: average, label: c.label, short: `${c.short} ${avgText}` }];
        }
      }

      let extra: ChainStep['extra'] = null;
      if (step.extra) {
        const er = step.extra.reading;
        let ep = pointsFor(er);
        if (step.extra.where) {
          const w = step.extra.where;
          ep = ep.filter((p) => p[w.key] === w.equals);
        }
        const el = step.extra.pick === 'previous' ? ep[ep.length - 2] : ep[ep.length - 1];
        if (el) {
          const elabel = er.frequency === 'monthly' ? monthLabel : er.frequency === 'quarterly' ? quarterLabel : dateLabel;
          extra = {
            label: step.extra.label,
            href: step.extra.href ?? (typeof el.release === 'string' ? el.release : undefined),
            value: format(el[er.key] as number, er.format),
            dateLabel: elabel(el.date),
            status: typeof el.status === 'string' ? el.status : undefined,
          };
        }
      }

      const list: ChainStep['list'] = step.list
        ? windowPoints.map((p) => ({
            date: p.date,
            label: label(p.date),
            value: format(p[key] as number, reading.format),
            status: typeof p.status === 'string' ? p.status : undefined,
          }))
        : null;

      return {
        id: step.id,
        step: step.step,
        title: step.title,
        tracker: step.tracker,
        trackerHref: step.trackerHref,
        why: step.why,
        value: format(latest, reading.format),
        date: last.date,
        dateLabel: label(last.date),
        status: typeof last.status === 'string' ? last.status : undefined,
        windowLabel,
        trend: windowPoints.map((p) => p[key] as number),
        high: relabel(ext.high),
        low: relabel(ext.low),
        lines,
        peak,
        extra,
        compare,
        list,
        headline: `${step.step.replace(/^\d+\s*/, '')} ${
          belowPeak !== null && step.riskLines?.length
            ? peakShort(belowPeak, step.riskLines)
            : shortValue(latest, reading.format)
        }`,
      };
    }),
  }));
}
