(() => {
  'use strict';
  const THEMES = ['ember', 'frost', 'soil'];
  const STORAGE = 'ember-mortality-v1';
  const PROMPTS = [
    'Cut 30% without explaining why.',
    'Change the medium or you lose the piece.',
    'Give it away to someone who will not return it.',
    'Finish in one sitting or archive forever.',
    'Rename it after what you are afraid it is.',
    'Remove the cleverest part.',
    'Let a constraint you hate become law for this work.',
    'Document the failure and start a thinner version.'
  ];

  const state = { theme: 'ember', works: [], log: [] };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    workForm: document.getElementById('work-form'),
    workTitle: document.getElementById('work-title'),
    workVitality: document.getElementById('work-vitality'),
    btnTick: document.getElementById('btn-tick'),
    cycleHint: document.getElementById('cycle-hint'),
    pressureLog: document.getElementById('pressure-log'),
    workList: document.getElementById('work-list')
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const d = JSON.parse(raw);
        state.works = d.works || [];
        state.log = d.log || [];
      }
    } catch (e) { /* */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({
        works: state.works,
        log: state.log.slice(0, 30)
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

  function pushLog(msg) {
    state.log.unshift({ t: Date.now(), msg });
    state.log = state.log.slice(0, 30);
    renderLog();
  }

  function renderLog() {
    if (!dom.pressureLog) return;
    dom.pressureLog.innerHTML = state.log.length
      ? state.log.map((l) => `<p>${esc(l.msg)}</p>`).join('')
      : '<p>No cycles yet.</p>';
  }

  function renderWorks() {
    if (!dom.workList) return;
    if (!state.works.length) {
      dom.workList.innerHTML = '<li class="meta">No living works. Admit something unfinished.</li>';
      return;
    }
    dom.workList.innerHTML = state.works.map((w) => {
      const low = w.vitality < 35;
      return `
        <li data-id="${w.id}">
          <div class="title">${esc(w.title)}</div>
          <div class="bar"><div class="fill${low ? ' low' : ''}" style="width:${w.vitality}%"></div></div>
          <div class="meta">Vitality ${w.vitality}% · age ${w.age} cycles${w.prompt ? ' · under pressure' : ''}</div>
          ${w.prompt ? `<p class="meta" style="color:var(--color-danger);margin-top:0.35rem">${esc(w.prompt)}</p>` : ''}
          <button type="button" class="btn-small" data-act="renew">Renew (+20)</button>
          <button type="button" class="btn-small" data-act="release">Release</button>
          <button type="button" class="btn-small" data-act="archive">Archive</button>
        </li>
      `;
    }).join('');
    dom.workList.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('li')?.dataset.id;
        const act = btn.dataset.act;
        const w = state.works.find((x) => x.id === id);
        if (!w) return;
        if (act === 'renew') {
          w.vitality = Math.min(100, w.vitality + 20);
          w.prompt = null;
          pushLog(`Renewed “${w.title}” — vitality restored by adaptation.`);
        } else if (act === 'release') {
          state.works = state.works.filter((x) => x.id !== id);
          pushLog(`Released “${w.title}” — let go as generative loss.`);
        } else if (act === 'archive') {
          state.works = state.works.filter((x) => x.id !== id);
          pushLog(`Archived “${w.title}” — closed, not discarded.`);
        }
        save();
        renderWorks();
      });
    });
  }

  function tick() {
    if (!state.works.length) {
      pushLog('Nothing to age. Admit a work first.');
      return;
    }
    state.works.forEach((w) => {
      w.age += 1;
      const decay = 8 + Math.floor(Math.random() * 12) + Math.min(10, w.age);
      w.vitality = Math.max(0, w.vitality - decay);
      if (w.vitality < 40 && !w.prompt) {
        w.prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        pushLog(`Pressure on “${w.title}”: ${w.prompt}`);
      }
      if (w.vitality <= 0) {
        pushLog(`“${w.title}” collapsed to ash — removed. Stagnation refused.`);
      }
    });
    state.works = state.works.filter((w) => w.vitality > 0);
    if (dom.cycleHint) dom.cycleHint.textContent = 'Cycle advanced. Adapt, release, or archive under pressure.';
    save();
    renderWorks();
    renderLog();
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function init() {
    load();
    dom.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
    dom.workForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (dom.workTitle?.value || '').trim();
      if (!title) return;
      state.works.push({
        id: 'w-' + Date.now(),
        title,
        vitality: Number(dom.workVitality?.value || 70),
        age: 0,
        prompt: null
      });
      if (dom.workTitle) dom.workTitle.value = '';
      pushLog(`Admitted “${title}” into the cycle.`);
      save();
      renderWorks();
    });
    dom.btnTick?.addEventListener('click', tick);
    setTheme('ember');
    renderWorks();
    renderLog();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
