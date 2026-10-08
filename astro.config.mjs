// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emDashCheck } from './src/lib/copy-check.mjs';
import { defineConfig } from 'astro/config';
import {
  articleRoutesFromPages,
  conceptDrift,
  conceptShapeDrift,
  conceptShapeWarning,
  driftWarning,
  pathsFromSitemapXml,
  reachabilityDrift,
  reachabilityWarning,
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
          throw new Error(
            'CONCEPT MAP DRIFT: build finished without dist/sitemap.xml, so the map was not checked.',
          );
        }
        const sitemapPaths = pathsFromSitemapXml(fs.readFileSync(sitemapPath, 'utf8'));
        const articleRoutes = articleRoutesFromPages(path.join(process.cwd(), 'src', 'pages'));
        const data = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'concepts.json'), 'utf8'),
        );
        const { uncovered, missing } = conceptDrift(articleRoutes, sitemapPaths, data.concepts);
        const { empty, badLinks } = conceptShapeDrift(data.concepts);
        const { unreachable } = reachabilityDrift(outDir, sitemapPaths);
        const warning = [
          driftWarning(uncovered, missing),
          conceptShapeWarning(empty, badLinks),
          reachabilityWarning(unreachable),
        ]
          .filter(Boolean)
          .join('\n\n');
        if (warning) {
          console.error(`\n${warning}\n`);
          throw new Error(`\n${warning}\n`);
        }
        console.log(
          `concept-map-drift: ${articleRoutes.length} articles mapped, ${data.concepts.length} concepts, ${sitemapPaths.length} sitemap URLs checked, all reachable from HOME.`,
        );
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
  integrations: [riskCardDrift(), conceptMapDrift(), emDashCheck()],
  redirects: {
    '/research': '/economics/',
    '/research/ten-trillion-to-roll': '/economics/',
    '/research/saas-barbell-2026': '/economics/',
    '/research/ten-thousand-agents-is-not-a-genius': '/ai/ten-thousand-agents-is-not-a-genius/',
    '/research/saaspocalypse': '/economics/',
    '/ai/models/openai/gpt-5-6-sol': '/ai/models/openai/gpt-6-sol/',
    '/risk/panic-before-the-breach': '/risk/',
    '/ai/hardware/terafab': '/ai/hardware/chips/terafab/',
    '/ai/hardware/memphis-colossus': '/ai/hardware/data-centers/memphis-colossus/',
    // Oil brief moved to /risk/ on 5 Oct 2026.
    '/economics/warsh-first-hike-oil-and-five-percent-ten-year': '/risk/oil-and-the-100-line/',
    // Economics, risk, and opinions essays pulled on 5 Oct 2026 stay at the door. The six A.I. essays are live again.
    '/economics/long-yields-hike-ai-credit-stress': '/economics/',
    '/economics/post-inflation-dollars-pay-pre-inflation-debts': '/economics/',
    '/economics/saas-barbell-2026': '/economics/',
    '/economics/ten-trillion-to-roll': '/economics/',
    '/risk/the-ban-lands-on-open-source': '/risk/',
    '/opinions/the-license-starts-at-their-scale': '/opinions/',
  },
  build: {
    // public/_redirects answers every old URL above with a 301 on Netlify. Without this,
    // Astro also writes a meta-refresh page for each one, and /old-url/index.html serves a 200.
    // Add any new redirect to public/_redirects (both slash forms) as well as here.
    redirects: false,
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

