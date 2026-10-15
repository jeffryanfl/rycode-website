#!/usr/bin/env node
/**
 * Refresh quarterly filing numbers in public/saas-history.json and rebuild
 * public/saas-tracker.json. Node built-ins only. Run by hand after earnings:
 *   node scripts/update-saas-fundamentals.mjs
 *
 * Source: SEC EDGAR XBRL companyfacts, one request per company, 250 ms apart,
 * with a User-Agent that names rycode.dev and a contact email.
 *
 * Quarter values. Income lines come as 3-month facts in a 10-Q. Cash-flow lines
 * in a 10-Q are year-to-date, and the fourth quarter is only in the 10-K as a
 * full year, so a quarter is the year-to-date (or full-year) value minus the
 * year-to-date value one quarter earlier with the same start date.
 * When the same period is reported twice, the latest filing wins.
 *
 * Append only: a quarter already stored is never rewritten. A company whose
 * request fails keeps everything it had, and the script exits 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, COMPANIES, HISTORY, TRACKER, SEC_UA, SEC_DELAY_MS, readHistory, writeJson, buildTracker, sleep, round,
} from './lib/saas-feeds.mjs';

/* Hand-entered quarters from earnings releases (scripts/data/saas-manual.json), for companies without quarterly XBRL. */
const MANUAL_FILE = path.join(ROOT, 'scripts', 'data', 'saas-manual.json');
const MANUAL = fs.existsSync(MANUAL_FILE) ? JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf8')) : {};
const QUARTERS_KEPT = 5; // latest reported quarters shown; 4 more are read for growth and trailing sums
const TAGS = {
  revenue: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'RevenueFromContractWithCustomerIncludingAssessedTax'],
  ocf: ['NetCashProvidedByUsedInOperatingActivities'],
  // PaymentsForSoftware is a last resort, used only when a company has neither standard capex tag (Veeva).
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets', 'PaymentsForSoftware'],
  sbc: ['ShareBasedCompensation', 'AllocatedShareBasedCompensationExpense'],
  rpo: ['RevenueRemainingPerformanceObligation'],
  shares: ['WeightedAverageNumberOfSharesOutstandingBasic'],
};
const FORMS = new Set(['10-Q', '10-K', '10-Q/A', '10-K/A', '20-F', '40-F']);
const days = (a, b) => (new Date(b) - new Date(a)) / 86400000;

async function companyFacts(cik) {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, '0')}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': SEC_UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

/** First tag in the list that has USD (or shares) facts in 10-Q/10-K filings ending in the last two years. */
function pick(facts, names, unit) {
  const cutoff = new Date(Date.now() - 730 * 86400000).toISOString().slice(0, 10);
  for (const name of names) {
    const rows = facts?.facts?.['us-gaap']?.[name]?.units?.[unit];
    if (!rows) continue;
    const ok = rows.filter((r) => FORMS.has(r.form) && r.end >= cutoff);
    if (ok.length) {
      // latest filing wins per (start, end)
      const byKey = new Map();
      for (const r of rows.filter((x) => FORMS.has(x.form))) {
        const k = `${r.start ?? ''}|${r.end}`;
        const prev = byKey.get(k);
        if (!prev || r.filed > prev.filed) byKey.set(k, r);
      }
      return { tag: name, rows: [...byKey.values()] };
    }
  }
  return null;
}

