/**
 * Shared helpers for the SaaS tracker feeds (update-saas-prices.mjs,
 * update-saas-fundamentals.mjs). Node built-ins only.
 *
 * Files
 *   public/saas-history.json  weekly rows (one per Friday close) and quarterly
 *                             fundamentals per company. Append only: a run adds
 *                             weeks and quarters it does not have yet and never
 *                             rewrites a stored row.
 *   public/saas-tracker.json  current snapshot, rebuilt from history every run.
 *
 * Every number comes from Yahoo daily closes or an SEC EDGAR XBRL fact, or is
 * computed from those. Missing stays null and the page shows a dash.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HISTORY = path.join(ROOT, 'public', 'saas-history.json');
export const TRACKER = path.join(ROOT, 'public', 'saas-tracker.json');

/* SEC asks for a User-Agent naming the requester and a contact, and at most 10 requests a second. */
export const SEC_UA = 'rycode.dev SaaS tracker contact@rycode.dev';
export const SEC_DELAY_MS = 250;
export const BASKET_LABEL = 'rycode SaaS basket (our own, equal weight)';
export const START_WEEK = '2025-10-10';

export const SECTORS = [
  { id: 'front-office', label: 'Front office', note: 'CRM, sales, service' },
  { id: 'back-office', label: 'Back office', note: 'IT and business workflow' },
  { id: 'hr-finance', label: 'HR and finance', note: 'payroll, HR, accounting, payments' },
  { id: 'security', label: 'Security', note: 'endpoint, network, identity' },
  { id: 'data-infra', label: 'Data and infrastructure', note: 'data platforms, monitoring, databases' },
  { id: 'dev-tools', label: 'Developer tools', note: 'code, planning, delivery' },
  { id: 'collaboration', label: 'Collaboration', note: 'meetings, work management, e-signature' },
  { id: 'creative-vertical', label: 'Creative and vertical', note: 'design, life sciences, commerce' },
];

