# CONTEXT.md

Glossary for this repo. Use these words in conversation and in code names.

**Rycode.** A hub with five doors: Research, Tools, Economics, Risk, and Systems. Live site: https://rycode.dev. A.I. is a branch off home, not a sixth door. Systems goes out to https://grc.rycode.dev.

**Home.** Charcoal `#080a10` emptiness at `/`. Five small 1px `#f8fafc` doors in a row (Research, Tools, Economics, Risk, Systems), then a small overhead wireframe brain for A.I. Square Ry 26 in a corner. Inter only. No cyan, no floor grid, no glass windows, no coverflow, no hero sentence.

**Brain.** Overhead two-hemisphere wireframe under the door row. It is the hit target for A.I. Link to `/ai`. Not a glass window, not a chip card, not a hero.

**A.I.** Charcoal branch at `/ai`: signed brain, Inter “A.I.”, italic dek, Deep dive row plus Models cards (Anthropic, OpenAI). No Grok. No cyan. Essay lives only at `/ai/next-token-engine/` on the newspaper chassis. Lab doors at `/ai/models/anthropic/` and `/ai/models/openai/`. Model pages under those paths from `docs/ai/models/`. Entered from the home brain. Not a Research piece and not a Tools clone.

**Newspaper look.** Charcoal paper near `#080a10`, off-white ink, cyan hairlines. Newsreader for the claim and body, Inter for kickers and captions, Geist Mono for stage ticks and eval names. Inverted Ry plus a thin cyan hairline. Not cream newsprint, not the chip photo, not coverflow.

**Section page.** `/tools` is a charcoal index, same ground as home, not chip or glass. `/research` is a charcoal journal, not chip or glass and not the `/ai` newspaper. `/economics` is an empty charcoal landing. `/risk` is a charcoal index: signed triangle, Inter title, italic dek, named sections, rows. Logo goes home. No pillar rail. `/ai` is not a section page. Systems is not a section page on this site; old `/systems` links go to https://grc.rycode.dev.

**Research.** Charcoal `#080a10` at `/research`, same ground as home. Magnifying-glass Inter “Research”, square Ry upper-right, one hairline, then rows (date · Newsreader claim · dek). Named sections (SaaS) use the same kicker treatment as “Emerging risks” on `/risk`. No “Coming soon”, no cards, no ENTER, no cyan. Essays are Astro pages at `/research/[slug]`, same charcoal: Newsreader title, dek, 1px rule, Inter headings. Canonical SaaS piece: `/research/saas-barbell-2026/` with exhibits at `public/research/exhibits/`. `/research/saaspocalypse/` redirects there. Treasury essay: `/research/ten-trillion-to-roll/`, closer two lines only (Risk / Six percent that stays). Source: `docs/research/ten-trillion-to-roll.md`.

**Economics.** Empty charcoal at `/economics`. Bar-chart PNG, Inter “Economics”, italic dek: “Prices, cycles, and trade-offs. New pieces appear here as rows.” Not a Research clone. No “Coming soon”. No fake rows.

**Risk.** Charcoal `#080a10` at `/risk`, same ground as home. Warning-triangle PNG from `/landing/hub-risk.png`, Inter “Risk”, italic dek: “Tails and what actually breaks. New pieces appear here as rows.” Square Ry, 1px hairline, named sections, then rows. No cyan on the landing. No “Coming soon”. No hook, bell, or carabiner. Not GRC, not L2. Analyses are newspaper pages at `/risk/[slug]`: charcoal, cyan 1px hairlines, Newsreader H1, glossary rail with News / Know More. First analysis: `/risk/six-percent-that-stays/`. Headlines file: `docs/risk/six-percent-that-stays-headlines.md`.

**Piece.** One app or research item. A Tools row is a title plus one sentence, the whole row a link. A research row is a date, a Newsreader claim, and one-line dek. Apps live under `public/` as vanilla HTML/CSS/JS. They keep a charcoal identity strip (Tools · job, square Ry) and a flat working interior. No chip photo behind a form.

**Bind order.** The four constraints on a 72-GPU rack, listed unranked here, ranked in the A.I. essay: grid interconnect, CoWoS and other advanced packaging, HBM, liquid-cooled rack integration.

**Standalone app.** A vanilla HTML/CSS/JS tool under `public/`. It has its own `index.html`. It is not an Astro page.

**Chrome.** Shared masthead, logo, and footer.

**Landing look.** Chip photograph, dark veil, glass tiles, Newsreader + Inter. Leftover in `landing.css` (404). Home is charcoal emptiness (`hub.css`). Not Tools. Not Research. Not Economics. Not Risk. Not `/ai`. Not a Systems room.

**Tools.** Charcoal `#080a10` at `/tools`, same ground as home. Signed caliper, Inter “Tools”, italic dek, square Ry, one hairline, then full-width rows. No cards, no ENTER, no cyan. Calculators keep slider math and chart series colors. Identity strip is Tools · job name, then the working interior.

**GRC site.** Separate Netlify project at https://grc.rycode.dev/. The home Systems door goes there. Not this repo. Do not build GRC pages here. Do not proxy `/grc`.

**Worktree.** A linked working copy of this git repo that T3 Code creates for a Grok thread. Same history as the main checkout. Different folder. Merge back through git.
