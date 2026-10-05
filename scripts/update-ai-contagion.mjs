#!/usr/bin/env node
/**
 * Refresh public/ai-contagion.json, the feed behind the "AI build-out contagion"
 * row on /risk/. Node built-ins only (fetch, zlib, fs). Run by hand or from a
 * cloud agent:  node scripts/update-ai-contagion.mjs
 *
 * Sources
 *   datacenter  Census C30 private construction put in place, not seasonally
 *               adjusted, monthly, "Data center" column (privtime.xlsx).
 *   smh, gspc   Yahoo Finance daily chart, 2 years. Final daily closes only:
 *               a bar from a session that has not closed yet is dropped.
 *   spyTop10    State Street SPY daily holdings. Top 10 companies by weight,
 *               share classes of one company merged (Alphabet A + C). Each run
 *               adds that day's point and keeps earlier points.
 *
 * A source that fails keeps its previous series and the script exits 1.
 * This feed is not part of the tape ship. Nothing schedules this script.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'ai-contagion.json');
const UA = { 'User-Agent': 'Mozilla/5.0' };

const SOURCES = {
  datacenter: 'https://www.census.gov/construction/c30/xlsx/privtime.xlsx',
  smh: 'https://query1.finance.yahoo.com/v8/finance/chart/SMH?range=2y&interval=1d',
  gspc: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=2y&interval=1d',
  spyTop10: 'https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-spy.xlsx',
};

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

async function get(url, kind = 'buffer') {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return kind === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
}

/* ---------- Minimal xlsx reader: zip central directory + sheet XML ---------- */

