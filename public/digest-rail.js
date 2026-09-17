/* DIGEST RAIL
   External file so Netlify CSP (script-src 'self') can run it.
   Inline <script> on digest pages is blocked on rycode.dev.

   TABLE OF CONTENTS
   1. Read pin / fallback / stretch from [data-digest-rail]
   2. Slide the stack so the matching card sits at the top
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
      '.research-digest-stack, .risk-digest-stack, .econ-digest-stack',
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

    function currentKey() {
      const mark = window.innerHeight * 0.28;
      let key = firstKey;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= mark) {
          key = section.getAttribute('data-digest-section') || key;
        }
      }
      return key;
    }

    function activate(key) {
      if (!wide.matches) {
        stack.style.transform = '';
        clearActive();
        resetStretch();
        return;
      }

      const pinKey = pinFor(key);
      const pinEl = card(pinKey);
      if (!pinEl) return;

      clearActive();
      (card(key) || pinEl).setAttribute('data-active', 'true');
      applyStretch(pinKey);

      const offset =
        pinKey === originKey || !origin ? 0 : pinEl.offsetTop - origin.offsetTop;
      stack.style.transform = offset ? 'translateY(-' + offset + 'px)' : '';
    }

    function sync() {
      const viewport = stack.parentElement;
      if (!wide.matches) {
        stack.style.transform = '';
        clearActive();
        resetStretch();
        if (viewport) viewport.style.overflow = '';
        return;
      }
      if (reduce.matches) {
        stack.style.transform = '';
        clearActive();
        resetStretch();
        if (viewport) viewport.style.overflow = 'auto';
        return;
      }
      if (viewport) viewport.style.overflow = 'hidden';
      activate(currentKey());
    }

    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    wide.addEventListener('change', sync);
    reduce.addEventListener('change', sync);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDigestRail);
  } else {
    bindDigestRail();
  }
})();
