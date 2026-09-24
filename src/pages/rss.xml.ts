import type { APIRoute } from 'astro';
import { articles, AUTHOR } from '../lib/site';

export const prerender = true;

const site = 'https://rycode.dev';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = () => {
  const items = [...articles].sort((a, b) => {
    if (a.date === b.date) return a.title.localeCompare(b.title);
    return a.date < b.date ? 1 : -1;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rycode</title>
    <link>${site}/</link>
    <description>Economics, risk, and systems.</description>
    <language>en</language>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items
      .map((item) => {
        const link = `${site}${item.href}`;
        const pubDate = new Date(`${item.date}T12:00:00Z`).toUTCString();
        return `<item>
      <title>${esc(item.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(item.description)}</description>
      <author>rycode@jrpost.com (${esc(AUTHOR)})</author>
    </item>`;
      })
      .join('\n    ')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
