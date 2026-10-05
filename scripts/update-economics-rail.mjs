#!/usr/bin/env node
/**
 * Append the latest daily points to public/economics-rail.json, the feed behind
 * the /economics/ chart rail (and the 52-week history behind the 30-year and oil
 * rows on /risk/). Node built-ins only (fetch, fs). Run by hand or from the
 * after-close cloud agent:  node scripts/update-economics-rail.mjs
 *
 * Sources (free, no key), recent window only
 *   yields  Treasury daily par yield curve CSV, current year (and the prior year in
 *           January): 2 Yr, 10 Yr, 30 Yr.
 *   oil     Yahoo Finance daily chart, 1 month: CL=F (WTI) and BZ=F (Brent).
 *           Final daily closes only: a bar from a session that has not closed is dropped.
 *   debt    FiscalData Debt to the Penny, 30 latest records: total public debt
 *           outstanding (tpdo) and debt held by the public (public), dollars.
 *   tga     FiscalData Daily Treasury Statement operating cash balance, 30 latest
 *           records: TGA opening balance, millions in the source, stored in dollars,
 *           dated to the prior business day (the day it was the closing balance),
 *           as the rail's history already is.
 *
 * Merge rule: a date the series does not have is appended. A date it has is
 * overwritten only for the keys this run fetched and only when the source's value
 * changed (a corrected close, a revised balance). Older points outside the fetched
 * window are never touched. Weekly, monthly, and yearly tabs are views of points.
 *
 * A source that fails keeps its series unchanged and the script exits 1.
 * Writes public/economics-rail.json only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'economics-rail.json');
const UA = { 'User-Agent': 'Mozilla/5.0 (rycode.dev feed script)' };
const FISCAL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';

const SOURCES = {
  yields: (year) =>
    `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`,
  wti: 'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?range=1mo&interval=1d',
  brent: 'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=1mo&interval=1d',
  debt: `${FISCAL}/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=30`,
  tga: `${FISCAL}/v1/accounting/dts/operating_cash_balance?filter=account_type:eq:Treasury%20General%20Account%20(TGA)%20Opening%20Balance&sort=-record_date&page[size]=30`,
};

async function get(url, kind = 'text') {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return kind === 'json' ? res.json() : res.text();
}

const num = (v) => (v === null || v === undefined || v === '' || v === 'null' || !Number.isFinite(Number(v)) ? null : Number(v));

/* ---------- yields ---------- */

async function yields() {
  const now = new Date();
  const years = now.getUTCMonth() === 0 ? [now.getUTCFullYear() - 1, now.getUTCFullYear()] : [now.getUTCFullYear()];
  const out = [];
  for (const year of years) {
    const lines = (await get(SOURCES.yields(year))).trim().split(/\r?\n/);
    const head = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
    const col = (name) => head.indexOf(name);
    const [d, c2, c10, c30] = [col('Date'), col('2 Yr'), col('10 Yr'), col('30 Yr')];
    if ([d, c2, c10, c30].some((i) => i < 0)) throw new Error(`yields: missing columns in ${year} CSV`);
    for (const line of lines.slice(1)) {
      const cells = line.split(',');
      const m = cells[d]?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) continue;
      const point = { date: `${m[3]}-${m[1]}-${m[2]}`, y2: num(cells[c2]), y10: num(cells[c10]), y30: num(cells[c30]) };
      if (point.y2 === null && point.y10 === null && point.y30 === null) continue;
      out.push(point);
    }
  }
  if (!out.length) throw new Error('yields: no rows');
  return out;
}

/* ---------- oil ---------- */

