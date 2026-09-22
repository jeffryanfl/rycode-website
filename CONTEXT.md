# CONTEXT.md

Glossary for this repo. Use these words in conversation and in code names.

**Rycode.** A hub with three HOME doors: Economics, Risk, and Systems. Tools lives at `/tools` but is off HOME. Live site: https://rycode.dev. A.I. is the overhead brain, not a fourth door. Systems goes out to https://grc.rycode.dev. There is no Research door and no Insights door.

**Home.** Charcoal `#080a10` emptiness at `/`. Three small white hairline PNG doors in a row (Economics, Risk, Systems), then a small overhead wireframe brain PNG for A.I. Square Ry 26 in a corner. Quiet charcoal A.I. tape at the top of HOME only (`public/ai-tape.json`, fetch on the client, links to `/ai`). Quiet charcoal Macro tape at the bottom of HOME only (`public/tape.json`, fetch on the client, links to `/economics`). Not on other pages. Inter only. No cyan, no floor grid, no glass windows, no coverflow, no hero sentence.

**Brain.** Overhead two-hemisphere wireframe under the door row. It is the hit target for A.I. Link to `/ai`. Not a glass window, not a chip card, not a hero.

**A.I.** Charcoal branch at `/ai`: signed brain, Inter “A.I.”, italic dek, Deep dive rows plus Models cards (Anthropic, DeepSeek, Meta, OpenAI, TypeSafe, xAI) and a Hardware row. No cyan. Deep dive essays: `/ai/chat-models-write-strings-system-one-returns-decisions/` (System One / Jev) and `/ai/next-token-engine/` (RLVR) stay on the newspaper chassis. `/ai/ten-thousand-agents-is-not-a-genius/` is the agents essay on the A.I. masthead (`variant="ai"`, `ai.css`, number-card digest). Do not put Deep dive essays in Labs, Open weight, or System One. Lab doors at `/ai/models/anthropic/`, `/ai/models/deepseek/` (V4 Flash lead; V4 Pro still listed; R1/V3 archive), `/ai/models/meta/` (Muse + Llama), `/ai/models/openai/`, `/ai/models/typesafe/` (Jev), and `/ai/models/xai/` (five Grok doors: Models, Grok Build, Grok Bot, Imagine, Voice). Do not invent Meta benches, Llama 3.x cards, or DeepSeek Arena/HLE scores. Current DeepSeek line is V4 — do not lead with V3/R1. Hardware hub at `/ai/hardware/` teaches fab ≠ campus: Terafab (chip fab) vs Memphis / Colossus (training campus). Model pages under lab paths from `docs/ai/`. Entered from the home brain. Not a Tools clone. Do not invent benchmarks, average Colossus GPU counts, or call Terafab a data center.

**Newspaper look.** Charcoal paper near `#080a10`, off-white ink, off-white hairlines. Newsreader for the claim and body, Inter for kickers and captions, Geist Mono for stage ticks and eval names. Square Ry. Used by A.I. Deep dive essays (`/ai/next-token-engine/`, `/ai/chat-models-write-strings-system-one-returns-decisions/`). Not cream newsprint, not the chip photo, not coverflow, not cyan.

**Section page.** `/tools` is a charcoal index, same ground as home, not chip or glass. `/economics` is a charcoal index: signed chart, Inter title, italic dek, rows, plus a SaaS section. `/risk` is a charcoal index: signed triangle, Inter title, italic dek, named sections, rows. Logo goes home. No pillar rail. `/ai` is not a section page. Systems is not a section page on this site; old `/systems` links go to https://grc.rycode.dev. Old `/research` links 301 to `/economics/` or to the rehomed essay.

**Research.** Not a HOME door and not a landing. `/research` and `/research/` 301 to `/economics/`. Old essay URLs 301 to the subject page. `/research/saaspocalypse` and `/research/saaspocalypse/` 301 to `/economics/saas-barbell-2026/`. Do not add an Insights door. The lens PNG stays at `/landing/hub-research.png` and is not on HOME. `src/styles/research.css` is unused. Do not wire `variant="research"` back.

