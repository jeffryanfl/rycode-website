#!/usr/bin/env node
/**
 * Refresh public/debt-refi.json, the feed behind the "Debt refinancing" chain
 * row on /risk/. Node built-ins only (fetch, fs). Run by hand or from a cloud
 * agent:  node scripts/update-debt-refi.mjs
 *
 * Sources
 *   borrowing   Treasury quarterly refunding financing estimates. Privately-held
 *               net marketable borrowing by calendar quarter, in billions. Each
 *               release gives the prior quarter's actual and estimates for the
 *               current and next quarter. An actual replaces an estimate; a newer
 *               estimate replaces an older one. The 12 latest releases are read.
 *   auctions10y FiscalData auctions_query. Nominal 10-year notes, new issues and
 *               reopenings (original term 10-Year, not TIPS), 2 years. Only
 *               auctions with a published bid-to-cover and high yield.
 *   mortgage30  FRED MORTGAGE30US, Freddie Mac 30-year fixed rate, weekly, 2 years.
 *
 * A source that fails keeps its previous series and the script exits 1.
 * This feed is not part of the tape ship. Nothing schedules this script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'debt-refi.json');
const TREASURY = 'https://home.treasury.gov';
const REFUNDING = `${TREASURY}/policy-issues/financing-the-government/quarterly-refunding`;

const SOURCES = {
  borrowingLatest: `${REFUNDING}/most-recent-quarterly-refunding-documents`,
  borrowingArchive: `${REFUNDING}/quarterly-refunding-archives/quarterly-refunding-financing-estimates-by-calendar-year`,
  auctions10y: 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query',
  auctionsPage: 'https://fiscaldata.treasury.gov/datasets/treasury-securities-auctions-data/auctions',
  mortgage30: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US',
};

const RELEASES = 12;
const QUARTER_START = { January: '01', April: '04', July: '07', October: '10' };
const SHORT = { January: 'Jan', March: 'Mar', April: 'Apr', June: 'Jun', July: 'Jul', September: 'Sep', October: 'Oct', December: 'Dec' };

/* Treasury and FiscalData answer a browser user agent; FRED refuses it, so FRED gets Node's default. */
async function get(url, { browser = true, kind = 'text' } = {}) {
  const res = await fetch(url, { headers: browser ? { 'User-Agent': 'Mozilla/5.0' } : {} });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return kind === 'json' ? res.json() : res.text();
}

const twoYearsAgo = () => new Date(Date.now() - 730 * 86_400_000).toISOString().slice(0, 10);

/* ---------- borrowing ---------- */

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&ndash;|&#8211;|&mdash;|&#8212;/g, '\u2013')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, ' ');
}

function releaseLinks(html, onlyFinancing) {
  const links = [];
  const re = /<a [^>]*href=["']?([^"' >]*\/news\/press-releases\/([a-z]{2}\d+))["']?[^>]*>([^<]*)</gi;
  let m;
  while ((m = re.exec(html))) {
    if (onlyFinancing && !/financing estimates/i.test(m[3])) continue;
    links.push(m[2]);
  }
  return links;
}

function parseRelease(id, html) {
  const text = plainText(html);
  const re =
    /During the (January|April|July|October)\s*\u2013?-?\s*(March|June|September|December),? (\d{4}) quarter, Treasury (expects to borrow|expects to pay down|borrowed|paid down) \$([\d.,]+) (billion|trillion)/g;
  const found = [];
  let m;
  while ((m = re.exec(text))) {
    const [, from, to, year, verb, amount, unit] = m;
    let value = Number(amount.replace(/,/g, '')) * (unit === 'trillion' ? 1000 : 1);
    if (/pay down|paid down/.test(verb)) value = -value;
    found.push({
      date: `${year}-${QUARTER_START[from]}-01`,
      quarter: `${SHORT[from]} to ${SHORT[to]} ${year}`,
      value: Math.round(value),
      status: /expects/.test(verb) ? 'estimate' : 'actual',
      release: `${TREASURY}/news/press-releases/${id}`,
    });
  }
  if (!found.length) throw new Error(`borrowing: no quarter sentences in ${id}`);
  const dm = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/);
  return { id, released: dm ? dm[0] : null, found };
}

