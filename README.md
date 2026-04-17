# Rycode

Personal coding portfolio and workshop for Jeff Ryan. Built openly with AI,
shipped in vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.

**Live:** https://rycode.dev

---

## What's here

```
/
├── index.html                  # Landing page
├── styles.css                  # Shared design system (tokens, layout, components)
├── script.js                   # Shared site behavior (reveals, spotlight, nav, stats)
├── favicon.svg                 # "Ry" periodic-cell brand mark
├── og-image.png                # 1200×630 social card
├── og-image.html               # Source for og-image.png (local-only, gitignored)
├── _redirects                  # Netlify routing (proxies /grc/*)
├── robots.txt
├── LICENSE
│
├── projects/
│   └── grc.html                # GRC case-study page
│
├── dashboards/
│   └── build-vs-buy/           # Cost calculator — sliders, live chart
│       ├── index.html
│       ├── build-vs-buy.css
│       └── build-vs-buy.js
│
└── research/
    └── saaspocalypse/          # Emerging-risk briefing + 3 interactive charts
        ├── index.html
        ├── saaspocalypse.css
        ├── saaspocalypse.js
        └── saaspocalypse.pdf
```

## Running locally

No build step. Just serve the folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Regenerating the social card

`og-image.html` is the source for `og-image.png` (1200×630). If you change it,
regenerate the PNG with headless Chrome + sips:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1200,660 \
  --screenshot=og-image-raw.png "file://$(pwd)/og-image.html"
sips -c 630 1200 og-image-raw.png --out og-image.png
rm og-image-raw.png
```

## Deployment

Hosted on Netlify. DNS managed at Cloudflare. The `/grc/*` path is proxied
via `_redirects` to a separate password-protected Netlify site.

## License

All rights reserved. See [LICENSE](LICENSE) for the full terms. In short:
personal browser viewing is fine; copying, redistribution, or training
machine-learning models on this content is not.
