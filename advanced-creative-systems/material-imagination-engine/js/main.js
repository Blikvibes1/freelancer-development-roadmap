/**
 * SPECULUM — Material Imagination Engine
 * Poetic descriptions → speculative material specimens.
 */
(() => {
  'use strict';

  const THEMES = ['forge', 'lab', 'cabinet'];
  const VIEWS = ['compose', 'specimen', 'dossier'];

  const KEYWORDS = {
    metal: { base: 'metal', hue: 40, sat: 30, shine: 0.85, hardness: 0.8 },
    steel: { base: 'metal', hue: 210, sat: 10, shine: 0.7, hardness: 0.9 },
    gold: { base: 'metal', hue: 45, sat: 70, shine: 0.95, hardness: 0.5 },
    glass: { base: 'glass', hue: 190, sat: 20, shine: 0.9, hardness: 0.7 },
    crystal: { base: 'glass', hue: 260, sat: 40, shine: 0.95, hardness: 0.75 },
    ceramic: { base: 'ceramic', hue: 25, sat: 25, shine: 0.3, hardness: 0.85 },
    clay: { base: 'ceramic', hue: 20, sat: 35, shine: 0.15, hardness: 0.4 },
    fabric: { base: 'textile', hue: 320, sat: 30, shine: 0.2, hardness: 0.15 },
    cloth: { base: 'textile', hue: 200, sat: 20, shine: 0.15, hardness: 0.12 },
    fog: { base: 'vapor', hue: 200, sat: 5, shine: 0.1, hardness: 0.05 },
    smoke: { base: 'vapor', hue: 0, sat: 5, shine: 0.05, hardness: 0.05 },
    wood: { base: 'organic', hue: 30, sat: 40, shine: 0.25, hardness: 0.5 },
    stone: { base: 'stone', hue: 0, sat: 5, shine: 0.2, hardness: 0.9 },
    resin: { base: 'polymer', hue: 170, sat: 40, shine: 0.6, hardness: 0.45 }
  };

  const BEHAVIORS = [
    { re: /soften|soft|melt|yield/i, key: 'responsive', note: 'Softens under stimulus' },
    { re: /harden|cool|rigid|facet/i, key: 'phase', note: 'Hardens when stimulus ends' },
    { re: /remember|memory|linger|fingerprint/i, key: 'memory', note: 'Retains trace of contact' },
    { re: /music|sound|hear|song/i, key: 'acoustic', note: 'Responds to sound' },
    { re: /light|glow|lumin|shine/i, key: 'luminous', note: 'Emits or holds light' },
    { re: /crack|vein|heal|gold/i, key: 'kintsugi', note: 'Ornaments its own fractures' },
    { re: /transparent|opaque|taut|pull/i, key: 'optical', note: 'Optical state depends on tension' },
    { re: /damp|wet|moisture|fog/i, key: 'hydrous', note: 'Maintains residual moisture' },
    { re: /warmth|heat|thermal|touch/i, key: 'thermal', note: 'Thermal imprint of contact' },
    { re: /grow|hair|filament|thread/i, key: 'growth', note: 'Slow structural growth' }
  ];

  const state = {
    theme: 'forge',
    view: 'compose',
    material: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      compose: document.getElementById('view-compose'),
      specimen: document.getElementById('view-specimen'),
      dossier: document.getElementById('view-dossier')
    },
    composeForm: document.getElementById('compose-form'),
    materialPrompt: document.getElementById('material-prompt'),
    canvas: document.getElementById('specimen-canvas'),
    stageCaption: document.getElementById('stage-caption'),
    materialName: document.getElementById('material-name'),
    materialBlurb: document.getElementById('material-blurb'),
    propList: document.getElementById('prop-list'),
    dossierContent: document.getElementById('dossier-content'),
    btnDossier: document.getElementById('btn-dossier'),
    btnNew: document.getElementById('btn-new'),
    btnBackSpecimen: document.getElementById('btn-back-specimen'),
    overlay: document.getElementById('gen-overlay')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let animId = null;
  let time = 0;

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

  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    if ((name === 'specimen' || name === 'dossier') && !state.material) return;
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
    if (name === 'specimen') {
      requestAnimationFrame(() => {
        resize();
        startAnim();
      });
    } else {
      stopAnim();
    }
    if (name === 'dossier') renderDossier();
  }

  function enableViews() {
    dom.navButtons.forEach((btn) => { btn.disabled = false; });
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) switchView(btn.dataset.view);
      });
    });
    document.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (dom.materialPrompt) dom.materialPrompt.value = chip.dataset.prompt || '';
      });
    });
    if (dom.btnDossier) dom.btnDossier.addEventListener('click', () => switchView('dossier'));
    if (dom.btnNew) {
      dom.btnNew.addEventListener('click', () => {
        state.material = null;
        dom.navButtons.forEach((btn) => {
          if (btn.dataset.view !== 'compose') btn.disabled = true;
        });
        switchView('compose');
      });
    }
    if (dom.btnBackSpecimen) {
      dom.btnBackSpecimen.addEventListener('click', () => switchView('specimen'));
    }
  }

  function parseMaterial(text) {
    const lower = text.toLowerCase();
    let base = { base: 'unknown', hue: 30, sat: 25, shine: 0.4, hardness: 0.5 };
    for (const [word, props] of Object.entries(KEYWORDS)) {
      if (lower.includes(word)) {
        base = Object.assign({}, props);
        break;
      }
    }
    const behaviors = [];
    BEHAVIORS.forEach((b) => {
      if (b.re.test(text)) behaviors.push({ key: b.key, note: b.note });
    });
    if (!behaviors.length) {
      behaviors.push({ key: 'inert', note: 'Stable under ordinary conditions' });
    }

    // Name: first noun-ish phrase
    let name = text.split(/[.,—–-]/)[0].trim();
    if (name.length > 48) name = name.slice(0, 45) + '…';
    if (!name) name = 'Unnamed specimen';

    return {
      prompt: text,
      name,
      base: base.base,
      hue: base.hue,
      sat: base.sat,
      shine: base.shine,
      hardness: base.hardness,
      behaviors,
      seed: hashStr(text)
    };
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function imagine() {
    const text = (dom.materialPrompt?.value || '').trim();
    if (!text) return;
    if (dom.overlay) dom.overlay.removeAttribute('hidden');
    await new Promise((r) => setTimeout(r, 700));
    state.material = parseMaterial(text);
    enableViews();
    if (dom.overlay) dom.overlay.setAttribute('hidden', '');
    showSpecimen();
    switchView('specimen');
  }

  function showSpecimen() {
    const m = state.material;
    if (!m) return;
    if (dom.materialName) dom.materialName.textContent = m.name;
    if (dom.materialBlurb) {
      dom.materialBlurb.textContent = m.prompt.length > 160 ? m.prompt.slice(0, 157) + '…' : m.prompt;
    }
    if (dom.propList) {
      dom.propList.innerHTML = `
        <li><strong>Class</strong> — ${m.base}</li>
        <li><strong>Hardness</strong> — ${Math.round(m.hardness * 10)}/10</li>
        <li><strong>Lustre</strong> — ${Math.round(m.shine * 100)}%</li>
        ${m.behaviors.map((b) => `<li><strong>${b.key}</strong> — ${b.note}</li>`).join('')}
      `;
    }
    if (dom.stageCaption) {
      const notes = m.behaviors.map((b) => b.note.toLowerCase()).join('; ');
      dom.stageCaption.textContent = notes;
    }
  }

  function renderDossier() {
    const m = state.material;
    if (!m || !dom.dossierContent) return;
    const uses = [];
    if (m.behaviors.some((b) => b.key === 'memory')) uses.push('Archival interfaces; objects that index human presence');
    if (m.behaviors.some((b) => b.key === 'acoustic')) uses.push('Architecture that responds to performance and silence');
    if (m.behaviors.some((b) => b.key === 'kintsugi')) uses.push('Repair culture; valuing stress history as ornament');
    if (m.behaviors.some((b) => b.key === 'optical')) uses.push('Adaptive privacy surfaces; tension-controlled transparency');
    if (m.behaviors.some((b) => b.key === 'hydrous')) uses.push('Climate-responsive textiles; evaporative cooling membranes');
    if (!uses.length) uses.push('Speculative concept design; narrative props; research prompts');

    const physics = [];
    if (m.base === 'metal') physics.push('Crystalline lattice with stimulus-gated dislocation mobility.');
    if (m.base === 'glass') physics.push('Amorphous solid; optical index modulated by residual strain or charge.');
    if (m.base === 'textile') physics.push('Fiber matrix; porosity and refractive scatter depend on tension and humidity.');
    if (m.base === 'ceramic') physics.push('Sintered body; micro-cracks act as capillary channels for secondary phase.');
    if (m.base === 'vapor') physics.push('Stable aerosol or gel; density gradient maintained by weak intermolecular forces.');
    if (!physics.length) physics.push('Composite regime; properties emerge from multiphase coupling.');

    dom.dossierContent.innerHTML = `
      <div class="dossier-section">
        <h3>Designation</h3>
        <p>${escapeHtml(m.name)}</p>
      </div>
      <div class="dossier-section">
        <h3>Source language</h3>
        <p>${escapeHtml(m.prompt)}</p>
      </div>
      <div class="dossier-section">
        <h3>Physical notes</h3>
        <ul>${physics.map((p) => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="dossier-section">
        <h3>Observed behaviors</h3>
        <ul>${m.behaviors.map((b) => `<li><strong>${b.key}</strong> — ${b.note}</li>`).join('')}</ul>
      </div>
      <div class="dossier-section">
        <h3>Speculative uses</h3>
        <ul>${uses.map((u) => `<li>${u}</li>`).join('')}</ul>
      </div>
      <div class="dossier-section">
        <h3>Balance</h3>
        <p>Plausibility is suggested through material class and physical notes; imaginative freedom lives in the behaviors. Neither pure fantasy nor strict simulation — a middle ground for concept work.</p>
      </div>
    `;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* Canvas specimen */
  function resize() {
    if (!dom.canvas || !dom.canvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = dom.canvas.parentElement.clientWidth;
    h = Math.max(400, dom.canvas.parentElement.clientHeight);
    dom.canvas.width = w * dpr;
    dom.canvas.height = h * dpr;
    dom.canvas.style.width = w + 'px';
    dom.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawSpecimen() {
    if (!ctx || !w || !state.material) return;
    const m = state.material;
    const rng = mulberry32(m.seed);
    const t = time * 0.001;

    // Background
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#1a1612';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.28;

    // Glow
    if (m.shine > 0.5 || m.behaviors.some((b) => b.key === 'luminous')) {
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
      g.addColorStop(0, `hsla(${m.hue}, ${m.sat}%, 60%, 0.25)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // Main body
    const bodySoft = m.behaviors.some((b) => b.key === 'responsive' || b.key === 'hydrous')
      ? 0.15 + Math.sin(t * 1.5) * 0.05
      : 0;

    ctx.save();
    ctx.translate(cx, cy);

    if (m.base === 'vapor' || m.base === 'textile') {
      // Soft cloud / fabric layers
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.3;
        const rr = R * (0.5 + rng() * 0.5 + bodySoft);
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(a) * R * 0.2,
          Math.sin(a) * R * 0.15,
          rr * (0.6 + Math.sin(t + i) * 0.1),
          rr * 0.4,
          a,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(${m.hue}, ${m.sat}%, ${50 + i * 3}%, ${0.12 + m.shine * 0.1})`;
        ctx.fill();
      }
    } else if (m.base === 'glass') {
      // Faceted / translucent
      ctx.beginPath();
      const facets = 6 + Math.floor(m.hardness * 4);
      for (let i = 0; i < facets; i++) {
        const a = (i / facets) * Math.PI * 2 - Math.PI / 2;
        const rr = R * (0.85 + Math.sin(t * 2 + i) * 0.05 * (1 - m.hardness));
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = `hsla(${m.hue}, ${m.sat}%, 70%, 0.35)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${m.hue}, ${m.sat + 10}%, 80%, ${0.4 + m.shine * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Inner light
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${m.hue}, 20%, 90%, 0.15)`;
      ctx.fill();
    } else {
      // Solid body (metal, ceramic, stone, polymer)
      ctx.beginPath();
      ctx.arc(0, 0, R * (1 + bodySoft), 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
      grad.addColorStop(0, `hsl(${m.hue}, ${m.sat}%, ${55 + m.shine * 25}%)`);
      grad.addColorStop(0.6, `hsl(${m.hue}, ${m.sat}%, ${35 + m.shine * 10}%)`);
      grad.addColorStop(1, `hsl(${m.hue}, ${m.sat * 0.7}%, 20%)`);
      ctx.fillStyle = grad;
      ctx.fill();
      if (m.shine > 0.5) {
        ctx.beginPath();
        ctx.ellipse(-R * 0.25, -R * 0.3, R * 0.25, R * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${m.hue}, 20%, 95%, ${m.shine * 0.35})`;
        ctx.fill();
      }
    }

    // Behavior overlays
    if (m.behaviors.some((b) => b.key === 'kintsugi')) {
      ctx.strokeStyle = `hsla(45, 80%, 55%, 0.7)`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo((rng() - 0.5) * R * 1.5, (rng() - 0.5) * R * 1.5);
        ctx.quadraticCurveTo(0, 0, (rng() - 0.5) * R * 1.5, (rng() - 0.5) * R * 1.5);
        ctx.stroke();
      }
    }
    if (m.behaviors.some((b) => b.key === 'memory')) {
      // Fingerprint-like arcs
      ctx.strokeStyle = `hsla(${m.hue}, 30%, 70%, 0.2)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(R * 0.2, R * 0.15, R * (0.3 + i * 0.08), 0.2, Math.PI * 1.2);
        ctx.stroke();
      }
    }
    if (m.behaviors.some((b) => b.key === 'acoustic')) {
      // Sound rings
      const pulse = 0.5 + Math.sin(t * 3) * 0.5;
      ctx.strokeStyle = `hsla(${m.hue}, 40%, 60%, ${0.15 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, R * (1.15 + pulse * 0.1), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function startAnim() {
    stopAnim();
    const loop = (ts) => {
      time = ts;
      drawSpecimen();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
  }

  function stopAnim() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function initCompose() {
    if (dom.composeForm) {
      dom.composeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        imagine();
      });
    }
  }

  function init() {
    if (dom.canvas) ctx = dom.canvas.getContext('2d');
    initChrome();
    initCompose();
    setTheme('forge');
    switchView('compose');
    window.addEventListener('resize', () => {
      if (state.view === 'specimen') resize();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