async function borrowing() {
  const latest = releaseLinks(await get(SOURCES.borrowingLatest), true);
  const archive = releaseLinks(await get(SOURCES.borrowingArchive), false);
  const ids = [...new Set([...latest, ...archive])].slice(0, RELEASES);
  if (ids.length < 4) throw new Error(`borrowing: only ${ids.length} releases listed`);
  const releases = [];
  for (const id of ids) releases.push(parseRelease(id, await get(`${TREASURY}/news/press-releases/${id}`)));

  /* Oldest release first, so newer estimates replace older ones; an actual is never replaced by an estimate. */
  const byQuarter = new Map();
  for (const rel of [...releases].reverse()) {
    for (const p of rel.found) {
      const have = byQuarter.get(p.date);
      if (have && have.status === 'actual' && p.status === 'estimate') continue;
      byQuarter.set(p.date, { ...p, released: rel.released });
    }
  }
  const points = [...byQuarter.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (points.filter((p) => p.status === 'actual').length < 8) throw new Error('borrowing: fewer than 8 actual quarters');
  return {
    id: 'borrowing',
    title: 'Privately-held net marketable borrowing by quarter',
    unit: 'usd_billions',
    frequency: 'quarterly',
    source: SOURCES.borrowingArchive,
    sourceLabel: 'Treasury quarterly refunding financing estimates; each point is the latest estimate or the actual',
    latestRelease: `${TREASURY}/news/press-releases/${ids[0]}`,
    points,
  };
}

/* ---------- 10-year auctions ---------- */

async function auctions10y() {
  const params = new URLSearchParams({
    filter: `original_security_term:eq:10-Year,security_type:eq:Note,inflation_index_security:eq:No,auction_date:gte:${twoYearsAgo()}`,
    fields: 'auction_date,issue_date,cusip,security_term,reopening,bid_to_cover_ratio,high_yield',
    sort: 'auction_date',
    'page[size]': '200',
  });
  const body = await get(`${SOURCES.auctions10y}?${params}`, { kind: 'json' });
  const rows = Array.isArray(body?.data) ? body.data : [];
  const points = rows
    .map((r) => ({
      date: r.auction_date,
      bidToCover: Number(r.bid_to_cover_ratio),
      highYield: Number(r.high_yield),
      status: r.reopening === 'Yes' ? 'reopening' : 'new issue',
      cusip: r.cusip,
      term: r.security_term,
    }))
    .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.bidToCover) && p.bidToCover > 0 && Number.isFinite(p.highYield) && p.highYield > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < 12) throw new Error(`auctions: only ${points.length} auctions with results`);
  return {
    id: 'auctions10y',
    title: '10-year note auctions, new issues and reopenings',
    unit: 'ratio',
    frequency: 'per auction',
    source: SOURCES.auctionsPage,
    sourceLabel: 'FiscalData Treasury securities auctions data; nominal 10-year notes, TIPS excluded; final results only',
    points,
  };
}

/* ---------- 30-year mortgage rate ---------- */

async function mortgage30() {
  const csv = await get(SOURCES.mortgage30, { browser: false });
  const start = twoYearsAgo();
  const points = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(','))
    .filter(([d, v]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && v !== '.' && Number.isFinite(Number(v)))
    .map(([date, v]) => ({ date, rate: Number(v) }))
    .filter((p) => p.date >= start);
  if (points.length < 60) throw new Error(`mortgage: only ${points.length} weeks`);
  return {
    id: 'mortgage30',
    title: 'Freddie Mac 30-year fixed mortgage rate',
    unit: 'percent',
    frequency: 'weekly',
    source: SOURCES.mortgage30,
    sourceLabel: 'FRED MORTGAGE30US, Freddie Mac Primary Mortgage Market Survey',
    points,
  };
}

/* ---------- Run ---------- */

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { series: [] };
const prev = (id) => previous.series?.find((s) => s.id === id);

const jobs = [
  ['borrowing', borrowing],
  ['auctions10y', auctions10y],
  ['mortgage30', mortgage30],
];

let failed = 0;
const series = [];
for (const [id, run] of jobs) {
  try {
    const s = await run();
    series.push(s);
    const last = s.points[s.points.length - 1];
    console.log(`ok   ${id}: ${s.points.length} points, latest ${last.date}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${id}: ${err.message}`);
    if (prev(id)) series.push(prev(id));
  }
}

const feed = {
  schema: 'debt-refi-v1',
  updated: new Date().toISOString(),
  note: 'Feed for the Debt refinancing row on /risk/. Refresh with node scripts/update-debt-refi.mjs. Not part of the tape ship. Final values only: borrowing points carry estimate or actual.',
  series,
};
fs.writeFileSync(OUT, `${JSON.stringify(feed, null, 2)}\n`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
process.exit(failed ? 1 : 0);
