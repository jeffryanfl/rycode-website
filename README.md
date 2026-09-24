# Rycode

Economics, risk, and systems, plus an A.I. branch. Astro hub plus standalone HTML apps under `public/`. Deployed on Netlify.

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
src/pages/     home (`/`, Economics, Risk, and the A.I. brain), Economics, Risk, A.I. (`/ai`), About, Contact, 404. Old `/research` URLs redirect.
src/           layouts, components, styles
public/        fonts, logo, chrome, og-hub.png. HTML apps go here when added.
scripts/       local helpers, including og-card.html
```

`/sitemap.xml` lists the Astro routes.

## Social card

`scripts/og-card.html` is the source for `public/og-hub.png` (1200×630). Charcoal square Ry over “Rycode”. To regenerate on macOS:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1200,660 \
  --screenshot=og-card-raw.png "file://$(pwd)/scripts/og-card.html"
sips -c 630 1200 og-card-raw.png --out public/og-hub.png
rm og-card-raw.png
```

## Deployment

Netlify runs `npm run build` and publishes `dist/`.

## License

All rights reserved. See [LICENSE](LICENSE) for the full terms. In short: personal browser viewing is fine; copying, redistribution, or training machine-learning models on this content is not.

Contact: contact@rycode.dev
