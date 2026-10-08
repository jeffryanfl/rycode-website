/**
 * Chart rows for the /ai bench charts.
 * Reads public/ai-benchmarks.json, so a feed update moves the charts too.
 * Only clean single numbers are charted:
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
  color?: string;
  mark?: LabMarkId;
  glyph?: string;
  ring?: string;
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
    const style = MODEL_STYLE[lab.model];
    out.push({
      model: lab.model,
      lab: lab.lab,
      href: lab.doorHref,
      value: Number(match[1]),
      display,
      note: cell.effort,
      color: style?.color,
      mark: style?.mark,
      glyph: style?.glyph,
      ring: style?.ring,
    });
  }
  return out.sort((a, b) => b.value - a.value);
}

/** Exam page for a feed column, when the column names one. */
export function benchHref(columnId: string): string | undefined {
  return data.columns.find((col) => col.id === columnId)?.href;
}

/** Feed date as "1 Oct 2026". */
export function benchAsOf(): string {
  const [y, m, d] = data.asOf.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * The lines chart is these four version-pinned benches, in this order.
 * A cell is drawn only when its version string matches. A blank, a partial,
 * or a different version leaves a gap. No invented scores.
 */
const LINE_BENCHES: { id: string; version: string; label: string; name?: string }[] = [
  { id: 'cursorBench', version: '4.0', label: 'CursorBench 4.0' },
  { id: 'deepSwe', version: 'v1.1', label: 'DeepSWE v1.1' },
  { id: 'osworld', version: '2.0 latency sim', label: 'OSWorld 2.0', name: 'OSWorld 2.0 latency sim' },
  { id: 'terminalBench', version: '4.0', label: 'Terminal-Bench 4.0' },
];
/**
 * One look per model. Claude colors are Anthropic's published accents
 * (orange on the mark, then blue, green, and mid gray) so the Claude lines stay apart.
 * OpenAI's blossom stays black. Astra and Sol differ by a step of gray.
 * Grok is the black-and-white xAI mark. Gemini uses Google's four colors.
 */
const MODEL_STYLE: Record<
  string,
  { color: string; mark: LabMarkId; disc: string; glyph: string; ring?: string }
> = {
  'Claude Opus 5.5': { color: '#D97757', mark: 'claude', disc: '#D97757', glyph: '#ffffff' },
  'Claude Sonnet 5.5': { color: '#6A9BCC', mark: 'claude', disc: '#6A9BCC', glyph: '#ffffff' },
  'Claude Haiku 5.5': { color: '#B0AEA5', mark: 'claude', disc: '#B0AEA5', glyph: '#141413' },
  'Claude Fable 5.1': { color: '#788C5D', mark: 'claude', disc: '#788C5D', glyph: '#ffffff' },
  'GPT-6 Astra': { color: '#F4F4F5', mark: 'openai', disc: '#F4F4F5', glyph: '#141413' },
  'GPT-6.1 Sol': { color: '#B4B4BC', mark: 'openai', disc: '#D4D4D8', glyph: '#141413' },
  'Grok 4.7': { color: '#F8FAFC', mark: 'xai', disc: '#141413', glyph: '#ffffff', ring: '#F8FAFC' },
  'Gemini 4 Argon': { color: '#4285F4', mark: 'gemini', disc: '#141413', glyph: 'url(#bc-gemini)', ring: '#F8FAFC' },
};

function shortModel(model: string): string {
  if (model.includes('Opus 5.5')) return 'Opus 5.5';
  if (model.includes('Sonnet 5.5')) return 'Sonnet 5.5';
  if (model.includes('Haiku 5.5')) return 'Haiku 5.5';
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
  /* Same models as the AA bar chart, highest score first. Ties keep feed order. */
  const models = benchPoints('aaIndex').map((point) => point.model);
  const byModel = new Map(data.labs.map((lab) => [lab.model, lab]));
  const labs = models.map((model) => byModel.get(model)).filter((lab): lab is Lab => Boolean(lab));

  const kept = LINE_BENCHES.map((spec) => {
    const col = data.columns.find((item) => item.id === spec.id);
    const values = labs.map((lab) => {
      const cell = cleanNumber(lab.benches?.[spec.id]);
      if (!cell || cell.version !== spec.version) return null;
      return cell.value;
    });
    return {
      label: spec.label,
      name: spec.name ?? spec.label,
      href: col?.href,
      values,
    };
  });

  const series = labs.map((lab) => {
    const style = MODEL_STYLE[lab.model];
    const index = labs.indexOf(lab);
    return {
      name: shortModel(lab.model),
      color: style?.color,
      mark: style?.mark,
      disc: style?.disc,
      glyph: style?.glyph,
      ring: style?.ring,
      values: kept.map((col) => col.values[index]),
    };
  });

  return {
    categories: kept.map((col) => ({ label: col.label, name: col.name, href: col.href })),
    series,
    sub: `As of ${benchAsOf()} · one line per model`,
  };
}
