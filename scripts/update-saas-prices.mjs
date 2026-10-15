#!/usr/bin/env node
/**
 * Append weekly Friday closes to public/saas-history.json and rebuild
 * public/saas-tracker.json. Node built-ins only. Weekly, after Friday's close:
 *   node scripts/update-saas-prices.mjs
 * Run update-saas-fundamentals.mjs first on a fresh file: market cap needs the
 * share counts it stores.
 *
 * Source: Yahoo Finance daily closes. The week's close is Friday's, or the last
 * trading day of that week when Friday was a market holiday.
 *
 * Market cap = that close x weighted average basic shares from the latest 10-Q
 * filed on or before the week (SEC XBRL), adjusted for any stock split the
 * price feed reports after that filing. Yahoo closes are split adjusted.
 *
 * Index = rycode's own equal-weight basket: 100 x the average, across names
 * with a close in both weeks, of (close this week / close in the first week).
 * Sector indexes are the same sum over the sector's names.
 *
 * Append only: weeks already stored are never rewritten. A ticker whose fetch
 * fails gets null for new weeks, nothing stored is touched, and the script exits 1.
 */
import {
  COMPANIES, SECTORS, HISTORY, TRACKER, START_WEEK, readHistory, writeJson, buildTracker, fridaysThrough, addDays, round, sleep,
} from './lib/saas-feeds.mjs';

async function yahooDaily(ticker, fromDate) {
  const p1 = Math.floor(new Date(`${addDays(fromDate, -10)}T00:00:00Z`).getTime() / 1000);
  const p2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${p1}&period2=${p2}&interval=1d&events=splits`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (rycode.dev feed script)' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const result = (await res.json())?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${ticker}: no result`);
  const offset = result.meta?.gmtoffset ?? -14400;
  const regular = result.meta?.currentTradingPeriod?.regular;
  const now = Date.now() / 1000;
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const days = [];
  (result.timestamp ?? []).forEach((ts, i) => {
    if (typeof closes[i] !== 'number') return;
    if (regular && ts >= regular.start && now < regular.end) return; // today's bar is not final yet
    days.push({ date: new Date((ts + offset) * 1000).toISOString().slice(0, 10), close: round(closes[i], 2) });
  });
  const splits = Object.values(result.events?.splits ?? {}).map((s) => ({
    date: new Date((s.date + offset) * 1000).toISOString().slice(0, 10),
    ratio: s.numerator / s.denominator,
  }));
  if (!days.length) throw new Error(`Yahoo ${ticker}: no final closes`);
  return { days, splits };
}

/** Last close on or before Friday, inside that Monday to Friday week. */
function weekClose(days, friday) {
  const monday = addDays(friday, -4);
  const inWeek = days.filter((d) => d.date >= monday && d.date <= friday);
  return inWeek.at(-1) ?? null;
}

function sharesAt(store, friday, splits) {
  const filed = (store?.shares ?? []).filter((s) => s.filed <= friday).sort((a, b) => (a.end === b.end ? (a.filed < b.filed ? -1 : 1) : a.end < b.end ? -1 : 1));
  const s = filed.at(-1);
  if (!s) return null;
  const factor = splits.filter((x) => x.date > s.filed).reduce((a, x) => a * x.ratio, 1);
  return { value: Math.round(s.value * factor), source: `${s.form} ${s.accn}, weighted average basic shares, quarter ended ${s.end}${factor !== 1 ? `, x${factor} for a later split` : ''}` };
}

const history = readHistory();
const fridays = fridaysThrough();
const have = new Set(history.weeks.map((w) => w.date));
const lastStored = history.weeks.at(-1)?.date ?? '';
const todo = fridays.filter((f) => !have.has(f) && f > lastStored);
if (!todo.length) {
  console.log('saas prices: no new week to add');
  writeJson(TRACKER, buildTracker(history));
  process.exit(0);
}

const failed = [];
const series = {};
for (const c of COMPANIES) {
  try {
    series[c.ticker] = await yahooDaily(c.ticker, todo[0]);
  } catch (err) {
    failed.push(c.ticker);
    console.error(`${c.ticker}: ${err.message}`);
  }
  await sleep(200);
}

for (const friday of todo) {
  const prices = {};
  for (const c of COMPANIES) {
    const s = series[c.ticker];
    const wc = s ? weekClose(s.days, friday) : null;
    if (!wc) { prices[c.ticker] = null; continue; }
    const sh = sharesAt(history.fundamentals?.[c.ticker], friday, s.splits);
    prices[c.ticker] = {
      date: wc.date,
      close: wc.close,
      shares: sh?.value ?? null,
      marketCap: sh ? Math.round(wc.close * sh.value) : null,
      sharesSource: sh?.source ?? null,
    };
  }
  const baseRow = history.weeks[0]?.prices ?? prices; // the first stored week is the base
  const indexOf = (tickers) => {
    const r = tickers.map((t) => (prices[t]?.close && baseRow[t]?.close ? prices[t].close / baseRow[t].close : null)).filter((x) => x != null);
    return r.length ? round((100 * r.reduce((a, x) => a + x, 0)) / r.length, 2) : null;
  };
  const row = {
    date: friday,
    prices,
    index: indexOf(COMPANIES.map((c) => c.ticker)),
    sectorIndex: Object.fromEntries(SECTORS.map((s) => [s.id, indexOf(COMPANIES.filter((c) => c.sector === s.id).map((c) => c.ticker))])),
  };
  history.weeks.push(row);
}
history.startWeek ??= START_WEEK;
history.pricesUpdated = new Date().toISOString();
writeJson(HISTORY, history);
writeJson(TRACKER, buildTracker(history));
console.log(`saas prices: added ${todo.length} week(s), ${todo[0]} to ${todo.at(-1)}`);
if (failed.length) {
  console.error(`failed: ${failed.join(', ')} (null for new weeks, stored weeks untouched)`);
  process.exit(1);
}
