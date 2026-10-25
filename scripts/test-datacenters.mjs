#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homesFor, KWH_PER_HOME_YEAR_DEFAULT } from '../src/lib/homes-math.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const packPath = path.join(root, 'docs/ai/hardware.datacenters.json');
const plantsPath = path.join(root, 'docs/ai/hardware.plants.json');
const distRoot = path.join(root, 'dist/ai/hardware/data-centers');

const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
const plants = JSON.parse(fs.readFileSync(plantsPath, 'utf8'));
const dcPlantIds = new Set(
  plants.plants.filter((p) => p.theme === 'data-centers').map((p) => p.id),
);

const errors = [];

function fail(msg) {
  errors.push(msg);
}

function walkStrings(value, pathLabel, hits = []) {
  if (typeof value === 'string') {
    if (value.includes('\u2014') || value.includes('\u2013')) {
      hits.push(`${pathLabel}: em/en dash in "${value.slice(0, 80)}"`);
    }
    return hits;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkStrings(item, `${pathLabel}[${i}]`, hits));
    return hits;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      walkStrings(child, `${pathLabel}.${key}`, hits);
    }
  }
  return hits;
}

for (const dash of walkStrings(pack, 'pack')) {
  fail(dash);
}

for (const site of pack.sites) {
  if (!dcPlantIds.has(site.id)) {
    fail(`site ${site.id} has no data-centers plant id in hardware.plants.json`);
  }

  for (const key of site.sourceKeys) {
    if (!pack.sources[key]) fail(`site ${site.id}: sourceKeys references missing source ${key}`);
  }

  const image = site.image;
  if (!['official', 'illustration', 'pending'].includes(image.kind)) {
    fail(`site ${site.id}: image.kind must be official | illustration | pending`);
  }
  if (image.kind === 'official' && (!image.credit || !image.creditUrl)) {
    fail(`site ${site.id}: official image needs credit and creditUrl`);
  }
  if (image.kind === 'illustration' && !image.credit) {
    fail(`site ${site.id}: illustration image needs credit`);
  }

  if (site.compute) {
    if (!['stated', 'derived'].includes(site.compute.basis)) {
      fail(`site ${site.id}: compute.basis must be stated or derived`);
    }
    if (site.compute.basis === 'derived' && (!site.compute.method || !site.compute.chipHref)) {
      fail(`site ${site.id}: derived compute needs method and chipHref`);
    }
    if (!pack.sources[site.compute.source]) {
      fail(`site ${site.id}: compute source ${site.compute.source} missing`);
    }
  }

  const sourcedFields = [
    ['location', site.location],
    ['owner', site.owner],
    ['status', site.status],
    ['cooling', site.cooling],
    ['water', site.water],
    ['network', site.network],
    ['cost', site.cost],
    ['site', site.site],
  ];
  for (const [name, row] of sourcedFields) {
    if (row && row.text && row.source && !pack.sources[row.source]) {
      fail(`site ${site.id}: ${name} source ${row.source} missing`);
    }
  }
  if (site.power && !pack.sources[site.power.source]) {
    fail(`site ${site.id}: power source missing`);
  }
  if (site.operator?.source && !pack.sources[site.operator.source]) {
    fail(`site ${site.id}: operator source missing`);
  }
  for (const chip of site.chips) {
    if (!pack.sources[chip.source]) fail(`site ${site.id}: chip source ${chip.source} missing`);
  }
  for (const row of site.usedFor) {
    if (!pack.sources[row.source]) fail(`site ${site.id}: usedFor source missing`);
  }
  for (const row of site.extraRows) {
    if (!pack.sources[row.source]) fail(`site ${site.id}: extraRow source missing`);
  }
  for (const note of site.notes) {
    if (!pack.sources[note.source]) fail(`site ${site.id}: note source missing`);
  }
  for (const line of site.updates) {
    if (!pack.sources[line.source]) fail(`site ${site.id}: update source missing`);
  }

  if (site.notes.length > 4) fail(`site ${site.id}: notes max 4`);
  if (site.updates.length > 8) fail(`site ${site.id}: updates max 8`);
  if (site.extraRows.length > 2) fail(`site ${site.id}: extraRows max 2`);
}

const homesCases = [
  [100, '81,000'],
  [1000, '810,000'],
  [1200, '970,000'],
];
for (const [mw, expected] of homesCases) {
  const out = homesFor(mw, pack.realTerms.kwhPerHomeYear);
  if (!out.includes(expected)) {
    fail(`homesFor(${mw}) expected to include ${expected}, got ${out}`);
  }
  if (!out.startsWith('about ')) {
    fail(`homesFor(${mw}) must start with "about "`);
  }
}

if (KWH_PER_HOME_YEAR_DEFAULT !== 10791) fail('KWH_PER_HOME_YEAR_DEFAULT must be 10791');
if (!pack.sources['eia-home']) fail('missing eia-home source');
if (pack.realTerms.kwhPerHomeYear !== 10791) fail('realTerms.kwhPerHomeYear must be 10791');

const builtPages = [
  ['colossus', 'memphis-colossus'],
  ['stargate-abilene', 'stargate-abilene'],
  ['fairwater', 'fairwater'],
];

if (fs.existsSync(distRoot)) {
  for (const [, slug] of builtPages) {
    const htmlPath = path.join(distRoot, slug, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail(`missing built page ${htmlPath} (run npm run build before test)`);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('class="ai-dc-sources"')) {
      fail(`${slug}: Sources section must use ai-dc-sources (visible wrapper)`);
    }
    if (!html.includes('id="source-1"')) {
      fail(`${slug}: Sources list must start at source-1`);
    }
    if (html.includes('ai-model-section') && html.match(/Sources<\/h2>[\s\S]*ai-model-section:last-child/)) {
      fail(`${slug}: Sources must not be the hidden ai-model-section:last-child`);
    }
  }
}

if (errors.length) {
  console.error('test-datacenters: FAILED\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log(`test-datacenters: OK (${pack.sites.length} sites, homes math checked)`);
