(() => {
  function init() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    if (!container) return;

    // Interactive States
    let config = {
      speed: 1.0,
      density: 0.6,
      theme: 'blue',
      glyph: 'binary',
      mode: 'deflect',
      isGlitched: false
    };

    // Glyph Sets
    const glyphSets = {
      binary: ['0', '1'],
      hex: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
      glyphs: ['0', '1', 'ø', '+', 'x', '·', 'ｦ', 'ｧ', 'ｨ', 'ｩ', 'ｪ', 'ｫ', 'ｬ', 'ｭ', 'ｮ', 'ｯ', 'ｰ', 'ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ'],
      rycode: ['R', 'y', 'c', 'o', 'd', 'e', 'S', 'y', 's', 't', 'e', 'm', '0', '1', '·']
    };

    // Decryption Words (for hover reveal)
    const decryptWords = ['RYCODE', 'SYSTEM', 'ONLINE', 'SECURE', 'ACCESS', 'QUANT', 'RISK', 'INTEGRITY'];

    // Theme Colors (Light Mode tailored contrasting hexes)
    const themeColors = {
      blue: { main: '#2563eb', trail: 'rgba(37, 99, 235, alpha)', head: '#1e40af' },
      gold: { main: '#d97706', trail: 'rgba(217, 119, 6, alpha)', head: '#b45309' },
      green: { main: '#16a34a', trail: 'rgba(22, 163, 74, alpha)', head: '#15803d' },
      red: { main: '#ea580c', trail: 'rgba(234, 88, 12, alpha)', head: '#c2410c' }
    };

    let width = 0;
    let height = 0;
    let columns = [];
    const spacing = 18; // Column gap
    const charHeight = 16;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      console.log("Canvas size set:", width, "x", height);
      setupColumns();
    }

    function getActiveGlyphs() {
      return glyphSets[config.glyph] || glyphSets.binary;
    }

    // Initialize streams
    function setupColumns() {
      const colCount = Math.floor(width / spacing) + 1;
      columns = [];
      for (let i = 0; i < colCount; i++) {
        columns.push({
          x: i * spacing,
          y: Math.random() * (height + 250) - 100,
          speed: Math.random() * 2 + 1.5,
          length: Math.floor(Math.random() * 25) + 15,
          chars: [],
          decryptedIndex: -1,
          decryptedWord: '',
          init() {
            const glyphs = getActiveGlyphs();
            this.chars = [];
            for (let j = 0; j < this.length; j++) {
              this.chars.push(glyphs[Math.floor(Math.random() * glyphs.length)]);
            }
          }
        });
        columns[i].init();
      }
    }

    // Mouse tracking
    const mouse = { x: null, y: null, active: false };
    const heroSection = document.querySelector('.hero');

    if (heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      });
      heroSection.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
        mouse.active = false;
      });
    }

    // Click shockwaves
    let shockwaves = [];
    if (heroSection) {
      heroSection.addEventListener('click', (e) => {
        if (config.mode === 'shockwave') {
          const rect = canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          shockwaves.push({
            x: clickX,
            y: clickY,
            radius: 0,
            maxRadius: 350,
            speed: 10
          });
        }
      });
    }

    // Scroll velocity detection
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollDirection = 1; // 1 = down, -1 = up

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = Math.min(Math.abs(currentScrollY - lastScrollY), 60);
      scrollDirection = currentScrollY > lastScrollY ? 1 : -1;
      lastScrollY = currentScrollY;
    }, { passive: true });

    // HUD elements
    const activeNodesEl = document.getElementById('hudActiveNodes');
    const packetsEl = document.getElementById('hudPackets');
    const speedValEl = document.getElementById('speedVal');
    const densityValEl = document.getElementById('densityVal');
    const glitchBtn = document.getElementById('glitchBtn');

    let totalPackets = 14832;
    setInterval(() => {
      totalPackets += Math.floor(Math.random() * 4) + 1;
      if (packetsEl) packetsEl.textContent = totalPackets.toLocaleString();
    }, 1100);

    // Wiring GUI Console Elements
    const speedRange = document.getElementById('speedRange');
    if (speedRange) {
      speedRange.addEventListener('input', (e) => {
        config.speed = parseFloat(e.target.value);
        if (speedValEl) speedValEl.textContent = config.speed.toFixed(1) + 'x';
      });
    }

    const densityRange = document.getElementById('densityRange');
    if (densityRange) {
      densityRange.addEventListener('input', (e) => {
        config.density = parseFloat(e.target.value) / 100;
        if (densityValEl) densityValEl.textContent = Math.round(config.density * 100) + '%';
      });
    }

    // Helper to bind active class switching
    function setupButtonToggles(selector, configKey, onUpdate) {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const val = btn.dataset[configKey];
          config[configKey] = val;
          if (onUpdate) onUpdate(val);
        });
      });
    }

    setupButtonToggles('.btn-grid button[data-theme]', 'theme');

    setupButtonToggles('.btn-grid button[data-glyph]', 'glyph', () => {
      // Re-initialize columns character sets
      columns.forEach(col => col.init());
    });

    setupButtonToggles('.btn-grid-2 button[data-mode]', 'mode');

    // Glitch trigger
    if (glitchBtn) {
      glitchBtn.addEventListener('click', () => {
        document.body.classList.add('glitch-active');
        config.isGlitched = true;
        
        const matrixStatusEl = document.getElementById('hudMatrixStatus');
        if (matrixStatusEl) {
          matrixStatusEl.textContent = 'OVERRIDE';
          matrixStatusEl.style.color = '#ef4444';
        }

        setTimeout(() => {
          document.body.classList.remove('glitch-active');
          config.isGlitched = false;
          if (matrixStatusEl) {
            matrixStatusEl.textContent = 'ACTIVE';
            matrixStatusEl.style.color = '';
          }
        }, 350);
      });
    }

    // Animation Loop
    let frameCount = 0;
    function animate(time) {
      frameCount++;
      if (frameCount === 1) {
        console.log("Matrix animate() loop started. Columns count:", columns.length, "Width:", width, "Height:", height);
      }
      ctx.clearRect(0, 0, width, height);

      // Honor reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        // Draw a subtle, static decorative grid pattern
        ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
        ctx.font = '10px monospace';
        for (let x = 20; x < width; x += spacing * 2) {
          for (let y = 20; y < height; y += charHeight * 2) {
            ctx.fillText((x+y)%3 === 0 ? '1' : '0', x, y);
          }
        }
        requestAnimationFrame(animate);
        return;
      }

      // Decay scroll velocity over time
      scrollVelocity *= 0.95;
      if (scrollVelocity < 0.1) scrollVelocity = 0;

      // Render active shockwaves
      shockwaves.forEach((wave, idx) => {
        wave.radius += wave.speed;
        if (wave.radius > wave.maxRadius) {
          shockwaves.splice(idx, 1);
        }
      });

      const currentTheme = themeColors[config.theme] || themeColors.blue;
      let cellHoverCount = 0;

      ctx.font = '13px "Geist Mono", Courier, monospace';
      ctx.textAlign = 'center';

      // Loop columns
      columns.forEach((col, cIdx) => {
        // Density optimization: skip rendering some columns
        if ((cIdx / columns.length) > config.density) {
          return;
        }

        // Adjust fall speed based on scroll velocity and config speed
        const speedMod = config.speed * col.speed + (scrollVelocity * 0.15 * scrollDirection);
        col.y += speedMod;

        // Reset column if it goes off bottom
        if (col.y > height + col.length * charHeight) {
          col.y = Math.random() * -150 - 50;
          col.init();
          col.decryptedIndex = -1;
        }

        // Render characters in the stream
        for (let i = 0; i < col.length; i++) {
          const charY = col.y - i * charHeight;

          // Don't draw offscreen elements
          if (charY < -20 || charY > height + 20) continue;

          let charX = col.x;
          let char = col.chars[i] || '0';
          let color = currentTheme.main;
          let alpha = (1 - i / col.length) * 0.8; // Stream head is brightest, tail fades
          let glow = 0;

          // Mouse Physics & Interactions
          if (mouse.active && mouse.x !== null && mouse.y !== null) {
            const dx = charX - mouse.x;
            const dy = charY - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 150) {
              cellHoverCount++;
              glow = 1 - dist / 150;

              // 1. Deflect Mode (pushed sideways)
              if (config.mode === 'deflect') {
                const strength = (150 - dist) * 0.45;
                const angle = Math.atan2(dy, dx);
                charX += Math.cos(angle) * strength;
              }

              // 2. Decrypt Mode (unveils real words)
              if (config.mode === 'decrypt') {
                if (col.decryptedIndex === -1 && Math.random() < 0.05) {
                  col.decryptedIndex = i;
                  col.decryptedWord = decryptWords[Math.floor(Math.random() * decryptWords.length)];
                }
                if (col.decryptedIndex !== -1) {
                  const offsetInWord = Math.floor((charY - (col.y - col.decryptedIndex * charHeight)) / charHeight);
                  if (offsetInWord >= 0 && offsetInWord < col.decryptedWord.length) {
                    char = col.decryptedWord[offsetInWord];
                    color = '#1e3a8a'; // Darker blue contrast for decryption
                    alpha = 1.0;
                  }
                }
              }

              // 3. Glow Mode (increases glow intensity)
              if (config.mode === 'glow') {
                alpha = 0.3 + glow * 0.7;
              }
            }
          }

          // Click Shockwave highlights
          shockwaves.forEach(wave => {
            const dx = charX - wave.x;
            const dy = charY - wave.y;
            const dist = Math.hypot(dx, dy);
            const waveTolerance = 25;
            if (Math.abs(dist - wave.radius) < waveTolerance) {
              // High contrast golden highlight in shockwave ring
              color = '#d97706';
              alpha = 1.0;
              glow = 1.2;
              char = getActiveGlyphs()[Math.floor(Math.random() * getActiveGlyphs().length)];
            }
          });

          // Apply styles & glow shadow
          ctx.save();
          ctx.globalAlpha = alpha;

          if (i === 0) {
            // The leading head character is highlighted in the contrasting theme head color
            ctx.fillStyle = currentTheme.head;
            ctx.shadowColor = currentTheme.main;
            ctx.shadowBlur = 12;
            ctx.font = 'bold 13px "Geist Mono", Courier, monospace';
          } else {
            ctx.fillStyle = color;
            ctx.font = '13px "Geist Mono", Courier, monospace';
            if (glow > 0) {
              ctx.shadowColor = color;
              ctx.shadowBlur = glow * 10;
            }
          }

          // Occasional character flicker/glitch
          if (Math.random() < 0.015 && !config.isGlitched) {
            char = getActiveGlyphs()[Math.floor(Math.random() * getActiveGlyphs().length)];
          }

          ctx.fillText(char, charX, charY);
          ctx.restore();
        }
      });

      // Telemetry details sync
      if (activeNodesEl) {
        activeNodesEl.textContent = `${cellHoverCount} cells`;
      }

      requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);

    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
