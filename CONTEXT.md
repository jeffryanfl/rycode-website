# CONTEXT.md

Glossary for this repo. Use these words in conversation and in code names.

**Rycode.** A hub with five doors: Research, Tools, Economics, Risk, and Systems. Live site: https://rycode.dev. A.I. is a branch off home, not a sixth door. Systems goes out to https://grc.rycode.dev.

**Home.** Charcoal `#080a10` emptiness at `/`. Five small 1px `#f8fafc` doors in a row (Research, Tools, Economics, Risk, Systems), then a small overhead wireframe brain for A.I. Square Ry 26 in a corner. Quiet charcoal A.I. tape at the top of HOME only (`public/ai-tape.json`, fetch on the client, links to `/ai`). Quiet charcoal Macro tape at the bottom of HOME only (`public/tape.json`, fetch on the client, links to `/economics`). Not on other pages. Inter only. No cyan, no floor grid, no glass windows, no coverflow, no hero sentence.

**Brain.** Overhead two-hemisphere wireframe under the door row. It is the hit target for A.I. Link to `/ai`. Not a glass window, not a chip card, not a hero.

**A.I.** Charcoal branch at `/ai`: signed brain, Inter “A.I.”, italic dek, Deep dive row plus Models cards (Anthropic, OpenAI, xAI) and a Hardware row. No cyan. Essay lives only at `/ai/next-token-engine/` on the newspaper chassis. Lab doors at `/ai/models/anthropic/`, `/ai/models/openai/`, and `/ai/models/xai/` (five Grok doors: Models, Grok Build, Grok Bot, Imagine, Voice). Hardware hub at `/ai/hardware/` teaches fab ≠ campus: Terafab (chip fab) vs Memphis / Colossus (training campus). Model pages under lab paths from `docs/ai/`. Entered from the home brain. Not a Research piece and not a Tools clone. Do not invent benchmarks, average Colossus GPU counts, or call Terafab a data center.

**Newspaper look.** Charcoal paper near `#080a10`, off-white ink, off-white hairlines. Newsreader for the claim and body, Inter for kickers and captions, Geist Mono for stage ticks and eval names. Square Ry. Used only by the A.I. essay at `/ai/next-token-engine/`. Not cream newsprint, not the chip photo, not coverflow, not cyan.

**Section page.** `/tools` is a charcoal index, same ground as home, not chip or glass. `/research` is a charcoal journal, not chip or glass and not the `/ai` newspaper. `/economics` is a charcoal index: signed chart, Inter title, italic dek, rows. `/risk` is a charcoal index: signed triangle, Inter title, italic dek, named sections, rows. Logo goes home. No pillar rail. `/ai` is not a section page. Systems is not a section page on this site; old `/systems` links go to https://grc.rycode.dev.

**Research.** Charcoal `#080a10` at `/research`, same ground as home. Magnifying-glass Inter “Research”, square Ry upper-right, one hairline, then rows (date · Newsreader claim · dek). Named sections (SaaS) use the same kicker treatment as “Emerging risks” on `/risk`. No “Coming soon”, no cards, no ENTER, no cyan. Essays are Astro pages at `/research/[slug]`, same charcoal: Newsreader title, dek, 1px rule, Inter headings. Canonical SaaS piece: `/research/saas-barbell-2026/` with digest number-card plates (Multiple/Barbell, Price/Pack, Grind), not in-body charts. `/research/saaspocalypse/` redirects there. Treasury essay: `/research/ten-trillion-to-roll/` with two-panel digest exhibits and closer two lines (Risk / A long-term rate stuck near six percent is the debt danger that lasts). Agents essay: `/research/ten-thousand-agents-is-not-a-genius/` (OpenAI accounting; concurrent agents, hours, messages, tokens as first-class cards). Live titles on Research, Economics, and Risk essays are the plain H1; the clever line sits under it as a subhead. URLs unchanged. Source: `docs/research/`.

**Economics.** Charcoal `#080a10` at `/economics`, same ground as home. Bar-chart PNG from `/landing/hub-economics.png`, Inter “Economics”, italic dek: “Prices, cycles, and trade-offs. New pieces appear here as rows.” Square Ry, 1px hairline, then rows. Not a Research clone. No “Coming soon”. No cyan. Essays are Astro pages at `/economics/[slug]`, charcoal paper: Newsreader title, dek, Inter headings, digest number-card rail when signed. Live: `/economics/warsh-first-hike-oil-and-five-percent-ten-year/` (body + Sources this pass; no rail), `/economics/still-1998-not-1999/`, `/economics/jobs-print-was-strong-mix-is-the-story/`. Source: `docs/economics/`. Do not create `/economics/people-who-use-ai-get-the-jobs/`.

**Risk.** Charcoal `#080a10` at `/risk`, same ground as home. Warning-triangle PNG from `/landing/hub-risk.png`, Inter “Risk”, italic dek: “Tails and what actually breaks. New pieces appear here as rows.” Square Ry, 1px hairline, named sections, then rows. No cyan. No “Coming soon”. No hook, bell, or carabiner. Not GRC, not L2. Analyses are charcoal digest pages at `/risk/[slug]`: Newsreader H1, number-card right rail, How to read / Quiet / Related. Live: `/risk/the-ban-lands-on-open-source/`, `/risk/six-percent-that-stays/`, `/risk/panic-before-the-breach/` under Emerging risks. Do not create `/risk/emerging/`. Headlines live in `docs/risk/`.

**Piece.** One app or research item. A Tools row is a title plus one sentence, the whole row a link. A research row is a date, a Newsreader claim, and one-line dek. Apps live under `public/` as vanilla HTML/CSS/JS. They keep a charcoal identity strip (Tools · job, square Ry) and a flat working interior. No chip photo behind a form.

**Bind order.** The four constraints on a 72-GPU rack, listed unranked here, ranked in the A.I. essay: grid interconnect, CoWoS and other advanced packaging, HBM, liquid-cooled rack integration.

**Standalone app.** A vanilla HTML/CSS/JS tool under `public/`. It has its own `index.html`. It is not an Astro page.

**Chrome.** Shared masthead, logo, and footer.

**Landing look.** Charcoal shell in `landing.css` for home + 404. Home is charcoal emptiness (`hub.css`). Not Tools. Not Research. Not Economics. Not Risk. Not `/ai`. Not a Systems room. No chip photo, no coverflow.

**Tools.** Charcoal `#080a10` at `/tools`, same ground as home. Signed caliper, Inter “Tools”, italic dek, square Ry, one hairline, then full-width rows. No cards, no ENTER, no cyan. Calculators keep slider math and chart series colors. Identity strip is Tools · job name, then the working interior.

**GRC site.** Separate Netlify project at https://grc.rycode.dev/. The home Systems door goes there. Not this repo. Do not build GRC pages here. Do not proxy `/grc`.

**Worktree.** A linked working copy of this git repo that T3 Code creates for a Grok thread. Same history as the main checkout. Different folder. Merge back through git.
