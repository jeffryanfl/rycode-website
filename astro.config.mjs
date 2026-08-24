// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  integrations: [sitemap()],
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

