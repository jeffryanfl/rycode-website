/* TERMS RAIL
   External file so Netlify CSP (script-src 'self') can run it.
   Inline <script> on the A.I. essay is blocked on rycode.dev.

   TABLE OF CONTENTS
   1. Find [data-terms-rail] and in-body term buttons
   2. Click opens that term's details panel and closes the others
*/

(function () {
  function bindTerms() {
    const rail = document.querySelector('[data-terms-rail]');
    if (!(rail instanceof HTMLElement)) return;

    const panels = rail.querySelectorAll('details');

    document.querySelectorAll('[data-term]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-term');
        const panel = document.getElementById('term-' + id);
        if (!(panel instanceof HTMLDetailsElement)) return;
        panels.forEach(function (item) {
          if (item !== panel) item.open = false;
        });
        panel.open = true;
        panel.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTerms);
  } else {
    bindTerms();
  }
})();
