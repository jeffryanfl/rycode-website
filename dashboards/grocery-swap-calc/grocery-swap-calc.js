/* ====================================================================
   GROCERY SWAP CALCULATOR — grocery-swap-calc.js
   Vanilla JS. All logic inside DOMContentLoaded.

   TABLE OF CONTENTS
   -----------------
   1. INPUT REFS         (one place where DOM handles are collected)
   2. READ INPUTS        (pull values, coerce to numbers, clamp)
   3. MATH CORE          (compute per-side + switching + verdict)
   4. FORMATTERS         (money, percent, signed deltas)
   5. RENDER — KPIs      (old → new → delta pills + formula hints)
   6. RENDER — VERDICT   (SWITCH / MARGINAL / HOLD + rationale)
   7. RENDER — MATH      (derivation with substituted values)
   8. RENDER — CHART     (shrink sensitivity line chart)
   9. EXPORT — CSV       (Blob-based download of current scenario)
  10. EXPORT — PRINT     (stamp date and window.print)
  11. BOOT               (wire inputs, initial render)
   ==================================================================== */


document.addEventListener('DOMContentLoaded', () => {

  // ================================================================
  // 1. INPUT REFS
  // All input/select elements referenced in one object so the math
  // code never has to touch document.getElementById directly.
  // ================================================================
  const refs = {
    // OLD product fields
    oldName:      document.getElementById('oldName'),
    oldCost:      document.getElementById('oldCost'),
    oldRetail:    document.getElementById('oldRetail'),
    oldShipped:   document.getElementById('oldShipped'),
    oldSold:      document.getElementById('oldSold'),
    oldMarkdown:  document.getElementById('oldMarkdown'),
    oldPromo:     document.getElementById('oldPromo'),

    // NEW product fields
    newName:      document.getElementById('newName'),
    newCost:      document.getElementById('newCost'),
    newRetail:    document.getElementById('newRetail'),
    newShipped:   document.getElementById('newShipped'),
    newSold:      document.getElementById('newSold'),
    newMarkdown:  document.getElementById('newMarkdown'),
    newPromo:     document.getElementById('newPromo'),
    newSlotting:  document.getElementById('newSlotting'),
    newTransition:document.getElementById('newTransition'),
    newCannibal:  document.getElementById('newCannibal'),

    // Global
    stores:       document.getElementById('stores'),
    scale:        document.getElementById('scale'),
  };

  // Output refs — the KPI tile targets, verdict, math, chart canvas.
  const out = {
    // KPIs
    pennyOld:     document.getElementById('kpiPennyOld'),
    pennyNew:     document.getElementById('kpiPennyNew'),
    pennyDelta:   document.getElementById('kpiPennyDelta'),
    pennyFormula: document.getElementById('kpiPennyFormula'),

    weeklyOld:    document.getElementById('kpiWeeklyOld'),
    weeklyNew:    document.getElementById('kpiWeeklyNew'),
    weeklyDelta:  document.getElementById('kpiWeeklyDelta'),
    weeklyFormula:document.getElementById('kpiWeeklyFormula'),

    annualOld:    document.getElementById('kpiAnnualOld'),
    annualNew:    document.getElementById('kpiAnnualNew'),
    annualDelta:  document.getElementById('kpiAnnualDelta'),
    annualFormula:document.getElementById('kpiAnnualFormula'),

    breakeven:        document.getElementById('kpiBreakeven'),
    breakevenFormula: document.getElementById('kpiBreakevenFormula'),

    // Verdict
    verdict:           document.getElementById('verdict'),
    verdictHeadline:   document.getElementById('verdictHeadline'),
    verdictRationale:  document.getElementById('verdictRationale'),

    // Math
    mathOld:       document.getElementById('mathOld'),
    mathNew:       document.getElementById('mathNew'),
    mathOldTitle:  document.getElementById('mathOldTitle'),
    mathNewTitle:  document.getElementById('mathNewTitle'),
    mathSummary:   document.getElementById('mathSummary'),

    // Chart
    chartCanvas:   document.getElementById('sensitivityChart'),

    // Actions
    exportCsv:     document.getElementById('exportCsv'),
    printReport:   document.getElementById('printReport'),
  };


  // ================================================================
  // 2. READ INPUTS
  // num() coerces and clamps. percent() divides by 100 for rate fields.
  // ================================================================
  const num = (el, fallback = 0) => {
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : fallback;
  };
  const clampPct = v => Math.max(0, Math.min(1, v));

  function readState() {
    const stores = Math.max(1, num(refs.stores, 1));
    const scale  = refs.scale.value; // 'per-store' | 'chain'

    return {
      stores,
      scale,
      old: {
        name:      refs.oldName.value || 'Current product',
        cost:      num(refs.oldCost),
        retail:    num(refs.oldRetail),
        shipped:   Math.max(0, num(refs.oldShipped)),
        sold:      Math.max(0, num(refs.oldSold)),
        markdown:  clampPct(num(refs.oldMarkdown) / 100),
        promo:     num(refs.oldPromo),
      },
      new: {
        name:       refs.newName.value || 'Proposed replacement',
        cost:       num(refs.newCost),
        retail:     num(refs.newRetail),
        shipped:    Math.max(0, num(refs.newShipped)),
        sold:       Math.max(0, num(refs.newSold)),
        markdown:   clampPct(num(refs.newMarkdown) / 100),
        promo:      num(refs.newPromo),
        slotting:   Math.max(0, num(refs.newSlotting)),
        transition: Math.max(0, num(refs.newTransition)),
        cannibal:   clampPct(num(refs.newCannibal) / 100),
      },
    };
  }


  // ================================================================
  // 3. MATH CORE
  //
  // computeSide(p, stores, scale, cannibal = 0) returns the derived
  // numbers for one product:
  //   shrink         = (shipped - sold) / shipped     (floored at 0)
  //   netCost        = cost - promo                   (supplier $ reduces landed cost)
  //   effectiveCost  = netCost / (1 - shrink)         (spread shrink over sold units)
  //   effectiveRetail= retail * (1 - markdown)        (avg revenue after markdowns)
  //   penny          = effectiveRetail - effectiveCost
  //   weeklyGross    = penny * soldUnits(chainwide)
  //   annualGross    = weeklyGross * 52 * (1 - cannibal)
  //
  // "cannibal" is only applied to the new product — passed explicitly
  // so the old side uses 0.
  // ================================================================
  function computeSide(p, stores, scale, cannibal = 0) {
    const shrinkRaw = p.shipped > 0 ? (p.shipped - p.sold) / p.shipped : 0;
    const shrink    = Math.max(0, Math.min(0.95, shrinkRaw));

    const netCost         = p.cost - p.promo;
    const effectiveCost   = netCost / (1 - shrink);
    const effectiveRetail = p.retail * (1 - p.markdown);
    const penny           = effectiveRetail - effectiveCost;

    // Chain-wide sold units per week.
    const soldChainWeekly = scale === 'per-store' ? p.sold * stores : p.sold;
    const weeklyGross     = penny * soldChainWeekly;
    const annualGrossRaw  = weeklyGross * 52;
    const annualGross     = annualGrossRaw * (1 - cannibal);

    return {
      shrink, netCost, effectiveCost, effectiveRetail,
      penny, soldChainWeekly, weeklyGross,
      annualGrossRaw, annualGross,
    };
  }

  // Year-1 delta accounts for switching cost; ongoing delta does not.
  // Verdict logic:
  //   SWITCH    — year-1 delta > 0
  //   MARGINAL  — year-1 negative but switching cost pays back < 24 mo
  //   HOLD      — ongoing delta <= 0 OR payback > 24 mo
  function computeAll() {
    const s = readState();

    const oldR = computeSide(s.old, s.stores, s.scale, 0);
    const newR = computeSide(s.new, s.stores, s.scale, s.new.cannibal);

    const switchingCost = s.new.slotting + s.new.transition;
    const ongoingDelta  = newR.annualGross - oldR.annualGross;
    const year1Delta    = ongoingDelta - switchingCost;

    // Payback in months if ongoingDelta is positive.
    const paybackMonths = ongoingDelta > 0 ? (switchingCost / ongoingDelta) * 12 : Infinity;

    let verdict, headline, rationale;
    if (year1Delta > 0) {
      verdict  = 'switch';
      headline = 'SWITCH';
      rationale = `Year-one delta is positive: ${money(year1Delta)} after ${money(switchingCost)} in switching costs. The new product earns back the one-time fees and still adds money in year one.`;
    } else if (ongoingDelta > 0 && paybackMonths <= 24) {
      verdict  = 'marginal';
      headline = 'MARGINAL';
      rationale = `Year one is negative by ${money(-year1Delta)}, but the ongoing advantage of ${money(ongoingDelta)}/yr pays back switching costs in ${paybackMonths.toFixed(1)} months. Defensible if you're confident in the demand assumption.`;
    } else {
      verdict  = 'hold';
      headline = 'HOLD';
      if (ongoingDelta <= 0) {
        rationale = `Ongoing annual delta is ${money(ongoingDelta)} — the new product loses on per-unit math before switching costs even enter the picture. Revisit if unit cost, retail, or cannibalization changes.`;
      } else {
        rationale = `Payback is ${paybackMonths.toFixed(1)} months — slower than the 24-month threshold. The new item wins eventually, but the hurdle is too high on current inputs.`;
      }
    }

    // Break-even shrink on the NEW product: the shrink rate at which
    // new annual gross equals old annual gross (everything else fixed).
    const breakeven = breakevenShrink(s, oldR);

    return {
      state: s,
      old: oldR,
      new: newR,
      switchingCost,
      ongoingDelta,
      year1Delta,
      paybackMonths,
      verdict,
      headline,
      rationale,
      breakeven,
    };
  }

  // Solve: oldAnnual = penny(shrink) × soldChain × 52 × (1 - cannibal)
  // where penny(shrink) = effectiveRetail - netCost/(1 - shrink)
  // → 1 - shrink = netCost / (effectiveRetail - (oldAnnual / (soldChain × 52 × (1 - cannibal))))
  function breakevenShrink(s, oldR) {
    const p = s.new;
    const soldChainWeekly = s.scale === 'per-store' ? p.sold * s.stores : p.sold;
    const weeks = 52;
    const cannibalFactor = 1 - p.cannibal;

    if (soldChainWeekly <= 0 || cannibalFactor <= 0) return null;

    const requiredPenny = oldR.annualGross / (soldChainWeekly * weeks * cannibalFactor);
    const effectiveRetail = p.retail * (1 - p.markdown);
    const netCost = p.cost - p.promo;

    const denom = effectiveRetail - requiredPenny;
    if (denom <= 0 || netCost <= 0) return null;

    const oneMinusShrink = netCost / denom;
    const shrink = 1 - oneMinusShrink;
    // Only report if it falls in a sensible range.
    if (!Number.isFinite(shrink) || shrink < 0 || shrink > 0.95) return null;
    return shrink;
  }


  // ================================================================
  // 4. FORMATTERS
  // ================================================================
  const money = v =>
    (v < 0 ? '-' : '') + '$' +
    Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const moneyBig = v => {
    const sign = v < 0 ? '-' : '';
    const a = Math.abs(v);
    if (a >= 1_000_000) return sign + '$' + (a / 1_000_000).toFixed(2) + 'M';
    if (a >= 10_000)    return sign + '$' + (a / 1_000).toFixed(1) + 'K';
    return sign + '$' + a.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const pct = (v, digits = 1) =>
    (v * 100).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';

  const signedMoney = v => (v > 0 ? '+' : '') + money(v);
  const signedMoneyBig = v => (v > 0 ? '+' : '') + moneyBig(v);

  // Delta-pill helper: writes text + class for positive/negative/neutral.
  function setDelta(el, value, formatter) {
    if (value > 0)       { el.className = 'gs-kpi-delta is-positive'; el.textContent = formatter(value); }
    else if (value < 0)  { el.className = 'gs-kpi-delta is-negative'; el.textContent = formatter(value); }
    else                 { el.className = 'gs-kpi-delta is-neutral';  el.textContent = formatter(value); }
  }


  // ================================================================
  // 5. RENDER — KPIs
  // Formula hints get rewritten with live substituted values so the
  // user can always see "what this number actually means right now".
  // ================================================================
  function renderKPIs(r) {
    // Penny profit ——————————————————————————————————————————
    out.pennyOld.textContent   = money(r.old.penny);
    out.pennyNew.textContent   = money(r.new.penny);
    setDelta(out.pennyDelta, r.new.penny - r.old.penny, signedMoney);
    out.pennyFormula.textContent =
      `= retail × (1 − markdown) − (cost − promo) ÷ (1 − shrink)`;

    // Weekly gross ——————————————————————————————————————————
    out.weeklyOld.textContent  = moneyBig(r.old.weeklyGross);
    out.weeklyNew.textContent  = moneyBig(r.new.weeklyGross);
    setDelta(out.weeklyDelta, r.new.weeklyGross - r.old.weeklyGross, signedMoneyBig);
    out.weeklyFormula.textContent =
      `= penny × weekly units sold chain-wide (${r.old.soldChainWeekly.toLocaleString()} old / ${r.new.soldChainWeekly.toLocaleString()} new)`;

    // Annual gross ——————————————————————————————————————————
    out.annualOld.textContent  = moneyBig(r.old.annualGross);
    out.annualNew.textContent  = moneyBig(r.new.annualGross);
    setDelta(out.annualDelta, r.ongoingDelta, signedMoneyBig);
    const cannibalNote = r.state.new.cannibal > 0
      ? ` · new reduced ${pct(r.state.new.cannibal, 0)} for cannibalization`
      : '';
    out.annualFormula.textContent = `= weekly × 52${cannibalNote}`;

    // Break-even shrink ——————————————————————————————————————
    if (r.breakeven === null) {
      out.breakeven.textContent = 'n/a';
      out.breakevenFormula.textContent =
        'Break-even falls outside a plausible range — new product loses on per-unit math at any shrink.';
    } else {
      out.breakeven.textContent = pct(r.breakeven, 1);
      const currentNewShrink = r.old.shrink; // for a rough comparison cue we use the new's own shrink
      out.breakevenFormula.textContent =
        `new currently runs ${pct(r.new.shrink, 1)} shrink — ${r.new.shrink < r.breakeven ? 'you have headroom' : 'you are already past break-even'}.`;
    }
  }


  // ================================================================
  // 6. RENDER — VERDICT
  // Applies one of three classes so the card border + headline color
  // flip to green / gold / muted grey.
  // ================================================================
  function renderVerdict(r) {
    out.verdict.classList.remove('is-switch', 'is-marginal', 'is-hold');
    out.verdict.classList.add('is-' + r.verdict);
    out.verdictHeadline.textContent = r.headline;
    out.verdictRationale.textContent = r.rationale;
  }


  // ================================================================
  // 7. RENDER — MATH
  // Each product gets the same 7-step derivation rewritten with live
  // substituted values. Then a summary block walks the year-1 delta.
  // ================================================================
  function stepHTML(label, formula, substituted, result) {
    return `
      <div class="gs-math-step">
        <span class="gs-math-label">${label}</span>
        <span class="gs-math-formula">${formula}</span>
        <span class="gs-math-substituted">${substituted}</span>
        <span class="gs-math-result">${result}</span>
      </div>
    `;
  }

  function renderMathCol(title, p, r, isNew, stateScale, stores) {
    // Use integers on weekly unit counts for readability.
    const soldUnits = p.sold.toLocaleString();
    const scaleNote = stateScale === 'per-store'
      ? `× ${stores.toLocaleString()} stores`
      : `(chain-wide)`;

    let html = '';
    html += stepHTML(
      '1 · Shrink %',
      `(shipped − sold) ÷ shipped`,
      `(${p.shipped} − ${p.sold}) ÷ ${p.shipped}`,
      pct(r.shrink, 2)
    );
    html += stepHTML(
      '2 · Net cost',
      `unit cost − promo allowance`,
      `${money(p.cost)} − ${money(p.promo)}`,
      money(r.netCost) + ' / unit'
    );
    html += stepHTML(
      '3 · Effective cost',
      `net cost ÷ (1 − shrink)`,
      `${money(r.netCost)} ÷ (1 − ${pct(r.shrink, 2)})`,
      money(r.effectiveCost) + ' / unit sold'
    );
    html += stepHTML(
      '4 · Effective retail',
      `retail × (1 − markdown)`,
      `${money(p.retail)} × (1 − ${pct(p.markdown, 1)})`,
      money(r.effectiveRetail) + ' / unit sold'
    );
    html += stepHTML(
      '5 · Penny profit',
      `effective retail − effective cost`,
      `${money(r.effectiveRetail)} − ${money(r.effectiveCost)}`,
      money(r.penny) + ' / unit'
    );
    html += stepHTML(
      '6 · Weekly gross',
      `penny × weekly sold ${scaleNote}`,
      `${money(r.penny)} × ${r.soldChainWeekly.toLocaleString()} units`,
      money(r.weeklyGross)
    );

    if (isNew && p.cannibal > 0) {
      html += stepHTML(
        '7 · Annual gross',
        `weekly × 52 × (1 − cannibal)`,
        `${money(r.weeklyGross)} × 52 × (1 − ${pct(p.cannibal, 0)})`,
        moneyBig(r.annualGross) + '/yr'
      );
    } else {
      html += stepHTML(
        '7 · Annual gross',
        `weekly × 52`,
        `${money(r.weeklyGross)} × 52`,
        moneyBig(r.annualGross) + '/yr'
      );
    }

    return html;
  }

  function renderMath(r) {
    out.mathOldTitle.textContent = r.state.old.name;
    out.mathNewTitle.textContent = r.state.new.name;

    // Clear prior steps (preserve the title <p>)
    out.mathOld.innerHTML = `<p class="gs-math-col-title">${r.state.old.name}</p>` +
      renderMathCol(r.state.old.name, r.state.old, r.old, false, r.state.scale, r.state.stores);
    out.mathNew.innerHTML = `<p class="gs-math-col-title">${r.state.new.name}</p>` +
      renderMathCol(r.state.new.name, r.state.new, r.new, true, r.state.scale, r.state.stores);

    // Summary — year-1 delta walk.
    const paybackLabel = Number.isFinite(r.paybackMonths)
      ? `${r.paybackMonths.toFixed(1)} months`
      : 'never (new loses ongoing)';

    out.mathSummary.innerHTML = `
      <p class="gs-math-summary-title">Year-one delta walk-through</p>
      <span class="gs-math-summary-line">New annual gross: <span class="result">${moneyBig(r.new.annualGross)}</span></span><br />
      <span class="gs-math-summary-line">Old annual gross: <span class="result">${moneyBig(r.old.annualGross)}</span></span><br />
      <span class="gs-math-summary-line">Ongoing annual delta: <span class="result">${signedMoneyBig(r.ongoingDelta)}</span></span><br />
      <span class="gs-math-summary-line">Switching cost (slotting + transition): <span class="result">${money(r.switchingCost)}</span></span><br />
      <span class="gs-math-summary-line">Year-one delta: <span class="result">${signedMoneyBig(r.year1Delta)}</span></span><br />
      <span class="gs-math-summary-line">Payback on switching cost: <span class="result">${paybackLabel}</span></span>
    `;
  }


  // ================================================================
  // 8. RENDER — CHART
  // Line chart: annual gross profit vs shrink % (0 to 20%).
  // One line per product. Vertical dashed markers at current shrink.
  // ================================================================
  let chart = null;

  function annualAtShrink(p, stores, scale, shrink, cannibal = 0) {
    const netCost         = p.cost - p.promo;
    const effectiveCost   = netCost / (1 - shrink);
    const effectiveRetail = p.retail * (1 - p.markdown);
    const penny           = effectiveRetail - effectiveCost;
    const soldChainWeekly = scale === 'per-store' ? p.sold * stores : p.sold;
    return penny * soldChainWeekly * 52 * (1 - cannibal);
  }

  // Plugin: draw vertical dashed markers at each product's current shrink.
  const shrinkMarkersPlugin = {
    id: 'shrinkMarkers',
    afterDatasetsDraw(chart, args, opts) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !opts || !opts.markers) return;
      ctx.save();
      opts.markers.forEach(m => {
        const x = scales.x.getPixelForValue(m.value);
        if (x < chartArea.left || x > chartArea.right) return;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = m.color;
        ctx.textAlign = 'left';
        ctx.fillText(m.label, Math.min(x + 6, chartArea.right - 90), chartArea.top + 14);
      });
      ctx.restore();
    }
  };

  function renderChart(r) {
    if (!window.Chart || !out.chartCanvas) return;

    // Build x-axis samples 0..20% in 0.5% steps.
    const xs = [];
    for (let i = 0; i <= 40; i++) xs.push(i / 200); // 0, 0.005, ..., 0.2

    const oldLine = xs.map(x => annualAtShrink(r.state.old, r.state.stores, r.state.scale, x, 0));
    const newLine = xs.map(x => annualAtShrink(r.state.new, r.state.stores, r.state.scale, x, r.state.new.cannibal));

    const data = {
      labels: xs.map(x => pct(x, 1)),
      datasets: [
        {
          label: r.state.old.name,
          data: oldLine,
          borderColor: 'rgba(161, 161, 170, 0.9)',
          backgroundColor: 'rgba(161, 161, 170, 0.08)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.15,
        },
        {
          label: r.state.new.name,
          data: newLine,
          borderColor: '#ffb547',
          backgroundColor: 'rgba(212, 168, 75, 0.12)',
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.15,
        },
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: 0.2,
          title: { display: true, text: 'Shrink rate', color: 'rgba(161,161,170,0.8)' },
          ticks: {
            color: 'rgba(161,161,170,0.8)',
            callback: (v) => pct(v, 0),
            stepSize: 0.025,
          },
          grid: { color: 'rgba(113, 113, 122, 0.18)' },
        },
        y: {
          title: { display: true, text: 'Annual gross profit', color: 'rgba(161,161,170,0.8)' },
          ticks: {
            color: 'rgba(161,161,170,0.8)',
            callback: (v) => moneyBig(v),
          },
          grid: { color: 'rgba(113, 113, 122, 0.18)' },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: 'rgba(224, 224, 232, 0.85)' },
        },
        tooltip: {
          callbacks: {
            title: (items) => 'Shrink ' + pct(parseFloat(items[0].parsed.x), 2),
            label: (ctx) => `${ctx.dataset.label}: ${moneyBig(ctx.parsed.y)}/yr`,
          },
          backgroundColor: 'rgba(20,20,24,0.95)',
          borderColor: 'rgba(212,168,75,0.4)',
          borderWidth: 1,
          titleColor: '#ffb547',
          bodyColor: '#e0e0e8',
        },
        shrinkMarkers: {
          markers: [
            { value: r.old.shrink, color: 'rgba(161, 161, 170, 0.9)', label: `old ${pct(r.old.shrink, 1)}` },
            { value: r.new.shrink, color: '#ffb547',                  label: `new ${pct(r.new.shrink, 1)}` },
          ]
        }
      },
    };

    // Because we're using type: 'linear' on the x-axis, feed x/y pairs.
    data.datasets.forEach((ds, i) => {
      ds.data = xs.map((x, idx) => ({ x, y: (i === 0 ? oldLine : newLine)[idx] }));
    });

    if (chart) {
      chart.data = data;
      chart.options = options;
      chart.update();
    } else {
      chart = new Chart(out.chartCanvas.getContext('2d'), {
        type: 'line',
        data,
        options,
        plugins: [shrinkMarkersPlugin],
      });
    }
  }


  // ================================================================
  // 9. EXPORT — CSV
  // Single flat CSV so it opens cleanly in Excel / Sheets. Rows follow
  // a label,old,new,delta pattern; switching + verdict appended below.
  // ================================================================
  function csvEscape(v) {
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildCSV(r) {
    const rows = [];
    rows.push(['Grocery Swap Calculator — export', new Date().toISOString()]);
    rows.push([]);
    rows.push(['Scenario', r.state.old.name + ' → ' + r.state.new.name]);
    rows.push(['Stores', r.state.stores]);
    rows.push(['Volume unit', r.state.scale]);
    rows.push([]);
    rows.push(['Metric', 'Old', 'New', 'Delta']);
    rows.push(['Shrink %',            pct(r.old.shrink, 2), pct(r.new.shrink, 2), pct(r.new.shrink - r.old.shrink, 2)]);
    rows.push(['Net cost / unit',     money(r.old.netCost), money(r.new.netCost), money(r.new.netCost - r.old.netCost)]);
    rows.push(['Effective cost',      money(r.old.effectiveCost), money(r.new.effectiveCost), money(r.new.effectiveCost - r.old.effectiveCost)]);
    rows.push(['Effective retail',    money(r.old.effectiveRetail), money(r.new.effectiveRetail), money(r.new.effectiveRetail - r.old.effectiveRetail)]);
    rows.push(['Penny profit / unit', money(r.old.penny), money(r.new.penny), money(r.new.penny - r.old.penny)]);
    rows.push(['Weekly gross',        money(r.old.weeklyGross), money(r.new.weeklyGross), money(r.new.weeklyGross - r.old.weeklyGross)]);
    rows.push(['Annual gross',        money(r.old.annualGross), money(r.new.annualGross), money(r.ongoingDelta)]);
    rows.push([]);
    rows.push(['Switching cost (one-time)', '', money(r.switchingCost)]);
    rows.push(['Slotting fee',              '', money(r.state.new.slotting)]);
    rows.push(['Transition cost',           '', money(r.state.new.transition)]);
    rows.push(['Cannibalization applied',   '', pct(r.state.new.cannibal, 0)]);
    rows.push([]);
    rows.push(['Year-1 delta', money(r.year1Delta)]);
    rows.push(['Ongoing annual delta', money(r.ongoingDelta)]);
    rows.push(['Payback on switching cost', Number.isFinite(r.paybackMonths) ? r.paybackMonths.toFixed(1) + ' months' : 'never']);
    rows.push(['Break-even shrink (new)', r.breakeven === null ? 'n/a' : pct(r.breakeven, 2)]);
    rows.push([]);
    rows.push(['Verdict', r.headline]);
    rows.push(['Rationale', r.rationale]);

    return rows.map(row => row.map(csvEscape).join(',')).join('\n');
  }

  function exportCSV() {
    const r = computeAll();
    const csv = buildCSV(r);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeOld = (r.state.old.name || 'old').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const safeNew = (r.state.new.name || 'new').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.href = url;
    a.download = `grocery-swap_${safeOld}_vs_${safeNew}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  // ================================================================
  // 10. EXPORT — PRINT
  // Stamps today's date onto the report container so the print header
  // can pick it up via CSS attr(), then triggers the browser print.
  // ================================================================
  function printReport() {
    const report = document.querySelector('.gs-report');
    if (report) {
      const d = new Date();
      const stamp = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      report.setAttribute('data-printed', stamp);
    }
    window.print();
  }


  // ================================================================
  // 11. BOOT
  // Single render() gathers state, computes, pushes to every view.
  // Every input wires to render on input/change. Buttons wire once.
  // ================================================================
  function render() {
    const r = computeAll();
    renderKPIs(r);
    renderVerdict(r);
    renderMath(r);
    renderChart(r);
  }

  // Wire inputs — "input" fires on every keystroke / arrow click.
  Object.values(refs).forEach(el => {
    if (!el) return;
    const ev = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, render);
  });

  // Wire action buttons.
  out.exportCsv.addEventListener('click', exportCSV);
  out.printReport.addEventListener('click', printReport);

  // First paint.
  render();
});
