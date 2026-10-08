import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { articles } from '../lib/site';
import { opinionPaths } from '../lib/opinions';

export const prerender = true;

const site = 'https://rycode.dev';

/** A page whose only job is Astro.redirect() is an old URL, not a page. Netlify answers it with a 301. */
function isRedirectOnly(globKey: string): boolean {
  const file = path.join(process.cwd(), 'src', 'pages', globKey.replace(/^\.\//, ''));
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, 'utf8');
  if (!/return\s+Astro\.redirect\(/.test(text)) return false;
  const parts = text.split('---');
  return (parts.length >= 3 ? parts.slice(2).join('---') : '').trim().length === 0;
}

function pageRoutes(): string[] {
  const modules = import.meta.glob('./**/*.astro');
  const paths = new Set<string>();

  for (const key of Object.keys(modules)) {
    if (key === './404.astro') continue;
    let route = key.replace(/^\.\//, '').replace(/\.astro$/, '');
    if (route === 'index') {
      paths.add('/');
      continue;
    }
    if (route.includes('[')) continue;
    if (isRedirectOnly(key)) continue;
    if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
    paths.add(`/${route}/`);
  }

  for (const href of opinionPaths()) paths.add(href);
  // The Opinions door stays on HOME, but an empty hub is not a page to send crawlers to.
  if (opinionPaths().length === 0) paths.delete('/opinions/');

  return [...paths].sort((a, b) => a.localeCompare(b));
}

export const GET: APIRoute = () => {
  const dates = new Map(articles.map((article) => [article.href, article.date]));
  const urls = pageRoutes()
    .map((route) => {
      const lastmod = dates.get(route);
      const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      return `<url><loc>${site}${route}</loc>${mod}</url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
