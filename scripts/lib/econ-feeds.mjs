/**
 * Shared helpers for the Economics feed scripts (update-jobs.mjs,
 * update-inflation.mjs). Node built-ins only.
 *
 * Point status
 *   preliminary  The source still flags the value as subject to revision (BLS
 *                footnote "P"), or it is the newest point of a series the source
 *                revises in its next release (PCE, jobless claims).
 *   revised      The value has been through at least one revision: the source
 *                revises it by schedule (BLS payroll months after their first two
 *                prints, older PCE months, older claims weeks), or a later run saw
 *                a different value for the same date. revisedFrom keeps the value
 *                it replaced when a run saw the change.
 *   final        Not flagged preliminary and not revised on a monthly schedule
 *                (household-survey rates, CPI). A later change still marks it revised.
 * A run overwrites a point when the source's value for that date changed.
 */

/* BLS and Treasury answer a browser user agent; FRED refuses it, so FRED gets Node's default. */
export async function get(url, { browser = true, kind = 'text', init = {} } = {}) {
  const headers = { ...(browser ? { 'User-Agent': 'Mozilla/5.0 (rycode.dev feed script)' } : {}), ...(init.headers ?? {}) };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return kind === 'json' ? res.json() : res.text();
}

export const BLS_API = 'https://api.bls.gov/publicAPI/v1/timeseries/data/';
export const blsSeriesPage = (id) => `https://data.bls.gov/timeseries/${id}`;
export const fredCsvUrl = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
export const fredPage = (id) => `https://fred.stlouisfed.org/series/${id}`;

/**
 * BLS public API v1 (no key): up to 25 series and 10 years per request.
 * Returns { [seriesId]: [{ date, value, preliminary }] } oldest first, monthly only.
 */
export async function blsMonthly(ids, years = 10) {
  const end = new Date().getUTCFullYear();
  const body = { seriesid: ids, startyear: String(end - years + 1), endyear: String(end) };
  const json = await get(BLS_API, {
    kind: 'json',
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });
  if (json?.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${json?.status} ${(json?.message ?? []).join(' ')}`);
  const out = {};
  for (const s of json.Results?.series ?? []) {
    out[s.seriesID] = (s.data ?? [])
      .filter((d) => /^M(0[1-9]|1[0-2])$/.test(d.period) && d.value !== '-' && Number.isFinite(Number(d.value)))
      .map((d) => ({
        date: `${d.year}-${d.period.slice(1)}-01`,
        value: Number(d.value),
        preliminary: (d.footnotes ?? []).some((f) => f?.code === 'P'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  for (const id of ids) if (!out[id]?.length) throw new Error(`BLS: no data for ${id}`);
  return out;
}

/** FRED graph CSV (no key): [{ date, value }] oldest first, from `start` on. */
export async function fredSeries(id, start = '1900-01-01') {
  const csv = await get(fredCsvUrl(id), { browser: false });
  const points = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(','))
    .filter(([d, v]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && v !== '.' && v !== '' && Number.isFinite(Number(v)))
    .map(([date, v]) => ({ date, value: Number(v) }))
    .filter((p) => p.date >= start);
  if (!points.length) throw new Error(`FRED ${id}: no points`);
  return points;
}

/** Percent change, rounded to one decimal the way BLS and BEA publish it. */
export function pct(now, then) {
  if (!Number.isFinite(now) || !Number.isFinite(then) || then === 0) return null;
  const v = ((now / then) - 1) * 100;
  return Math.round((v + Math.sign(v) * 1e-9) * 10) / 10;
}

/** The point 12 months before an ISO month start, from a Map keyed by date. */
export function yearBefore(iso) {
  const [y, m] = iso.split('-');
  return `${Number(y) - 1}-${m}-01`;
}

export function monthBefore(iso) {
  const [y, m] = iso.split('-').map(Number);
  return m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
}

/**
 * Set status on fresh points against the previous run's points.
 *   keys         value fields compared for a revision
 *   preliminary  (point, index, points) => boolean, the source's own flag
 *   seed         status for a point the feed has never stored and the source does not flag
 */
export function withStatus(prevPoints = [], points, { keys, preliminary, seed }) {
  const prev = new Map(prevPoints.map((p) => [p.date, p]));
  return points.map((p, i, all) => {
    const { preliminary: _flag, ...clean } = p;
    const before = prev.get(p.date);
    const changed = Boolean(before) && keys.some((k) => typeof clean[k] === 'number' && typeof before[k] === 'number' && clean[k] !== before[k]);
    const out = { ...clean };
    if (preliminary(p, i, all)) out.status = 'preliminary';
    else if (!before) out.status = seed;
    else if (changed || before.status === 'preliminary' || before.status === 'revised') out.status = 'revised';
    else out.status = before.status ?? seed;
    if (changed) out.revisedFrom = Object.fromEntries(keys.filter((k) => typeof before[k] === 'number').map((k) => [k, before[k]]));
    else if (before?.revisedFrom) out.revisedFrom = before.revisedFrom;
    return out;
  });
}

/** Run each series builder; a failure keeps the previous series and is counted. */
export async function runAll(jobs, previous) {
  const prev = (id) => previous.series?.find((s) => s.id === id);
  let failed = 0;
  const series = [];
  for (const [id, run] of jobs) {
    try {
      const s = await run(prev(id)?.points ?? []);
      series.push(s);
      const last = s.points[s.points.length - 1];
      console.log(`ok   ${id}: ${s.points.length} points, latest ${last.date}${last.status ? ` (${last.status})` : ''}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${id}: ${err.message}`);
      if (prev(id)) series.push(prev(id));
    }
  }
  return { series, failed };
}

/** Write the feed only when something other than "updated" changed, so a day with no release makes no commit. */
export function writeIfChanged(fs, file, feed, previous) {
  const strip = ({ updated, ...rest }) => JSON.stringify(rest);
  if (previous && previous.series?.length && strip(previous) === strip(feed)) return false;
  fs.writeFileSync(file, `${JSON.stringify(feed, null, 2)}\n`);
  return true;
}
