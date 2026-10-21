#!/usr/bin/env node
/**
 * Merge public/ai-tape.json feed[] into public/ai-feed-history.json.
 * Morning ship step: run after ai-tape.json is written. Reads ai-tape only;
 * never mutates lines[], asOfLabel, doorHref, updated, or date in that file.
 *
 * If feed[] is absent, exits 0 and leaves both files unchanged.
 * On error, leaves both files untouched and exits non-zero with a FAIL line.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileAtomic } from './lib/feed-io.mjs';
import { mergeAiFeedHistory, todayYmdLocal } from './lib/ai-feed-history-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAPE = process.env.AI_FEED_HISTORY_TAPE
  ? path.resolve(process.env.AI_FEED_HISTORY_TAPE)
  : path.join(ROOT, 'public/ai-tape.json');
const OUT = process.env.AI_FEED_HISTORY_OUT
  ? path.resolve(process.env.AI_FEED_HISTORY_OUT)
  : path.join(ROOT, 'public/ai-feed-history.json');
const SCHEMA = 'ai-feed-history-v1';

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

let tapeRaw;
let historyRaw;
try {
  tapeRaw = fs.readFileSync(TAPE, 'utf8');
} catch (err) {
  fail(`could not read ${path.relative(ROOT, TAPE)}: ${err.message}`);
}

let tape;
try {
  tape = JSON.parse(tapeRaw);
} catch {
  fail(`invalid JSON in ${path.relative(ROOT, TAPE)}`);
}

if (!Array.isArray(tape.feed)) {
  process.exit(0);
}

try {
  historyRaw = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
} catch (err) {
  fail(`could not read ${path.relative(ROOT, OUT)}: ${err.message}`);
}

let history = { schema: SCHEMA, updated: new Date(0).toISOString(), items: [] };
if (historyRaw) {
  try {
    history = JSON.parse(historyRaw);
  } catch {
    fail(`invalid JSON in ${path.relative(ROOT, OUT)}`);
  }
}

const prevItems = Array.isArray(history.items) ? history.items : [];
const todayYmd = todayYmdLocal();

let merged;
try {
  merged = mergeAiFeedHistory(prevItems, tape.feed, todayYmd);
} catch (err) {
  fail(`merge failed: ${err.message}`);
}

const next = {
  schema: SCHEMA,
  updated: new Date().toISOString(),
  items: merged,
};

const outText = `${JSON.stringify(next, null, 2)}\n`;

try {
  writeFileAtomic(OUT, outText);
} catch (err) {
  fail(`could not write ${path.relative(ROOT, OUT)}: ${err.message}`);
}

console.log(`wrote ${path.relative(ROOT, OUT)} (${merged.length} items)`);
