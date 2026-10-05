// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import {
  articleRoutesFromPages,
  conceptDrift,
  driftWarning,
  pathsFromSitemapXml,
} from './src/lib/concept-drift.mjs';
import { assertRiskCards } from './src/lib/risk-card-drift.mjs';

function riskCardDrift() {
  return {
    name: 'risk-card-drift',
    hooks: {
      'astro:build:start': () => {
        assertRiskCards();
      },
    },
  };
}

function conceptMapDrift() {
  return {
    name: 'concept-map-drift',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const outDir = typeof dir === 'string' ? dir : fileURLToPath(dir);
        const sitemapPath = path.join(outDir, 'sitemap.xml');
        if (!fs.existsSync(sitemapPath)) {
          console.warn(
            'CONCEPT MAP DRIFT: build finished without dist/sitemap.xml, so the map was not checked.',
          );
          return;
        }
        const sitemapPaths = pathsFromSitemapXml(fs.readFileSync(sitemapPath, 'utf8'));
        const articleRoutes = articleRoutesFromPages(path.join(process.cwd(), 'src', 'pages'));
        const data = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'concepts.json'), 'utf8'),
        );
        const { uncovered, missing } = conceptDrift(articleRoutes, sitemapPaths, data.concepts);
        const warning = driftWarning(uncovered, missing);
        if (warning) {
          throw new Error(`\n${warning}\n`);
        }
      },
    },
  };
}
/** Vite serves public/foo/index.html at /foo/index.html, not /foo/. Rewrite so hub cards can use pretty paths in `npm run dev`. */
function servePublicIndex() {
  return {
    name: 'serve-public-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url?.split('?')[0] ?? '';
        if (raw.includes('.') || raw === '/') {
          next();
          return;
        }
        const dir = raw.replace(/\/$/, '');
        const indexPath = path.join(process.cwd(), 'public', dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          req.url = `${dir}/index.html`;
        }
        next();
      });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://rycode.dev',
  integrations: [riskCardDrift(), conceptMapDrift()],
  redirects: {
    '/research': '/economics/',
    '/research/ten-trillion-to-roll': '/economics/ten-trillion-to-roll/',
    '/research/saas-barbell-2026': '/economics/saas-barbell-2026/',
    '/research/ten-thousand-agents-is-not-a-genius': '/ai/ten-thousand-agents-is-not-a-genius/',
    '/research/saaspocalypse': '/economics/saas-barbell-2026/',
    '/ai/models/openai/gpt-5-6-sol': '/ai/models/openai/gpt-6-sol/',
    '/risk/panic-before-the-breach': '/risk/the-ban-lands-on-open-source/',
    '/ai/hardware/terafab': '/ai/hardware/chips/terafab/',
    '/ai/hardware/memphis-colossus': '/ai/hardware/data-centers/memphis-colossus/',
    '/ai/hardware/chips/meta-broadcom': '/ai/hardware/chips/meta/',
    '/ai/hardware/chips/meta-nvidia': '/ai/hardware/chips/meta/',
    '/ai/hardware/chips/meta-amd': '/ai/hardware/chips/meta/',
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  vite: {
    plugins: [servePublicIndex()],
    server: {
      allowedHosts: true,
    },
    preview: {
      allowedHosts: true,
    },
  },
});