function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let n = 0; n < count; n++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(local + 26);
    const lExtraLen = buf.readUInt16LE(local + 28);
    const start = local + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + size);
    files[name] = method === 8 ? zlib.inflateRawSync(raw) : raw;
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const unescape = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function colIndex(ref) {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** First worksheet as an array of rows (arrays of string | number | null). */
function readSheet(buf) {
  const files = unzip(buf);
  const shared = [];
  const ss = files['xl/sharedStrings.xml']?.toString('utf8') ?? '';
  for (const si of ss.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    shared.push(unescape((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, '')).join('')));
  }
  const sheetName = Object.keys(files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort()[0];
  const xml = files[sheetName].toString('utf8');
  const rows = [];
  for (const rowXml of xml.match(/<row[^>]*>[\s\S]*?<\/row>|<row[^>]*\/>/g) ?? []) {
    const row = [];
    for (const c of rowXml.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
      const ref = c.match(/ r="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = c.match(/ t="([^"]+)"/)?.[1];
      const v = c.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value = null;
      if (type === 's' && v !== undefined) value = shared[Number(v)];
      else if (type === 'inlineStr') value = unescape((c.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? ''));
      else if (type === 'str' && v !== undefined) value = unescape(v);
      else if (v !== undefined) value = Number(v);
      row[colIndex(ref)] = value;
    }
    rows.push(row);
  }
  return rows;
}

/* ---------- Census C30: data-center column ---------- */

async function censusDataCenter() {
  const rows = readSheet(await get(SOURCES.datacenter));
  const header = rows.findIndex((r) => r[0] === 'Date');
  const col = rows[header].findIndex((c) => typeof c === 'string' && c.trim() === 'Data center');
  if (header < 0 || col < 0) throw new Error('Census: no Date row or Data center column');
  const points = [];
  for (const r of rows.slice(header + 1)) {
    const label = typeof r[0] === 'string' ? r[0].trim() : '';
    const m = label.match(/^([A-Z][a-z]{2})-(\d{2})([pr]?)$/);
    if (!m || typeof r[col] !== 'number') continue;
    const year = 2000 + Number(m[2]);
    points.push({
      date: `${year}-${String(MONTHS[m[1]]).padStart(2, '0')}-01`,
      value: r[col],
      ...(m[3] === 'p' ? { status: 'preliminary' } : m[3] === 'r' ? { status: 'revised' } : {}),
    });
  }
  const releaseLine = rows.map((r) => r[0]).find((c) => typeof c === 'string' && /Construction Spending, /.test(c));
  points.sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < 24) throw new Error(`Census: only ${points.length} months`);
  return {
    id: 'datacenter',
    title: 'US private data-center construction put in place',
    unit: 'usd_millions',
    frequency: 'monthly',
    source: SOURCES.datacenter,
    sourceLabel: 'Census C30, private, not seasonally adjusted, millions of dollars',
    release: releaseLine?.match(/Construction Spending, ([^.]+)\./)?.[1] ?? null,
    points,
  };
}

/* ---------- Yahoo daily closes ---------- */

async function yahooCloses(id, title) {
  const json = await get(SOURCES[id], 'json');
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${id}: no result`);
  const { timestamp = [], meta = {} } = result;
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const regular = meta.currentTradingPeriod?.regular;
  const now = Date.now() / 1000;
  const offset = meta.gmtoffset ?? -14400;
  const points = [];
  timestamp.forEach((ts, i) => {
    const close = closes[i];
    if (typeof close !== 'number') return;
    /* Drop a bar from a session that is still open or has not reached its close. */
    if (regular && ts >= regular.start && now < regular.end) return;
    points.push({ date: new Date((ts + offset) * 1000).toISOString().slice(0, 10), close: Math.round(close * 100) / 100 });
  });
  if (points.length < 400) throw new Error(`Yahoo ${id}: only ${points.length} closes`);
  return {
    id,
    title,
    unit: 'usd',
    frequency: 'daily',
    source: SOURCES[id],
    sourceLabel: 'Yahoo Finance daily close',
    points,
  };
}

/* ---------- SPY top-10 company share ---------- */

async function spyTop10(previous) {
  const rows = readSheet(await get(SOURCES.spyTop10));
  const asOfCell = rows.find((r) => r[0] === 'Holdings:')?.[1] ?? '';
  const am = String(asOfCell).match(/(\d{2})-([A-Z][a-z]{2})-(\d{4})/);
  if (!am) throw new Error(`SPY: no as-of date in "${asOfCell}"`);
  const date = `${am[3]}-${String(MONTHS[am[2]]).padStart(2, '0')}-${am[1]}`;
  const header = rows.findIndex((r) => r[0] === 'Name' && r.includes('Weight'));
  const wCol = rows[header].indexOf('Weight');
  const tCol = rows[header].indexOf('Ticker');
  const companies = new Map();
  for (const r of rows.slice(header + 1)) {
    if (!r[0] || typeof r[wCol] !== 'number') continue;
    const name = String(r[0]).trim();
    const company = name.replace(/\s+(CL|CLASS)\s+[A-Z]$/i, '');
    const entry = companies.get(company) ?? { name: company, tickers: [], weight: 0 };
    entry.tickers.push(String(r[tCol] ?? '').trim());
    entry.weight += r[wCol];
    companies.set(company, entry);
  }
  const top = [...companies.values()].sort((a, b) => b.weight - a.weight).slice(0, 10);
  if (top.length < 10) throw new Error('SPY: fewer than 10 holdings');
  const share = top.reduce((sum, c) => sum + c.weight, 0);
  const point = {
    date,
    share: Math.round(share * 100) / 100,
    companies: top.map((c) => ({ name: c.name, tickers: c.tickers, weight: Math.round(c.weight * 10000) / 10000 })),
  };
  const kept = (previous?.points ?? []).filter((p) => p.date !== date);
  return {
    id: 'spyTop10',
    title: 'Top-10 company share of SPY',
    unit: 'percent',
    frequency: 'daily, one point per run',
    source: SOURCES.spyTop10,
    sourceLabel: 'State Street SPY daily holdings, share classes merged',
    points: [...kept, point].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/* ---------- Run ---------- */

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { series: [] };
const prev = (id) => previous.series?.find((s) => s.id === id);

const jobs = [
  ['datacenter', () => censusDataCenter()],
  ['smh', () => yahooCloses('smh', 'VanEck Semiconductor ETF (SMH)')],
  ['gspc', () => yahooCloses('gspc', 'S&P 500 index (^GSPC)')],
  ['spyTop10', () => spyTop10(prev('spyTop10'))],
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
  schema: 'ai-contagion-v1',
  updated: new Date().toISOString(),
  note: 'Feed for the AI build-out contagion row on /risk/. Refresh with node scripts/update-ai-contagion.mjs. Not part of the tape ship. Daily prices are final closes only.',
  series,
};
fs.writeFileSync(OUT, `${JSON.stringify(feed, null, 2)}\n`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
process.exit(failed ? 1 : 0);
