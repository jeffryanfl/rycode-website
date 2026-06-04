/* ==================================================================
   VENDOR CONCENTRATION DASHBOARD — DATA + LOGIC
   TABLE OF CONTENTS
   -----------------
   1. CELL TAXONOMY           (30 cells in 10 function areas)
   2. VENDOR LIBRARY          (37 vendors with coverage arrays)
   3. STATE                   (which vendors are active / offline,
                               plus per-service exclusions)
   4. RENDER — grid
   5. RENDER — chips
   6. RENDER — metrics
   7. EVENT WIRING
   ================================================================== */

/* 1. CELL TAXONOMY ————————————————————————————————————————————— */
const CELLS = [
  // id, row, label, criticality (H/M/L)
  ['compute',       'Infrastructure',       'Cloud compute',          'H'],
  ['storage',       'Infrastructure',       'Cloud storage',          'H'],
  ['networking',    'Infrastructure',       'Networking / CDN',       'H'],

  ['sso',           'Identity & Access',    'SSO / IAM',              'H'],
  ['directory',     'Identity & Access',    'Directory',              'H'],
  ['endpoint',      'Identity & Access',    'Endpoint mgmt',          'M'],

  ['warehouse',     'Data & Analytics',     'Data warehouse',         'M'],
  ['bi',            'Data & Analytics',     'BI / reporting',         'M'],
  ['etl',           'Data & Analytics',     'ETL / pipelines',        'M'],

  ['scm',           'Developer Platform',   'Source control',         'H'],
  ['cicd',          'Developer Platform',   'CI / CD',                'H'],
  ['obs',           'Developer Platform',   'Observability',          'H'],

  ['email',         'Collaboration',        'Email',                  'H'],
  ['docs',          'Collaboration',        'Docs',                   'M'],
  ['chat',          'Collaboration',        'Chat',                   'M'],
  ['videoconf',     'Collaboration',        'Video conferencing',     'M'],

  ['crm',           'Customer Systems',     'CRM',                    'H'],
  ['helpdesk',      'Customer Systems',     'Support / helpdesk',     'M'],
  ['marketing',     'Customer Systems',     'Marketing automation',   'L'],

  ['erp',           'Finance & Ops',        'ERP / accounting',       'H'],
  ['payments',      'Finance & Ops',        'Payments processing',    'H'],
  ['procurement',   'Finance & Ops',        'Procurement',            'L'],

  ['hcm',           'People (HR)',          'HCM / payroll',          'H'],
  ['benefits',      'People (HR)',          'Benefits admin',         'L'],
  ['ats',           'People (HR)',          'Recruiting / ATS',       'L'],

  ['edr',           'Security',             'EDR / endpoint sec',     'H'],
  ['siem',          'Security',             'SIEM / log mgmt',        'M'],
  ['emailsec',      'Security',             'Email security',         'M'],

  ['esign',         'Legal & Compliance',   'E-signature',            'M'],
  ['grc',           'Legal & Compliance',   'GRC platform',           'L'],
].map(([id, row, label, crit]) => ({ id, row, label, crit }));

const ROW_ORDER = [
  'Infrastructure', 'Identity & Access', 'Data & Analytics',
  'Developer Platform', 'Collaboration', 'Customer Systems',
  'Finance & Ops', 'People (HR)', 'Security', 'Legal & Compliance',
];

