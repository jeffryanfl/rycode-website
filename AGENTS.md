# Rycode website

Hub with three HOME doors: Economics, Risk, Systems. Tools stays at `/tools` but is off HOME. A.I. is the overhead brain, not a door. Live at https://rycode.dev. Built with Astro 6, deployed on Netlify.

This file is the map for Grok in T3 Code. Read `CONTEXT.md` for the site's words. Home is charcoal emptiness with three PNG hairline doors, a quiet A.I. tape at the top from `public/ai-tape.json` (HOME only; links to `/ai`), and a quiet Macro tape at the bottom from `public/tape.json` (HOME only; links to `/economics`). Systems goes out to https://grc.rycode.dev. Do not turn it into a conversion landing page unless Jeffrey asks. Do not copy openai.com, grok.com, or x.ai.

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

Live routes: home (`/`), Tools, Economics, Risk, A.I. (`/ai`), Control Effectiveness, Build vs. Buy, 404. Tools is live at `/tools` but not a HOME door. Systems is the last HOME door and goes out to https://grc.rycode.dev. Do not build GRC pages on this site. Vendor Concentration is out. The home brain links to `/ai`. `/ai` landing order: living bench plate, Labs (Anthropic, OpenAI, xAI, Google, Meta, DeepSeek), Open weight hub, System One strip (TypeSafe / Jev), Hardware, then Deep dive. Google lab is `/ai/models/google/`. Open-weight hub is `/ai/models/open-weight/` (Llama stays under Meta). Deep dive essays: `/ai/chat-models-write-strings-system-one-returns-decisions/` (System One / Jev) and `/ai/next-token-engine/` (RLVR) on the newspaper chassis, plus `/ai/ten-thousand-agents-is-not-a-genius/` on the A.I. masthead. Do not put Deep dive essays in Labs, Open weight, or System One, and do not clone `/tools` for them. xAI lab is `/ai/models/xai/` (Models, Grok Build, Grok Bot, Imagine, Voice). Meta lab is `/ai/models/meta/` (Muse + Llama). DeepSeek lab is `/ai/models/deepseek/` (V4 Flash lead card; V4 Pro still listed; R1/V3 archive). TypeSafe lab is `/ai/models/typesafe/` (Jev). Hardware is `/ai/hardware/` (fab ≠ campus), with `/ai/hardware/terafab/` and `/ai/hardware/memphis-colossus/`. Do not invent benchmarks, average Colossus GPU counts, or call Terafab a data center. Economics essays live under `/economics/`. Risk analyses live under `/risk/`. Old `/research` URLs 301. There is no Research door and no Insights door.

| Path | What it is |
|---|---|
| `src/pages/` | One `.astro` file per route. Live: `index`, `tools`, `economics`, `risk`, `ai`, `404`. Risk analyses live under `src/pages/risk/`. Economics essays live under `src/pages/economics/`. A.I. Deep dive essays at `src/pages/ai/next-token-engine.astro`, `src/pages/ai/chat-models-write-strings-system-one-returns-decisions.astro`, and `src/pages/ai/ten-thousand-agents-is-not-a-genius.astro`. Model doors and pages under `src/pages/ai/models/` (Anthropic, DeepSeek, Meta, OpenAI, TypeSafe, xAI). Hardware hub and pages under `src/pages/ai/hardware/`. `/systems` redirects to https://grc.rycode.dev. `/research` redirects to `/economics/`. |
| `src/layouts/` | Site shell. Variants: `landing` (hub + 404), `newspaper` (Jev and next-token essays), `tools` (charcoal index), `risk` (charcoal Risk index + digest analyses), `ai` (A.I. landing, lab doors, model pages, agents essay), `economics` (Economics index + essays), `journal` (unused default). No `research` variant. |
| `src/components/` | `LivingStrip.astro` — living facts strip + revision log from a `docs/…/*.facts.json` sidecar. Do not put Systems cards on this hub. |
| `src/styles/global.css` | Type, radii, shared chrome. Charcoal defaults. |
| `src/styles/landing.css` | Charcoal landing shell for home + 404. No chip, no coverflow. |
| `src/styles/hub.css` | Charcoal home: three doors, small brain, square Ry. |
| `src/styles/newspaper.css` | Charcoal A.I. Deep dive essays (`/ai/next-token-engine/`, `/ai/chat-models-write-strings-system-one-returns-decisions/`). Off-white hairlines. No cyan. |
| `src/styles/ai.css` | Charcoal A.I. landing, lab doors, model pages, and the agents digest. No cyan. |
| `src/styles/risk.css` | Charcoal Risk index + digest analyses. Triangle raster. No cyan. |
| `src/styles/economics.css` | Charcoal Economics index and essays. Bar-chart raster. No cyan. |
| `src/styles/living.css` | Living facts strip + revision log. Charcoal. No cyan. |
| `src/styles/research.css` | Unused. Do not restore a Research door. Lens PNG stays at `public/landing/hub-research.png`. |
| `src/styles/tools.css` | Charcoal Tools index |