export const COMPANIES = [
  { ticker: 'CRM', name: 'Salesforce', sector: 'front-office', cik: 1108524 },
  { ticker: 'HUBS', name: 'HubSpot', sector: 'front-office', cik: 1404655 },
  { ticker: 'NOW', name: 'ServiceNow', sector: 'back-office', cik: 1373715 },
  { ticker: 'WDAY', name: 'Workday', sector: 'hr-finance', cik: 1327811 },
  { ticker: 'PAYC', name: 'Paycom', sector: 'hr-finance', cik: 1590955 },
  { ticker: 'INTU', name: 'Intuit', sector: 'hr-finance', cik: 896878 },
  { ticker: 'BILL', name: 'Bill Holdings', sector: 'hr-finance', cik: 1786352 },
  { ticker: 'CRWD', name: 'CrowdStrike', sector: 'security', cik: 1535527 },
  { ticker: 'PANW', name: 'Palo Alto Networks', sector: 'security', cik: 1327567 },
  { ticker: 'ZS', name: 'Zscaler', sector: 'security', cik: 1713683 },
  { ticker: 'OKTA', name: 'Okta', sector: 'security', cik: 1660134 },
  { ticker: 'NET', name: 'Cloudflare', sector: 'security', cik: 1477333 },
  { ticker: 'SNOW', name: 'Snowflake', sector: 'data-infra', cik: 1640147 },
  { ticker: 'DDOG', name: 'Datadog', sector: 'data-infra', cik: 1561550 },
  { ticker: 'MDB', name: 'MongoDB', sector: 'data-infra', cik: 1441816 },
  { ticker: 'TEAM', name: 'Atlassian', sector: 'dev-tools', cik: 1650372 },
  { ticker: 'GTLB', name: 'GitLab', sector: 'dev-tools', cik: 1653482 },
  { ticker: 'ZM', name: 'Zoom', sector: 'collaboration', cik: 1585521 },
  { ticker: 'MNDY', name: 'Monday.com', sector: 'collaboration', cik: 1845338, foreignFiler: true },
  { ticker: 'DOCU', name: 'DocuSign', sector: 'collaboration', cik: 1261333 },
  { ticker: 'ADBE', name: 'Adobe', sector: 'creative-vertical', cik: 796343 },
  { ticker: 'VEEV', name: 'Veeva Systems', sector: 'creative-vertical', cik: 1393052 },
  { ticker: 'SHOP', name: 'Shopify', sector: 'creative-vertical', cik: 1594805 },
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function readHistory() {
  if (!fs.existsSync(HISTORY)) {
    return { schema: 'saas-history-v1', updated: null, basket: BASKET_LABEL, startWeek: START_WEEK, weeks: [], fundamentals: {} };
  }
  return JSON.parse(fs.readFileSync(HISTORY, 'utf8'));
}

export function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/* ---------- dates ---------- */

export const iso = (d) => d.toISOString().slice(0, 10);
export function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
/** Fridays from START_WEEK through the last Friday whose close is final (the run day itself counts after 17:00 ET). */
export function fridaysThrough(now = new Date()) {
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  let last = iso(new Date(Date.UTC(etNow.getFullYear(), etNow.getMonth(), etNow.getDate())));
  const dow = new Date(`${last}T00:00:00Z`).getUTCDay();
  const back = (dow - 5 + 7) % 7;
  last = addDays(last, -back);
  if (back === 0 && etNow.getHours() < 17) last = addDays(last, -7);
  const out = [];
  for (let d = START_WEEK; d <= last; d = addDays(d, 7)) out.push(d);
  return out;
}

/* ---------- math ---------- */

export const round = (v, p = 2) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** p) / 10 ** p);
export function median(values) {
  const v = values.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/* ---------- snapshot ---------- */

/** Rebuild public/saas-tracker.json from history. No fetching. */
export function buildTracker(history) {
  const weeks = history.weeks;
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const yearAgoIdx = weeks.length - 1 - 52 >= 0 ? weeks.length - 1 - 52 : null;
  const companies = COMPANIES.map((c) => {
    const lastCell = last?.prices?.[c.ticker] ?? null;
    const baseCell = yearAgoIdx != null ? weeks[yearAgoIdx]?.prices?.[c.ticker] : null;
    const prev = weeks.length > 1 ? weeks[weeks.length - 2]?.prices?.[c.ticker] : null;
    const quarters = history.fundamentals?.[c.ticker]?.quarters ?? [];
    const q = quarters[quarters.length - 1] ?? null;
    return {
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      cik: String(c.cik).padStart(10, '0'),
      foreignFiler: !!c.foreignFiler,
      week: last?.date ?? null,
      close: lastCell?.close ?? null,
      closeDate: lastCell?.date ?? null,
      marketCap: lastCell?.marketCap ?? null,
      sharesSource: lastCell?.sharesSource ?? null,
      chg1wPct: lastCell?.close != null && prev?.close != null ? round((lastCell.close / prev.close - 1) * 100, 1) : null,
      chg52wPct: lastCell?.close != null && baseCell?.close != null ? round((lastCell.close / baseCell.close - 1) * 100, 1) : null,
      quarter: q,
    };
  });
  const rollup = (list) => ({
    count: list.length,
    medianGrowthPct: round(median(list.map((c) => c.quarter?.growthPct)), 1),
    medianFcfMarginTtmPct: round(median(list.map((c) => c.quarter?.fcfMarginTtmPct)), 1),
    medianRuleOf40: round(median(list.map((c) => c.quarter?.ruleOf40)), 1),
    medianSbcPct: round(median(list.map((c) => c.quarter?.sbcPct)), 1),
    median52wPct: round(median(list.map((c) => c.chg52wPct)), 1),
    totalMarketCap: list.some((c) => c.marketCap != null) ? list.reduce((s, c) => s + (c.marketCap ?? 0), 0) : null, // names without a market cap are listed in marketCapMissing
    marketCapMissing: list.filter((c) => c.marketCap == null).map((c) => c.ticker),
  });
  const sectors = SECTORS.map((s) => {
    const list = companies.filter((c) => c.sector === s.id);
    return { ...s, tickers: list.map((c) => c.ticker), ...rollup(list), index: last?.sectorIndex?.[s.id] ?? null };
  });
  return {
    schema: 'saas-tracker-v1',
    updated: new Date().toISOString(),
    basket: BASKET_LABEL,
    cadence: 'weekly, Friday close (prior trading day when Friday is a market holiday); filings after each earnings report',
    asOfWeek: last?.date ?? null,
    firstWeek: first?.date ?? null,
    weeksStored: weeks.length,
    index: { base: 100, baseWeek: first?.date ?? null, latest: last?.index ?? null },
    sources: {
      prices: 'Yahoo Finance daily closes (query1.finance.yahoo.com/v8/finance/chart)',
      filings: 'SEC EDGAR XBRL companyfacts (data.sec.gov/api/xbrl/companyfacts)',
    },
    overall: rollup(companies),
    sectors,
    companies,
  };
}