/* 2. VENDOR LIBRARY ———————————————————————————————————————————— */
const VENDORS = [
  // Heavyweights — concentration risk candidates (multi-cell coverage)
  { id: 'm365',       name: 'Microsoft 365',     covers: ['email','docs','chat','videoconf','sso','directory','endpoint','emailsec'] },
  { id: 'aws',        name: 'AWS',               covers: ['compute','storage','networking','warehouse','cicd','obs'] },
  { id: 'gworkspace', name: 'Google Workspace',  covers: ['email','docs','chat','videoconf','sso','directory'] },
  { id: 'azure',      name: 'Azure',             covers: ['compute','storage','networking','sso','directory'] },
  { id: 'workday',    name: 'Workday',           covers: ['hcm','benefits','ats','procurement','erp'] },
  { id: 'oracle',     name: 'Oracle',            covers: ['erp','warehouse','hcm','compute'] },
  { id: 'sap',        name: 'SAP',               covers: ['erp','hcm','procurement','warehouse'] },
  { id: 'gcloud',     name: 'Google Cloud',      covers: ['compute','storage','networking','warehouse'] },
  { id: 'cisco',      name: 'Cisco',             covers: ['networking','endpoint','videoconf','emailsec'] },
  { id: 'paloalto',   name: 'Palo Alto Networks',covers: ['networking','edr','siem','emailsec'] },
  { id: 'rippling',   name: 'Rippling',          covers: ['hcm','benefits','endpoint','directory'] },

  // Mid-breadth (2–3 cells)
  { id: 'salesforce', name: 'Salesforce',        covers: ['crm','helpdesk','marketing'] },
  { id: 'servicenow', name: 'ServiceNow',        covers: ['helpdesk','grc','endpoint'] },
  { id: 'github',     name: 'GitHub',            covers: ['scm','cicd','obs'] },
  { id: 'databricks', name: 'Databricks',        covers: ['warehouse','etl','bi'] },
  { id: 'cloudflare', name: 'Cloudflare',        covers: ['networking','sso','emailsec'] },
  { id: 'adobe',      name: 'Adobe',             covers: ['docs','esign','marketing'] },
  { id: 'atlassian',  name: 'Atlassian',         covers: ['docs','scm','helpdesk'] },
  { id: 'hubspot',    name: 'HubSpot',           covers: ['crm','marketing','helpdesk'] },
  { id: 'adp',        name: 'ADP',               covers: ['hcm','benefits','ats'] },
  { id: 'datadog',    name: 'Datadog',           covers: ['obs','siem'] },
  { id: 'okta',       name: 'Okta',              covers: ['sso','directory'] },
  { id: 'crowdstrike',name: 'CrowdStrike',       covers: ['edr','siem'] },
  { id: 'snowflake',  name: 'Snowflake',         covers: ['warehouse','bi'] },
  { id: 'splunk',     name: 'Splunk',            covers: ['siem','obs'] },
  { id: 'zscaler',    name: 'Zscaler',           covers: ['networking','emailsec'] },

  // Focused — single-function vendors (the "non-concentration" baseline)
  { id: 'slack',      name: 'Slack',             covers: ['chat'] },
  { id: 'zoom',       name: 'Zoom',              covers: ['videoconf'] },
  { id: 'stripe',     name: 'Stripe',            covers: ['payments'] },
  { id: 'docusign',   name: 'DocuSign',          covers: ['esign'] },
  { id: 'tableau',    name: 'Tableau',           covers: ['bi'] },
  { id: 'sentinelone',name: 'SentinelOne',       covers: ['edr'] },
  { id: 'zendesk',    name: 'Zendesk',           covers: ['helpdesk'] },
  { id: 'proofpoint', name: 'Proofpoint',        covers: ['emailsec'] },
  { id: 'archer',     name: 'Archer',            covers: ['grc'] },
  { id: 'fivetran',   name: 'Fivetran',          covers: ['etl'] },
  { id: 'greenhouse', name: 'Greenhouse',        covers: ['ats'] },
];

/* 3. STATE ——————————————————————————————————————————————————— */
// A vendor can be in one of 3 states: 'off' (not in stack), 'active', 'offline'
// excluded[vendorId] = Set of cellIds that the user has manually excluded
// from this vendor's coverage (e.g. "we have Zscaler Networking, not Zscaler
// Email Security"). Cleared when the vendor is removed from the stack.
const state = {};
const excluded = {};
VENDORS.forEach(v => {
  state[v.id] = 'off';
  excluded[v.id] = new Set();
});

// Services this vendor actually contributes, after user exclusions.
function effectiveCovers(v) {
  return v.covers.filter(id => !excluded[v.id].has(id));
}

/* 4. RENDER — GRID ———————————————————————————————————————————— */
function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  // Compute coverage per cell given current state.
  // A cell is "lit" by vendors that are 'active' (not offline).
  // A cell is "dark" only if covered by >=1 offline vendor AND no active vendor covers it.
  const activeVendors = VENDORS.filter(v => state[v.id] === 'active');
  const offlineVendors = VENDORS.filter(v => state[v.id] === 'offline');

  // Per cell, who covers it (active vs offline).
  const activeByCell = {};
  const offlineByCell = {};
  CELLS.forEach(c => { activeByCell[c.id] = []; offlineByCell[c.id] = []; });
  activeVendors.forEach(v => effectiveCovers(v).forEach(id => activeByCell[id].push(v)));
  offlineVendors.forEach(v => effectiveCovers(v).forEach(id => offlineByCell[id].push(v)));

  ROW_ORDER.forEach(rowName => {
    const rowCells = CELLS.filter(c => c.row === rowName);
    const row = document.createElement('div');
    row.className = 'vcx-row';

    const label = document.createElement('div');
    label.className = 'vcx-row-label';
    label.innerHTML = `${rowName}<span class="vcx-row-label-sub">${rowCells.length} cells</span>`;
    row.appendChild(label);

    const cells = document.createElement('div');
    cells.className = 'vcx-cells';
    rowCells.forEach(c => {
      const active = activeByCell[c.id] || [];
      const offline = offlineByCell[c.id] || [];
      const lit = active.length;
      const isDark = (lit === 0) && offline.length > 0;

      const cell = document.createElement('div');
      cell.className = 'vcx-cell';
      if (isDark) {
        cell.classList.add('is-dark');
      } else if (lit === 1) {
        cell.classList.add('is-covered-1');
      } else if (lit === 2) {
        cell.classList.add('is-covered-2');
      } else if (lit >= 3) {
        cell.classList.add('is-covered-3plus');
      }

      // Vendor chips inside the cell — show who covers (active) or who went down (dark).
      // Each chip is a button: click it to exclude that vendor's coverage of THIS cell.
      const vendorsToShow = isDark ? offline : active;
      const vendorChips = vendorsToShow
        .map(v => `<button type="button" class="vcx-cell-vendor" data-vendor="${v.id}" data-cell="${c.id}" aria-label="Exclude ${v.name} from ${c.label}" title="Click to exclude ${v.name} from ${c.label}">${v.name}</button>`)
        .join('');

      cell.innerHTML = `
        <span class="vcx-cell-crit" data-crit="${c.crit}">${c.crit}</span>
        <span class="vcx-cell-label">${c.label}</span>
        ${vendorChips ? `<div class="vcx-cell-vendors" aria-label="${vendorsToShow.length} vendor${vendorsToShow.length>1?'s':''}">${vendorChips}</div>` : ''}
      `;
      cells.appendChild(cell);
    });

    row.appendChild(cells);
    grid.appendChild(row);
  });
}

