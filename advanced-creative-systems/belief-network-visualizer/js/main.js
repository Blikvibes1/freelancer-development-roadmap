/**
 * DOCTRINE — Belief Network Visualizer
 * Map beliefs as architecture: supports, contradictions, load-bearing, leverage.
 */
(() => {
  'use strict';

  const THEMES = ['slate', 'parchment', 'ink'];
  const VIEWS = ['map', 'edit', 'insights'];
  const STORAGE_KEY = 'doctrine-beliefs-v1';

  const SAMPLE = {
    nodes: [
      { id: 'b1', text: 'Hard work is the main path to success', weight: 5 },
      { id: 'b2', text: 'People generally get what they deserve', weight: 4 },
      { id: 'b3', text: 'Systems are mostly fair if you play by the rules', weight: 4 },
      { id: 'b4', text: 'Luck and birth circumstances dominate outcomes', weight: 3 },
      { id: 'b5', text: 'Asking for help is a sign of weakness', weight: 3 },
      { id: 'b6', text: 'Community care is a personal responsibility', weight: 4 },
      { id: 'b7', text: 'Change is possible through individual effort alone', weight: 3 }
    ],
    edges: [
      { from: 'b1', to: 'b2', rel: 'supports' },
      { from: 'b2', to: 'b3', rel: 'supports' },
      { from: 'b1', to: 'b5', rel: 'supports' },
      { from: 'b4', to: 'b2', rel: 'contradicts' },
      { from: 'b4', to: 'b3', rel: 'contradicts' },
      { from: 'b6', to: 'b5', rel: 'contradicts' },
      { from: 'b7', to: 'b1', rel: 'supports' },
      { from: 'b7', to: 'b4', rel: 'contradicts' },
      { from: 'b6', to: 'b7', rel: 'contradicts' }
    ]
  };

  const state = {
    theme: 'slate',
    view: 'map',
    nodes: [],
    edges: [],
    selected: null,
    relMode: 'supports',
    // layout
    pos: {},
    vel: {},
    drag: null,
    scale: 1,
    panX: 0,
    panY: 0
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      map: document.getElementById('view-map'),
      edit: document.getElementById('view-edit'),
      insights: document.getElementById('view-insights')
    },
    canvas: document.getElementById('net-canvas'),
    detailBody: document.getElementById('detail-body'),
    beliefForm: document.getElementById('belief-form'),
    beliefText: document.getElementById('belief-text'),
    beliefWeight: document.getElementById('belief-weight'),
    edgeFrom: document.getElementById('edge-from'),
    edgeTo: document.getElementById('edge-to'),
    btnAddEdge: document.getElementById('btn-add-edge'),
    beliefList: document.getElementById('belief-list'),
    btnSeed: document.getElementById('btn-seed'),
    btnClear: document.getElementById('btn-clear'),
    insightsGrid: document.getElementById('insights-grid')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let animId = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.nodes) state.nodes = data.nodes;
        if (data.edges) state.edges = data.edges;
      }
    } catch (e) { /* */ }
    if (!state.nodes.length) {
      state.nodes = SAMPLE.nodes.map((n) => ({ ...n }));
      state.edges = SAMPLE.edges.map((e) => ({ ...e }));
    }
    initPositions();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nodes: state.nodes,
        edges: state.edges
      }));
    } catch (e) { /* */ }
  }

  function initPositions() {
    const n = state.nodes.length || 1;
    state.nodes.forEach((node, i) => {
      if (!state.pos[node.id]) {
        const a = (i / n) * Math.PI * 2;
        state.pos[node.id] = {
          x: 0.5 + Math.cos(a) * 0.28,
          y: 0.5 + Math.sin(a) * 0.28
        };
        state.vel[node.id] = { x: 0, y: 0 };
      }
    });
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
    if (name === 'edit') {
      renderEdit();
    }
    if (name === 'insights') renderInsights();
    if (name === 'map') {
      resize();
      startSim();
    }
  }

  /* Analysis */
  function degree(id) {
    return state.edges.filter((e) => e.from === id || e.to === id).length;
  }

  function supportDegree(id) {
    return state.edges.filter((e) => e.rel === 'supports' && (e.from === id || e.to === id)).length;
  }

  function contradictPairs() {
    return state.edges.filter((e) => e.rel === 'contradicts');
  }

  function loadBearing() {
    // High weight + high support connectivity = load-bearing
    return state.nodes
      .map((n) => ({
        ...n,
        score: n.weight * 0.5 + supportDegree(n.id) * 0.8 + degree(n.id) * 0.2
      }))
      .sort((a, b) => b.score - a.score);
  }

  function leveragePoints() {
    // Nodes that support many others, or sit on contradiction boundaries
    const lb = loadBearing();
    const top = lb.slice(0, 3);
    const onContradiction = new Set();
    contradictPairs().forEach((e) => {
      onContradiction.add(e.from);
      onContradiction.add(e.to);
    });
    return state.nodes
      .filter((n) => onContradiction.has(n.id) || top.some((t) => t.id === n.id))
      .map((n) => {
        let why = [];
        if (top.some((t) => t.id === n.id)) why.push('structurally central');
        if (onContradiction.has(n.id)) why.push('on a contradiction edge');
        return { ...n, why: why.join('; ') };
      });
  }

  /* Force layout step */
  function simStep() {
    const nodes = state.nodes;
    const kRep = 0.0025;
    const kSpring = 0.02;
    const damp = 0.85;

    nodes.forEach((a) => {
      if (!state.vel[a.id]) state.vel[a.id] = { x: 0, y: 0 };
      if (!state.pos[a.id]) state.pos[a.id] = { x: 0.5, y: 0.5 };
    });

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const pa = state.pos[a.id];
        const pb = state.pos[b.id];
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let d2 = dx * dx + dy * dy || 0.0001;
        const f = kRep / d2;
        const d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        state.vel[a.id].x += dx * f;
        state.vel[a.id].y += dy * f;
        state.vel[b.id].x -= dx * f;
        state.vel[b.id].y -= dy * f;
      }
    }

    // Springs along edges
    state.edges.forEach((e) => {
      const pa = state.pos[e.from];
      const pb = state.pos[e.to];
      if (!pa || !pb) return;
      let dx = pb.x - pa.x;
      let dy = pb.y - pa.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const rest = e.rel === 'contradicts' ? 0.45 : 0.28;
      const f = (dist - rest) * kSpring;
      dx /= dist;
      dy /= dist;
      state.vel[e.from].x += dx * f;
      state.vel[e.from].y += dy * f;
      state.vel[e.to].x -= dx * f;
      state.vel[e.to].y -= dy * f;
    });

    // Center gravity
    nodes.forEach((n) => {
      const p = state.pos[n.id];
      state.vel[n.id].x += (0.5 - p.x) * 0.004;
      state.vel[n.id].y += (0.5 - p.y) * 0.004;
    });

    // Integrate (skip dragged)
    nodes.forEach((n) => {
      if (state.drag === n.id) return;
      const v = state.vel[n.id];
      const p = state.pos[n.id];
      v.x *= damp;
      v.y *= damp;
      p.x = Math.max(0.08, Math.min(0.92, p.x + v.x));
      p.y = Math.max(0.08, Math.min(0.92, p.y + v.y));
    });
  }

  function draw() {
    if (!ctx || !w) return;
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#12161c';
    const text = getComputedStyle(document.body).getPropertyValue('--color-text').trim() || '#e4e8f0';
    const muted = getComputedStyle(document.body).getPropertyValue('--color-text-subtle').trim() || '#687088';
    const support = getComputedStyle(document.body).getPropertyValue('--color-support').trim() || '#60b890';
    const contradict = getComputedStyle(document.body).getPropertyValue('--color-contradict').trim() || '#d07070';
    const load = getComputedStyle(document.body).getPropertyValue('--color-load').trim() || '#e0c060';
    const accent = getComputedStyle(document.body).getPropertyValue('--color-accent').trim() || '#70a0d0';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const lb = loadBearing();
    const loadIds = new Set(lb.slice(0, Math.max(1, Math.ceil(lb.length * 0.3))).map((n) => n.id));

    const toScreen = (p) => ({
      x: p.x * w,
      y: p.y * h
    });

    // Edges
    state.edges.forEach((e) => {
      const pa = state.pos[e.from];
      const pb = state.pos[e.to];
      if (!pa || !pb) return;
      const a = toScreen(pa);
      const b = toScreen(pb);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = e.rel === 'supports' ? support : contradict;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = e.rel === 'supports' ? 1.5 : 2;
      if (e.rel === 'contradicts') {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Nodes
    state.nodes.forEach((n) => {
      const p = state.pos[n.id];
      if (!p) return;
      const s = toScreen(p);
      const r = 10 + n.weight * 3;
      const isLoad = loadIds.has(n.id);
      const isSel = state.selected === n.id;

      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isLoad ? load : accent;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (isSel) {
        ctx.strokeStyle = text;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (isLoad) {
        ctx.strokeStyle = load;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = text;
      ctx.font = '11px "IBM Plex Sans", sans-serif';
      ctx.textAlign = 'center';
      const label = n.text.length > 28 ? n.text.slice(0, 26) + '…' : n.text;
      ctx.fillText(label, s.x, s.y + r + 14);
    });

    // Legend
    ctx.font = '10px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = muted;
    ctx.fillText('Gold ring = load-bearing · Green = support · Red dash = contradicts', 12, h - 12);
  }

  function startSim() {
    stopSim();
    const loop = () => {
      if (state.view === 'map') {
        simStep();
        draw();
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
  }

  function stopSim() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function resize() {
    if (!dom.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = dom.canvas.getBoundingClientRect();
    w = rect.width || 720;
    h = Math.max(400, rect.width * 0.55);
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    dom.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function hitTest(sx, sy) {
    for (let i = state.nodes.length - 1; i >= 0; i--) {
      const n = state.nodes[i];
      const p = state.pos[n.id];
      if (!p) continue;
      const x = p.x * w;
      const y = p.y * h;
      const r = 12 + n.weight * 3;
      if (Math.hypot(sx - x, sy - y) <= r + 4) return n.id;
    }
    return null;
  }

  function showDetail(id) {
    state.selected = id;
    const n = state.nodes.find((x) => x.id === id);
    if (!n || !dom.detailBody) return;
    const lb = loadBearing();
    const rank = lb.findIndex((x) => x.id === id) + 1;
    const isLoad = rank <= Math.max(1, Math.ceil(lb.length * 0.3));
    const links = state.edges.filter((e) => e.from === id || e.to === id);
    const other = (e) => {
      const oid = e.from === id ? e.to : e.from;
      return state.nodes.find((x) => x.id === oid);
    };
    dom.detailBody.innerHTML = `
      <div class="detail-body">
        <h3>${escapeHtml(n.text)}</h3>
        <p class="detail-meta">
          Felt weight ${n.weight}/5 · Degree ${degree(id)}
          ${isLoad ? ' · <span class="load">Load-bearing</span>' : ''}
        </p>
        <ul class="detail-links">
          ${links.length ? links.map((e) => {
            const o = other(e);
            const cls = e.rel === 'supports' ? 'sup' : 'con';
            return `<li class="${cls}">${e.rel} → ${escapeHtml(o ? o.text : '?')}</li>`;
          }).join('') : '<li>No links yet</li>'}
        </ul>
      </div>
    `;
  }

  function renderEdit() {
    if (dom.edgeFrom && dom.edgeTo) {
      const opts = state.nodes.map((n) =>
        `<option value="${n.id}">${escapeHtml(n.text.slice(0, 40))}</option>`
      ).join('');
      dom.edgeFrom.innerHTML = opts;
      dom.edgeTo.innerHTML = opts;
    }
    if (dom.beliefList) {
      dom.beliefList.innerHTML = state.nodes.map((n) => `
        <li>
          <span>${escapeHtml(n.text)} <small>(${n.weight})</small></span>
          <button type="button" data-del="${n.id}">Remove</button>
        </li>
      `).join('');
      dom.beliefList.querySelectorAll('[data-del]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.del;
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter((e) => e.from !== id && e.to !== id);
          delete state.pos[id];
          save();
          renderEdit();
        });
      });
    }
  }

  function renderInsights() {
    if (!dom.insightsGrid) return;
    const lb = loadBearing().slice(0, 5);
    const cons = contradictPairs();
    const lev = leveragePoints();

    dom.insightsGrid.innerHTML = `
      <div class="insight-card">
        <h3>Load-bearing beliefs</h3>
        <ul>
          ${lb.length ? lb.map((n) =>
            `<li><span class="tag-load">${escapeHtml(n.text)}</span></li>`
          ).join('') : '<li>Add more linked beliefs</li>'}
        </ul>
      </div>
      <div class="insight-card">
        <h3>Contradictions</h3>
        <ul>
          ${cons.length ? cons.map((e) => {
            const a = state.nodes.find((n) => n.id === e.from);
            const b = state.nodes.find((n) => n.id === e.to);
            return `<li class="tag-con">${escapeHtml(a?.text || '?')} ↔ ${escapeHtml(b?.text || '?')}</li>`;
          }).join('') : '<li>No contradiction edges marked</li>'}
        </ul>
      </div>
      <div class="insight-card">
        <h3>Leverage points</h3>
        <ul>
          ${lev.length ? lev.map((n) =>
            `<li><span class="tag-lev">${escapeHtml(n.text)}</span><br><small>${escapeHtml(n.why)}</small></li>`
          ).join('') : '<li>Link beliefs to surface leverage</li>'}
        </ul>
      </div>
      <div class="insight-card">
        <h3>Network size</h3>
        <ul>
          <li>${state.nodes.length} beliefs</li>
          <li>${state.edges.filter((e) => e.rel === 'supports').length} support links</li>
          <li>${cons.length} contradiction links</li>
        </ul>
      </div>
    `;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function initCanvas() {
    if (!dom.canvas) return;
    ctx = dom.canvas.getContext('2d');

    dom.canvas.addEventListener('mousedown', (e) => {
      const rect = dom.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const id = hitTest(sx, sy);
      if (id) {
        state.drag = id;
        showDetail(id);
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!state.drag || !dom.canvas) return;
      const rect = dom.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      state.pos[state.drag] = {
        x: Math.max(0.05, Math.min(0.95, sx / w)),
        y: Math.max(0.05, Math.min(0.95, sy / h))
      };
      state.vel[state.drag] = { x: 0, y: 0 };
    });
    window.addEventListener('mouseup', () => {
      state.drag = null;
    });
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    if (dom.beliefForm) {
      dom.beliefForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (dom.beliefText?.value || '').trim();
        if (!text) return;
        const weight = Number(dom.beliefWeight?.value || 3);
        const id = 'b-' + Date.now();
        state.nodes.push({ id, text, weight });
        state.pos[id] = { x: 0.4 + Math.random() * 0.2, y: 0.4 + Math.random() * 0.2 };
        state.vel[id] = { x: 0, y: 0 };
        if (dom.beliefText) dom.beliefText.value = '';
        save();
        renderEdit();
      });
    }
    document.querySelectorAll('.chip[data-rel]').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.relMode = chip.dataset.rel;
        document.querySelectorAll('.chip[data-rel]').forEach((c) => {
          c.classList.toggle('is-on', c.dataset.rel === state.relMode);
        });
      });
    });
    if (dom.btnAddEdge) {
      dom.btnAddEdge.addEventListener('click', () => {
        const from = dom.edgeFrom?.value;
        const to = dom.edgeTo?.value;
        if (!from || !to || from === to) return;
        const exists = state.edges.some(
          (e) => e.from === from && e.to === to && e.rel === state.relMode
        );
        if (!exists) {
          state.edges.push({ from, to, rel: state.relMode });
          save();
          renderEdit();
        }
      });
    }
    if (dom.btnSeed) {
      dom.btnSeed.addEventListener('click', () => {
        state.nodes = SAMPLE.nodes.map((n) => ({ ...n }));
        state.edges = SAMPLE.edges.map((e) => ({ ...e }));
        state.pos = {};
        state.vel = {};
        initPositions();
        save();
        renderEdit();
      });
    }
    if (dom.btnClear) {
      dom.btnClear.addEventListener('click', () => {
        if (!confirm('Clear entire network?')) return;
        state.nodes = [];
        state.edges = [];
        state.pos = {};
        state.vel = {};
        save();
        renderEdit();
      });
    }
  }

  function init() {
    load();
    initChrome();
    initCanvas();
    setTheme('slate');
    resize();
    window.addEventListener('resize', () => {
      if (state.view === 'map') resize();
    });
    switchView('map');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
