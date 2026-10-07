/**
 * FORK — Counterfactual Civilization Engine
 * Early conditions → path-dependent trajectories of tech, social, culture, knowledge.
 */
(() => {
  'use strict';

  const THEMES = ['chronicle', 'atlas', 'ash'];
  const VIEWS = ['seed', 'run', 'compare'];
  const ERAS = 5;
  const STORAGE_KEY = 'fork-civ-runs-v1';

  const ENV = ['river delta', 'high plateau', 'archipelago', 'arid basin', 'dense forest'];
  const RESOURCE = ['scarce metals', 'abundant grain', 'energy-rich coasts', 'fragile soils', 'distributed timber'];
  const ORG = ['clan confederation', 'temple bureaucracy', 'merchant leagues', 'martial hierarchy', 'council of elders'];
  const KNOW = ['oral epic memory', 'survey & measure', 'ritual calendar', 'craft guild secrets', 'astronomical record'];

  const state = {
    theme: 'chronicle',
    view: 'seed',
    env: ENV[0],
    resource: RESOURCE[0],
    org: ORG[0],
    know: KNOW[0],
    shock: 30,
    current: null,
    saved: []
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      seed: document.getElementById('view-seed'),
      run: document.getElementById('view-run'),
      compare: document.getElementById('view-compare')
    },
    envChips: document.getElementById('env-chips'),
    resourceChips: document.getElementById('resource-chips'),
    orgChips: document.getElementById('org-chips'),
    knowChips: document.getElementById('know-chips'),
    shock: document.getElementById('shock'),
    shockVal: document.getElementById('shock-val'),
    btnEvolve: document.getElementById('btn-evolve'),
    runSubtitle: document.getElementById('run-subtitle'),
    chartCanvas: document.getElementById('chart-canvas'),
    eraTimeline: document.getElementById('era-timeline'),
    outcomeCard: document.getElementById('outcome-card'),
    btnSaveRun: document.getElementById('btn-save-run'),
    btnReseed: document.getElementById('btn-reseed'),
    compareGrid: document.getElementById('compare-grid')
  };

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed() {
    const s = [state.env, state.resource, state.org, state.know, state.shock].join('|');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function clamp(x) {
    return Math.max(0, Math.min(1, x));
  }

  /**
   * Axes: tech, social complexity, cultural cohesion, knowledge formalization
   * Path dependence via multiplicative drift from early biases + shocks
   */
  function evolve() {
    const rng = mulberry32(hashSeed());
    const shock = state.shock / 100;

    // Initial biases from conditions
    let tech = 0.2;
    let social = 0.25;
    let culture = 0.3;
    let knowledge = 0.2;

    // Environment
    if (state.env === 'river delta') { tech += 0.05; social += 0.1; knowledge += 0.05; }
    if (state.env === 'high plateau') { culture += 0.1; social += 0.05; }
    if (state.env === 'archipelago') { tech += 0.08; culture += 0.05; social -= 0.05; }
    if (state.env === 'arid basin') { tech += 0.1; knowledge += 0.08; culture += 0.05; }
    if (state.env === 'dense forest') { culture += 0.1; knowledge -= 0.03; }

    // Resources
    if (state.resource === 'scarce metals') { tech -= 0.05; social += 0.08; }
    if (state.resource === 'abundant grain') { social += 0.12; culture += 0.05; }
    if (state.resource === 'energy-rich coasts') { tech += 0.15; }
    if (state.resource === 'fragile soils') { knowledge += 0.1; social += 0.05; }
    if (state.resource === 'distributed timber') { tech += 0.05; culture += 0.05; }

    // Organization
    if (state.org === 'clan confederation') { culture += 0.12; social -= 0.05; }
    if (state.org === 'temple bureaucracy') { knowledge += 0.12; social += 0.1; }
    if (state.org === 'merchant leagues') { tech += 0.1; social += 0.08; culture -= 0.05; }
    if (state.org === 'martial hierarchy') { social += 0.15; culture -= 0.05; tech += 0.05; }
    if (state.org === 'council of elders') { culture += 0.1; knowledge += 0.05; }

    // Knowledge bias
    if (state.know === 'oral epic memory') { culture += 0.15; knowledge -= 0.05; }
    if (state.know === 'survey & measure') { tech += 0.1; knowledge += 0.12; }
    if (state.know === 'ritual calendar') { culture += 0.1; knowledge += 0.08; }
    if (state.know === 'craft guild secrets') { tech += 0.12; social += 0.05; }
    if (state.know === 'astronomical record') { knowledge += 0.15; tech += 0.05; }

    tech = clamp(tech);
    social = clamp(social);
    culture = clamp(culture);
    knowledge = clamp(knowledge);

    const eras = [];
    const history = { tech: [tech], social: [social], culture: [culture], knowledge: [knowledge] };

    const eraNames = ['Foundation', 'Consolidation', 'Expansion', 'Recursion', 'Late form'];
    const narratives = [];

    for (let e = 0; e < ERAS; e++) {
      // Path-dependent growth: high axes reinforce, with diminishing returns
      const innov = tech * knowledge * (0.08 + rng() * 0.06);
      const order = social * (0.06 + culture * 0.04);
      const meaning = culture * (0.05 + knowledge * 0.03);
      const formal = knowledge * (0.06 + tech * 0.03);

      tech = clamp(tech + innov + (rng() - 0.45) * 0.04 * (1 + shock));
      social = clamp(social + order + (rng() - 0.5) * 0.05 * (1 + shock));
      culture = clamp(culture + meaning + (rng() - 0.5) * 0.04);
      knowledge = clamp(knowledge + formal + (rng() - 0.48) * 0.04);

      // Shocks can break one axis
      if (rng() < shock * 0.25) {
        const which = Math.floor(rng() * 4);
        if (which === 0) tech = clamp(tech - 0.12 - rng() * 0.1);
        if (which === 1) social = clamp(social - 0.12 - rng() * 0.1);
        if (which === 2) culture = clamp(culture - 0.1 - rng() * 0.08);
        if (which === 3) knowledge = clamp(knowledge - 0.1 - rng() * 0.08);
      }

      // Coupling: extreme social without knowledge → brittle
      if (social > 0.75 && knowledge < 0.35) social = clamp(social - 0.08);
      // High tech without culture → fragmentation pressure
      if (tech > 0.75 && culture < 0.35) culture = clamp(culture - 0.05);

      history.tech.push(tech);
      history.social.push(social);
      history.culture.push(culture);
      history.knowledge.push(knowledge);

      const focus = [
        ['tech', tech],
        ['social', social],
        ['culture', culture],
        ['knowledge', knowledge]
      ].sort((a, b) => b[1] - a[1])[0][0];

      const blurbs = {
        tech: 'Tools and infrastructure outpace institutional digests; workshops multiply.',
        social: 'Coordination layers thicken — offices, ranks, and obligations spread.',
        culture: 'Shared stories and rites tighten identity even as borders flex.',
        knowledge: 'Records, measures, and trained specialists become load-bearing.'
      };

      eras.push({
        name: eraNames[e],
        blurb: blurbs[focus],
        tech,
        social,
        culture,
        knowledge,
        focus
      });
      narratives.push(`${eraNames[e]}: ${blurbs[focus]}`);
    }

    // Outcome synthesis
    const end = eras[eras.length - 1];
    const dominant = [
      ['Technological density', end.tech],
      ['Institutional complexity', end.social],
      ['Cultural cohesion', end.culture],
      ['Formal knowledge', end.knowledge]
    ].sort((a, b) => b[1] - a[1]);

    let shape = 'A balanced but fragile equilibrium.';
    if (end.tech > 0.7 && end.culture < 0.4) shape = 'A high-tool, low-cohesion society — capable, restless, hard to govern.';
    else if (end.social > 0.7 && end.tech < 0.4) shape = 'A dense institutional world with modest technical means — order over invention.';
    else if (end.culture > 0.7 && end.knowledge < 0.4) shape = 'A meaning-rich oral-ritual civilization; weak formal abstraction.';
    else if (end.knowledge > 0.7 && end.social < 0.4) shape = 'Specialist knowledge without matching civic scale — enclaves of expertise.';
    else if (dominant[0][1] > 0.65) shape = `A civilization skewed toward ${dominant[0][0].toLowerCase()}, with secondary strength in ${dominant[1][0].toLowerCase()}.`;

    const insights = [];
    insights.push(`Early ${state.org} under ${state.env} conditions biased the path toward ${dominant[0][0].toLowerCase()}.`);
    if (shock > 0.5) insights.push('High shock intensity produced at least one visible collapse or reset along the way.');
    else insights.push('Relative stability let early advantages compound rather than reset.');
    if (state.resource === 'scarce metals' && end.tech < 0.5) {
      insights.push('Material scarcity constrained technical takeoff despite organizational effort.');
    }
    if (state.know === 'oral epic memory' && end.knowledge < end.culture) {
      insights.push('Oral-first knowledge favored cohesion over formal abstraction — visible in the late gap.');
    }
    insights.push('Path dependence: swapping any single early condition and re-running typically yields a different late shape.');

    state.current = {
      seed: {
        env: state.env,
        resource: state.resource,
        org: state.org,
        know: state.know,
        shock: state.shock
      },
      eras,
      history,
      shape,
      insights,
      dominant: dominant[0][0],
      id: 'run-' + Date.now()
    };

    return state.current;
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
    if (state.current) drawChart(state.current);
  }

  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    if ((name === 'run' || name === 'compare') && !state.current && name === 'run') return;
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
    if (name === 'compare') renderCompare();
  }

  function enableNav() {
    dom.navButtons.forEach((btn) => {
      if (btn.dataset.view === 'run') btn.disabled = !state.current;
      if (btn.dataset.view === 'compare') btn.disabled = state.saved.length === 0 && !state.current;
    });
  }

  function renderChips(container, options, key) {
    if (!container) return;
    container.innerHTML = options.map((o) => {
      const on = state[key] === o;
      return `<button type="button" class="chip${on ? ' is-on' : ''}" data-val="${o}">${o}</button>`;
    }).join('');
    container.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state[key] = chip.dataset.val;
        renderChips(container, options, key);
      });
    });
  }

  function drawChart(run) {
    const canvas = dom.chartCanvas;
    if (!canvas || !run) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 800;
    const cssH = 220;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = cssW;
    const h = cssH;
    const pad = 28;

    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#14100c';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const colors = {
      tech: getComputedStyle(document.body).getPropertyValue('--color-tech').trim() || '#60b0d0',
      social: getComputedStyle(document.body).getPropertyValue('--color-social').trim() || '#d08060',
      culture: getComputedStyle(document.body).getPropertyValue('--color-culture').trim() || '#c080d0',
      knowledge: getComputedStyle(document.body).getPropertyValue('--color-know').trim() || '#70c090'
    };

    const series = run.history;
    const n = series.tech.length;
    const xAt = (i) => pad + (i / (n - 1)) * (w - pad * 2);
    const yAt = (v) => h - pad - v * (h - pad * 2);

    // Grid
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-border').trim() || '#333';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let g = 0; g <= 4; g++) {
      const y = pad + (g / 4) * (h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ['tech', 'social', 'culture', 'knowledge'].forEach((key) => {
      const arr = series[key];
      ctx.beginPath();
      arr.forEach((v, i) => {
        const x = xAt(i);
        const y = yAt(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = colors[key];
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Legend
    ctx.font = '11px "Source Sans 3", sans-serif';
    let lx = pad;
    const labels = [
      ['Tech', colors.tech],
      ['Social', colors.social],
      ['Culture', colors.culture],
      ['Knowledge', colors.knowledge]
    ];
    labels.forEach(([lab, col]) => {
      ctx.fillStyle = col;
      ctx.fillRect(lx, 8, 10, 10);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-text-muted').trim() || '#aaa';
      ctx.fillText(lab, lx + 14, 17);
      lx += 80;
    });
  }

  function showRun(run) {
    if (dom.runSubtitle) {
      dom.runSubtitle.textContent = `${run.seed.env} · ${run.seed.org} · shock ${run.seed.shock}`;
    }
    drawChart(run);
    if (dom.eraTimeline) {
      dom.eraTimeline.innerHTML = run.eras.map((e) => `
        <article class="era-card">
          <h3>${escapeHtml(e.name)}</h3>
          <p>${escapeHtml(e.blurb)}</p>
          <div class="era-axes">
            <span class="t">Tech ${Math.round(e.tech * 100)}</span>
            <span class="s">Social ${Math.round(e.social * 100)}</span>
            <span class="c">Culture ${Math.round(e.culture * 100)}</span>
            <span class="k">Know ${Math.round(e.knowledge * 100)}</span>
          </div>
        </article>
      `).join('');
    }
    if (dom.outcomeCard) {
      dom.outcomeCard.innerHTML = `
        <h3>Late form</h3>
        <p>${escapeHtml(run.shape)}</p>
        <ul>${run.insights.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
      `;
    }
  }

  function renderCompare() {
    if (!dom.compareGrid) return;
    const runs = state.saved.slice();
    if (state.current && !runs.find((r) => r.id === state.current.id)) {
      // show current as unsaved preview option — only saved
    }
    if (!runs.length) {
      dom.compareGrid.innerHTML = '<p class="empty-hint">Save at least one run from Trajectory.</p>';
      return;
    }
    dom.compareGrid.innerHTML = runs.map((r) => `
      <article class="compare-card">
        <h3>${escapeHtml(r.dominant)}</h3>
        <p class="seed-line">${escapeHtml(r.seed.env)} · ${escapeHtml(r.seed.org)} · shock ${r.seed.shock}</p>
        <p>${escapeHtml(r.shape)}</p>
      </article>
    `).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state.saved = JSON.parse(raw) || [];
    } catch (e) { /* */ }
  }

  function saveSaved() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved.slice(-8)));
    } catch (e) { /* */ }
  }

  function init() {
    loadSaved();
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) switchView(btn.dataset.view);
      });
    });
    renderChips(dom.envChips, ENV, 'env');
    renderChips(dom.resourceChips, RESOURCE, 'resource');
    renderChips(dom.orgChips, ORG, 'org');
    renderChips(dom.knowChips, KNOW, 'know');
    if (dom.shock) {
      dom.shock.addEventListener('input', () => {
        state.shock = Number(dom.shock.value);
        if (dom.shockVal) dom.shockVal.textContent = String(state.shock);
      });
    }
    if (dom.btnEvolve) {
      dom.btnEvolve.addEventListener('click', () => {
        const run = evolve();
        enableNav();
        switchView('run');
        showRun(run);
      });
    }
    if (dom.btnSaveRun) {
      dom.btnSaveRun.addEventListener('click', () => {
        if (!state.current) return;
        if (!state.saved.find((r) => r.id === state.current.id)) {
          state.saved.unshift(state.current);
          saveSaved();
        }
        enableNav();
        switchView('compare');
      });
    }
    if (dom.btnReseed) {
      dom.btnReseed.addEventListener('click', () => switchView('seed'));
    }
    setTheme('chronicle');
    enableNav();
    switchView('seed');
    window.addEventListener('resize', () => {
      if (state.current && state.view === 'run') drawChart(state.current);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
