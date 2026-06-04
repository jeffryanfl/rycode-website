    (function () {
      'use strict';

      // ==================== CONFIG ====================
      // Keyframes for every phase-driven property.
      // Each entry is [time_in_ns, value]. Values are linearly
      // interpolated between adjacent keyframes.
      const K = {
        // X-ray wash opacity: fades in ~5ns, holds, fades into fireball
        xrayWashOpacity: [[0, 0], [5, 0.22], [50, 0.30], [150, 0.28], [250, 0.10], [300, 0]],

        // Fireball overlay opacity: fades in at the end
        fireballOpacity: [[0, 0], [200, 0], [260, 0.5], [300, 1]],
        fireballExtrasOpacity: [[0, 0], [220, 0], [280, 1]],

        // Primary HE-lens color (interpolated R,G,B)
        // 0x8a6a2b (dim) → 0xffb547 (hot) → back to dim → very dim in fireball
        heColor: [[0, 0x8a6a2b], [8, 0xffb547], [80, 0xffb547], [200, 0x8a6a2b], [300, 0x4a3a1a]],

        // Primary pit fill — gets white-hot during fission then cools
        pitColor: [[0, 0x3a2f18], [8, 0xffb547], [60, 0xffb547], [200, 0xd4a84b], [300, 0x8a6a2b]],

        // Primary pit stroke (matches cooling)
        pitStroke: [[0, 0x8a6a2b], [8, 0xffffff], [60, 0xffb547], [200, 0x8a6a2b]],

        // Tamper fill (brightens mildly as primary fires)
        tamperFill: [[0, 0x262626], [10, 0x8a6a2b], [80, 0x8a6a2b], [200, 0x333333]],

        // Armed indicators fade out the instant detonation begins
        armedOpacity: [[0, 1], [2, 0]],

        // Blast wave ring radius (exaggerated for visibility — the
        // REAL distance is shown by the bars below). Grows with time.
        blastRadius: [[0, 0], [5, 60], [10, 120], [50, 150], [100, 220], [200, 400], [300, 800]],

        // Fuel rectangle morphs as it compresses:
        // x,y widen-inward, width/height shrink
        fuelX:      [[0, 370], [10, 370], [50, 395], [100, 450], [300, 450]],
        fuelWidth:  [[0, 570], [10, 570], [50, 520], [100, 410], [300, 410]],
        fuelY:      [[0, 125], [10, 125], [50, 140], [100, 150], [300, 150]],
        fuelHeight: [[0, 70],  [10, 70],  [50, 40],  [100, 20],  [300, 20]],
        // Fuel fill darkens→brightens (dense glowing plasma by ignition)
        fuelFill: [[0, 0x262626], [30, 0x262626], [100, 0xff7043], [200, 0xff7043]],

        // Secondary pusher colors — darkens then illuminates under X-ray bath
        pusherFill:       [[0, 0x1a1a1a], [30, 0x3a2f18], [100, 0x8a6a2b], [200, 0x8a6a2b]],
        pusherStrokeCol:  [[0, 0x8a6a2b], [30, 0xffb547], [300, 0xffb547]],
        pusherStrokeW:    [[0, 1], [30, 2.5], [300, 2.5]],

        // Ablation skin (dashed inner rim) visible during radiation implosion
        ablationOpacity: [[0, 0], [30, 0], [50, 0.7], [100, 0.7], [200, 0]],

        // Spark plug capsule fades as it ignites (replaced by hot-spot)
        sparkCapsuleOpacity: [[0, 1], [80, 1], [100, 0]],
        // Spark plug hot-spot fades in AT ignition, then fades into fireball
        sparkHotOpacity:     [[0, 0], [80, 0], [100, 1], [220, 1], [280, 0]]
      };

      // Motion arrow / callout windows: [start, peakStart, peakEnd, end]
      // At [peakStart, peakEnd] the element is fully visible.
      // It fades in over [start, peakStart], out over [peakEnd, end].
      const W = {
        xrayArrows:      [3, 8, 25, 45],
        ablationArrows:  [30, 50, 80, 120],
        compressArrows:  [40, 60, 90, 130],
        ignitionLines:   [80, 100, 150, 200],

        // Non-overlapping windows so only one callout is visible at a time.
        // peak1 is tuned to land exactly on the preset stop (0, 10, 50, 100, 300)
        // so each labeled stop button shows its callout at full opacity.
        calloutArmed:    [-1, 0,   3,   8  ],
        calloutXrays:    [ 6, 10,  32,  40 ],
        calloutAblation: [40, 50,  78,  88 ],
        calloutIgnition: [90, 100, 180, 215],
        calloutTooLate:  [215, 260, 300, 301]
      };

      // Caption phase boundaries — one caption is "active" per range.
      const CAPTION_RANGES = [
        { phase: 'intact',    from: 0,   to: 4   },
        { phase: 'xray',      from: 4,   to: 35  },
        { phase: 'implosion', from: 35,  to: 85  },
        { phase: 'ignition',  from: 85,  to: 220 },
        { phase: 'toolate',   from: 220, to: 301 }
      ];

      // Phase labels (the small chip beside the time display)
      function phaseLabelFor(t) {
        if (t < 3)   return 'Intact · armed';
        if (t < 35)  return 'X-rays flooding the case';
        if (t < 85)  return 'Radiation implosion';
        if (t < 220) return 'Fusion burning';
        return 'Fireball — too late for the blast wave';
      }

      // ==================== INTERP HELPERS ====================

      // Piecewise-linear interpolation for scalar stops.
      function interp(t, stops) {
        if (t <= stops[0][0]) return stops[0][1];
        if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
        for (let i = 0; i < stops.length - 1; i++) {
          const t0 = stops[i][0], v0 = stops[i][1];
          const t1 = stops[i + 1][0], v1 = stops[i + 1][1];
          if (t >= t0 && t <= t1) {
            const f = (t - t0) / (t1 - t0);
            return v0 + (v1 - v0) * f;
          }
        }
        return 0;
      }

      // Piecewise-linear for hex colors (interpolates R,G,B separately).
      // Stops contain integer colors (e.g. 0xffb547).
      function interpColor(t, stops) {
        if (t <= stops[0][0]) return toHex(stops[0][1]);
        if (t >= stops[stops.length - 1][0]) return toHex(stops[stops.length - 1][1]);
        for (let i = 0; i < stops.length - 1; i++) {
          const t0 = stops[i][0], c0 = stops[i][1];
          const t1 = stops[i + 1][0], c1 = stops[i + 1][1];
          if (t >= t0 && t <= t1) {
            const f = (t - t0) / (t1 - t0);
            const r = lerpByte((c0 >> 16) & 0xff, (c1 >> 16) & 0xff, f);
            const g = lerpByte((c0 >> 8) & 0xff, (c1 >> 8) & 0xff, f);
            const b = lerpByte(c0 & 0xff, c1 & 0xff, f);
            return '#' + pad(r) + pad(g) + pad(b);
          }
        }
        return '#000000';
      }
      function lerpByte(a, b, f) { return Math.round(a + (b - a) * f); }
      function pad(n) { return n.toString(16).padStart(2, '0'); }
      function toHex(c) { return '#' + c.toString(16).padStart(6, '0'); }

      // Window function: 0 outside [start, end],
      // ramps up over [start, peak1], holds 1 over [peak1, peak2],
      // ramps down over [peak2, end].
      function windowFn(t, start, peak1, peak2, end) {
        if (t <= start || t >= end) return 0;
        if (t < peak1) return (t - start) / (peak1 - start);
        if (t > peak2) return 1 - (t - peak2) / (end - peak2);
        return 1;
      }

      // Log-scale mapping for distance bars (1 mm -> 0%, 100,000 mm -> 100%)
      function logPct(d) {
        if (d <= 1) return 0;
        return Math.min(100, Math.log10(d) / 5 * 100);
      }

      // ==================== DOM GRAB ====================
      // Grab every node we'll touch once, up front, rather than
      // querying every frame — the slider's `input` event fires
      // frequently and querySelector isn't free.
      const el = {
        timeValue:     document.getElementById('timeValue'),
        phaseLabel:    document.getElementById('phaseLabel'),

        xrayWash:      document.getElementById('xrayWash'),
        heGroup:       document.getElementById('heGroup'),
        tamper:        document.getElementById('tamper'),
        pit:           document.getElementById('pit'),
        initiator:     document.getElementById('initiator'),
        primedRing:    document.getElementById('primedRing'),

        blastRing:     document.getElementById('blastRing'),

        secondaryPusher: document.getElementById('secondaryPusher'),
        ablationSkin:  document.getElementById('ablationSkin'),
        fuel:          document.getElementById('fuel'),
        sparkCapsule:  document.getElementById('sparkCapsule'),
        sparkHot:      document.getElementById('sparkHot'),

        xrayArrows:    document.getElementById('xrayArrows'),
        ablationArrows:document.getElementById('ablationArrows'),
        compressArrows:document.getElementById('compressArrows'),
        ignitionLines: document.getElementById('ignitionLines'),

        fireballFill:  document.getElementById('fireballFill'),
        fireballExtras:document.getElementById('fireballExtras'),

        calloutArmed:    document.getElementById('calloutArmed'),
        calloutXrays:    document.getElementById('calloutXrays'),
        calloutAblation: document.getElementById('calloutAblation'),
        calloutIgnition: document.getElementById('calloutIgnition'),
        calloutTooLate:  document.getElementById('calloutTooLate'),

        captions:      document.querySelectorAll('.caption'),

        xBar:          document.getElementById('xBar'),
        bwBar:         document.getElementById('bwBar'),
        xVal:          document.getElementById('xVal'),
        bwVal:         document.getElementById('bwVal'),

        slider:        document.getElementById('scrub'),
        playBtn:       document.getElementById('playBtn'),
        resetBtn:      document.getElementById('resetBtn'),
        stopBtns:      document.querySelectorAll('.scrub-stops button')
      };

      // ==================== RENDER ====================
      // Called on every slider move. Reads t, sets every attribute.
      function render(t) {
        // ---- time display + phase label ----
        el.timeValue.textContent = t;
        const label = phaseLabelFor(t);
        el.phaseLabel.textContent = label;
        if (t > 0) el.phaseLabel.classList.add('is-active');
        else el.phaseLabel.classList.remove('is-active');

        // ---- opacities ----
        el.xrayWash.setAttribute('opacity',      interp(t, K.xrayWashOpacity));
        el.fireballFill.setAttribute('opacity',  interp(t, K.fireballOpacity));
        el.fireballExtras.setAttribute('opacity',interp(t, K.fireballExtrasOpacity));
        el.initiator.setAttribute('opacity',     interp(t, K.armedOpacity) * 0.9);
        el.primedRing.setAttribute('opacity',    interp(t, K.armedOpacity) * 0.35);
        el.ablationSkin.setAttribute('opacity',  interp(t, K.ablationOpacity));
        el.sparkCapsule.setAttribute('opacity',  interp(t, K.sparkCapsuleOpacity));
        el.sparkHot.setAttribute('opacity',      interp(t, K.sparkHotOpacity));

        // ---- primary colors ----
        el.heGroup.setAttribute('color',    interpColor(t, K.heColor));
        el.pit.setAttribute('fill',         interpColor(t, K.pitColor));
        el.pit.setAttribute('stroke',       interpColor(t, K.pitStroke));
        el.tamper.setAttribute('fill',      interpColor(t, K.tamperFill));

        // ---- secondary ----
        el.secondaryPusher.setAttribute('fill',       interpColor(t, K.pusherFill));
        el.secondaryPusher.setAttribute('stroke',     interpColor(t, K.pusherStrokeCol));
        el.secondaryPusher.setAttribute('stroke-width', interp(t, K.pusherStrokeW));

        el.fuel.setAttribute('x',      interp(t, K.fuelX));
        el.fuel.setAttribute('y',      interp(t, K.fuelY));
        el.fuel.setAttribute('width',  interp(t, K.fuelWidth));
        el.fuel.setAttribute('height', interp(t, K.fuelHeight));
        el.fuel.setAttribute('fill',   interpColor(t, K.fuelFill));

        // ---- blast ring ----
        el.blastRing.setAttribute('r', interp(t, K.blastRadius));

        // ---- motion arrow groups (window-gated) ----
        el.xrayArrows.setAttribute('opacity',     windowFn(t, W.xrayArrows[0],     W.xrayArrows[1],     W.xrayArrows[2],     W.xrayArrows[3]));
        el.ablationArrows.setAttribute('opacity', windowFn(t, W.ablationArrows[0], W.ablationArrows[1], W.ablationArrows[2], W.ablationArrows[3]));
        el.compressArrows.setAttribute('opacity', windowFn(t, W.compressArrows[0], W.compressArrows[1], W.compressArrows[2], W.compressArrows[3]));
        el.ignitionLines.setAttribute('opacity',  windowFn(t, W.ignitionLines[0],  W.ignitionLines[1],  W.ignitionLines[2],  W.ignitionLines[3]));

        // ---- callouts (window-gated) ----
        el.calloutArmed.setAttribute('opacity',    windowFn(t, W.calloutArmed[0],    W.calloutArmed[1],    W.calloutArmed[2],    W.calloutArmed[3]));
        el.calloutXrays.setAttribute('opacity',    windowFn(t, W.calloutXrays[0],    W.calloutXrays[1],    W.calloutXrays[2],    W.calloutXrays[3]));
        el.calloutAblation.setAttribute('opacity', windowFn(t, W.calloutAblation[0], W.calloutAblation[1], W.calloutAblation[2], W.calloutAblation[3]));
        el.calloutIgnition.setAttribute('opacity', windowFn(t, W.calloutIgnition[0], W.calloutIgnition[1], W.calloutIgnition[2], W.calloutIgnition[3]));
        el.calloutTooLate.setAttribute('opacity',  windowFn(t, W.calloutTooLate[0],  W.calloutTooLate[1],  W.calloutTooLate[2],  W.calloutTooLate[3]));

        // ---- captions (fade transitions via .is-active class) ----
        let activePhase = 'intact';
        for (let i = 0; i < CAPTION_RANGES.length; i++) {
          const r = CAPTION_RANGES[i];
          if (t >= r.from && t < r.to) { activePhase = r.phase; break; }
        }
        el.captions.forEach(function (c) {
          if (c.dataset.phase === activePhase) c.classList.add('is-active');
          else c.classList.remove('is-active');
        });

        // ---- distance bars + numeric readouts ----
        // X-ray keyframes: 0 @ 0ns → 3000 @ 10ns → 15000 @ 50ns → 30000 @ 100ns → 90000 @ 300ns
        const xDist = interp(t, [[0, 0], [10, 3000], [50, 15000], [100, 30000], [300, 90000]]);
        const bwDist = interp(t, [[0, 0], [10, 1], [50, 5], [100, 10], [300, 30]]);
        el.xBar.style.width  = logPct(xDist)  + '%';
        el.bwBar.style.width = logPct(bwDist) + '%';
        el.xVal.textContent  = formatDist(xDist);
        el.bwVal.textContent = formatDist(bwDist);

        // ---- stop buttons (highlight the nearest preset) ----
        el.stopBtns.forEach(function (btn) {
          const bt = parseInt(btn.dataset.t, 10);
          if (bt === t) btn.classList.add('is-active');
          else btn.classList.remove('is-active');
        });
      }

      function formatDist(d) {
        const rounded = Math.round(d);
        if (rounded < 1) return '0 mm';
        return rounded.toLocaleString() + ' mm';
      }

      // ==================== WIRE UP ====================

      // Slider drag → render
      el.slider.addEventListener('input', function () {
        stopPlayback();                       // any user drag halts playback
        render(parseInt(this.value, 10));
      });

      // Preset stop buttons
      el.stopBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          stopPlayback();
          const t = parseInt(this.dataset.t, 10);
          el.slider.value = t;
          render(t);
        });
      });

      // Play/pause
      //
      // Pacing rationale:
      //   - Base step is slow enough to read — 1 ns per 40 ms tick
      //     gives ~12 s for a single uninterrupted sweep of 0→300 ns.
      //   - When the simulation crosses into a new caption phase
      //     (intact → xray → implosion → ignition → toolate), we HOLD
      //     the slider for ~1.5 s so the reader can take in the
      //     paragraph before it slides away. Without this hold, the
      //     "intact" phase (only 4 ns wide) would flash by in 0.16 s.
      //   - Dragging the slider by hand is unaffected — the pause
      //     mechanism only runs inside the playback interval.
      const TICK_MS        = 40;   // milliseconds per step
      const PAUSE_MS       = 1500; // reading pause at each phase boundary
      const PAUSE_TICKS    = Math.round(PAUSE_MS / TICK_MS);

      let playTimer   = null;
      let pauseTicks  = 0;     // remaining ticks to hold before resuming
      let lastPhase   = null;

      // Return which caption range t falls inside, for boundary detection.
      function getPhaseAt(t) {
        for (const r of CAPTION_RANGES) {
          if (t >= r.from && t < r.to) return r.phase;
        }
        return null;
      }

      function stopPlayback() {
        if (playTimer) {
          clearInterval(playTimer);
          playTimer = null;
          pauseTicks = 0;
          el.playBtn.textContent = '▶ Play sequence';
          el.playBtn.classList.remove('is-playing');
        }
      }

      el.playBtn.addEventListener('click', function () {
        if (playTimer) { stopPlayback(); return; }

        el.playBtn.textContent = '❚❚ Pause';
        el.playBtn.classList.add('is-playing');

        let t = parseInt(el.slider.value, 10);
        if (t >= 300) t = 0;
        lastPhase = getPhaseAt(t);

        playTimer = setInterval(function () {
          // If we're mid-pause (just crossed a phase boundary), burn
          // one tick and return — don't advance t.
          if (pauseTicks > 0) { pauseTicks--; return; }

          t += 1;
          if (t > 300) {
            t = 300;
            el.slider.value = t;
            render(t);
            stopPlayback();
            return;
          }
          el.slider.value = t;
          render(t);

          // Hit a new caption? Pause to let the reader catch up.
          const phase = getPhaseAt(t);
          if (phase !== lastPhase) {
            lastPhase = phase;
            pauseTicks = PAUSE_TICKS;
          }
        }, TICK_MS);
      });

      // Reset
      el.resetBtn.addEventListener('click', function () {
        stopPlayback();
        el.slider.value = 0;
        render(0);
      });

      // Initial paint
      render(0);


      // ==================================================================
      // FOOTNOTE TOOLTIPS  (for the explainer section below the scrubber)
      //
      // In the prose, footnotes look like:
      //   <sup class="fn"><a href="#fn-3">3</a></sup>
      // Down in the references list, the matching reference looks like:
      //   <li id="fn-3">Carey Sublette. <cite>Nuclear Weapons FAQ</cite>...</li>
      //
      // We want the tooltip to show the clean text of that <li> so hovering
      // the footnote number shows the source without leaving the paragraph.
      //
      // textContent (not innerHTML) is used deliberately — it strips tags
      // and keeps the tooltip text-only.
      //
      // This runs after the scrubber is wired up; it's a separate concern
      // and nothing above depends on it. No harm if the explainer section
      // doesn't exist (querySelectorAll returns an empty NodeList).
      // ==================================================================
      const footnoteLinks = document.querySelectorAll('sup.fn a[href^="#fn-"]');
      footnoteLinks.forEach(function (link) {
        const targetId = link.getAttribute('href').slice(1); // strip the '#'
        const target = document.getElementById(targetId);
        if (!target) return;

        // Collapse whitespace runs so the tooltip doesn't contain
        // awkward line breaks copied from the HTML source.
        const sourceText = target.textContent.replace(/\s+/g, ' ').trim();
        link.setAttribute('title', sourceText);
        link.setAttribute(
          'aria-label',
          'Footnote ' + link.textContent.trim() + ': ' + sourceText
        );
      });

    })();
