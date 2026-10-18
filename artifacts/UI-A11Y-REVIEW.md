# rycode.dev UI and accessibility review

Read-only pass. Nothing committed. Built with `npm ci && npm run build` (132 pages), served `dist/`, ran axe-core 4.x (wcag2a/2aa/21aa/22aa tags) in headless Chrome at 1280 and 390 on HOME, `/economics/`, `/economics/saas/`, `/ai/`, `/ai/models/anthropic/claude-opus-5-5/`, `/economics/still-1998-not-1999/`, `/ai/glossary/`, `/map/`. Also checked overflow at 768, 640 (about 200% zoom on a 1280 screen) and 320 (400% zoom), and tabbed through `/ai/`. Screenshots are in `artifacts/screenshots/`.

Scope notes:
- There is no "archive" page in the build (`docs/archive/` is not built). I used `/map/` and `/ai/glossary/` as the nearest long-form/utility pages.
- No page exposes a "research essay" besides Economics briefs. I used `/economics/still-1998-not-1999/`.
- Not tested by hand: screen reader output, real-device touch.

Clean results: no missing `alt`, no horizontal overflow at 390, 768 or 640, one `h1` per page with no skipped heading levels, all data tables use `th` with `scope`, skip link present and visible on focus, the home tape honors `prefers-reduced-motion`.

## Top 10, ranked by user impact

### 1. Muted gray text fails contrast on every Economics page (301 nodes on `/economics/saas/`)
- Page: `/economics/`, `/economics/saas/`, essays/briefs
- Problem: Secondary text (page identity label, watch-list heading, dates, "as of" lines, figure captions) is mid-gray on near-black at about 3.65:1. AA needs 4.5:1. It is the most widespread failure on the site.
- Evidence: axe `color-contrast`. `.economics-identity`, `#economics-watch-heading`, `.economics-piece-meta time`, `figcaption`, `.econ-brief-asof`; color about `#686a6e` on `#080a10`. Screenshots `02-economics-muted-text-contrast.png`, `03-saas-390.png`.
- Fix: Raise the muted-text token in `economics.css` to at least about `#8a8d93` (4.5:1 or better), then re-run axe.
- Effort: S

### 2. HOME A.I. tape "as of" label is nearly unreadable (2.53:1) and the item text is 3.93:1
- Page: HOME
- Problem: The label at the top is very faint. Tape items are also under 4.5:1.
- Evidence: `a[data-hub-ai-tape-asof]` (`#505257`), `.hub-tape-item` (`#6d6f73`). Screenshot `01-home-tape-contrast-390.png`.
- Fix: Raise the alpha or color of `.hub-tape-asof`, `.hub-tape-tag`, `.hub-tape-item` in `hub.css` to reach 4.5:1 while keeping the quiet look.
- Effort: S

### 3. Scrolling tape has no pause control (WCAG 2.2.2)
- Page: HOME (both tapes)
- Problem: The tape moves for more than 5 seconds. It pauses only on hover or focus-within, so touch users, and keyboard users who never tab into it, cannot stop it. The reduced-motion rule works, which is good.
- Evidence: `hub.css` `.hub-tape-track--scroll { animation: hub-tape-scroll 48s linear infinite }`, pause only via `:hover` / `:focus-within` (about lines 141 and 183).
- Fix: Add a small pause/play button (min 24px) that toggles `animation-play-state`, or stop the loop after one pass.
- Effort: M

### 4. Footer copyright text fails contrast on every page
- Page: all pages with the shared footer
- Problem: 3.93:1 against the 4.5:1 minimum.
- Evidence: `.site-footer-copy` (`#6d6f73`), flagged on `/ai/`, model page, glossary, `/map/`.
- Fix: Lighten the footer text color one step in `global.css`.
- Effort: S

### 5. Inline links in the glossary are indistinguishable from body text
- Page: `/ai/glossary/` (86 nodes), likely other `paper.css` pages
- Problem: Cross-reference links have 1.08:1 contrast with surrounding text and no underline, so readers cannot tell what is a link.
- Evidence: axe `link-in-text-block`, `section[aria-labelledby="token"] .paper-body p > a[href^="#"]`. `paper.css` sets `text-decoration: none` near line 62 and underlines only some links (line 264). Screenshot `05-glossary-links-no-underline.png`.
- Fix: Underline links inside `.paper-body` (or give them a 3:1 color difference plus a non-color cue).
- Effort: S

