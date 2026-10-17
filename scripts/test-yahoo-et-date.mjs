#!/usr/bin/env node
/**
 * Dry run: October Yahoo bar dates must not shift when meta.gmtoffset moves at DST.
 * node scripts/test-yahoo-et-date.mjs
 */
import { yahooBarDateUtcSeconds, yahooBarDateLegacy } from './lib/yahoo-et-date.mjs';

/** Yahoo daily bar for 2026-10-30 (midnight America/New_York, still on EDT). */
const oct30Bar = Math.floor(Date.parse('2026-10-30T04:00:00Z') / 1000);
const correct = yahooBarDateUtcSeconds(oct30Bar);
const beforeDst = yahooBarDateLegacy(oct30Bar, -14400);
const afterDstEnds = yahooBarDateLegacy(oct30Bar, -18000);

let failed = 0;
if (correct !== '2026-10-30') {
  console.error(`FAIL: expected 2026-10-30, got ${correct}`);
  failed++;
}
if (beforeDst !== '2026-10-30') {
  console.error(`FAIL: EDT legacy should stay 2026-10-30, got ${beforeDst}`);
  failed++;
}
if (afterDstEnds === correct) {
  console.error('FAIL: legacy with post-DST offset should shift the October bar');
  failed++;
} else {
  console.log(`ok   legacy with post-DST offset shifts to ${afterDstEnds}; NY calendar stays ${correct}`);
}

process.exit(failed ? 1 : 0);
