/**
 * CORPUS — Collective Body Interface
 * Multiple local agents drive one shared organism; coherence is visible.
 */
(() => {
  'use strict';

  const THEMES = ['hive', 'chorus', 'pulse'];
  const AGENT_COLORS = ['--color-a1', '--color-a2', '--color-a3', '--color-a4'];

  const AGENTS = [
    { id: 0, name: 'Alpha', keys: { up: 'w', down: 's', left: 'a', right: 'd' }, colorVar: AGENT_COLORS[0] },
    { id: 1, name: 'Beta', keys: { up: 'i', down: 'k', left: 'j', right: 'l' }, colorVar: AGENT_COLORS[1] },
    { id: 2, name: 'Gamma', keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, colorVar: AGENT_COLORS[2] },
    { id: 3, name: 'Delta', keys: { up: 't', down: 'g', left: 'f', right: 'h' }, colorVar: AGENT_COLORS[3] }
  ];

  const state = {
    theme: 'hive',
    body: { x: 0.5, y: 0.5, vx: 0, vy: 0, radius: 28, trail: [] },
    agents: AGENTS.map((a) => ({
      ...a,
      dx: 0,
      dy: 0,
      active: false,
      force: 0
    })),
    keys: {},
    coherence: 0,
    voiceEnergy: 0,
    micOn: false,
    audio: null,
    animId: null
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    canvas: document.getElementById('body-canvas'),
    agentPads: document.getElementById('agent-pads'),
    coherenceFill: document.getElementById('coherence-fill'),
    coherenceVal: document.getElementById('coherence-val'),
    statAgents: document.getElementById('stat-agents'),
    statAgree: document.getElementById('stat-agree'),
    statLead: document.getElementById('stat-lead'),
    statVoice: document.getElementById('stat-voice'),
    btnMic: document.getElementById('btn-mic'),
    btnReset: document.getElementById('btn-reset')
  };

  let ctx = null;
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
    renderPads();
  }

  function cssColor(varName) {
    return getComputedStyle(document.body).getPropertyValue(varName).trim() || '#888';
  }

  function renderPads() {
    if (!dom.agentPads) return;
    dom.agentPads.innerHTML = state.agents.map((a) => {
      const keys = a.id === 2
        ? '↑ ↓ ← →'
        : [a.keys.up, a.keys.left, a.keys.down, a.keys.right].map((k) => k.toUpperCase()).join(' ');
      return `
        <div class="pad" data-agent="${a.id}" style="--pad-color: var(${a.colorVar})">
          <div class="pad-name">${a.name}</div>
          <div class="pad-keys">${keys}</div>
          <div class="pad-vec" id="pad-vec-${a.id}"></div>
        </div>
      `;
    }).join('');

    // Drag on pads
    dom.agentPads.querySelectorAll('.pad').forEach((pad) => {
      const id = Number(pad.dataset.agent);
      let dragging = false;
      const setFromEvent = (e) => {
        const rect = pad.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let dx = (clientX - cx) / (rect.width / 2);
        let dy = (clientY - cy) / (rect.height / 2);
        const mag = Math.hypot(dx, dy) || 1;
        if (mag > 1) {
          dx /= mag;
          dy /= mag;
        }
        state.agents[id].dx = dx;
        state.agents[id].dy = dy;
        state.agents[id].active = Math.hypot(dx, dy) > 0.08;
      };
      const start = (e) => {
        e.preventDefault();
        dragging = true;
        setFromEvent(e);
      };
      const move = (e) => {
        if (!dragging) return;
        e.preventDefault();
        setFromEvent(e);
      };
      const end = () => {
        dragging = false;
        state.agents[id].dx = 0;
        state.agents[id].dy = 0;
        state.agents[id].active = false;
      };
      pad.addEventListener('mousedown', start);
      pad.addEventListener('mousemove', move);
      pad.addEventListener('mouseup', end);
      pad.addEventListener('mouseleave', end);
      pad.addEventListener('touchstart', start, { passive: false });
      pad.addEventListener('touchmove', move, { passive: false });
      pad.addEventListener('touchend', end);
    });
  }

  function updateAgentsFromKeys() {
    state.agents.forEach((a) => {
      // Don't override active drag
      const pad = dom.agentPads?.querySelector(`[data-agent="${a.id}"]`);
      // Key-based when not solely from drag this frame — merge: keys set vector if any key down
      let dx = 0;
      let dy = 0;
      if (state.keys[a.keys.up]) dy -= 1;
      if (state.keys[a.keys.down]) dy += 1;
      if (state.keys[a.keys.left]) dx -= 1;
      if (state.keys[a.keys.right]) dx += 1;
      if (dx || dy) {
        const mag = Math.hypot(dx, dy);
        a.dx = dx / mag;
        a.dy = dy / mag;
        a.active = true;
      } else if (!pad?.matches(':active')) {
        // Only clear if not mid-drag (drag handlers own state)
        // If no keys and force is key-driven, zero — drag sets active on its own
        if (!a._drag) {
          // keep drag values; if no drag activity recently, zero
        }
      }
      // Simpler: if keys active, keys win; else leave drag values
      if (!(state.keys[a.keys.up] || state.keys[a.keys.down] || state.keys[a.keys.left] || state.keys[a.keys.right])) {
        // drag path already sets dx/dy; if neither, zero when inactive
        if (!a.active && !a._fromDrag) {
          a.dx = 0;
          a.dy = 0;
        }
      }
      a.force = Math.hypot(a.dx, a.dy);
      a.active = a.force > 0.08;
    });
  }

  // Fix agent input: track drag separately
  function wirePadDragFlags() {
    // re-render pads with better drag tracking
    if (!dom.agentPads) return;
    dom.agentPads.querySelectorAll('.pad').forEach((pad) => {
      const id = Number(pad.dataset.agent);
      let dragging = false;
      const setFromEvent = (e) => {
        const rect = pad.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let dx = (clientX - cx) / (rect.width / 2);
        let dy = (clientY - cy) / (rect.height / 2);
        const mag = Math.hypot(dx, dy) || 1;
        if (mag > 1) {
          dx /= mag;
          dy /= mag;
        }
        state.agents[id].dx = dx;
        state.agents[id].dy = dy;
        state.agents[id]._fromDrag = true;
        state.agents[id].active = Math.hypot(dx, dy) > 0.08;
      };
      // Remove old listeners by cloning
      const fresh = pad.cloneNode(true);
      pad.parentNode.replaceChild(fresh, pad);
      fresh.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        setFromEvent(e);
      });
      fresh.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        setFromEvent(e);
      });
      const end = () => {
        dragging = false;
        state.agents[id].dx = 0;
        state.agents[id].dy = 0;
        state.agents[id]._fromDrag = false;
        state.agents[id].active = false;
      };
      fresh.addEventListener('mouseup', end);
      fresh.addEventListener('mouseleave', end);
      fresh.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dragging = true;
        setFromEvent(e);
      }, { passive: false });
      fresh.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        setFromEvent(e);
      }, { passive: false });
      fresh.addEventListener('touchend', end);
    });
  }

  function computeCollective() {
    // Key contributions
    state.agents.forEach((a) => {
      if (a._fromDrag) return;
      let dx = 0;
      let dy = 0;
      if (state.keys[a.keys.up]) dy -= 1;
      if (state.keys[a.keys.down]) dy += 1;
      if (state.keys[a.keys.left]) dx -= 1;
      if (state.keys[a.keys.right]) dx += 1;
      if (dx || dy) {
        const mag = Math.hypot(dx, dy);
        a.dx = dx / mag;
        a.dy = dy / mag;
        a.active = true;
      } else {
        a.dx = 0;
        a.dy = 0;
        a.active = false;
      }
      a.force = Math.hypot(a.dx, a.dy);
    });

    // Also account for drag-active
    state.agents.forEach((a) => {
      if (a._fromDrag) {
        a.force = Math.hypot(a.dx, a.dy);
        a.active = a.force > 0.08;
      }
    });

    const active = state.agents.filter((a) => a.active);
    let sx = 0;
    let sy = 0;
    active.forEach((a) => {
      sx += a.dx;
      sy += a.dy;
    });
    const n = active.length || 1;
    const meanX = sx / n;
    const meanY = sy / n;
    const meanMag = Math.hypot(meanX, meanY);

    // Agreement: how aligned individual vectors are with the mean
    let agree = 0;
    if (active.length >= 2) {
      let sum = 0;
      active.forEach((a) => {
        const dot = a.dx * meanX + a.dy * meanY;
        const am = Math.hypot(a.dx, a.dy) || 1;
        const mm = meanMag || 1;
        sum += Math.max(0, dot / (am * mm));
      });
      agree = sum / active.length;
    } else if (active.length === 1) {
      agree = 0.5; // solo = partial coherence
    } else {
      agree = 0;
    }

    // Coherence blends agreement, participation, and voice
    const participation = active.length / state.agents.length;
    const voiceBoost = Math.min(0.2, state.voiceEnergy * 0.2);
    state.coherence = Math.max(0, Math.min(1, agree * 0.65 + participation * 0.25 + voiceBoost));

    // Leadership: highest force among active
    let lead = null;
    let leadF = 0;
    active.forEach((a) => {
      if (a.force > leadF) {
        leadF = a.force;
        lead = a.name;
      }
    });

    // Physics: net force on body
    const speed = 0.0045 * (0.4 + state.coherence * 1.2);
    // Conflict slows: low agreement damps velocity
    const damp = 0.92 - (1 - agree) * 0.08;
    state.body.vx = state.body.vx * damp + meanX * speed * (active.length ? 1 : 0);
    state.body.vy = state.body.vy * damp + meanY * speed * (active.length ? 1 : 0);
    // Voice energy adds jittery scale pulse later
    state.body.x += state.body.vx;
    state.body.y += state.body.vy;
    state.body.x = Math.max(0.08, Math.min(0.92, state.body.x));
    state.body.y = Math.max(0.08, Math.min(0.92, state.body.y));

    // Trail
    state.body.trail.push({ x: state.body.x, y: state.body.y });
    if (state.body.trail.length > 40) state.body.trail.shift();

    // UI stats
    if (dom.coherenceFill) dom.coherenceFill.style.width = Math.round(state.coherence * 100) + '%';
    if (dom.coherenceVal) dom.coherenceVal.textContent = Math.round(state.coherence * 100) + '%';
    if (dom.statAgents) dom.statAgents.textContent = String(active.length);
    if (dom.statAgree) dom.statAgree.textContent = active.length ? Math.round(agree * 100) + '%' : '—';
    if (dom.statLead) dom.statLead.textContent = lead || 'None';
    if (dom.statVoice) {
      dom.statVoice.textContent = state.micOn
        ? Math.round(state.voiceEnergy * 100) + '%'
        : 'Off';
    }

    // Pad vectors
    state.agents.forEach((a) => {
      const el = document.getElementById('pad-vec-' + a.id);
      const pad = document.querySelector(`.pad[data-agent="${a.id}"]`);
      if (pad) pad.classList.toggle('is-active', a.active);
      if (el) {
        el.textContent = a.active
          ? `${a.dx.toFixed(1)}, ${a.dy.toFixed(1)}`
          : '';
      }
    });

    return { agree, active: active.length };
  }

  function draw() {
    if (!ctx || !w) return;
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#14101a';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Trail
    const accent = cssColor('--color-accent');
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    state.body.trail.forEach((p, i) => {
      const px = p.x * w;
      const py = p.y * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Agent force arrows from body
    const bx = state.body.x * w;
    const by = state.body.y * h;
    state.agents.forEach((a) => {
      if (!a.active) return;
      const col = cssColor(a.colorVar);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      const len = 40 + a.force * 30;
      const ex = bx + a.dx * len;
      const ey = by + a.dy * len;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Body
    const r = state.body.radius * (1 + state.voiceEnergy * 0.25 + state.coherence * 0.15);
    const g = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r);
    g.addColorStop(0, accent);
    g.addColorStop(1, cssColor('--color-bg'));
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55 + state.coherence * 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Coherence ring
    ctx.beginPath();
    ctx.arc(bx, by, r + 10, 0, Math.PI * 2 * Math.max(0.05, state.coherence));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function resize() {
    if (!dom.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = dom.canvas.getBoundingClientRect();
    w = rect.width || 720;
    h = rect.height || 420;
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop() {
    computeCollective();
    draw();
    state.animId = requestAnimationFrame(loop);
  }

  async function toggleMic() {
    if (state.micOn) {
      state.micOn = false;
      state.voiceEnergy = 0;
      if (state.audio && state.audio.stream) {
        state.audio.stream.getTracks().forEach((t) => t.stop());
      }
      state.audio = null;
      if (dom.btnMic) {
        dom.btnMic.textContent = 'Enable voice energy';
        dom.btnMic.classList.remove('is-on');
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const actx = new AudioCtx();
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      state.audio = { actx, analyser, stream, data: new Uint8Array(analyser.frequencyBinCount) };
      state.micOn = true;
      if (dom.btnMic) {
        dom.btnMic.textContent = 'Disable voice energy';
        dom.btnMic.classList.add('is-on');
      }
      const poll = () => {
        if (!state.micOn || !state.audio) return;
        state.audio.analyser.getByteFrequencyData(state.audio.data);
        let sum = 0;
        for (let i = 0; i < state.audio.data.length; i++) sum += state.audio.data[i];
        const avg = sum / state.audio.data.length / 255;
        state.voiceEnergy = state.voiceEnergy * 0.7 + avg * 0.3;
        requestAnimationFrame(poll);
      };
      poll();
    } catch (e) {
      if (dom.btnMic) dom.btnMic.textContent = 'Mic unavailable';
    }
  }

  function resetBody() {
    state.body.x = 0.5;
    state.body.y = 0.5;
    state.body.vx = 0;
    state.body.vy = 0;
    state.body.trail = [];
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    window.addEventListener('keydown', (e) => {
      state.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true;
      // Also map Arrow keys as-is
      if (e.key.startsWith('Arrow')) state.keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
      state.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
      if (e.key.startsWith('Arrow')) state.keys[e.key] = false;
    });
    if (dom.btnMic) dom.btnMic.addEventListener('click', () => toggleMic());
    if (dom.btnReset) dom.btnReset.addEventListener('click', () => resetBody());
  }

  function init() {
    if (dom.canvas) ctx = dom.canvas.getContext('2d');
    initChrome();
    renderPads();
    wirePadDragFlags();
    setTheme('hive');
    resize();
    window.addEventListener('resize', resize);
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
