import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EM_DASH = '\u2014';

/** Text a reader can see or a share card shows: body text, <title>, and alt/title/aria-label/meta content. */
export function visibleEmDashes(html) {
  const hits = [];
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const attrPattern = /\s(?:alt|title|aria-label|content|placeholder)="([^"]*)"/gi;
  let match = attrPattern.exec(stripped);
  while (match) {
    if (match[1].includes(EM_DASH)) hits.push(match[1].trim());
    match = attrPattern.exec(stripped);
  }
  const text = stripped.replace(/<[^>]+>/g, '\n');
  for (const line of text.split('\n')) {
    if (line.includes(EM_DASH)) hits.push(line.trim());
  }
  return [...new Set(hits)];
}

function htmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html') || entry.name === 'rss.xml') out.push(full);
  }
  return out;
}

/** Site rule: zero em dashes in site copy. Fails the build and names the page and the line. */
export function emDashCheck() {
  return {
    name: 'em-dash-check',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const outDir = typeof dir === 'string' ? dir : fileURLToPath(dir);
        const blocks = [];
        for (const file of htmlFiles(outDir)) {
          const hits = visibleEmDashes(fs.readFileSync(file, 'utf8'));
          if (!hits.length) continue;
          const route = `/${path.relative(outDir, file).split(path.sep).join('/')}`.replace(/index\.html$/, '');
          blocks.push(`  ${route}`, ...hits.map((hit) => `    ${hit.slice(0, 140)}`));
        }
        if (blocks.length) {
          throw new Error(
            `\nEM DASH CHECK: site copy has em dashes (rule is zero):\n${blocks.join('\n')}\nReplace them with a comma, colon, semicolon, or parentheses.\n`,
          );
        }
      },
    },
  };
}