### 6. Tiny external-link icons in the `/ai/` bench table (14 nodes, 8x13 px)
- Page: `/ai/` (bench charts and table headers)
- Problem: Links to benchmark exams are 8px wide, below the 24px minimum and hard to tap, especially on mobile.
- Evidence: axe `target-size`, `th[aria-sort] > .abb-ext[target="_blank"]`, `a[href$="cursorbench"]`. Screenshot `04-ai-tiny-external-links.png`.
- Fix: Pad the `.abb-ext` links to a 24x24 hit area (padding or `::after` overlay) without changing the visible icon.
- Effort: S

### 7. Scrollable table wrappers are not keyboard-reachable
- Page: `/economics/saas/` (`#sectors`, `#growth`, `.saas-scroll`) and model page `.ai-model-table-wrap` at 390 wide
- Problem: On narrow screens the tables scroll sideways, but the wrapper cannot take focus, so keyboard users cannot scroll them.
- Evidence: axe `scrollable-region-focusable` (serious). Screenshot `03-saas-390.png`.
- Fix: Add `tabindex="0"`, `role="region"` and an `aria-label` on each scroll wrapper, plus a visible focus style.
- Effort: S

### 8. Focus indicator is a 1px low-alpha outline on the hub
- Page: HOME, `/ai/`, tape and doors
- Problem: It is present, so it passes the basics, but 1px at about 52% white on charcoal is faint. WCAG 2.2 focus appearance (AAA) and general usability favor 2px or more.
- Evidence: Tabbing `/ai/`: computed outline `solid 1px`; `.hub-tape:focus-visible { outline: 1px solid rgba(248,250,252,.52) }`. Screenshot `07-focus-ring-1px.png`.
- Fix: Use a shared 2px solid, full-opacity-ish `:focus-visible` outline with offset across `hub.css`, `ai.css`, `economics.css`.
- Effort: S

### 9. Bench chart axis links hide their own focus ring
- Page: `/ai/` (`BenchChart.astro`)
- Problem: `.bc-axis-link:focus-visible { outline: none }` relies on a thin stroke on the label text. This is easy to miss, and it is a custom replacement for the browser ring.
- Evidence: `src/components/BenchChart.astro` around lines 705 to 720.
- Fix: Keep a visible outline or a clear box/underline on the focused label; check it at 3:1 against the chart background.
- Effort: S

### 10. Header nav pushes the page wider than the screen at 400% zoom (320 px)
- Page: all pages with the shared header (`/economics/`, `/ai/`, model page, glossary; HOME is fine)
- Problem: Page scroll width is 363 px at a 320 px viewport, so users at high zoom must scroll sideways (WCAG 1.4.10 reflow). At 390, 640 and 768 there is no overflow.
- Evidence: Overflow probe at 320: scrollWidth 363 vs 320; offending `li` / `a` in the top nav row. Screenshot `06-nav-overflow-320-zoom400.png` (the nav sits on one line).
- Fix: Allow the nav list to wrap (`flex-wrap: wrap`) or scroll inside its own container at narrow widths.
- Effort: S

## Lower priority
- `.ai-identity` label on the glossary is 4.05:1; the same muted token as items 1 and 4, so fix them together.
- HOME tape links (`.hub-tape-item`, `.hub-tape-asof`) are under 24px tall inline links in a strip. They are inline, so axe passes, but they are tight for touch.
- Breadcrumb links (`Home`, `Economics`, `A.I.`) and header identity links are small; consider more vertical padding on mobile.
- `/ai/` lab-name links in the Labs list are small (inline, below 24px height); same fix as above.
- Two custom focus styles in `global.css:822` (scratchpad textarea, `outline: none` with border color) and `concept-map.css:139,235` remove the outline; confirm the replacement has at least 3:1 contrast.
- Decorative pulse animations (`hub-icon-pulse`) are reduced-motion safe in `hub.css` (line 452), so no change needed.
- `og-hub.png` unused legacy and `research.css` unused (per AGENTS.md); not an accessibility concern.
- Heading order, alt text, link names and table scope showed no problems in the sampled pages. Pages not sampled (Risk, Opinions, other model pages, hardware) are likely to share the same contrast tokens.

---

# Full sweep

Method: axe-core (wcag2a, 2aa, 21aa, 22aa) at 1280 and 390 over every built page (131 `index.html` files plus `404.html`, 132 total, no script errors). Overflow measured at 768 and 320. Keyboard pass (30 Tab presses, focus ring check) on one page per template: Risk brief, Risk index, Opinions index, model card, model archive, lab door, chips index, hardware hub, journal (About), paper (glossary), A.I. essay. Screenshots 08 to 13 in `artifacts/screenshots/`.

