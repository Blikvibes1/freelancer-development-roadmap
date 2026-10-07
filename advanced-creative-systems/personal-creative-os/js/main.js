/**
 * ATELIER — Personal Creative OS
 * Energy rhythms, deep-work protection, reference surfacing, momentum trail.
 */
(() => {
  'use strict';

  const THEMES = ['atelier', 'night', 'paper'];
  const STORAGE = 'atelier-creative-os-v1';

  const state = {
    theme: 'atelier',
    energy: 3,
    logs: [],       // { t, energy }
    refs: [],       // { id, title, note, tag }
    momentum: [],   // { id, text, t }
    focus: null     // { intention, endAt, durationMin }
  };

  let focusTimerId = null;

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    modePill: document.getElementById('mode-pill'),
    energyRow: document.getElementById('energy-row'),
    rhythmCanvas: document.getElementById('rhythm-canvas'),
    rhythmHint: document.getElementById('rhythm-hint'),
    intention: document.getElementById('intention'),
    duration: document.getElementById('duration'),
    btnFocus: document.getElementById('btn-focus'),
    focusActive: document.getElementById('focus-active'),
    focusIntention: document.getElementById('focus-intention'),
    focusTimer: document.getElementById('focus-timer'),
    btnEndFocus: document.getElementById('btn-end-focus'),
    refForm: document.getElementById('ref-form'),
    refTitle: document.getElementById('ref-title'),
    refNote: document.getElementById('ref-note'),
    refTag: document.getElementById('ref-tag'),
    refList: document.getElementById('ref-list'),
    momentumForm: document.getElementById('momentum-form'),
    momentumText: document.getElementById('momentum-text'),
    momentumList: document.getElementById('momentum-list')
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.logs)) state.logs = data.logs.slice(-60);
      if (Array.isArray(data.refs)) state.refs = data.refs;
      if (Array.isArray(data.momentum)) state.momentum = data.momentum.slice(0, 40);
      if (data.energy) state.energy = data.energy;
      if (data.focus && data.focus.endAt > Date.now()) state.focus = data.focus;
    } catch (e) { /* */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({
        logs: state.logs.slice(-60),
        refs: state.refs,
        momentum: state.momentum.slice(0, 40),
        energy: state.energy,
        focus: state.focus
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
    drawRhythm();
  }

  function setMode(mode) {
    dom.body.setAttribute('data-mode', mode);
    if (dom.modePill) {
      dom.modePill.textContent = mode === 'focus' ? 'Focus mode' : 'Open mode';
    }
  }

  function logEnergy(level) {
    state.energy = level;
    state.logs.push({ t: Date.now(), energy: level });
    if (state.logs.length > 60) state.logs = state.logs.slice(-60);
    save();
    renderEnergy();
    drawRhythm();
    renderRefs();
  }

  function renderEnergy() {
    if (!dom.energyRow) return;
    dom.energyRow.querySelectorAll('.energy-btn').forEach((btn) => {
      btn.classList.toggle('is-on', Number(btn.dataset.energy) === state.energy);
    });
  }

  function drawRhythm() {
    const canvas = dom.rhythmCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 320;
    const h = 100;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#161210';
    const accent = getComputedStyle(document.body).getPropertyValue('--color-accent').trim() || '#d4a060';
    const muted = getComputedStyle(document.body).getPropertyValue('--color-text-subtle').trim() || '#807060';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const logs = state.logs.slice(-14);
    if (logs.length < 2) {
      if (dom.rhythmHint) dom.rhythmHint.textContent = 'Log a few energy checks to see your rhythm.';
      ctx.fillStyle = muted;
      ctx.font = '12px "DM Sans", sans-serif';
      ctx.fillText('Not enough data yet', 12, h / 2);
      return;
    }
    if (dom.rhythmHint) {
      const avg = logs.reduce((s, l) => s + l.energy, 0) / logs.length;
      dom.rhythmHint.textContent = `Last ${logs.length} checks · avg ${avg.toFixed(1)}/5`;
    }

    const pad = 12;
    const xAt = (i) => pad + (i / (logs.length - 1)) * (w - pad * 2);
    const yAt = (e) => h - pad - ((e - 1) / 4) * (h - pad * 2);

    ctx.beginPath();
    logs.forEach((l, i) => {
      const x = xAt(i);
      const y = yAt(l.energy);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    logs.forEach((l, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(l.energy), 3, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    });
  }

  function startFocus() {
    const intention = (dom.intention?.value || '').trim() || 'Deep work';
    const mins = Number(dom.duration?.value || 45);
    state.focus = {
      intention,
      endAt: Date.now() + mins * 60 * 1000,
      durationMin: mins
    };
    save();
    setMode('focus');
    if (dom.focusActive) dom.focusActive.hidden = false;
    if (dom.btnFocus) dom.btnFocus.hidden = true;
    if (dom.focusIntention) dom.focusIntention.textContent = intention;
    tickFocus();
    focusTimerId = setInterval(tickFocus, 1000);
  }

  function tickFocus() {
    if (!state.focus) return;
    const left = state.focus.endAt - Date.now();
    if (left <= 0) {
      endFocus(true);
      return;
    }
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    if (dom.focusTimer) {
      dom.focusTimer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  function endFocus(completed) {
    if (focusTimerId) {
      clearInterval(focusTimerId);
      focusTimerId = null;
    }
    if (completed && state.focus) {
      state.momentum.unshift({
        id: 'm-' + Date.now(),
        text: `Focus complete: ${state.focus.intention} (${state.focus.durationMin}m)`,
        t: Date.now()
      });
    }
    state.focus = null;
    save();
    setMode('open');
    if (dom.focusActive) dom.focusActive.hidden = true;
    if (dom.btnFocus) dom.btnFocus.hidden = false;
    renderMomentum();
  }

  function tagForEnergy(energy) {
    if (energy <= 2) return ['rest', 'spark'];
    if (energy >= 4) return ['craft', 'method'];
    return ['craft', 'spark', 'method'];
  }

  function renderRefs() {
    if (!dom.refList) return;
    const prefer = tagForEnergy(state.energy);
    const sorted = state.refs.slice().sort((a, b) => {
      const as = prefer.includes(a.tag) ? 0 : 1;
      const bs = prefer.includes(b.tag) ? 0 : 1;
      return as - bs;
    });
    if (!sorted.length) {
      dom.refList.innerHTML = '<li>No references yet. Add craft, spark, method, or rest items.</li>';
      return;
    }
    dom.refList.innerHTML = sorted.map((r) => {
      const surfaced = prefer.includes(r.tag);
      return `
        <li class="${surfaced ? 'is-surfaced' : ''}">
          <button type="button" data-del="${r.id}" aria-label="Remove">×</button>
          <strong>${escapeHtml(r.title)}</strong>
          ${r.note ? escapeHtml(r.note) : ''}
          <span class="tag">${escapeHtml(r.tag)}${surfaced ? ' · matched' : ''}</span>
        </li>
      `;
    }).join('');
    dom.refList.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.refs = state.refs.filter((r) => r.id !== btn.dataset.del);
        save();
        renderRefs();
      });
    });
  }

  function renderMomentum() {
    if (!dom.momentumList) return;
    if (!state.momentum.length) {
      dom.momentumList.innerHTML = '<li>No marks yet.</li>';
      return;
    }
    dom.momentumList.innerHTML = state.momentum.slice(0, 12).map((m) => {
      const d = new Date(m.t);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return `
        <li>
          <button type="button" data-del="${m.id}" aria-label="Remove">×</button>
          <time>${label}</time>
          ${escapeHtml(m.text)}
        </li>
      `;
    }).join('');
    dom.momentumList.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.momentum = state.momentum.filter((m) => m.id !== btn.dataset.del);
        save();
        renderMomentum();
      });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function init() {
    load();
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    if (dom.energyRow) {
      dom.energyRow.querySelectorAll('.energy-btn').forEach((btn) => {
        btn.addEventListener('click', () => logEnergy(Number(btn.dataset.energy)));
      });
    }
    if (dom.btnFocus) dom.btnFocus.addEventListener('click', startFocus);
    if (dom.btnEndFocus) dom.btnEndFocus.addEventListener('click', () => endFocus(false));
    if (dom.refForm) {
      dom.refForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = (dom.refTitle?.value || '').trim();
        if (!title) return;
        state.refs.unshift({
          id: 'r-' + Date.now(),
          title,
          note: (dom.refNote?.value || '').trim(),
          tag: dom.refTag?.value || 'craft'
        });
        if (dom.refTitle) dom.refTitle.value = '';
        if (dom.refNote) dom.refNote.value = '';
        save();
        renderRefs();
      });
    }
    if (dom.momentumForm) {
      dom.momentumForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (dom.momentumText?.value || '').trim();
        if (!text) return;
        state.momentum.unshift({ id: 'm-' + Date.now(), text, t: Date.now() });
        if (dom.momentumText) dom.momentumText.value = '';
        save();
        renderMomentum();
      });
    }

    setTheme('atelier');
    renderEnergy();
    drawRhythm();
    renderRefs();
    renderMomentum();

    if (state.focus && state.focus.endAt > Date.now()) {
      setMode('focus');
      if (dom.focusActive) dom.focusActive.hidden = false;
      if (dom.btnFocus) dom.btnFocus.hidden = true;
      if (dom.focusIntention) dom.focusIntention.textContent = state.focus.intention;
      tickFocus();
      focusTimerId = setInterval(tickFocus, 1000);
    } else {
      setMode('open');
    }

    window.addEventListener('resize', drawRhythm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
