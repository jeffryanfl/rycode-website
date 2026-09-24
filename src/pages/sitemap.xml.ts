import type { APIRoute } from 'astro';
import { articles } from '../lib/site';

export const prerender = true;

const site = 'https://rycode.dev';

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
    if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
    paths.add(`/${route}/`);
  }

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
