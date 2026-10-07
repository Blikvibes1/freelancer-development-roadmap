(() => {
  'use strict';
  const THEMES = ['lineage', 'archive', 'ink'];
  const VIEWS = ['graph', 'capture', 'timeline'];
  const STORAGE = 'lineage-ideas-v1';
  const REL_COLORS = { mutates: '--color-mutates', combines: '--color-combines', splits: '--color-splits', reappears: '--color-reappears' };

  const SAMPLE = {
    nodes: [
      { id: 'i1', text: 'Shared tools need trust ledgers', source: 'note', t: Date.now() - 864e5 * 12 },
      { id: 'i2', text: 'Doorway as social threshold device', source: 'sketch', t: Date.now() - 864e5 * 9 },
      { id: 'i3', text: 'Repair culture as status signal', source: 'conversation', t: Date.now() - 864e5 * 7 },
      { id: 'i4', text: 'Ledger-casket household object', source: 'project', t: Date.now() - 864e5 * 4 },
      { id: 'i5', text: 'Visible scars on objects as provenance', source: 'note', t: Date.now() - 864e5 * 2 },
      { id: 'i6', text: 'Threshold device + repair scars', source: 'project', t: Date.now() - 864e5 }
    ],
    edges: [
      { from: 'i1', to: 'i4', rel: 'mutates' },
      { from: 'i2', to: 'i4', rel: 'combines' },
      { from: 'i3', to: 'i5', rel: 'mutates' },
      { from: 'i4', to: 'i6', rel: 'combines' },
      { from: 'i5', to: 'i6', rel: 'combines' },
      { from: 'i1', to: 'i3', rel: 'reappears' }
    ]
  };

  const state = {
    theme: 'lineage', view: 'graph',
    nodes: [], edges: [],
    selected: null, rel: 'mutates', parents: new Set(),
    pos: {}, vel: {}, drag: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      graph: document.getElementById('view-graph'),
      capture: document.getElementById('view-capture'),
      timeline: document.getElementById('view-timeline')
    },
    canvas: document.getElementById('gen-canvas'),
    detailBody: document.getElementById('detail-body'),
    ideaForm: document.getElementById('idea-form'),
    ideaText: document.getElementById('idea-text'),
    ideaSource: document.getElementById('idea-source'),
    parentChips: document.getElementById('parent-chips'),
    relChips: document.getElementById('rel-chips'),
    btnSeed: document.getElementById('btn-seed'),
    timelineList: document.getElementById('timeline-list')
  };

  let ctx, w = 0, h = 0, animId;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const d = JSON.parse(raw);
        state.nodes = d.nodes || [];
        state.edges = d.edges || [];
      }
    } catch (e) { /* */ }
    if (!state.nodes.length) {
      state.nodes = SAMPLE.nodes.map((n) => ({ ...n }));
      state.edges = SAMPLE.edges.map((e) => ({ ...e }));
    }
    initPos();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ nodes: state.nodes, edges: state.edges }));
    } catch (e) { /* */ }
  }

  function initPos() {
    const n = state.nodes.length || 1;
    state.nodes.forEach((node, i) => {
      if (!state.pos[node.id]) {
        const a = (i / n) * Math.PI * 2;
        state.pos[node.id] = { x: 0.5 + Math.cos(a) * 0.3, y: 0.5 + Math.sin(a) * 0.28 };
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
    Object.entries(dom.views).forEach(([k, el]) => {
      if (!el) return;
      const on = k === name;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    dom.navButtons.forEach((btn) => {
      const on = btn.dataset.view === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
    if (name === 'capture') renderParents();
    if (name === 'timeline') renderTimeline();
    if (name === 'graph') { resize(); startSim(); }
  }

  function css(v) {
    return getComputedStyle(document.body).getPropertyValue(v).trim();
  }

  function simStep() {
    const nodes = state.nodes;
    nodes.forEach((a) => {
      if (!state.vel[a.id]) state.vel[a.id] = { x: 0, y: 0 };
      if (!state.pos[a.id]) state.pos[a.id] = { x: 0.5, y: 0.5 };
    });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const pa = state.pos[a.id], pb = state.pos[b.id];
        let dx = pa.x - pb.x, dy = pa.y - pb.y;
        const d2 = dx * dx + dy * dy || 0.0001;
        const f = 0.0022 / d2;
        const d = Math.sqrt(d2);
        dx /= d; dy /= d;
        state.vel[a.id].x += dx * f; state.vel[a.id].y += dy * f;
        state.vel[b.id].x -= dx * f; state.vel[b.id].y -= dy * f;
      }
    }
    state.edges.forEach((e) => {
      const pa = state.pos[e.from], pb = state.pos[e.to];
      if (!pa || !pb) return;
      let dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const rest = 0.22;
      const f = (dist - rest) * 0.018;
      dx /= dist; dy /= dist;
      state.vel[e.from].x += dx * f; state.vel[e.from].y += dy * f;
      state.vel[e.to].x -= dx * f; state.vel[e.to].y -= dy * f;
    });
    nodes.forEach((n) => {
      if (state.drag === n.id) return;
      const v = state.vel[n.id], p = state.pos[n.id];
      v.x = (v.x + (0.5 - p.x) * 0.003) * 0.86;
      v.y = (v.y + (0.5 - p.y) * 0.003) * 0.86;
      p.x = Math.max(0.08, Math.min(0.92, p.x + v.x));
      p.y = Math.max(0.1, Math.min(0.9, p.y + v.y));
    });
  }

  function draw() {
    if (!ctx || !w) return;
    ctx.fillStyle = css('--color-bg-elevated') || '#12161c';
    ctx.fillRect(0, 0, w, h);
    const toS = (p) => ({ x: p.x * w, y: p.y * h });

    state.edges.forEach((e) => {
      const pa = state.pos[e.from], pb = state.pos[e.to];
      if (!pa || !pb) return;
      const a = toS(pa), b = toS(pb);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = css(REL_COLORS[e.rel] || '--color-accent');
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    state.nodes.forEach((n) => {
      const p = state.pos[n.id];
      if (!p) return;
      const s = toS(p);
      const sel = state.selected === n.id;
      ctx.beginPath();
      ctx.arc(s.x, s.y, sel ? 14 : 11, 0, Math.PI * 2);
      ctx.fillStyle = css('--color-accent');
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (sel) {
        ctx.strokeStyle = css('--color-text');
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = css('--color-text');
      ctx.font = '11px "IBM Plex Sans", sans-serif';
      ctx.textAlign = 'center';
      const label = n.text.length > 26 ? n.text.slice(0, 24) + '…' : n.text;
      ctx.fillText(label, s.x, s.y + 22);
    });
  }

  function startSim() {
    cancelAnimationFrame(animId);
    const loop = () => {
      if (state.view === 'graph') { simStep(); draw(); }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
  }

  function resize() {
    if (!dom.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = dom.canvas.getBoundingClientRect();
    w = rect.width || 720;
    h = Math.max(360, w * 0.55);
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    dom.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function hit(sx, sy) {
    for (let i = state.nodes.length - 1; i >= 0; i--) {
      const n = state.nodes[i];
      const p = state.pos[n.id];
      if (!p) continue;
      if (Math.hypot(sx - p.x * w, sy - p.y * h) <= 16) return n.id;
    }
    return null;
  }

  function showDetail(id) {
    state.selected = id;
    const n = state.nodes.find((x) => x.id === id);
    if (!n || !dom.detailBody) return;
    const incoming = state.edges.filter((e) => e.to === id);
    const outgoing = state.edges.filter((e) => e.from === id);
    const name = (id) => state.nodes.find((x) => x.id === id)?.text || '?';
    dom.detailBody.innerHTML = `
      <p style="font-family:var(--font-display);font-size:1.05rem;margin-bottom:0.5rem">${esc(n.text)}</p>
      <p class="muted" style="margin-bottom:0.75rem">${esc(n.source)} · ${new Date(n.t).toLocaleDateString()}</p>
      <p class="side-title">From</p>
      <ul style="list-style:none;font-size:0.85rem;color:var(--color-text-muted);margin-bottom:0.75rem">
        ${incoming.length ? incoming.map((e) => `<li>${esc(e.rel)} ← ${esc(name(e.from))}</li>`).join('') : '<li>Root idea</li>'}
      </ul>
      <p class="side-title">To</p>
      <ul style="list-style:none;font-size:0.85rem;color:var(--color-text-muted)">
        ${outgoing.length ? outgoing.map((e) => `<li>${esc(e.rel)} → ${esc(name(e.to))}</li>`).join('') : '<li>No children yet</li>'}
      </ul>
    `;
  }

  function renderParents() {
    if (!dom.parentChips) return;
    dom.parentChips.innerHTML = state.nodes.map((n) => {
      const on = state.parents.has(n.id);
      return `<button type="button" class="chip${on ? ' is-parent is-on' : ''}" data-id="${n.id}">${esc(n.text.slice(0, 28))}</button>`;
    }).join('') || '<span class="muted">No ideas yet</span>';
    dom.parentChips.querySelectorAll('[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.parents.has(btn.dataset.id)) state.parents.delete(btn.dataset.id);
        else state.parents.add(btn.dataset.id);
        renderParents();
      });
    });
  }

  function renderTimeline() {
    if (!dom.timelineList) return;
    const sorted = state.nodes.slice().sort((a, b) => a.t - b.t);
    dom.timelineList.innerHTML = sorted.map((n) => `
      <li>
        <time>${new Date(n.t).toLocaleString()}</time>
        <strong>${esc(n.text)}</strong>
        <span class="src">${esc(n.source)}</span>
      </li>
    `).join('') || '<li>No ideas yet</li>';
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function init() {
    load();
    ctx = dom.canvas?.getContext('2d');
    dom.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
    dom.navButtons.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    dom.relChips?.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.rel = chip.dataset.rel;
        dom.relChips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c.dataset.rel === state.rel));
      });
    });
    dom.ideaForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (dom.ideaText?.value || '').trim();
      if (!text) return;
      const id = 'i-' + Date.now();
      state.nodes.push({
        id, text,
        source: dom.ideaSource?.value || 'note',
        t: Date.now()
      });
      state.pos[id] = { x: 0.4 + Math.random() * 0.2, y: 0.4 + Math.random() * 0.2 };
      state.vel[id] = { x: 0, y: 0 };
      state.parents.forEach((pid) => {
        state.edges.push({ from: pid, to: id, rel: state.rel });
      });
      state.parents.clear();
      if (dom.ideaText) dom.ideaText.value = '';
      save();
      renderParents();
      switchView('graph');
    });
    dom.btnSeed?.addEventListener('click', () => {
      state.nodes = SAMPLE.nodes.map((n) => ({ ...n }));
      state.edges = SAMPLE.edges.map((e) => ({ ...e }));
      state.pos = {}; state.vel = {};
      initPos();
      save();
      renderParents();
    });
    if (dom.canvas) {
      dom.canvas.addEventListener('mousedown', (e) => {
        const rect = dom.canvas.getBoundingClientRect();
        const id = hit(e.clientX - rect.left, e.clientY - rect.top);
        if (id) { state.drag = id; showDetail(id); }
      });
      window.addEventListener('mousemove', (e) => {
        if (!state.drag || !dom.canvas) return;
        const rect = dom.canvas.getBoundingClientRect();
        state.pos[state.drag] = {
          x: Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / w)),
          y: Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / h))
        };
        state.vel[state.drag] = { x: 0, y: 0 };
      });
      window.addEventListener('mouseup', () => { state.drag = null; });
    }
    setTheme('lineage');
    resize();
    window.addEventListener('resize', () => { if (state.view === 'graph') resize(); });
    switchView('graph');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
