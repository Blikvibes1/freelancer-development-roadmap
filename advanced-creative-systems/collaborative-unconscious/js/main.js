(() => {
  'use strict';
  const THEMES = ['dream', 'pool', 'ash'];
  const STORAGE = 'commons-fragments-v1';
  const SAMPLE = [
    { id: 'f1', text: 'a door that only opens when two people lean at once', author: 'A', t: Date.now() - 1e6 },
    { id: 'f2', text: 'inventory of sounds the building makes at 3am', author: 'B', t: Date.now() - 9e5 },
    { id: 'f3', text: 'what if the deadline was a kindness', author: 'C', t: Date.now() - 8e5 },
    { id: 'f4', text: 'museum of unfinished apologies', author: 'A', t: Date.now() - 7e5 },
    { id: 'f5', text: 'train window house drawn in breath', author: 'D', t: Date.now() - 5e5 },
    { id: 'f6', text: 'rules that expire when the song ends', author: 'B', t: Date.now() - 3e5 }
  ];
  const BRIDGES = [
    'meets', 'under the same weather as', 'refuses to complete', 'borrows a rib from',
    'dreams beside', 'misreads', 'inherits the silence of', 'collides gently with'
  ];

  const state = { theme: 'dream', fragments: [] };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    fragForm: document.getElementById('frag-form'),
    fragText: document.getElementById('frag-text'),
    fragAuthor: document.getElementById('frag-author'),
    btnSeed: document.getElementById('btn-seed'),
    btnCombine: document.getElementById('btn-combine'),
    comboOut: document.getElementById('combo-out'),
    fragList: document.getElementById('frag-list')
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) state.fragments = JSON.parse(raw) || [];
    } catch (e) { /* */ }
    if (!state.fragments.length) state.fragments = SAMPLE.map((f) => ({ ...f }));
  }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state.fragments.slice(0, 80))); }
    catch (e) { /* */ }
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

  function renderList() {
    if (!dom.fragList) return;
    if (!state.fragments.length) {
      dom.fragList.innerHTML = '<li>Pool is empty.</li>';
      return;
    }
    dom.fragList.innerHTML = state.fragments.slice().reverse().map((f) => `
      <li>
        ${esc(f.text)}
        <span class="who">${esc(f.author || 'anon')} · fragment stays theirs</span>
      </li>
    `).join('');
  }

  function combine() {
    if (state.fragments.length < 2) {
      if (dom.comboOut) dom.comboOut.innerHTML = '<p class="muted">Need at least two fragments.</p>';
      return;
    }
    const i = Math.floor(Math.random() * state.fragments.length);
    let j = Math.floor(Math.random() * state.fragments.length);
    while (j === i) j = Math.floor(Math.random() * state.fragments.length);
    const a = state.fragments[i];
    const b = state.fragments[j];
    const bridge = BRIDGES[Math.floor(Math.random() * BRIDGES.length)];
    if (dom.comboOut) {
      dom.comboOut.innerHTML = `
        <p>“${esc(a.text)}” <em>${esc(bridge)}</em> “${esc(b.text)}”</p>
        <p class="meta">Sources: ${esc(a.author || 'anon')} + ${esc(b.author || 'anon')} · combination is shared; fragments remain attributed</p>
      `;
    }
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function init() {
    load();
    dom.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
    dom.fragForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (dom.fragText?.value || '').trim();
      if (!text) return;
      state.fragments.push({
        id: 'f-' + Date.now(),
        text,
        author: (dom.fragAuthor?.value || '').trim() || 'anon',
        t: Date.now()
      });
      if (dom.fragText) dom.fragText.value = '';
      save();
      renderList();
    });
    dom.btnSeed?.addEventListener('click', () => {
      state.fragments = SAMPLE.map((f) => ({ ...f }));
      save();
      renderList();
    });
    dom.btnCombine?.addEventListener('click', combine);
    setTheme('dream');
    renderList();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
