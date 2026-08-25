# Rycode website

Hub with three doors: Systems, Tools, Research. Live at https://rycode.dev. Built with Astro 6, deployed on Netlify.

This file is the map for Grok in T3 Code. Read `CONTEXT.md` for the site's words. Keep the existing chip-and-glass home. Do not turn it into a conversion landing page unless Jeffrey asks.

## Commands

```bash
npm install          # Node >= 22.12
npm run dev          # http://localhost:4321
npm run build        # writes dist/
npm run preview      # serves dist/
```

New T3 Code threads default to a git worktree of this repo. `t3.json` links `node_modules` from the main checkout so you do not reinstall. After `npm run dev`, preview the site in T3 Code's browser. If the port is taken, use the URL printed in the terminal.

## Two layers

**1. Hub (Astro)** — `src/`

Home, section pages, 404. Shared chrome lives in `src/layouts/Layout.astro`.

Live routes: home (`/`), Tools, Research, A.I. (`/ai`), Control Effectiveness, Build vs. Buy, 404. Systems stays closed until it has a piece. Vendor Concentration is out. The home brain links to `/ai`. Do not put that essay on `/research` or clone `/tools` for it.

| Path | What it is |
|---|---|
| `src/pages/` | One `.astro` file per route. Live: `index`, `tools`, `research`, `ai`, `404`. `systems.astro` exists but has no pieces. `research.astro` is live with no pieces yet. |
| `src/layouts/` | Site shell |
| `src/components/` | `LandingTiles` for home and section cards |
| `src/styles/global.css` | Type, radii, shared chrome |
| `src/styles/landing.css` | Chip photo, glass tiles, landing chrome |

**2. Standalone apps (vanilla)** — `public/`

HTML/CSS/JS tools that ship as static files. No Astro in these folders. Live: Control Effectiveness and Build vs. Buy.

| Path | What it is |
|---|---|
| `public/dashboards/` | Interactive calculators (when added) |
| `public/research/` | Long pieces with their own HTML (when added) |
| `public/anatomy/` | Explainers (when added) |
| `public/lab/` | Experiments (when added) |
| `public/projects/` | Case-study HTML (when added) |
| `public/fonts/`, `logo.svg`, `og-image.png` | Shared assets |

`public/` is copied to the site root. `/systems` is an Astro section page. A calculator is a file under `public/`.

## Where new work goes

- New section page → `src/pages/tools.astro` or `research.astro`, same landing layout as `systems.astro`, using `LandingTiles`. Then make that tile a link on home.
- New piece on a section → add a card (`label`, `href`, `description`) to that page's `LandingTiles` items.
- New calculator or HTML app → `public/<section>/<name>/` as `index.html`, `*.css`, `*.js`. Vanilla HTML/CSS/JS. Chart.js via CDN is allowed. Dark masthead, flat working interior. No chip photo behind a form. Then add a card on the matching section.
- Restore old work from git, then revamp the shell and UX. Keep the math. Do not add new product features on the first pass.
- Tools holds Build vs. Buy and Control Effectiveness. Research is a live door with no pieces yet: add a card on `src/pages/research.astro` and the HTML under `public/research/<name>/`. Do not resurrect old research unless Jeffrey asks. Systems stays closed. Vendor Concentration is out. GRC stays off this site until Jeffrey says it is ready.
- Scratch files → `sandbox/` (gitignored). Never ship from there.
- Old pages live in git history. Do not resurrect them unless asked.

Astro is already the stack for `src/`. Do not add another framework. Do not rewrite `public/` apps into Astro unless asked.

## Look and feel

Home and section pages share one look: chip photograph, dark veil, glass tiles.

- Type: Newsreader (tile labels), Inter (card sentences, UI), Geist Mono (code/data).
- Landing values live in `landing.css`. Journal newsprint in `global.css` is leftover until apps need a working interior. `/ai` uses `newspaper.css`: charcoal paper, inverted Ry, cyan hairlines.
- Accessibility: semantic HTML, `aria-label` on controls, skip link, `:focus-visible`, `prefers-reduced-motion`.
- `public/` apps use `/journal-chrome.css` plus a local stylesheet. Keep that split. Restyle that chrome dark when the first app comes back.

The `landing-page-design` skill does **not** override this hub. Use it only if Jeffrey asks for a conversion landing page.

## How to work here

1. Propose before restructuring shared layout, styles, or data shapes.
2. Explain what changed and why, in plain English.
3. After UI changes, verify in the browser: desktop and a mobile width, the page you touched, and any hub that lists it.
4. Do not add npm packages or CDNs without saying so first (Chart.js CDN is already approved for dashboards).
5. GRC is a **separate** site: https://grc.rycode.dev/. Do not proxy `/grc` through this repo.

## Agent skills

### Issue tracker

GitHub Issues at jeffryanfl/rycode-website. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root and `docs/adr/` for decisions. See `docs/agents/domain.md`.

