// Model fact box + lab comparison tables.
// Facts come from src/data/model-facts.json (copied from each model page)
// and public/ai-benchmarks.json (the #aiBench feed). The feed wins for the
// AA score when it has a row for the page. Missing fields stay missing.
import fs from 'node:fs';
import path from 'node:path';
import factsJson from '../data/model-facts.json';
import { normalizePath } from './site';

export interface ModelFacts {
  href: string;
  name: string;
  status: 'current' | 'archived' | 'replaced' | 'older' | 'preview' | 'limited' | 'feature' | 'product';
  statusNote?: string;
  replacedBy?: { name: string; href: string };
  recommended?: { by: string; name: string; href: string };
  aa?: { value: number; effort?: string; label?: string; fetched?: string; fromFeed?: boolean };
  price?: string;
  released?: string;
  checked?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isoToLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

function feedAa(): Map<string, NonNullable<ModelFacts['aa']>> {
  const out = new Map<string, NonNullable<ModelFacts['aa']>>();
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'ai-benchmarks.json'), 'utf8');
    const data = JSON.parse(raw);
    for (const row of data.labs ?? []) {
      const aa = row?.benches?.aaIndex;
      if (!row?.doorHref || !aa || typeof aa.value !== 'number') continue;
      out.set(normalizePath(row.doorHref), {
        value: aa.value,
        effort: typeof aa.effort === 'string' ? aa.effort : undefined,
        fetched: typeof aa.fetched === 'string' ? isoToLabel(aa.fetched) : undefined,
        fromFeed: true,
      });
    }
  } catch {
    // No feed: fall back to page-copied values only.
  }
  return out;
}

const FEED = feedAa();
const RAW = (factsJson as { models: Record<string, Omit<ModelFacts, 'href'>> }).models;

export function factsFor(pathname: string): ModelFacts | undefined {
  const href = normalizePath(pathname);
  const row = RAW[href];
  if (!row) return undefined;
  const aa = FEED.get(href) ?? row.aa;
  return { ...row, href, aa };
}

export function factsUnder(prefix: string): ModelFacts[] {
  const p = normalizePath(prefix);
  return Object.keys(RAW)
    .filter((href) => href.startsWith(p))
    .map((href) => factsFor(href)!)
    .filter(Boolean);
}

export const STATUS_LABEL: Record<ModelFacts['status'], string> = {
  current: 'Current',
  archived: 'Archived',
  replaced: 'Replaced',
  older: 'Older model',
  preview: 'Preview',
  limited: 'Limited access',
  feature: 'Feature',
  product: 'Product',
};

export function statusText(f: ModelFacts): string {
  const base =
    f.status === 'archived' && f.replacedBy
      ? `Archived, succeeded by ${f.replacedBy.name}`
      : f.status === 'older' && f.recommended
        ? `Older model, ${f.recommended.by} now recommends ${f.recommended.name}`
        : f.status === 'replaced' && f.replacedBy
        ? `Replaced by ${f.replacedBy.name}`
        : STATUS_LABEL[f.status];
  return f.statusNote ? `${base}, ${f.statusNote}` : base;
}

export function aaText(f: ModelFacts): string | undefined {
  if (!f.aa) return undefined;
  const bits = [f.aa.label, f.aa.effort ? `${f.aa.effort} effort` : undefined].filter(Boolean).join(', ');
  return `${f.aa.value}${bits ? ` (${bits})` : ''}`;
}

/** Archived pages stay live but leave lab tables. Listed on /ai/models/archive/. */
export const ARCHIVE_HREF = '/ai/models/archive/';

export function isArchived(f?: ModelFacts): boolean {
  return f?.status === 'archived' || f?.status === 'replaced' || f?.status === 'older';
}

export function archivedAll(): ModelFacts[] {
  return Object.keys(RAW)
    .map((href) => factsFor(href)!)
    .filter((f) => f && isArchived(f));
}
