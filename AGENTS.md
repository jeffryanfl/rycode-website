# Rycode website

Hub with five HOME marks in a row: Economics, Risk, Systems, A.I., and Opinions. A.I. is the brain mark. Opinions is the chat-bubble mark. Live at https://rycode.dev. Built with Astro 6, deployed on Netlify.

This file is the map for Grok in T3 Code. Read `CONTEXT.md` for the site's words. Home is charcoal emptiness with five marks in a row, a quiet A.I. tape at the top from `public/ai-tape.json` (HOME only; links to `/ai`), and a quiet Macro tape at the bottom from `public/tape.json` (HOME only; links to `/economics`). The Systems door and the Systems nav item open https://systems.rycode.dev in a new tab. Do not copy openai.com, grok.com, or x.ai.

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

Live routes: home (`/`), Economics, Risk, A.I. (`/ai`), Opinions (`/opinions`), About, Contact, Privacy, 404. Systems opens https://systems.rycode.dev in a new tab. Calculators are not on this site. Vendor Concentration is out. The home brain links to `/ai`. `/ai` landing order: bench charts (`src/components/AiBenchCharts.astro` with `BenchChart.astro`, built from `public/ai-benchmarks.json`; AA Index and Terminal-Bench 4.0, titles linked to those exams), line chart of the other shared benches (one color and lab mark per model), Labs (Anthropic, OpenAI, xAI, Google, Meta, DeepSeek), Labs & papers (lab homes and dated release chips), Open weight hub, System One strip (TypeSafe / Jev), Hardware, then Brief. Anthropic Models lead is Claude Opus 5.5 at `/ai/models/anthropic/claude-opus-5-5/`, then Sonnet 5.5 and Haiku 5.5 (`/ai/models/anthropic/claude-haiku-5-5/`, added 7 Oct 2026; its living bench row is AA Index only). Fable 5.1, Opus 5, Sonnet 5, and Haiku 4.5 stay. OpenAI Sol is `/ai/models/openai/gpt-6-sol/` with `/ai/models/openai/gpt-5-6-sol/` redirecting there; Luna is `/ai/models/openai/gpt-6-luna/`. Intelligent UI (a ChatGPT feature, not an API model) is `/ai/models/openai/gpt-6-intelligent-ui/`. Living bench OpenAI row stays GPT-6 Astra. Google lab is `/ai/models/google/` (Gemini 4 Argon at `/ai/models/google/gemini-4-argon/`). Open-weight hub is `/ai/models/open-weight/` (Llama stays under Meta). The long A.I. essays were pulled on 5 Oct 2026; their sources are in `docs/archive/pages/ai/` and their URLs 301 to `/ai/`. Do not link to them. xAI lab is `/ai/models/xai/` (Models, Grok Build, Grok Bot, Imagine, Voice). Meta lab is `/ai/models/meta/` (Muse + Llama). DeepSeek lab is `/ai/models/deepseek/` (V4 Flash lead card; V4 Pro still listed; R1/V3 archive). TypeSafe lab is `/ai/models/typesafe/` (Jev). Hardware is `/ai/hardware/` with five theme cards (power, cooling, chips, data centers, networks). Terafab is `/ai/hardware/chips/terafab/`. The chips index lists families (Blackwell, Rubin, MTIA, Instinct, Ironwood), not company contracts. Specs stay on those family pages. Meta's buy is `/ai/hardware/chips/meta/`. `/ai/hardware/chips/meta-nvidia/`, `/ai/hardware/chips/meta-amd/`, and `/ai/hardware/chips/meta-broadcom/` 301 there. Terafab stays the factory. Memphis / Colossus is `/ai/hardware/data-centers/memphis-colossus/`. `/ai/hardware/terafab/` and `/ai/hardware/memphis-colossus/` 301 to those pages. Do not invent benchmarks, average Colossus GPU counts, or call Terafab a data center. Economics essays live under `/economics/`. Risk analyses live under `/risk/`. Opinions live under `/opinions/` from `src/data/opinions.json` (empty hub until that array has rows). Old `/research` URLs 301. There is no Research door and no Insights door.

