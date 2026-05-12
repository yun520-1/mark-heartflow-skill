// Source from: https://ui-v7-demo-ds.pages.dev/
// Extracted: 1 inline script(s)


/*
 * ═══════════════════════════════════════════════════════════════
 * PRIMA VITA — Digital Life Core Engine
 * ═══════════════════════════════════════════════════════════════
 * Architecture:
 *   BreathingEngine  — Master clock driving all biological motion
 *   ColorEcho        — Scroll & time-driven hue rotation
 *   CursorPhysics    — Mass-based pointer with collision detection
 *   ParticleSystem   — Gravity-accumulating particles on canvas
 *   FractalRenderer  — Recursive L-system SVG icon generator
 *   FrostSwipe       — Blur reduction on rapid mouse pass
 *   GPUMonitor       — WebGL detection & adaptive fallback
 *   ConsoleLogger    — Animated boot sequence
 *
 * All animation loops are synchronized to a single rAF for 60fps.
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  /* ──────────────────────────────────────────────
     SELF-HEALING PROTOCOL — Layer 2: timeout guard
     ────────────────────────────────────────────── */
  let bootComplete = false;
  const bootGuard = setTimeout(() => {
    if (!bootComplete) {
      console.warn('[Prima Vita] Boot guard activated — forcing content visible');
      document.body.style.opacity = '1';
    }
  }, 5000);

  /* ──────────────────────────────────────────────
     GPU DETECTION MODULE
     ────────────────────────────────────────────── */
  const gpu = {
    supported: false,
    tier: 'unknown',
    gl: null,
    check: function() {
      try {
        const canvas = document.createElement('canvas');
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (this.gl) {
          this.supported = true;
          const debugInfo = this.gl.getExtension('WEBGL_debug_renderer_info');
          const renderer = debugInfo
            ? this.gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : 'unknown';
          const lowEnd = /(intel hd|hd graphics|mali|adreno 5|powervr)/i.test(renderer);
          this.tier = lowEnd ? 'low' : 'high';
          console.log(`[Prima Vita] GPU: ${renderer} (tier: ${this.tier})`);
          return true;
        }
      } catch(e) {
        this.supported = false;
      }
      this.tier = 'none';
      console.log('[Prima Vita] GPU: WebGL unavailable, using 2D fallback');
      return false;
    }
  };

  /* ──────────────────────────────────────────────
     BREATHING ENGINE — Master Biological Clock
     Inhale (0→1):  fast rise  (t^0.6)
     Hold  (1→1):  plateau
     Exhale (1→0): slow fall  (t^0.55 inverse)
     ────────────────────────────────────────────── */
  class BreathingEngine {
    constructor() {
      this.inhaleDuration = 1200;
      this.holdDuration  = 300;
      this.exhaleDuration = 1800;
      this.cycleDuration = this.inhaleDuration + this.holdDuration + this.exhaleDuration;
      this.phase = 0;
      this.value = 0.5;
      this.startTime = performance.now();
      this.rate = 60000 / this.cycleDuration;
    }

    update(now) {
      const elapsed = (now - this.startTime) % this.cycleDuration;

      if (elapsed < this.inhaleDuration) {
        const t = elapsed / this.inhaleDuration;
        this.value = 1 - Math.pow(1 - t, 0.6);
        this.phase = t * 0.36;
      } else if (elapsed < this.inhaleDuration + this.holdDuration) {
        this.value = 1;
        this.phase = 0.36 + ((elapsed - this.inhaleDuration) / this.holdDuration) * 0.09;
      } else {
        const t = (elapsed - this.inhaleDuration - this.holdDuration) / this.exhaleDuration;
        this.value = 1 - Math.pow(t, 0.55);
        this.phase = 0.45 + t * 0.55;
      }

      return this.value;
    }

    getBPM() {
      return this.rate;
    }
  }

  /* ──────────────────────────────────────────────
     COLOR ECHO — Ambient Hue Rotation
     ────────────────────────────────────────────── */
  class ColorEcho {
    constructor() {
      this.scrollHue = 0;
      this.timeHue = 0;
      this.totalOffset = 0;
      this.targetOffset = 0;
      this.prevScrollY = 0;
      this.scrollVelocity = 0;
    }

    update(now) {
      this.timeHue = (now / 1000) * 0.15 % 360;

      const scrollMax = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const scrollRatio = Math.min(window.scrollY / scrollMax, 1);
      this.scrollHue = scrollRatio * 25;

      this.scrollVelocity = Math.abs(window.scrollY - this.prevScrollY);
      this.prevScrollY = window.scrollY;

      this.targetOffset = (this.timeHue + this.scrollHue + Math.min(this.scrollVelocity * 0.05, 8)) % 360;

      this.totalOffset += (this.targetOffset - this.totalOffset) * 0.03;
      if (Math.abs(this.totalOffset - this.targetOffset) < 0.01) {
        this.totalOffset = this.targetOffset;
      }

      document.documentElement.style.setProperty('--hue-offset', this.totalOffset.toFixed(2));
      return this.totalOffset;
    }
  }

  /* ──────────────────────────────────────────────
     CURSOR PHYSICS — Mass-based pointer with collision
     ────────────────────────────────────────────── */
  class CursorPhysics {
    constructor() {
      this.dot = document.getElementById('cursor-dot');
      this.ring = document.getElementById('cursor-ring');
      this.container = document.getElementById('cursor-container');

      this.x = window.innerWidth / 2;
      this.y = window.innerHeight / 2;
      this.vx = 0;
      this.vy = 0;
      this.ringX = this.x;
      this.ringY = this.y;

      this.dotMass = 0.15;
      this.ringMass = 0.08;
      this.damping = 0.85;
      this.stiffness = 0.12;

      this.tx = this.x;
      this.ty = this.y;

      this.collidingElements = new Map();

      this.init();
    }

    init() {
      document.addEventListener('mousemove', (e) => {
        this.tx = e.clientX;
        this.ty = e.clientY;
      });

      document.addEventListener('touchstart', () => {
        this.container.style.display = 'none';
        document.body.style.cursor = 'auto';
      }, { once: true });

      document.querySelectorAll('a, button, .glass-card, .fractal-icon').forEach(el => {
        el.addEventListener('mouseenter', () => this.ring.classList.add('-active'));
        el.addEventListener('mouseleave', () => this.ring.classList.remove('-active'));
      });
    }

    update(now) {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const ax = dx * this.stiffness - this.vx * (1 - this.damping);
      const ay = dy * this.stiffness - this.vy * (1 - this.damping);
      this.vx += ax * this.dotMass;
      this.vy += ay * this.dotMass;
      this.vx *= this.damping;
      this.vy *= this.damping;
      this.x += this.vx;
      this.y += this.vy;

      const rdx = this.x - this.ringX;
      const rdy = this.y - this.ringY;
      this.ringX += rdx * 0.08;
      this.ringY += rdy * 0.08;

      this.dot.style.transform = `translate(${this.x}px, ${this.y}px) translate(-50%, -50%)`;
      this.ring.style.transform = `translate(${this.ringX}px, ${this.ringY}px) translate(-50%, -50%)`;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.detectCollisions(this.x, this.y, speed);
    }

    detectCollisions(cx, cy, speed) {
      const elements = document.querySelectorAll('.glass-card, button, a, .fractal-icon');

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const margin = 16;
        const expanded = {
          left: rect.left - margin, right: rect.right + margin,
          top: rect.top - margin, bottom: rect.bottom + margin
        };

        const inside = cx >= expanded.left && cx <= expanded.right &&
                       cy >= expanded.top && cy <= expanded.bottom;

        const prev = this.collidingElements.get(el);

        if (inside && speed > 0.5) {
          const force = Math.min(speed * 0.15, 1);
          const impactX = (cx - (rect.left + rect.width / 2)) / (rect.width / 2);
          const impactY = (cy - (rect.top + rect.height / 2)) / (rect.height / 2);
          const intensity = force * 2;

          const scaleX = 1 - intensity * 0.04 * Math.abs(impactY || 1);
          const scaleY = 1 - intensity * 0.04 * Math.abs(impactX || 1);
          const skewX = impactX * intensity * 1.5;
          const skewY = impactY * intensity * 1.5;

          el.style.transform = `scale(${scaleX}, ${scaleY}) skew(${skewX}deg, ${skewY}deg)`;
          el.style.transition = 'none';

          if (!prev || prev.timeout) {
            clearTimeout(prev?.timeout);
          }
          const timeout = setTimeout(() => {
            el.style.transform = '';
            el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            this.collidingElements.delete(el);
          }, 100);
          this.collidingElements.set(el, { timeout, force });
        } else if (!inside && prev) {
          clearTimeout(prev.timeout);
          el.style.transform = '';
          el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
          this.collidingElements.delete(el);
        }
      });
    }
  }

  /* ──────────────────────────────────────────────
     PARTICLE SYSTEM — Gravity accumulation
     ────────────────────────────────────────────── */
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.maxParticles = 80;
      this.mouseX = window.innerWidth / 2;
      this.mouseY = window.innerHeight / 2;
      this.gravityX = 0;
      this.gravityY = 0.02;

      this.resize();
      this.init();

      window.addEventListener('resize', () => this.resize());

      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });

      if (gpu.tier === 'low') this.maxParticles = 30;
      else if (gpu.tier === 'none') this.maxParticles = 15;
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    init() {
      for (let i = 0; i < this.maxParticles; i++) {
        this.particles.push(this.createParticle());
      }
    }

    createParticle() {
      return {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1,
        life: Math.random() * 400 + 200,
        maxLife: Math.random() * 400 + 200,
        hue: (Math.random() * 60 + 260) % 360,
        sat: 0.15 + Math.random() * 0.2,
        lum: 0.4 + Math.random() * 0.3,
        alpha: 0.3 + Math.random() * 0.4
      };
    }

    update(breathValue, hueOffset) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const dx = this.mouseX - this.canvas.width / 2;
      const dy = this.mouseY - this.canvas.height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(this.canvas.width, this.canvas.height) * 0.5;

      if (dist > 0) {
        const force = Math.min(dist / maxDist, 1) * 0.008;
        this.gravityX += (dx / dist * force - this.gravityX) * 0.02;
        this.gravityY += (dy / dist * force + 0.02 - this.gravityY) * 0.02;
      }

      const activity = 0.5 + breathValue * 0.5;
      let aliveCount = 0;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.life--;

        if (p.life <= 0) {
          this.particles[i] = this.createParticle();
          continue;
        }

        p.vx += this.gravityX * activity;
        p.vy += this.gravityY * activity;
        p.vx += (Math.random() - 0.5) * 0.04 * activity;
        p.vy += (Math.random() - 0.5) * 0.04 * activity;
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        const lifeRatio = p.life / p.maxLife;
        const alpha = p.alpha * lifeRatio * (0.3 + 0.7 * breathValue);
        const hue = (p.hue + hueOffset) % 360;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * breathValue), 0, Math.PI * 2);
        ctx.fillStyle = `oklch(${p.lum} ${p.sat} ${hue} / ${alpha})`;
        ctx.fill();

        aliveCount++;
      }

      while (this.particles.length < this.maxParticles) {
        this.particles.push(this.createParticle());
      }

      return aliveCount;
    }
  }

  /* ──────────────────────────────────────────────
     FRACTAL SVG RENDERER — Recursive L-system icons
     ────────────────────────────────────────────── */
  class FractalRenderer {
    constructor() {
      this.containers = {
        breath: document.getElementById('fractal-breath'),
        echo: document.getElementById('fractal-echo'),
        physics: document.getElementById('fractal-physics'),
        fractal: document.getElementById('fractal-fractal')
      };
    }

    renderLung(container) {
      const svg = this.createSVG(48, 48, 'lung-fractal');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('stroke', 'currentColor');
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke-width', '1.2');
      g.setAttribute('stroke-linecap', 'round');

      const drawBranch = (x, y, angle, length, depth, maxDepth) => {
        if (depth > maxDepth) return;
        const rad = angle * Math.PI / 180;
        const ex = x + Math.cos(rad) * length;
        const ey = y + Math.sin(rad) * length;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(1));
        line.setAttribute('y1', y.toFixed(1));
        line.setAttribute('x2', ex.toFixed(1));
        line.setAttribute('y2', ey.toFixed(1));
        line.setAttribute('stroke-width', Math.max(0.3, 1.2 - depth * 0.25));
        if (depth >= 2) line.classList.add('fractal-detail');
        g.appendChild(line);

        const newLen = length * 0.7;
        const spread = 25 + depth * 3;
        drawBranch(ex, ey, angle - spread, newLen, depth + 1, maxDepth);
        drawBranch(ex, ey, angle + spread, newLen, depth + 1, maxDepth);
      };

      drawBranch(24, 44, -90, 14, 0, 4);
      svg.appendChild(g);
      container.appendChild(svg);
      container.style.color = 'var(--accent)';
    }

    renderWave(container) {
      const svg = this.createSVG(48, 48, 'wave-fractal');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('stroke', 'currentColor');
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke-width', '0.8');
      g.setAttribute('stroke-linecap', 'round');

      const drawWave = (ox, oy, amp, freq, phase, depth, maxDepth) => {
        const points = [];
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = ox + t * 40;
          let y = oy + Math.sin(t * freq * Math.PI * 2 + phase) * amp;
          if (depth > 0) y += Math.sin(t * freq * 4 * Math.PI * 2 + phase * 2) * amp * 0.3;
          if (depth > 1) y += Math.sin(t * freq * 8 * Math.PI * 2 + phase * 3) * amp * 0.1;
          points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', points.join(' '));
        polyline.setAttribute('stroke-width', Math.max(0.2, 0.8 - depth * 0.15));
        if (depth >= 1) polyline.classList.add('fractal-detail');
        g.appendChild(polyline);

        if (depth < maxDepth) {
          drawWave(ox + 2, oy + 6, amp * 0.5, freq * 2, phase + 0.5, depth + 1, maxDepth);
          drawWave(ox + 2, oy - 6, amp * 0.5, freq * 2, phase - 0.5, depth + 1, maxDepth);
        }
      };

      drawWave(4, 24, 6, 1.5, 0, 0, 3);
      svg.appendChild(g);
      container.appendChild(svg);
      container.style.color = 'var(--accent)';
    }

    renderCollision(container) {
      const svg = this.createSVG(48, 48, 'collision-fractal');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('stroke', 'currentColor');
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke-width', '0.8');
      g.setAttribute('stroke-linecap', 'round');

      const drawRings = (cx, cy, radius, depth, maxDepth) => {
        if (depth > maxDepth || radius < 1) return;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toFixed(1));
        circle.setAttribute('cy', cy.toFixed(1));
        circle.setAttribute('r', radius.toFixed(1));
        circle.setAttribute('stroke-width', Math.max(0.15, 0.8 - depth * 0.15));
        if (depth >= 1) circle.classList.add('fractal-detail');
        g.appendChild(circle);

        drawRings(cx - radius * 0.5, cy, radius * 0.4, depth + 1, maxDepth);
        drawRings(cx + radius * 0.5, cy, radius * 0.4, depth + 1, maxDepth);
        drawRings(cx, cy - radius * 0.5, radius * 0.4, depth + 1, maxDepth);
        drawRings(cx, cy + radius * 0.5, radius * 0.4, depth + 1, maxDepth);
      };

      drawRings(24, 24, 16, 0, 3);
      svg.appendChild(g);
      container.appendChild(svg);
      container.style.color = 'var(--accent)';
    }

    renderFractal(container) {
      const svg = this.createSVG(48, 48, 'fractal-self');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('stroke', 'currentColor');
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke-width', '0.7');
      g.setAttribute('stroke-linecap', 'round');

      const drawTri = (x1, y1, x2, y2, x3, y3, depth, maxDepth) => {
        if (depth > maxDepth) return;

        const lines = [[x1, y1, x2, y2], [x2, y2, x3, y3], [x3, y3, x1, y1]];
        for (const [lx1, ly1, lx2, ly2] of lines) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', lx1.toFixed(1));
          line.setAttribute('y1', ly1.toFixed(1));
          line.setAttribute('x2', lx2.toFixed(1));
          line.setAttribute('y2', ly2.toFixed(1));
          line.setAttribute('stroke-width', Math.max(0.15, 0.7 - depth * 0.12));
          if (depth >= 1) line.classList.add('fractal-detail');
          g.appendChild(line);
        }

        if (depth < maxDepth) {
          const mx1 = (x1 + x2) / 2, my1 = (y1 + y2) / 2;
          const mx2 = (x2 + x3) / 2, my2 = (y2 + y3) / 2;
          const mx3 = (x3 + x1) / 2, my3 = (y3 + y1) / 2;

          drawTri(x1, y1, mx1, my1, mx3, my3, depth + 1, maxDepth);
          drawTri(x2, y2, mx1, my1, mx2, my2, depth + 1, maxDepth);
          drawTri(x3, y3, mx2, my2, mx3, my3, depth + 1, maxDepth);

          if (depth + 1 >= 2) {
            const inner = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            inner.setAttribute('points',
              `${mx1.toFixed(1)},${my1.toFixed(1)} ${mx2.toFixed(1)},${my2.toFixed(1)} ${mx3.toFixed(1)},${my3.toFixed(1)}`
            );
            inner.setAttribute('stroke-width', '0.2');
            inner.setAttribute('stroke-dasharray', '1 2');
            inner.classList.add('fractal-detail');
            g.appendChild(inner);
          }
        }
      };

      drawTri(24, 4, 8, 40, 40, 40, 0, 4);
      svg.appendChild(g);
      container.appendChild(svg);
      container.style.color = 'var(--accent)';
    }

    createSVG(w, h, id) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('id', id);
      return svg;
    }

    renderAll() {
      this.renderLung(this.containers.breath);
      this.renderWave(this.containers.echo);
      this.renderCollision(this.containers.physics);
      this.renderFractal(this.containers.fractal);
    }
  }

  /* ──────────────────────────────────────────────
     FROST SWIPE — Blur reduction on fast mouse pass
     ────────────────────────────────────────────── */
  class FrostSwipe {
    constructor() {
      this.cards = document.querySelectorAll('.glass-card');
      this.lastX = 0;
      this.lastY = 0;
      this.lastTime = 0;
      this.blurOverrides = new Map();
      this.baseBlur = 20;

      document.addEventListener('mousemove', (e) => {
        const now = performance.now();
        const dt = Math.max(now - this.lastTime, 1);
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt * 16.67;

        this.cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top && e.clientY <= rect.bottom;

          if (inside && speed > 3) {
            const reduction = Math.min(speed * 0.4, 14);
            const newBlur = Math.max(this.baseBlur - reduction, 4);

            if (!this.blurOverrides.has(card)) {
              this.blurOverrides.set(card, { blur: newBlur, timeout: null });
            }

            const state = this.blurOverrides.get(card);
            state.blur = newBlur;
            card.style.backdropFilter = `blur(${newBlur}px)`;
            card.style.webkitBackdropFilter = `blur(${newBlur}px)`;

            if (state.timeout) clearTimeout(state.timeout);

            state.timeout = setTimeout(() => {
              const recover = () => {
                const current = parseFloat(card.style.backdropFilter.replace(/[^0-9.]/g, '') || this.baseBlur);
                if (current < this.baseBlur) {
                  const next = Math.min(current + 0.5, this.baseBlur);
                  card.style.backdropFilter = `blur(${next}px)`;
                  card.style.webkitBackdropFilter = `blur(${next}px)`;
                  requestAnimationFrame(recover);
                } else {
                  this.blurOverrides.delete(card);
                }
              };
              recover();
            }, 200);
          }
        });

        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.lastTime = now;
      });
    }
  }

  /* ──────────────────────────────────────────────
     CONSOLE LOGGER — Colored system boot
     ────────────────────────────────────────────── */
  class ConsoleLogger {
    constructor() {
      this.styles = {
        title: 'color: #c084fc; font-size: 14px; font-weight: bold;',
        info: 'color: #94a3b8; font-size: 11px;',
        ok: 'color: #4ade80; font-size: 11px;',
        warn: 'color: #fbbf24; font-size: 11px;',
        error: 'color: #f87171; font-size: 11px;'
      };
    }

    log() {
      console.clear();
      console.log(
        '%c ╔══════════════════════════════════════╗\n' +
        '%c ║      P R I M A   V I T A            ║\n' +
        '%c ║     数字生命 · Digital Life          ║\n' +
        '%c ╚══════════════════════════════════════╝',
        this.styles.title, this.styles.title, this.styles.title, this.styles.title
      );

      const lines = [
        ['⟫ 呼吸引擎 · v1.0 — 周期 ' + (1.2 + 0.3 + 1.8).toFixed(1) + 's', 'info'],
        ['⟫ 色彩空间 · oklch — 色相漂移激活', 'info'],
        ['⟫ 碰撞系统 · 弹性形变阈值 0.5px', 'info'],
        ['⟫ 分形 SVG · 递归深度 4 级', 'info'],
        ['⟫ GPU 架构 · ' + (gpu.supported ? 'WebGL ' + gpu.tier : '2D Fallback'), gpu.supported ? 'ok' : 'warn'],
        ['⟫ 粒子系统 · 最大 ' + (gpu.tier === 'low' ? 30 : 80) + ' 粒子', 'info'],
        ['⟫ 自修复协议 · 兜底定时器就绪', 'info'],
        ['⟫ 生命信号已建立 · 进入感知循环', 'ok']
      ];

      lines.forEach(([msg, type]) => {
        console.log('%c' + msg, this.styles[type]);
      });

      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', this.styles.info);
    }
  }

  /* ──────────────────────────────────────────────
     MAIN LOOP — Convergence of all systems
     ────────────────────────────────────────────── */
  function init() {
    gpu.check();

    const gpuStatus = document.getElementById('console-gpu-status');
    if (gpuStatus) {
      gpuStatus.textContent = gpu.supported ? `[WebGL · ${gpu.tier}]` : '[2D Fallback]';
      gpuStatus.className = gpu.supported ? 'console-ok' : 'console-warn';
    }

    const breath = new BreathingEngine();
    const echo = new ColorEcho();
    const cursor = new CursorPhysics();
    const fractal = new FractalRenderer();
    const frost = new FrostSwipe();
    const logger = new ConsoleLogger();

    const pCanvas = document.getElementById('particle-canvas');
    const particles = new ParticleSystem(pCanvas);

    fractal.renderAll();

    const vitalBreath = document.getElementById('vital-breath');
    const vitalHue = document.getElementById('vital-hue');
    const vitalFps = document.getElementById('vital-fps');
    const vitalParticles = document.getElementById('vital-particles');
    const orb = document.getElementById('life-orb');

    let frameCount = 0;
    let fpsTime = 0;
    let currentFps = 60;

    if (gpu.tier === 'none') {
      const cc = document.getElementById('cursor-container');
      if (cc) cc.style.display = 'none';
      document.body.style.cursor = 'auto';
      if (pCanvas) pCanvas.style.display = 'none';
    }

    bootComplete = true;
    clearTimeout(bootGuard);

    logger.log();

    function tick(now) {
      frameCount++;
      if (now - fpsTime >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        fpsTime = now;
      }

      const breathValue = breath.update(now);
      document.documentElement.style.setProperty('--breath-phase', breathValue.toFixed(3));

      if (orb && gpu.tier !== 'none') {
        const scale = 1 + (breathValue - 0.5) * 0.06;
        orb.style.transform = `scale(${scale.toFixed(3)})`;
      }

      const hueOffset = echo.update(now);

      if (gpu.tier !== 'none') {
        cursor.update(now);
      }

      let particleCount = 0;
      if (gpu.tier !== 'none') {
        particleCount = particles.update(breathValue, hueOffset);
      }

      if (frameCount % 4 === 0) {
        if (vitalBreath) vitalBreath.textContent = breath.getBPM().toFixed(1);
        if (vitalHue) vitalHue.textContent = hueOffset.toFixed(1) + '°';
        if (vitalFps) vitalFps.textContent = currentFps;
        if (vitalParticles) vitalParticles.textContent = particleCount;
      }

      if (vitalBreath) {
        vitalBreath.style.opacity = (0.6 + breathValue * 0.4).toFixed(2);
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