/** 3-month value ending on `end`, direct or by year-to-date difference. */
function quarterValue(series, end) {
  if (!series) return null;
  const ending = series.rows.filter((r) => r.end === end && r.start);
  const direct = ending.find((r) => { const d = days(r.start, r.end); return d >= 80 && d <= 100; });
  if (direct) return { value: direct.val, accn: direct.accn, form: direct.form, filed: direct.filed };
  for (const long of ending.sort((a, b) => days(b.start, b.end) - days(a.start, a.end))) {
    const len = days(long.start, long.end);
    if (len < 170) continue;
    const shorter = series.rows.filter((r) => r.start === long.start && r.end < end && days(r.end, end) >= 80 && days(r.end, end) <= 100);
    if (shorter.length) {
      const s = shorter[0];
      return { value: long.val - s.val, accn: long.accn, form: long.form, filed: long.filed, derived: `${long.start} to ${long.end} minus ${s.start} to ${s.end}` };
    }
  }
  return null;
}
function instant(series, end) {
  const r = series?.rows.find((x) => x.end === end && !x.start);
  return r ? { value: r.val, accn: r.accn, form: r.form, filed: r.filed } : null;
}

/** Quarter ends: every end date that has a 3-month revenue fact or can be derived. */
function quarterEnds(rev) {
  const ends = [...new Set(rev.rows.filter((r) => r.start).map((r) => r.end))].sort();
  return ends.filter((e) => quarterValue(rev, e));
}

function nearEnd(list, target, tol = 10) {
  return list.find((e) => Math.abs(days(e, target)) <= tol) ?? null;
}

function buildQuarters(facts, manual = []) {
  const s = {};
  for (const [k, names] of Object.entries(TAGS)) s[k] = pick(facts, names, k === 'shares' ? 'shares' : 'USD');
  const ends = s.revenue ? quarterEnds(s.revenue) : [];
  const out = [];
  for (const end of ends) {
    const rev = quarterValue(s.revenue, end);
    const ocf = quarterValue(s.ocf, end);
    const capex = quarterValue(s.capex, end);
    const sbc = quarterValue(s.sbc, end);
    const rpo = instant(s.rpo, end);
    out.push({ end, revenue: rev?.value ?? null, ocf: ocf?.value ?? null, capex: capex?.value ?? null, sbc: sbc?.value ?? null, rpo: rpo?.value ?? null, accn: rev?.accn ?? null, form: rev?.form ?? null, filed: rev?.filed ?? null });
  }
  // Manual quarters fill only quarter ends the SEC feed lacks at fetch time. Once a quarter is
  // stored it is never rewritten, so a later SEC quarter does not replace a stored manual one.
  for (const m of manual) {
    if (nearEnd(ends, m.end)) continue;
    out.push({ end: m.end, revenue: m.revenue, revenueYearAgo: m.revenueYearAgo ?? null, ocf: m.ocf, capex: m.capex, sbc: m.sbc, rpo: m.rpo, accn: m.release.filing, form: 'release', filed: m.release.date, source: 'release', sourceUrl: m.release.url });
  }
  out.sort((a, b) => (a.end < b.end ? -1 : 1));
  const allEnds = out.map((x) => x.end);
  const quarters = [];
  for (let i = 0; i < out.length; i += 1) {
    const q = out[i];
    const ya = nearEnd(allEnds, new Date(new Date(q.end).getTime() - 365 * 86400000).toISOString().slice(0, 10));
    const prior = ya ? out.find((x) => x.end === ya) : null;
    const fcf = q.ocf != null && q.capex != null ? q.ocf - q.capex : null;
    // trailing four quarters, only when all four are back to back
    const last4 = out.slice(Math.max(0, i - 3), i + 1);
    const contiguous = last4.length === 4 && last4.every((x, j) => j === 0 || (days(last4[j - 1].end, x.end) >= 80 && days(last4[j - 1].end, x.end) <= 100));
    const sum = (k) => (contiguous && last4.every((x) => x[k] != null) ? last4.reduce((a, x) => a + x[k], 0) : null);
    const revTtm = sum('revenue');
    const ocfTtm = sum('ocf');
    const capexTtm = sum('capex');
    const fcfTtm = ocfTtm != null && capexTtm != null ? ocfTtm - capexTtm : null;
    const yearAgoRevenue = prior?.revenue ?? q.revenueYearAgo ?? null; // a release prints the year-earlier quarter itself
    const growthPct = yearAgoRevenue ? round((q.revenue / yearAgoRevenue - 1) * 100, 1) : null;
    const fcfMarginTtmPct = revTtm && fcfTtm != null ? round((fcfTtm / revTtm) * 100, 1) : null;
    quarters.push({
      end: q.end,
      form: q.form,
      filed: q.filed,
      accn: q.accn,
      revenue: q.revenue,
      revenueYearAgo: yearAgoRevenue,
      growthPct,
      freeCashFlow: fcf,
      fcfMarginPct: fcf != null && q.revenue ? round((fcf / q.revenue) * 100, 1) : null,
      revenueTtm: revTtm,
      freeCashFlowTtm: fcfTtm,
      fcfMarginTtmPct,
      ruleOf40: growthPct != null && fcfMarginTtmPct != null ? round(growthPct + fcfMarginTtmPct, 1) : null,
      sbc: q.sbc,
      sbcPct: q.sbc != null && q.revenue ? round((q.sbc / q.revenue) * 100, 1) : null,
      rpo: q.rpo,
      ...(q.source ? { source: q.source, sourceUrl: q.sourceUrl } : {}),
    });
  }
  // Shares keep every filing's value (not only the latest), so a past week only sees counts filed by then.
  const rawShares = s.shares ? facts.facts['us-gaap'][s.shares.tag].units.shares.filter((r) => FORMS.has(r.form)) : [];
  const shares = rawShares
    .filter((r) => r.start && days(r.start, r.end) <= 100)
    .filter((r) => r.end <= r.filed)
    .map((r) => ({ end: r.end, filed: r.filed, value: r.val, form: r.form, accn: r.accn }))
    .sort((a, b) => (a.filed < b.filed ? -1 : 1));
  for (const m of manual) {
    if (m.sharesBasic != null && !nearEnd(shares.map((x) => x.end), m.end)) {
      shares.push({ end: m.end, filed: m.release.date, value: m.sharesBasic, form: 'release', accn: m.release.filing, url: m.release.url });
    }
  }
  shares.sort((a, b) => (a.filed < b.filed ? -1 : 1));
  const tags = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v?.tag ?? null]));
  return { quarters, shares, tags };
}

