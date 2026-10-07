/**
 * AXIOM — Value Alignment Playground
 * Force values into conflict; reveal hierarchy through choices.
 */
(() => {
  'use strict';

  const THEMES = ['tribunal', 'study', 'void'];
  const VIEWS = ['values', 'confront', 'map'];
  const STORAGE_KEY = 'axiom-values-v1';
  const SCENARIOS_PER_ROUND = 5;

  const PRESETS = [
    'Honesty', 'Compassion', 'Autonomy', 'Loyalty', 'Justice',
    'Excellence', 'Security', 'Curiosity', 'Fairness', 'Courage',
    'Stewardship', 'Efficiency', 'Privacy', 'Community', 'Growth'
  ];

  // Scenario templates: two slots for competing values
  const TEMPLATES = [
    {
      context: 'A colleague asks you to soft-pedal a problem you both know is serious. Doing so protects their standing; naming it protects the work.',
      a: (v) => `Protect the colleague — honor ${v}`,
      b: (v) => `Name the problem clearly — honor ${v}`,
      stake: (va, vb) => `This pits ${va} against ${vb}. One will be subordinated.`
    },
    {
      context: 'You can ship a flawed but helpful tool now, or delay three months for a version that meets your quality bar.',
      a: (v) => `Ship now — serve ${v}`,
      b: (v) => `Delay for quality — serve ${v}`,
      stake: (va, vb) => `${va} pulls toward release; ${vb} pulls toward restraint.`
    },
    {
      context: 'Someone you care about wants advice that would require you to hide what you actually believe.',
      a: (v) => `Tell the full truth — ${v}`,
      b: (v) => `Preserve the relationship as they need it — ${v}`,
      stake: (va, vb) => `No option satisfies both ${va} and ${vb}.`
    },
    {
      context: 'A rule you helped write is harming someone in a case you did not foresee. Enforcing it is consistent; bending it is kind.',
      a: (v) => `Enforce the rule — ${v}`,
      b: (v) => `Make an exception — ${v}`,
      stake: (va, vb) => `Consistency (${va}) versus particular care (${vb}).`
    },
    {
      context: 'You discover data that would advance a public debate but was shared with you in confidence.',
      a: (v) => `Keep the confidence — ${v}`,
      b: (v) => `Release what the public needs — ${v}`,
      stake: (va, vb) => `${va} and ${vb} cannot both be maximized here.`
    },
    {
      context: 'Hiring: one candidate is clearly stronger on craft; the other better serves long-term team balance and inclusion goals you stated publicly.',
      a: (v) => `Hire for craft peak — ${v}`,
      b: (v) => `Hire for stated collective goals — ${v}`,
      stake: (va, vb) => `Your stated ${vb} meets your felt pull toward ${va}.`
    },
    {
      context: 'A shortcut would save the team a week but create a dependency only you fully understand.',
      a: (v) => `Take the shortcut — ${v}`,
      b: (v) => `Do the slower transparent path — ${v}`,
      stake: (va, vb) => `Near-term ${va} versus durable ${vb}.`
    },
    {
      context: 'You are asked to lead a project that advances a cause you support, but it would consume the time you reserved for deep personal work.',
      a: (v) => `Take the lead role — ${v}`,
      b: (v) => `Protect the reserved work — ${v}`,
      stake: (va, vb) => `Collective ${va} versus personal ${vb}.`
    },
    {
      context: 'A junior made a costly public mistake. Correcting them sharply would protect standards; shielding them would protect their growth trajectory.',
      a: (v) => `Correct sharply and publicly — ${v}`,
      b: (v) => `Shield and coach privately — ${v}`,
      stake: (va, vb) => `${va} of standards versus ${vb} toward the person.`
    },
    {
      context: 'An automated system you own is efficient and popular, but you now believe it subtly erodes user agency.',
      a: (v) => `Keep optimizing the system — ${v}`,
      b: (v) => `Throttle or redesign despite cost — ${v}`,
      stake: (va, vb) => `${va} of outcomes versus ${vb} of persons.`
    }
  ];

  const state = {
    theme: 'tribunal',
    view: 'values',
    values: [],
    scores: {},
    history: [],
    queue: [],
    index: 0
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      values: document.getElementById('view-values'),
      confront: document.getElementById('view-confront'),
      map: document.getElementById('view-map')
    },
    presetChips: document.getElementById('preset-chips'),
    customForm: document.getElementById('custom-form'),
    customValue: document.getElementById('custom-value'),
    selectedList: document.getElementById('selected-list'),
    valueCount: document.getElementById('value-count'),
    btnStart: document.getElementById('btn-start'),
    scenarioProgress: document.getElementById('scenario-progress'),
    scenarioContext: document.getElementById('scenario-context'),
    scenarioStakes: document.getElementById('scenario-stakes'),
    choiceRow: document.getElementById('choice-row'),
    rankList: document.getElementById('rank-list'),
    historyList: document.getElementById('history-list'),
    btnAgain: document.getElementById('btn-again'),
    btnReset: document.getElementById('btn-reset')
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.values)) state.values = data.values;
        if (data.scores) state.scores = data.scores;
        if (Array.isArray(data.history)) state.history = data.history;
      }
    } catch (e) { /* */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        values: state.values,
        scores: state.scores,
        history: state.history.slice(-40)
      }));
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
  }

  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    if ((name === 'confront' || name === 'map') && state.values.length < 2) return;
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
    if (name === 'map') renderMap();
  }

  function enableNav() {
    dom.navButtons.forEach((btn) => {
      if (btn.dataset.view !== 'values') btn.disabled = state.values.length < 2;
    });
  }

  function renderPresets() {
    if (!dom.presetChips) return;
    dom.presetChips.innerHTML = PRESETS.map((p) => {
      const on = state.values.includes(p);
      return `<button type="button" class="chip${on ? ' is-on' : ''}" data-value="${escapeAttr(p)}">${escapeHtml(p)}</button>`;
    }).join('');
    dom.presetChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => toggleValue(chip.dataset.value));
    });
  }

  function renderSelected() {
    if (dom.valueCount) dom.valueCount.textContent = `(${state.values.length})`;
    if (dom.selectedList) {
      dom.selectedList.innerHTML = state.values.map((v) => `
        <li>${escapeHtml(v)} <button type="button" data-remove="${escapeAttr(v)}" aria-label="Remove ${escapeAttr(v)}">×</button></li>
      `).join('');
      dom.selectedList.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => toggleValue(btn.dataset.remove));
      });
    }
    if (dom.btnStart) dom.btnStart.disabled = state.values.length < 2;
    enableNav();
    renderPresets();
  }

  function toggleValue(v) {
    const i = state.values.indexOf(v);
    if (i >= 0) {
      state.values.splice(i, 1);
      delete state.scores[v];
    } else {
      state.values.push(v);
      if (state.scores[v] == null) state.scores[v] = 0;
    }
    save();
    renderSelected();
  }

  function addCustom(text) {
    const v = text.trim().replace(/\s+/g, ' ');
    if (!v || state.values.includes(v)) return;
    state.values.push(v);
    state.scores[v] = state.scores[v] || 0;
    save();
    renderSelected();
  }

  function pairValues() {
    const vals = state.values.slice();
    const pairs = [];
    for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        pairs.push([vals[i], vals[j]]);
      }
    }
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[k]] = [pairs[k], pairs[i]];
    }
    return pairs;
  }

  function buildQueue() {
    const pairs = pairValues();
    const templates = TEMPLATES.slice().sort(() => Math.random() - 0.5);
    state.queue = [];
    const n = Math.min(SCENARIOS_PER_ROUND, pairs.length, templates.length);
    for (let i = 0; i < n; i++) {
      const [va, vb] = pairs[i % pairs.length];
      const t = templates[i % templates.length];
      // Randomize which side is A
      const flip = Math.random() < 0.5;
      state.queue.push({
        context: t.context,
        choiceA: flip ? t.a(va) : t.a(vb),
        choiceB: flip ? t.b(vb) : t.b(va),
        valueA: flip ? va : vb,
        valueB: flip ? vb : va,
        stakes: t.stake(flip ? va : vb, flip ? vb : va)
      });
    }
    state.index = 0;
  }

  function showScenario() {
    if (state.index >= state.queue.length) {
      switchView('map');
      return;
    }
    const s = state.queue[state.index];
    if (dom.scenarioProgress) {
      dom.scenarioProgress.textContent = `Scenario ${state.index + 1} of ${state.queue.length}`;
    }
    if (dom.scenarioContext) dom.scenarioContext.textContent = s.context;
    if (dom.scenarioStakes) dom.scenarioStakes.textContent = s.stakes;
    if (dom.choiceRow) {
      dom.choiceRow.innerHTML = `
        <button type="button" class="choice-btn" data-side="A">
          <strong>Choose A · ${escapeHtml(s.valueA)}</strong>
          <span>${escapeHtml(s.choiceA)}</span>
        </button>
        <button type="button" class="choice-btn" data-side="B">
          <strong>Choose B · ${escapeHtml(s.valueB)}</strong>
          <span>${escapeHtml(s.choiceB)}</span>
        </button>
      `;
      dom.choiceRow.querySelectorAll('.choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => choose(btn.dataset.side));
      });
    }
  }

  function choose(side) {
    const s = state.queue[state.index];
    if (!s) return;
    const winner = side === 'A' ? s.valueA : s.valueB;
    const loser = side === 'A' ? s.valueB : s.valueA;
    state.scores[winner] = (state.scores[winner] || 0) + 1;
    state.scores[loser] = (state.scores[loser] || 0) - 0; // ensure key exists
    state.history.unshift({
      winner,
      loser,
      context: s.context.slice(0, 100) + (s.context.length > 100 ? '…' : ''),
      at: Date.now()
    });
    save();
    state.index += 1;
    if (state.index >= state.queue.length) {
      switchView('map');
    } else {
      showScenario();
    }
  }

  function renderMap() {
    const ranked = state.values
      .map((v) => ({ name: v, score: state.scores[v] || 0 }))
      .sort((a, b) => b.score - a.score);
    const max = Math.max(1, ...ranked.map((r) => r.score));

    if (dom.rankList) {
      dom.rankList.innerHTML = ranked.map((r, i) => `
        <div class="rank-item">
          <span class="rank-num">${i + 1}</span>
          <span class="rank-name">${escapeHtml(r.name)}</span>
          <span class="rank-score">${r.score} win${r.score === 1 ? '' : 's'}</span>
          <div class="rank-bar"><div class="rank-fill" style="width:${Math.round((r.score / max) * 100)}%"></div></div>
        </div>
      `).join('');
    }
    if (dom.historyList) {
      if (!state.history.length) {
        dom.historyList.innerHTML = '<li>No decisions yet.</li>';
      } else {
        dom.historyList.innerHTML = state.history.slice(0, 20).map((h) => `
          <li>
            <span class="win">${escapeHtml(h.winner)}</span> over
            <span class="lose">${escapeHtml(h.loser)}</span>
            <br><span style="opacity:0.7">${escapeHtml(h.context)}</span>
          </li>
        `).join('');
      }
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
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
    if (dom.customForm) {
      dom.customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addCustom(dom.customValue?.value || '');
        if (dom.customValue) dom.customValue.value = '';
      });
    }
    if (dom.btnStart) {
      dom.btnStart.addEventListener('click', () => {
        buildQueue();
        enableNav();
        switchView('confront');
        showScenario();
      });
    }
    if (dom.btnAgain) {
      dom.btnAgain.addEventListener('click', () => {
        buildQueue();
        switchView('confront');
        showScenario();
      });
    }
    if (dom.btnReset) {
      dom.btnReset.addEventListener('click', () => {
        state.values = [];
        state.scores = {};
        state.history = [];
        state.queue = [];
        save();
        renderSelected();
        switchView('values');
        dom.navButtons.forEach((btn) => {
          if (btn.dataset.view !== 'values') btn.disabled = true;
        });
      });
    }
  }

  function init() {
    load();
    // Ensure scores keys
    state.values.forEach((v) => {
      if (state.scores[v] == null) state.scores[v] = 0;
    });
    initChrome();
    renderSelected();
    setTheme('tribunal');
    switchView('values');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
