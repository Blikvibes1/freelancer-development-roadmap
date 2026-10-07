/**
 * AURALIS — Sonic Spatial Browser
 * Navigate a knowledge field primarily through spatialized sound.
 */
(() => {
  'use strict';

  const THEMES = ['void', 'depth', 'signal'];

  // Knowledge nodes in normalized field coordinates (-1..1 x/z plane)
  // pitchHz = category signature; pulse = connection density (Hz of amplitude pulse)
  const NODES = [
    { id: 'n1', label: 'Interface time', blurb: 'Interfaces that span past, present, and future states.', x: -0.6, z: -0.4, pitchHz: 220, pulse: 1.2, cluster: 'concept' },
    { id: 'n2', label: 'Attention models', blurb: 'Behavioral rhythm as a signal for protective UI.', x: -0.3, z: 0.2, pitchHz: 247, pulse: 2.0, cluster: 'concept' },
    { id: 'n3', label: 'Gesture vocabulary', blurb: 'Personal hand languages learned sample by sample.', x: 0.1, z: -0.5, pitchHz: 262, pulse: 1.5, cluster: 'input' },
    { id: 'n4', label: 'Spatial audio', blurb: 'This field — structure heard before it is seen.', x: 0.5, z: 0.1, pitchHz: 294, pulse: 2.5, cluster: 'input' },
    { id: 'n5', label: 'Collective body', blurb: 'Many bodies driving one shared digital entity.', x: 0.7, z: -0.3, pitchHz: 330, pulse: 1.8, cluster: 'social' },
    { id: 'n6', label: 'Value alignment', blurb: 'Playgrounds for testing preference and principle.', x: -0.2, z: 0.6, pitchHz: 349, pulse: 1.0, cluster: 'ethics' },
    { id: 'n7', label: 'Constraint forge', blurb: 'Non-generic limits that open unexpected doors.', x: 0.4, z: 0.55, pitchHz: 392, pulse: 2.2, cluster: 'craft' },
    { id: 'n8', label: 'Material speculation', blurb: 'Poetic matter made visible and dossiered.', x: -0.7, z: 0.35, pitchHz: 440, pulse: 1.4, cluster: 'craft' }
  ];

  const state = {
    theme: 'void',
    listening: false,
    listener: { x: 0, z: 0.7 },
    selected: null,
    audio: null, // { ctx, master, nodes: Map }
    scanTimer: null,
    animId: null,
    keys: {}
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    canvas: document.getElementById('field-canvas'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    btnListen: document.getElementById('btn-listen'),
    btnScan: document.getElementById('btn-scan'),
    btnStop: document.getElementById('btn-stop'),
    nodeDetail: document.getElementById('node-detail')
  };

  let ctx2d = null;
  let w = 0;
  let h = 0;

  function setTheme(name) {
    if (!THEMES.includes(name)) return;
    state.theme = name;
    dom.body.setAttribute('data-theme', name);
    dom.themeButtons.forEach((btn) => {
      const on = btn.dataset.theme === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    drawField();
  }

  function setStatus(text, live) {
    if (dom.statusText) dom.statusText.textContent = text;
    if (dom.statusDot) dom.statusDot.classList.toggle('live', !!live);
  }

  /* —— Audio —— */
  function ensureAudio() {
    if (state.audio) return state.audio;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      setStatus('Web Audio not available in this browser', false);
      return null;
    }
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // Listener orientation: face -Z (into the field)
    if (ctx.listener.positionX) {
      ctx.listener.positionX.value = state.listener.x;
      ctx.listener.positionY.value = 0;
      ctx.listener.positionZ.value = state.listener.z;
      ctx.listener.forwardX.value = 0;
      ctx.listener.forwardY.value = 0;
      ctx.listener.forwardZ.value = -1;
      ctx.listener.upX.value = 0;
      ctx.listener.upY.value = 1;
      ctx.listener.upZ.value = 0;
    } else {
      ctx.listener.setPosition(state.listener.x, 0, state.listener.z);
      ctx.listener.setOrientation(0, 0, -1, 0, 1, 0);
    }

    const nodeMap = new Map();
    NODES.forEach((n) => {
      const osc = ctx.createOscillator();
      osc.type = n.cluster === 'ethics' ? 'triangle' : n.cluster === 'social' ? 'square' : 'sine';
      osc.frequency.value = n.pitchHz;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 0.3;
      panner.maxDistance = 4;
      panner.rolloffFactor = 1.2;
      if (panner.positionX) {
        panner.positionX.value = n.x;
        panner.positionY.value = 0;
        panner.positionZ.value = n.z;
      } else {
        panner.setPosition(n.x, 0, n.z);
      }

      // Gentle pulse via LFO on gain
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = n.pulse;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.12;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.start();
      lfo.start();

      nodeMap.set(n.id, { osc, gain, filter, panner, lfo, lfoGain, baseGain: 0 });
    });

    state.audio = { ctx, master, nodes: nodeMap };
    return state.audio;
  }

  function updateListenerAudio() {
    const a = state.audio;
    if (!a) return;
    const { x, z } = state.listener;
    if (a.ctx.listener.positionX) {
      a.ctx.listener.positionX.value = x;
      a.ctx.listener.positionZ.value = z;
    } else {
      a.ctx.listener.setPosition(x, 0, z);
    }
    // Ambient level by distance to each node
    NODES.forEach((n) => {
      const voice = a.nodes.get(n.id);
      if (!voice) return;
      const dx = n.x - x;
      const dz = n.z - z;
      const dist = Math.hypot(dx, dz);
      // Soft bed while listening (scan overrides briefly)
      const bed = state.listening ? Math.max(0, 0.08 * (1 - dist / 2.2)) : 0;
      if (!voice.scanning) {
        voice.gain.gain.setTargetAtTime(bed, a.ctx.currentTime, 0.08);
      }
      // Distance filter
      const cutoff = 400 + (1 - Math.min(1, dist / 2)) * 3200;
      voice.filter.frequency.setTargetAtTime(cutoff, a.ctx.currentTime, 0.1);
    });
  }

  async function startListening() {
    const a = ensureAudio();
    if (!a) return;
    if (a.ctx.state === 'suspended') await a.ctx.resume();
    state.listening = true;
    if (dom.btnListen) dom.btnListen.disabled = true;
    if (dom.btnScan) dom.btnScan.disabled = false;
    if (dom.btnStop) dom.btnStop.disabled = false;
    setStatus('Listening — move through the field', true);
    updateListenerAudio();
    startAnim();
  }

  function stopListening() {
    state.listening = false;
    if (state.scanTimer) {
      clearTimeout(state.scanTimer);
      state.scanTimer = null;
    }
    if (state.audio) {
      state.audio.nodes.forEach((voice) => {
        voice.scanning = false;
        voice.gain.gain.setTargetAtTime(0, state.audio.ctx.currentTime, 0.05);
      });
    }
    if (dom.btnListen) dom.btnListen.disabled = false;
    if (dom.btnScan) dom.btnScan.disabled = true;
    if (dom.btnStop) dom.btnStop.disabled = true;
    setStatus('Audio idle — press Listen to enter the field', false);
    stopAnim();
    drawField();
  }

  function scanField() {
    if (!state.listening || !state.audio) return;
    const a = state.audio;
    // Sort by azimuth relative to listener (left to right)
    const sorted = NODES.slice().sort((p, q) => {
      const ap = Math.atan2(p.x - state.listener.x, state.listener.z - p.z);
      const aq = Math.atan2(q.x - state.listener.x, state.listener.z - q.z);
      return ap - aq;
    });
    let i = 0;
    setStatus('Scanning field…', true);
    const step = () => {
      if (!state.listening) return;
      if (i >= sorted.length) {
        setStatus('Scan complete — select with Enter or click a node', true);
        updateListenerAudio();
        return;
      }
      const n = sorted[i];
      const voice = a.nodes.get(n.id);
      // Brief signature
      NODES.forEach((other) => {
        const v = a.nodes.get(other.id);
        if (!v) return;
        v.scanning = other.id === n.id;
        v.gain.gain.setTargetAtTime(other.id === n.id ? 0.45 : 0.02, a.ctx.currentTime, 0.03);
      });
      state.selected = n.id;
      showDetail(n);
      drawField();
      i += 1;
      state.scanTimer = setTimeout(step, 420);
    };
    step();
  }

  function selectNearest() {
    let best = null;
    let bestD = Infinity;
    NODES.forEach((n) => {
      const d = Math.hypot(n.x - state.listener.x, n.z - state.listener.z);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    });
    if (best && bestD < 0.85) {
      state.selected = best.id;
      showDetail(best);
      speak(best.label);
      // Auditory highlight
      if (state.audio && state.listening) {
        const voice = state.audio.nodes.get(best.id);
        if (voice) {
          voice.gain.gain.setTargetAtTime(0.5, state.audio.ctx.currentTime, 0.02);
          setTimeout(() => updateListenerAudio(), 350);
        }
      }
      drawField();
    }
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.volume = 0.85;
    window.speechSynthesis.speak(u);
  }

  function showDetail(n) {
    if (!dom.nodeDetail || !n) return;
    dom.nodeDetail.innerHTML = `
      <h4>${escapeHtml(n.label)}</h4>
      <p class="meta">${escapeHtml(n.cluster)} · ${n.pitchHz} Hz · pulse ${n.pulse.toFixed(1)}</p>
      <p>${escapeHtml(n.blurb)}</p>
    `;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* —— Canvas map (secondary) —— */
  function resize() {
    if (!dom.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = dom.canvas.getBoundingClientRect();
    w = rect.width || 640;
    h = rect.height || 400;
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawField();
  }

  function worldToScreen(x, z) {
    // Map -1..1 to canvas with padding
    const pad = 40;
    const sx = pad + ((x + 1) / 2) * (w - pad * 2);
    const sy = pad + ((z + 1) / 2) * (h - pad * 2);
    return { sx, sy };
  }

  function screenToWorld(sx, sy) {
    const pad = 40;
    const x = ((sx - pad) / (w - pad * 2)) * 2 - 1;
    const z = ((sy - pad) / (h - pad * 2)) * 2 - 1;
    return {
      x: Math.max(-1, Math.min(1, x)),
      z: Math.max(-1, Math.min(1, z))
    };
  }

  function drawField() {
    if (!ctx2d || !w) return;
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#0e1218';
    const nodeCol = getComputedStyle(document.body).getPropertyValue('--color-node').trim() || '#6080a0';
    const lisCol = getComputedStyle(document.body).getPropertyValue('--color-listener').trim() || '#40d0c0';
    const selCol = getComputedStyle(document.body).getPropertyValue('--color-selected').trim() || '#e0c040';
    const border = getComputedStyle(document.body).getPropertyValue('--color-border').trim() || '#333';

    ctx2d.fillStyle = bg;
    ctx2d.fillRect(0, 0, w, h);

    // Grid
    ctx2d.strokeStyle = border;
    ctx2d.lineWidth = 1;
    ctx2d.globalAlpha = 0.4;
    for (let i = -1; i <= 1; i += 0.5) {
      const a = worldToScreen(i, -1);
      const b = worldToScreen(i, 1);
      ctx2d.beginPath();
      ctx2d.moveTo(a.sx, a.sy);
      ctx2d.lineTo(b.sx, b.sy);
      ctx2d.stroke();
      const c = worldToScreen(-1, i);
      const d = worldToScreen(1, i);
      ctx2d.beginPath();
      ctx2d.moveTo(c.sx, c.sy);
      ctx2d.lineTo(d.sx, d.sy);
      ctx2d.stroke();
    }
    ctx2d.globalAlpha = 1;

    // Nodes
    NODES.forEach((n) => {
      const { sx, sy } = worldToScreen(n.x, n.z);
      const selected = state.selected === n.id;
      ctx2d.beginPath();
      ctx2d.arc(sx, sy, selected ? 10 : 7, 0, Math.PI * 2);
      ctx2d.fillStyle = selected ? selCol : nodeCol;
      ctx2d.fill();
      if (selected) {
        ctx2d.strokeStyle = selCol;
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.arc(sx, sy, 16, 0, Math.PI * 2);
        ctx2d.stroke();
      }
    });

    // Listener
    const L = worldToScreen(state.listener.x, state.listener.z);
    ctx2d.fillStyle = lisCol;
    ctx2d.beginPath();
    ctx2d.moveTo(L.sx, L.sy - 10);
    ctx2d.lineTo(L.sx + 8, L.sy + 8);
    ctx2d.lineTo(L.sx - 8, L.sy + 8);
    ctx2d.closePath();
    ctx2d.fill();
    // Facing marker (-Z is "up" on screen when z decreases... our z increases downward on screen)
    ctx2d.strokeStyle = lisCol;
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(L.sx, L.sy);
    ctx2d.lineTo(L.sx, L.sy - 18);
    ctx2d.stroke();
  }

  function startAnim() {
    stopAnim();
    const loop = () => {
      // Keyboard movement
      const speed = 0.018;
      let dx = 0;
      let dz = 0;
      if (state.keys.w || state.keys.ArrowUp) dz -= speed;
      if (state.keys.s || state.keys.ArrowDown) dz += speed;
      if (state.keys.a || state.keys.ArrowLeft) dx -= speed;
      if (state.keys.d || state.keys.ArrowRight) dx += speed;
      if (dx || dz) {
        state.listener.x = Math.max(-1, Math.min(1, state.listener.x + dx));
        state.listener.z = Math.max(-1, Math.min(1, state.listener.z + dz));
        updateListenerAudio();
      }
      drawField();
      state.animId = requestAnimationFrame(loop);
    };
    state.animId = requestAnimationFrame(loop);
  }

  function stopAnim() {
    if (state.animId) {
      cancelAnimationFrame(state.animId);
      state.animId = null;
    }
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    if (dom.btnListen) dom.btnListen.addEventListener('click', () => startListening());
    if (dom.btnScan) dom.btnScan.addEventListener('click', () => scanField());
    if (dom.btnStop) dom.btnStop.addEventListener('click', () => stopListening());

    window.addEventListener('keydown', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      state.keys[k] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (state.listening) scanField();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectNearest();
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      state.keys[k] = false;
    });

    if (dom.canvas) {
      dom.canvas.addEventListener('click', (e) => {
        const rect = dom.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        // Click near node → select; else move listener
        const world = screenToWorld(sx, sy);
        let hit = null;
        let hitD = Infinity;
        NODES.forEach((n) => {
          const d = Math.hypot(n.x - world.x, n.z - world.z);
          if (d < 0.15 && d < hitD) {
            hitD = d;
            hit = n;
          }
        });
        if (hit) {
          state.selected = hit.id;
          showDetail(hit);
          if (state.listening) speak(hit.label);
          drawField();
        } else {
          state.listener.x = world.x;
          state.listener.z = world.z;
          updateListenerAudio();
          drawField();
        }
      });
    }
  }

  function init() {
    if (dom.canvas) ctx2d = dom.canvas.getContext('2d');
    initChrome();
    setTheme('void');
    resize();
    window.addEventListener('resize', resize);
    drawField();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