Totals across 132 pages:
- 768 px: no horizontal overflow on any page.
- 320 px (400% zoom): overflow on 130 of 132 pages (all but HOME and 404).
- Every page has one `h1`, no skipped heading levels, a `lang`, a title, a `main`, and a working skip-link target. No meta-refresh redirect pages in the build.
- axe rules failing: `color-contrast` (132 pages), `link-in-text-block` (10), `scrollable-region-focusable` (5), `target-size` (2). Nothing else (no ARIA misuse, no missing alt, no label or table-header errors).
- Opinions: `/opinions/` is the only built Opinions page (the `opinions.json` array has no pieces). `/research` has only exhibit files, no pages.

## Issues grouped by template

### A. Shared chrome (all templates; one change fixes every page)
1. **Footer copyright contrast, 3.93:1**: `.site-footer-copy` fails on 124 pages (every page with the shared footer). Fix in `global.css` token. S.
2. **Primary nav overflows at 320 px**: the header nav `ul` (`LI`/`A`/`.visually-hidden` inside `nav`) reaches 355 to 420 px wide at a 320 px viewport, so the page scrolls sideways by 39 to 47 px on 130 pages. Fails reflow (1.4.10). Screenshot `12-site-nav-overflow-320.png`. Fix: `flex-wrap: wrap` or inner scroll on the nav list in the layout styles. S.
3. **Door identity label contrast** (the small gray section name beside the glyph): `.ai-identity` 4.05:1 (8 A.I. pages), `.risk-identity` (4 Risk pages), `.economics-identity` (first pass, Economics pages). Same muted token as the footer. S, bundle with A.1.
4. **Focus ring is 1px**: on Risk, Opinions, model, archive, lab, chips and hardware templates about 23 to 29 of 30 Tab stops get a 1px outline (`ai.css`, `risk.css`, `opinions.css`, hub styles). Present and visible, but thin. Journal, paper and A.I. essay templates are already at 2px or more (0 weak stops). Fix: one shared `:focus-visible` rule at 2px. S.

### B. Risk template (`risk.css`): `/risk/` plus 4 briefs (5 pages)
- Muted gray text under 4.5:1 on `.risk-brief-asof` ("as of" line, all 4 briefs), `.risk-identity`, and on the index `#risk-watch-heading`, `.rw-key`, `.rw-date`. Same fix as Economics (item 1 of the first pass). Screenshots `08-risk-index-muted-text.png`, `09-risk-brief-asof-contrast-390.png`. S.
- No other Risk-specific problems: no overflow at 390 or 768, headings fine, keyboard order fine.

### C. Economics template (`economics.css`), 5 pages (first pass, confirmed)
- `.econ-brief-asof`, `.economics-identity`, `time`, `figcaption`, `#economics-watch-heading`. S.
- `/economics/saas/`: 3 scrollable table wrappers (`.saas-scroll`) are not keyboard focusable. S.

### D. A.I. model cards and archive (`ai.css`): about 30 pages under `/ai/models/**`
- **Archive footnote links are 24 px short**: `a[href$="#archive-note-1"]` on `/ai/models/archive/` fails `target-size` (axe lists 24 nodes). Screenshot `10-archive-footnote-target-size.png`. Fix: add padding or min-size to the footnote anchors. S.
- **Table wrappers not focusable**: `.ai-model-table-wrap` on `/ai/models/anthropic/claude-opus-5-5/` and `/ai/models/anthropic/claude-fable-5-1/` at 390 px (axe only flagged these two of the model pages, so other model cards either have no wide table or fit). Fix: shared wrapper gets `tabindex="0"`, `role="region"`, `aria-label` in `ModelFacts` / table component. S.
- Lab doors (`/ai/models/xai/`, anthropic, openai, google, meta, deepseek, typesafe, open-weight): only the shared issues in A. No overflow at 390 or 768.

### E. A.I. landing and bench charts: `/ai/`
- Tiny 8x13 px chart/table header links (`.abb-ext`, `a[href$="cursorbench"]`), 14 nodes (first pass). Same pattern also appears on the archive page. S.
- Chart axis links remove the browser outline (first pass item 9). S.

