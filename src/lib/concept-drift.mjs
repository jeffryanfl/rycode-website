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

/**
 * empty: concepts with no articles (a map node that leads nowhere).
 * badLinks: concept links that point at a concept id that does not exist.
 */
export function conceptShapeDrift(concepts) {
  const ids = new Set(concepts.map((concept) => concept.id));
  const empty = concepts.filter((concept) => !(concept.articles || []).length).map((concept) => concept.id);
  const badLinks = [];
  for (const concept of concepts) {
    for (const link of concept.links || []) {
      if (!ids.has(link)) badLinks.push({ from: concept.id, to: link });
    }
  }
  return { empty, badLinks };
}

export function conceptShapeWarning(empty, badLinks) {
  const blocks = [];
  if (empty.length) {
    blocks.push('CONCEPT MAP DRIFT: concepts with no articles:', ...empty.map((id) => `  ${id}`));
  }
  if (badLinks.length) {
    blocks.push(
      'CONCEPT MAP DRIFT: concept links to a concept that does not exist:',
      ...badLinks.map((item) => `  ${item.from} -> ${item.to}`),
    );
  }
  if (!blocks.length) return '';
  return `${blocks.join('\n')}\nGive each concept an article or remove it, and fix its links.`;
}

function builtFile(outDir, route) {
  const file = path.join(outDir, route.replace(/^\//, ''), route.endsWith('/') ? 'index.html' : '');
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function isMetaRefresh(html) {
  return /<meta[^>]+http-equiv=["']?refresh/i.test(html);
}

/**
 * Follow same-site links in the built HTML, starting at HOME.
 * unreachable: sitemap URLs that no chain of links from HOME (nav, door pages, cards, the map) reaches.
 */
export function reachabilityDrift(outDir, sitemapPaths, site = 'https://rycode.dev') {
  const origin = new URL(site).origin;
  const seen = new Set();
  const queue = ['/'];
  while (queue.length) {
    const route = queue.pop();
    if (seen.has(route)) continue;
    seen.add(route);
    const file = builtFile(outDir, route);
    if (!file || !file.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    const pattern = /href="([^"]+)"/g;
    let match = pattern.exec(html);
    while (match) {
      let url;
      try {
        url = new URL(match[1], `${origin}${route}`);
      } catch {
        url = null;
      }
      match = pattern.exec(html);
      if (!url || url.origin !== origin) continue;
      let next = url.pathname;
      const last = next.split('/').pop() || '';
      if (!next.endsWith('/') && !last.includes('.')) next = `${next}/`;
      if (!seen.has(next)) queue.push(next);
    }
  }
  const unreachable = sitemapPaths.filter((route) => {
    if (seen.has(route)) return false;
    const file = builtFile(outDir, route);
    // An old URL that only redirects is not a page a reader needs to reach.
    if (file && isMetaRefresh(fs.readFileSync(file, 'utf8'))) return false;
    return true;
  });
  return { unreachable };
}

export function reachabilityWarning(unreachable) {
  if (!unreachable.length) return '';
  return [
    'ORPHAN PAGE DRIFT: sitemap URLs no link reaches from HOME (nav, door pages, cards, or the map):',
    ...unreachable.map((route) => `  ${route}`),
    'Link each one from its door page or a concept, or take it out of the build.',
  ].join('\n');
}
