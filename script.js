/* ==================================================================
   RYCODE — script.js
   Vanilla JS, no dependencies. All logic runs after DOMContentLoaded.

   TABLE OF CONTENTS
   -----------------
   1. BOOT                    (DOMContentLoaded, reduced-motion check)
   2. HEADER SCROLL STATE     (border appears once scrolled)
   3. MOBILE NAV TOGGLE
   4. SMOOTH-SCROLL ANCHORS   (+ closes mobile nav on click)
   5. REVEAL ON SCROLL        (IntersectionObserver)
   6. STAT COUNT-UP           (animates on first reveal)
   7. TYPEWRITER              (rotates words in the hero tagline)
   8. CARD 3D TILT            (mousemove → rotateX / rotateY)
   9. HERO CURSOR SPOTLIGHT   (mousemove → --mx / --my on the hero)
   ================================================================== */


// ==================================================================
// 1. BOOT
// ==================================================================
document.addEventListener('DOMContentLoaded', () => {

  // Honor OS-level "reduce motion" everywhere below.
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;


  // ================================================================
  // 2. HEADER SCROLL STATE
  // Adds a subtle bottom border to the sticky header once the user
  // has scrolled — gives the nav a clear edge against the content.
  // ================================================================
  const header = document.getElementById('siteHeader');
  if (header) {
    const setScrolled = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }


  // ================================================================
  // 3. MOBILE NAV TOGGLE
  // Hamburger button opens the nav panel on small screens.
  // Uses aria-expanded so screen readers announce the state change.
  // ================================================================
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }


  // ================================================================
  // 4. SMOOTH-SCROLL ANCHORS
  // Intercept in-page `#anchor` links so we can (a) offset for the
  // sticky header, (b) close the mobile nav after a jump.
  // ================================================================
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const headerOffset = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 8;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });

      // Close the mobile panel if it was open.
      if (navLinks && navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });


  // ================================================================
  // 5. REVEAL ON SCROLL
  // Any element with `.reveal` starts hidden (see styles.css §13).
  // IntersectionObserver flips `.is-in` the first time it enters
  // the viewport — one-shot animation, no re-triggering on scroll up.
  // ================================================================
  const revealTargets = document.querySelectorAll('.reveal');

  if (prefersReducedMotion) {
    // If motion is reduced, just show everything immediately.
    revealTargets.forEach((el) => el.classList.add('is-in'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealTargets.forEach((el) => io.observe(el));
  } else {
    // Old browser fallback — show everything, no animation.
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }


  // ================================================================
  // 6. STAT COUNT-UP
  // Numbers tick from 0 → data-count when the stat enters view.
  // Uses requestAnimationFrame + ease-out for a natural curve.
  // ================================================================
  const statNums = document.querySelectorAll('.stat-num');

  const animateCount = (el) => {
    const end = parseInt(el.dataset.count || '0', 10);
    if (prefersReducedMotion || end === 0) {
      el.textContent = String(end);
      return;
    }
    const duration = 1200;               // ms
    const start    = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const t       = Math.min(elapsed / duration, 1);
      // Ease-out cubic — fast at first, eases to the target.
      const eased   = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(end * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statNums.forEach((n) => countIO.observe(n));
  } else {
    statNums.forEach((n) => { n.textContent = n.dataset.count || '0'; });
  }


  // ================================================================
  // 7. TYPEWRITER
  // Rotates four words in the hero tagline: Risk → GRC → AI → code.
  // Types, holds, deletes, moves on. Skipped under reduced motion.
  // ================================================================
  const typeEl = document.getElementById('typeTarget');
  if (typeEl && !prefersReducedMotion) {
    // Rotating output words map to the three category sections below,
    // with "proof." as the closing thesis — these projects are proof
    // that AI-assisted building ships real work.
    const words       = ['systems.', 'research.', 'dashboards.', 'proof.'];
    const typeSpeed   = 85;    // ms per char typed
    const eraseSpeed  = 45;    // ms per char erased
    const holdFull    = 1600;  // ms to hold the full word
    const holdEmpty   = 280;   // ms to hold the empty state
    let wordIdx = 0;

    const typeWord = (word, onDone) => {
      let i = 0;
      typeEl.textContent = '';
      const tick = () => {
        typeEl.textContent = word.slice(0, ++i);
        if (i < word.length) setTimeout(tick, typeSpeed);
        else                 setTimeout(onDone, holdFull);
      };
      tick();
    };

    const eraseWord = (onDone) => {
      const current = typeEl.textContent;
      let i = current.length;
      const tick = () => {
        typeEl.textContent = current.slice(0, --i);
        if (i > 0) setTimeout(tick, eraseSpeed);
        else       setTimeout(onDone, holdEmpty);
      };
      tick();
    };

    const cycle = () => {
      const word = words[wordIdx % words.length];
      typeWord(word, () => {
        eraseWord(() => {
          wordIdx++;
          cycle();
        });
      });
    };

    // Give the initial "code." a beat to be seen, then start cycling.
    setTimeout(() => eraseWord(() => { wordIdx = 1; cycle(); }), 1400);
  }


  // ================================================================
  // 8. CARD 3D TILT
  // On mousemove, write `--rx` and `--ry` CSS vars on the card so
  // the existing transform in styles.css rotates the card in 3D.
  // On leave, reset to 0. Skipped under reduced motion and on touch.
  // ================================================================
  const tiltCards = document.querySelectorAll('.tilt');
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!prefersReducedMotion && !isCoarsePointer) {
    const MAX_TILT = 6; // degrees — keep subtle, not vertigo-inducing

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x    = (e.clientX - rect.left) / rect.width;   // 0..1
        const y    = (e.clientY - rect.top)  / rect.height;  // 0..1
        const ry   = (x - 0.5) * 2 * MAX_TILT;   // left/right
        const rx   = (0.5 - y) * 2 * MAX_TILT;   // up/down (inverted)
        card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }


  // ================================================================
  // 9. HERO CURSOR SPOTLIGHT
  // Writes --mx / --my CSS vars on the .hero element as the mouse
  // moves. The radial-gradient in styles.css §6 uses those vars to
  // paint a soft gold glow that follows the cursor. Skipped on touch
  // devices (no cursor to follow) and under reduced motion.
  // ================================================================
  const hero = document.querySelector('.hero');
  if (hero && !prefersReducedMotion && !isCoarsePointer) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      hero.style.setProperty('--mx', x.toFixed(2) + '%');
      hero.style.setProperty('--my', y.toFixed(2) + '%');
    });
  }

});
