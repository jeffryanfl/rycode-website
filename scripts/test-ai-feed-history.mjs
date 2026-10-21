#!/usr/bin/env node
/**
 * Checks for update-ai-feed-history.mjs and feed sort/labels. Run from repo root:
 *   node scripts/test-ai-feed-history.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  mergeAiFeedHistory,
  addDaysYmd,
  formatFeedDateLabel,
  isLastUpdatedStale,
  keepFeedItem,
  sortFeedItems,
  todayYmdInTimeZone,
} from './lib/ai-feed-history-core.mjs';
import {
  selectTickerItems,
  tickerItemTag,
  tickerItemText,
} from './lib/ai-week-ticker.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'scripts/update-ai-feed-history.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-feed-test-'));

function runScript(tapePath, outPath) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd: ROOT,
    env: { ...process.env, AI_FEED_HISTORY_TAPE: tapePath, AI_FEED_HISTORY_OUT: outPath },
    encoding: 'utf8',
  });
}

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`OK: ${label}`);
}

function bad(label, detail) {
  failed += 1;
  console.error(`FAIL: ${label}: ${detail}`);
}

const today = '2026-10-21';
const oldDate = addDaysYmd(today, -7);

if (todayYmdInTimeZone(new Date('2026-10-22T01:00:00.000Z')) !== '2026-10-21') {
  bad('NY today', todayYmdInTimeZone(new Date('2026-10-22T01:00:00.000Z')));
} else ok('todayYmd uses America/New_York');

const sample = (id, date, tag) => ({
  id,
  date,
  tag,
  headline: 'h',
  why: 'w',
  url: 'https://example.com/x',
  source: 'S',
  status: 'confirmed',
});
const fullCard = [];
for (let n = 1; n <= 9; n += 1) {
  const nn = String(n).padStart(2, '0');
  fullCard.push({
    ...sample(`2026-10-21-${nn}`, n === 9 ? '2026-10-31' : '2026-10-20', n === 9 ? 'Calendar' : 'News'),
    headline: 'h',
    why: 'w',
    url: 'https://example.com/x',
    source: 'S',
    status: 'confirmed',
  });
}
const tick = selectTickerItems(fullCard, today);
if (tick.items.length !== 9) bad('ticker card day', `expected 9 got ${tick.items.length}`);
else ok('ticker picks full latest card by id prefix');
if (tick.cardDay !== '2026-10-21') bad('ticker cardDay', tick.cardDay);
else ok('ticker card day for as-of');
const reported = { ...sample('r', '2026-10-21', 'News'), status: 'reported', headline: 'Head' };
if (tickerItemText(reported, today) !== 'REPORTED · Head') bad('ticker reported', tickerItemText(reported, today));
else ok('ticker reported label');
const cal = { ...sample('c', '2026-10-31', 'Calendar'), headline: 'Bill', status: 'confirmed' };
if (tickerItemTag(cal, '2026-10-31') !== 'Due 31 Oct') bad('ticker due tag', tickerItemTag(cal, '2026-10-31'));
else ok('ticker due tag on due day');

const sortOrder = sortFeedItems(
  [
    sample('2026-10-21-09', '2026-10-31', 'Calendar'),
    sample('2026-10-21-01', '2026-10-21', 'News'),
    sample('2026-10-21-08', '2026-10-20', 'Infra'),
    sample('2026-10-21-10', '2026-11-05', 'Calendar'),
  ],
  today,
);
if (sortOrder.map((i) => i.id).join(',') !== '2026-10-21-01,2026-10-21-08,2026-10-21-09,2026-10-21-10') {
  bad('calendar sort', sortOrder.map((i) => i.id).join(','));
} else ok('future calendar at bottom, soonest first');
if (formatFeedDateLabel(sample('c', '2026-10-31', 'Calendar'), today) !== 'Due 31 Oct') {
  bad('due label', formatFeedDateLabel(sample('c', '2026-10-31', 'Calendar'), today));
} else ok('due date label');
if (formatFeedDateLabel(sample('c', '2026-10-31', 'Calendar'), '2026-10-31') !== 'Due 31 Oct') {
  bad('due label on due day', formatFeedDateLabel(sample('c', '2026-10-31', 'Calendar'), '2026-10-31'));
} else ok('due label on due day');
if (formatFeedDateLabel(sample('n', '2026-10-21', 'News'), today) !== '21 Oct') {
  bad('news date label', formatFeedDateLabel(sample('n', '2026-10-21', 'News'), today));
} else ok('plain date label');

const sameDay = sortFeedItems(
  [
    sample('2026-10-21-07', '2026-10-21', 'OpenWeight'),
    sample('2026-10-21-01', '2026-10-21', 'Safety'),
    sample('2026-10-21-03', '2026-10-21', 'News'),
  ],
  today,
);
if (sameDay.map((i) => i.id).join(',') !== '2026-10-21-01,2026-10-21-03,2026-10-21-07') {
  bad('same-day id order', sameDay.map((i) => i.id).join(','));
} else ok('same date sorts by id ascending');

const stale = sample('stale-news', addDaysYmd(today, -7), 'News');
if (keepFeedItem(today, stale)) bad('7-day window', 'day before cutoff should drop');
else ok('7-day window drops day before cutoff');
const edge = sample('edge-news', addDaysYmd(today, -6), 'News');
if (!keepFeedItem(today, edge)) bad('7-day window', 'cutoff day should stay');
else ok('7-day window keeps cutoff day (7 days including today)');
if (!keepFeedItem(today, sample('cal-ok', '2026-11-01', 'Calendar'))) bad('7-day window', 'future calendar should stay');
else ok('7-day window keeps future calendar');
if (keepFeedItem(today, sample('cal-gone', '2026-10-01', 'Calendar'))) bad('7-day window', 'past calendar should drop');
else ok('7-day window drops past calendar');
if (!keepFeedItem('2026-10-31', sample('cal-due', '2026-10-31', 'Calendar'))) bad('calendar due', 'due date should stay visible');
else ok('calendar visible on due date');
if (keepFeedItem('2026-11-01', sample('cal-due', '2026-10-31', 'Calendar'))) bad('calendar due', 'day after due should drop');
else ok('calendar drops after due date');

const nyNow = new Date('2026-10-22T01:00:00.000Z');
if (!isLastUpdatedStale('2026-10-14T18:00:00.000Z', nyNow)) {
  bad('last updated stale', 'expected stale when NY today is 21 Oct and updated 14 Oct');
} else ok('last updated stale uses NY today');
if (isLastUpdatedStale('2026-10-20T18:00:00.000Z', nyNow)) {
  bad('last updated fresh', 'expected fresh within two NY weekdays');
} else ok('last updated fresh within two NY weekdays');

const merged = mergeAiFeedHistory(
  [{ id: 'old-1', date: oldDate, tag: 'News', headline: 'old', why: 'x', url: 'https://example.com/a', source: 'X', status: 'confirmed' }],
  [
    { id: '2026-10-21-01', date: today, tag: 'News', headline: 'new', why: 'y', url: 'https://example.com/b', source: 'Y', status: 'confirmed' },
    { id: '2026-10-21-01', date: today, tag: 'News', headline: 'newer', why: 'z', url: 'https://example.com/c', source: 'Z', status: 'reported' },
    { id: 'cal-future', date: '2026-11-01', tag: 'Calendar', headline: 'future', why: 'f', url: '/ai/', source: 'rycode', status: 'confirmed' },
    { id: 'cal-past', date: '2026-10-01', tag: 'Calendar', headline: 'past', why: 'p', url: '/ai/', source: 'rycode', status: 'confirmed' },
  ],
  today,
);
if (merged.find((i) => i.id === '2026-10-21-01')?.headline !== 'newer') bad('dedupe', 'feed should win on id');
else ok('dedupe by id');
if (merged.some((i) => i.id === 'old-1')) bad('7-day', 'old item should drop');
else ok('7-day drop');
if (!merged.some((i) => i.id === 'cal-future')) bad('calendar', 'future calendar should stay');
else ok('calendar future');
if (merged.some((i) => i.id === 'cal-past')) bad('calendar', 'past calendar should drop');
else ok('calendar past');

const tapeNoFeed = path.join(tmp, 'tape-no-feed.json');
const outFile = path.join(tmp, 'history.json');
fs.writeFileSync(tapeNoFeed, JSON.stringify({ lines: [], doorHref: '/ai/' }));
fs.writeFileSync(outFile, JSON.stringify({ schema: 'ai-feed-history-v1', updated: '2026-01-01T00:00:00.000Z', items: [] }));
const beforeNoFeed = fs.readFileSync(outFile, 'utf8');
const r0 = runScript(tapeNoFeed, outFile);
if (r0.status !== 0) bad('no feed exit', String(r0.status));
else if (fs.readFileSync(outFile, 'utf8') !== beforeNoFeed) bad('no feed', 'history changed');
else ok('no feed[] leaves files unchanged');

const tapeWithFeed = path.join(tmp, 'tape-feed.json');
const item = {
  id: '2026-10-22-99',
  date: '2026-10-22',
  tag: 'News',
  headline: 'Test headline',
  why: 'Test why',
  url: 'https://example.com/news',
  source: 'Test',
  status: 'confirmed',
};
fs.writeFileSync(
  tapeWithFeed,
  JSON.stringify({ lines: [{ tag: 'News', text: 'x' }], feed: [item] }),
);
fs.writeFileSync(outFile, beforeNoFeed);
const r1 = runScript(tapeWithFeed, outFile);
const hist = JSON.parse(fs.readFileSync(outFile, 'utf8'));
if (r1.status !== 0 || !hist.items.some((i) => i.id === '2026-10-22-99')) bad('merge write', r1.stderr || r1.stdout);
else ok('script merge write');

const badHistory = path.join(tmp, 'bad-history.json');
fs.writeFileSync(badHistory, '{not json');
const goodTape = tapeWithFeed;
const r2 = runScript(goodTape, badHistory);
if (r2.status === 0) bad('invalid history', 'should exit non-zero');
else if (!String(r2.stderr).includes('FAIL:')) bad('invalid history', 'missing FAIL line');
else ok('invalid history fails with FAIL');

fs.writeFileSync(outFile, JSON.stringify({ schema: 'ai-feed-history-v1', updated: '2026-01-01T00:00:00.000Z', items: [] }));
const readOnly = path.join(tmp, 'readonly');
fs.mkdirSync(readOnly);
const roOut = path.join(readOnly, 'history.json');
fs.writeFileSync(roOut, fs.readFileSync(outFile));
fs.chmodSync(readOnly, 0o555);
const snapshot = fs.readFileSync(roOut, 'utf8');
const r3 = runScript(tapeWithFeed, roOut);
fs.chmodSync(readOnly, 0o755);
if (r3.status === 0) bad('write fail', 'should exit non-zero');
else if (fs.readFileSync(roOut, 'utf8') !== snapshot) bad('write fail', 'file was modified');
else ok('write failure leaves output untouched');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
