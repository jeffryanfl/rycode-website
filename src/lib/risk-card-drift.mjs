import fs from 'node:fs';
import path from 'node:path';

/** Keep slugs comparable: leading slash, trailing slash. */
export function normalizeSlug(slug) {
  if (!slug) return '';
  let value = String(slug).trim();
  if (!value.startsWith('/')) value = `/${value}`;
  if (!value.endsWith('/')) value = `${value}/`;
  return value;
}

/** A page that only redirects is not an essay. */
function isRedirectStub(full) {
  const text = fs.readFileSync(full, 'utf8');
  if (!/return\s+Astro\.redirect\(/.test(text)) return false;
  const parts = text.split('---');
  const body = (parts.length >= 3 ? parts.slice(2).join('---') : '').trim();
  return body.length === 0;
}

/** Published /risk/ essay URLs from src/pages/risk/*.astro. */
export function riskArticleRoutes(pagesDir) {
  const riskDir = path.join(pagesDir, 'risk');
  if (!fs.existsSync(riskDir)) return [];
  const routes = [];
  for (const entry of fs.readdirSync(riskDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.astro')) continue;
    const full = path.join(riskDir, entry.name);
    if (isRedirectStub(full)) continue;
    const stem = entry.name.replace(/\.astro$/, '');
    routes.push(`/risk/${stem}/`);
  }
  return routes.sort();
}

/**
 * uncovered: essay URLs with no card record.
 * missing: card slugs that are not essay URLs.
 */
export function riskCardDrift(routes, records) {
  const known = new Set(routes.map(normalizeSlug));
  const seen = new Set();
  const missing = [];
  for (const record of records) {
    const slug = normalizeSlug(record?.slug);
    seen.add(slug);
    if (!known.has(slug)) missing.push(slug);
  }
  const uncovered = routes.map(normalizeSlug).filter((route) => !seen.has(route));
  return { uncovered, missing };
}

export function riskCardDriftWarning(uncovered, missing) {
  const blocks = [];
  if (uncovered.length) {
    blocks.push(
      'RISK CARD DRIFT: /risk/ article URLs with no card record:',
      ...uncovered.map((slug) => `  ${slug}`),
    );
  }
  if (missing.length) {
    blocks.push(
      'RISK CARD DRIFT: card records that are not /risk/ article URLs:',
      ...missing.map((slug) => `  ${slug}`),
    );
  }
  if (!blocks.length) return '';
  return `${blocks.join('\n')}\nThe risk cards are behind the articles. Fix these before you ship.`;
}

/** Read the card file and the essay pages. Warn, then throw. A clean set returns quietly. */
export function assertRiskCards(root = process.cwd()) {
  const routes = riskArticleRoutes(path.join(root, 'src', 'pages'));
  const file = path.join(root, 'src', 'data', 'risk-cards.json');
  const records = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { uncovered, missing } = riskCardDrift(routes, records);
  const warning = riskCardDriftWarning(uncovered, missing);
  if (!warning) return;
  console.error(`\n${warning}\n`);
  throw new Error(`\n${warning}\n`);
}
