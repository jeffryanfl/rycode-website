# Rycode website

Hub with five doors: Research, Tools, Economics, Risk, Systems. Live at https://rycode.dev. Built with Astro 6, deployed on Netlify.

This file is the map for Grok in T3 Code. Read `CONTEXT.md` for the site's words. Home is charcoal emptiness with five stroke doors. Systems goes out to https://grc.rycode.dev. Do not turn it into a conversion landing page unless Jeffrey asks. Do not copy openai.com, grok.com, or x.ai.

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

Live routes: home (`/`), Tools, Research, Economics, Risk, A.I. (`/ai`), Control Effectiveness, Build vs. Buy, 404. Systems is the fifth home door and goes out to https://grc.rycode.dev. Do not build GRC pages on this site. Vendor Concentration is out. The home brain links to `/ai`. `/ai` is the A.I. split landing (Deep dive + Models). The RLVR essay lives only at `/ai/next-token-engine/`. Do not put that essay on `/research` or clone `/tools` for it. No Grok door. Economics essays live under `/economics/`, not under Research. Risk analyses live under `/risk/`.

| Path | What it is |
|---|---|
| `src/pages/` | One `.astro` file per route. Live: `index`, `tools`, `research`, `economics`, `risk`, `ai`, `404`. Research articles live under `src/pages/research/`. Risk analyses live under `src/pages/risk/`. Economics essays live under `src/pages/economics/`. A.I. essay at `src/pages/ai/next-token-engine.astro`. Model doors and pages under `src/pages/ai/models/`. `/systems` redirects to https://grc.rycode.dev. |
| `src/layouts/` | Site shell. Variants: `landing` (hub + 404), `newspaper` (A.I. essay only), `research` (journal), `tools` (charcoal index), `risk` (charcoal Risk index + digest analyses), `ai` (A.I. landing, lab doors, model pages), `economics` (Economics index + essays), `journal` (unused default). |
| `src/components/` | Empty. Do not put Systems cards on this hub. |
| `src/styles/global.css` | Type, radii, shared chrome. Charcoal defaults. |
| `src/styles/landing.css` | Charcoal landing shell for home + 404. No chip, no coverflow. |
| `src/styles/hub.css` | Charcoal home: five doors, small brain, square Ry. |
| `src/styles/newspaper.css` | Charcoal A.I. essay (`/ai/next-token-engine/`). Off-white hairlines. No cyan. |
| `src/styles/ai.css` | Charcoal A.I. landing, lab doors, model pages. No cyan. |
| `src/styles/risk.css` | Charcoal Risk index + digest analyses. Triangle raster. No cyan. |
| `src/styles/economics.css` | Charcoal Economics index and essays. Bar-chart raster. No cyan. |
| `src/styles/research.css` | Charcoal research journal |
| `src/styles/tools.css` | Charcoal Tools index |

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

`public/` is copied to the site root. `/systems` is a redirect to https://grc.rycode.dev. A calculator is a file under `public/`.

## Where new work goes

