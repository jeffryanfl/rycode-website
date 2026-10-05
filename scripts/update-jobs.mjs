#!/usr/bin/env node
/**
 * Refresh public/jobs.json, the jobs feed behind the Economics watch list and
 * the "Payrolls and the jobs mix" brief. Node built-ins only (fetch, fs). Run by
 * hand or from the after-close cloud agent:  node scripts/update-jobs.mjs
 *
 * Sources (free, no key)
 *   BLS public API v1, one request, 10 years, monthly, seasonally adjusted:
 *     payrolls              CES0000000001  total nonfarm employment, thousands; change = month over month
 *     unemployment          LNS14000000    unemployment rate, percent
 *     earnings              CES0500000003  average hourly earnings, all private employees, dollars; mom and yoy percent
 *     participation         LNS11300000    labor force participation rate, percent
 *     employmentPopulation  LNS12300000    employment-population ratio, percent
 *     foodServices          CES7072200001  food services and drinking places, thousands; change
 *     localGovEducation     CES9093161101  local government education, thousands; change
 *     information           CES5000000001  information industry, thousands; change
 *   FRED ICSA (Department of Labor), initial jobless claims, weekly, seasonally adjusted, 2 years.
 *
 * Status per point: see scripts/lib/econ-feeds.mjs. BLS marks the two newest
 * payroll-survey months "P" (preliminary); older payroll months have been revised
 * by schedule. Household-survey rates are not revised monthly (final). The newest
 * claims week is the advance figure (preliminary); older weeks are revised.
 * A run overwrites any point whose value changed and records revisedFrom.
 *
 * A source that fails keeps its previous series and the script exits 1.
 * Writes public/jobs.json only. The employment report comes out on the first
 * Friday of the month at 8:30 ET; claims every Thursday at 8:30 ET.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blsMonthly, blsSeriesPage, fredSeries, fredPage, monthBefore, yearBefore, pct, withStatus, runAll, writeIfChanged } from './lib/econ-feeds.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'jobs.json');

const BLS = {
  payrolls: 'CES0000000001',
  unemployment: 'LNS14000000',
  earnings: 'CES0500000003',
  participation: 'LNS11300000',
  employmentPopulation: 'LNS12300000',
  foodServices: 'CES7072200001',
  localGovEducation: 'CES9093161101',
  information: 'CES5000000001',
};

let blsCache = null;
const bls = () => (blsCache ??= blsMonthly(Object.values(BLS)));
const ces = (p) => p.preliminary;
const twoYearsAgo = () => new Date(Date.now() - 730 * 86_400_000).toISOString().slice(0, 10);

/* Employment level with its month-over-month change in thousands. The first month has no change and is dropped. */
async function employment(id, title, prevPoints) {
  const raw = (await bls())[BLS[id]];
  const byDate = new Map(raw.map((p) => [p.date, p]));
  const points = raw
    .map((p) => {
      const before = byDate.get(monthBefore(p.date));
      if (!before) return null;
      return { date: p.date, level: p.value, change: Math.round((p.value - before.value) * 10) / 10, preliminary: p.preliminary };
    })
    .filter(Boolean);
  if (points.length < 36) throw new Error(`${id}: only ${points.length} months`);
  return {
    id,
    title,
    unit: 'thousands',
    frequency: 'monthly',
    source: blsSeriesPage(BLS[id]),
    sourceLabel: `BLS Current Employment Statistics ${BLS[id]}, seasonally adjusted, thousands of jobs`,
    points: withStatus(prevPoints, points, { keys: ['level', 'change'], preliminary: ces, seed: 'revised' }),
  };
}

async function rate(id, title, prevPoints) {
  const raw = (await bls())[BLS[id]];
  const points = raw.map((p) => ({ date: p.date, rate: p.value, preliminary: p.preliminary }));
  if (points.length < 36) throw new Error(`${id}: only ${points.length} months`);
  return {
    id,
    title,
    unit: 'percent',
    frequency: 'monthly',
    source: blsSeriesPage(BLS[id]),
    sourceLabel: `BLS Current Population Survey ${BLS[id]}, seasonally adjusted`,
    points: withStatus(prevPoints, points, { keys: ['rate'], preliminary: ces, seed: 'final' }),
  };
}

async function earnings(prevPoints) {
  const raw = (await bls())[BLS.earnings];
  const byDate = new Map(raw.map((p) => [p.date, p]));
  const points = raw
    .map((p) => {
      const m = byDate.get(monthBefore(p.date));
      const y = byDate.get(yearBefore(p.date));
      if (!m || !y) return null;
      return { date: p.date, level: p.value, mom: pct(p.value, m.value), yoy: pct(p.value, y.value), preliminary: p.preliminary };
    })
    .filter(Boolean);
  if (points.length < 36) throw new Error(`earnings: only ${points.length} months`);
  return {
    id: 'earnings',
    title: 'Average hourly earnings, all private employees',
    unit: 'usd',
    frequency: 'monthly',
    source: blsSeriesPage(BLS.earnings),
    sourceLabel: 'BLS CES0500000003, seasonally adjusted; mom and yoy are percent changes rounded to one decimal',
    points: withStatus(prevPoints, points, { keys: ['level'], preliminary: ces, seed: 'revised' }),
  };
}

async function claims(prevPoints) {
  const raw = await fredSeries('ICSA', twoYearsAgo());
  const points = raw.map((p) => ({ date: p.date, claims: p.value }));
  if (points.length < 80) throw new Error(`claims: only ${points.length} weeks`);
  return {
    id: 'claims',
    title: 'Initial jobless claims, week ending',
    unit: 'count',
    frequency: 'weekly',
    source: fredPage('ICSA'),
    sourceLabel: 'Department of Labor via FRED ICSA, seasonally adjusted, week ending Saturday',
    points: withStatus(prevPoints, points, { keys: ['claims'], preliminary: (_, i, all) => i === all.length - 1, seed: 'revised' }),
  };
}

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { series: [] };

const { series, failed } = await runAll(
  [
    ['payrolls', (p) => employment('payrolls', 'Total nonfarm payroll employment', p)],
    ['unemployment', (p) => rate('unemployment', 'Unemployment rate', p)],
    ['earnings', earnings],
    ['participation', (p) => rate('participation', 'Labor force participation rate', p)],
    ['employmentPopulation', (p) => rate('employmentPopulation', 'Employment-population ratio', p)],
    ['foodServices', (p) => employment('foodServices', 'Food services and drinking places employment', p)],
    ['localGovEducation', (p) => employment('localGovEducation', 'Local government education employment', p)],
    ['information', (p) => employment('information', 'Information industry employment', p)],
    ['claims', claims],
  ],
  previous,
);

const feed = {
  schema: 'jobs-v1',
  updated: new Date().toISOString(),
  note: 'Jobs feed for the Economics watch list and the jobs brief. Refresh with node scripts/update-jobs.mjs (after-close push). Each point carries status preliminary, revised, or final; a revision overwrites the value and keeps revisedFrom. Never hand-edit.',
  series,
};
console.log(writeIfChanged(fs, OUT, feed, previous) ? `wrote ${path.relative(ROOT, OUT)}` : `no change, left ${path.relative(ROOT, OUT)} as it was`);
process.exit(failed ? 1 : 0);
