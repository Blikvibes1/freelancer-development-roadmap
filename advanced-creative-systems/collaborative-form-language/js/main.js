/**
 * MORPHOS — Collaborative Form Language
 * Contribute primitives; detect emerging language; generate hybrids.
 */
(() => {
  'use strict';

  const THEMES = ['atelier', 'slate', 'chalk'];
  const VIEWS = ['pool', 'contribute', 'hybrids', 'language'];
  const STORAGE_KEY = 'morphos-pool-v1';

  const SEED_PRIMITIVES = [
    { id: 's1', author: 'Seed', tag: 'petal', paths: [[[0.5,0.2],[0.7,0.4],[0.55,0.7],[0.45,0.7],[0.3,0.4],[0.5,0.2]]], type: 'draw' },
    { id: 's2', author: 'Seed', tag: 'blade', paths: [[[0.3,0.2],[0.5,0.15],[0.7,0.2],[0.55,0.8],[0.45,0.8],[0.3,0.2]]], type: 'draw' },
    { id: 's3', author: 'Lira', tag: 'joint', paths: [[[0.2,0.5],[0.4,0.3],[0.6,0.3],[0.8,0.5],[0.6,0.7],[0.4,0.7],[0.2,0.5]]], type: 'draw' },
    { id: 's4', author: 'Orrin', tag: 'arc', paths: [], type: 'arc', cx: 0.5, cy: 0.55, r: 0.28 },
    { id: 's5', author: 'Seed', tag: 'block', paths: [], type: 'rect', x: 0.28, y: 0.28, w: 0.44, h: 0.44 }
  ];

  const state = {
    theme: 'atelier',
    view: 'pool',
    pool: [],
    hybrids: [],
    tool: 'draw',
    drawing: false,
    currentPath: [],
    paths: []
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      pool: document.getElementById('view-pool'),
      contribute: document.getElementById('view-contribute'),
      hybrids: document.getElementById('view-hybrids'),
      language: document.getElementById('view-language')
    },
    poolGrid: document.getElementById('pool-grid'),
    drawCanvas: document.getElementById('draw-canvas'),
    contribForm: document.getElementById('contrib-form'),
    contribName: document.getElementById('contrib-name'),
    contribTag: document.getElementById('contrib-tag'),
    hybridGrid: document.getElementById('hybrid-grid'),
    btnGenerateHybrids: document.getElementById('btn-generate-hybrids'),
    langStats: document.getElementById('lang-stats'),
    langContributors: document.getElementById('lang-contributors'),
    btnClearDraw: document.getElementById('btn-clear-draw')
  };

  let dctx = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length) {
          state.pool = data;
          return;
        }
      }
    } catch (e) { /* */ }
    state.pool = SEED_PRIMITIVES.map((p) => JSON.parse(JSON.stringify(p)));
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pool));
    } catch (e) { /* */ }
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
    redrawDraw();
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
    if (name === 'pool') renderPool();
    if (name === 'hybrids') renderHybrids();
    if (name === 'language') renderLanguage();
    if (name === 'contribute') redrawDraw();
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.querySelectorAll('.tool-btn[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tool = btn.dataset.tool;
        document.querySelectorAll('.tool-btn[data-tool]').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.tool === state.tool);
        });
      });
    });
    if (dom.btnClearDraw) {
      dom.btnClearDraw.addEventListener('click', () => {
        state.paths = [];
        state.currentPath = [];
        redrawDraw();
      });
    }
  }

  /* Drawing */
  function redrawDraw() {
    if (!dctx || !dom.drawCanvas) return;
    const w = dom.drawCanvas.width;
    const h = dom.drawCanvas.height;
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#0e0c10';
    const ink = getComputedStyle(document.body).getPropertyValue('--color-ink').trim() || '#e8e0f0';
    dctx.fillStyle = bg;
    dctx.fillRect(0, 0, w, h);
    dctx.strokeStyle = ink;
    dctx.lineWidth = 2.5;
    dctx.lineCap = 'round';
    dctx.lineJoin = 'round';
    state.paths.forEach((path) => {
      if (path.length < 2) return;
      dctx.beginPath();
      dctx.moveTo(path[0][0] * w, path[0][1] * h);
      for (let i = 1; i < path.length; i++) {
        dctx.lineTo(path[i][0] * w, path[i][1] * h);
      }
      dctx.stroke();
    });
    if (state.currentPath.length > 1) {
      dctx.beginPath();
      dctx.moveTo(state.currentPath[0][0] * w, state.currentPath[0][1] * h);
      for (let i = 1; i < state.currentPath.length; i++) {
        dctx.lineTo(state.currentPath[i][0] * w, state.currentPath[i][1] * h);
      }
      dctx.stroke();
    }
  }

  function canvasPos(e) {
    const rect = dom.drawCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  function initDraw() {
    if (!dom.drawCanvas) return;
    dctx = dom.drawCanvas.getContext('2d');

    const start = (e) => {
      e.preventDefault();
      const p = canvasPos(e);
      if (state.tool === 'draw') {
        state.drawing = true;
        state.currentPath = [[p.x, p.y]];
      } else if (state.tool === 'circle') {
        state.paths.push({ type: 'circle', cx: p.x, cy: p.y, r: 0.12 });
        // store as path approximation
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          pts.push([p.x + Math.cos(a) * 0.12, p.y + Math.sin(a) * 0.12]);
        }
        state.paths.push(pts);
        redrawDraw();
      } else if (state.tool === 'rect') {
        const pts = [
          [p.x - 0.1, p.y - 0.1], [p.x + 0.1, p.y - 0.1],
          [p.x + 0.1, p.y + 0.1], [p.x - 0.1, p.y + 0.1],
          [p.x - 0.1, p.y - 0.1]
        ];
        state.paths.push(pts);
        redrawDraw();
      } else if (state.tool === 'arc') {
        const pts = [];
        for (let i = 0; i <= 16; i++) {
          const a = Math.PI + (i / 16) * Math.PI;
          pts.push([p.x + Math.cos(a) * 0.15, p.y + Math.sin(a) * 0.15]);
        }
        state.paths.push(pts);
        redrawDraw();
      }
    };
    const move = (e) => {
      if (!state.drawing) return;
      e.preventDefault();
      const p = canvasPos(e);
      state.currentPath.push([p.x, p.y]);
      redrawDraw();
    };
    const end = () => {
      if (state.drawing && state.currentPath.length > 1) {
        state.paths.push(state.currentPath.slice());
      }
      state.drawing = false;
      state.currentPath = [];
      redrawDraw();
    };

    dom.drawCanvas.addEventListener('mousedown', start);
    dom.drawCanvas.addEventListener('mousemove', move);
    dom.drawCanvas.addEventListener('mouseup', end);
    dom.drawCanvas.addEventListener('mouseleave', end);
    dom.drawCanvas.addEventListener('touchstart', start, { passive: false });
    dom.drawCanvas.addEventListener('touchmove', move, { passive: false });
    dom.drawCanvas.addEventListener('touchend', end);
  }

  function initContribute() {
    if (!dom.contribForm) return;
    dom.contribForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Flatten paths — only array paths
      const pathData = state.paths.filter((p) => Array.isArray(p) && p.length > 1);
      if (!pathData.length) {
        alert('Draw or place at least one form first.');
        return;
      }
      const prim = {
        id: 'p-' + Date.now(),
        author: (dom.contribName?.value || 'Anonymous').trim() || 'Anonymous',
        tag: (dom.contribTag?.value || '').trim(),
        paths: pathData,
        type: 'draw'
      };
      state.pool.push(prim);
      save();
      state.paths = [];
      state.currentPath = [];
      redrawDraw();
      if (dom.contribTag) dom.contribTag.value = '';
      switchView('pool');
    });
  }

  /* Render primitive to any canvas */
  function renderPrimitive(canvas, prim, size) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#16131a';
    const ink = getComputedStyle(document.body).getPropertyValue('--color-ink').trim() || '#e8e0f0';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (prim.type === 'arc' && prim.r) {
      ctx.beginPath();
      ctx.arc(prim.cx * size, prim.cy * size, prim.r * size, Math.PI, 0);
      ctx.stroke();
    } else if (prim.type === 'rect') {
      ctx.strokeRect(prim.x * size, prim.y * size, prim.w * size, prim.h * size);
    } else if (prim.paths) {
      prim.paths.forEach((path) => {
        if (!Array.isArray(path) || path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0][0] * size, path[0][1] * size);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i][0] * size, path[i][1] * size);
        }
        ctx.stroke();
      });
    }
  }

  function renderPool() {
    if (!dom.poolGrid) return;
    if (!state.pool.length) {
      dom.poolGrid.innerHTML = '<p class="empty-hint">No primitives yet. Contribute one.</p>';
      return;
    }
    dom.poolGrid.innerHTML = '';
    state.pool.forEach((prim) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      const meta = document.createElement('div');
      meta.className = 'form-card-meta';
      meta.textContent = (prim.tag ? prim.tag + ' · ' : '') + prim.author;
      card.appendChild(meta);
      dom.poolGrid.appendChild(card);
      renderPrimitive(canvas, prim, 140);
    });
  }

  /* Analyze language */
  function analyzeLanguage() {
    let totalPoints = 0;
    let angleSum = 0;
    let angleCount = 0;
    let closedness = 0;
    const authors = {};

    state.pool.forEach((prim) => {
      authors[prim.author] = (authors[prim.author] || 0) + 1;
      if (prim.type === 'rect') {
        angleSum += Math.PI / 2;
        angleCount += 4;
        closedness += 1;
        totalPoints += 4;
        return;
      }
      if (prim.type === 'arc') {
        angleSum += 0.3;
        angleCount += 1;
        totalPoints += 8;
        return;
      }
      (prim.paths || []).forEach((path) => {
        if (!Array.isArray(path) || path.length < 3) return;
        totalPoints += path.length;
        for (let i = 1; i < path.length - 1; i++) {
          const a = path[i - 1];
          const b = path[i];
          const c = path[i + 1];
          const v1x = b[0] - a[0];
          const v1y = b[1] - a[1];
          const v2x = c[0] - b[0];
          const v2y = c[1] - b[1];
          const d1 = Math.hypot(v1x, v1y) || 1;
          const d2 = Math.hypot(v2x, v2y) || 1;
          const dot = (v1x / d1) * (v2x / d2) + (v1y / d1) * (v2y / d2);
          const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
          angleSum += ang;
          angleCount += 1;
        }
        const first = path[0];
        const last = path[path.length - 1];
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.08) closedness += 1;
      });
    });

    const avgAngle = angleCount ? angleSum / angleCount : 0.5;
    // high avg angle change ≈ more curved; low ≈ angular
    const curvature = Math.min(1, avgAngle / Math.PI);
    const angularity = 1 - curvature;
    const density = Math.min(1, totalPoints / (state.pool.length * 20 || 1));
    const symmetry = closedness / Math.max(1, state.pool.length);

    return {
      curvature,
      angularity,
      density,
      symmetry,
      authors,
      count: state.pool.length
    };
  }

  function renderLanguage() {
    const lang = analyzeLanguage();
    if (dom.langStats) {
      const traits = [
        { key: 'curvature', label: 'Curvature' },
        { key: 'angularity', label: 'Angularity' },
        { key: 'density', label: 'Density' },
        { key: 'symmetry', label: 'Closure / symmetry' }
      ];
      dom.langStats.innerHTML = traits.map((t) => {
        const v = Math.round(lang[t.key] * 100);
        return `
          <div class="stat-card">
            <h3>${t.label}</h3>
            <p class="stat-val">${v}%</p>
            <div class="stat-bar"><div class="stat-fill" style="width:${v}%"></div></div>
          </div>
        `;
      }).join('');
    }
    if (dom.langContributors) {
      const entries = Object.entries(lang.authors).sort((a, b) => b[1] - a[1]);
      dom.langContributors.innerHTML = `
        <h3>Contributors (${lang.count} forms)</h3>
        <ul>${entries.map(([name, n]) => `<li>${escapeHtml(name)} — ${n}</li>`).join('')}</ul>
      `;
    }
  }

  /* Hybrids */
  function lerpPath(a, b, t) {
    const len = Math.max(a.length, b.length);
    const out = [];
    for (let i = 0; i < len; i++) {
      const pa = a[Math.min(i, a.length - 1)];
      const pb = b[Math.min(i, b.length - 1)];
      out.push([pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]);
    }
    return out;
  }

  function generateHybrids() {
    if (state.pool.length < 2) {
      if (dom.hybridGrid) {
        dom.hybridGrid.innerHTML = '<p class="empty-hint">Need at least 2 primitives in the pool.</p>';
      }
      return;
    }
    state.hybrids = [];
    const n = Math.min(6, state.pool.length);
    for (let i = 0; i < n; i++) {
      const a = state.pool[i % state.pool.length];
      const b = state.pool[(i + 1) % state.pool.length];
      const pathA = (a.paths && a.paths[0]) || sampleShape(a);
      const pathB = (b.paths && b.paths[0]) || sampleShape(b);
      const t = 0.35 + (i % 3) * 0.15;
      const hybridPath = lerpPath(pathA, pathB, t);
      state.hybrids.push({
        id: 'h-' + i,
        paths: [hybridPath],
        type: 'draw',
        parents: [a.author, b.author],
        tags: [a.tag, b.tag].filter(Boolean)
      });
    }
    renderHybrids();
  }

  function sampleShape(prim) {
    if (prim.type === 'rect') {
      return [
        [prim.x, prim.y], [prim.x + prim.w, prim.y],
        [prim.x + prim.w, prim.y + prim.h], [prim.x, prim.y + prim.h],
        [prim.x, prim.y]
      ];
    }
    if (prim.type === 'arc') {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI + (i / 16) * Math.PI;
        pts.push([prim.cx + Math.cos(a) * prim.r, prim.cy + Math.sin(a) * prim.r]);
      }
      return pts;
    }
    return [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7], [0.3, 0.3]];
  }

  function renderHybrids() {
    if (!dom.hybridGrid) return;
    if (!state.hybrids.length) {
      dom.hybridGrid.innerHTML = '<p class="empty-hint">Generate hybrids from the pool.</p>';
      return;
    }
    dom.hybridGrid.innerHTML = '';
    state.hybrids.forEach((h) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      const meta = document.createElement('div');
      meta.className = 'form-card-meta';
      meta.textContent = h.parents.join(' × ');
      card.appendChild(meta);
      dom.hybridGrid.appendChild(card);
      renderPrimitive(canvas, h, 140);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function init() {
    load();
    initChrome();
    initDraw();
    initContribute();
    if (dom.btnGenerateHybrids) {
      dom.btnGenerateHybrids.addEventListener('click', generateHybrids);
    }
    setTheme('atelier');
    renderPool();
    switchView('pool');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
