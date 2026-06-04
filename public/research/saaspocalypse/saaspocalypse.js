/* ====================================================================
   SAASPOCALYPSE 2026 — saaspocalypse.js
   Vanilla JS + Chart.js. All logic runs after DOMContentLoaded.

   Three charts + two small interactive widgets:
     - Chart 1: Vendor impact (horizontal bar)
     - Chart 2: Build vs. Buy preference (line, Q1 2024 → Q3 2026)
     - Chart 3: Finance budget allocation (doughnut, 2024/2026 toggle)
     - Widget A: Year toggle (2024 / 2026) — swaps Chart 3 data
     - Widget B: Tab switcher (Finance building / GRC survives)

   TABLE OF CONTENTS
   -----------------
   1. BOOT + SHARED CONFIG     (motion check, palette, common options)
   2. CHART 1 — VENDOR IMPACT
   3. CHART 2 — BUILD VS. BUY
   4. CHART 3 — FINANCE BUDGET (+ year-toggle widget)
   5. WIDGET — TAB SWITCHER
   ==================================================================== */


document.addEventListener('DOMContentLoaded', () => {

  // Honor OS-level reduced-motion — disables chart animation below.
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;


  // ================================================================
  // 1. BOOT + SHARED CONFIG
  // Rycode palette lives in CSS custom props, but Chart.js wants
  // literal strings at init time. Keep them in one place so a theme
  // tweak is a single edit.
  // ================================================================
  const palette = {
    gold:       '#d4a84b',
    goldHot:    '#ffb547',
    goldDim:    'rgba(212, 168, 75, 0.35)',
    green:      '#4ade80',
    greenSoft:  'rgba(74, 222, 128, 0.18)',
    text:       '#f4f4f5',
    textSoft:   '#a1a1aa',
    textFaint:  '#71717a',
    grid:       'rgba(255, 255, 255, 0.04)',
    surface:    '#141414',
    border:     '#27272a',
  };

  // Shared Chart.js defaults so every chart feels native to the page.
  Chart.defaults.color = palette.textSoft;
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';

  // Reusable options object — each chart spreads it, then overrides.
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion ? false : { duration: 400 },
    plugins: {
      legend: {
        labels: {
          color: palette.textSoft,
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.96)',
        borderColor: '#3a2f18',
        borderWidth: 1,
        titleColor: palette.gold,
        bodyColor: palette.text,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };


  // ================================================================
  // 2. CHART 1 — VENDOR IMPACT  (horizontal bar)
  // Projected 12-month revenue change by vendor category. Losses in
  // gold tones (gold-hot → amber gradient), growth in green so the
  // GRC +14% bar visually breaks away from the pack.
  // ================================================================
  const vendorCanvas = document.getElementById('vendorImpactChart');
  if (vendorCanvas) {
    const vendorColors = [
      '#ffb547',  // -68%  helpdesk          (gold-hot)
      '#ffb547',  // -52%  CRM
      '#e5a848',  // -45%  project mgmt
      '#c69840',  // -30%  HRIS
      '#a88238',  // -25%  financial middleware
      '#4ade80',  // +14%  GRC                (green)
    ];

    new Chart(vendorCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [
          'Basic Ticketing / Helpdesk',
          'Generic CRM',
          'Project Management',
          'Basic HRIS / Directory',
          'Financial Middleware',
          'ERM / GRC Platforms',
        ],
        datasets: [{
          label: 'Projected 12-mo revenue change',
          data: [-68, -52, -45, -30, -25, 14],
          backgroundColor: vendorColors,
          borderWidth: 0,
          borderRadius: 4,
          // Bars lean slim — feels less "dashboard boilerplate"
          barThickness: 22,
        }],
      },
      options: {
        ...commonOptions,
        indexAxis: 'y',
        plugins: {
          ...commonOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                return v > 0 ? `Projected growth: +${v}%` : `Projected loss: ${v}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid:   { color: palette.grid, drawBorder: false },
            ticks:  { color: palette.textSoft, callback: (v) => v + '%' },
            title:  { display: true, text: '% change in revenue intent', color: palette.textFaint },
          },
          y: {
            grid:   { display: false },
            ticks:  { color: palette.text, font: { size: 12 } },
          },
        },
      },
    });
  }


  // ================================================================
  // 3. CHART 2 — BUILD VS. BUY  (line)
  // CIO preference over 8 quarters. Buy = gold, Build = green, matching
  // the palette used on the Build-vs-Buy calculator page so a viewer
  // flipping between the two pages sees the same colors mean the same
  // thing.
  // ================================================================
  const buildBuyCanvas = document.getElementById('buildBuyChart');
  if (buildBuyCanvas) {
    new Chart(buildBuyCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Q1 2024', 'Q3 2024', 'Q1 2025', 'Q3 2025', 'Q1 2026', 'Q3 2026 (proj)'],
        datasets: [
          {
            label: 'Preference to "Buy" (3rd-party SaaS)',
            data: [82, 78, 65, 45, 30, 20],
            borderColor: palette.goldHot,
            backgroundColor: 'rgba(255, 181, 71, 0.08)',
            borderWidth: 3,
            pointBackgroundColor: palette.goldHot,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Preference to "Build" (AI-assisted internal tooling)',
            data: [18, 22, 35, 55, 70, 80],
            borderColor: palette.green,
            backgroundColor: 'rgba(74, 222, 128, 0.06)',
            borderWidth: 3,
            pointBackgroundColor: palette.green,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        ...commonOptions,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          ...commonOptions.plugins,
          legend: {
            ...commonOptions.plugins.legend,
            position: 'top',
            align: 'end',
          },
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            grid:  { display: false },
            ticks: { color: palette.textSoft },
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid:  { color: palette.grid, borderDash: [4, 4] },
            ticks: { color: palette.textSoft, callback: (v) => v + '%' },
            title: { display: true, text: 'CIO survey preference (%)', color: palette.textFaint },
          },
        },
      },
    });
  }


  // ================================================================
  // 4. CHART 3 — FINANCE BUDGET  (doughnut + year toggle)
  // Four-slice allocation that re-renders when the user picks 2024
  // or 2026. Colors: generic SaaS = muted gold, internal = green,
  // GRC = gold-hot (the "growth" slice), raw compute = neutral.
  // ================================================================
  const budgetCanvas = document.getElementById('financeBudgetChart');
  let budgetChart;

  const budgetData = {
    '2024': [65, 10, 15, 10],
    '2026': [25, 35, 25, 15],
  };
  const budgetLabels = [
    'Generic SaaS subscriptions',
    'Internal AI / Dev tools & labor',
    'ERM / GRC specialty SaaS',
    'Raw cloud compute (AI hosting)',
  ];
  const budgetColors = [
    'rgba(212, 168, 75, 0.45)',  // generic SaaS — muted gold (fading out)
    '#4ade80',                   // internal AI — green (the "build" slice)
    '#ffb547',                   // GRC — gold-hot (the growing slice)
    '#52525b',                   // raw compute — neutral gray
  ];
  const budgetInsight = {
    '2024': '2024 baseline — heavy reliance on generic multi-tenant cloud SaaS.',
    '2026': '2026 shift — internal AI development dominates; defensive spend moves into GRC.',
  };

  if (budgetCanvas) {
    budgetChart = new Chart(budgetCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: budgetLabels,
        datasets: [{
          data: budgetData['2024'],
          backgroundColor: budgetColors,
          borderWidth: 2,
          borderColor: palette.surface,   // slices separated by the card background
          hoverOffset: 6,
        }],
      },
      options: {
        ...commonOptions,
        cutout: '62%',
        plugins: {
          ...commonOptions.plugins,
          legend: {
            ...commonOptions.plugins.legend,
            position: 'bottom',
            labels: {
              ...commonOptions.plugins.legend.labels,
              padding: 14,
            },
          },
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
            },
          },
        },
      },
    });
  }

  // --- Year-toggle handler ---
  // Swap the dataset in place (not rebuild) so Chart.js animates the
  // slice transition instead of flashing a fresh render.
  const yearButtons = document.querySelectorAll('.year-btn');
  const insightEl   = document.getElementById('budgetInsightText');

  const setYear = (year) => {
    if (!budgetChart || !budgetData[year]) return;

    budgetChart.data.datasets[0].data = budgetData[year];
    budgetChart.update();

    if (insightEl) insightEl.textContent = budgetInsight[year];

    yearButtons.forEach((btn) => {
      const isActive = btn.dataset.year === year;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  yearButtons.forEach((btn) => {
    btn.addEventListener('click', () => setYear(btn.dataset.year));
  });


  // ================================================================
  // 5. WIDGET — TAB SWITCHER
  // Two tabs in the Finance & GRC section. Clicking a tab hides the
  // other pane, flips the active class on the button, and syncs
  // aria-selected for screen readers.
  // ================================================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes   = document.querySelectorAll('.tab-pane');

  const setTab = (tabId) => {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    tabPanes.forEach((pane) => {
      const isActive = pane.id === tabId;
      pane.classList.toggle('is-active', isActive);
      if (isActive) pane.removeAttribute('hidden');
      else          pane.setAttribute('hidden', '');
    });
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });


  // ================================================================
  // 6. CHART 4 — ERM DAYS-EARLIER (Q2 2026 update, v1.1)
  // Single-data-point comparison: legacy ERM baseline vs. AI-enhanced
  // ERM identifying material risks ~73 days earlier. The chart's
  // narrative job is to give the addendum's most concrete benefit
  // figure visual weight against an otherwise risk-heavy section.
  // ================================================================
  const ermCanvas = document.getElementById('ermDaysChart');
  if (ermCanvas && typeof Chart !== 'undefined') {
    new Chart(ermCanvas, {
      type: 'bar',
      data: {
        labels: ['Legacy ERM (quarterly attestations)', 'AI-enhanced ERM (continuous monitoring)'],
        datasets: [{
          label: 'Days earlier vs. legacy baseline',
          data: [0, 73],
          backgroundColor: [palette.textFaint, palette.gold],
          borderColor:     [palette.textFaint, palette.goldHot],
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 36,
        }],
      },
      options: {
        ...commonOptions,
        indexAxis: 'y',
        plugins: {
          ...commonOptions.plugins,
          legend: { display: false },
          title: {
            display: true,
            text: 'Material risks identified earlier with AI-enhanced ERM (~73 days)',
            color: palette.text,
            font: { size: 14, weight: '600' },
            padding: { top: 4, bottom: 16 },
          },
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.parsed.x} days earlier`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: 90,
            grid:   { color: palette.grid, drawBorder: false },
            ticks:  { color: palette.textSoft, callback: (v) => v + 'd' },
            title:  { display: true, text: 'Days earlier than legacy baseline', color: palette.textSoft },
          },
          y: {
            grid:  { display: false },
            ticks: { color: palette.text, font: { size: 12 } },
          },
        },
      },
    });
  }


  // ================================================================
  // 7. FOOTNOTE TOOLTIPS (Q2 2026 update, v1.1)
  // Each <sup class="fn"><a href="#fn-N">N</a></sup> caller gets the
  // full source text as a native browser tooltip, so a reader can
  // skim citations on hover without scrolling to the sources list.
  // The anchor click still jumps to the source row, which is
  // visually highlighted by the :target selector in CSS.
  // ================================================================
  document.querySelectorAll('sup.fn a[href^="#fn-"]').forEach((link) => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    const text = target.textContent.replace(/\s+/g, ' ').trim();
    link.setAttribute('title', text);
    link.setAttribute('aria-label', 'Footnote ' + link.textContent.trim() + ': ' + text);
  });

});
