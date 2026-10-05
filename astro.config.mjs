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
    '/research/ten-trillion-to-roll': '/economics/',
    '/research/saas-barbell-2026': '/economics/',
    '/research/ten-thousand-agents-is-not-a-genius': '/ai/',
    '/research/saaspocalypse': '/economics/',
    '/ai/models/openai/gpt-5-6-sol': '/ai/models/openai/gpt-6-sol/',
    '/risk/panic-before-the-breach': '/risk/',
    '/ai/hardware/terafab': '/ai/hardware/chips/terafab/',
    '/ai/hardware/memphis-colossus': '/ai/hardware/data-centers/memphis-colossus/',
    '/ai/hardware/chips/meta-broadcom': '/ai/hardware/chips/meta/',
    '/ai/hardware/chips/meta-nvidia': '/ai/hardware/chips/meta/',
    '/ai/hardware/chips/meta-amd': '/ai/hardware/chips/meta/',
    // Long essays pulled from the live site on 5 Oct 2026; sources in docs/archive/pages/.
    '/economics/long-yields-hike-ai-credit-stress': '/economics/',
    '/economics/post-inflation-dollars-pay-pre-inflation-debts': '/economics/',
    '/economics/saas-barbell-2026': '/economics/',
    '/economics/ten-trillion-to-roll': '/economics/',
    '/risk/the-ban-lands-on-open-source': '/risk/',
    '/opinions/the-license-starts-at-their-scale': '/opinions/',
    '/ai/meta-named-an-enterprise-stack': '/ai/',
    '/ai/frontier-price-meets-open-weight-ipo': '/ai/',
    '/ai/grok-bot-set-a-new-bar': '/ai/',
    '/ai/chat-models-write-strings-system-one-returns-decisions': '/ai/',
    '/ai/ten-thousand-agents-is-not-a-genius': '/ai/',
    '/ai/next-token-engine': '/ai/',
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