| Path | What it is |
|---|---|
| `src/pages/` | One `.astro` file per route. Live: `index`, `economics`, `risk`, `ai`, `opinions`, `about`, `contact`, `404`. Risk analyses live under `src/pages/risk/`. Economics essays live under `src/pages/economics/`. Opinions cards from `src/data/opinions.json`; piece pages from `src/pages/opinions/[slug].astro`. Long essays pulled on 5 Oct 2026 live in `docs/archive/pages/<door>/` (not built; old URLs 301 to the door in `public/_redirects` and `astro.config.mjs`). Watch-list briefs: `src/pages/risk/when-force-majeure-hits-the-ai-build-out.astro`, `src/pages/risk/six-percent-that-stays.astro`, `src/pages/risk/when-the-spender-runs-the-printer.astro`, `src/pages/risk/oil-and-the-100-line.astro`, `src/pages/economics/jobs-print-was-strong-mix-is-the-story.astro`, `src/pages/economics/still-1998-not-1999.astro`. Model doors and pages under `src/pages/ai/models/` (Anthropic, DeepSeek, Meta, OpenAI, TypeSafe, xAI). Hardware hub and pages under `src/pages/ai/hardware/`. `/research` redirects to `/economics/`. |
| `src/layouts/` | Site shell. Variants: `landing` (hub + 404), `risk` (charcoal Risk index + digest analyses), `ai` (A.I. landing, lab doors, model pages, deep dives), `economics` (Economics index + essays), `opinions` (Opinions index + pieces), `journal` (unused default). No `research` variant. |
| `src/components/` | Shared pieces (`RiskWatch.astro`, `RiskWatchList.astro`, bench charts, rails). The living facts strip, decoder, and path diagram used by the pulled essays are in `docs/archive/components/`; their fact sheets are in `docs/archive/<door>/`. Do not put Systems cards on this hub. |
| `src/styles/global.css` | Type, radii, shared chrome. Charcoal defaults. |
| `src/styles/landing.css` | Charcoal landing shell for home + 404. No chip, no coverflow. |
| `src/styles/hub.css` | Charcoal home: Economics, Risk, Systems, A.I., and Opinions marks, square Ry. Five doors on desktop; two columns under 720px. |
| `src/styles/opinions.css` | Charcoal Opinions card grid + piece chrome. Chat-bubble raster. No cyan. |
| `src/styles/paper.css` | Charcoal A.I. paper pages (`/ai/glossary/`, `/ai/what-xai-has-running/`, `/ai/swarms/what-an-agent-swarm-is/`). Off-white hairlines. No cyan. |
| `src/styles/ai.css` | Charcoal A.I. landing, lab doors, model pages, and the agents digest. No cyan. |
| `src/styles/risk.css` | Charcoal Risk index + digest analyses. Triangle raster. No cyan. |
| `src/styles/economics.css` | Charcoal Economics index and essays. Bar-chart raster. No cyan. |
| `src/styles/research.css` | Unused. Do not restore a Research door. Lens PNG stays at `public/landing/hub-research.png`. |

**2. Static files** — `public/`

Fonts, marks, and exhibit files. No calculator apps.

| Path | What it is |
|---|---|
| `public/fonts/` | Self-hosted type |
| `public/research/exhibits/` | SaaS exhibit files (their essay is archived; no live page uses them). Leave them here. |
| `public/anatomy/` | Explainers (when added) |
| `public/lab/` | Experiments (when added) |
| `public/projects/` | Case-study HTML (when added) |
| `public/fonts/`, `logo.svg`, `og-hub.png` | Shared assets. Social card is charcoal square Ry over “Rycode”. |

`public/` is copied to the site root.

## Feeds

Pages read these `public/*.json` feeds at build time. Never type a feed number into a page.

| Feed | Written by | When |
|---|---|---|
| `tape.json`, `ai-tape.json` | Tape routine | Morning push writes these two only. After-close push writes `tape.json`. |
| `macro-history.json` | After-close routine | After-close push |
| `economics-rail.json` | `node scripts/update-economics-rail.mjs` (yields, oil, debt, TGA) | After-close push |
| `jobs.json` | `node scripts/update-jobs.mjs` (BLS payrolls, unemployment, hourly earnings, participation, employment-population, three industries; FRED jobless claims) | After-close push |
| `inflation.json` | `node scripts/update-inflation.mjs` (BLS CPI and core CPI; BEA PCE and core PCE via FRED) | After-close push |
| `ai-contagion.json`, `debt-refi.json` | `scripts/update-ai-contagion.mjs`, `scripts/update-debt-refi.mjs` | By hand or a cloud agent |

- A code task never edits `tape.json`, `ai-tape.json`, `macro-history.json`, `ai-contagion.json`, or `debt-refi.json`. Seeding a new feed with its own script is fine.
- `jobs.json` and `inflation.json` points carry `status`: `preliminary` (the source still flags it, or it is the newest month of a series revised next release), `revised` (revised by schedule, or a later run saw a new value; `revisedFrom` keeps the old one), or `final`. A revision overwrites the value. Helpers are in `scripts/lib/econ-feeds.mjs`.
- The three Economics scripts write their file only when something besides `updated` changed, keep a failed series as it was, and exit 1 on a failure. BLS API v1 allows 25 requests a day; the two BLS scripts use one each.
- The watch lists read the reading feed first; a history feed (for example `economics-rail.json` behind `macro-history.json`) only fills dates the reading feed does not have.

