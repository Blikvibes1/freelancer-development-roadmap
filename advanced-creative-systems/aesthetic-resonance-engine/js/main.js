(() => {
  'use strict';
  const THEMES = ['resonance', 'gallery', 'void'];
  const AXES = [
    { id: 'restraint', label: 'Restraint ↔ Ornament' },
    { id: 'clarity', label: 'Ambiguity ↔ Clarity' },
    { id: 'warmth', label: 'Cool ↔ Warm' },
    { id: 'scale', label: 'Intimate ↔ Monumental' },
    { id: 'time', label: 'Fleeting ↔ Enduring' }
  ];
  const TASTES = ['brutalist concrete', 'chamber music', 'haiku', 'ink wash', 'brutal honesty in prose', 'ornate baroque', 'field recordings', 'neon noir', 'handmade paper', 'slow cinema'];
  const BANK = [
    { title: 'A single-room exhibition of unfinished clay forms', domain: 'art', stretch: 'restraint + intimate', needs: { restraint: 'low', scale: 'low' } },
    { title: 'Overnight train window as only light source — write 300 words', domain: 'writing', stretch: 'fleeting + ambiguity', needs: { time: 'low', clarity: 'low' } },
    { title: 'Listen to one gamelan cycle at full length, no skip', domain: 'music', stretch: 'enduring + warm', needs: { time: 'high', warmth: 'high' } },
    { title: 'Walk a brutalist campus at dusk; photograph only shadows', domain: 'environment', stretch: 'cool + monumental', needs: { warmth: 'low', scale: 'high' } },
    { title: 'Copy a medieval marginal doodle at 4× scale in charcoal', domain: 'art', stretch: 'ornament + enduring', needs: { restraint: 'high', time: 'high' } },
    { title: 'Read a technical manual as if it were poetry aloud', domain: 'writing', stretch: 'clarity inverted', needs: { clarity: 'high' } },
    { title: 'Sit in a greenhouse for 20 minutes without a phone', domain: 'environment', stretch: 'warm + intimate', needs: { warmth: 'high', scale: 'low' } },
    { title: 'One page of only questions — no statements', domain: 'writing', stretch: 'ambiguity', needs: { clarity: 'low' } },
    { title: 'Playlist of three pieces from cultures you never stream', domain: 'music', stretch: 'unknown warm/cool mix', needs: { warmth: 'mid' } },
    { title: 'Design a room you would hate to live in — then find one redeeming detail', domain: 'art', stretch: 'ornament + monumental', needs: { restraint: 'high', scale: 'high' } }
  ];

  const state = {
    theme: 'resonance',
    axes: Object.fromEntries(AXES.map((a) => [a.id, 50])),
    tastes: new Set(['haiku', 'ink wash', 'slow cinema'])
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    axisList: document.getElementById('axis-list'),
    tasteChips: document.getElementById('taste-chips'),
    btnExpand: document.getElementById('btn-expand'),
    proposals: document.getElementById('proposals')
  };

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

  function renderAxes() {
    if (!dom.axisList) return;
    dom.axisList.innerHTML = AXES.map((a) => `
      <div class="axis-row">
        <div class="axis-label"><span>${a.label}</span><span id="val-${a.id}">${state.axes[a.id]}</span></div>
        <input type="range" min="0" max="100" value="${state.axes[a.id]}" data-axis="${a.id}">
      </div>
    `).join('');
    dom.axisList.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        state.axes[input.dataset.axis] = Number(input.value);
        const el = document.getElementById('val-' + input.dataset.axis);
        if (el) el.textContent = input.value;
      });
    });
  }

  function renderTastes() {
    if (!dom.tasteChips) return;
    dom.tasteChips.innerHTML = TASTES.map((t) => {
      const on = state.tastes.has(t);
      return `<button type="button" class="chip${on ? ' is-on' : ''}" data-t="${t}">${t}</button>`;
    }).join('');
    dom.tasteChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (state.tastes.has(chip.dataset.t)) state.tastes.delete(chip.dataset.t);
        else state.tastes.add(chip.dataset.t);
        renderTastes();
      });
    });
  }

  function band(v) {
    if (v < 35) return 'low';
    if (v > 65) return 'high';
    return 'mid';
  }

  function propose() {
    const profile = Object.fromEntries(AXES.map((a) => [a.id, band(state.axes[a.id])]));
    // Prefer items that stretch underused poles
    scored = BANK.map((item) => {
      let score = 0;
      Object.entries(item.needs || {}).forEach(([axis, need]) => {
        if (profile[axis] !== need) score += 2; // stretch
        else score -= 1; // more of same
      });
      score += Math.random();
      return { item, score };
    }).sort((a, b) => b.score - a.score);

    const picks = scored.slice(0, 4).map((s) => s.item);
    if (!dom.proposals) return;
    dom.proposals.innerHTML = picks.map((p) => `
      <article class="proposal">
        <h3>${esc(p.title)}</h3>
        <p class="why">${esc(p.domain)} — chosen to widen your map, not maximize clicks.</p>
        <p class="stretch">Stretch: ${esc(p.stretch)}</p>
      </article>
    `).join('');
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  let scored;

  function init() {
    dom.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
    renderAxes();
    renderTastes();
    dom.btnExpand?.addEventListener('click', propose);
    setTheme('resonance');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
