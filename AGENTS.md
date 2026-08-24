# Rycode website

Personal technology and systems journal. Live at https://rycode.dev. Built with Astro 6, deployed on Netlify.

This file is the map for Grok in T3 Code. Read `CONTEXT.md` for the site's words. Do not replace this journal with a conversion landing page unless Jeffrey asks.

## Commands

```bash
npm install          # Node >= 22.12
npm run dev          # http://localhost:4321
npm run build        # writes dist/
npm run preview      # serves dist/
```

New T3 Code threads default to a git worktree of this repo. `t3.json` links `node_modules` from the main checkout so you do not reinstall. After `npm run dev`, preview the site in T3 Code's browser. If the port is taken, use the URL printed in the terminal.

## Two layers

**1. Journal (Astro)** — `src/`

Editorial pages: home, hubs, 404. Shared chrome lives in `src/layouts/Layout.astro`.

| Path | What it is |
|---|---|
| `src/pages/` | One `.astro` file per route (`index`, `ai`, `build`, `economics`, `engineering`, `systems`, `technology`, `tools`, `404`) |
| `src/layouts/` | Site shell |
| `src/components/` | Shared pieces (`HeaderBannerNav`, `HubList`, …) |
| `src/styles/global.css` | Colors, type, radii, chrome. Source of truth for look. |
| `src/styles/landing.css` | Home (`/`) only |
| `src/data/` | JSON used by pages |
| `src/scripts/` | Site JS loaded by the layout |

**2. Standalone apps (vanilla)** — `public/`

HTML/CSS/JS tools that ship as static files. No Astro in these folders.

| Path | What it is |
|---|---|
| `public/dashboards/` | Interactive calculators |
| `public/research/` | Long pieces with their own HTML |
| `public/anatomy/` | Explainers |
| `public/lab/` | Experiments |
| `public/projects/` | Case-study HTML |
| `public/fonts/`, `logo.svg`, `og-image.png` | Shared assets |

`public/` is copied to the site root. `/tools` is an Astro hub; `/dashboards/grocery-swap-calc/` is a file under `public/`.

## Where new work goes

- New journal/hub page → `src/pages/<name>.astro` using `Layout.astro`. Link it from the right hub with `HubList`.
- New calculator or HTML app → `public/<section>/<name>/` as `index.html`, `*.css`, `*.js`. Vanilla HTML/CSS/JS. Chart.js via CDN is allowed. Then add a card on the matching hub.
- Visual values for the journal chrome → CSS custom properties in `src/styles/global.css`. Do not invent one-off colors.
- Scratch files → `sandbox/` (gitignored). Never ship from there.
- `archive/` is old pages. Do not resurrect unless asked.

Astro is already the stack for `src/`. Do not add another framework. Do not rewrite `public/` apps into Astro unless asked.

## Look and feel

This is an editorial broadsheet, not a marketing landing page.

- Type: Newsreader (headlines), Inter (body), Geist Mono (code/data).
- Palette and radii: `--bg`, `--text`, `--blue`, `--radius-*` in `global.css`.
- Accessibility: semantic HTML, `aria-label` on controls, skip link, `:focus-visible`, `prefers-reduced-motion`.
- `public/` apps use `/journal-chrome.css` plus a local stylesheet. Keep that split.

The `landing-page-design` skill does **not** override this journal. Use it only if Jeffrey asks for a conversion landing page.

## How to work here

1. Propose before restructuring shared layout, styles, or data shapes.
2. Explain what changed and why, in plain English.
3. After UI changes, verify in the browser: desktop and a mobile width, the page you touched, and any hub that lists it.
4. Do not add npm packages or CDNs without saying so first (Chart.js CDN is already approved for dashboards).
5. GRC is a **separate** site: https://grc.rycode.dev/. Do not proxy `/grc` through this repo.