After-close routine, in this order after the tape and `macro-history.json` steps:

```bash
node scripts/update-economics-rail.mjs   # public/economics-rail.json
node scripts/update-jobs.mjs             # public/jobs.json
node scripts/update-inflation.mjs        # public/inflation.json
```

## Brief format (locked 5 Oct 2026)

Every page behind a `/risk/` or `/economics/` watch-list row is a short brief. Model: `src/pages/risk/when-force-majeure-hits-the-ai-build-out.astro`.

- **URL.** Keep the URL the row already links to. If an essay lived there, copy it to `docs/archive/pages/<door>/` first, then overwrite.
- **Head.** `const title` is the row's risk name. `const subhead` is one plain sentence on the risk plus "The numbers below come from the /risk/ watch-list feed." Date is the publish day, set in `src/data/articles.json` and locked in `BRIEFS` in `scripts/build-chrome-assets.py`.
- **Backstory.** Static dated text, two or three short paragraphs. Only facts from the old page's own text or the feeds, each tied to a source.
- **Where we stand.** No hand-typed numbers. Sentences come from a pure template file (`src/lib/<name>-brief-text.ts`: numbers in, sentences out, no imports, so plain Node can test it) fed by an adapter (`src/lib/briefs.ts` or `ai-contagion-brief.ts`) that reads the row through `rowWindows()` / `chainStepWindows()` / `feedPoints()` in `src/lib/risk-watch.ts`, so the brief and the row show the same numbers. Open with a "Numbers as of <date>." line. Wording must follow the data: up/down, highest/lowest only when true, distance to the risk line. End with a computed strain line, and document the strain rule at the top of the template file.
- **What we're watching.** Levels that are numbers come from the feed (risk lines, averages, 52-week highs). Dated events and named items are static.
- **Sources.** Numbered, in order of first use, only sources the page cites.
- **Style.** About 550 words. Plain everyday language. Define jargon in the same sentence. No em dashes. No caveat or "unknown" language. Never invent a number.
- **Metadata.** Set `minutes` in `src/data/articles.json` (and `BRIEFS`) to the rendered reading time, because the computed sentences are invisible to `readingMinutes()`. Update `src/data/article-theses.json`, the card (`src/data/risk-cards.json` for `/risk/`, the `pieces` row on `src/pages/economics.astro` for `/economics/`), the concepts in `src/data/concepts.json`, and the row's `riskLine.quote` in `src/data/risk-watch.json` (a sentence on the brief that names the line). Redraw the og card: `python3 scripts/build-chrome-assets.py --og <slug>`.
- **Test.** Before shipping, run the template against altered numbers in a temp copy of the feeds (never edit `public/*.json`), check each wording branch, then delete the copy.

## Where new work goes

