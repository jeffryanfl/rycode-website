/* tabindex, role, and aria-label on horizontal table scrollers site-wide. */
(function () {
  const SELECTOR = '.ai-model-table-wrap, .ai-lab-table-wrap, .abb-wrap';

  function labelFor(el) {
    const explicit = el.getAttribute('aria-label');
    if (explicit) return explicit;
    const cap = el.querySelector('table caption:not(.visually-hidden)');
    if (cap && cap.textContent) return 'Scrollable table: ' + cap.textContent.trim();
    const section = el.closest('section');
    const heading = section && section.querySelector('h2, h3');
    if (heading && heading.textContent) return 'Scrollable table: ' + heading.textContent.trim();
    const lane = el.previousElementSibling;
    if (lane && lane.matches('h2') && lane.textContent) {
      return 'Scrollable table: ' + lane.textContent.trim();
    }
    return 'Scrollable table';
  }

  function enhance() {
    document.querySelectorAll(SELECTOR).forEach(function (el) {
      if (el.getAttribute('data-scroll-region') === '1') return;
      el.setAttribute('data-scroll-region', '1');
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', labelFor(el));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }
})();
