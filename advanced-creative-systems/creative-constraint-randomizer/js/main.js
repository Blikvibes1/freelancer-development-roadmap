/**
 * CONSTRAINT FORGE — Productive Limits
 * Tailored, non-generic creative constraints with rating feedback.
 */
(() => {
  'use strict';

  const THEMES = ['forge', 'studio', 'ink'];
  const VIEWS = ['forge', 'history', 'profile'];
  const STORAGE_KEY = 'constraint-forge-v1';

  // Non-cliché constraint banks by domain × difficulty
  const BANK = {
    visual: {
      gentle: [
        { text: 'Use only values darker than 40% lightness — no pure white, no pure black.', why: 'Forces hierarchy through midtones and relationships instead of default extremes.' },
        { text: 'Every type size must be a multiple of 11px. No exceptions.', why: 'Odd base units break autopilot scale choices and surface rhythm consciously.' },
        { text: 'The primary action may not use your brand color.', why: 'Stops “accent = CTA” muscle memory; demands hierarchy by weight and position.' },
        { text: 'No element may touch another. Gaps are load-bearing.', why: 'Makes spacing intentional rather than a residual of packing.' }
      ],
      firm: [
        { text: 'Design the entire composition as if it will only ever be seen in a 3-second glance from three meters away.', why: 'Collapses detail addiction; prioritizes silhouette and one clear signal.' },
        { text: 'You may use only one typeface, and only its italic cut.', why: 'Italic-only strips “regular = body” defaults and forces texture through weight and size alone.' },
        { text: 'Forbid the color you reach for first. Name it, then ban it for this piece.', why: 'Personal comfort colors are often clichés in disguise.' },
        { text: 'Layout must work when the canvas is rotated 90°. Same elements, new order.', why: 'Exposes which structure is content-driven vs. habit-driven.' }
      ],
      severe: [
        { text: 'The piece may contain at most three shapes. Text must serve a distinct job (structure, signal, rest).', why: 'Extreme scarcity turns decoration into decision.' },
        { text: 'Design only with the tools available in a black-and-white photocopier aesthetic — no gradients, no blur, no opacity under 100%.', why: 'Removes modern polish crutches; demands form and contrast.' },
        { text: 'The hierarchy must reverse every 8 seconds in a prototype — what was primary becomes tertiary.', why: 'Tests whether the system can survive re-prioritization without collapse.' },
        { text: 'All text must sit on a single continuous baseline across the whole composition, even when it wraps or breaks.', why: 'Forces alignment as a structural spine, not a local convenience.' }
      ]
    },
    writing: {
      gentle: [
        { text: 'No sentence may begin with “I”, “The”, or “This”.', why: 'Breaks three of the most automatic openings and forces intentional subject choice.' },
        { text: 'Every paragraph must end on a concrete sensory detail.', why: 'Prevents abstract drift; anchors argument in the body.' },
        { text: 'You may not use the word that names your topic until the final paragraph.', why: 'Builds pressure and forces implication over declaration.' },
        { text: 'Limit yourself to words of one or two syllables for the first 200 words.', why: 'Strips ornamental vocabulary; tests whether the idea survives plain speech.' }
      ],
      firm: [
        { text: 'Write the piece as a series of questions only. No declarative sentences.', why: 'Inverts the default mode of assertion; discovery becomes the form.' },
        { text: 'Each section must be exactly 47 words. No more, no fewer.', why: 'Odd fixed length kills filler and forces ruthless selection.' },
        { text: 'The emotional peak of the piece must occur in a subordinate clause.', why: 'Hides the climax in structure; resists melodramatic placement.' },
        { text: 'Ban all metaphors drawn from weather, journeys, or light/dark.', why: 'Three of the most overused figurative fields — removing them demands fresher comparison.' }
      ],
      severe: [
        { text: 'The entire piece must be spoken aloud in under 60 seconds and still carry its full argument.', why: 'Time is a constraint that exposes fluff and structural soft spots.' },
        { text: 'Write only in second person. The reader is the only character.', why: 'Removes authorial comfort of “I” and “they”; implicates the audience.' },
        { text: 'No paragraph may contain more than one verb of being (is, are, was, were).', why: 'Forces active construction; weak “is” stacks are a common default.' },
        { text: 'The last sentence must reframe the first so that its meaning reverses or deepens.', why: 'Demands architectural planning, not linear accumulation.' }
      ]
    },
    product: {
      gentle: [
        { text: 'The primary flow may have at most three steps. Anything beyond is a failure of model, not of UI.', why: 'Pushes simplification upstream into the product concept.' },
        { text: 'No onboarding tooltip. The first screen must teach by use alone.', why: 'Tooltips are often a patch for unclear affordance.' },
        { text: 'Every empty state must offer a single, specific next action — never “nothing here yet”.', why: 'Empty states are product moments, not voids.' },
        { text: 'Remove one setting this week that exists only because a stakeholder once asked for it.', why: 'Settings accumulate as political residue; pruning is design work.' }
      ],
      firm: [
        { text: 'Design the feature so it works for a user who will never open documentation or support.', why: 'Documentation is not a substitute for clarity.' },
        { text: 'The most common error state must be more carefully designed than the success state.', why: 'Errors are where trust is won or lost; success is often over-polished.' },
        { text: 'Ship a version that intentionally does less than the competitor’s equivalent — and name the omission in the UI.', why: 'Honest scope can be a differentiator; hiding limits is a cliché.' },
        { text: 'No dashboard. Present the single most important number or state instead.', why: 'Dashboards often defer prioritization; one number forces a bet.' }
      ],
      severe: [
        { text: 'The product must be fully usable offline after first load. Network is an enhancement, not a requirement.', why: 'Offline-first reorders architecture and surfaces true dependencies.' },
        { text: 'One interaction model for all platforms. No “mobile version” with different logic.', why: 'Divergent models create divergent products under one name.' },
        { text: 'Delete the feature users request most often but use least. Replace it with nothing.', why: 'Requested ≠ valuable; courage is a constraint.' },
        { text: 'The onboarding is a single decision. After that, the product has no modes.', why: 'Modes multiply cognitive load; one decision keeps the system legible.' }
      ]
    },
    music: {
      gentle: [
        { text: 'No piece may use more than five distinct pitches.', why: 'Extreme pitch scarcity forces rhythmic and timbral invention.' },
        { text: 'The loudest moment must be quieter than you think it should be.', why: 'Restrains dynamic cliché of “bigger = climax”.' },
        { text: 'Write only for instruments you cannot play.', why: 'Removes muscle-memory idioms; demands listening over finger habit.' },
        { text: 'Every section must end by subtracting an element, never by adding one.', why: 'Inverts the build-up default; ending becomes removal.' }
      ],
      firm: [
        { text: 'The harmonic rhythm may change only on off-beats.', why: 'Displaces the usual downbeat harmony shifts; creates floating tension.' },
        { text: 'Ban the interval of a perfect fifth for the entire piece.', why: 'Removing the most “stable” interval forces alternative centers.' },
        { text: 'The melody may not repeat a pitch until at least six others have been heard.', why: 'Delays recurrence; stretches memory and expectation.' },
        { text: 'Structure the form after a non-musical process (a recipe, a commute, a conversation).', why: 'Borrows unfamiliar proportion instead of verse-chorus autopilot.' }
      ],
      severe: [
        { text: 'One continuous take. No overdubs, no edits longer than a breath.', why: 'Risk and presence replace production safety nets.' },
        { text: 'The piece must be playable by one person with two hands and no electronics.', why: 'Human-scale constraint as compositional truth.' },
        { text: 'Silence must occupy more duration than sound.', why: 'Makes absence the primary material.' },
        { text: 'Derive all material from a single recorded environmental sound under three seconds long.', why: 'Extreme source limit; transformation becomes the craft.' }
      ]
    },
    code: {
      gentle: [
        { text: 'No function longer than twelve lines. Extract until it fits.', why: 'Forces decomposition; long functions hide mixed concerns.' },
        { text: 'Name every variable as if the reader has never seen the codebase.', why: 'Local clever names are a tax on future readers (including you).' },
        { text: 'Implement the feature twice: once naively, once after deleting the first.', why: 'First solutions are often exploratory; the second can be intentional.' },
        { text: 'Comments may only explain why, never what. If you need what, rename.', why: 'What-comments rot; why-comments survive.' }
      ],
      firm: [
        { text: 'No external dependencies for this module. Standard library only.', why: 'Dependency gravity is a design choice, not a default.' },
        { text: 'The public API may expose at most three functions or methods.', why: 'Tiny surface area forces conceptual clarity underneath.' },
        { text: 'Every error path must be tested before the happy path is considered done.', why: 'Inverts the usual order; reliability becomes primary.' },
        { text: 'Write the README before the implementation. The code must match the README, not the reverse.', why: 'Documentation-first as a design constraint.' }
      ],
      severe: [
        { text: 'Solve it without a loop construct. Recursion, streams, or declarative forms only.', why: 'Removes the most automatic control-flow habit.' },
        { text: 'The system must remain correct if any single pure function is replaced by a slower equivalent.', why: 'Forces isolation and purity where it matters.' },
        { text: 'Ship with the simplest data structure that works. Optimize only after a measured problem.', why: 'Premature structure is a form of over-design.' },
        { text: 'One file. No imports from your own codebase. Everything this feature needs lives here.', why: 'Extreme locality; exposes hidden coupling.' }
      ]
    }
  };

  // Generic clichés to down-weight when avoid is on
  const CLICHE_MARKERS = /only primary colors|no more than three colors|mobile.first|think outside|less is more|user.centric|make it pop/i;

  const state = {
    theme: 'forge',
    view: 'forge',
    history: [],
    current: null,
    preferences: { domains: {}, difficulties: {} }
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      forge: document.getElementById('view-forge'),
      history: document.getElementById('view-history'),
      profile: document.getElementById('view-profile')
    },
    forgeForm: document.getElementById('forge-form'),
    goalText: document.getElementById('goal-text'),
    avoidCliche: document.getElementById('avoid-cliche'),
    resultPanel: document.getElementById('result-panel'),
    historyList: document.getElementById('history-list'),
    profileContent: document.getElementById('profile-content')
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.history) state.history = data.history;
        if (data.preferences) state.preferences = data.preferences;
      }
    } catch (e) { /* */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        history: state.history.slice(-50),
        preferences: state.preferences
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
    if (name === 'history') renderHistory();
    if (name === 'profile') renderProfile();
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  function pickConstraint(domain, difficulty, avoidCliche, goal) {
    const pool = (BANK[domain] && BANK[domain][difficulty]) || BANK.visual.gentle;
    // Prefer constraints not recently used
    const recentTexts = new Set(state.history.slice(-8).map((h) => h.text));
    let candidates = pool.filter((c) => !recentTexts.has(c.text));
    if (!candidates.length) candidates = pool.slice();

    if (avoidCliche) {
      candidates = candidates.filter((c) => !CLICHE_MARKERS.test(c.text));
      if (!candidates.length) candidates = pool.slice();
    }

    // Soft bias from preferences (higher rated domains/difficulties)
    const domainBoost = state.preferences.domains[domain] || 0;
    const diffBoost = state.preferences.difficulties[difficulty] || 0;

    // Goal keyword light touch: prefer constraints whose why shares a word with goal
    if (goal && goal.length > 3) {
      const gWords = goal.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      candidates = candidates.slice().sort((a, b) => {
        const score = (c) => {
          let s = 0;
          gWords.forEach((w) => {
            if (c.text.toLowerCase().includes(w) || c.why.toLowerCase().includes(w)) s += 1;
          });
          return s;
        };
        return score(b) - score(a);
      });
    }

    // Weighted random among top half
    const top = candidates.slice(0, Math.max(2, Math.ceil(candidates.length / 2)));
    const idx = Math.floor(Math.random() * top.length);
    const chosen = top[idx];

    return {
      text: chosen.text,
      why: chosen.why,
      domain,
      difficulty,
      goal: goal || '',
      rating: null,
      at: new Date().toISOString(),
      id: 'c-' + Date.now()
    };
  }

  function showResult(c) {
    state.current = c;
    if (!dom.resultPanel) return;
    dom.resultPanel.innerHTML = `
      <p class="result-domain">${escapeHtml(c.domain)} · ${escapeHtml(c.difficulty)}${c.goal ? ' · ' + escapeHtml(c.goal) : ''}</p>
      <p class="result-text">${escapeHtml(c.text)}</p>
      <p class="result-why">${escapeHtml(c.why)}</p>
      <div class="rate-row">
        <span>Rate usefulness</span>
        ${[1, 2, 3, 4, 5].map((n) =>
          `<button type="button" class="rate-btn" data-rate="${n}" aria-label="Rate ${n}">${n}</button>`
        ).join('')}
      </div>
    `;
    dom.resultPanel.querySelectorAll('.rate-btn').forEach((btn) => {
      btn.addEventListener('click', () => rate(Number(btn.dataset.rate)));
    });
  }

  function rate(n) {
    if (!state.current) return;
    state.current.rating = n;
    // Update preferences
    const d = state.current.domain;
    const diff = state.current.difficulty;
    state.preferences.domains[d] = (state.preferences.domains[d] || 0) + (n - 3);
    state.preferences.difficulties[diff] = (state.preferences.difficulties[diff] || 0) + (n - 3);

    const existing = state.history.findIndex((h) => h.id === state.current.id);
    if (existing >= 0) state.history[existing] = state.current;
    else state.history.unshift(state.current);

    save();

    dom.resultPanel.querySelectorAll('.rate-btn').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.rate) === n);
    });
  }

  function renderHistory() {
    if (!dom.historyList) return;
    const rated = state.history.filter((h) => h.rating != null);
    if (!rated.length) {
      dom.historyList.innerHTML = '<p class="empty-hint">No rated constraints yet.</p>';
      return;
    }
    dom.historyList.innerHTML = rated.map((h) => `
      <article class="hist-card">
        <p class="hist-meta">${escapeHtml(h.domain)} · ${escapeHtml(h.difficulty)} · ${new Date(h.at).toLocaleDateString()}</p>
        <p class="hist-text">${escapeHtml(h.text)}</p>
        <p class="hist-rating">${'●'.repeat(h.rating)}${'○'.repeat(5 - h.rating)}</p>
      </article>
    `).join('');
  }

  function renderProfile() {
    if (!dom.profileContent) return;
    const rated = state.history.filter((h) => h.rating != null);
    if (rated.length < 1) {
      dom.profileContent.innerHTML = '<p class="empty-hint">Rate a few constraints to build a profile.</p>';
      return;
    }
    const avg = rated.reduce((s, h) => s + h.rating, 0) / rated.length;
    const byDomain = {};
    rated.forEach((h) => {
      if (!byDomain[h.domain]) byDomain[h.domain] = [];
      byDomain[h.domain].push(h.rating);
    });
    const domainLines = Object.entries(byDomain).map(([d, arr]) => {
      const a = (arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1);
      return `<li>${escapeHtml(d)} — avg ${a} (${arr.length} rated)</li>`;
    }).join('');

    const top = rated.filter((h) => h.rating >= 4).slice(0, 3);
    const topLines = top.map((h) => `<li>${escapeHtml(h.text.slice(0, 80))}${h.text.length > 80 ? '…' : ''}</li>`).join('')
      || '<li>None yet rated 4+</li>';

    dom.profileContent.innerHTML = `
      <h3>Overview</h3>
      <p>${rated.length} rated · average usefulness ${avg.toFixed(1)} / 5</p>
      <h3>By domain</h3>
      <ul>${domainLines}</ul>
      <h3>High-rated examples</h3>
      <ul>${topLines}</ul>
      <h3>How this shapes the forge</h3>
      <p>Domains and difficulties you rate highly get a soft preference in future draws. Recently used constraints are avoided. Cliché filters stay on when you request them.</p>
    `;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function initForge() {
    if (!dom.forgeForm) return;
    dom.forgeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const domain = document.querySelector('input[name="domain"]:checked')?.value || 'visual';
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'gentle';
      const goal = (dom.goalText?.value || '').trim();
      const avoid = !!dom.avoidCliche?.checked;
      const c = pickConstraint(domain, difficulty, avoid, goal);
      showResult(c);
    });
  }

  function init() {
    load();
    initChrome();
    initForge();
    setTheme('forge');
    switchView('forge');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
