/**
 * STYLE LAB — Controlled Mutation
 * Model core voice; generate adjacent / distant variations; compare drift.
 */
(() => {
  'use strict';

  const THEMES = ['atelier', 'gallery', 'darkroom'];
  const VIEWS = ['voice', 'mutate', 'compare'];

  const state = {
    theme: 'atelier',
    view: 'voice',
    voice: null,
    mutations: [],
    selected: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      voice: document.getElementById('view-voice'),
      mutate: document.getElementById('view-mutate'),
      compare: document.getElementById('view-compare')
    },
    voiceForm: document.getElementById('voice-form'),
    voiceCanvas: document.getElementById('voice-canvas'),
    mutDistance: document.getElementById('mut-distance'),
    distVal: document.getElementById('dist-val'),
    btnMutate: document.getElementById('btn-mutate'),
    mutateGrid: document.getElementById('mutate-grid'),
    cmpOrigin: document.getElementById('cmp-origin'),
    cmpMut: document.getElementById('cmp-mut'),
    compareMeta: document.getElementById('compare-meta')
  };

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readVoice() {
    return {
      palette: document.getElementById('v-palette')?.value || 'vivid',
      form: document.getElementById('v-form')?.value || 'organic',
      density: Number(document.getElementById('v-density')?.value || 5),
      contrast: Number(document.getElementById('v-contrast')?.value || 6),
      gesture: document.getElementById('v-gesture')?.value || 'textured',
      mood: document.getElementById('v-mood')?.value || 'tension'
    };
  }

  /* Style → visual parameters */
  function styleToParams(voice, distance, rng) {
    // distance 0–1: how far to push
    const d = distance;
    const jitter = (base, amount) => {
      const delta = (rng() - 0.5) * 2 * amount * d;
      return Math.max(0, Math.min(1, base + delta));
    };

    const paletteMap = { muted: 0.25, vivid: 0.85, mono: 0.1, earth: 0.45 };
    const formMap = { geometric: 0.15, organic: 0.75, hybrid: 0.45 };
    const gestureMap = { clean: 0.15, textured: 0.55, expressive: 0.9 };
    const moodHue = { calm: 200, tension: 15, play: 45, melancholy: 260 };

    let sat = paletteMap[voice.palette] ?? 0.5;
    let organic = formMap[voice.form] ?? 0.5;
    let density = voice.density / 10;
    let contrast = voice.contrast / 10;
    let gesture = gestureMap[voice.gesture] ?? 0.5;
    let hue = moodHue[voice.mood] ?? 30;

    // Mutate
    sat = jitter(sat, 0.4);
    organic = jitter(organic, 0.5);
    density = jitter(density, 0.35);
    contrast = jitter(contrast, 0.35);
    gesture = jitter(gesture, 0.4);
    hue = (hue + (rng() - 0.5) * 80 * d + 360) % 360;

    return { sat, organic, density, contrast, gesture, hue, distance: d };
  }

  function renderStyle(canvas, params, seed) {
    if (!canvas) return;
    const rng = mulberry32(seed);
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');

    // Background from contrast
    const bgL = params.contrast > 0.6 ? 12 : 22;
    ctx.fillStyle = `hsl(${params.hue} 10% ${bgL}%)`;
    ctx.fillRect(0, 0, w, h);

    const n = Math.floor(4 + params.density * 18);
    for (let i = 0; i < n; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = (6 + rng() * 28) * (0.6 + params.density * 0.5);
      const s = params.sat * 100;
      const l = 30 + rng() * 40 * (1 - params.contrast * 0.3) + (params.contrast > 0.7 ? (rng() > 0.5 ? 25 : -15) : 0);
      ctx.fillStyle = `hsl(${params.hue + (rng() - 0.5) * 40} ${s}% ${l}%)`;
      ctx.globalAlpha = 0.55 + params.gesture * 0.3;

      ctx.beginPath();
      if (params.organic > 0.5) {
        // blob
        const pts = 5 + Math.floor(rng() * 4);
        for (let p = 0; p < pts; p++) {
          const a = (p / pts) * Math.PI * 2;
          const rr = r * (0.6 + rng() * 0.5 * params.organic);
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // rect / hard
        const rw = r * (0.8 + rng() * 0.6);
        const rh = r * (0.8 + rng() * 0.6);
        if (params.gesture > 0.6) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rng() * 0.4);
          ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
          ctx.restore();
        } else {
          ctx.fillRect(x - rw / 2, y - rh / 2, rw, rh);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Gesture marks
    if (params.gesture > 0.4) {
      ctx.strokeStyle = `hsl(${params.hue} ${params.sat * 80}% 70%)`;
      ctx.globalAlpha = 0.25 + params.gesture * 0.2;
      ctx.lineWidth = 1 + params.gesture * 2;
      for (let i = 0; i < 3 + Math.floor(params.gesture * 5); i++) {
        ctx.beginPath();
        ctx.moveTo(rng() * w, rng() * h);
        ctx.quadraticCurveTo(rng() * w, rng() * h, rng() * w, rng() * h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
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
    if (state.voice) drawVoice();
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
    if (name === 'compare' && state.selected) showCompare(state.selected);
  }

  function drawVoice() {
    if (!state.voice || !dom.voiceCanvas) return;
    const params = styleToParams(state.voice, 0, mulberry32(1));
    renderStyle(dom.voiceCanvas, params, 99);
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    if (dom.mutDistance) {
      dom.mutDistance.addEventListener('input', () => {
        if (dom.distVal) dom.distVal.textContent = dom.mutDistance.value + '%';
      });
    }
  }

  function initVoice() {
    if (!dom.voiceForm) return;
    // Live preview as sliders change
    ['v-palette', 'v-form', 'v-density', 'v-contrast', 'v-gesture', 'v-mood'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          state.voice = readVoice();
          drawVoice();
        });
        el.addEventListener('change', () => {
          state.voice = readVoice();
          drawVoice();
        });
      }
    });
    state.voice = readVoice();
    drawVoice();

    dom.voiceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.voice = readVoice();
      drawVoice();
      switchView('mutate');
    });
  }

  function generateMutations() {
    if (!state.voice) {
      state.voice = readVoice();
    }
    const dist = Number(dom.mutDistance?.value || 25) / 100;
    state.mutations = [];
    for (let i = 0; i < 6; i++) {
      const seed = (Date.now() + i * 7919) >>> 0;
      const rng = mulberry32(seed);
      const params = styleToParams(state.voice, dist, rng);
      state.mutations.push({ seed, params, distance: dist });
    }
    renderMutateGrid();
  }

  function renderMutateGrid() {
    if (!dom.mutateGrid) return;
    if (!state.mutations.length) {
      dom.mutateGrid.innerHTML = '<p class="empty-hint">Lock a voice first, then generate.</p>';
      return;
    }
    dom.mutateGrid.innerHTML = '';
    state.mutations.forEach((mut, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mut-card';
      card.setAttribute('aria-label', 'Mutation ' + (idx + 1));
      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 200;
      card.appendChild(canvas);
      const meta = document.createElement('div');
      meta.className = 'mut-card-meta';
      meta.textContent = `Distance ${Math.round(mut.distance * 100)}% · seed ${mut.seed % 10000}`;
      card.appendChild(meta);
      dom.mutateGrid.appendChild(card);
      renderStyle(canvas, mut.params, mut.seed);
      card.addEventListener('click', () => {
        state.selected = mut;
        switchView('compare');
      });
    });
  }

  function showCompare(mut) {
    if (!mut || !state.voice) return;
    const originParams = styleToParams(state.voice, 0, mulberry32(1));
    if (dom.cmpOrigin) renderStyle(dom.cmpOrigin, originParams, 99);
    if (dom.cmpMut) renderStyle(dom.cmpMut, mut.params, mut.seed);

    if (dom.compareMeta) {
      const keys = ['sat', 'organic', 'density', 'contrast', 'gesture'];
      const labels = { sat: 'Saturation', organic: 'Organic form', density: 'Density', contrast: 'Contrast', gesture: 'Gesture' };
      let rows = keys.map((k) => {
        const o = originParams[k];
        const m = mut.params[k];
        const delta = m - o;
        const cls = Math.abs(delta) < 0.08 ? 'drift-hold' : 'drift-up';
        const arrow = Math.abs(delta) < 0.08 ? 'held' : (delta > 0 ? '↑' : '↓');
        return `<dt>${labels[k]}</dt><dd class="${cls}">${arrow} ${Math.round(m * 100)}% <span style="opacity:0.5">(${delta >= 0 ? '+' : ''}${Math.round(delta * 100)})</span></dd>`;
      }).join('');
      rows += `<dt>Hue</dt><dd>${Math.round(mut.params.hue)}°</dd>`;
      rows += `<dt>Distance</dt><dd>${Math.round(mut.distance * 100)}%</dd>`;
      dom.compareMeta.innerHTML = `<h3>Trait drift</h3><dl>${rows}</dl>`;
    }
  }

  function initMutate() {
    if (dom.btnMutate) {
      dom.btnMutate.addEventListener('click', generateMutations);
    }
  }

  function init() {
    initChrome();
    initVoice();
    initMutate();
    setTheme('atelier');
    switchView('voice');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
