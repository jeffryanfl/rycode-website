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

function benchAddedDate(note: string, model: string): string | null {
  const needle = `${model} (added `;
  const idx = note.indexOf(needle);
  if (idx < 0) return null;
  const m = note.slice(idx + needle.length).match(/^(\d{1,2} \w+ \d{4})/);
  return m?.[1] ?? null;
}

/**
 * "Latest additions" line for #aiBench: the last two living-table rows whose
 * full model name carries an "(added …)" clause in the feed note.
 */
export function benchLatestAdditionsLine(): string {
  const note = String((feed as { note?: string }).note ?? '');
  const latest = data.labs.filter((lab) => benchAddedDate(note, lab.model));
  const pair = latest.slice(-2);
  if (pair.length < 2) return `Board as of ${benchAsOf()}.`;
  const list = pair
    .map((lab) => {
      const added = benchAddedDate(note, lab.model);
      return `${lab.model} (added ${added})`;
    })
    .join('; ');
  return `Latest additions: ${list}. Board as of ${benchAsOf()}.`;
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
 * OpenAI's blossom stays black. Astra, Sol, and Terra differ by a step of gray.
 * Grok is the black-and-white xAI mark. Gemini uses Google's four colors: Argon blue, Carbon yellow.
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
  'GPT-6.1 Terra': { color: '#71717A', mark: 'openai', disc: '#A1A1AA', glyph: '#141413' },
  'Grok 4.7': { color: '#F8FAFC', mark: 'xai', disc: '#141413', glyph: '#ffffff', ring: '#F8FAFC' },
  'Gemini 4 Argon': { color: '#4285F4', mark: 'gemini', disc: '#141413', glyph: 'url(#bc-gemini)', ring: '#F8FAFC' },
  'Gemini 4 Carbon': { color: '#FBBC04', mark: 'gemini', disc: '#141413', glyph: 'url(#bc-gemini)', ring: '#FBBC04' },
};