const history = readHistory();
history.fundamentals ??= {};
const failed = [];
for (const c of COMPANIES) {
  try {
    const facts = await companyFacts(c.cik);
    const { quarters, shares, tags } = buildQuarters(facts, MANUAL[c.ticker]?.quarters ?? []);
    const store = (history.fundamentals[c.ticker] ??= { quarters: [], shares: [], tags: {} });
    // shown: latest QUARTERS_KEPT computed quarters; never rewrite a stored one
    const have = new Set(store.quarters.map((q) => q.end));
    const lastStored = store.quarters.at(-1)?.end ?? '';
    const fresh = quarters.slice(-QUARTERS_KEPT).filter((q) => !have.has(q.end) && q.end > lastStored);
    store.quarters.push(...fresh);
    const haveShares = new Set(store.shares.map((x) => `${x.end}|${x.accn}`));
    store.shares.push(...shares.filter((x) => !haveShares.has(`${x.end}|${x.accn}`) && x.end >= '2024-06-30'));
    store.tags = tags;
    store.checked = new Date().toISOString();
    if (c.foreignFiler) store.note = 'Foreign filer without quarterly SEC data; quarters are hand-entered from its earnings releases (scripts/data/saas-manual.json).';
    console.log(`${c.ticker}: ${quarters.length} quarters computed, +${fresh.length} stored, ${store.shares.length} share counts`);
  } catch (err) {
    failed.push(c.ticker);
    console.error(`${c.ticker}: ${err.message} (kept previous data)`);
  }
  await sleep(SEC_DELAY_MS);
}
history.fundamentalsUpdated = new Date().toISOString();
writeJson(HISTORY, history);
writeJson(TRACKER, buildTracker(history));
if (failed.length) {
  console.error(`failed: ${failed.join(', ')}`);
  process.exit(1);
}
