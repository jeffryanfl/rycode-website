# Rycode

Working notes and systems journal: editorial pages in Astro, plus standalone HTML apps under `public/`. Built with Astro. Deployed on Netlify.

**Live:** https://rycode.dev

## Run locally

Requires Node `>=22.12.0`.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build      # writes dist/
npm run preview    # serves dist/
```

## What's here

```
src/pages/     journal home, hub indexes (ai, build, economics, engineering,
               systems, technology, tools), and 404
src/           layouts, components, styles, data
public/        static assets and HTML apps — dashboards, research, anatomy,
               lab, projects — plus fonts, chrome, and og-image.png
scripts/       local helpers, including og-image.html
```

The sitemap (`@astrojs/sitemap`) lists Astro routes only. Apps under `public/` ship with the build but are not sitemap entries.

## Social card

`scripts/og-image.html` is the source for `public/og-image.png` (1200×630). The HTML is gitignored. To regenerate on macOS:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1200,660 \
  --screenshot=og-image-raw.png "file://$(pwd)/scripts/og-image.html"
sips -c 630 1200 og-image-raw.png --out public/og-image.png
rm og-image-raw.png
```

## Deployment

Netlify runs `npm run build` and publishes `dist/`. GRC lives on a separate site at https://grc.rycode.dev/.

## License

All rights reserved. See [LICENSE](LICENSE) for the full terms. In short: personal browser viewing is fine; copying, redistribution, or training machine-learning models on this content is not.

Contact: contact@rycode.dev
