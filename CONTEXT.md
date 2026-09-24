# CONTEXT.md

Glossary for this repo. Use these words in conversation and in code names.

**Rycode.** A hub with four HOME marks in a two-by-two: Economics, Risk, Systems, and A.I. Live site: https://rycode.dev. A.I. is the brain mark. Systems opens https://systems.rycode.dev in a new tab. There is no Research door and no Insights door.

**Home.** Charcoal `#080a10` emptiness at `/`. Four marks in a two-by-two: Economics and Risk on top, Systems and A.I. on the bottom. The A.I. mark is the overhead wireframe brain. Square Ry 26 in a corner. Quiet charcoal A.I. tape at the top of HOME only (`public/ai-tape.json`, fetch on the client, links to `/ai`). Quiet charcoal Macro tape at the bottom of HOME only (`public/tape.json`, fetch on the client, links to `/economics`). Not on other pages. Inter only. No cyan, no floor grid, no glass windows, no coverflow, no hero sentence.

**Brain.** Overhead two-hemisphere wireframe. It is the A.I. mark in the bottom-right of the HOME square. Link to `/ai`. Not a glass window, not a chip card, not a hero.

**A.I.** Charcoal branch at `/ai`: signed brain, Inter “A.I.”, Deep dive rows plus Models cards (Anthropic, DeepSeek, Meta, OpenAI, TypeSafe, xAI) and a Hardware row. No cyan. Deep dive essays: `/ai/chat-models-write-strings-system-one-returns-decisions/` (System One / Jev) and `/ai/next-token-engine/` (RLVR) use `paper.css` on the A.I. masthead. `/ai/ten-thousand-agents-is-not-a-genius/` is the agents essay on the A.I. masthead (`variant="ai"`, `ai.css`, number-card digest). Do not put Deep dive essays in Labs, Open weight, or System One. Lab doors at `/ai/models/anthropic/`, `/ai/models/deepseek/` (V4 Flash lead; V4 Pro still listed; R1/V3 archive), `/ai/models/meta/` (Muse + Llama), `/ai/models/openai/`, `/ai/models/typesafe/` (Jev), and `/ai/models/xai/` (five Grok doors: Models, Grok Build, Grok Bot, Imagine, Voice). Do not invent Meta benches, Llama 3.x cards, or DeepSeek Arena/HLE scores. Current DeepSeek line is V4 — do not lead with V3/R1. Hardware hub at `/ai/hardware/` teaches fab ≠ campus: Terafab (chip fab) vs Memphis / Colossus (training campus). Model pages under lab paths from `docs/ai/`. Entered from the home brain. Not a Tools clone. Do not invent benchmarks, average Colossus GPU counts, or call Terafab a data center.

**Paper look.** Charcoal paper near `#080a10`, off-white ink, off-white hairlines. Newsreader for the claim and body, Inter for kickers and captions, Geist Mono for stage ticks and eval names. Square Ry. Used by A.I. Deep dive essays (`/ai/next-token-engine/`, `/ai/chat-models-write-strings-system-one-returns-decisions/`). Not cream newsprint, not the chip photo, not coverflow, not cyan.

**Section page.** `/economics` is a charcoal index: signed chart, Inter title, rows, plus a SaaS section. `/risk` is a charcoal index: signed triangle, Inter title, named sections, charcoal topic chips, rows. Logo goes home. No pillar rail. `/ai` is not a section page. Old `/research` links 301 to `/economics/` or to the rehomed essay.

**Research.** Not a HOME door and not a landing. `/research` and `/research/` 301 to `/economics/`. Old essay URLs 301 to the subject page. `/research/saaspocalypse` and `/research/saaspocalypse/` 301 to `/economics/saas-barbell-2026/`. Do not add an Insights door. The lens PNG stays at `/landing/hub-research.png` and is not on HOME. `src/styles/research.css` is unused. Do not wire `variant="research"` back.

**Economics.** Charcoal `#080a10` at `/economics`, same ground as home. Bar-chart PNG from `/landing/hub-economics.png`, Inter “Economics”. Square Ry, 1px hairline, then rows. No “Coming soon”. No cyan. Essays are Astro pages at `/economics/[slug]`, charcoal paper: Newsreader title, dek, Inter headings, digest rail when signed. Live rows, in order: `/economics/post-inflation-dollars-pay-pre-inflation-debts/` (body + Sources; closer to spender-printer), `/economics/warsh-first-hike-oil-and-five-percent-ten-year/` (body + Sources; living strip from the facts sidecar; thesis stays in the `.astro` file), `/economics/still-1998-not-1999/`, `/economics/jobs-print-was-strong-mix-is-the-story/`, `/economics/ten-trillion-to-roll/` (two-panel exhibits; living strip from `docs/economics/ten-trillion-to-roll.facts.json`; closer “Risks this calls out” to `/risk/six-percent-that-stays/`). SaaS section: `/economics/saas-barbell-2026/` (two-panel exhibits; `/research/saaspocalypse` redirects here). Source: `docs/economics/`. Do not create `/economics/people-who-use-ai-get-the-jobs/`. Do not move SaaS exhibit files out of `public/research/exhibits/` unless asked.

**Risk.** Charcoal `#080a10` at `/risk`, same ground as home. Warning-triangle PNG from `/landing/hub-risk.png`, Inter “Risk”. Square Ry, 1px hairline, named sections, charcoal topic chips, then rows. No cyan. No “Coming soon”. No hook, bell, or carabiner. Not a control-framework page, not L2. Analyses are charcoal digest pages at `/risk/[slug]`: Newsreader H1, number-card right rail, How to read / Quiet / Related. Live: `/risk/when-the-spender-runs-the-printer/` (kicker “Paying Pre-Inflation Debt with Post-Inflation Cash”; closer from `/economics/post-inflation-dollars-pay-pre-inflation-debts/`), `/risk/the-ban-lands-on-open-source/` (H1: A mis-set lab sandbox can open a path to rules that hit open weights hardest; kicker “OpenAI / Hugging Face attack”), `/risk/six-percent-that-stays/` (kicker “Refinancing $10 Trillion in US Debt”; closer “From this essay” to `/economics/ten-trillion-to-roll/`) under Emerging risks. Old `/risk/panic-before-the-breach/` 301s to the ban-lands page. Do not create `/risk/emerging/`. Headlines live in `docs/risk/`.

**Piece.** One research item. A research row is a date, a Newsreader claim, and one-line dek.

**Bind order.** The four constraints on a 72-GPU rack, listed unranked here, ranked in the A.I. essay: grid interconnect, CoWoS and other advanced packaging, HBM, liquid-cooled rack integration.

**Standalone app.** A vanilla HTML/CSS/JS tool under `public/`. It has its own `index.html`. It is not an Astro page.

**Chrome.** Shared masthead, logo, and footer.

**Landing look.** Charcoal shell in `landing.css` for home + 404. Home is charcoal emptiness (`hub.css`). Not Economics. Not Risk. Not `/ai`. No chip photo, no coverflow.

**Systems.** External app at https://systems.rycode.dev. The header item and the HOME door open it in a new tab. It is not a page on this site.

**Worktree.** A linked working copy of this git repo that T3 Code creates for a Grok thread. Same history as the main checkout. Different folder. Merge back through git.
