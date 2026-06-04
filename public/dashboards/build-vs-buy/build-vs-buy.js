/* ====================================================================
   BUILD vs. BUY — build-vs-buy.js
   Vanilla JS + Chart.js. All logic runs after DOMContentLoaded.

   THE MODEL (simple on purpose)
   -----------------------------
   Buy annual        = (seats × $/seat × 12) + annualLicense
   Build Year 1      = teamSize × salary
   Build Year 2+     = teamSize × salary × (maintenance/100)
   Cumulative Buy[y] = buyAnnual × y
   Cumulative Build[y] = Y1cost + (y - 1) × maintenanceAnnual
   Break-even = first year where cumBuild < cumBuy

   TABLE OF CONTENTS
   -----------------
   1. BOOT + ELEMENT LOOKUPS
   2. STATE READER            (reads all slider values into an object)
   3. COST MODEL              (pure fn: state → {buy, build, breakEven})
   4. FORMATTERS              (money, compact money for chart axis)
   5. CHART SETUP             (one-time Chart.js init)
   6. RENDER                  (updates readouts, chart, headline, totals)
   7. BIND                    ("input" event on every slider → render)
   ==================================================================== */


document.addEventListener('DOMContentLoaded', () => {

  // Honor OS-level reduced-motion — disables chart animation below.
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;


  // ================================================================
  // 1. BOOT + ELEMENT LOOKUPS
  // Cache every slider and readout span up front so we aren't calling
  // getElementById on every render.
  // ================================================================
  const controls = {
    horizon:       document.getElementById('horizon'),
    seats:         document.getElementById('seats'),
    pricePerSeat:  document.getElementById('pricePerSeat'),
    annualLicense: document.getElementById('annualLicense'),
    teamSize:      document.getElementById('teamSize'),
    salary:        document.getElementById('salary'),
    maintenance:   document.getElementById('maintenance'),
  };

  const readouts = {
    horizon:       document.getElementById('horizonValue'),
    seats:         document.getElementById('seatsValue'),
    pricePerSeat:  document.getElementById('pricePerSeatValue'),
    annualLicense: document.getElementById('annualLicenseValue'),
    teamSize:      document.getElementById('teamSizeValue'),
    salary:        document.getElementById('salaryValue'),
    maintenance:   document.getElementById('maintenanceValue'),
  };

  const headlineEl   = document.getElementById('headlineValue');
  const buyTotalEl   = document.getElementById('buyTotal');
  const buildTotalEl = document.getElementById('buildTotal');
  const deltaEl      = document.getElementById('deltaTotal');
  const canvas       = document.getElementById('costChart');


  // ================================================================
  // 2. STATE READER
  // Pulls each slider's string value and coerces to a number.
  // Kept as a single function so the rest of the code can work with
  // a clean object instead of poking DOM elements.
  // ================================================================
  const readState = () => ({
    horizon:       +controls.horizon.value,
    seats:         +controls.seats.value,
    pricePerSeat:  +controls.pricePerSeat.value,
    annualLicense: +controls.annualLicense.value,
    teamSize:      +controls.teamSize.value,
    salary:        +controls.salary.value,
    maintenance:   +controls.maintenance.value,   // percent, 10–100
  });


  // ================================================================
  // 3. COST MODEL
  // Pure function — takes state, returns two cumulative arrays and
  // the break-even year (or null if they never cross inside horizon).
  // Arrays include Y0 = $0 so Chart.js gets a clean "start at origin".
  // ================================================================
  const computeCosts = (s) => {
    const buyAnnual        = (s.seats * s.pricePerSeat * 12) + s.annualLicense;
    const buildYear1       = s.teamSize * s.salary;
    const buildMaintAnnual = buildYear1 * (s.maintenance / 100);

    const buy   = [0];   // Y0 baseline — both start at zero spent
    const build = [0];
    let breakEven = null;

    for (let y = 1; y <= s.horizon; y++) {
      const prevBuy   = buy[y - 1];
      const prevBuild = build[y - 1];

      // Buy is flat — same cost every year.
      buy.push(prevBuy + buyAnnual);

      // Build is front-loaded: full team in Y1, maintenance factor from Y2+.
      const thisYearBuild = (y === 1) ? buildYear1 : buildMaintAnnual;
      build.push(prevBuild + thisYearBuild);

      // Break-even = first year cumulative Build is at or below Buy.
      // Using <= so a clean tie counts as the crossover year, not a miss.
      if (breakEven === null && build[y] <= buy[y]) {
        breakEven = y;
      }
    }

    return {
      buy,
      build,
      breakEven,
      buyAnnual,
      buildYear1,
      buildMaintAnnual,
    };
  };


  // ================================================================
  // 4. FORMATTERS
  // - moneyFull: exact dollar amount with commas, used in tooltips
  //   and the totals tiles ("$1,234,000").
  // - moneyCompact: shortened form for the Y-axis ticks ("$1.2M")
  //   so the chart doesn't drown in zeroes.
  // ================================================================
  const moneyFull = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const moneyCompact = (n) => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
    if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'k';
    return '$' + Math.round(n);
  };


  // ================================================================
  // 5. CHART SETUP
  // One-time Chart.js init. We keep a reference so render() can just
  // mutate data and call .update() rather than rebuild every time.
  // ================================================================
  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Buy (cumulative)',
          data: [],
          borderColor: '#ffb547',                     // same gold as the .is-buy tile
          backgroundColor: 'rgba(255, 181, 71, 0.08)',
          borderWidth: 3,
          pointBackgroundColor: '#ffb547',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.15,                              // gentle curve, not straight lines
          fill: true,
        },
        {
          label: 'Build (cumulative)',
          data: [],
          borderColor: '#4ade80',                     // same green as .is-build tile
          backgroundColor: 'rgba(74, 222, 128, 0.06)',
          borderWidth: 3,
          pointBackgroundColor: '#4ade80',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.15,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,    // let the CSS aspect-ratio box size us
      animation: prefersReducedMotion ? false : { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#a1a1aa',
            boxWidth: 14,
            boxHeight: 14,
            usePointStyle: true,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 20, 0.96)',
          borderColor: '#3a2f18',
          borderWidth: 1,
          titleColor: '#d4a84b',
          bodyColor: '#f4f4f5',
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${moneyFull.format(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Year', color: '#71717a' },
          ticks: { color: '#a1a1aa' },
          grid:  { color: 'rgba(255, 255, 255, 0.04)' },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#a1a1aa',
            callback: (v) => moneyCompact(v),
          },
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
        },
      },
    },
  });


  // ================================================================
  // 6. RENDER
  // Called on every slider change. Reads state, updates readout
  // labels, computes the cost model, pushes new data to the chart,
  // sets the headline verdict, and updates the three totals tiles.
  // ================================================================
  const render = () => {
    const s = readState();

    // --- Readout labels (the little gold numbers next to each slider) ---
    readouts.horizon.textContent      = s.horizon + (s.horizon === 1 ? ' year' : ' years');
    readouts.seats.textContent        = s.seats.toLocaleString();
    readouts.pricePerSeat.textContent = moneyFull.format(s.pricePerSeat);
    readouts.annualLicense.textContent = s.annualLicense === 0
      ? 'None'
      : moneyFull.format(s.annualLicense);
    readouts.teamSize.textContent     = s.teamSize + (s.teamSize === 1 ? ' engineer' : ' engineers');
    readouts.salary.textContent       = moneyFull.format(s.salary);
    readouts.maintenance.textContent  = s.maintenance + '%';

    // --- Cost model ---
    const { buy, build, breakEven } = computeCosts(s);

    // --- Chart ---
    // Labels run Y0…Yn. Y0 is the shared origin so both lines start at $0.
    chart.data.labels = Array.from({ length: s.horizon + 1 }, (_, i) => 'Y' + i);
    chart.data.datasets[0].data = buy;
    chart.data.datasets[1].data = build;
    chart.update();

    // --- Headline verdict ---
    // Three possible outcomes, spelled out so the tool never lies.
    const totalBuy   = buy[s.horizon];
    const totalBuild = build[s.horizon];

    if (breakEven !== null) {
      headlineEl.textContent = 'Break-even: Year ' + breakEven;
    } else if (totalBuild < totalBuy) {
      // No crossover, but build is cheaper from day 1 (rare — only if
      // buildYear1 was already below buyAnnual at the chosen inputs).
      headlineEl.textContent = 'Build wins from day 1.';
    } else {
      // Build stayed above Buy the whole horizon.
      headlineEl.textContent = 'Buy wins through Year ' + s.horizon + '.';
    }

    // --- Totals tiles ---
    buyTotalEl.textContent   = moneyFull.format(totalBuy);
    buildTotalEl.textContent = moneyFull.format(totalBuild);

    const delta = Math.abs(totalBuy - totalBuild);
    if (totalBuild < totalBuy) {
      deltaEl.textContent = moneyFull.format(delta) + ' by building';
    } else if (totalBuy < totalBuild) {
      deltaEl.textContent = moneyFull.format(delta) + ' by buying';
    } else {
      deltaEl.textContent = '$0 — a wash';
    }
  };


  // ================================================================
  // 7. BIND
  // Every slider fires "input" continuously as the user drags — that
  // gives the chart a live, tactile feel. A single bound render()
  // handles them all.
  // ================================================================
  Object.values(controls).forEach((el) => {
    el.addEventListener('input', render);
  });

  // First render with defaults so the chart isn't blank on load.
  render();
});
