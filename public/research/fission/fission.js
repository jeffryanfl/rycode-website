/* ====================================================================
   FISSION: A TECHNICAL HISTORY — fission.js
   Vanilla JS, runs after DOMContentLoaded. No dependencies.

   What this file does:
     1. FOOTNOTE TOOLTIPS — each sup.fn link gets a native `title`
        attribute built from the matching reference-list text, so
        hovering (or long-pressing on touch) shows the source title
        without leaving the paragraph.
     2. SCROLL-SPY — the sticky sidebar nav (visible on desktop) gets
        an .is-active class on whichever section the reader is
        currently reading.

   Nothing here is required for the paper to be *readable* — it reads
   fine with JS disabled (footnotes still link, nav still jumps) —
   these are polish behaviors only.

   TABLE OF CONTENTS
   -----------------
   1. BOOT
   2. FOOTNOTE TOOLTIPS
   3. SCROLL-SPY
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==================================================================
  // 1. BOOT
  // Pull the handful of nodes we care about once and reuse them.
  // If anything is missing (shouldn't be, but defensive), bail out of
  // just that feature rather than throwing and killing the rest.
  // ==================================================================
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;


  // ==================================================================
  // 2. FOOTNOTE TOOLTIPS
  //
  // In the prose, footnotes look like:
  //   <sup class="fn"><a href="#fn-3">3</a></sup>
  //
  // Down in the references section, the matching reference looks like:
  //   <li id="fn-3"><a href="...">Manhattan Project National Historical
  //     Park</a> · U.S. National Park Service</li>
  //
  // We want the tooltip to show just the clean text of that <li>
  // (link title + " · publisher") — no HTML, no trailing whitespace.
  //
  // textContent (not innerHTML) is used deliberately — it strips tags
  // and protects us if a reference ever contains user-editable HTML.
  // ==================================================================
  const footnoteLinks = document.querySelectorAll('sup.fn a[href^="#fn-"]');

  footnoteLinks.forEach((link) => {
    const targetId = link.getAttribute('href').slice(1); // strip the '#'
    const target = document.getElementById(targetId);
    if (!target) return;

    // Collapse any whitespace runs to a single space so the tooltip
    // doesn't contain awkward line breaks copied from the HTML source.
    const sourceText = target.textContent.replace(/\s+/g, ' ').trim();

    link.setAttribute('title', sourceText);
    link.setAttribute('aria-label', 'Footnote ' + link.textContent.trim() + ': ' + sourceText);
  });


  // ==================================================================
  // 3. SCROLL-SPY
  //
  // For the sticky sidebar (.section-nav), highlight whichever main
  // <section> is most visible in the viewport.
  //
  // IntersectionObserver is the modern way to do this — no scroll
  // event spam, the browser tells us when visibility changes. Each
  // section is observed with a rootMargin that pulls the "active"
  // band to roughly the middle of the screen, which feels better
  // than the top edge.
  //
  // If IntersectionObserver isn't supported (very old browsers), we
  // just leave every nav link unhighlighted — the links still work.
  // ==================================================================
  const sectionNav = document.getElementById('sectionNav');
  if (!sectionNav || !('IntersectionObserver' in window)) return;

  // Map section id -> sidebar link, so we can flip .is-active fast.
  const navLinks = sectionNav.querySelectorAll('a[href^="#"]');
  const linkById = new Map();
  navLinks.forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    linkById.set(id, a);
  });

  // Watch each section that has a matching sidebar link.
  const sections = [];
  linkById.forEach((_link, id) => {
    const el = document.getElementById(id);
    if (el) sections.push(el);
  });

  // A single observer for all of them. The rootMargin says:
  // "consider a section 'in view' only when it crosses the top 35%
  // of the viewport." That way the highlight matches where the
  // reader's eye actually is, not the bottom edge.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = linkById.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        // Clear any other actives, then mark this one.
        navLinks.forEach((a) => a.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  }, {
    rootMargin: '-35% 0px -55% 0px',
    threshold: 0,
  });

  sections.forEach((section) => observer.observe(section));

});
