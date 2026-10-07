/**
 * ATTENTOS — Attention Architecture
 * Models attention from pointer, scroll, and keystroke rhythm.
 * Reshapes UI toward calm / focus / flow without demanding attention.
 */
(() => {
  'use strict';

  const THEMES = ['calm', 'focus', 'flow'];
  const MODES = ['neutral', 'calm', 'focus', 'flow'];

  const state = {
    theme: 'calm',
    mode: 'neutral',
    // Rolling signal scores 0–1
    stillness: 0.5,
    scrollChaos: 0,
    keySteady: 0,
    idleDepth: 0,
    attention: 0.4,
    sessionStart: Date.now(),
    lastPointer: Date.now(),
    lastKey: Date.now(),
    lastScroll: Date.now(),
    keyIntervals: [],
    scrollDeltas: [],
    reducedMotion: false
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    meterFill: document.getElementById('meter-fill'),
    meterMode: document.getElementById('meter-mode'),
    workArea: document.getElementById('work-area'),
    sessionTime: document.getElementById('session-time'),
    signalSummary: document.getElementById('signal-summary'),
    modeCards: document.querySelectorAll('.mode-card')
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

  function setMode(mode) {
    if (!MODES.includes(mode)) return;
    if (state.mode === mode) return;
    state.mode = mode;
    dom.body.setAttribute('data-mode', mode === 'neutral' ? 'calm' : mode);
    if (dom.meterMode) {
      const labels = { neutral: 'Settling…', calm: 'Calm', focus: 'Focus', flow: 'Flow' };
      dom.meterMode.textContent = labels[mode] || mode;
    }
    dom.modeCards.forEach((card) => {
      card.classList.toggle('is-active', card.dataset.mode === mode);
    });
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
  }

  /* Signal collectors */
  function onPointer() {
    state.lastPointer = Date.now();
  }

  function onKey() {
    const now = Date.now();
    const gap = now - state.lastKey;
    state.lastKey = now;
    if (gap < 2000 && gap > 30) {
      state.keyIntervals.push(gap);
      if (state.keyIntervals.length > 20) state.keyIntervals.shift();
    }
  }

  function onScroll(e) {
    const now = Date.now();
    const dt = now - state.lastScroll;
    state.lastScroll = now;
    // Approximate delta intensity
    const intensity = Math.min(1, Math.abs(e.deltaY || 0) / 120);
    state.scrollDeltas.push({ dt, intensity, t: now });
    if (state.scrollDeltas.length > 30) state.scrollDeltas.shift();
  }

  function initSignals() {
    window.addEventListener('mousemove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    if (dom.workArea) {
      dom.workArea.addEventListener('keydown', onKey);
      dom.workArea.addEventListener('input', onKey);
    }
  }

  /* Derive scores */
  function updateScores() {
    const now = Date.now();

    // Stillness: time since last pointer (capped)
    const pointerIdle = (now - state.lastPointer) / 1000;
    state.stillness = Math.min(1, pointerIdle / 12);

    // Idle depth: no keys and little pointer
    const keyIdle = (now - state.lastKey) / 1000;
    state.idleDepth = Math.min(1, Math.min(pointerIdle, keyIdle) / 20);

    // Key steadiness: low variance in intervals = steady
    if (state.keyIntervals.length >= 4) {
      const arr = state.keyIntervals;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
      const cv = Math.sqrt(variance) / (mean || 1); // coefficient of variation
      // Recent typing?
      const recentType = keyIdle < 3;
      state.keySteady = recentType ? Math.max(0, 1 - cv) : state.keySteady * 0.95;
    } else {
      state.keySteady *= 0.98;
    }

    // Scroll chaos: high intensity + irregular timing
    const recentScroll = state.scrollDeltas.filter((s) => now - s.t < 4000);
    if (recentScroll.length >= 3) {
      const avgInt = recentScroll.reduce((s, x) => s + x.intensity, 0) / recentScroll.length;
      const gaps = [];
      for (let i = 1; i < recentScroll.length; i++) {
        gaps.push(recentScroll[i].t - recentScroll[i - 1].t);
      }
      const meanGap = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
      const gapVar = gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / (gaps.length || 1);
      const irregular = Math.min(1, Math.sqrt(gapVar) / 400);
      state.scrollChaos = Math.min(1, avgInt * 0.6 + irregular * 0.4);
    } else {
      state.scrollChaos *= 0.9;
    }

    // Composite attention 0–1 (higher = more engaged/steady)
    // Steady keys raise; chaos lowers; deep idle lowers toward calm protection
    let a = 0.35;
    a += state.keySteady * 0.4;
    a -= state.scrollChaos * 0.25;
    a -= state.idleDepth * 0.2;
    // Mild stillness while typing is good (eyes on work)
    if (state.keySteady > 0.4 && state.stillness > 0.3) a += 0.15;
    state.attention = Math.max(0, Math.min(1, a));
  }

  function chooseMode() {
    // Hysteresis-ish: prefer staying in mode unless clear signal
    const a = state.attention;
    const chaos = state.scrollChaos;
    const idle = state.idleDepth;
    const steady = state.keySteady;

    if (steady > 0.55 && chaos < 0.25 && idle < 0.3) {
      return 'focus';
    }
    if (chaos > 0.35 || (steady > 0.25 && steady < 0.55 && chaos < 0.4 && idle < 0.4)) {
      // exploratory continuous interaction
      if (chaos < 0.55 && idle < 0.5) return 'flow';
    }
    if (idle > 0.45 || a < 0.3) {
      return 'calm';
    }
    return state.mode === 'neutral' ? 'calm' : state.mode;
  }

  function updateUI() {
    if (dom.meterFill) {
      dom.meterFill.style.width = Math.round(state.attention * 100) + '%';
    }
    if (dom.sessionTime) {
      const sec = Math.floor((Date.now() - state.sessionStart) / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      dom.sessionTime.textContent = `Session ${m}:${String(s).padStart(2, '0')}`;
    }
    if (dom.signalSummary) {
      const parts = [];
      if (state.keySteady > 0.4) parts.push('steady keys');
      if (state.scrollChaos > 0.3) parts.push('scroll turbulence');
      if (state.idleDepth > 0.4) parts.push('deep idle');
      if (state.stillness > 0.5 && state.keySteady < 0.2) parts.push('still');
      dom.signalSummary.textContent = 'Signals: ' + (parts.length ? parts.join(' · ') : 'listening');
    }
  }

  function tick() {
    updateScores();
    if (!state.reducedMotion) {
      const next = chooseMode();
      setMode(next);
    }
    updateUI();
  }

  function init() {
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initChrome();
    initSignals();
    setTheme('calm');
    setMode('neutral');
    setInterval(tick, 500);
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
