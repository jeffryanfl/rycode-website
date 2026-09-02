# CONTEXT.md

Glossary for this repo. Use these words in conversation and in code names.

**Rycode.** A hub with four doors: Research, Tools, Economics, and Risk. Live site: https://rycode.dev. A.I. is a branch off home, not a fifth door. Systems is off the hub.

**Home.** Charcoal `#080a10` emptiness at `/`. Four small 1px `#f8fafc` doors in a row (Research, Tools, Economics, Risk), then a small overhead wireframe brain for A.I. Square Ry 26 in a corner. Inter only. No cyan, no floor grid, no glass windows, no coverflow, no hero sentence.

**Brain.** Overhead two-hemisphere wireframe under the door row. It is the hit target for A.I. Link to `/ai`. Not a glass window, not a chip card, not a hero.

**A.I.** Newspaper essay at `/ai`. Entered from the home brain. Not a Research piece and not a Tools clone.

**Newspaper look.** Charcoal paper near `#080a10`, off-white ink, cyan hairlines. Newsreader for the claim and body, Inter for kickers and captions, Geist Mono for stage ticks and eval names. Inverted Ry plus a thin cyan hairline. Not cream newsprint, not the chip photo, not coverflow.

**Section page.** `/systems` still uses the chip photograph and glass cards. `/tools` is a charcoal index, same ground as home, not chip or glass. `/research` is a charcoal journal, not chip or glass and not the `/ai` newspaper. `/economics` is an empty charcoal landing. `/risk` is a charcoal index: signed triangle, Inter title, italic dek, named sections, rows. Logo goes home. No pillar rail. `/ai` is not a section page.

**Research.** Charcoal `#080a10` at `/research`, same ground as home. Magnifying-glass Inter “Research”, square Ry upper-right, one hairline, then a vertical list (date · claim · dek) once a piece is published. Empty identity if nothing is published. No “Coming soon”, no cards, no ENTER. Essays are Astro pages at `/research/[slug]`, same charcoal. Chassis: Newsreader claim, italic dek, 1px rule, Inter section heading. No cyan. Canonical first piece: `/research/saas-barbell-2026/`. `/research/saaspocalypse/` redirects there.

**Economics.** Empty charcoal at `/economics`. Bar-chart PNG, Inter “Economics”, italic dek: “Prices, cycles, and trade-offs. New pieces appear here as rows.” Not a Research clone. No “Coming soon”. No fake rows.

**Risk.** Charcoal `#080a10` at `/risk`, same ground as home. Warning-triangle PNG from `/landing/hub-risk.png`, Inter “Risk”, italic dek: “Tails and what actually breaks. New pieces appear here as rows.” Square Ry, 1px hairline, named sections, then rows. No cyan on the landing. No “Coming soon”. No hook, bell, or carabiner. Not GRC, not L2. Analyses are newspaper pages at `/risk/[slug]`: charcoal, cyan 1px hairlines, Newsreader H1, glossary rail with News / Know More. First analysis: `/risk/six-percent-that-stays/`. Headlines file: `docs/risk/six-percent-that-stays-headlines.md`.

**Piece.** One app or research item. A Tools row is a title plus one sentence, the whole row a link. A Systems card is a title plus one sentence. A research row is a date, a Newsreader claim, and one-line dek. Apps live under `public/` as vanilla HTML/CSS/JS. They keep a charcoal identity strip (Tools · job, square Ry) and a flat working interior. No chip photo behind a form.

**Bind order.** The four constraints on a 72-GPU rack, listed unranked here, ranked in the A.I. essay: grid interconnect, CoWoS and other advanced packaging, HBM, liquid-cooled rack integration.

**Standalone app.** A vanilla HTML/CSS/JS tool under `public/`. It has its own `index.html`. It is not an Astro page.

**Chrome.** Shared masthead, logo, and footer.

**Landing look.** Chip photograph, dark veil, glass tiles, Newsreader + Inter. Used on Systems. Home is charcoal emptiness (`hub.css`). Not Tools. Not Research. Not Economics. Not Risk. Not `/ai`.

**Tools.** Charcoal `#080a10` at `/tools`, same ground as home. Signed caliper, Inter “Tools”, italic dek, square Ry, one hairline, then full-width rows. No cards, no ENTER, no cyan. Calculators keep slider math and chart series colors. Identity strip is Tools · job name, then the working interior.

**GRC site.** Separate Netlify project at https://grc.rycode.dev/. Not this repo. Do not add it here until Jeffrey says it is ready.

**Worktree.** A linked working copy of this git repo that T3 Code creates for a Grok thread. Same history as the main checkout. Different folder. Merge back through git.
