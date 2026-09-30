import fs from 'node:fs';
import path from 'node:path';

const SECTION_ROOTS = new Set(['ai.astro', 'economics.astro', 'risk.astro', 'opinions.astro']);

/** Leaf essay and model pages. Section landings and site chrome are not articles. */
export function articleRoutesFromPages(pagesDir) {
  const routes = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.astro')) continue;
      const rel = path.relative(pagesDir, full).split(path.sep).join('/');
      if (!isArticleFile(rel)) continue;
      if (isRedirectStub(full)) continue;
      routes.push(routeFromRel(rel));
    }
  }

  walk(pagesDir);

  const opinionsFile = path.join(pagesDir, '..', 'data', 'opinions.json');
  if (fs.existsSync(opinionsFile)) {
    const rows = JSON.parse(fs.readFileSync(opinionsFile, 'utf8'));
    for (const row of rows) {
      if (!row?.href) continue;
      const href = row.href.endsWith('/') ? row.href : `${row.href}/`;
      routes.push(href);
    }
  }

  return [...new Set(routes)].sort();
}

/** A page that only redirects is not an essay. The plant body lives at the new path. */
function isRedirectStub(full) {
  const text = fs.readFileSync(full, 'utf8');
  if (!/return\s+Astro\.redirect\(/.test(text)) return false;
  const parts = text.split('---');
  const body = (parts.length >= 3 ? parts.slice(2).join('---') : '').trim();
  return body.length === 0;
}

function isArticleFile(rel) {
  if (!rel.endsWith('.astro')) return false;
  if (rel.includes('[')) return false;
  if (rel === '404.astro' || rel === 'index.astro') return false;
  if (rel.endsWith('/index.astro')) return false;
  if (SECTION_ROOTS.has(rel)) return false;
  const top = rel.split('/')[0].replace(/\.astro$/, '');
  return top === 'economics' || top === 'risk' || top === 'ai' || top === 'opinions';
}

function routeFromRel(rel) {
  let route = rel.replace(/\.astro$/, '');
  if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
  return `/${route}/`;
}

export function pathsFromSitemapXml(xml) {
  const paths = [];
  const pattern = /<loc>([^<]+)<\/loc>/g;
  let match = pattern.exec(xml);
  while (match) {
    try {
      const pathname = new URL(match[1].trim()).pathname;
      paths.push(pathname.endsWith('/') ? pathname : `${pathname}/`);
    } catch {
      paths.push(match[1].trim());
    }
    match = pattern.exec(xml);
  }
  return paths;
}

/**
 * uncovered: sitemap article URLs that no concept lists.
 * missing: concept slugs that are not article URLs.
 */
export function conceptDrift(articleRoutes, sitemapPaths, concepts) {
  const published = new Set(sitemapPaths);
  const real = new Set(articleRoutes);
  const covered = new Set();
  const missing = [];

  for (const concept of concepts) {
    for (const slug of concept.articles || []) {
      covered.add(slug);
      if (!real.has(slug)) missing.push({ slug, concept: concept.id });
    }
  }

  const uncovered = articleRoutes.filter((route) => published.has(route) && !covered.has(route));
  return { uncovered, missing };
}

export function driftWarning(uncovered, missing) {
  const blocks = [];
  if (uncovered.length) {
    blocks.push(
      'CONCEPT MAP DRIFT: sitemap article URLs with no concept:',
      ...uncovered.map((slug) => `  ${slug}`),
    );
  }
  if (missing.length) {
    blocks.push(
      'CONCEPT MAP DRIFT: concept slugs that are not article URLs:',
      ...missing.map((item) => `  ${item.slug} (${item.concept})`),
    );
  }
  if (!blocks.length) return '';
  return `${blocks.join('\n')}\nThe concept map is behind the site. Fix these before you ship.`;
}
