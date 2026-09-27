/* Concept map interaction. Positions are baked into the SVG.
   This file spotlights a neighborhood, fills the thesis panel, filters, and pans or zooms. */
(function () {
  var root = document.getElementById('concept-map');
  var svg = document.getElementById('concept-map-svg');
  var dataNode = document.getElementById('concept-map-data');
  if (!root || !svg || !dataNode) return;

  document.documentElement.classList.add('js');

  var concepts = JSON.parse(dataNode.textContent);
  var byId = {};
  concepts.forEach(function (concept) {
    byId[concept.id] = concept;
  });

  var home = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  var view = { x: home[0], y: home[1], w: home[2], h: home[3] };
  var panelEmpty = document.getElementById('concept-panel-empty');
  var panelBody = document.getElementById('concept-panel-body');
  var panelKicker = document.getElementById('concept-panel-kicker');
  var panelTitle = document.getElementById('concept-panel-title');
  var panelBlurb = document.getElementById('concept-panel-blurb');
  var panelArticles = document.getElementById('concept-panel-articles');
  var panelLinks = document.getElementById('concept-panel-links');
  var search = document.getElementById('concept-search');
  var searchList = document.getElementById('concept-search-list');
  var selected = '';
  var hitHref = '';
  var searchRows = [];
  var searchIndex = -1;

  function applyView() {
    svg.setAttribute('viewBox', view.x + ' ' + view.y + ' ' + view.w + ' ' + view.h);
  }

  function clearMarks() {
    svg.classList.remove('is-active');
    svg.querySelectorAll('.is-focus, .is-near, .is-hot').forEach(function (el) {
      el.classList.remove('is-focus', 'is-near', 'is-hot');
      el.removeAttribute('aria-pressed');
    });
  }

  function showEmpty() {
    selected = '';
    hitHref = '';
    clearMarks();
    panelBody.hidden = true;
    panelEmpty.hidden = false;
  }

  function select(id, href) {
    var concept = byId[id];
    if (!concept) return;
    selected = id;
    hitHref = href || '';
    clearMarks();
    svg.classList.add('is-active');
    var focus = svg.querySelector('[data-concept="' + id + '"]');
    if (focus) {
      focus.classList.add('is-focus');
      focus.setAttribute('aria-pressed', 'true');
    }
    concept.links.forEach(function (link) {
      var node = svg.querySelector('[data-concept="' + link.id + '"]');
      if (node) node.classList.add('is-near');
      svg.querySelectorAll('.concept-edge').forEach(function (edge) {
        var a = edge.getAttribute('data-from');
        var b = edge.getAttribute('data-to');
        if ((a === id && b === link.id) || (b === id && a === link.id)) edge.classList.add('is-hot');
      });
    });

    panelEmpty.hidden = true;
    panelBody.hidden = false;
    panelKicker.textContent = concept.clusterLabel + (concept.bridge ? ' · reaches other clusters' : '');
    panelTitle.textContent = concept.label;
    panelBlurb.textContent = concept.blurb;
    panelArticles.replaceChildren();
    concept.articles.forEach(function (article) {
      var li = document.createElement('li');
      if (article.href === hitHref) li.className = 'is-hit';
      var link = document.createElement('a');
      link.href = article.href;
      link.textContent = article.title;
      var thesis = document.createElement('p');
      thesis.className = 'concept-panel-thesis';
      thesis.textContent = article.thesis;
      var time = document.createElement('time');
      time.dateTime = article.date;
      time.textContent = article.dateLabel;
      li.append(link, thesis, time);
      panelArticles.append(li);
    });
    var hit = panelArticles.querySelector('.is-hit');
    if (hit && hit.scrollIntoView) hit.scrollIntoView({ block: 'nearest' });
    panelLinks.replaceChildren();
    concept.links.forEach(function (link) {
      var li = document.createElement('li');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'linkish';
      button.textContent = link.label;
      button.addEventListener('click', function () {
        select(link.id);
      });
      li.append(button);
      panelLinks.append(li);
    });
  }

  svg.querySelectorAll('[data-concept]').forEach(function (node) {
    node.addEventListener('click', function (event) {
      event.stopPropagation();
      select(node.getAttribute('data-concept'));
    });
    node.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(node.getAttribute('data-concept'));
      }
    });
  });

  svg.addEventListener('click', function (event) {
    if (event.target === svg || event.target.classList.contains('concept-edge')) showEmpty();
  });

  function matches(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var rows = [];
    concepts.forEach(function (concept) {
      if (concept.label.toLowerCase().indexOf(q) !== -1) {
        rows.push({ kind: 'Concept', id: concept.id, title: concept.label, href: '' });
      }
      concept.articles.forEach(function (article) {
        if (article.title.toLowerCase().indexOf(q) !== -1) {
          rows.push({
            kind: 'Article · ' + concept.label,
            id: concept.id,
            title: article.title,
            href: article.href,
          });
        }
      });
    });
    return rows.slice(0, 12);
  }

  function paintSearch(query) {
    searchRows = matches(query);
    searchIndex = -1;
    var matched = {};
    searchRows.forEach(function (row) { matched[row.id] = true; });
    var filtering = query.trim().length > 0;
    svg.querySelectorAll('[data-concept]').forEach(function (node) {
      node.classList.toggle('is-filtered', filtering && !matched[node.getAttribute('data-concept')]);
    });
    svg.querySelectorAll('.concept-edge').forEach(function (edge) {
      var keep = matched[edge.getAttribute('data-from')] && matched[edge.getAttribute('data-to')];
      edge.classList.toggle('is-filtered', filtering && !keep);
    });
    searchList.replaceChildren();
    if (!searchRows.length) {
      searchList.hidden = true;
      search.setAttribute('aria-expanded', 'false');
      return;
    }
    searchRows.forEach(function (row, index) {
      var li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'option');
      button.id = 'concept-search-opt-' + index;
      button.setAttribute('aria-selected', 'false');
      var kind = document.createElement('span');
      kind.className = 'concept-search-kind';
      kind.textContent = row.kind;
      var title = document.createElement('span');
      title.textContent = row.title;
      button.append(kind, title);
      button.addEventListener('click', function () {
        chooseSearch(index);
      });
      li.append(button);
      searchList.append(li);
    });
    searchList.hidden = false;
    search.setAttribute('aria-expanded', 'true');
  }

  function markSearch(index) {
    var buttons = searchList.querySelectorAll('[role="option"]');
    buttons.forEach(function (button, i) {
      var on = i === index;
      button.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) button.focus();
    });
    searchIndex = index;
  }

  function chooseSearch(index) {
    var row = searchRows[index];
    if (!row) return;
    select(row.id, row.href);
    searchList.hidden = true;
    search.setAttribute('aria-expanded', 'false');
    search.value = row.title;
  }

  if (search) {
    search.addEventListener('input', function () {
      paintSearch(search.value);
    });
    search.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!searchRows.length) paintSearch(search.value);
        markSearch(Math.min(searchRows.length - 1, searchIndex + 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        markSearch(Math.max(0, searchIndex - 1));
      } else if (event.key === 'Enter' && searchIndex >= 0) {
        event.preventDefault();
        chooseSearch(searchIndex);
      } else if (event.key === 'Escape') {
        search.value = '';
        paintSearch('');
        search.focus();
      }
    });
  }

  var dragging = false;
  var moved = false;
  var last = null;

  svg.addEventListener('pointerdown', function (event) {
    if (event.button && event.button !== 0) return;
    dragging = true;
    moved = false;
    last = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });

  svg.addEventListener('pointermove', function (event) {
    if (!dragging || !last) return;
    var dx = event.clientX - last.x;
    var dy = event.clientY - last.y;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    if (!moved) {
      moved = true;
      svg.setPointerCapture(last.id);
    }
    var rect = svg.getBoundingClientRect();
    view.x -= (dx / rect.width) * view.w;
    view.y -= (dy / rect.height) * view.h;
    last.x = event.clientX;
    last.y = event.clientY;
    applyView();
  });

  function endDrag(event) {
    dragging = false;
    last = null;
    if (svg.hasPointerCapture && event.pointerId != null && svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }
  }

  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  svg.addEventListener('click', function (event) {
    if (moved) {
      event.stopPropagation();
      moved = false;
    }
  }, true);

  function zoom(factor, clientX, clientY) {
    var rect = svg.getBoundingClientRect();
    var px = clientX == null ? rect.left + rect.width / 2 : clientX;
    var py = clientY == null ? rect.top + rect.height / 2 : clientY;
    var rx = (px - rect.left) / rect.width;
    var ry = (py - rect.top) / rect.height;
    var nextW = Math.min(home[2] * 2.4, Math.max(home[2] / 3.2, view.w * factor));
    var nextH = nextW * (home[3] / home[2]);
    var cx = view.x + rx * view.w;
    var cy = view.y + ry * view.h;
    view.w = nextW;
    view.h = nextH;
    view.x = cx - rx * nextW;
    view.y = cy - ry * nextH;
    applyView();
  }

  svg.addEventListener('wheel', function (event) {
    event.preventDefault();
    zoom(event.deltaY > 0 ? 1.12 : 0.9, event.clientX, event.clientY);
  }, { passive: false });

  root.querySelectorAll('[data-zoom]').forEach(function (button) {
    button.addEventListener('click', function () {
      var mode = button.getAttribute('data-zoom');
      if (mode === 'reset') {
        view = { x: home[0], y: home[1], w: home[2], h: home[3] };
        applyView();
        return;
      }
      zoom(mode === 'in' ? 0.8 : 1.25);
    });
  });
})();