**Economics.** Charcoal `#080a10` at `/economics`, same ground as home. Bar-chart PNG from `/landing/hub-economics.png`, Inter “Economics”, italic dek: “Prices, cycles, and trade-offs. New pieces appear here as rows.” Square Ry, 1px hairline, then rows. No “Coming soon”. No cyan. Essays are Astro pages at `/economics/[slug]`, charcoal paper: Newsreader title, dek, Inter headings, digest rail when signed. Live rows, in order: `/economics/post-inflation-dollars-pay-pre-inflation-debts/` (body + Sources; closer to spender-printer), `/economics/warsh-first-hike-oil-and-five-percent-ten-year/` (body + Sources; living strip from the facts sidecar; thesis stays in the `.astro` file), `/economics/still-1998-not-1999/`, `/economics/jobs-print-was-strong-mix-is-the-story/`, `/economics/ten-trillion-to-roll/` (two-panel exhibits; living strip from `docs/economics/ten-trillion-to-roll.facts.json`; closer “Risks this calls out” to `/risk/six-percent-that-stays/`). SaaS section: `/economics/saas-barbell-2026/` (two-panel exhibits; `/research/saaspocalypse` redirects here). Source: `docs/economics/`. Do not create `/economics/people-who-use-ai-get-the-jobs/`. Do not move SaaS exhibit files out of `public/research/exhibits/` unless asked.

**Risk.** Charcoal `#080a10` at `/risk`, same ground as home. Warning-triangle PNG from `/landing/hub-risk.png`, Inter “Risk”, italic dek: “Tails and what actually breaks. New pieces appear here as rows.” Square Ry, 1px hairline, named sections, then rows. No cyan. No “Coming soon”. No hook, bell, or carabiner. Not GRC, not L2. Analyses are charcoal digest pages at `/risk/[slug]`: Newsreader H1, number-card right rail, How to read / Quiet / Related. Live: `/risk/when-the-spender-runs-the-printer/` (fiscal pressure on rates; closer from `/economics/post-inflation-dollars-pay-pre-inflation-debts/`), `/risk/the-ban-lands-on-open-source/`, `/risk/six-percent-that-stays/` (closer “From this essay” to `/economics/ten-trillion-to-roll/`), `/risk/panic-before-the-breach/` under Emerging risks. The Risk chain stays ban → panic → six-percent. Do not create `/risk/emerging/`. Headlines live in `docs/risk/`.

**Piece.** One app or research item. A Tools row is a title plus one sentence, the whole row a link. A research row is a date, a Newsreader claim, and one-line dek. Apps live under `public/` as vanilla HTML/CSS/JS. They keep a charcoal identity strip (Tools · job, square Ry) and a flat working interior. No chip photo behind a form.

**Bind order.** The four constraints on a 72-GPU rack, listed unranked here, ranked in the A.I. essay: grid interconnect, CoWoS and other advanced packaging, HBM, liquid-cooled rack integration.

**Standalone app.** A vanilla HTML/CSS/JS tool under `public/`. It has its own `index.html`. It is not an Astro page.

**Chrome.** Shared masthead, logo, and footer.

**Landing look.** Charcoal shell in `landing.css` for home + 404. Home is charcoal emptiness (`hub.css`). Not Tools. Not Economics. Not Risk. Not `/ai`. Not a Systems room. No chip photo, no coverflow.

**Tools.** Charcoal `#080a10` at `/tools`, same ground as home. Signed caliper, Inter “Tools”, italic dek, square Ry, one hairline, then full-width rows. No cards, no ENTER, no cyan. Calculators keep slider math and chart series colors. Identity strip is Tools · job name, then the working interior.

**GRC site.** Separate Netlify project at https://grc.rycode.dev/. The home Systems door goes there. Not this repo. Do not build GRC pages here. Do not proxy `/grc`.

**Worktree.** A linked working copy of this git repo that T3 Code creates for a Grok thread. Same history as the main checkout. Different folder. Merge back through git.
