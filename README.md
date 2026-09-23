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
src/pages/     home (`/`, three charcoal doors plus the A.I. brain), Tools, Economics, Risk, A.I. (`/ai`), 404. Systems door goes to https://grc.rycode.dev. Old `/research` URLs redirect.
src/           layouts, components, styles
public/        fonts, logo, chrome, og-hub.png. HTML apps go here when added.
scripts/       local helpers, including og-card.html
```

The sitemap (`@astrojs/sitemap`) lists Astro routes only. Apps under `public/` ship with the build but are not sitemap entries.

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

Netlify runs `npm run build` and publishes `dist/`. GRC lives on a separate site at https://grc.rycode.dev/.

## License

All rights reserved. See [LICENSE](LICENSE) for the full terms. In short: personal browser viewing is fine; copying, redistribution, or training machine-learning models on this content is not.

Contact: contact@rycode.dev
