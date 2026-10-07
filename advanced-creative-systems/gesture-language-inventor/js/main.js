/**
 * GESTURA — Gesture Language Inventor
 * Draw gestures, build samples, recognize, map meanings.
 * Pointer-based for reliability; private vocabulary in localStorage.
 */
(() => {
  'use strict';

  const THEMES = ['signal', 'ink', 'void'];
  const VIEWS = ['studio', 'lexicon', 'map'];
  const STORAGE_KEY = 'gestura-lexicon-v1';
  const N_POINTS = 64;

  const state = {
    theme: 'signal',
    view: 'studio',
    lexicon: [], // { id, name, meaning, samples: [points[]], prototype }
    draftSamples: [],
    drawing: false,
    path: [],
    livePath: [],
    liveDrawing: false
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      studio: document.getElementById('view-studio'),
      lexicon: document.getElementById('view-lexicon'),
      map: document.getElementById('view-map')
    },
    pad: document.getElementById('gesture-pad'),
    livePad: document.getElementById('live-pad'),
    mapCanvas: document.getElementById('map-canvas'),
    btnClear: document.getElementById('btn-clear'),
    btnCapture: document.getElementById('btn-capture'),
    padHint: document.getElementById('pad-hint'),
    form: document.getElementById('gesture-form'),
    gName: document.getElementById('g-name'),
    gMeaning: document.getElementById('g-meaning'),
    sampleCount: document.getElementById('sample-count'),
    btnSave: document.getElementById('btn-save'),
    recognizeResult: document.getElementById('recognize-result'),
    lexiconGrid: document.getElementById('lexicon-grid')
  };

  let pctx = null;
  let lctx = null;
  let mctx = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) state.lexicon = data;
      }
    } catch (e) { /* */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lexicon));
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
    redrawPad();
    redrawLive();
  }

  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    state.view = name;
    Object.entries(dom.views).forEach(([key, el]) => {
      if (!el) return;
      const on = key === name;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    dom.navButtons.forEach((btn) => {
      const on = btn.dataset.view === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
    if (name === 'lexicon') renderLexicon();
    if (name === 'map') renderMap();
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  /* Geometry helpers — $1-style */
  function pathLength(pts) {
    let d = 0;
    for (let i = 1; i < pts.length; i++) {
      d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    return d;
  }

  function resample(pts, n) {
    if (pts.length < 2) return pts.slice();
    const I = pathLength(pts) / (n - 1);
    const out = [pts[0].slice()];
    let d = 0;
    let i = 1;
    let prev = pts[0];
    while (i < pts.length && out.length < n) {
      const cur = pts[i];
      const seg = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
      if (d + seg >= I) {
        const t = (I - d) / (seg || 1);
        const nx = prev[0] + t * (cur[0] - prev[0]);
        const ny = prev[1] + t * (cur[1] - prev[1]);
        out.push([nx, ny]);
        prev = [nx, ny];
        d = 0;
      } else {
        d += seg;
        prev = cur;
        i++;
      }
    }
    while (out.length < n) out.push(pts[pts.length - 1].slice());
    return out;
  }

  function centroid(pts) {
    let x = 0, y = 0;
    pts.forEach((p) => { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
  }

  function indicativeAngle(pts) {
    const c = centroid(pts);
    return Math.atan2(pts[0][1] - c[1], pts[0][0] - c[0]);
  }

  function rotateBy(pts, angle) {
    const c = centroid(pts);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return pts.map(([x, y]) => {
      const dx = x - c[0];
      const dy = y - c[1];
      return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos];
    });
  }

  function scaleToSquare(pts, size) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(([x, y]) => {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    });
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = size / Math.max(w, h);
    return pts.map(([x, y]) => [(x - minX) * scale, (y - minY) * scale]);
  }

  function translateToOrigin(pts) {
    const c = centroid(pts);
    return pts.map(([x, y]) => [x - c[0], y - c[1]]);
  }

  function normalize(pts) {
    let p = resample(pts, N_POINTS);
    const ang = indicativeAngle(p);
    p = rotateBy(p, -ang);
    p = scaleToSquare(p, 100);
    p = translateToOrigin(p);
    return p;
  }

  function distance(a, b) {
    let d = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      d += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]);
    }
    return d / n;
  }

  function recognize(pts) {
    if (!state.lexicon.length || pts.length < 4) return null;
    const cand = normalize(pts);
    let best = null;
    let bestDist = Infinity;
    state.lexicon.forEach((g) => {
      const proto = g.prototype || (g.samples[0] && normalize(g.samples[0]));
      if (!proto) return;
      const dist = distance(cand, proto);
      // Also check other samples
      let minD = dist;
      (g.samples || []).forEach((s) => {
        const d = distance(cand, normalize(s));
        if (d < minD) minD = d;
      });
      if (minD < bestDist) {
        bestDist = minD;
        best = { gesture: g, score: minD };
      }
    });
    // Threshold: lower distance = better match
    if (best && bestDist < 35) return best;
    return null;
  }

  /* Drawing */
  function inkColor() {
    return getComputedStyle(document.body).getPropertyValue('--color-ink').trim() || '#50e0c0';
  }

  function bgColor() {
    return getComputedStyle(document.body).getPropertyValue('--color-bg').trim() || '#0a0c12';
  }

  function redrawPad() {
    if (!pctx || !dom.pad) return;
    const w = dom.pad.width;
    const h = dom.pad.height;
    pctx.fillStyle = bgColor();
    pctx.fillRect(0, 0, w, h);
    if (state.path.length > 1) {
      pctx.strokeStyle = inkColor();
      pctx.lineWidth = 3;
      pctx.lineCap = 'round';
      pctx.lineJoin = 'round';
      pctx.beginPath();
      pctx.moveTo(state.path[0][0], state.path[0][1]);
      for (let i = 1; i < state.path.length; i++) {
        pctx.lineTo(state.path[i][0], state.path[i][1]);
      }
      pctx.stroke();
    }
  }

  function redrawLive() {
    if (!lctx || !dom.livePad) return;
    const w = dom.livePad.width;
    const h = dom.livePad.height;
    lctx.fillStyle = bgColor();
    lctx.fillRect(0, 0, w, h);
    if (state.livePath.length > 1) {
      lctx.strokeStyle = inkColor();
      lctx.lineWidth = 2;
      lctx.lineCap = 'round';
      lctx.beginPath();
      lctx.moveTo(state.livePath[0][0], state.livePath[0][1]);
      for (let i = 1; i < state.livePath.length; i++) {
        lctx.lineTo(state.livePath[i][0], state.livePath[i][1]);
      }
      lctx.stroke();
    }
  }

  function padPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
  }

  function bindPad(canvas, getPath, setPath, onEnd, isDrawingKey) {
    const start = (e) => {
      e.preventDefault();
      state[isDrawingKey] = true;
      setPath([padPos(canvas, e)]);
    };
    const move = (e) => {
      if (!state[isDrawingKey]) return;
      e.preventDefault();
      const p = getPath();
      p.push(padPos(canvas, e));
      setPath(p);
      if (canvas === dom.pad) redrawPad();
      else redrawLive();
    };
    const end = () => {
      if (!state[isDrawingKey]) return;
      state[isDrawingKey] = false;
      if (onEnd) onEnd();
    };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
  }

  function updateSampleUI() {
    if (dom.sampleCount) {
      dom.sampleCount.textContent = 'Samples: ' + state.draftSamples.length;
    }
    if (dom.btnSave) {
      dom.btnSave.disabled = state.draftSamples.length < 1;
    }
    if (dom.padHint) {
      if (state.draftSamples.length === 0) {
        dom.padHint.textContent = 'Draw, then capture. Add 2–3 similar samples to strengthen recognition.';
      } else if (state.draftSamples.length < 3) {
        dom.padHint.textContent = 'Good. Add another sample with a similar shape.';
      } else {
        dom.padHint.textContent = 'Strong sample set. Name it and save to the lexicon.';
      }
    }
  }

  function initStudio() {
    if (dom.pad) {
      pctx = dom.pad.getContext('2d');
      bindPad(
        dom.pad,
        () => state.path,
        (p) => { state.path = p; },
        null,
        'drawing'
      );
    }
    if (dom.livePad) {
      lctx = dom.livePad.getContext('2d');
      bindPad(
        dom.livePad,
        () => state.livePath,
        (p) => { state.livePath = p; },
        () => {
          const match = recognize(state.livePath);
          if (dom.recognizeResult) {
            if (match) {
              const g = match.gesture;
              const conf = Math.max(0, Math.round((1 - match.score / 35) * 100));
              dom.recognizeResult.textContent = g.name + (g.meaning ? ' → ' + g.meaning : '') + ' (' + conf + '%)';
            } else {
              dom.recognizeResult.textContent = state.lexicon.length ? 'Unknown' : 'Empty lexicon';
            }
          }
          setTimeout(() => {
            state.livePath = [];
            redrawLive();
          }, 600);
        },
        'liveDrawing'
      );
    }

    if (dom.btnClear) {
      dom.btnClear.addEventListener('click', () => {
        state.path = [];
        redrawPad();
      });
    }
    if (dom.btnCapture) {
      dom.btnCapture.addEventListener('click', () => {
        if (state.path.length < 5) {
          if (dom.padHint) dom.padHint.textContent = 'Draw a longer stroke first.';
          return;
        }
        // Store raw path (normalized on recognize)
        state.draftSamples.push(state.path.map((p) => p.slice()));
        state.path = [];
        redrawPad();
        updateSampleUI();
      });
    }
    if (dom.form) {
      dom.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!state.draftSamples.length) return;
        const name = (dom.gName?.value || '').trim();
        if (!name) return;
        const meaning = (dom.gMeaning?.value || '').trim();
        const samples = state.draftSamples.slice();
        const prototype = normalize(samples[0]);
        state.lexicon.push({
          id: 'g-' + Date.now(),
          name,
          meaning,
          samples,
          prototype
        });
        save();
        state.draftSamples = [];
        if (dom.gName) dom.gName.value = '';
        if (dom.gMeaning) dom.gMeaning.value = '';
        updateSampleUI();
        if (dom.padHint) dom.padHint.textContent = 'Saved “' + name + '”. Invent another or try Live recognize.';
      });
    }
    updateSampleUI();
    redrawPad();
    redrawLive();
  }

  function renderLexicon() {
    if (!dom.lexiconGrid) return;
    if (!state.lexicon.length) {
      dom.lexiconGrid.innerHTML = '<p class="empty-hint">No gestures yet. Invent one in the studio.</p>';
      return;
    }
    dom.lexiconGrid.innerHTML = '';
    state.lexicon.forEach((g) => {
      const card = document.createElement('div');
      card.className = 'lex-card';
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 160;
      card.appendChild(canvas);
      const meta = document.createElement('div');
      meta.className = 'lex-meta';
      meta.innerHTML = `
        <p class="lex-name">${escapeHtml(g.name)}</p>
        <p class="lex-meaning">${escapeHtml(g.meaning || '—')}</p>
        <p class="lex-strength">${g.samples.length} sample${g.samples.length !== 1 ? 's' : ''}</p>
        <button type="button" class="lex-delete" data-id="${g.id}">Remove</button>
      `;
      card.appendChild(meta);
      dom.lexiconGrid.appendChild(card);
      // Draw first sample
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor();
      ctx.fillRect(0, 0, 200, 160);
      const pts = g.samples[0];
      if (pts && pts.length > 1) {
        // Fit into canvas
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pts.forEach(([x, y]) => {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        });
        const pad = 20;
        const scale = Math.min((200 - pad * 2) / (maxX - minX || 1), (160 - pad * 2) / (maxY - minY || 1));
        ctx.strokeStyle = inkColor();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          const px = (x - minX) * scale + pad;
          const py = (y - minY) * scale + pad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      meta.querySelector('.lex-delete')?.addEventListener('click', () => {
        state.lexicon = state.lexicon.filter((x) => x.id !== g.id);
        save();
        renderLexicon();
      });
    });
  }

  function renderMap() {
    if (!dom.mapCanvas) return;
    mctx = dom.mapCanvas.getContext('2d');
    const w = dom.mapCanvas.width;
    const h = dom.mapCanvas.height;
    mctx.fillStyle = bgColor();
    mctx.fillRect(0, 0, w, h);
    if (!state.lexicon.length) {
      mctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-text-subtle').trim();
      mctx.font = '14px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText('Add gestures to see the meaning map', w / 2, h / 2);
      return;
    }
    // Place gestures in a circle by index; size by sample count
    const n = state.lexicon.length;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.32;
    state.lexicon.forEach((g, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * R;
      const y = cy + Math.sin(a) * R;
      const r = 18 + Math.min(12, g.samples.length * 3);
      mctx.beginPath();
      mctx.arc(x, y, r, 0, Math.PI * 2);
      mctx.fillStyle = inkColor();
      mctx.globalAlpha = 0.2;
      mctx.fill();
      mctx.globalAlpha = 1;
      mctx.strokeStyle = inkColor();
      mctx.lineWidth = 1.5;
      mctx.stroke();
      mctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-text').trim();
      mctx.font = '600 12px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText(g.name, x, y + r + 14);
      if (g.meaning) {
        mctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-text-subtle').trim();
        mctx.font = '11px sans-serif';
        mctx.fillText(g.meaning.slice(0, 18), x, y + r + 28);
      }
    });
    // Links between all (shared language field)
    mctx.strokeStyle = inkColor();
    mctx.globalAlpha = 0.08;
    mctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a1 = (i / n) * Math.PI * 2 - Math.PI / 2;
        const a2 = (j / n) * Math.PI * 2 - Math.PI / 2;
        mctx.beginPath();
        mctx.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        mctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
        mctx.stroke();
      }
    }
    mctx.globalAlpha = 1;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function init() {
    load();
    initChrome();
    initStudio();
    setTheme('signal');
    switchView('studio');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
