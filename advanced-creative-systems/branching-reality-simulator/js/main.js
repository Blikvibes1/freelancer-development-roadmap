/**
 * DIVERGENCE — Branching Reality Simulator
 * Plausible cascading consequences across tech, social, culture, personal.
 */
(() => {
  'use strict';

  const THEMES = ['chronicle', 'parchment', 'signal'];
  const VIEWS = ['setup', 'timeline', 'inspect'];
  const DOMAINS = ['tech', 'social', 'culture', 'personal'];

  const DIVERGENCES = {
    historical: [
      { id: 'print', label: '1455 — Gutenberg press never spreads beyond Mainz', year: 1455, base: 'Printing remains a local craft for decades.' },
      { id: 'armada', label: '1588 — Spanish Armada succeeds', year: 1588, base: 'England falls under Habsburg influence.' },
      { id: 'electric', label: '1879 — Electric light is delayed 30 years', year: 1879, base: 'Gaslight and mechanical systems dominate longer.' },
      { id: 'apollo', label: '1969 — Apollo 11 fails to land', year: 1969, base: 'Manned lunar programs lose public mandate.' }
    ],
    personal: [
      { id: 'move', label: 'You never leave your hometown', year: 2010, base: 'Career and relationships form around a fixed place.' },
      { id: 'letter', label: 'A crucial message is never sent', year: 2015, base: 'A relationship or opportunity closes silently.' },
      { id: 'study', label: 'You choose a different field of study', year: 2008, base: 'Skills and peer networks diverge early.' }
    ],
    technological: [
      { id: 'web', label: '1993 — The web stays academic-only', year: 1993, base: 'Commercial internet is delayed a decade.' },
      { id: 'phone', label: '2007 — Smartphones arrive 15 years later', year: 2007, base: 'Mobile computing remains niche and delayed.' },
      { id: 'ai', label: '2017 — Deep learning winter returns', year: 2017, base: 'AI investment collapses; progress slows.' }
    ]
  };

  const CONSEQUENCE_TEMPLATES = {
    tech: [
      'Infrastructure prioritizes {focus}; adoption of alternatives slows.',
      'Research funding shifts toward {focus}, producing uneven breakthroughs.',
      'Standards coalesce around early imperfect systems related to {focus}.',
      'A secondary industry emerges to compensate for gaps in {focus}.'
    ],
    social: [
      'Public trust realigns; institutions gain or lose legitimacy around {focus}.',
      'Migration and settlement patterns change as opportunities concentrate near {focus}.',
      'New norms form about privacy, mobility, and work tied to {focus}.',
      'Inequality widens or narrows depending on access to {focus}-related goods.'
    ],
    culture: [
      'Art and media romanticize or critique the absence of expected {focus}.',
      'Education curricula lag, then overcorrect around {focus}.',
      'Shared myths and generational identity form around the fork of {focus}.',
      'Language absorbs new metaphors drawn from the lived experience of {focus}.'
    ],
    personal: [
      'Individual life paths branch: careers, partnerships, and risk tolerance shift with {focus}.',
      'Family stories encode the divergence; later generations inherit different defaults.',
      'Sense of agency and regret recalibrate against the remembered alternative of {focus}.',
      'Daily routines and tools feel normal to some and alien to others regarding {focus}.'
    ]
  };

  const state = {
    theme: 'chronicle',
    view: 'setup',
    tree: null,
    selectedNode: null,
    scenario: 'historical'
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      setup: document.getElementById('view-setup'),
      timeline: document.getElementById('view-timeline'),
      inspect: document.getElementById('view-inspect')
    },
    setupForm: document.getElementById('setup-form'),
    divergenceSelect: document.getElementById('divergence-select'),
    divergenceHint: document.getElementById('divergence-hint'),
    changeText: document.getElementById('change-text'),
    canvas: document.getElementById('timeline-canvas'),
    inspectContent: document.getElementById('inspect-content'),
    inspectDesc: document.getElementById('inspect-desc'),
    btnBackTimeline: document.getElementById('btn-back-timeline'),
    btnNewSim: document.getElementById('btn-new-sim'),
    overlay: document.getElementById('gen-overlay'),
    genStatus: document.getElementById('gen-status')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let layoutNodes = [];
  let seed = 1;

  /* RNG */
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  /* Theme / nav */
  function setTheme(name) {
    if (!THEMES.includes(name)) return;
    state.theme = name;
    dom.body.setAttribute('data-theme', name);
    dom.themeButtons.forEach((btn) => {
      const on = btn.dataset.theme === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    if (state.tree) drawTimeline();
  }

  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    if ((name === 'timeline' || name === 'inspect') && !state.tree) return;
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
    if (name === 'timeline') {
      requestAnimationFrame(() => {
        resizeCanvas();
        layoutTree();
        drawTimeline();
      });
    }
  }

  function enableViews() {
    dom.navButtons.forEach((btn) => { btn.disabled = false; });
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) switchView(btn.dataset.view);
      });
    });
    if (dom.btnBackTimeline) {
      dom.btnBackTimeline.addEventListener('click', () => switchView('timeline'));
    }
    if (dom.btnNewSim) {
      dom.btnNewSim.addEventListener('click', () => {
        state.tree = null;
        state.selectedNode = null;
        dom.navButtons.forEach((btn) => {
          if (btn.dataset.view !== 'setup') btn.disabled = true;
        });
        switchView('setup');
      });
    }
  }

  /* Divergence select */
  function populateDivergences() {
    const list = DIVERGENCES[state.scenario] || DIVERGENCES.historical;
    if (!dom.divergenceSelect) return;
    dom.divergenceSelect.innerHTML = list.map((d) =>
      `<option value="${d.id}">${d.label}</option>`
    ).join('');
    updateHint();
  }

  function updateHint() {
    const list = DIVERGENCES[state.scenario] || [];
    const id = dom.divergenceSelect?.value;
    const d = list.find((x) => x.id === id);
    if (dom.divergenceHint) {
      dom.divergenceHint.textContent = d ? d.base : '';
    }
  }

  function initSetup() {
    document.querySelectorAll('input[name="scenario"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          state.scenario = input.value;
          populateDivergences();
        }
      });
    });
    if (dom.divergenceSelect) {
      dom.divergenceSelect.addEventListener('change', updateHint);
    }
    populateDivergences();

    if (dom.setupForm) {
      dom.setupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await runSimulation();
      });
    }
  }

  /* Simulation engine */
  function getHorizonYears(h) {
    if (h === 'medium') return 50;
    if (h === 'long') return 100;
    return 20;
  }

  function buildNode(rng, parent, depth, maxDepth, startYear, horizon, changeFocus) {
    const domain = pick(rng, DOMAINS);
    const templates = CONSEQUENCE_TEMPLATES[domain];
    const template = pick(rng, templates);
    const yearOffset = Math.floor((horizon / maxDepth) * (depth + rng() * 0.6));
    const year = startYear + yearOffset;
    const titleBits = [
      'Shift in priorities',
      'Secondary cascade',
      'Stabilizing equilibrium',
      'Unexpected pressure',
      'Institutional response',
      'Cultural aftershock',
      'Infrastructure lag',
      'Norm crystallization'
    ];
    const node = {
      id: 'n-' + Math.floor(rng() * 1e9),
      depth,
      year,
      domain,
      title: pick(rng, titleBits),
      body: template.replace(/\{focus\}/g, changeFocus || 'the divergence'),
      causality: parent
        ? `Follows from “${parent.title}” (${parent.year}) via ${domain} channels.`
        : 'Root divergence — the fork itself.',
      children: []
    };

    if (depth < maxDepth) {
      const branches = depth === 0 ? 2 + (rng() > 0.4 ? 1 : 0) : (rng() > 0.35 ? 2 : 1);
      for (let i = 0; i < branches; i++) {
        node.children.push(
          buildNode(rng, node, depth + 1, maxDepth, startYear, horizon, changeFocus)
        );
      }
    }
    return node;
  }

  async function runSimulation() {
    const scenario = document.querySelector('input[name="scenario"]:checked')?.value || 'historical';
    const divId = dom.divergenceSelect?.value;
    const list = DIVERGENCES[scenario] || [];
    const div = list.find((d) => d.id === divId) || list[0];
    const change = (dom.changeText?.value || '').trim() || div.base;
    const horizonKey = document.querySelector('input[name="horizon"]:checked')?.value || 'short';
    const depth = Number(document.querySelector('input[name="depth"]:checked')?.value || 3);
    const horizon = getHorizonYears(horizonKey);

    seed = (div.year * 17 + change.length * 31 + depth * 13) >>> 0;
    const rng = mulberry32(seed || 1);

    if (dom.overlay) {
      dom.overlay.removeAttribute('hidden');
      if (dom.genStatus) dom.genStatus.textContent = 'Tracing causal threads…';
    }

    await new Promise((r) => setTimeout(r, 600));
    if (dom.genStatus) dom.genStatus.textContent = 'Cascading across domains…';
    await new Promise((r) => setTimeout(r, 500));

    const root = {
      id: 'root',
      depth: 0,
      year: div.year,
      domain: 'social',
      title: div.label.split('—')[1]?.trim() || div.label,
      body: change,
      causality: div.base,
      children: []
    };

    const branches = 2 + (rng() > 0.5 ? 1 : 0);
    for (let i = 0; i < branches; i++) {
      root.children.push(buildNode(rng, root, 1, depth, div.year, horizon, change.slice(0, 60)));
    }

    state.tree = root;
    state.selectedNode = null;
    enableViews();

    if (dom.overlay) dom.overlay.setAttribute('hidden', '');
    switchView('timeline');
  }

  /* Canvas timeline layout & draw */
  function resizeCanvas() {
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

  function flatten(node, list, parent) {
    list.push({ node, parent });
    node.children.forEach((c) => flatten(c, list, node));
  }

  function layoutTree() {
    if (!state.tree) return;
    const flat = [];
    flatten(state.tree, flat, null);

    const maxDepth = Math.max(...flat.map((f) => f.node.depth));
    const byDepth = {};
    flat.forEach((f) => {
      if (!byDepth[f.node.depth]) byDepth[f.node.depth] = [];
      byDepth[f.node.depth].push(f);
    });

    const padX = 48;
    const padY = 36;
    layoutNodes = [];

    for (let d = 0; d <= maxDepth; d++) {
      const group = byDepth[d] || [];
      const x = padX + (d / Math.max(1, maxDepth)) * (w - padX * 2);
      group.forEach((f, i) => {
        const y = padY + ((i + 0.5) / group.length) * (h - padY * 2);
        layoutNodes.push({
          id: f.node.id,
          node: f.node,
          parent: f.parent,
          x,
          y,
          r: f.node.depth === 0 ? 14 : 9
        });
      });
    }
  }

  function domainColor(domain) {
    const styles = getComputedStyle(document.body);
    if (domain === 'tech') return styles.getPropertyValue('--color-tech').trim() || '#5b9bd5';
    if (domain === 'social') return styles.getPropertyValue('--color-social').trim() || '#7cb87c';
    if (domain === 'culture') return styles.getPropertyValue('--color-culture').trim() || '#c9a86c';
    return styles.getPropertyValue('--color-personal').trim() || '#c47a9a';
  }

  function drawTimeline() {
    if (!ctx || !w || !state.tree) return;
    ctx.clearRect(0, 0, w, h);

    const accent = getComputedStyle(document.body).getPropertyValue('--color-accent').trim() || '#6b9fd4';
    const muted = getComputedStyle(document.body).getPropertyValue('--color-text-subtle').trim() || '#6a7080';

    // Edges
    layoutNodes.forEach((ln) => {
      if (!ln.parent) return;
      const parentLn = layoutNodes.find((p) => p.id === ln.parent.id);
      if (!parentLn) return;
      ctx.beginPath();
      ctx.moveTo(parentLn.x, parentLn.y);
      const mx = (parentLn.x + ln.x) / 2;
      ctx.bezierCurveTo(mx, parentLn.y, mx, ln.y, ln.x, ln.y);
      ctx.strokeStyle = domainColor(ln.node.domain);
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Nodes
    layoutNodes.forEach((ln) => {
      const selected = state.selectedNode && state.selectedNode.id === ln.id;
      ctx.beginPath();
      ctx.arc(ln.x, ln.y, ln.r + (selected ? 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = domainColor(ln.node.domain);
      ctx.globalAlpha = selected ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (selected) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Year label
      ctx.fillStyle = muted;
      ctx.font = '500 10px Libre Franklin, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(ln.node.year), ln.x, ln.y + ln.r + 14);
    });
  }

  function hitNode(x, y) {
    for (let i = layoutNodes.length - 1; i >= 0; i--) {
      const ln = layoutNodes[i];
      const dx = x - ln.x;
      const dy = y - ln.y;
      if (dx * dx + dy * dy < (ln.r + 8) * (ln.r + 8)) return ln;
    }
    return null;
  }

  function showInspect(node) {
    state.selectedNode = node;
    if (!dom.inspectContent) return;
    dom.inspectContent.innerHTML = `
      <p class="inspect-year">${node.year}</p>
      <h3 class="inspect-title">${escapeHtml(node.title)}</h3>
      <span class="inspect-domain ${node.domain}">${node.domain}</span>
      <p class="inspect-body">${escapeHtml(node.body)}</p>
      <p class="inspect-causality">${escapeHtml(node.causality)}</p>
    `;
    if (dom.inspectDesc) {
      dom.inspectDesc.textContent = `Node at ${node.year} · ${node.domain} domain`;
    }
    switchView('inspect');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function initCanvas() {
    if (!dom.canvas) return;
    ctx = dom.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', () => {
      if (state.view === 'timeline') {
        resizeCanvas();
        layoutTree();
        drawTimeline();
      }
    });

    dom.canvas.addEventListener('click', (e) => {
      const rect = dom.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hitNode(x, y);
      if (hit) {
        drawTimeline();
        showInspect(hit.node);
      }
    });
  }

  function init() {
    initChrome();
    initSetup();
    initCanvas();
    setTheme('chronicle');
    switchView('setup');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
