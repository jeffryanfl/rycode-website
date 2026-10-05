#!/usr/bin/env node
/**
 * Refresh public/inflation.json, the inflation feed behind the Economics watch
 * list. Node built-ins only (fetch, fs). Run by hand or from the after-close
 * cloud agent:  node scripts/update-inflation.mjs
 *
 * Sources (free, no key)
 *   cpi, coreCpi  BLS public API v1, one request, 10 years, monthly.
 *                 mom from the seasonally adjusted index (CUSR0000SA0, CUSR0000SA0L1E);
 *                 yoy from the not seasonally adjusted index (CUUR0000SA0, CUUR0000SA0L1E),
 *                 the way BLS publishes the 12-month change.
 *   pce, corePce  FRED PCEPI and PCEPILFE (BEA PCE price index, seasonally adjusted), 11 years;
 *                 mom and yoy from the index, the way BEA publishes them.
 * Percent changes are rounded to one decimal, as published.
 *
 * Status per point: see scripts/lib/econ-feeds.mjs. CPI is not revised monthly
 * (final; seasonal factors change each February, which a run records as a
 * revision). BEA revises recent PCE months in each release, so the newest PCE
 * month is preliminary and older months are revised.
 *
 * A source that fails keeps its previous series and the script exits 1.
 * Writes public/inflation.json only. CPI comes out mid-month at 8:30 ET; PCE
 * with Personal Income and Outlays near the end of the month at 8:30 ET.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blsMonthly, blsSeriesPage, fredSeries, fredPage, monthBefore, yearBefore, pct, withStatus, runAll, writeIfChanged } from './lib/econ-feeds.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'inflation.json');

const CPI = {
  cpi: { sa: 'CUSR0000SA0', nsa: 'CUUR0000SA0', title: 'CPI, all items' },
  coreCpi: { sa: 'CUSR0000SA0L1E', nsa: 'CUUR0000SA0L1E', title: 'Core CPI, all items less food and energy' },
};
const PCE = {
  pce: { id: 'PCEPI', title: 'PCE price index' },
  corePce: { id: 'PCEPILFE', title: 'Core PCE price index, excluding food and energy' },
};

let blsCache = null;
const bls = () => (blsCache ??= blsMonthly(Object.values(CPI).flatMap((c) => [c.sa, c.nsa])));
const tenYearsAgo = () => `${new Date().getUTCFullYear() - 11}-01-01`;

async function cpi(id, prevPoints) {
  const spec = CPI[id];
  const all = await bls();
  const sa = all[spec.sa];
  const nsa = new Map(all[spec.nsa].map((p) => [p.date, p.value]));
  const saBy = new Map(sa.map((p) => [p.date, p.value]));
  const points = sa
    .map((p) => {
      const m = saBy.get(monthBefore(p.date));
      const nNow = nsa.get(p.date);
      const nThen = nsa.get(yearBefore(p.date));
      if (m === undefined || nNow === undefined || nThen === undefined) return null;
      return { date: p.date, index: p.value, indexNsa: nNow, mom: pct(p.value, m), yoy: pct(nNow, nThen), preliminary: p.preliminary };
    })
    .filter(Boolean);
  if (points.length < 36) throw new Error(`${id}: only ${points.length} months`);
  return {
    id,
    title: spec.title,
    unit: 'percent',
    frequency: 'monthly',
    source: blsSeriesPage(spec.sa),
    sourceLabel: `BLS CPI-U ${spec.sa} (seasonally adjusted, for mom) and ${spec.nsa} (not seasonally adjusted, for yoy)`,
    points: withStatus(prevPoints, points, { keys: ['index', 'indexNsa'], preliminary: (p) => p.preliminary, seed: 'final' }),
  };
}

async function pce(id, prevPoints) {
  const spec = PCE[id];
  const raw = await fredSeries(spec.id, tenYearsAgo());
  const by = new Map(raw.map((p) => [p.date, p.value]));
  const points = raw
    .map((p) => {
      const m = by.get(monthBefore(p.date));
      const y = by.get(yearBefore(p.date));
      if (m === undefined || y === undefined) return null;
      return { date: p.date, index: p.value, mom: pct(p.value, m), yoy: pct(p.value, y) };
    })
    .filter(Boolean);
  if (points.length < 36) throw new Error(`${id}: only ${points.length} months`);
  return {
    id,
    title: spec.title,
    unit: 'percent',
    frequency: 'monthly',
    source: fredPage(spec.id),
    sourceLabel: `BEA via FRED ${spec.id}, seasonally adjusted`,
    points: withStatus(prevPoints, points, { keys: ['index'], preliminary: (_, i, all) => i === all.length - 1, seed: 'revised' }),
  };
}

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { series: [] };

const { series, failed } = await runAll(
  [
    ['cpi', (p) => cpi('cpi', p)],
    ['coreCpi', (p) => cpi('coreCpi', p)],
    ['pce', (p) => pce('pce', p)],
    ['corePce', (p) => pce('corePce', p)],
  ],
  previous,
);

const feed = {
  schema: 'inflation-v1',
  updated: new Date().toISOString(),
  note: "Inflation feed for the Economics watch list. Refresh with node scripts/update-inflation.mjs (after-close push). mom and yoy are percent changes, one decimal, as published. The Fed's inflation target is 2% on PCE. Each point carries status preliminary, revised, or final; a revision overwrites the value and keeps revisedFrom. Never hand-edit.",
  series,
};
console.log(writeIfChanged(fs, OUT, feed, previous) ? `wrote ${path.relative(ROOT, OUT)}` : `no change, left ${path.relative(ROOT, OUT)} as it was`);
process.exit(failed ? 1 : 0);
