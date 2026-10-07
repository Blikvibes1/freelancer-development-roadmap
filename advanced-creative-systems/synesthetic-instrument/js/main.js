/**
 * SYNESTHETE — Cross-Sense Instrument
 * Maps text, voice energy, and pointer into synchronized visual + sonic output.
 */
(() => {
  'use strict';

  const THEMES = ['chroma', 'mono', 'infra'];

  const state = {
    theme: 'chroma',
    mode: 'exploratory',
    text: '',
    micOn: false,
    micLevel: 0,
    pointer: { x: 0.5, y: 0.5 },
    sens: { voice: 1, text: 1, pointer: 1 },
    particles: [],
    reducedMotion: false
  };

  const dom = {
    body: document.body,
    canvas: document.getElementById('viz-canvas'),
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    panels: {
      play: document.getElementById('panel-play'),
      map: document.getElementById('panel-map'),
      modes: document.getElementById('panel-modes')
    },
    textInput: document.getElementById('text-input'),
    micToggle: document.getElementById('mic-toggle'),
    micStatus: document.getElementById('mic-status'),
    levelFill: document.getElementById('level-fill'),
    btnStrike: document.getElementById('btn-strike'),
    btnClear: document.getElementById('btn-clear'),
    hudMode: document.getElementById('hud-mode'),
    hudInput: document.getElementById('hud-input'),
    sensVoice: document.getElementById('sens-voice'),
    sensText: document.getElementById('sens-text'),
    sensPointer: document.getElementById('sens-pointer'),
    modeInputs: document.querySelectorAll('input[name="mode"]')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let animId = null;
  let time = 0;

  /* Audio */
  let audioCtx = null;
  let masterGain = null;
  let analyser = null;
  let micStream = null;
  let micAnalyser = null;
  let oscillators = [];
  let audioReady = false;

  /* --------------------------------------------------------------------
     Theme & panels
     -------------------------------------------------------------------- */
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

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });
    dom.modeInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          state.mode = input.value;
          if (dom.hudMode) dom.hudMode.textContent = state.mode === 'performative' ? 'Performative' : 'Exploratory';
        }
      });
    });
    if (dom.sensVoice) dom.sensVoice.addEventListener('input', () => { state.sens.voice = Number(dom.sensVoice.value); });
    if (dom.sensText) dom.sensText.addEventListener('input', () => { state.sens.text = Number(dom.sensText.value); });
    if (dom.sensPointer) dom.sensPointer.addEventListener('input', () => { state.sens.pointer = Number(dom.sensPointer.value); });
  }

  /* --------------------------------------------------------------------
     Audio engine
     -------------------------------------------------------------------- */
  function ensureAudio() {
    if (audioReady) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      masterGain.connect(analyser);
      audioReady = true;
    } catch (e) {
      console.warn('Audio unavailable', e);
    }
  }

  function charToFreq(ch, index) {
    const code = ch.toLowerCase().charCodeAt(0);
    // Map a-z to a musical scale-ish range
    const n = ((code - 97) % 12 + 12) % 12;
    const base = 110 + (index % 4) * 55;
    const semis = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
    return base * Math.pow(2, (semis[n] || 0) / 12);
  }

  function playTextChord(text) {
    ensureAudio();
    if (!audioCtx || !masterGain) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Stop previous soft voices
    oscillators.forEach((o) => {
      try {
        o.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        o.osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) { /* */ }
    });
    oscillators = [];

    const chars = text.replace(/\s/g, '').slice(0, 8).split('');
    if (!chars.length) return;

    const attack = state.mode === 'performative' ? 0.02 : 0.12;
    const sustain = state.mode === 'performative' ? 0.35 : 0.9;
    const level = 0.12 * state.sens.text;

    chars.forEach((ch, i) => {
      const freq = charToFreq(ch, i);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = state.mode === 'performative' ? 'square' : 'sine';
      // Pointer bends pitch
      const bend = 1 + (state.pointer.x - 0.5) * 0.15 * state.sens.pointer;
      osc.frequency.value = freq * bend;
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(masterGain);
      const t0 = audioCtx.currentTime + i * 0.03;
      gain.gain.exponentialRampToValueAtTime(level, t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + sustain);
      osc.start(t0);
      osc.stop(t0 + sustain + 0.05);
      oscillators.push({ osc, gain });
    });

    // Spawn visual particles from text
    spawnBurst(chars.length * 3 + 4, state.pointer.x * w, state.pointer.y * h);
    if (dom.hudInput) dom.hudInput.textContent = text.slice(0, 24) || '—';
  }

  function strikeChord() {
    ensureAudio();
    if (!audioCtx || !masterGain) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const notes = [220, 277.18, 329.63, 440];
    const attack = state.mode === 'performative' ? 0.01 : 0.08;
    const dur = state.mode === 'performative' ? 0.5 : 1.2;

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      const bend = 1 + (state.pointer.x - 0.5) * 0.2 * state.sens.pointer;
      osc.frequency.value = freq * bend;
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(masterGain);
      const t0 = audioCtx.currentTime + i * 0.02;
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
    spawnBurst(24, w / 2, h / 2);
    if (dom.hudInput) dom.hudInput.textContent = 'strike';
  }

  async function startMic() {
    ensureAudio();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        dom.micStatus.textContent = 'Mic not supported';
        state.micOn = false;
        if (dom.micToggle) dom.micToggle.checked = false;
        return;
      }
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(micStream);
      micAnalyser = audioCtx.createAnalyser();
      micAnalyser.fftSize = 256;
      source.connect(micAnalyser);
      // Don't connect mic to speakers
      state.micOn = true;
      dom.micStatus.textContent = 'Mic active';
    } catch (err) {
      dom.micStatus.textContent = 'Permission denied';
      state.micOn = false;
      if (dom.micToggle) dom.micToggle.checked = false;
    }
  }

  function stopMic() {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    micAnalyser = null;
    state.micOn = false;
    state.micLevel = 0;
    if (dom.micStatus) dom.micStatus.textContent = 'Mic off';
    if (dom.levelFill) dom.levelFill.style.width = '0%';
  }

  function updateMicLevel() {
    if (!micAnalyser || !state.micOn) {
      state.micLevel = 0;
      return;
    }
    const data = new Uint8Array(micAnalyser.frequencyBinCount);
    micAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    state.micLevel = Math.min(1, (sum / data.length / 255) * 1.8 * state.sens.voice);
    if (dom.levelFill) dom.levelFill.style.width = (state.micLevel * 100) + '%';
  }

  /* --------------------------------------------------------------------
     Particles / visuals
     -------------------------------------------------------------------- */
  function themePalette() {
    if (state.theme === 'mono') {
      return { primary: [232, 232, 232], secondary: [120, 120, 120], bg: [12, 12, 12] };
    }
    if (state.theme === 'infra') {
      return { primary: [244, 114, 182], secondary: [180, 80, 140], bg: [12, 8, 10] };
    }
    return { primary: [94, 234, 212], secondary: [56, 180, 200], bg: [7, 8, 15] };
  }

  function spawnBurst(count, cx, cy) {
    const pal = themePalette();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4 * (state.mode === 'performative' ? 1.5 : 1);
      state.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        size: 2 + Math.random() * 6,
        hue: pal.primary
      });
    }
    // Cap particles
    if (state.particles.length > 400) {
      state.particles.splice(0, state.particles.length - 400);
    }
  }

  function resize() {
    if (!dom.canvas || !dom.canvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = dom.canvas.parentElement.clientWidth;
    h = dom.canvas.parentElement.clientHeight;
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    dom.canvas.style.width = w + 'px';
    dom.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(ts) {
    time = ts;
    updateMicLevel();

    const pal = themePalette();
    ctx.fillStyle = `rgb(${pal.bg[0]},${pal.bg[1]},${pal.bg[2]})`;
    ctx.fillRect(0, 0, w, h);

    // Ambient field driven by pointer + mic
    const px = state.pointer.x * w;
    const py = state.pointer.y * h;
    const radius = 80 + state.micLevel * 220 * state.sens.voice + (state.text.length * 4);
    const g = ctx.createRadialGradient(px, py, 10, px, py, radius);
    const a = 0.08 + state.micLevel * 0.25;
    g.addColorStop(0, `rgba(${pal.primary[0]},${pal.primary[1]},${pal.primary[2]},${a})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Rings from mic
    if (state.micLevel > 0.05) {
      const rings = state.mode === 'performative' ? 4 : 2;
      for (let i = 0; i < rings; i++) {
        const r = 30 + state.micLevel * 180 + i * 28 + Math.sin(time * 0.005 + i) * 8;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${pal.secondary[0]},${pal.secondary[1]},${pal.secondary[2]},${0.35 - i * 0.08})`;
        ctx.lineWidth = state.mode === 'performative' ? 2 : 1;
        ctx.stroke();
      }
    }

    // Text ribbon
    if (state.text) {
      ctx.save();
      ctx.font = `500 ${Math.max(18, 28 - state.text.length)}px Space Grotesk, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${pal.primary[0]},${pal.primary[1]},${pal.primary[2]},0.7)`;
      const wobble = Math.sin(time * 0.003) * 6 * state.sens.text;
      ctx.fillText(state.text, w / 2 + wobble, h * 0.22);
      ctx.restore();
    }

    // Particles
    if (!state.reducedMotion) {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= p.decay;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue[0]},${p.hue[1]},${p.hue[2]},${p.life * 0.85})`;
        ctx.fill();
      }
    }

    // Mic continuous particles
    if (state.micLevel > 0.12 && Math.random() < state.micLevel) {
      spawnBurst(2, px, py);
    }

    animId = requestAnimationFrame(frame);
  }

  /* --------------------------------------------------------------------
     Inputs
     -------------------------------------------------------------------- */
  function initInputs() {
    if (dom.textInput) {
      let debounce;
      dom.textInput.addEventListener('input', () => {
        state.text = dom.textInput.value;
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          if (state.text.trim()) playTextChord(state.text);
        }, 120);
      });
      dom.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          playTextChord(state.text);
        }
      });
    }

    if (dom.micToggle) {
      dom.micToggle.addEventListener('change', async () => {
        if (dom.micToggle.checked) await startMic();
        else stopMic();
      });
    }

    if (dom.btnStrike) {
      dom.btnStrike.addEventListener('click', () => {
        ensureAudio();
        strikeChord();
      });
    }

    if (dom.btnClear) {
      dom.btnClear.addEventListener('click', () => {
        state.text = '';
        if (dom.textInput) dom.textInput.value = '';
        state.particles = [];
        if (dom.hudInput) dom.hudInput.textContent = '—';
      });
    }

    if (dom.canvas) {
      dom.canvas.addEventListener('pointermove', (e) => {
        const rect = dom.canvas.getBoundingClientRect();
        state.pointer.x = (e.clientX - rect.left) / rect.width;
        state.pointer.y = (e.clientY - rect.top) / rect.height;
      });
      // Click stage also strikes softly in exploratory
      dom.canvas.addEventListener('pointerdown', () => {
        ensureAudio();
        if (state.mode === 'performative') strikeChord();
        else spawnBurst(8, state.pointer.x * w, state.pointer.y * h);
      });
    }
  }

  /* --------------------------------------------------------------------
     Init
     -------------------------------------------------------------------- */
  function init() {
    if (!dom.canvas) return;
    ctx = dom.canvas.getContext('2d');
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initChrome();
    initInputs();
    setTheme('chroma');
    switchPanel('play');
    resize();
    window.addEventListener('resize', resize);
    animId = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
