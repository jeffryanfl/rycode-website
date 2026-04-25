/* ==================================================================
   BUILD LOG — entries + render logic
   ------------------------------------------------------------------
   TABLE OF CONTENTS
     1. ENTRIES   (the data — APPEND HERE TO ADD A NEW ONE)
     2. STATE     (active filter + selected entry)
     3. RENDER    (chips, list, detail, counts)
     4. EVENTS    (chip clicks, row clicks, hash changes)
     5. BOOTSTRAP (initial render + URL hash routing)
   ------------------------------------------------------------------
   HOW TO ADD AN ENTRY
   Append one object to the ENTRIES array below. Required fields:
     id          — kebab-case, becomes the URL hash (#bug-slug)
     title       — short noun-phrase, what the bug WAS
     date        — MM/DD/YYYY
     category    — must match one of the chip categories below
     severity    — 'minor' | 'major' | 'production'  (default: 'minor')
     symptom     — what you saw / experienced (1-3 sentences)
     cause       — what was actually happening underneath
     fix         — what we did to resolve it
     lesson      — the generalizable pattern worth banking
   The page renders from this array — no other file needs editing.
   ================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. ENTRIES — newest first
  // ----------------------------------------------------------------
  const ENTRIES = [
    {
      id: 'ai-research-needs-verification',
      title: 'AI-synthesized research draft needed verification before publication',
      date: '04/26/2026',
      category: 'Editorial',
      severity: 'major',
      symptom: 'Adding a Q2 2026 addendum to the SaaSpocalypse research paper, the addendum (an AI-generated draft) read cleanly and matched the article\'s tone — but a research pass against public sources surfaced multiple claims that were either unverifiable or quietly overstated. Banks framed as deploying agentic AI inside core regulated workflows; specific product names ("Diligent Elevate launch · AI Board Member") that couldn\'t be confirmed; vendor names ("Optro") presented without provenance.',
      cause: 'AI-synthesized research is a confident first draft, not a finished artifact. The model generates plausible specifics — product names, dates, scale figures, capability lists — that read as cited fact but haven\'t actually been cross-checked against any source. A human reader, especially one in the document\'s subject area, can pattern-match the shape of credibility (specific names, specific dates, specific percentages) and skip the verification step. That\'s exactly when un-verified claims slip into print under a "rigorous research" banner.',
      fix: 'Three moves: (1) ran a focused research pass against public disclosures for every named bank deployment and GRC vendor capability — calibrated the on-page prose to match what\'s actually verifiable; (2) added a methodology paragraph explicitly distinguishing composite directional estimates from sourced facts, with hyperlinked citations for each sourced item; (3) preserved the original AI-synthesized PDF but reframed it as the "Q2 source addendum" — explicitly the draft, not the calibrated reading. The on-page version is authoritative; the PDF is the provenance.',
      lesson: 'Treat AI-generated research like a junior analyst\'s first draft — useful starting material, not publishable output. The verification step isn\'t skippable, and confidence in the prose is not evidence of correctness. When you do publish AI-synthesized work, make the lineage visible: archive the raw draft, publish the calibrated reading, and tell the reader which is which. That honesty is itself the credibility move — claiming sourceless rigor while quietly papering over un-verified claims is the failure mode.',
    },
    {
      id: 'slider-jitter-tier-boundary',
      title: 'Slider jitter at the tier boundary',
      date: '04/25/2026',
      category: 'CSS layout',
      severity: 'minor',
      symptom: 'On the Control Effectiveness calculator, dragging an effectiveness slider across the Partially Effective / Effective threshold made the label shake back and forth between bands. The value would jump 65 → 70 → 65 → 70 as long as the cursor lingered near the boundary.',
      cause: 'A layout feedback loop, not a state bug. The qualitative labels were different widths ("Partially Effective" ~175px vs "Effective" ~75px). The block holding both the label and the slider had min-width: 220px but otherwise sized to its content — so when the label shrank, the block (and the slider track inside it) shrank by ~84px. That pulled the slider out from under the moving cursor, the value snapped back across the threshold, the label widened, the slider widened, and the loop repeated.',
      fix: 'Locked the parent block to <code>min-width: 340px</code> — the width of the longest possible readout, "100% · Partially Effective". The slider track now stays a constant width regardless of which tier the label shows, so the cursor can\'t accidentally cross the threshold.',
      lesson: 'When a value oscillates near a threshold, suspect <strong>layout</strong>, not state. Your instinct will say "I need to debounce" or "I need hysteresis on the boundary" — both real techniques, both would have masked this without fixing it. Diagnostic test: measure the bounding rect of the affected element across a few state changes. If the dimensions move, you have a layout-driven interaction bug. The UI was eating the mouse input by moving out from under it.',
    },
    {
      id: 'flex-gap-collapsed',
      title: 'Flex space-between collapsed when content filled the container',
      date: '04/25/2026',
      category: 'CSS layout',
      severity: 'minor',
      symptom: 'After lengthening a slider readout from "60%" to "60% · Partially Effective", the "Effectiveness" label and the value were touching with no gap — rendering as <code>Effectiveness60% · Partially Effective</code>.',
      cause: '<code>justify-content: space-between</code> only adds space when there is leftover room in the flex container. The longer value text grew to fill the container, leaving zero pixels of slack for space-between to distribute.',
      fix: 'Added <code>gap: var(--s-3)</code> to the flex container as a guaranteed minimum. Now even a maximally crowded row has at least 12px between the children.',
      lesson: '<code>justify-content: space-between</code> is <em>conditional</em> on slack. <code>gap</code> is <em>unconditional</em>. Use both: gap as the floor, space-between for distribution of any leftover. If your content might grow, gap saves you from layout-collapse bugs you can\'t reproduce locally with shorter test data.',
    },
    {
      id: 'page-not-surfaced',
      title: 'Shipped a page that nobody could find',
      date: '04/25/2026',
      category: 'Information architecture',
      severity: 'major',
      symptom: 'After deploying the Teller-Ulam scrubber to <code>/anatomy/teller-ulam/</code>, the page rendered correctly when visited directly, but it was missing from the homepage Anatomy Of grid. The only way to discover it was to walk the Fission article\'s "Next" CTA. Same bug repeated when shipping the Control Effectiveness calculator — page deployed, no card on the homepage Dashboards grid.',
      cause: 'Building the page and adding the page to its category section are two separate edits. Treating them as one task means it\'s easy to ship the page, mark the work "done," and walk away — only to learn later that nobody could find it.',
      fix: 'Added a card to the relevant homepage grid for each new page, mirroring the existing cards\' structure (status pill, title, description, tags, CTA).',
      lesson: 'Shipping a page is <strong>not</strong> the same as surfacing it. The taxonomy is part of the page, not a separate concern. Add the card on the same commit as the page itself, and treat "the homepage links to it" as part of the definition of done. Bonus rule: if you ever delete a page, search for its URL across the whole repo before committing — orphan links rot quietly.',
    },
    {
      id: 'pdf-filename-mismatch',
      title: 'PDF download 404 because of a filename mismatch',
      date: '04/24/2026',
      category: 'Deployment',
      severity: 'major',
      symptom: 'The download button on the Fission research article returned a 404 in production. The link looked correct, the file existed in the repo, the deploy succeeded.',
      cause: 'The article\'s download link expected the file at <code>fission.pdf</code>. The file dropped into the folder was named <code>Nuclear Weapons.pdf</code>. Two related problems: the filenames didn\'t match, and the file with spaces in its name needs URL-encoding (<code>%20</code>) which is fragile.',
      fix: 'Renamed the file to <code>fission.pdf</code> so it matches the article slug and the link.',
      lesson: 'Name downloadable files after <strong>where they\'re consumed</strong> (the article slug), not after the topic. Spaces in URLs are technically legal but brittle — different web servers normalize them differently. Article-named files prevent silent mismatches when content gets renamed in the future, and they keep the URL clean.',
    },
    {
      id: 'commits-never-pushed',
      title: 'Local commits never reached the live site',
      date: '04/24/2026',
      category: 'Git workflow',
      severity: 'major',
      symptom: 'After a long session of edits, the live site at rycode.dev still showed the previous version. Local files looked correct. <code>git log</code> showed the new commits. Browser cache wasn\'t the issue — even an incognito window saw the old version.',
      cause: 'All work was committed locally but never pushed to <code>origin/main</code>. Netlify deploys from the GitHub remote, not from the local filesystem. <code>git status</code> would have said "Your branch is ahead of \'origin/main\' by N commits" — a one-line warning that the work was sitting on the laptop.',
      fix: '<code>git push origin main</code>. Netlify picked up the deploy within a minute.',
      lesson: 'A commit is <strong>not</strong> a ship. Netlify (and any CI/CD that watches a remote branch) deploys from the remote, so anything that hasn\'t been pushed is invisible to the world. Build the habit: a session isn\'t shipped until <code>git status</code> says <em>"Your branch is up to date with \'origin/main\'."</em> Read that line every time before walking away.',
    },
    {
      id: 'grid-empty-column',
      title: 'CSS Grid left an empty column after deleting a tile',
      date: '04/25/2026',
      category: 'CSS layout',
      severity: 'minor',
      symptom: 'Deleted the "Frameworks used" stat tile from the homepage. The remaining two tiles drifted to the left and floated against an empty third column.',
      cause: 'The container was <code>grid-template-columns: repeat(3, 1fr)</code>. Removing the markup for one item didn\'t shrink the grid — the third column was still allocated, just empty.',
      fix: 'Reduced the grid template to <code>repeat(2, 1fr)</code> and left a comment block explaining why so future-me doesn\'t wonder.',
      lesson: 'CSS Grid templates are <strong>fixed</strong> by default — they don\'t auto-shrink to match the items inside. Removing a grid item is two changes: delete the markup AND update the template. Same applies in reverse: adding a tile means updating the template OR using <code>grid-template-columns: repeat(auto-fit, minmax(...))</code> if you genuinely want flow behavior.',
    },
    {
      id: 'png-export-transparent',
      title: 'Chart.js PNG exported as transparent',
      date: '04/25/2026',
      category: 'Tooling',
      severity: 'minor',
      symptom: 'The Control Effectiveness calculator\'s "Export PNG" button worked, but pasting the resulting image into a slide deck looked terrible — the gold residual bars floated on transparency, the gray inherent bars vanished against a white slide background.',
      cause: 'HTML <code>canvas</code> elements default to a transparent background. <code>chart.toBase64Image()</code> faithfully captured exactly what was on the canvas — including the empty alpha channel. The dark page surface behind the chart in the browser was invisible to the export.',
      fix: 'Composited the chart onto a fresh offscreen canvas pre-filled with the page\'s surface color, then exported that. Five lines of canvas API, no extra plugins or dependencies.',
      lesson: 'Canvas is <strong>transparent by default</strong>. Any export needs an explicit background or it will betray you the moment it leaves the dark page that produced it. Compositing onto a fresh canvas you control is the cleanest fix — no Chart.js plugins, no global CSS hacks, just a small pure function next to the export button.',
    },
    {
      id: 'csv-utf8-bom',
      title: 'CSV export rendered as garbage in Excel',
      date: '04/25/2026',
      category: 'Tooling',
      severity: 'minor',
      symptom: 'The Control Effectiveness CSV export contained "Phishing → admin account takeover". Opened in Excel, the arrow → became a string of accented gibberish. The same file opened cleanly in Google Sheets and any text editor.',
      cause: 'Excel reads CSV files as Latin-1 by default unless explicitly told otherwise. UTF-8 multi-byte characters (the <code>→</code> is three bytes in UTF-8) get misinterpreted as a sequence of Latin-1 single-byte characters.',
      fix: 'Prepended a UTF-8 byte-order mark (<code>\\ufeff</code>) to the CSV string before writing it to the Blob. Excel reads the BOM and switches to UTF-8 decoding for the rest of the file.',
      lesson: 'If your CSV might contain anything beyond plain ASCII — arrows, em-dashes, accents, currency symbols, names with diacritics — prepend the BOM. Three bytes of overhead, massive downstream consequence. Yes, it\'s 2026 and yes, Excel still defaults to Latin-1 in many locales. Defend yourself.',
    },
    {
      id: 'stale-preview-cache',
      title: 'Preview verified the wrong version',
      date: '04/25/2026',
      category: 'Tooling',
      severity: 'minor',
      symptom: 'After editing source files, queries against the preview server returned the OLD DOM structure. The page looked unchanged. Time spent debugging "why did my edit not take effect" turned out to be wasted — the edit had taken effect, the verifier just couldn\'t see it.',
      cause: 'The browser had cached the previous HTML/CSS/JS. The preview tool runs against whatever the browser currently has loaded — not whatever\'s on disk. So a fresh edit and a stale tab look identical from the verifier\'s point of view.',
      fix: 'Forced a hard reload via <code>window.location.reload()</code> (or navigated away and back) before running any verification eval.',
      lesson: 'When verifying a change, <strong>always force-reload before trusting what you see.</strong> "It worked when I tested it" is meaningless if the test ran against stale cache. For shipped assets that change frequently, append a cache-bust query string (<code>?v=N</code>) to the link tag — the browser sees a different URL and re-fetches.',
    },
    {
      id: 'innerhtml-xss-risk',
      title: 'innerHTML + user-typed text was a quiet XSS vector',
      date: '04/25/2026',
      category: 'Security',
      severity: 'minor',
      symptom: 'On the Control Effectiveness calculator, risk and control names are typed by the user. The render code interpolates them into a template literal, then assigns the result to <code>innerHTML</code>. A user pasting <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> as a risk name would, in principle, have it parsed and executed as part of the DOM.',
      cause: 'Template literals only concatenate; they don\'t escape. <code>innerHTML</code> parses the resulting string as HTML, treating any <code>&lt;</code> or <code>&gt;</code> as markup. The combination — user input + template literal + innerHTML — is the classic XSS triangle.',
      fix: 'Wrote a small <code>escapeAttr()</code> helper that converts <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code>, <code>"</code> to HTML entities, and applied it to every user-typed field before interpolation. Six lines of code, zero dependencies.',
      lesson: 'Any string the user typed that ends up inside <code>innerHTML</code> or an HTML attribute needs <strong>HTML escaping</strong>. The risk is real even on solo tools — the second someone shares a link with pre-filled state, or a user copies from a tutorial that includes markup, untrusted text is in your DOM. When you don\'t need HTML structure, use <code>textContent</code> instead — it\'s the safer default by construction.',
    },
  ];

  // ----------------------------------------------------------------
  // 2. STATE
  // ----------------------------------------------------------------
  const state = {
    activeCategory: 'all',
    selectedId: null,
  };

  // ----------------------------------------------------------------
  // DOM REFS
  // ----------------------------------------------------------------
  const $chips   = document.getElementById('blChips');
  const $list    = document.getElementById('blList');
  const $detail  = document.getElementById('blDetail');
  const $counts  = document.getElementById('blCounts');

  // ----------------------------------------------------------------
  // 3. RENDER
  // ----------------------------------------------------------------

  // Compute the categories present in the data and how many entries
  // each holds. Driven by the data, not a hard-coded list — adding an
  // entry with a new category surfaces it automatically.
  function categoryCounts() {
    const counts = new Map();
    ENTRIES.forEach((e) => counts.set(e.category, (counts.get(e.category) || 0) + 1));
    return counts;
  }

  function filteredEntries() {
    if (state.activeCategory === 'all') return ENTRIES;
    return ENTRIES.filter((e) => e.category === state.activeCategory);
  }

  function renderChips() {
    const counts = categoryCounts();
    const categories = Array.from(counts.keys()).sort();
    const chips = [
      { key: 'all', label: 'All', count: ENTRIES.length },
      ...categories.map((c) => ({ key: c, label: c, count: counts.get(c) })),
    ];
    $chips.innerHTML = chips.map((c) => `
      <button
        type="button"
        class="bl-chip ${c.key === state.activeCategory ? 'is-active' : ''}"
        data-cat="${escAttr(c.key)}"
        aria-pressed="${c.key === state.activeCategory ? 'true' : 'false'}"
      >
        ${escText(c.label)}
        <span class="bl-chip-count">${c.count}</span>
      </button>
    `).join('');
  }

  function renderList() {
    const visible = filteredEntries();
    if (visible.length === 0) {
      $list.innerHTML = '<li class="bl-empty"><p>No entries in this category yet.</p></li>';
      return;
    }
    $list.innerHTML = visible.map((e) => `
      <li>
        <button
          type="button"
          class="bl-row ${e.id === state.selectedId ? 'is-active' : ''}"
          data-id="${escAttr(e.id)}"
          aria-current="${e.id === state.selectedId ? 'true' : 'false'}"
        >
          <div class="bl-row-head">
            <span class="bl-row-date">${escText(e.date)}</span>
            <span class="bl-sev" data-sev="${escAttr(e.severity || 'minor')}">${escText(e.severity || 'minor')}</span>
          </div>
          <h3 class="bl-row-title">${escText(e.title)}</h3>
          <div class="bl-row-meta">
            <span class="bl-tag">${escText(e.category)}</span>
          </div>
        </button>
      </li>
    `).join('');
  }

  function renderDetail() {
    const e = ENTRIES.find((x) => x.id === state.selectedId);
    if (!e) {
      $detail.innerHTML = '<div class="bl-empty"><p>Select an entry to read.</p></div>';
      return;
    }
    // The symptom/cause/fix/lesson fields can contain trusted HTML
    // (we author them in this file, no user input). They render as-is
    // so we can use <code>, <strong>, <em> for emphasis. The title,
    // category, date are plain text and get escaped.
    $detail.innerHTML = `
      <div class="bl-detail-meta">
        <span class="bl-row-date">${escText(e.date)}</span>
        <span class="bl-tag">${escText(e.category)}</span>
        <span class="bl-sev" data-sev="${escAttr(e.severity || 'minor')}">${escText(e.severity || 'minor')}</span>
      </div>
      <h2>${escText(e.title)}</h2>

      <div class="bl-section">
        <h3>Symptom</h3>
        <p>${e.symptom}</p>
      </div>

      <div class="bl-section">
        <h3>Cause</h3>
        <p>${e.cause}</p>
      </div>

      <div class="bl-section">
        <h3>Fix</h3>
        <p>${e.fix}</p>
      </div>

      <div class="bl-section bl-section--lesson">
        <h3>Lesson</h3>
        <p>${e.lesson}</p>
      </div>
    `;
    // Update the URL hash so the entry can be linked / bookmarked.
    if (history.replaceState) {
      history.replaceState(null, '', '#' + e.id);
    }
    // Update document title so a bookmarked page shows the entry.
    document.title = `${e.title} — Build Log — Rycode`;
  }

  function renderCounts() {
    const visible = filteredEntries().length;
    const total   = ENTRIES.length;
    const newest  = ENTRIES.reduce((acc, e) =>
      parseDate(e.date) > parseDate(acc) ? e.date : acc, ENTRIES[0].date);
    const filterLabel = state.activeCategory === 'all'
      ? 'all categories'
      : state.activeCategory.toLowerCase();
    $counts.textContent =
      `Showing ${visible} of ${total} · ${filterLabel} · last updated ${newest}`;
  }

  function renderAll() {
    renderChips();
    renderList();
    renderDetail();
    renderCounts();
  }

  // Tiny escapers. The ones used here protect against authoring
  // mistakes (a stray < in a category name, etc.) more than against
  // attacker input — there is no attacker input on this page, ENTRIES
  // is fully authored. Still belt-and-suspenders.
  function escText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return escText(s).replace(/"/g, '&quot;');
  }

  // Date parser for "MM/DD/YYYY" → Date object, used to find the
  // newest entry without imposing a particular array order.
  function parseDate(s) {
    const [m, d, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  // ----------------------------------------------------------------
  // 4. EVENTS
  // ----------------------------------------------------------------

  // Chip clicks: change the active category and re-render. If the
  // current selection is no longer in the filtered list, fall back
  // to the first visible entry.
  $chips.addEventListener('click', (e) => {
    const cat = e.target.closest('.bl-chip')?.dataset.cat;
    if (!cat) return;
    state.activeCategory = cat;
    const visible = filteredEntries();
    if (!visible.find((x) => x.id === state.selectedId)) {
      state.selectedId = visible[0]?.id || null;
    }
    renderAll();
  });

  // Row clicks: change the selected entry, scroll the detail into
  // view on mobile (where panes stack vertically).
  $list.addEventListener('click', (e) => {
    const id = e.target.closest('.bl-row')?.dataset.id;
    if (!id) return;
    state.selectedId = id;
    renderAll();
    if (window.matchMedia('(max-width: 900px)').matches) {
      $detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Hash routing: lets the user deep-link an entry with #entry-id.
  // Fires on load AND on navigation, so the browser back button works.
  function selectFromHash() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && ENTRIES.find((e) => e.id === hash)) {
      state.selectedId = hash;
      // If the entry is in a category that's currently filtered out,
      // widen the filter to "all" so the entry actually shows in the list.
      const entry = ENTRIES.find((e) => e.id === hash);
      if (state.activeCategory !== 'all' && entry.category !== state.activeCategory) {
        state.activeCategory = 'all';
      }
    }
  }
  window.addEventListener('hashchange', () => {
    selectFromHash();
    renderAll();
  });

  // ----------------------------------------------------------------
  // 5. BOOTSTRAP
  // ----------------------------------------------------------------
  function init() {
    if (ENTRIES.length === 0) return;
    // Default selection: hash entry > newest entry.
    state.selectedId = ENTRIES[0].id;
    selectFromHash();
    renderAll();
  }
  init();
})();
