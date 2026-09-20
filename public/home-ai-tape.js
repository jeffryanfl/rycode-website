/* HOME A.I. TAPE
   Fetch /ai-tape.json and fill the charcoal top strip. HOME only.

   TABLE OF CONTENTS
   1. Shape helpers (door href, first three lines)
   2. Render asOf + Tag · text (as-of only if lines empty)
   3. Marquee after layout (always loop when lines exist)
   4. Fetch on DOMContentLoaded
*/

(function () {
  const MAX_LINES = 3;

  function doorHref(raw) {
    if (typeof raw !== 'string') return '/ai';
    const href = raw.trim();
    if (href.startsWith('/') && !href.startsWith('//')) return href;
    return '/ai';
  }

  function linesFrom(data) {
    if (!Array.isArray(data.lines)) return [];
    return data.lines.slice(0, MAX_LINES).filter(
      (row) => row && typeof row.tag === 'string' && typeof row.text === 'string'
    );
  }

  function enableMarquee(track, viewport) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !(viewport instanceof HTMLElement) || !(track instanceof HTMLElement)) {
      return;
    }
    if (track.children.length === 0) return;

    // Always loop when we have lines. Measuring right after un-hiding
    // [hidden] often under-reads width and skips the marquee.
    track.classList.remove('hub-tape-track--scroll');
    [...track.querySelectorAll('[data-hub-ai-tape-clone]')].forEach(function (node) {
      node.remove();
    });
    [...track.children].forEach(function (node) {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-hub-ai-tape-clone', '');
      track.append(clone);
    });
    track.classList.add('hub-tape-track--scroll');
  }

  function render(root, data) {
    const asof = root.querySelector('[data-hub-ai-tape-asof]');
    const track = root.querySelector('[data-hub-ai-tape-track]');
    const viewport = root.querySelector('[data-hub-ai-tape-viewport]');
    const rows = linesFrom(data);
    if (!asof || !track) return false;

    const asOfLabel = typeof data.asOfLabel === 'string' ? data.asOfLabel.trim() : '';
    asof.textContent = asOfLabel;
    asof.hidden = !asOfLabel;

    track.replaceChildren();
    track.classList.remove('hub-tape-track--scroll');

    root.setAttribute('href', doorHref(data.doorHref));
    root.setAttribute(
      'aria-label',
      asOfLabel ? 'A.I. tape, ' + asOfLabel : 'A.I. tape'
    );

    if (rows.length === 0) {
      if (!asOfLabel) return false;
      if (viewport) viewport.hidden = true;
      root.hidden = false;
      return true;
    }

    if (viewport) viewport.hidden = false;

    rows.forEach((row) => {
      const item = document.createElement('span');
      item.className = 'hub-tape-item';
      const tag = document.createElement('span');
      tag.className = 'hub-tape-tag';
      tag.textContent = row.tag.trim();
      item.append(tag, document.createTextNode(' · ' + row.text.trim()));
      track.append(item);
    });

    root.hidden = false;

    // Two frames + fonts: layout is ready after [hidden] is cleared.
    function afterLayout() {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          enableMarquee(track, viewport);
        });
      });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(afterLayout).catch(afterLayout);
    } else {
      afterLayout();
    }

    return true;
  }

  function init() {
    const root = document.getElementById('hubAiTape');
    if (!root) return;

    fetch('/ai-tape.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('ai-tape');
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
