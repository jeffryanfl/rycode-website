/* Pause and play for HOME marquee tapes. Honors prefers-reduced-motion. */
(function () {
  function wirePause(root) {
    const btn = root.querySelector('[data-hub-tape-pause]');
    const track = root.querySelector('[data-hub-tape-track], [data-hub-ai-tape-track]');
    if (!btn || !track) return;

    const pauseLabel = root.getAttribute('data-tape-pause-label') || 'Pause tape';
    const playLabel = root.getAttribute('data-tape-play-label') || 'Play tape';
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    function syncReduced() {
      if (mq.matches) {
        btn.hidden = true;
        root.classList.remove('hub-tape--paused');
        track.style.animationPlayState = '';
        return true;
      }
      btn.hidden = !track.classList.contains('hub-tape-track--scroll');
      return false;
    }

    function setPaused(paused) {
      root.classList.toggle('hub-tape--paused', paused);
      track.style.animationPlayState = paused ? 'paused' : 'running';
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? playLabel : pauseLabel);
      const icon = btn.querySelector('[data-hub-tape-toggle-icon]');
      if (icon) icon.textContent = paused ? '\u25B6' : '||';
    }

    btn.addEventListener('click', function () {
      if (!track.classList.contains('hub-tape-track--scroll')) return;
      setPaused(btn.getAttribute('aria-pressed') !== 'true');
    });

    setPaused(false);
    syncReduced();
    mq.addEventListener('change', syncReduced);

    return function afterMarquee() {
      syncReduced();
    };
  }

  window.hubTapeWirePause = wirePause;
})();
