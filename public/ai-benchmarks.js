/* LIVING AI BENCH TABLE
   Fetch /ai-benchmarks.json and fill the /ai comparison table.
   Blank cells stay blank. No invented scores.

   TABLE OF CONTENTS
   1. Render columns and lab rows
   2. Fetch on DOMContentLoaded
*/

(function () {
  var BLANK = '\u2013';

  function shortModel(lab) {
    const model = lab.model || lab.lab || '';
    if (model.indexOf('Opus 5.5') !== -1) return 'Opus 5.5';
    if (model.indexOf('Fable') !== -1) return 'Fable 5.1';
    if (model.indexOf('Astra') !== -1) return 'Astra';
    if (model.indexOf('Grok') !== -1) return 'Grok 4.7';
    if (model.indexOf('Muse') !== -1) return 'Muse Spark';
    if (model.indexOf('Flash') !== -1) return 'DeepSeek Flash';
    if (model === 'Jev' || lab.productClass === 'system-one') return 'Jev';
    return model;
  }

  function labLine(lab) {
    if (lab.productClass === 'system-one') return (lab.lab || 'TypeSafe') + ' · System One (not chat flagship)';
    return lab.lab || '';
  }

  function headerLines(col) {
    const label = col.label || col.id;
    if (col.id === 'aaIndex') return ['AA Index', 'v4.3.2'];
    if (label === 'Terminal-Bench') return ['Terminal-', 'Bench'];
    if (label === 'AutomationBench') return ['Automation', 'Bench'];
    if (label === "Humanity's Last Exam") return ["Humanity's", 'Last Exam'];
    return [label];
  }

  function orderedColumns(columns) {
    const aa = columns.filter(function (col) { return col.id === 'aaIndex'; });
    const rest = columns.filter(function (col) { return col.id !== 'aaIndex'; });
    return aa.concat(rest);
  }

  function fillNumber(parent, cell) {
    const value = String(cell.value).trim();
    const dual = value.match(/^([\d.]+%)\s+partial\s*\/\s*([\d.]+%)\s+strict$/i);
    const num = document.createElement('span');
    num.className = 'ai-bench-num';
    num.textContent = dual ? dual[1] + ' / ' + dual[2] : value;
    parent.append(num);
    if (cell.effort) {
      const note = document.createElement('span');
      note.className = 'ai-bench-note';
      note.textContent = cell.effort;
      parent.append(note);
    } else if (dual) {
      const note = document.createElement('span');
      note.className = 'ai-bench-note';
      note.textContent = 'partial / strict';
      parent.append(note);
    }
    if (cell.version) {
      const ver = document.createElement('span');
      ver.className = 'ai-bench-note';
      ver.textContent = String(cell.version);
      parent.append(ver);
    }
  }

  function render(root, data) {
    const table = root.querySelector('table');
    const asof = root.querySelector('[data-ai-bench-asof]');
    if (!table || !Array.isArray(data.columns) || !Array.isArray(data.labs)) return false;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.replaceChildren();
    tbody.replaceChildren();

    const head = document.createElement('tr');
    const modelTh = document.createElement('th');
    modelTh.scope = 'col';
    modelTh.textContent = 'Model / lab';
    head.append(modelTh);
    const columns = orderedColumns(data.columns);
    columns.forEach(function (col) {
      const th = document.createElement('th');
      th.scope = 'col';
      if (col.id === 'aaIndex') th.className = 'ai-bench-aa';
      headerLines(col).forEach(function (line, index) {
        if (index) th.append(document.createElement('br'));
        th.append(document.createTextNode(line));
      });
      head.append(th);
    });
    thead.append(head);

    data.labs.forEach(function (lab, index) {
      const tr = document.createElement('tr');
      if (index % 2 === 1) tr.className = 'ai-bench-stripe';
      const name = document.createElement('th');
      name.scope = 'row';
      const title = document.createElement(lab.doorHref ? 'a' : 'span');
      title.className = 'ai-bench-model';
      title.textContent = shortModel(lab);
      if (lab.doorHref) title.href = lab.doorHref;
      name.append(title);
      const small = document.createElement('span');
      small.className = 'ai-bench-lab';
      small.textContent = labLine(lab);
      name.append(small);
      tr.append(name);

      columns.forEach(function (col) {
        const td = document.createElement('td');
        if (col.id === 'aaIndex') td.className = 'ai-bench-aa';
        const cell = lab.benches ? lab.benches[col.id] : null;
        const raw = cell && cell.value != null ? String(cell.value) : '';
        if (!cell || !raw.trim()) {
          td.className = 'ai-bench-blank';
          td.textContent = BLANK;
        } else if (cell.source) {
          const a = document.createElement('a');
          a.href = cell.source;
          fillNumber(a, cell);
          td.append(a);
        } else {
          fillNumber(td, cell);
        }
        tr.append(td);
      });
      tbody.append(tr);
    });

    if (asof) {
      const stamp = data.asOf ? String(data.asOf) : '';
      asof.textContent = stamp
        ? 'Shared benches · living pack · as of ' + stamp
        : 'Shared benches · living pack';
    }
    root.hidden = false;
    return true;
  }

  function init() {
    const root = document.getElementById('aiBench');
    if (!root) return;
    fetch('/ai-benchmarks.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('bench');
        return res.json();
      })
      .then(function (data) {
        if (!render(root, data)) root.hidden = true;
      })
      .catch(function () {
        root.hidden = true;
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
