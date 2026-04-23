/* ====================================================================
   THE TELLER–ULAM TRICK — teller-ulam.js
   Vanilla JS, runs after DOMContentLoaded. No dependencies.

   What this file does:
     FOOTNOTE TOOLTIPS — each sup.fn link gets a native `title`
     attribute built from the matching reference-list text, so
     hovering (or long-pressing on touch) shows the source title
     without leaving the paragraph.

   This is a slimmed-down port of research/fission/fission.js —
   same tooltip behavior, but the sticky sidebar / scroll-spy logic
   is dropped because this shorter article doesn't have a sidebar
   TOC. If one is added later, copy the scroll-spy block from
   fission.js rather than rewriting it here.

   Nothing here is required for the page to be *readable* — it reads
   fine with JS disabled (footnotes still link, references still
   render) — this is a polish behavior only.

   TABLE OF CONTENTS
   -----------------
   1. BOOT
   2. FOOTNOTE TOOLTIPS
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==================================================================
  // 1. BOOT
  // Nothing global to wire up for this page. The tooltip builder is
  // self-contained below. Left as a named section anyway so future
  // polish features (reveal-on-scroll, copy-link buttons, etc.) have
  // a documented place to land.
  // ==================================================================


  // ==================================================================
  // 2. FOOTNOTE TOOLTIPS
  //
  // In the prose, footnotes look like:
  //   <sup class="fn"><a href="#fn-3">3</a></sup>
  //
  // Down in the references section, the matching reference looks like:
  //   <li id="fn-3">Carey Sublette. <cite>Nuclear Weapons Frequently
  //     Asked Questions.</cite> ...</li>
  //
  // We want the tooltip to show the clean text of that <li> — no HTML,
  // no awkward whitespace runs from the source file.
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
    link.setAttribute(
      'aria-label',
      'Footnote ' + link.textContent.trim() + ': ' + sourceText
    );
  });

});
