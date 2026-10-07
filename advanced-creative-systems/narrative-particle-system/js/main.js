/**
 * DRAMATIC FIELD — Narrative Particle System
 * Characters, themes, conflicts, emotions as particles with forces.
 */
(() => {
  'use strict';

  const THEMES = ['drama', 'ink', 'neon'];
  const TYPES = ['character', 'theme', 'conflict', 'emotion'];

  const PRESET = [
    { label: 'The Exile', type: 'character', charge: 1.2 },
    { label: 'The Crown', type: 'character', charge: 1.1 },
    { label: 'Belonging', type: 'theme', charge: 1 },
    { label: 'Power', type: 'theme', charge: 1.1 },
    { label: 'Usurpation', type: 'conflict', charge: 1.4 },
    { label: 'Betrayal', type: 'conflict', charge: 1.3 },
    { label: 'Longing', type: 'emotion', charge: 0.9 },
    { label: 'Rage', type: 'emotion', charge: 1.2 },
    { label: 'The Mentor', type: 'character', charge: 0.8 },
    { label: 'Homecoming', type: 'theme', charge: 0.9 }
  ];

  const state = {
    theme: 'drama',
    particles: [],
    forces: { attract: 1, repel: 1, damp: 0.94, emotion: 1 },
    tensionBurst: 0,
    reducedMotion: false
  };

  const dom = {
    body: document.body,
    canvas: document.getElementById('field-canvas'),
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    panels: {
      field: document.getElementById('panel-field'),
      seed: document.getElementById('panel-seed'),
      forces: document.getElementById('panel-forces')
    },
    hudCount: document.getElementById('hud-count'),
    hudTension: document.getElementById('hud-tension'),
    seedForm: document.getElementById('seed-form'),
    seedLabel: document.getElementById('seed-label'),
    seedCharge: document.getElementById('seed-charge'),
    btnPulse: document.getElementById('btn-pulse'),
    btnClear: document.getElementById('btn-clear'),
    btnPreset: document.getElementById('btn-preset'),
    fAttract: document.getElementById('f-attract'),
    fRepel: document.getElementById('f-repel'),
    fDamp: document.getElementById('f-damp'),
    fEmotion: document.getElementById('f-emotion')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let animId = null;
  let time = 0;

  function setTheme(name) {
    if (!THEMES.includes(name)) return;
    state.theme = name;
    dom.body.setAttribute('data-theme', name);
    dom.themeButtons.forEach((btn) => {
      const on = btn.dataset.theme === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  function switchPanel(name) {
    Object.entries(dom.panels).forEach(([key, el]) => {
      if (!el) return;
      const on = key === name;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    dom.navButtons.forEach((btn) => {
      const on = btn.dataset.panel === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });
    if (dom.fAttract) dom.fAttract.addEventListener('input', () => { state.forces.attract = Number(dom.fAttract.value); });
    if (dom.fRepel) dom.fRepel.addEventListener('input', () => { state.forces.repel = Number(dom.fRepel.value); });
    if (dom.fDamp) dom.fDamp.addEventListener('input', () => { state.forces.damp = Number(dom.fDamp.value); });
    if (dom.fEmotion) dom.fEmotion.addEventListener('input', () => { state.forces.emotion = Number(dom.fEmotion.value); });
  }

  function typeColor(type) {
    const s = getComputedStyle(document.body);
    if (type === 'character') return s.getPropertyValue('--c-character').trim() || '#6b9fd4';
    if (type === 'theme') return s.getPropertyValue('--c-theme').trim() || '#7cb87c';
    if (type === 'conflict') return s.getPropertyValue('--c-conflict').trim() || '#e07a7a';
    return s.getPropertyValue('--c-emotion').trim() || '#c9a0e0';
  }

  function addParticle(label, type, charge) {
    state.particles.push({
      id: 'p-' + Date.now() + Math.random(),
      label,
      type,
      charge: charge || 1,
      x: w * (0.3 + Math.random() * 0.4),
      y: h * (0.3 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      r: 8 + charge * 6,
      life: 1
    });
    updateHud();
  }

  function initSeed() {
    if (dom.seedForm) {
      dom.seedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const label = (dom.seedLabel?.value || '').trim();
        const type = document.querySelector('input[name="ptype"]:checked')?.value || 'character';
        const charge = Number(dom.seedCharge?.value || 1);
        if (!label) return;
        addParticle(label, type, charge);
        if (dom.seedLabel) dom.seedLabel.value = '';
      });
    }
    if (dom.btnPreset) {
      dom.btnPreset.addEventListener('click', () => {
        state.particles = [];
        PRESET.forEach((p) => addParticle(p.label, p.type, p.charge));
      });
    }
    if (dom.btnClear) {
      dom.btnClear.addEventListener('click', () => {
        state.particles = [];
        updateHud();
      });
    }
    if (dom.btnPulse) {
      dom.btnPulse.addEventListener('click', () => {
        state.tensionBurst = 1;
        state.particles.forEach((p) => {
          if (p.type === 'conflict' || p.type === 'emotion') {
            p.vx += (Math.random() - 0.5) * 8 * p.charge;
            p.vy += (Math.random() - 0.5) * 8 * p.charge;
          }
        });
      });
    }
  }

  function updateHud() {
    if (dom.hudCount) dom.hudCount.textContent = state.particles.length + ' particles';
    // Tension: average speed of conflict particles
    const conflicts = state.particles.filter((p) => p.type === 'conflict');
    let tension = 0;
    conflicts.forEach((p) => { tension += Math.hypot(p.vx, p.vy); });
    tension = conflicts.length ? tension / conflicts.length : 0;
    tension += state.tensionBurst * 2;
    if (dom.hudTension) {
      const label = tension > 3 ? 'High' : tension > 1.2 ? 'Rising' : 'Low';
      dom.hudTension.textContent = 'Tension ' + label;
    }
  }

  function step() {
    const n = state.particles.length;
    const { attract, repel, damp, emotion } = state.forces;

    for (let i = 0; i < n; i++) {
      const a = state.particles[i];
      for (let j = i + 1; j < n; j++) {
        const b = state.particles[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist > 280) continue;

        const inv = 1 / dist;
        dx *= inv;
        dy *= inv;

        let force = 0;

        // Same type theme/character: mild attract
        if (a.type === b.type && (a.type === 'theme' || a.type === 'character')) {
          force += 0.15 * attract * a.charge * b.charge;
        }
        // Theme attracts characters
        if ((a.type === 'theme' && b.type === 'character') || (a.type === 'character' && b.type === 'theme')) {
          force += 0.25 * attract * a.charge * b.charge;
        }
        // Conflict repels almost everything nearby, stronger with characters
        if (a.type === 'conflict' || b.type === 'conflict') {
          force -= 0.4 * repel * a.charge * b.charge;
          if (a.type === 'character' || b.type === 'character') force -= 0.2 * repel;
        }
        // Emotions pull toward related (soft attract to all)
        if (a.type === 'emotion' || b.type === 'emotion') {
          force += 0.12 * emotion * a.charge * b.charge;
        }

        // Soft collision
        const minDist = a.r + b.r + 4;
        if (dist < minDist) {
          force -= (minDist - dist) * 0.08;
        }

        const f = force / Math.max(dist * 0.02, 0.5);
        a.vx += dx * f;
        a.vy += dy * f;
        b.vx -= dx * f;
        b.vy -= dy * f;
      }
    }

    // Center gravity mild
    state.particles.forEach((p) => {
      p.vx += (w / 2 - p.x) * 0.0004;
      p.vy += (h / 2 - p.y) * 0.0004;
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx;
      p.y += p.vy;
      // Bounds
      const m = p.r + 4;
      if (p.x < m) { p.x = m; p.vx *= -0.6; }
      if (p.x > w - m) { p.x = w - m; p.vx *= -0.6; }
      if (p.y < m) { p.y = m; p.vy *= -0.6; }
      if (p.y > h - m) { p.y = h - m; p.vy *= -0.6; }
    });

    state.tensionBurst *= 0.96;
  }

  function draw() {
    if (!ctx || !w) return;
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#0a0a0f';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Links between strongly interacting pairs
    for (let i = 0; i < state.particles.length; i++) {
      const a = state.particles[i];
      for (let j = i + 1; j < state.particles.length; j++) {
        const b = state.particles[j];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist > 120) continue;
        let drawLink = false;
        let col = 'rgba(150,150,160,0.15)';
        if (a.type === 'theme' && b.type === 'character') { drawLink = true; col = typeColor('theme') + '33'; }
        if (a.type === 'character' && b.type === 'theme') { drawLink = true; col = typeColor('theme') + '33'; }
        if ((a.type === 'conflict' || b.type === 'conflict') && dist < 90) {
          drawLink = true;
          col = typeColor('conflict') + '44';
        }
        if (drawLink) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Particles
    const t = time * 0.001;
    state.particles.forEach((p) => {
      const pulse = p.type === 'emotion'
        ? 1 + Math.sin(t * 3 + p.charge * 5) * 0.15 * state.forces.emotion
        : 1;
      const r = p.r * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = typeColor(p.type);
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-text').trim() || '#fff';
      ctx.font = '500 11px IBM Plex Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x, p.y + r + 14);
    });
  }

  function frame(ts) {
    time = ts;
    if (!state.reducedMotion) step();
    draw();
    updateHud();
    animId = requestAnimationFrame(frame);
  }

  function resize() {
    if (!dom.canvas || !dom.canvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = dom.canvas.parentElement.clientWidth;
    h = dom.canvas.parentElement.clientHeight;
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    dom.canvas.style.width = w + 'px';
    dom.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    if (!dom.canvas) return;
    ctx = dom.canvas.getContext('2d');
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initChrome();
    initSeed();
    setTheme('drama');
    switchPanel('field');
    resize();
    window.addEventListener('resize', resize);
    // Auto-load sample on first visit
    PRESET.forEach((p) => addParticle(p.label, p.type, p.charge));
    animId = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
