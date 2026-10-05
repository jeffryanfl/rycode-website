/**
 * Chart rows for the /ai bench charts.
 * Reads the same feed as the living bench table (public/ai-benchmarks.json),
 * so a feed update moves the charts too. Only clean single numbers are charted:
 * cells like "81.8% partial" stay in the living table only. No invented scores.
 */
import feed from '../../public/ai-benchmarks.json';
import type { LabMarkId } from './lab-marks';

type Cell = { value?: string | number | null; version?: string; effort?: string } | null;
type Lab = { lab: string; model: string; doorHref?: string; benches: Record<string, Cell> };
type Column = { id: string; label: string; href?: string };
type Feed = { asOf: string; columns: Column[]; labs: Lab[] };

const data = feed as unknown as Feed;
const CLEAN = /^(\d+(?:\.\d+)?)%?$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface BenchPoint {
  model: string;
  lab: string;
  href?: string;
  value: number;
  display: string;
  note?: string;
}

/** One point per model for a feed column, highest first. Optional exact version match. */
export function benchPoints(columnId: string, opts: { version?: string } = {}): BenchPoint[] {
  const out: BenchPoint[] = [];
  for (const lab of data.labs) {
    const cell = lab.benches?.[columnId];
    if (!cell || cell.value === undefined || cell.value === null) continue;
    if (opts.version && String(cell.version ?? '') !== opts.version) continue;
    const display = String(cell.value).trim();
    const match = display.match(CLEAN);
    if (!match) continue;
    out.push({
      model: lab.model,
      lab: lab.lab,
      href: lab.doorHref,
      value: Number(match[1]),
      display,
      note: cell.effort,
    });
  }
  return out.sort((a, b) => b.value - a.value);
}

/** Feed date as "1 Oct 2026". */
export function benchAsOf(): string {
  const [y, m, d] = data.asOf.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * One colored line per model across the living-table benches.
 * AA Index and Terminal-Bench stay on the bar charts.
 * A cell is skipped when it is blank, not a single number, or a different
 * version from the one shared by that bench. No invented scores.
 */
const TABLE_SKIP = new Set(['aaIndex', 'terminalBench']);
/**
 * Visible axis name when the feed label is shorter than the exam this chart links to.
 * ARC-AGI on the feed is the ARC-AGI-3 page.
 */
const AXIS_NAME: Record<string, string> = {
  arcAgi: 'ARC-AGI-3',
};
/**
 * One look per model. Claude colors are Anthropic's published accents
 * (orange on the mark, then blue and green) so three Claude lines stay apart.
 * OpenAI's blossom stays black. Astra and Sol differ by a step of gray.
 * Grok is the black-and-white xAI mark. Gemini uses Google's four colors.
 */
const MODEL_STYLE: Record<
  string,
  { color: string; mark: LabMarkId; disc: string; glyph: string; ring?: string }
> = {
  'Claude Opus 5.5': { color: '#D97757', mark: 'claude', disc: '#D97757', glyph: '#ffffff' },
  'Claude Sonnet 5.5': { color: '#6A9BCC', mark: 'claude', disc: '#6A9BCC', glyph: '#ffffff' },
  'Claude Fable 5.1': { color: '#788C5D', mark: 'claude', disc: '#788C5D', glyph: '#ffffff' },
  'GPT-6 Astra': { color: '#F4F4F5', mark: 'openai', disc: '#F4F4F5', glyph: '#141413' },
  'GPT-6.1 Sol': { color: '#B4B4BC', mark: 'openai', disc: '#D4D4D8', glyph: '#141413' },
  'Grok 4.7': { color: '#F8FAFC', mark: 'xai', disc: '#141413', glyph: '#ffffff', ring: '#F8FAFC' },
  'Gemini 4 Argon': { color: '#4285F4', mark: 'gemini', disc: '#141413', glyph: 'url(#bc-gemini)', ring: '#F8FAFC' },
};

function shortModel(model: string): string {
  if (model.includes('Opus 5.5')) return 'Opus 5.5';
  if (model.includes('Sonnet 5.5')) return 'Sonnet 5.5';
  if (model.includes('Fable')) return 'Fable 5.1';
  if (model.includes('Astra')) return 'Astra';
  if (model.includes('6.1')) return 'GPT-6.1 Sol';
  if (model.includes('Grok')) return 'Grok 4.7';
  if (model.includes('Argon')) return 'Argon';
  return model;
}

function cleanNumber(cell: Cell): { value: number; version: string } | null {
  if (!cell || cell.value === undefined || cell.value === null) return null;
  const match = String(cell.value).trim().match(CLEAN);
  if (!match) return null;
  return { value: Number(match[1]), version: String(cell.version ?? '').trim() };
}

export interface BenchLineSeries {
  name: string;
  color?: string;
  mark?: LabMarkId;
  disc?: string;
  glyph?: string;
  ring?: string;
  values: (number | null)[];
}

export interface BenchAxisLabel {
  label: string;
  name: string;
  href?: string;
}

export function benchLines(): { categories: BenchAxisLabel[]; series: BenchLineSeries[]; sub: string } {
  const columns = data.columns.filter((col) => !TABLE_SKIP.has(col.id));
  const kept: { label: string; name: string; href?: string; version: string; values: (number | null)[] }[] = [];
  const dropped: string[] = [];

  for (const col of columns) {
    const label = AXIS_NAME[col.id] ?? col.label;
    const cells = data.labs.map((lab) => cleanNumber(lab.benches?.[col.id]));
    const counts = new Map<string, number>();
    for (const cell of cells) {
      if (cell?.version) counts.set(cell.version, (counts.get(cell.version) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const blanks = cells.filter((cell) => cell && !cell.version).length;
    let allow = '';
    if (ranked.length === 0) {
      allow = '';
    } else if (ranked.length === 1) {
      allow = ranked[0][1] >= blanks ? ranked[0][0] : '';
    } else if (ranked[0][1] >= 2 && ranked[0][1] > ranked[1][1]) {
      allow = ranked[0][0];
    } else {
      dropped.push(label);
      continue;
    }
    const values = cells.map((cell) => {
      if (!cell) return null;
      if (allow === '') return cell.version ? null : cell.value;
      return cell.version === allow ? cell.value : null;
    });
    if (!values.some((value) => typeof value === 'number')) continue;
    kept.push({ label, name: label, href: col.href, version: allow, values });
  }

  const series = data.labs
    .map((lab, index) => {
      const style = MODEL_STYLE[lab.model];
      return {
        name: shortModel(lab.model),
        color: style?.color,
        mark: style?.mark,
        disc: style?.disc,
        glyph: style?.glyph,
        ring: style?.ring,
        values: kept.map((col) => col.values[index]),
      };
    })
    .filter((series) => series.values.some((value) => typeof value === 'number'));

  /* Skip a version note when the axis already spells that version, so ARC-AGI-3 is not repeated. */
  const notes = kept
    .filter((col) => col.version && !col.label.toLowerCase().includes(col.version.toLowerCase()))
    .map((col) => `${col.label} is ${col.version}`);
  const held = dropped.length ? `${dropped.join(', ')} stays in the table` : '';
  const sub = ['One line per model', ...notes, held].filter(Boolean).join(' · ');
  return {
    categories: kept.map((col) => ({ label: col.label, name: col.name, href: col.href })),
    series,
    sub,
  };
}