- Do not add a calculator section or put one on HOME.
- Systems in the header and on HOME opens https://systems.rycode.dev in a new tab. It is not a page on this site, and it is never the current-section highlight.
- Do not add a Research door, an Insights door, or a `/research` landing. Old `/research` URLs 301. SaaS rows go under the “SaaS” heading on `/economics`. The SaaS, Treasury, and agents essays were pulled on 5 Oct 2026 and 301 to their doors; `/research/saaspocalypse` goes to `/economics/`. Digest rails load `/digest-rail.js`, a public file. Do not inline that binder: live CSP only allows scripts with `src` from this origin. Do not invent copy. Do not add a SaaS home door.
- New Economics piece → `src/pages/economics/<slug>.astro` on the charcoal Economics paper (Newsreader title, italic dek, 1px rule, Inter headings, no cyan). Add a row on `/economics` only when it is published. Do not invent copy. SaaS pieces go in the SaaS section, not in the main list. Live briefs: `/economics/still-1998-not-1999/` (Paying up for the boom), `/economics/jobs-print-was-strong-mix-is-the-story/` (Payrolls and the jobs mix). Watch list on `/economics/` from `src/data/economics-watch.json`. Source: `docs/economics/`. Do not create `/economics/people-who-use-ai-get-the-jobs/`.
- New Risk analysis → `src/pages/risk/<slug>.astro` on the charcoal Risk digest (Layout `variant="risk"`, number-card right rail, Newsreader H1). Add one row under a named section on `src/pages/risk.astro` only when it is published. Sources for the pulled and replaced essays are in `docs/archive/<door>/`. Do not invent copy. Do not drop a long-wall draft. Do not use a hook, bell, or carabiner for the Risk mark. Do not create `/risk/emerging/`. Do not put Risk analyses on a separate glossary chassis. Live: four watch-list briefs, `/risk/when-force-majeure-hits-the-ai-build-out/` (AI build-out contagion), `/risk/six-percent-that-stays/` (The 30-year yield holds near 6%), and `/risk/when-the-spender-runs-the-printer/` (Debt refinancing), and `/risk/oil-and-the-100-line/` (Oil and the $100 line; moved from `/economics/warsh-first-hike-oil-and-five-percent-ten-year/` on 5 Oct 2026, old URL 301s here). Old `/risk/panic-before-the-breach/` and the pulled Risk essays 301 to `/risk/`. A page behind a `/risk/` watch-list row is a brief in the locked format below, not a long essay. The A.I. home door is `public/landing/hub-brain.webp` (the supplied brain drawing, 40px box, `/ai/`). Do not redraw the Economics, Risk, or Systems marks.
- New Opinions piece → add a row to `src/data/opinions.json` (`href`, `title`, `dek`, `date`, `related`, optional `image`). The hub at `/opinions/` is a card grid; it stays empty until that array has rows. The piece page is `src/pages/opinions/[slug].astro` (`/opinions/{slug}/`) with an Also-on-this-site list from `related[]`. Register the same piece in `src/data/articles.json` (`section` `opinions`), `src/data/article-theses.json`, and the matching `articles` arrays in `src/data/concepts.json`. The concept-map check must pass. Do not invent copy. Do not add a fake row.
- TODO(Scout): replace `public/landing/hub-opinions.webp` with a signed chat-bubble mark if the generated outline is off-weight versus `hub-risk.webp`.
- Restore old work from git, then revamp the shell and UX. Keep the math. Do not add new product features on the first pass.
- Economics is a charcoal index: signed chart, Inter “Economics”, rows when a piece exists, plus a SaaS section when a SaaS piece is live (none since 5 Oct 2026). Economics essays use charcoal paper, no cyan. Risk is a charcoal index: signed triangle, Inter “Risk”, named sections, charcoal topic chips, rows. Analyses use the charcoal Risk digest. Opinions is a charcoal card grid: signed chat bubble, Inter “Opinions”, cards when `opinions.json` has rows. No “Coming soon”. No fake rows. HOME marks are Economics, Risk, Systems, the A.I. brain, and Opinions. No Research door. No Insights door. Vendor Concentration is out. Do not redraw signed hub marks.
- Scratch files → `sandbox/` (gitignored). Never ship from there.
- Old pages live in git history. Do not resurrect them unless asked.

Astro is already the stack for `src/`. Do not add another framework. Do not rewrite `public/` apps into Astro unless asked.

## Look and feel

Home is charcoal emptiness (`#080a10`): Economics chart, Risk triangle, Systems three-node, the A.I. brain, and the Opinions chat bubble at `rgba(248, 250, 252, 0.52)`, square Ry. Quiet charcoal A.I. tape at the top of HOME only, from `public/ai-tape.json` (asOf + up to three `Tag · text` lines, whole strip to `/ai`). Quiet charcoal Macro tape at the bottom of HOME only, from `public/tape.json` (asOf + up to three `Tag · text` lines, whole strip to `/economics`). Do not put either tape on `/ai`, `/economics`, `/opinions`, 404, or other doors. Do not invent prices or extra lines. Inter only. No dollar, shield, COSO cube, cyan, glass, or hero sentence. `/ai` is charcoal. `/economics` is a charcoal index. `/risk` is a charcoal index. `/opinions` is a charcoal card grid. Risk analyses use the charcoal digest rail.

- Type: Inter on the hub and on Economics/Risk. Newsreader for research claims. Geist Mono for research dates and data. Hardware plate uses Inter, Geist Mono, and italic Newsreader for the two claims.
- Hub values live in `hub.css`. Landing values in `landing.css` are the charcoal shell for home + 404. `/economics` uses `economics.css`: charcoal index and essays, no cyan. `/ai` landing, lab doors, model pages, and the agents essay use `ai.css`: charcoal, no cyan. A.I. paper pages use `paper.css` (charcoal, off-white hairlines, no cyan). Risk briefs use `risk.css` digest. `/opinions` uses `opinions.css`: charcoal card grid and pieces, no cyan. Cyan stays off the live journal.
- Accessibility: semantic HTML, `aria-label` on controls, skip link, `:focus-visible`, `prefers-reduced-motion`.

The `landing-page-design` skill does **not** override this hub. Use it only if Jeffrey asks for a conversion landing page.

## How to work here

1. Propose before restructuring shared layout, styles, or data shapes.
2. Explain what changed and why, in plain English.
3. After UI changes, verify in the browser: desktop and a mobile width, the page you touched, and any hub that lists it.
4. Do not add npm packages or CDNs without saying so first.
5. The only Systems address is https://systems.rycode.dev. It opens in a new tab.

## Agent skills

### Issue tracker

GitHub Issues at jeffryanfl/rycode-website. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root and `docs/adr/` for decisions. See `docs/agents/domain.md`.

