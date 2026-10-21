/* /ai week news tape. Marquee + pause; same behavior as HOME A.I. tape. */
(function () {
  function enableMarquee(track, viewport) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !(viewport instanceof HTMLElement) || !(track instanceof HTMLElement)) {
      return;
    }
    if (track.children.length === 0) return;

    track.classList.remove('hub-tape-track--scroll');
    [...track.querySelectorAll('[data-hub-ai-tape-clone]')].forEach(function (node) {
      node.remove();
    });
    [...track.children].forEach(function (node) {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-hub-ai-tape-clone', '');
      clone.setAttribute('tabindex', '-1');
      track.append(clone);
    });
    track.classList.add('hub-tape-track--scroll');
  }

  function init() {
    const root = document.getElementById('aiWeekTicker');
    if (!root) return;
    const track = root.querySelector('[data-hub-ai-tape-track]');
    const viewport = root.querySelector('[data-hub-ai-tape-viewport]');
    if (!track || !viewport) return;

    const afterMarquee =
      typeof window.hubTapeWirePause === 'function' ? window.hubTapeWirePause(root) : null;

    function afterLayout() {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          enableMarquee(track, viewport);
          if (afterMarquee) afterMarquee();
        });
      });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(afterLayout).catch(afterLayout);
    } else {
      afterLayout();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