**2. Standalone apps (vanilla)** — `public/`

HTML/CSS/JS tools that ship as static files. No Astro in these folders. Live: Control Effectiveness and Build vs. Buy.

| Path | What it is |
|---|---|
| `public/dashboards/` | Interactive calculators (when added) |
| `public/research/exhibits/` | SaaS exhibit files. Leave them here. |
| `public/anatomy/` | Explainers (when added) |
| `public/lab/` | Experiments (when added) |
| `public/projects/` | Case-study HTML (when added) |
| `public/fonts/`, `logo.svg`, `og-image.png` | Shared assets |

`public/` is copied to the site root. `/systems` is a redirect to https://grc.rycode.dev. A calculator is a file under `public/`.

## Where new work goes

- New Tools row → add it to the list in `src/pages/tools.astro`. Same charcoal index. Do not put Tools back on HOME unless Jeffrey asks.
- Systems work lives on https://grc.rycode.dev. Do not add a Systems room, `/grc` proxy, or GRC pages in this repo. The home Systems door goes out. Old `/systems` links redirect there.
- Do not add a Research door, an Insights door, or a `/research` landing. Old `/research` URLs 301. SaaS rows go under the “SaaS” heading on `/economics`. Canonical SaaS piece is `/economics/saas-barbell-2026/`. `/research/saaspocalypse` redirects there. Treasury essay is `/economics/ten-trillion-to-roll/` with facts at `docs/economics/ten-trillion-to-roll.facts.json`. Agents essay is `/ai/ten-thousand-agents-is-not-a-genius/`, source `docs/ai/ten-thousand-agents-is-not-a-genius.md`. Digest rails load `/digest-rail.js`. The A.I. essay terms rail loads `/terms-rail.js`. Both are public files. Do not inline those binders: live CSP only allows scripts with `src` from this origin. Do not invent copy. Do not add a SaaS home door.
- New Economics piece → `src/pages/economics/<slug>.astro` on the charcoal Economics paper (Newsreader title, italic dek, 1px rule, Inter headings, no cyan). Add a row on `/economics` only when it is published. Do not invent copy. SaaS pieces go in the SaaS section, not in the main list. Live: `/economics/post-inflation-dollars-pay-pre-inflation-debts/` (body + Sources; closer to spender-printer), `/economics/warsh-first-hike-oil-and-five-percent-ten-year/` (body + Sources; living strip + revision log from `docs/economics/warsh-first-hike-oil-and-five-percent-ten-year.facts.json`; do not rewrite thesis prose when refreshing facts), `/economics/still-1998-not-1999/`, `/economics/jobs-print-was-strong-mix-is-the-story/`, `/economics/ten-trillion-to-roll/` (living strip; closer “Risks this calls out” to six-percent), `/economics/saas-barbell-2026/` (SaaS section). Source: `docs/economics/`. Do not create `/economics/people-who-use-ai-get-the-jobs/`.
- New Risk analysis → `src/pages/risk/<slug>.astro` on the charcoal Risk digest (Layout `variant="risk"`, number-card right rail, Newsreader H1). Add one row under a named section on `src/pages/risk.astro` only when it is published. Headlines live in `docs/risk/`. Do not invent copy. Do not drop a long-wall draft. Do not use a hook, bell, or carabiner for the Risk mark. Do not create `/risk/emerging/`. Do not put Risk analyses back on the newspaper glossary chassis. Live analyses: `/risk/when-the-spender-runs-the-printer/`, `/risk/six-percent-that-stays/`, `/risk/panic-before-the-breach/`, `/risk/the-ban-lands-on-open-source/`.
- New calculator or HTML app → `public/<section>/<name>/` as `index.html`, `*.css`, `*.js`. Vanilla HTML/CSS/JS. Chart.js via CDN is allowed. Dark identity strip, flat working interior. No chip photo behind a form. Then add a row on Tools.
- Restore old work from git, then revamp the shell and UX. Keep the math. Do not add new product features on the first pass.
- Tools holds Build vs. Buy and Control Effectiveness as charcoal index rows. Economics is a charcoal index: signed chart, Inter “Economics”, italic dek, rows when a piece exists, plus a SaaS section. Economics essays use charcoal paper, no cyan. Risk is a charcoal index: signed triangle, Inter “Risk”, italic dek, named sections, rows. Analyses use the charcoal Risk digest, not newspaper cyan. No “Coming soon”. No fake rows. HOME doors are Economics, Risk, Systems (three-node triangle out to https://grc.rycode.dev), plus the A.I. brain. Tools is off HOME. No Research door. No Insights door. Vendor Concentration is out. Do not build GRC pages on rycode.dev. Do not redraw signed hub marks.
- Scratch files → `sandbox/` (gitignored). Never ship from there.
- Old pages live in git history. Do not resurrect them unless asked.

Astro is already the stack for `src/`. Do not add another framework. Do not rewrite `public/` apps into Astro unless asked.

## Look and feel

Home is charcoal emptiness (`#080a10`): three PNG hairline doors (Economics chart, Risk triangle, Systems three-node) at `rgba(248, 250, 252, 0.52)`, small overhead brain PNG, square Ry. Tools is off HOME; `/tools` still exists. Quiet charcoal A.I. tape at the top of HOME only, from `public/ai-tape.json` (asOf + up to three `Tag · text` lines, whole strip to `/ai`). Quiet charcoal Macro tape at the bottom of HOME only, from `public/tape.json` (asOf + up to three `Tag · text` lines, whole strip to `/economics`). Do not put either tape on `/ai`, `/economics`, 404, or other doors. Do not invent prices or extra lines. Inter only. No dollar, shield, COSO cube, cyan, glass, or hero sentence. Systems is not a room on this site. Tools is a charcoal index, same ground as home. `/ai` is charcoal. `/economics` is a charcoal index. `/risk` is a charcoal index, not GRC; Risk analyses use the charcoal digest rail.

- Type: Inter on the hub and on Economics/Risk. Newsreader for research claims. Geist Mono for research dates and data. Hardware plate uses Inter, Geist Mono, and italic Newsreader for the two claims.
- Hub values live in `hub.css`. Landing values in `landing.css` are the charcoal shell for home + 404. `/tools` uses `tools.css`: ground `#080a10`, signed caliper, no cyan. `/economics` uses `economics.css`: charcoal index and essays, no cyan. `/ai` landing, lab doors, model pages, and the agents essay use `ai.css`: charcoal, no cyan. A.I. Deep dive essays at `/ai/next-token-engine/` and `/ai/chat-models-write-strings-system-one-returns-decisions/` use `newspaper.css` (charcoal, off-white hairlines, no cyan). Risk analyses use `risk.css` digest. Cyan stays off the live journal.
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