- New Tools row → add it to the list in `src/pages/tools.astro`. Same charcoal index. Then make that row a link on home if it is not already.
- Systems work lives on https://grc.rycode.dev. Do not add a Systems room, `/grc` proxy, or GRC pages in this repo. The home Systems door goes out. Old `/systems` links redirect there.
- New research essay → `src/pages/research/<slug>.astro` on the research paper (Newsreader title, dek, 1px rule, Inter headings). Add a normal row on `src/pages/research.astro` unless it belongs under a named section. SaaS rows go under the “SaaS” kicker, same treatment as “Emerging risks” on `/risk`. Canonical SaaS piece is `/research/saas-barbell-2026/` with a charcoal digest rail (number-card plates), not in-body charts. `/research/saaspocalypse/` redirects there. Treasury essay is `/research/ten-trillion-to-roll/`. Agents essay is `/research/ten-thousand-agents-is-not-a-genius/`. Source files live in `docs/research/`. Do not invent copy. Do not add a SaaS home door.
- New Economics piece → `src/pages/economics/<slug>.astro` on the charcoal Economics paper (Newsreader title, italic dek, 1px rule, Inter headings, no cyan). Add a row on `/economics` only when it is published. Do not invent copy. Do not clone the Research journal list onto `/economics`. Do not put Economics essays under `/research`. Live: `/economics/still-1998-not-1999/`, `/economics/jobs-print-was-strong-mix-is-the-story/`. Source: `docs/economics/`. Do not create `/economics/people-who-use-ai-get-the-jobs/`.
- New Risk analysis → `src/pages/risk/<slug>.astro` on the charcoal Risk digest (Layout `variant="risk"`, number-card right rail, Newsreader H1). Add one row under a named section on `src/pages/risk.astro` only when it is published. Headlines live in `docs/risk/`. Do not invent copy. Do not drop a long-wall draft. Do not use a hook, bell, or carabiner for the Risk mark. Do not create `/risk/emerging/`. Do not put Risk analyses back on the newspaper glossary chassis. Live analyses: `/risk/six-percent-that-stays/`, `/risk/panic-before-the-breach/`, `/risk/the-ban-lands-on-open-source/`.
- New calculator or HTML app → `public/<section>/<name>/` as `index.html`, `*.css`, `*.js`. Vanilla HTML/CSS/JS. Chart.js via CDN is allowed. Dark identity strip, flat working interior. No chip photo behind a form. Then add a row on Tools.
- Restore old work from git, then revamp the shell and UX. Keep the math. Do not add new product features on the first pass.
- Tools holds Build vs. Buy and Control Effectiveness as charcoal index rows. Research is a live journal door: identity on `/research`, essays as Astro pages, not the `/ai` newspaper. Economics is a charcoal index: signed chart, Inter “Economics”, italic dek, rows when a piece exists. Economics essays use charcoal paper, no cyan, not Research. Risk is a charcoal index: signed triangle, Inter “Risk”, italic dek, named sections, rows. Analyses use the charcoal Risk digest, not newspaper cyan. No “Coming soon”. No fake rows. Systems is the fifth home door (existing three-node triangle) and goes out to https://grc.rycode.dev. Vendor Concentration is out. Do not build GRC pages on rycode.dev. Do not redraw signed hub marks.
- Scratch files → `sandbox/` (gitignored). Never ship from there.
- Old pages live in git history. Do not resurrect them unless asked.

Astro is already the stack for `src/`. Do not add another framework. Do not rewrite `public/` apps into Astro unless asked.

## Look and feel

Home is charcoal emptiness (`#080a10`): five 1px doors (Research lens SVG, Tools compass SVG, Economics chart PNG, Risk triangle PNG, Systems three-node triangle SVG) at `rgba(248, 250, 252, 0.52)`, small overhead brain, square Ry. Inter only. No dollar, shield, COSO cube, cyan, glass, or hero sentence. Systems is not a room on this site. Tools is a charcoal index, same ground as home. Research is charcoal journal. `/ai` is charcoal. `/economics` is a charcoal index. `/risk` is a charcoal index, not GRC; Risk analyses use the charcoal digest rail.

- Type: Inter on the hub and on Economics/Risk. Newsreader for research claims. Geist Mono for research dates and data.
- Hub values live in `hub.css`. Landing values in `landing.css` are the charcoal shell for home + 404. `/tools` uses `tools.css`: ground `#080a10`, signed caliper, no cyan. `/research` uses `research.css`: ground `#080a10`, off-white ink, no cyan. `/economics` uses `economics.css`: charcoal index and essays, no cyan. `/ai` landing, lab doors, and model pages use `ai.css`: charcoal, no cyan. The A.I. essay at `/ai/next-token-engine/` uses `newspaper.css` (charcoal, off-white hairlines, no cyan). Risk analyses use `risk.css` digest. Cyan stays off the live journal.
- Accessibility: semantic HTML, `aria-label` on controls, skip link, `:focus-visible`, `prefers-reduced-motion`.
- `public/` apps use `/journal-chrome.css` plus a local stylesheet. Keep that split. Chrome is charcoal: Tools · job, square Ry, 1px hairline. Working interiors are flat charcoal with 1px `#f8fafc` panels.

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