function shortModel(model: string): string {
  if (model.includes('Opus 5.5')) return 'Opus 5.5';
  if (model.includes('Sonnet 5.5')) return 'Sonnet 5.5';
  if (model.includes('Haiku 5.5')) return 'Haiku 5.5';
  if (model.includes('Fable')) return 'Fable 5.1';
  if (model.includes('Astra')) return 'Astra';
  if (model.includes('Terra')) return 'Terra';
  if (model.includes('6.1')) return 'GPT-6.1 Sol';
  if (model.includes('Grok')) return 'Grok 4.7';
  if (model.includes('Argon')) return 'Argon';
  if (model.includes('Carbon')) return 'Carbon';
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

/**
 * Every feed cell as a labeled grid row, for the "Every score, labeled" table.
 * Each filled cell names its test version (when the feed has one) and who
 * produced the number: the lab itself, Artificial Analysis, or an outside verifier.
 * A null cell reads "not reported". Nothing is computed or filled in.
 */
type FullCell = {
  value?: string | number | null;
  version?: string;
  setup?: string;
  effort?: string;
  sourceKind?: string;
  verifier?: string;
  source?: string;
  altSetup?: BenchAlt;
} | null;

type BenchAlt = { value: string; setup: string; effort?: string; source?: string; labClaim?: { text: string; source?: string } };

export interface BenchTableCell {
  value: string;
  version?: string;
  setup?: string;
  by: string;
  source?: string;
  effort?: string;
  alt?: BenchAlt;
  /** Warning text when this cell's test version cannot be compared with others in its column. */
  odd?: string;
}

const BY: Record<string, string> = { lab: 'Lab claim', aa: 'AA measured' };
const ODD_MINORITY = 'Different version from the others, do not compare directly';
const ODD_MIXED = 'Versions differ in this column, do not compare directly';

export function benchTable(): {
  columns: { id: string; label: string; href?: string }[];
  rows: { model: string; href?: string; cells: (BenchTableCell | null)[] }[];
} {
  const columns = data.columns.map((c) => ({ id: c.id, label: c.label, href: c.href }));
  /* Most common version per column, so a cell on another version gets flagged.
     A column with 2+ versions and no majority flags every versioned cell (mixed). */
  const usual = new Map<string, string>();
  const mixed = new Set<string>();
  for (const col of columns) {
    if (col.id === 'aaIndex') continue;
    const counts = new Map<string, number>();
    for (const lab of data.labs) {
      const v = (lab.benches?.[col.id] as FullCell)?.version;
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (top.length > 1 && top[0][1] > top[1][1]) usual.set(col.id, top[0][0]);
    else if (top.length > 1) mixed.add(col.id);
  }
  const rows = data.labs.map((lab) => ({
    model: lab.model,
    href: lab.doorHref,
    cells: columns.map((col) => {
      const cell = lab.benches?.[col.id] as FullCell;
      if (!cell || cell.value === undefined || cell.value === null) return null;
      const kind = col.id === 'aaIndex' ? 'aa' : cell.sourceKind ?? 'lab';
      return {
        value: String(cell.value),
        version: col.id === 'aaIndex' ? (cell.effort ? `${cell.effort} effort` : undefined) : cell.version,
        setup: cell.setup,
        by: kind === 'verifier' ? `${cell.verifier ?? 'Independently'} verified` : BY[kind] ?? 'Lab claim',
        source: cell.source,
        alt: cell.altSetup,
        effort: col.id === 'aaIndex' ? undefined : cell.effort,
        odd: !cell.version
          ? undefined
          : mixed.has(col.id)
            ? ODD_MIXED
            : usual.get(col.id) && cell.version !== usual.get(col.id)
              ? ODD_MINORITY
              : undefined,
      };
    }),
  }));
  return { columns, rows };
}

/**
 * One leaderboard for #aiBench: one row per model, one column per test.
 * AA Intelligence Index first. Each column header carries the usual test
 * version; a cell on another version gets a numbered footnote. Shading uses
 * clean single numbers only, and only cells on the column's usual version.
 * Every value and label comes from the feed. Nothing is computed into a score.
 */
export interface BoardCell {
  value: string;
  num: number | null;
  shade: number | null;
  tag: string;
  source?: string;
  effort?: string;
  notes: number[];
}
export interface BoardColumn { id: string; label: string; base: string; href?: string; def: string; notes: number[] }
export interface BoardRow { model: string; href?: string; cells: (BoardCell | null)[] }

const DEFS: Record<string, string> = {
  aaIndex: 'Artificial Analysis Intelligence Index: one overall score from a fixed set of tests that Artificial Analysis runs itself.',
  cursorBench: 'CursorBench: coding tasks from real use of the Cursor editor.',
  deepSwe: 'DeepSWE: long coding tasks in real software projects, written from scratch for the test.',
  terminalBench: 'Terminal-Bench: completing tasks in a command-line terminal.',
  osworld: 'OSWorld: using a desktop computer through its screen, mouse and keyboard.',
  automationBench: 'AutomationBench: Zapier\'s test of multi-step business automation tasks.',
  hle: 'Humanity\'s Last Exam: very hard expert-level questions across many subjects.',
  arcAgi: 'ARC-AGI-3: the ARC Prize test of learning and beating new games without instructions.',
};
const HEAD_VERSION: Record<string, string> = {
  aaIndex: 'v5.0',
  cursorBench: '4.0',
  deepSwe: 'v1.1',
  terminalBench: '4.0',
  osworld: '2.0',
  hle: 'with tools',
};

export interface BoardNote { text: string; link?: { text: string; source?: string } }

export function benchBoard(): { columns: BoardColumn[]; rows: BoardRow[]; notes: BoardNote[]; verifiers: string[] } {
  const notes: BoardNote[] = [];
  const add = (text: string, link?: BoardNote['link']) => {
    const i = notes.findIndex((n) => n.text === text);
    if (i >= 0) return i + 1;
    notes.push({ text, link });
    return notes.length;
  };
  const osVersions = data.labs
    .filter((l) => (l.benches?.osworld as FullCell)?.value != null)
    .map((l) => `${l.model} on ${(l.benches.osworld as FullCell)!.version}`);
  const osNote = `These OSWorld scores use different 2.0 versions, do not compare directly: ${osVersions.join(', ')}.`;
  const order = ['aaIndex', ...data.columns.map((c) => c.id).filter((id) => id !== 'aaIndex')];
  const columns: BoardColumn[] = order.map((id) => {
    const col = data.columns.find((c) => c.id === id)!;
    const v = HEAD_VERSION[id];
    const label = id === 'arcAgi' ? 'ARC-AGI-3 Standard' : v && !/^v?\d/.test(v) ? `${col.label} (${v})` : v ? `${col.label} ${v}` : col.label;
    return { id, label, base: col.label, href: col.href, def: DEFS[id] ?? '', notes: [] };
  });
  const rows: BoardRow[] = data.labs.map((lab) => ({
    model: lab.model,
    href: lab.doorHref,
    cells: columns.map((col) => {
      const c = lab.benches?.[col.id] as FullCell;
      if (!c || c.value === undefined || c.value === null) return null;
      const kind = col.id === 'aaIndex' ? 'aa' : c.sourceKind ?? 'lab';
      const value = String(c.value).trim();
      const m = value.match(CLEAN);
      const cellNotes: number[] = [];
      const head = HEAD_VERSION[col.id];
      let comparable = true;
      if (col.id === 'osworld') {
        if (c.version !== '2.0 latency sim') comparable = false;
        cellNotes.push(add(osNote));
      } else if (col.id === 'cursorBench' && c.version && c.version !== head) {
        comparable = false;
        cellNotes.push(add(`${lab.model} is scored on CursorBench ${c.version}, a different version from the others, do not compare directly.`));
      }
      if (col.id === 'arcAgi') {
        cellNotes.push(add(`ARC-AGI-3 Standard harness: a harness is the setup a model runs inside during a test. The Standard harness lets the model carry forward only the notes it chooses to keep. ${lab.model} ran at ${c.effort} effort.`));
        if (c.altSetup) {
          const a = c.altSetup;
          cellNotes.push(add(`Special setup for ${lab.model}: ${a.value} with the ${a.setup}${a.effort ? ` (${a.effort} effort)` : ''}, which keeps the model's hidden reasoning between steps.`, a.labClaim));
        }
      }
      return {
        value,
        num: m ? Number(m[1]) : null,
        shade: null,
        tag: kind === 'aa' ? 'AA' : kind === 'verifier' ? (c.verifier ?? 'Independently verified') : 'Lab',
        source: c.source,
        effort: col.id === 'aaIndex' ? c.effort : undefined,
        notes: cellNotes,
        _cmp: comparable,
      } as BoardCell & { _cmp: boolean };
    }),
  }));
  columns.forEach((_, ci) => {
    const cells = rows.map((r) => r.cells[ci] as (BoardCell & { _cmp: boolean }) | null).filter((c) => c && c.num !== null && c._cmp) as (BoardCell & { _cmp: boolean })[];
    if (cells.length < 2) return;
    const lo = Math.min(...cells.map((c) => c.num!));
    const hi = Math.max(...cells.map((c) => c.num!));
    for (const c of cells) c.shade = hi === lo ? 0.5 : (c.num! - lo) / (hi - lo);
  });
  const verifiers = [...new Set(data.labs.flatMap((l) => Object.values(l.benches ?? {}).map((c) => (c as FullCell)?.sourceKind === 'verifier' ? (c as FullCell)?.verifier : undefined)).filter((v): v is string => Boolean(v)))];
  return { columns, rows, notes, verifiers };
}
