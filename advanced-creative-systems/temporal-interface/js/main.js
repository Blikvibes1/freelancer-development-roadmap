/**
 * CHRONOS — Temporal Interface
 * Multi-timescale ledger: past / present / future with ripples.
 */
(() => {
  'use strict';

  const THEMES = ['chrono', 'archive', 'signal'];
  const STORAGE_KEY = 'chronos-ledger-v1';
  const TIME_MIN = -5;
  const TIME_MAX = 5;

  const TIME_LABELS = {
    '-5': 'Deep past',
    '-4': 'T−4',
    '-3': 'T−3',
    '-2': 'T−2',
    '-1': 'Recent past',
    '0': 'Present',
    '1': 'Near future',
    '2': 'T+2',
    '3': 'T+3',
    '4': 'T+4',
    '5': 'Far future'
  };

  const state = {
    theme: 'chrono',
    t: 0, // current viewing time −5…5
    // entries: { id, text, bornAt, kind: 'commit'|'annotation', authorTime }
    entries: [],
    seedDone: false
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    timeSlider: document.getElementById('time-slider'),
    timeValue: document.getElementById('time-value'),
    timelineTicks: document.getElementById('timeline-ticks'),
    docBody: document.getElementById('doc-body'),
    docMeta: document.getElementById('doc-meta'),
    addForm: document.getElementById('add-form'),
    entryText: document.getElementById('entry-text'),
    btnAdd: document.getElementById('btn-add'),
    modeHint: document.getElementById('mode-hint'),
    btnReset: document.getElementById('btn-reset')
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.entries) state.entries = data.entries;
        state.seedDone = true;
      }
    } catch (e) { /* */ }
    if (!state.seedDone || !state.entries.length) {
      seed();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: state.entries }));
    } catch (e) { /* */ }
  }

  function seed() {
    state.entries = [
      { id: 'e1', text: 'Ledger opened. Timescales linked.', bornAt: -3, kind: 'commit', authorTime: -3 },
      { id: 'e2', text: 'First present commitment recorded.', bornAt: 0, kind: 'commit', authorTime: 0 },
      { id: 'e3', text: 'Annotation: expect a decision by T+2.', bornAt: 2, kind: 'annotation', authorTime: 0 }
    ];
    state.seedDone = true;
    save();
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

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    if (dom.timelineTicks) {
      const ticks = [];
      for (let i = TIME_MIN; i <= TIME_MAX; i++) {
        ticks.push(`<span>${i === 0 ? '0' : (i > 0 ? '+' + i : i)}</span>`);
      }
      dom.timelineTicks.innerHTML = ticks.join('');
    }
    if (dom.timeSlider) {
      dom.timeSlider.addEventListener('input', () => {
        state.t = Number(dom.timeSlider.value);
        render();
      });
    }
    if (dom.btnReset) {
      dom.btnReset.addEventListener('click', () => {
        if (confirm('Reset the entire timeline?')) {
          seed();
          state.t = 0;
          if (dom.timeSlider) dom.timeSlider.value = '0';
          render();
        }
      });
    }
  }

  /**
   * Visibility rules:
   * - A commit born at time B is visible at view time T if T >= B
   *   (once written, it exists from then on into the future)
   * - An annotation born at future time B is only visible when viewing that future (T === B)
   *   or when viewing present if it was authored from present (ripple preview)
   * - When viewing past, we see commits that had been born by then
   * - Ripple: commits from present appear in future views as "anticipated"
   */
  function visibleEntries(viewT) {
    const list = [];
    state.entries.forEach((e) => {
      if (e.kind === 'commit') {
        if (viewT >= e.bornAt) {
          const cls = viewT === e.bornAt
            ? (e.bornAt === 0 ? 'present' : e.bornAt < 0 ? 'past' : 'future')
            : (viewT > e.bornAt && e.bornAt === 0 && viewT > 0 ? 'ripple' : (e.bornAt < 0 ? 'past' : 'present'));
          list.push({ entry: e, cls });
        }
      } else if (e.kind === 'annotation') {
        // Future annotations: visible at their bornAt, or as ripple when authored from present and viewing present
        if (viewT === e.bornAt) {
          list.push({ entry: e, cls: 'future' });
        } else if (viewT === 0 && e.authorTime === 0 && e.bornAt > 0) {
          list.push({ entry: e, cls: 'ripple' });
        }
      }
    });
    // Sort by bornAt then id
    list.sort((a, b) => {
      if (a.entry.bornAt !== b.entry.bornAt) return a.entry.bornAt - b.entry.bornAt;
      return a.entry.id.localeCompare(b.entry.id);
    });
    return list;
  }

  function render() {
    const t = state.t;
    if (dom.timeValue) {
      dom.timeValue.textContent = TIME_LABELS[String(t)] || ('T' + (t >= 0 ? '+' : '') + t);
    }
    if (dom.docMeta) {
      if (t < 0) dom.docMeta.textContent = 'State at past · read-only echo';
      else if (t === 0) dom.docMeta.textContent = 'State at present · edits ripple forward';
      else dom.docMeta.textContent = 'Projected future · annotations allowed';
    }

    // Input mode
    const canWrite = t >= 0;
    if (dom.entryText) {
      dom.entryText.disabled = !canWrite;
      dom.entryText.placeholder = t < 0
        ? 'Past is read-only…'
        : t === 0
          ? 'Add an entry at the present…'
          : 'Annotate this future moment…';
    }
    if (dom.btnAdd) dom.btnAdd.disabled = !canWrite;

    if (dom.modeHint) {
      if (t < 0) {
        dom.modeHint.innerHTML = 'You are in the <strong>past</strong>. Observe only — history cannot be rewritten from here.';
      } else if (t === 0) {
        dom.modeHint.innerHTML = 'You are in the <strong>present</strong>. Commits write here and appear in all future views.';
      } else {
        dom.modeHint.innerHTML = 'You are in the <strong>future</strong>. Annotations belong to this moment; they do not rewrite the past.';
      }
    }

    if (!dom.docBody) return;
    const visible = visibleEntries(t);
    if (!visible.length) {
      dom.docBody.innerHTML = '<p class="entry-meta" style="opacity:0.6">No entries at this timescale yet.</p>';
      return;
    }
    dom.docBody.innerHTML = visible.map(({ entry, cls }) => {
      const when = entry.bornAt === 0 ? 'present' : (entry.bornAt < 0 ? 'T' + entry.bornAt : 'T+' + entry.bornAt);
      const kind = entry.kind === 'annotation' ? 'annotation' : 'commit';
      return `
        <article class="entry ${cls}">
          <p class="entry-meta">${when} · ${kind}${cls === 'ripple' ? ' · rippled' : ''}</p>
          <p>${escapeHtml(entry.text)}</p>
        </article>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function commit(text) {
    const t = state.t;
    if (t < 0) return;
    const kind = t === 0 ? 'commit' : 'annotation';
    const entry = {
      id: 'e-' + Date.now(),
      text: text.trim(),
      bornAt: t,
      kind,
      authorTime: t === 0 ? 0 : t
    };
    // Present commits are "born" at 0 and visible from 0 onward
    if (t === 0) {
      entry.bornAt = 0;
      entry.kind = 'commit';
      entry.authorTime = 0;
    }
    state.entries.push(entry);
    save();
    render();
  }

  function initForm() {
    if (!dom.addForm) return;
    dom.addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (dom.entryText?.value || '').trim();
      if (!text || state.t < 0) return;
      commit(text);
      if (dom.entryText) dom.entryText.value = '';
    });
  }

  function init() {
    load();
    initChrome();
    initForm();
    setTheme('chrono');
    state.t = 0;
    if (dom.timeSlider) dom.timeSlider.value = '0';
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
