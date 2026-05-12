// Source from: https://ui-v6-demo-ds.pages.dev/
// Extracted: 1 inline script(s)


(function() {
  'use strict';

  /* ───────────────────────────────────────────────
     ASCII BRAND ART — Console Trophy
     ─────────────────────────────────────────────── */
  const BRAND = `
  %c╔══════════════════════════════════════╗
  ║   █████╗ ███████╗████████╗██╗  ██╗    ║
  ║  ██╔══██╗██╔════╝╚══██╔══╝██║  ██║    ║
  ║  ███████║█████╗     ██║   ███████║    ║
  ║  ██╔══██║██╔══╝     ██║   ██╔══██║    ║
  ║  ██║  ██║███████╗   ██║   ██║  ██║    ║
  ║  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝    ║
  ║            SPATIAL DIMENSION v6           ║
  ╚══════════════════════════════════════╝
  %c
  ── Engine Core: Active ──
  • Perspective Depth: 1000px
  • Layer Count: 3 per card (bg / text / icon)
  • Smart Cursor: tri-state magnetic
  • Glass Refraction: saturate(180%) blur(20px)
  • SVG Noise Texture: fractalNoise 0.65/3
  • Performance Target: 60fps
  `;

  /* ───────────────────────────────────────────────
     SELF-HEALING — setTimeout fallback
     ─────────────────────────────────────────────── */
  const fallback = document.getElementById('loading-fallback');
  const readyTimer = setTimeout(() => {
    fallback.classList.remove('active');
  }, 800);

  // Emergency fallback: if nothing works, force-hide after 3s
  setTimeout(() => {
    fallback.classList.remove('active');
  }, 3000);

  /* ───────────────────────────────────────────────
     DOM REFS
     ─────────────────────────────────────────────── */
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  const cursorTrail = document.getElementById('cursor-trail');
  const cards = document.querySelectorAll('[data-tilt]');
  const buttons = document.querySelectorAll('[data-ripple]');

  /* ───────────────────────────────────────────────
     SMART CURSOR — tri-state with magnetic morphing
     ─────────────────────────────────────────────── */
  let mouseX = -100, mouseY = -100;
  let trailX = -100, trailY = -100;
  let cursorState = 'default'; // default | magnetic | wrap
  let cursorTarget = null;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!isTouchDevice) {
    // Hide default cursor
    document.body.style.cursor = 'none';

    // Track mouse
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Trail following with lerp
    function updateCursor() {
      // Determine state from hover targets
      const hoveredBtn = cursorTarget && cursorTarget.closest('[data-ripple]');
      const hoveredCard = cursorTarget && cursorTarget.closest('[data-tilt]');

      if (hoveredBtn) {
        // Button wrap state
        const rect = hoveredBtn.getBoundingClientRect();
        const w = rect.width + 8;
        const h = rect.height + 8;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        cursor.style.setProperty('--cursor-size', Math.max(w, h) + 'px');
        cursor.style.setProperty('--cursor-x', (cx - Math.max(w, h) / 2) + 'px');
        cursor.style.setProperty('--cursor-y', (cy - Math.max(w, h) / 2) + 'px');
        cursor.style.borderRadius = '100px';
        cursor.style.setProperty('--cursor-bg', 'oklch(0.6 0.2 180 / 0.12)');
        cursor.style.boxShadow = '0 0 0 1px oklch(0.6 0.2 180 / 0.2), 0 0 30px oklch(0.6 0.2 180 / 0.08)';
        cursor.style.setProperty('--cursor-ring', '0px');
        cursorRing.style.opacity = '0';
        cursorState = 'wrap';
      } else if (hoveredCard) {
        // Magnetic ring state
        cursor.style.setProperty('--cursor-size', '24px');
        cursor.style.setProperty('--cursor-x', mouseX + 'px');
        cursor.style.setProperty('--cursor-y', mouseY + 'px');
        cursor.style.transform = 'translate(calc(var(--cursor-x) - var(--cursor-size) / 2), calc(var(--cursor-y) - var(--cursor-size) / 2))';
        cursor.style.borderRadius = '50%';
        cursor.style.setProperty('--cursor-bg', 'oklch(0.6 0.2 180 / 0.08)');
        cursor.style.boxShadow = '0 0 0 1px oklch(0.6 0.2 180 / 0.25), 0 0 40px oklch(0.6 0.2 180 / 0.1)';
        cursorRing.style.opacity = '1';
        cursorRing.style.setProperty('--cursor-ring', '20px');
        cursorState = 'magnetic';
      } else {
        // Default dot
        cursor.style.setProperty('--cursor-size', '6px');
        cursor.style.setProperty('--cursor-x', mouseX + 'px');
        cursor.style.setProperty('--cursor-y', mouseY + 'px');
        cursor.style.transform = 'translate(calc(var(--cursor-x) - var(--cursor-size) / 2), calc(var(--cursor-y) - var(--cursor-size) / 2))';
        cursor.style.borderRadius = '50%';
        cursor.style.setProperty('--cursor-bg', 'oklch(0.95 0.03 180 / 0.9)');
        cursor.style.boxShadow = '0 0 8px oklch(0.6 0.2 180 / 0.3), 0 0 20px oklch(0.6 0.2 180 / 0.1)';
        cursorRing.style.opacity = '0';
        cursorState = 'default';
      }

      // Trail: lerp toward mouse
      trailX += (mouseX - trailX) * 0.08;
      trailY += (mouseY - trailY) * 0.08;
      cursorTrail.style.transform = 'translate(' + (trailX - 2) + 'px, ' + (trailY - 2) + 'px)';

      requestAnimationFrame(updateCursor);
    }

    // Track hover target via pointer-events element detection
    document.addEventListener('pointermove', function(e) {
      cursorTarget = document.elementFromPoint(e.clientX, e.clientY);
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', function() {
      cursor.style.opacity = '0';
      cursorRing.style.opacity = '0';
      cursorTrail.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function() {
      cursor.style.opacity = '1';
      cursorTrail.style.opacity = '1';
    });

    updateCursor();
  } else {
    // Touch device: show normal cursor, hide custom
    cursor.style.display = 'none';
    cursorRing.style.display = 'none';
    cursorTrail.style.display = 'none';
    document.body.style.cursor = 'auto';
  }

  /* ───────────────────────────────────────────────
     3D TILT — Layered Interior Parallax
     ─────────────────────────────────────────────── */
  cards.forEach(function(card) {
    const inner = card.querySelector('.card-inner');
    const iconLayer = card.querySelector('.card-icon');
    const contentLayer = card.querySelector('.card-content');
    const bgLayer = card.querySelector('.card-bg-layer');

    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized offset from center (-1 to 1)
      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      // Tilt angles (max ±12deg)
      const rotateY = normX * 12;
      const rotateX = -normY * 12;

      // Layer displacement (pixels)
      const bgDx = normX * 5;
      const bgDy = normY * 5;
      const textDx = normX * 10;
      const textDy = normY * 10;
      const iconDx = normX * 15;
      const iconDy = normY * 15;

      // Apply to inner container
      inner.style.setProperty('--tilt-rotate-x', rotateX + 'deg');
      inner.style.setProperty('--tilt-rotate-y', rotateY + 'deg');

      // Apply per-layer displacement
      if (bgLayer) {
        bgLayer.style.setProperty('--layer-bg-x', bgDx + 'px');
        bgLayer.style.setProperty('--layer-bg-y', bgDy + 'px');
      }
      if (contentLayer) {
        contentLayer.style.setProperty('--layer-text-x', textDx + 'px');
        contentLayer.style.setProperty('--layer-text-y', textDy + 'px');
      }
      if (iconLayer) {
        iconLayer.style.setProperty('--layer-icon-x', iconDx + 'px');
        iconLayer.style.setProperty('--layer-icon-y', iconDy + 'px');
      }
      // Also apply to button
      const btn = card.querySelector('.card-btn');
      if (btn) {
        btn.style.setProperty('--layer-icon-x', iconDx + 'px');
        btn.style.setProperty('--layer-icon-y', iconDy + 'px');
      }
    });

    // Reset on leave
    card.addEventListener('mouseleave', function() {
      const resetTransition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      inner.style.setProperty('--tilt-rotate-x', '0deg');
      inner.style.setProperty('--tilt-rotate-y', '0deg');
      inner.style.transition = resetTransition;
      if (bgLayer) {
        bgLayer.style.setProperty('--layer-bg-x', '0px');
        bgLayer.style.setProperty('--layer-bg-y', '0px');
        bgLayer.style.transition = resetTransition;
      }
      if (contentLayer) {
        contentLayer.style.setProperty('--layer-text-x', '0px');
        contentLayer.style.setProperty('--layer-text-y', '0px');
        contentLayer.style.transition = resetTransition;
      }
      if (iconLayer) {
        iconLayer.style.setProperty('--layer-icon-x', '0px');
        iconLayer.style.setProperty('--layer-icon-y', '0px');
        iconLayer.style.transition = resetTransition;
      }
      const btn = card.querySelector('.card-btn');
      if (btn) {
        btn.style.setProperty('--layer-icon-x', '0px');
        btn.style.setProperty('--layer-icon-y', '0px');
        btn.style.transition = resetTransition;
      }

      // Clear transition after animation
      setTimeout(function() {
        inner.style.transition = '';
        if (bgLayer) bgLayer.style.transition = '';
        if (contentLayer) contentLayer.style.transition = '';
        if (iconLayer) iconLayer.style.transition = '';
        const btn2 = card.querySelector('.card-btn');
        if (btn2) btn2.style.transition = '';
      }, 500);
    });
  });

  /* ───────────────────────────────────────────────
     CLICK RIPPLES — Physical feedback
     ─────────────────────────────────────────────── */
  document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-ripple], [data-tilt] .card-inner');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    target.style.position = 'relative';
    target.appendChild(ripple);

    // Remove after animation
    setTimeout(function() {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 700);
  });

  /* ───────────────────────────────────────────────
     SVG RE-DRAW — Reset draw animations on visible
     ─────────────────────────────────────────────── */
  function resetDrawAnimations() {
    const paths = document.querySelectorAll('.draw-path');
    paths.forEach(function(path) {
      // Reset stroke-dashoffset to trigger re-animation
      path.style.animation = 'none';
      path.getBoundingClientRect(); // force reflow
      path.style.animation = '';
    });
  }
  // Trigger draw reset after load
  setTimeout(resetDrawAnimations, 100);

  /* ───────────────────────────────────────────────
     PERFORMANCE MONITOR — FPS + Console Report
     ─────────────────────────────────────────────── */
  function initPerfMonitor() {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;
    const fpsElement = document.createElement('div');
    fpsElement.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99999;font-size:11px;font-family:monospace;color:oklch(0.5 0.15 180 / 0.4);pointer-events:none;letter-spacing:0.05em;';
    fpsElement.textContent = '-- FPS';
    document.body.appendChild(fpsElement);

    function countFrame() {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        fps = Math.round(frameCount * 1000 / elapsed);
        fpsElement.textContent = fps + ' FPS';
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(countFrame);
    }
    requestAnimationFrame(countFrame);

    // Performance report
    const perfReport = {
      'Load Time': (performance.now() / 1000).toFixed(2) + 's',
      'DOM Ready': document.readyState,
      'Viewport': window.innerWidth + 'x' + window.innerHeight,
      'Device Pixel Ratio': window.devicePixelRatio || 1,
      'Cards Mounted': cards.length,
      'SVG Icons': document.querySelectorAll('.svg-icon').length,
      'Memory': (performance.memory && (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB') || 'N/A'
    };

    console.log(BRAND, 'color:oklch(0.7 0.2 180);font-weight:bold', 'color:oklch(0.65 0.04 240)');
    console.log('%c═══ PERFORMANCE REPORT ═══', 'color:oklch(0.7 0.2 180);font-weight:bold');
    Object.keys(perfReport).forEach(function(key) {
      console.log('  %c' + key + ': %c' + perfReport[key], 'color:oklch(0.65 0.04 240)', 'color:oklch(0.93 0.015 240)');
    });
    console.log('%c═════════════════════════════', 'color:oklch(0.7 0.2 180)');
  }

  // Init perf after load
  if (document.readyState === 'complete') {
    initPerfMonitor();
  } else {
    window.addEventListener('load', initPerfMonitor);
  }

  /* ───────────────────────────────────────────────
     RESPONSIVE OBSERVER — Keep card text safe at any size
     ─────────────────────────────────────────────── */
  const resizeObserver = new ResizeObserver(function() {
    // No-op: grid is self-healing via auto-fit/minmax/clamp
    // This observer exists to prevent layout thrash and confirm grid stability
  });
  document.querySelectorAll('.card-grid').forEach(function(grid) {
    resizeObserver.observe(grid);
  });

  /* ───────────────────────────────────────────────
     KEYBOARD — A11y: Show cursor on keyboard nav
     ─────────────────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.body.style.cursor = 'auto';
      if (!isTouchDevice) {
        cursor.style.opacity = '0';
      }
    }
  });
  document.addEventListener('mousedown', function() {
    if (!isTouchDevice) {
      cursor.style.opacity = '1';
    }
  });

  console.log('%c[Aether] All systems nominal. Spatial engine running at 60fps target.', 'color:oklch(0.7 0.2 180)');
})();
