/**
 * LIVING TYPE — Organism Typography System
 * Letterforms that breathe, mutate, and react while staying legible.
 */
(() => {
  'use strict';

  const THEMES = ['vital', 'spectral', 'mineral'];
  const MODES = ['calm', 'curious', 'aggressive', 'decaying'];

  /* Mode behavior parameters */
  const MODE_PARAMS = {
    calm: {
      breathSpeed: 0.8,
      breathAmp: 0.04,
      drift: 0.3,
      jitter: 0.02,
      mutate: 0.01,
      stiffness: 0.08
    },
    curious: {
      breathSpeed: 1.4,
      breathAmp: 0.06,
      drift: 1.2,
      jitter: 0.08,
      mutate: 0.04,
      stiffness: 0.12
    },
    aggressive: {
      breathSpeed: 3.5,
      breathAmp: 0.1,
      drift: 0.5,
      jitter: 0.18,
      mutate: 0.06,
      stiffness: 0.2
    },
    decaying: {
      breathSpeed: 0.4,
      breathAmp: 0.02,
      drift: 0.15,
      jitter: 0.04,
      mutate: 0.08,
      stiffness: 0.04
    }
  };

  const state = {
    theme: 'vital',
    mode: 'calm',
    text: 'Living Type',
    tracking: 1.1,
    baseSize: 72,
    reactPointer: true,
    reactMic: false,
    reactStrength: 1,
    pointer: { x: -9999, y: -9999 },
    micLevel: 0,
    letters: [],
    reducedMotion: false
  };

  const dom = {
    body: document.body,
    canvas: document.getElementById('type-canvas'),
    hint: document.getElementById('stage-hint'),
    typeInput: document.getElementById('type-input'),
    letterSpacing: document.getElementById('letter-spacing'),
    baseSize: document.getElementById('base-size'),
    navButtons: document.querySelectorAll('.nav-btn'),
    panels: {
      compose: document.getElementById('panel-compose'),
      modes: document.getElementById('panel-modes'),
      react: document.getElementById('panel-react')
    },
    themeButtons: document.querySelectorAll('.theme-btn'),
    modeInputs: document.querySelectorAll('input[name="mode"]'),
    reactPointer: document.getElementById('react-pointer'),
    reactMic: document.getElementById('react-mic'),
    reactStrength: document.getElementById('react-strength'),
    micStatus: document.getElementById('mic-status')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let animId = null;
  let time = 0;
  let audioCtx = null;
  let analyser = null;
  let micStream = null;

  /* ----------------------------------------------------------------------
     Theme
     ---------------------------------------------------------------------- */
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

  function initTheme() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
  }

  /* ----------------------------------------------------------------------
     Panels
     ---------------------------------------------------------------------- */
  function switchPanel(name) {
    Object.entries(dom.panels).forEach(([key, el]) => {
      if (!el) return;
      const on = key === name;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    dom.navButtons.forEach((btn) => {
      const on = btn.dataset.panel === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
  }

  function initNav() {
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });
  }

  /* ----------------------------------------------------------------------
     Color helpers (theme-aware)
     ---------------------------------------------------------------------- */
  function themeColors() {
    if (state.theme === 'spectral') {
      return { fill: '#c4b5fd', glow: 'rgba(167,139,250,0.35)', muted: '#6b6288' };
    }
    if (state.theme === 'mineral') {
      return { fill: '#e8c9a0', glow: 'rgba(212,165,116,0.3)', muted: '#807868' };
    }
    return { fill: '#5eead4', glow: 'rgba(62,207,142,0.35)', muted: '#5a7a6c' };
  }

  /* ----------------------------------------------------------------------
     Letter organism
     ---------------------------------------------------------------------- */
  function Letter(char, index, total) {
    this.char = char;
    this.index = index;
    this.total = total;
    this.x = 0;
    this.y = 0;
    this.homeX = 0;
    this.homeY = 0;
    this.vx = 0;
    this.vy = 0;
    this.scale = 1;
    this.rotation = 0;
    this.opacity = 1;
    this.phase = Math.random() * Math.PI * 2;
    this.mutate = 0;
    this.born = performance.now();
  }

  Letter.prototype.update = function (dt, params, pointer, mic, strength) {
    const t = time * 0.001;
    const breath = Math.sin(t * params.breathSpeed + this.phase) * params.breathAmp;

    // Home-seeking spring
    const dx = this.homeX - this.x;
    const dy = this.homeY - this.y;
    this.vx += dx * params.stiffness;
    this.vy += dy * params.stiffness;

    // Mode drift / jitter
    this.vx += (Math.sin(t * 0.7 + this.phase) * params.drift) * 0.15;
    this.vy += (Math.cos(t * 0.5 + this.phase * 1.3) * params.drift) * 0.1;
    this.vx += (Math.random() - 0.5) * params.jitter;
    this.vy += (Math.random() - 0.5) * params.jitter;

    // Pointer reaction
    if (state.reactPointer && pointer.x > -9000) {
      const pdx = this.x - pointer.x;
      const pdy = this.y - pointer.y;
      const dist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      const radius = 140 * strength;
      if (dist < radius) {
        const force = (1 - dist / radius) * 2.5 * strength;
        // Curious leans in; aggressive / others push away slightly
        const sign = state.mode === 'curious' ? -0.6 : 0.9;
        this.vx += (pdx / dist) * force * sign;
        this.vy += (pdy / dist) * force * sign;
        this.scale += force * 0.02;
      }
    }

    // Mic energy
    if (state.reactMic && mic > 0.02) {
      const pulse = mic * strength * 3;
      this.vx += (Math.random() - 0.5) * pulse;
      this.vy += (Math.random() - 0.5) * pulse;
      this.scale += pulse * 0.04;
    }

    // Damping
    this.vx *= 0.85;
    this.vy *= 0.85;
    this.x += this.vx;
    this.y += this.vy;

    // Scale from breath + clamp
    const targetScale = 1 + breath + this.mutate;
    this.scale += (targetScale - this.scale) * 0.12;
    this.scale = Math.max(0.55, Math.min(1.55, this.scale));

    // Rotation subtle
    this.rotation = Math.sin(t * 0.6 + this.phase) * params.jitter * 8;

    // Mutate over time (decaying mode stronger)
    this.mutate += (Math.random() - 0.5) * params.mutate * 0.02;
    this.mutate *= 0.98;

    // Decaying opacity pulse
    if (state.mode === 'decaying') {
      this.opacity = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.5 + this.phase));
    } else {
      this.opacity += (1 - this.opacity) * 0.08;
    }

    // Birth fade-in
    const age = (performance.now() - this.born) / 400;
    if (age < 1) this.opacity *= Math.min(1, age);
  };

  Letter.prototype.draw = function (ctx, colors, size) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.opacity;

    // Soft glow
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 18 * this.scale;

    ctx.fillStyle = colors.fill;
    ctx.font = `600 ${size}px Syne, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.char, 0, 0);

    ctx.shadowBlur = 0;
    ctx.restore();
  };

  /* ----------------------------------------------------------------------
     Layout letters
     ---------------------------------------------------------------------- */
  function rebuildLetters() {
    const text = state.text || ' ';
    const chars = text.split('');
    const prev = state.letters;
    state.letters = chars.map((ch, i) => {
      // Preserve velocity if same char roughly in place
      const old = prev[i];
      const L = new Letter(ch, i, chars.length);
      if (old && old.char === ch) {
        L.x = old.x;
        L.y = old.y;
        L.vx = old.vx;
        L.vy = old.vy;
        L.scale = old.scale;
        L.phase = old.phase;
        L.born = old.born;
      }
      return L;
    });
    layoutHomes();
    if (dom.hint) {
      dom.hint.classList.toggle('is-hidden', text.trim().length > 0);
    }
  }

  function layoutHomes() {
    if (!w || !h) return;
    const size = state.baseSize;
    // Approximate width using canvas measure
    ctx.save();
    ctx.font = `600 ${size}px Syne, system-ui, sans-serif`;
    let totalW = 0;
    const widths = state.letters.map((L) => {
      if (L.char === ' ') return size * 0.35 * state.tracking;
      const m = ctx.measureText(L.char);
      return (m.width + size * 0.08) * state.tracking;
    });
    widths.forEach((ww) => { totalW += ww; });
    ctx.restore();

    let x = (w - totalW) / 2;
    const y = h * 0.48;
    state.letters.forEach((L, i) => {
      const ww = widths[i];
      L.homeX = x + ww / 2;
      L.homeY = y;
      // First layout snap if still at origin
      if (L.x === 0 && L.y === 0 && performance.now() - L.born < 50) {
        L.x = L.homeX;
        L.y = L.homeY;
      }
      x += ww;
    });
  }

  /* ----------------------------------------------------------------------
     Canvas loop
     ---------------------------------------------------------------------- */
  function resize() {
    if (!dom.canvas) return;
    const parent = dom.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = parent.clientWidth;
    h = parent.clientHeight;
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    dom.canvas.style.width = w + 'px';
    dom.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutHomes();
  }

  function frame(ts) {
    time = ts;
    const params = MODE_PARAMS[state.mode] || MODE_PARAMS.calm;
    const colors = themeColors();
    const dt = 16;

    // Mic level
    if (analyser && state.reactMic) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      state.micLevel = (sum / data.length / 255) || 0;
    } else {
      state.micLevel = 0;
    }

    ctx.clearRect(0, 0, w, h);

    // Soft ambient vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.7);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (!state.reducedMotion) {
      state.letters.forEach((L) => {
        L.update(dt, params, state.pointer, state.micLevel, state.reactStrength);
      });
    } else {
      // Static layout only
      state.letters.forEach((L) => {
        L.x = L.homeX;
        L.y = L.homeY;
        L.scale = 1;
        L.opacity = 1;
        L.rotation = 0;
      });
    }

    state.letters.forEach((L) => {
      if (L.char === ' ') return;
      L.draw(ctx, colors, state.baseSize);
    });

    animId = requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------------------
     Input bindings
     ---------------------------------------------------------------------- */
  function initCompose() {
    if (dom.typeInput) {
      dom.typeInput.addEventListener('input', () => {
        state.text = dom.typeInput.value;
        rebuildLetters();
      });
    }
    if (dom.letterSpacing) {
      dom.letterSpacing.addEventListener('input', () => {
        state.tracking = Number(dom.letterSpacing.value);
        layoutHomes();
      });
    }
    if (dom.baseSize) {
      dom.baseSize.addEventListener('input', () => {
        state.baseSize = Number(dom.baseSize.value);
        layoutHomes();
      });
    }
  }

  function initModes() {
    dom.modeInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) state.mode = input.value;
      });
    });
  }

  function initReact() {
    if (dom.reactPointer) {
      dom.reactPointer.addEventListener('change', () => {
        state.reactPointer = dom.reactPointer.checked;
      });
    }
    if (dom.reactStrength) {
      dom.reactStrength.addEventListener('input', () => {
        state.reactStrength = Number(dom.reactStrength.value);
      });
    }
    if (dom.reactMic) {
      dom.reactMic.addEventListener('change', async () => {
        state.reactMic = dom.reactMic.checked;
        if (state.reactMic) await startMic();
        else stopMic();
      });
    }

    // Pointer tracking on canvas
    if (dom.canvas) {
      dom.canvas.addEventListener('pointermove', (e) => {
        const rect = dom.canvas.getBoundingClientRect();
        state.pointer.x = e.clientX - rect.left;
        state.pointer.y = e.clientY - rect.top;
      });
      dom.canvas.addEventListener('pointerleave', () => {
        state.pointer.x = -9999;
        state.pointer.y = -9999;
      });
    }
  }

  async function startMic() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        dom.micStatus.textContent = 'Mic not supported';
        state.reactMic = false;
        if (dom.reactMic) dom.reactMic.checked = false;
        return;
      }
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      dom.micStatus.textContent = 'Mic active';
    } catch (err) {
      console.warn('Mic error', err);
      dom.micStatus.textContent = 'Mic permission denied';
      state.reactMic = false;
      if (dom.reactMic) dom.reactMic.checked = false;
    }
  }

  function stopMic() {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    analyser = null;
    state.micLevel = 0;
    if (dom.micStatus) dom.micStatus.textContent = 'Mic off';
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  function init() {
    if (!dom.canvas) return;
    ctx = dom.canvas.getContext('2d');
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initTheme();
    initNav();
    initCompose();
    initModes();
    initReact();

    setTheme('vital');
    switchPanel('compose');
    resize();
    rebuildLetters();
    window.addEventListener('resize', resize);

    animId = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