### F. Paper and A.I. essay templates (`paper.css`), 10 pages
Pages: `/ai/glossary/`, `/ai/what-xai-has-running/`, `/ai/swarms/what-an-agent-swarm-is/`, `/ai/next-token-engine/`, `/ai/grok-bot-set-a-new-bar/`, `/ai/ai-regulation/`, `/ai/chat-models-write-strings-system-one-returns-decisions/`, `/ai/frontier-price-meets-open-weight-ipo/`, `/ai/meta-named-an-enterprise-stack/`, plus `/about/` and `/privacy/` (journal variant uses the same `.paper-body` links).
- **Inline links have no distinguishing cue**: `link-in-text-block` on 10 pages, 364 nodes (`.paper-main > .paper-body p > a`, glossary `a[href^="#"]`). S.
- **Table header cells low contrast**: `th` on `/ai/grok-bot-set-a-new-bar/`, `/ai/next-token-engine/` and one more A.I. essay. Screenshot `13-ai-essay-table-th-contrast.png`. S.
- **Swarm stat scroller not focusable**: `.swarm-stat-scroll` on `/ai/swarms/` and `/ai/swarms/what-an-agent-swarm-is/`. S.
- Kicker text: `.ai-digest-kicker`, `.ai-card-kicker` on `/ai/ten-thousand-agents-is-not-a-genius/` are under 4.5:1. S.

### G. Hardware and chips (`/ai/hardware/**`, about 25 pages)
- Only shared issues from A, plus one: `.hw-chip-art-empty[aria-hidden="true"]` placeholder text on `/ai/hardware/chips/` is low contrast. It is aria-hidden, so it matters only for sighted low-vision users; S. Ascend has no photo by design.
- No overflow at 390 or 768, chip images all have alt text.

### H. Opinions: `/opinions/` (1 page)
- Shared issues only. Empty-state is fine at 390 and 768.

### I. HOME and 404
- HOME: the two tapes are the only template-specific issues (first pass items 2 and 3). `span[data-hub-tape-asof]` (bottom tape label) is also low contrast. The 404 page has only footer contrast. Neither overflows at 320.

## Updated top 10 (merged, ranked by user impact)

| # | Issue | Pages affected | Effort |
|---|---|---|---|
| 1 | Muted gray text under 4.5:1 across Economics, Risk, A.I. kickers, th, captions, "as of" lines (one muted-color token; includes the door identity labels) | about 30 pages directly (Economics 5, Risk 5, A.I. essays/th/kickers 10, plus the identity label on all door pages) | S |
| 2 | Footer copyright 3.93:1 | 124 | S |
| 3 | Site nav overflows at 320 px (400% zoom reflow) | 130 | S |
| 4 | HOME tape: label at 2.53:1, items at 3.93:1, bottom tape label also low | 1 (HOME) | S |
| 5 | Tape scrolls with no pause control (2.2.2) | 1 (HOME) | M |
| 6 | Inline links not distinguishable from text (no underline, 1.08:1) | 10 (364 links) | S |
| 7 | Scrollable tables and stat strips not keyboard focusable | 5 (`/economics/saas/`, 2 model cards, 2 swarm pages) | S |
| 8 | Focus ring only 1px on hub, Risk, Opinions, model, lab, hardware templates | about 70+ pages (all but journal, paper, A.I. essay templates) | S |
| 9 | Tap targets under 24 px: tiny external-link icons on bench tables, footnote anchors on the archive | 2 (`/ai/`, `/ai/models/archive/`) | S |
| 10 | Chart axis links remove their own outline | 1 (`/ai/`) | S |

Everything here is a one CSS or one template change; the only M item is the tape pause button. A suggested order for approval: items 1, 2 and 3 first (a token change plus one nav rule covers over 120 pages), then 6, 7 and 8 (shared rules), then the page-specific items.

## Lower priority (sweep additions)
- Hardware chips placeholder (`.hw-chip-art-empty`, aria-hidden) text contrast.
- Lab and hardware pages have many small inline text links; they pass axe because inline links are exempt, but vertical spacing is tight for touch.
- The archive page has 69 focusable items on one screen; consider a "skip to" anchor list. No axe failure.
- `/opinions/` has only 17 focusable items and is an empty hub today; re-run axe when the first piece is added.
- Not covered by automation: screen-reader announcements for the bench-table sort headers (`th[aria-sort]`), chart text alternatives in `BenchChart.astro` SVGs, and color-only meaning in the bench line chart legend. These need a manual check with a screen reader.
