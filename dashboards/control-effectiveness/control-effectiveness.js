/* ==================================================================
   CONTROL EFFECTIVENESS & RESIDUAL RISK — calculator logic
   ------------------------------------------------------------------
   TABLE OF CONTENTS
     1. CONSTANTS  (color tokens read from CSS, seed defaults)
     2. STATE      (in-memory only, no persistence by design)
     3. MATH       (inherent / residual / portfolio aggregates)
     4. DOM REFS   (one lookup at startup, cached for the session)
     5. RENDER     (cards, summary, sr-table, chart)
     6. EVENTS     (delegation from one container, plus toolbar)
     7. EXPORT     (PNG + CSV download)
     8. BOOTSTRAP  (Chart.js init + first render)
   ------------------------------------------------------------------
   DESIGN NOTES
   - One source of truth: `state.risks`. Every mutation goes through
     a small set of helper functions, then triggers a partial render.
   - Sliders fire a LOT of input events; full DOM rebuilds on every
     drag would lose focus and feel laggy. So sliders patch only the
     numbers + chart in place. Add/remove rebuilds the cards once.
   - No localStorage. Refresh = clean slate. This is deliberate;
     adding persistence later means picking a versioned schema
     before users start saving things.
   ================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. CONSTANTS
  // ----------------------------------------------------------------

  // Read the color tokens out of computed styles so the chart's
  // colors stay in lock-step with the CSS — no hard-coded hex twins
  // to drift apart.
  const cssVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const COLORS = {
    inherent: cssVar('--ce-inherent') || '#6b7280',
    residual: cssVar('--gold')        || '#d4a84b',
    grid:     'rgba(255,255,255,0.06)',
    text:     cssVar('--text-muted')  || '#a8a8b3',
    textBold: cssVar('--text')        || '#e8e8ec',
    surface:  cssVar('--surface')     || '#161618',
  };

  // Seed data. Three example risks with different shapes so a
  // first-time visitor sees the calculator's range immediately.
  const DEFAULTS = () => ({
    risks: [
      {
        name: 'Vendor data breach',
        likelihood: 4,
        impact: 5,
        controls: [
          { name: 'Vendor security review (annual)', effectiveness: 60 },
          { name: 'Contractual data clauses',         effectiveness: 35 },
        ],
      },
      {
        name: 'Phishing → admin account takeover',
        likelihood: 5,
        impact: 4,
        controls: [
          { name: 'MFA on admin accounts',  effectiveness: 80 },
          { name: 'Phishing simulations',   effectiveness: 30 },
          { name: 'Email link rewriting',   effectiveness: 50 },
        ],
      },
      {
        name: 'Manual reporting error',
        likelihood: 3,
        impact: 2,
        controls: [
          { name: 'Maker-checker review', effectiveness: 70 },
        ],
      },
    ],
  });

  // ----------------------------------------------------------------
  // 2. STATE
  // ----------------------------------------------------------------
  let state = DEFAULTS();
  let chart = null; // Chart.js instance, set in bootstrap

  // ----------------------------------------------------------------
  // 3. MATH
  // ----------------------------------------------------------------

  // Inherent: the textbook 5x5 ERM heat-map score.
  const inherentOf = (risk) => risk.likelihood * risk.impact;

  // Residual: multiplicative defense-in-depth. Each control reduces
  // what's left, not the original. This is conservative and matches
  // how independent controls actually compose in practice.
  const residualOf = (risk) => {
    const inh = inherentOf(risk);
    const survival = risk.controls.reduce(
      (acc, c) => acc * (1 - (c.effectiveness / 100)),
      1
    );
    return inh * survival;
  };

  const reductionPctOf = (risk) => {
    const inh = inherentOf(risk);
    if (inh === 0) return 0;
    return (1 - residualOf(risk) / inh) * 100;
  };

  const portfolio = () => {
    const inh = state.risks.reduce((s, r) => s + inherentOf(r), 0);
    const res = state.risks.reduce((s, r) => s + residualOf(r), 0);
    const pct = inh === 0 ? 0 : (1 - res / inh) * 100;
    return { inh, res, pct };
  };

  // Likelihood & impact words — labels next to the numeric value so
  // the slider isn't just a naked digit. Standard ERM vocabulary.
  const SCALE_WORDS = ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'];

  // Control-effectiveness tiers — the qualitative read of the
  // percentage. Three bands map cleanly to the slider's step=5 grid:
  //   0–33  → Ineffective         (7 stops: 0, 5, 10, 15, 20, 25, 30)
  //   35–65 → Partially Effective (7 stops: 35, 40, 45, 50, 55, 60, 65)
  //   70–100 → Effective          (7 stops: 70, 75, 80, 85, 90, 95, 100)
  // Symmetric, and matches how an audit/risk practitioner labels a
  // control: design exists vs. design is patchy vs. design works.
  const effectivenessTier = (v) => {
    if (v <= 33) return 'Ineffective';
    if (v <= 66) return 'Partially Effective';
    return 'Effective';
  };

  // What gets rendered inside the slider's right-hand readout.
  // Mirrors how likelihood/impact reads ("4 · HIGH") for visual rhythm.
  const effectivenessReadout = (v) => `${v}% · ${effectivenessTier(v)}`;

  // ----------------------------------------------------------------
  // 4. DOM REFS
  // ----------------------------------------------------------------
  const $list       = document.getElementById('ceRiskList');
  const $sumInh     = document.getElementById('ceInherentTotal');
  const $sumRes     = document.getElementById('ceResidualTotal');
  const $sumPct     = document.getElementById('ceReductionPct');
  const $tableBody  = document.querySelector('#ceChartTable tbody');
  const $canvas     = document.getElementById('ceChart');
  const $addRiskBtn = document.getElementById('ceAddRisk');
  const $resetBtn   = document.getElementById('ceReset');

  // ----------------------------------------------------------------
  // 5. RENDER
  // ----------------------------------------------------------------

  // ——— A single risk card. Returns an HTMLElement, not a string,
  //     so the parent can .replaceChildren() cleanly.
  function renderRiskCard(risk, riskIndex) {
    const card = document.createElement('article');
    card.className = 'ce-risk';
    card.dataset.riskIndex = String(riskIndex);
    card.setAttribute('aria-labelledby', `ce-risk-${riskIndex}-name`);

    const inh = inherentOf(risk);
    const res = residualOf(risk);

    card.innerHTML = `
      <header class="ce-risk-head">
        <input
          type="text"
          class="ce-risk-name"
          id="ce-risk-${riskIndex}-name"
          data-field="risk-name"
          value="${escapeAttr(risk.name)}"
          aria-label="Risk name"
        />
        <div class="ce-risk-scores">
          <div class="ce-score ce-score--inherent">
            <span>Inherent</span>
            <span class="ce-score-num" data-num="inherent">${inh}</span>
          </div>
          <div class="ce-score ce-score--residual">
            <span>Residual</span>
            <span class="ce-score-num" data-num="residual">${res.toFixed(1)}</span>
          </div>
        </div>
      </header>

      <div class="ce-inherent-block">
        <div class="ce-slider">
          <div class="ce-slider-head">
            <label for="ce-l-${riskIndex}">Likelihood</label>
            <span class="ce-slider-value" data-num="likelihood">${risk.likelihood} · ${SCALE_WORDS[risk.likelihood]}</span>
          </div>
          <input
            type="range" class="ce-range"
            id="ce-l-${riskIndex}"
            data-field="likelihood"
            min="1" max="5" step="1" value="${risk.likelihood}"
            aria-label="Likelihood, 1 (very low) to 5 (very high)"
          />
        </div>
        <div class="ce-slider">
          <div class="ce-slider-head">
            <label for="ce-i-${riskIndex}">Impact</label>
            <span class="ce-slider-value" data-num="impact">${risk.impact} · ${SCALE_WORDS[risk.impact]}</span>
          </div>
          <input
            type="range" class="ce-range"
            id="ce-i-${riskIndex}"
            data-field="impact"
            min="1" max="5" step="1" value="${risk.impact}"
            aria-label="Impact, 1 (very low) to 5 (very high)"
          />
        </div>
      </div>

      <p class="ce-controls-label">Controls (${risk.controls.length})</p>
      <div class="ce-controls" data-controls-for="${riskIndex}">
        ${risk.controls.map((c, ci) => renderControlRowHTML(c, riskIndex, ci)).join('')}
      </div>

      <div class="ce-card-actions">
        <button type="button" class="ce-btn ce-btn--ghost" data-action="add-control">+ Add control</button>
        <button type="button" class="ce-btn ce-btn--ghost ce-btn--danger" data-action="remove-risk">Remove risk</button>
      </div>
    `;
    return card;
  }

  function renderControlRowHTML(control, riskIndex, controlIndex) {
    return `
      <div class="ce-control-row" data-control-index="${controlIndex}">
        <input
          type="text"
          class="ce-control-name"
          data-field="control-name"
          value="${escapeAttr(control.name)}"
          aria-label="Control name"
        />
        <div class="ce-control-eff">
          <div class="ce-control-eff-head">
            <label for="ce-c-${riskIndex}-${controlIndex}">Effectiveness</label>
            <span class="ce-control-eff-value" data-num="effectiveness">${effectivenessReadout(control.effectiveness)}</span>
          </div>
          <input
            type="range" class="ce-range"
            id="ce-c-${riskIndex}-${controlIndex}"
            data-field="effectiveness"
            min="0" max="100" step="5" value="${control.effectiveness}"
            aria-label="Control effectiveness, 0 to 100 percent"
          />
          <div style="display:flex; justify-content:flex-end; margin-top:4px;">
            <button type="button" class="ce-btn ce-btn--ghost ce-btn--danger" data-action="remove-control" style="padding:4px 8px;">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  // Tiny attribute escaper — risk names go straight into value="..."
  // so they need to be safe even if a user pastes < or " or &.
  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderAllCards() {
    const frag = document.createDocumentFragment();
    state.risks.forEach((r, i) => frag.appendChild(renderRiskCard(r, i)));
    $list.replaceChildren(frag);
  }

  function updateSummary() {
    const p = portfolio();
    $sumInh.textContent = p.inh.toFixed(0);
    $sumRes.textContent = p.res.toFixed(1);
    $sumPct.textContent = p.pct.toFixed(0) + '%';
  }

  function updateSrTable() {
    const rows = state.risks.map((r) => `
      <tr>
        <td>${escapeAttr(r.name)}</td>
        <td>${inherentOf(r)}</td>
        <td>${residualOf(r).toFixed(1)}</td>
        <td>${reductionPctOf(r).toFixed(0)}%</td>
      </tr>
    `).join('');
    $tableBody.innerHTML = rows;
  }

  // Patch a single card's numeric readouts after a slider drag,
  // without rebuilding the card (which would lose focus).
  function patchRiskNumbers(riskIndex) {
    const card = $list.querySelector(`[data-risk-index="${riskIndex}"]`);
    if (!card) return;
    const r = state.risks[riskIndex];
    card.querySelector('[data-num="inherent"]').textContent = inherentOf(r);
    card.querySelector('[data-num="residual"]').textContent = residualOf(r).toFixed(1);
    card.querySelector('[data-num="likelihood"]').textContent =
      `${r.likelihood} · ${SCALE_WORDS[r.likelihood]}`;
    card.querySelector('[data-num="impact"]').textContent =
      `${r.impact} · ${SCALE_WORDS[r.impact]}`;
  }

  function patchControlValue(riskIndex, controlIndex) {
    const card = $list.querySelector(`[data-risk-index="${riskIndex}"]`);
    if (!card) return;
    const row = card.querySelector(`[data-controls-for="${riskIndex}"] [data-control-index="${controlIndex}"]`);
    if (!row) return;
    row.querySelector('[data-num="effectiveness"]').textContent =
      effectivenessReadout(state.risks[riskIndex].controls[controlIndex].effectiveness);
  }

  // ——— Chart ———————————————————————————————————————————————
  function chartData() {
    return {
      labels: state.risks.map((r) => r.name),
      datasets: [
        {
          label: 'Inherent',
          data: state.risks.map((r) => inherentOf(r)),
          backgroundColor: COLORS.inherent,
          borderRadius: 3,
        },
        {
          label: 'Residual',
          data: state.risks.map((r) => +residualOf(r).toFixed(2)),
          backgroundColor: COLORS.residual,
          borderRadius: 3,
        },
      ],
    };
  }

  function buildChart() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chart = new Chart($canvas, {
      type: 'bar',
      data: chartData(),
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: reduced ? false : { duration: 250 },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: 25,
            grid:   { color: COLORS.grid, drawBorder: false },
            ticks:  { color: COLORS.text, stepSize: 5 },
            title:  { display: true, text: 'Risk score (likelihood × impact)', color: COLORS.text },
          },
          y: {
            grid:  { display: false },
            ticks: { color: COLORS.textBold, font: { size: 13 } },
          },
        },
        plugins: {
          legend: { labels: { color: COLORS.textBold } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x.toFixed(1)}`,
            },
          },
        },
      },
    });
    // Make the canvas tall enough that 3-6 risks read clearly.
    // Height = base + per-row band, so adding risks expands the chart.
    sizeChart();
  }

  function sizeChart() {
    const rows = state.risks.length || 1;
    const px = Math.max(280, 70 + rows * 60);
    $canvas.parentElement.style.height = px + 'px';
  }

  function updateChart() {
    if (!chart) return;
    chart.data = chartData();
    sizeChart();
    chart.update();
  }

  // ——— Big render: full rebuild + everything refreshed ———
  function renderAll() {
    renderAllCards();
    updateSummary();
    updateSrTable();
    updateChart();
  }

  // ----------------------------------------------------------------
  // 6. EVENTS
  // ----------------------------------------------------------------

  // One delegated handler for every input inside the cards. We don't
  // attach listeners per slider — that would scale badly and wouldn't
  // catch dynamically added controls/risks.
  $list.addEventListener('input', (e) => {
    const target = e.target;
    const card = target.closest('.ce-risk');
    if (!card) return;
    const ri = Number(card.dataset.riskIndex);
    const field = target.dataset.field;
    if (field == null) return;

    const risk = state.risks[ri];

    if (field === 'risk-name') {
      risk.name = target.value;
      // Risk name is shown on the chart's Y axis — refresh chart.
      updateChart();
      updateSrTable();
      return;
    }
    if (field === 'likelihood' || field === 'impact') {
      risk[field] = Number(target.value);
      patchRiskNumbers(ri);
      updateSummary();
      updateSrTable();
      updateChart();
      return;
    }
    if (field === 'control-name') {
      const row = target.closest('.ce-control-row');
      const ci = Number(row.dataset.controlIndex);
      risk.controls[ci].name = target.value;
      // Control name is internal to the card; nothing else to update.
      return;
    }
    if (field === 'effectiveness') {
      const row = target.closest('.ce-control-row');
      const ci = Number(row.dataset.controlIndex);
      risk.controls[ci].effectiveness = Number(target.value);
      patchControlValue(ri, ci);
      patchRiskNumbers(ri);
      updateSummary();
      updateSrTable();
      updateChart();
      return;
    }
  });

  // Click handler for + Add control / Remove control / Remove risk.
  // These change the SHAPE of state, so we do a full re-render.
  $list.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    const card = e.target.closest('.ce-risk');
    if (!card) return;
    const ri = Number(card.dataset.riskIndex);

    if (action === 'add-control') {
      state.risks[ri].controls.push({ name: 'New control', effectiveness: 50 });
      renderAll();
      return;
    }
    if (action === 'remove-control') {
      const row = e.target.closest('.ce-control-row');
      const ci = Number(row.dataset.controlIndex);
      state.risks[ri].controls.splice(ci, 1);
      renderAll();
      return;
    }
    if (action === 'remove-risk') {
      state.risks.splice(ri, 1);
      renderAll();
      return;
    }
  });

  // Toolbar
  $addRiskBtn.addEventListener('click', () => {
    state.risks.push({
      name: 'New risk',
      likelihood: 3,
      impact: 3,
      controls: [{ name: 'New control', effectiveness: 50 }],
    });
    renderAll();
  });

  $resetBtn.addEventListener('click', () => {
    state = DEFAULTS();
    renderAll();
  });

  // ----------------------------------------------------------------
  // 7. EXPORT
  // ----------------------------------------------------------------

  // PNG: Chart.js renders to canvas with a transparent background.
  // For a downloaded image that reads on a slide deck or in an email,
  // we composite the chart onto an opaque background of the page's
  // surface color. That way the gold bars don't float on transparency.
  function exportPNG() {
    if (!chart) return;
    const src = chart.canvas;
    const out = document.createElement('canvas');
    out.width  = src.width;
    out.height = src.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    const url = out.toDataURL('image/png');
    triggerDownload(url, `residual-risk-${stamp()}.png`);
  }

  // CSV escape: wrap any field containing a comma, quote, or newline
  // in double quotes, and double up any internal quotes. RFC 4180.
  function csvCell(v) {
    const s = String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function exportCSV() {
    const header = ['Risk', 'Inherent', 'Residual', 'Reduction %'];
    const rows = state.risks.map((r) => [
      r.name,
      inherentOf(r),
      residualOf(r).toFixed(2),
      reductionPctOf(r).toFixed(1),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    // BOM so Excel opens it as UTF-8 instead of Latin-1.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `residual-risk-${stamp()}.csv`);
    // Free the blob URL after the click has had time to fire.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function triggerDownload(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function stamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  // Wire export buttons (delegated, so it works regardless of order).
  document.addEventListener('click', (e) => {
    const kind = e.target.dataset && e.target.dataset.export;
    if (!kind) return;
    if (kind === 'png') exportPNG();
    if (kind === 'csv') exportCSV();
  });

  // ----------------------------------------------------------------
  // 8. BOOTSTRAP
  // ----------------------------------------------------------------
  function init() {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js failed to load — calculator UI will still work, chart will not.');
    }
    renderAllCards();
    updateSummary();
    updateSrTable();
    if (typeof Chart !== 'undefined') {
      buildChart();
    }
  }

  // Chart.js loads via a non-async <script> tag right above this
  // file, so by the time we run, Chart is defined. Safe to init.
  init();
})();
