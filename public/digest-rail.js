/* DIGEST RAIL
   External file so Netlify CSP (script-src 'self') can run it.
   Inline <script> on digest pages is blocked on rycode.dev.

   TABLE OF CONTENTS
   1. Read pin / fallback / stretch from [data-digest-rail]
   2. Move the stack with the scroll, not on a timer
   3. Stretch one card when two cards share the second slot
   4. Wide screens only; reduced-motion scrolls the rail instead
*/

(function () {
  function parsePins(raw) {
    const pins = Object.create(null);
    if (!raw) return pins;
    raw.split(',').forEach(function (part) {
      const bits = part.split(':');
      if (bits.length !== 2) return;
      const key = bits[0].trim();
      const id = bits[1].trim();
      if (key && id) pins[key] = id;
    });
    return pins;
  }

  function bindDigestRail() {
    const rail = document.querySelector('[data-digest-rail]');
    const stack = rail?.querySelector(
      '.research-digest-stack, .risk-digest-stack, .econ-digest-stack, .ai-digest-stack',
    );
    if (!(rail instanceof HTMLElement) || !(stack instanceof HTMLElement)) return;

    const pins = parsePins(rail.getAttribute('data-digest-pins'));
    const fallback = (rail.getAttribute('data-digest-fallback') || '').trim();
    const stretchKey = (rail.getAttribute('data-digest-stretch') || '').trim();
    const wide = window.matchMedia('(min-width: 860px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sections = [...document.querySelectorAll('[data-digest-section]')];
    const firstKey = sections[0]?.getAttribute('data-digest-section') || '';

    function pinFor(key) {
      if (pins[key]) return pins[key];
      if (fallback) return key === firstKey ? firstKey : fallback;
      return key;
    }

    const originKey = pinFor(firstKey);
    const origin = document.getElementById('card-' + originKey);

    function card(key) {
      return key ? document.getElementById('card-' + key) : null;
    }

    function clearActive() {
      stack.querySelectorAll('[data-active]').forEach(function (el) {
        el.removeAttribute('data-active');
      });
    }

    function resetStretch() {
      if (!stretchKey) return;
      const el = card(stretchKey);
      if (el) el.style.minHeight = '';
    }

    function applyStretch(pinKey) {
      if (!stretchKey) return;
      const el = card(stretchKey);
      if (!el) return;
      if (pinKey === stretchKey && stack.parentElement) {
        const next = el.nextElementSibling;
        const gap = 10;
        const room =
          stack.parentElement.clientHeight - (next?.offsetHeight || 0) - gap;
        el.style.minHeight = room > 0 ? room + 'px' : '';
      } else {
        el.style.minHeight = '';
      }
    }

    function resetMotion() {
      stack.style.transform = '';
      stack.style.transition = '';
      clearActive();
      resetStretch();
    }

    let frame = 0;

    function render() {
      frame = 0;
      const viewport = stack.parentElement;
      if (!wide.matches) {
        resetMotion();
        if (viewport) viewport.style.overflow = '';
        return;
      }
      if (reduce.matches) {
        resetMotion();
        if (viewport) viewport.style.overflow = 'auto';
        return;
      }
      if (viewport) viewport.style.overflow = 'hidden';
      // The old 0.35s ease ran on a clock, so the cards lagged behind the scroll.
      stack.style.transition = 'none';
      if (!sections.length) return;

      const mark = window.scrollY + window.innerHeight * 0.28;
      const tops = sections.map(function (section) {
        return section.getBoundingClientRect().top + window.scrollY;
      });
      let index = 0;
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= mark) index = i;
      }
      const hereKey = sections[index].getAttribute('data-digest-section') || '';
      applyStretch(pinFor(hereKey));

      const points = [];
      for (let i = 0; i < sections.length; i++) {
        const key = sections[i].getAttribute('data-digest-section') || '';
        const pinKey = pinFor(key);
        const pinEl = card(pinKey);
        if (!pinEl) continue;
        const offset = !origin || pinKey === originKey ? 0 : pinEl.offsetTop - origin.offsetTop;
        points.push({
          key: key,
          pinKey: pinKey,
          top: sections[i].getBoundingClientRect().top + window.scrollY,
          offset: offset,
        });
      }
      if (!points.length) return;

      let at = 0;
      for (let i = 0; i < points.length; i++) {
        if (points[i].top <= mark) at = i;
      }
      const here = points[at];
      const next = points[at + 1];
      let offset = here.offset;
      let activeKey = here.key;
      let activePin = here.pinKey;
      if (next && next.offset !== here.offset) {
        const span = Math.max(next.top - here.top, 1);
        // Spread the move across this whole section so it stays locked to the scroll.
        // A fixed timer made the cards lag, then jump.
        const glide = span;
        const start = here.top;
        if (mark > start) {
          let t = (mark - start) / glide;
          if (t < 0) t = 0;
          if (t > 1) t = 1;
          t = t * t * (3 - 2 * t);
          offset = here.offset + (next.offset - here.offset) * t;
          if (t >= 0.5) {
            activeKey = next.key;
            activePin = next.pinKey;
          }
        }
      }

      clearActive();
      const active = card(activeKey) || card(activePin);
      if (active) active.setAttribute('data-active', 'true');
      const y = Math.round(offset * 10) / 10;
      stack.style.transform = y ? 'translate3d(0,' + -y + 'px,0)' : '';
    }

    function requestRender() {
      if (frame) return;
      frame = window.requestAnimationFrame(render);
    }

    render();
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);
    wide.addEventListener('change', requestRender);
    reduce.addEventListener('change', requestRender);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDigestRail);
  } else {
    bindDigestRail();
  }
})();