async function yahoo(url, key) {
  const json = await get(url, 'json');
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${key}: no result`);
  const { timestamp = [], meta = {} } = result;
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const regular = meta.currentTradingPeriod?.regular;
  const now = Date.now() / 1000;
  const offset = meta.gmtoffset ?? -14400;
  const out = [];
  timestamp.forEach((ts, i) => {
    const close = closes[i];
    if (typeof close !== 'number') return;
    if (regular && ts >= regular.start && now < regular.end) return;
    out.push({ date: new Date((ts + offset) * 1000).toISOString().slice(0, 10), [key]: Math.round(close * 100) / 100 });
  });
  if (!out.length) throw new Error(`Yahoo ${key}: no final closes`);
  return out;
}

async function oil() {
  const [wti, brent] = [await yahoo(SOURCES.wti, 'wti'), await yahoo(SOURCES.brent, 'brent')];
  const byDate = new Map();
  for (const p of [...wti, ...brent]) byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), ...p });
  return [...byDate.values()];
}

/* ---------- debt and TGA ---------- */

async function debt() {
  const rows = (await get(SOURCES.debt, 'json'))?.data ?? [];
  const out = rows
    .map((r) => ({ date: r.record_date, tpdo: num(r.tot_pub_debt_out_amt), public: num(r.debt_held_public_amt) }))
    .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && p.tpdo !== null);
  if (!out.length) throw new Error('debt: no records');
  return out;
}

/* The rail dates each opening balance to the business day before its statement,
   the day it was the closing balance. The oldest fetched record has no earlier
   day in the window and is skipped. */
async function tga() {
  const rows = ((await get(SOURCES.tga, 'json'))?.data ?? [])
    .map((r) => ({ record: r.record_date, tga: num(r.open_today_bal) === null ? null : num(r.open_today_bal) * 1e6 }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.record) && r.tga !== null)
    .sort((a, b) => a.record.localeCompare(b.record));
  const out = rows.slice(1).map((r, i) => ({ date: rows[i].record, tga: r.tga }));
  if (!out.length) throw new Error('tga: no records');
  return out;
}

/* ---------- merge ---------- */

function merge(series, fresh) {
  const byDate = new Map(series.points.map((p, i) => [p.date, i]));
  let added = 0;
  let changed = 0;
  for (const p of fresh) {
    const at = byDate.get(p.date);
    if (at === undefined) {
      const point = { date: p.date };
      for (const line of series.lines) point[line.key] = p[line.key] ?? null;
      series.points.push(point);
      added++;
      continue;
    }
    const have = series.points[at];
    let diff = false;
    for (const [k, v] of Object.entries(p)) {
      if (k === 'date' || v === null || v === undefined) continue;
      if (have[k] !== v) {
        have[k] = v;
        diff = true;
      }
    }
    if (diff) changed++;
  }
  series.points.sort((a, b) => a.date.localeCompare(b.date));
  return { added, changed };
}

const before = fs.readFileSync(OUT, 'utf8');
const feed = JSON.parse(before);
const jobs = { yields, oil, debt, tga };
let failed = 0;
for (const [id, run] of Object.entries(jobs)) {
  const series = feed.series.find((s) => s.id === id);
  if (!series) {
    failed++;
    console.error(`FAIL ${id}: no such series in economics-rail.json`);
    continue;
  }
  try {
    const { added, changed } = merge(series, await run());
    const last = series.points[series.points.length - 1];
    console.log(`ok   ${id}: +${added} new, ${changed} corrected, latest ${last.date}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${id}: ${err.message}`);
  }
}

const strip = ({ updated, ...rest }) => JSON.stringify(rest);
feed.append =
  'node scripts/update-economics-rail.mjs (after-close push) appends each new date and corrects a recent date only when its source value changed (for example a final futures close). It never rewrites points outside the fetched window, does not rebuild weekly/monthly/yearly, and does not edit essay pages. Those tabs are views of points. Oil points are the Yahoo bar. Do not splice the after-close tape over them.';
if (strip(feed) === strip(JSON.parse(before))) {
  console.log(`no change, left ${path.relative(ROOT, OUT)} as it was`);
} else {
  feed.updated = new Date().toISOString();
  fs.writeFileSync(OUT, `${JSON.stringify(feed, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}
process.exit(failed ? 1 : 0);
