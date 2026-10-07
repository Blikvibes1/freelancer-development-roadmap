/**
 * CONSTRAINT STUDIO — Design by Rules
 * Define constraints; explore the possibility space.
 */
(() => {
  'use strict';

  const THEMES = ['studio', 'paper', 'terminal'];
  const VIEWS = ['constraints', 'gallery', 'inspect'];

  const state = {
    theme: 'studio',
    view: 'constraints',
    constraints: {},
    variations: [],
    selected: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      constraints: document.getElementById('view-constraints'),
      gallery: document.getElementById('view-gallery'),
      inspect: document.getElementById('view-inspect')
    },
    previewCanvas: document.getElementById('preview-canvas'),
    previewHint: document.getElementById('preview-hint'),
    galleryGrid: document.getElementById('gallery-grid'),
    inspectCanvas: document.getElementById('inspect-canvas'),
    inspectMeta: document.getElementById('inspect-meta'),
    inspectDesc: document.getElementById('inspect-desc'),
    btnGenerate: document.getElementById('btn-generate'),
    // constraint controls
    cHue: document.getElementById('c-hue'),
    cColors: document.getElementById('c-colors'),
    oColors: document.getElementById('o-colors'),
    cSat: document.getElementById('c-sat'),
    oSat: document.getElementById('o-sat'),
    cShape: document.getElementById('c-shape'),
    cDensity: document.getElementById('c-density'),
    oDensity: document.getElementById('o-density'),
    cScale: document.getElementById('c-scale'),
    oScale: document.getElementById('o-scale'),
    cMargin: document.getElementById('c-margin'),
    oMargin: document.getElementById('o-margin'),
    cAlign: document.getElementById('c-align'),
    cOverlap: document.getElementById('c-overlap')
  };

  /* RNG */
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readConstraints() {
    return {
      hue: dom.cHue?.value || 'cool',
      maxColors: Number(dom.cColors?.value || 4),
      satCeil: Number(dom.cSat?.value || 70),
      shape: dom.cShape?.value || 'circle',
      density: Number(dom.cDensity?.value || 10),
      scaleVar: Number(dom.cScale?.value || 40) / 100,
      margin: Number(dom.cMargin?.value || 12) / 100,
      align: dom.cAlign?.value || 'grid',
      overlap: !!dom.cOverlap?.checked
    };
  }

  function setTheme(name) {
    if (!THEMES.includes(name)) return;
    state.theme = name;
    dom.body.setAttribute('data-theme', name);
    dom.themeButtons.forEach((btn) => {
      const on = btn.dataset.theme === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    drawPreview();
  }

  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    state.view = name;
    Object.entries(dom.views).forEach(([key, el]) => {
      if (!el) return;
      const on = key === name;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    dom.navButtons.forEach((btn) => {
      const on = btn.dataset.view === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
    if (name === 'gallery') renderGallery();
    if (name === 'inspect' && state.selected) showInspect(state.selected);
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Live outputs + preview
    const bindRange = (input, output, suffix, fn) => {
      if (!input) return;
      const update = () => {
        if (output) output.textContent = input.value + (suffix || '');
        if (fn) fn();
        drawPreview();
      };
      input.addEventListener('input', update);
      update();
    };
    bindRange(dom.cColors, dom.oColors, '');
    bindRange(dom.cSat, dom.oSat, '%');
    bindRange(dom.cDensity, dom.oDensity, '');
    bindRange(dom.cScale, dom.oScale, '%');
    bindRange(dom.cMargin, dom.oMargin, '%');

    [dom.cHue, dom.cShape, dom.cAlign, dom.cOverlap].forEach((el) => {
      if (el) el.addEventListener('change', drawPreview);
    });

    if (dom.btnGenerate) {
      dom.btnGenerate.addEventListener('click', generateVariations);
    }
  }

  /* Palette generation under constraints */
  function buildPalette(c, rng) {
    const colors = [];
    const bases = {
      warm: [15, 35, 55],
      cool: [200, 220, 240],
      neutral: [0, 30, 200],
      split: [30, 150, 210]
    };
    const hues = bases[c.hue] || bases.cool;
    for (let i = 0; i < c.maxColors; i++) {
      const h = hues[i % hues.length] + (rng() - 0.5) * 24;
      const s = 25 + rng() * (c.satCeil - 25);
      const l = 35 + rng() * 40;
      colors.push(`hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`);
    }
    return colors;
  }

  /* Layout positions under constraints */
  function layoutPositions(c, n, size, rng) {
    const positions = [];
    const m = c.margin * size;
    const inner = size - m * 2;

    if (c.align === 'grid') {
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellW = inner / cols;
        const cellH = inner / rows;
        const jitter = c.scaleVar * 0.15 * cellW;
        positions.push({
          x: m + cellW * (col + 0.5) + (rng() - 0.5) * jitter,
          y: m + cellH * (row + 0.5) + (rng() - 0.5) * jitter
        });
      }
    } else if (c.align === 'radial') {
      const cx = size / 2;
      const cy = size / 2;
      const maxR = inner / 2;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + rng() * 0.2;
        const r = maxR * (0.3 + rng() * 0.6);
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }
    } else {
      // free
      for (let i = 0; i < n; i++) {
        positions.push({
          x: m + rng() * inner,
          y: m + rng() * inner
        });
      }
    }
    return positions;
  }

  function generateComposition(c, seed, size) {
    const rng = mulberry32(seed);
    const palette = buildPalette(c, rng);
    const n = c.density;
    const positions = layoutPositions(c, n, size, rng);
    const shapes = [];

    positions.forEach((pos, i) => {
      const baseR = size * 0.04;
      const scale = 1 + (rng() - 0.5) * 2 * c.scaleVar;
      let kind = c.shape;
      if (c.shape === 'mixed') kind = rng() > 0.5 ? 'circle' : 'rect';
      shapes.push({
        x: pos.x,
        y: pos.y,
        r: baseR * scale,
        kind,
        color: palette[i % palette.length],
        rot: rng() * Math.PI
      });
    });

    // Simple overlap resolution if not allowed
    if (!c.overlap) {
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 0; i < shapes.length; i++) {
          for (let j = i + 1; j < shapes.length; j++) {
            const a = shapes[i];
            const b = shapes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            const minD = a.r + b.r + 4;
            if (dist < minD) {
              const push = (minD - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;
              a.x -= nx * push;
              a.y -= ny * push;
              b.x += nx * push;
              b.y += ny * push;
            }
          }
        }
      }
    }

    return { seed, palette, shapes, constraints: Object.assign({}, c) };
  }

  function renderComp(canvas, comp, size) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#15171e';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Margin guide subtle
    const m = comp.constraints.margin * size;
    ctx.strokeStyle = 'rgba(128,128,128,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(m, m, size - m * 2, size - m * 2);

    comp.shapes.forEach((s) => {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.88;
      if (s.kind === 'circle') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillRect(-s.r, -s.r, s.r * 2, s.r * 2);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawPreview() {
    const c = readConstraints();
    state.constraints = c;
    const comp = generateComposition(c, 42, 280);
    if (dom.previewCanvas) {
      // fit to parent width
      const parent = dom.previewCanvas.parentElement;
      const size = Math.min(280, parent ? parent.clientWidth - 32 : 280);
      renderComp(dom.previewCanvas, comp, size);
    }
    if (dom.previewHint) {
      dom.previewHint.textContent = `${c.maxColors} colors · ${c.density} elements · ${c.align} · ${c.shape}`;
    }
  }

  function generateVariations() {
    const c = readConstraints();
    state.constraints = c;
    state.variations = [];
    for (let i = 0; i < 12; i++) {
      const seed = (Date.now() + i * 9973) >>> 0;
      state.variations.push(generateComposition(c, seed, 200));
    }
    switchView('gallery');
  }

  function renderGallery() {
    if (!dom.galleryGrid) return;
    if (!state.variations.length) {
      dom.galleryGrid.innerHTML = '<p class="empty-hint">Generate from Constraints first.</p>';
      return;
    }
    dom.galleryGrid.innerHTML = '';
    state.variations.forEach((comp, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gal-card';
      card.setAttribute('aria-label', 'Variation ' + (idx + 1));
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      dom.galleryGrid.appendChild(card);
      renderComp(canvas, comp, 160);
      card.addEventListener('click', () => {
        state.selected = comp;
        switchView('inspect');
      });
    });
  }

  function showInspect(comp) {
    if (!comp) return;
    if (dom.inspectCanvas) renderComp(dom.inspectCanvas, comp, 400);
    if (dom.inspectDesc) dom.inspectDesc.textContent = 'Seed ' + comp.seed;
    if (dom.inspectMeta) {
      const c = comp.constraints;
      dom.inspectMeta.innerHTML = `
        <h3>Satisfied constraints</h3>
        <dl>
          <dt>Hue family</dt><dd>${c.hue}</dd>
          <dt>Max colors</dt><dd>${c.maxColors}</dd>
          <dt>Sat ceiling</dt><dd>${c.satCeil}%</dd>
          <dt>Shape</dt><dd>${c.shape}</dd>
          <dt>Density</dt><dd>${c.density}</dd>
          <dt>Scale variance</dt><dd>${Math.round(c.scaleVar * 100)}%</dd>
          <dt>Margin</dt><dd>${Math.round(c.margin * 100)}%</dd>
          <dt>Alignment</dt><dd>${c.align}</dd>
          <dt>Overlap</dt><dd>${c.overlap ? 'allowed' : 'resolved'}</dd>
          <dt>Seed</dt><dd>${comp.seed}</dd>
        </dl>
      `;
    }
  }

  function init() {
    initChrome();
    setTheme('studio');
    drawPreview();
    switchView('constraints');
    window.addEventListener('resize', () => {
      if (state.view === 'constraints') drawPreview();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