/* 5. RENDER — CHIPS ——————————————————————————————————————————— */
function renderChips() {
  const lib = document.getElementById('library');
  lib.innerHTML = '';
  VENDORS.forEach(v => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'vcx-chip';
    if (state[v.id] === 'active') chip.classList.add('is-active');
    if (state[v.id] === 'offline') chip.classList.add('is-offline');
    chip.setAttribute('data-vendor', v.id);
    chip.setAttribute('aria-pressed', state[v.id] === 'active' ? 'true' : 'false');
    const eff = effectiveCovers(v).length;
    const countLabel = eff < v.covers.length ? `${eff}/${v.covers.length}` : `${v.covers.length}`;
    chip.innerHTML = `
      <span>${v.name}</span>
      <span class="vcx-chip-count">${countLabel}</span>
    `;
    lib.appendChild(chip);
  });
}

/* 6. RENDER — METRICS ———————————————————————————————————————— */
function renderMetrics() {
  const activeVendors = VENDORS.filter(v => state[v.id] === 'active');
  const offlineVendors = VENDORS.filter(v => state[v.id] === 'offline');

  const covered = new Set();
  activeVendors.forEach(v => effectiveCovers(v).forEach(id => covered.add(id)));

  // Cells that are dark = covered by an offline vendor AND no active vendor covers them
  const dark = new Set();
  offlineVendors.forEach(v => {
    effectiveCovers(v).forEach(id => {
      if (!covered.has(id)) dark.add(id);
    });
  });

  // Criticality-weighted dark count
  let darkH = 0, darkM = 0, darkL = 0;
  dark.forEach(id => {
    const cell = CELLS.find(c => c.id === id);
    if (cell.crit === 'H') darkH++;
    else if (cell.crit === 'M') darkM++;
    else darkL++;
  });

  const total = CELLS.length;

  document.getElementById('mVendors').textContent = activeVendors.length + offlineVendors.length;
  document.getElementById('mVendorsSub').textContent = 'of ' + VENDORS.length + ' available';
  document.getElementById('mCovered').textContent = covered.size;
  document.getElementById('mGaps').textContent = total - covered.size - dark.size;

  const blastEl = document.getElementById('mBlast');
  const blastSub = document.getElementById('mBlastSub');
  if (offlineVendors.length === 0) {
    blastEl.textContent = '—';
    blastEl.classList.remove('is-danger');
    blastSub.textContent = 'no vendors offline';
  } else {
    blastEl.textContent = `${dark.size} cells dark`;
    blastEl.classList.add('is-danger');
    const names = offlineVendors.map(v => v.name).join(', ');
    blastSub.textContent = `${darkH}H · ${darkM}M · ${darkL}L · offline: ${names}`;
  }
}

/* 7. EVENT WIRING ——————————————————————————————————————————— */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('library').addEventListener('click', (e) => {
    const chip = e.target.closest('.vcx-chip');
    if (!chip) return;
    const id = chip.getAttribute('data-vendor');
    // Cycle: off → active → offline → off
    const current = state[id];
    state[id] = current === 'off' ? 'active' : current === 'active' ? 'offline' : 'off';
    // When a vendor leaves the stack entirely, drop any service exclusions.
    if (state[id] === 'off') excluded[id].clear();
    renderChips();
    renderGrid();
    renderMetrics();
  });

  // Click an inline vendor chip inside a cell to exclude that vendor's coverage
  // of that one service (e.g. "we have Zscaler Networking but not Zscaler Email Security").
  document.getElementById('grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.vcx-cell-vendor');
    if (!btn) return;
    const vendorId = btn.getAttribute('data-vendor');
    const cellId = btn.getAttribute('data-cell');
    excluded[vendorId].add(cellId);
    renderChips();
    renderGrid();
    renderMetrics();
  });

  renderChips();
  renderGrid();
  renderMetrics();
});
