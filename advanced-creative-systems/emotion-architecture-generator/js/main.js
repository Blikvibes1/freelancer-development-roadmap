/**
 * RESONANT CHAMBERS — Emotion-Driven Architecture Generator
 * Classic script (no modules) for maximum local compatibility.
 */

(() => {
  'use strict';

  /* ========================================================================
     1. CONSTANTS
     ======================================================================== */
  const THEMES = ['liminal', 'hearth', 'fracture'];
  const VIEWS = ['brief', 'chamber', 'atmosphere', 'refine'];

  const GENERATION_MESSAGES = [
    'Listening to the emotional brief…',
    'Mapping feeling to spatial qualities…',
    'Shaping light and enclosure…',
    'Forming circulation and sequence…',
    'The chamber is ready.'
  ];

  const EMOTION_SPATIAL = {
    grief: {
      scale: 0.7, enclosure: 0.85, lightIntensity: 0.35, lightTemp: 0.3,
      verticality: 0.3, fragmentation: 0.2, fogDensity: 0.04,
      colorBias: [0.55, 0.58, 0.7]
    },
    safety: {
      scale: 0.65, enclosure: 0.75, lightIntensity: 0.7, lightTemp: 0.85,
      verticality: 0.25, fragmentation: 0.1, fogDensity: 0.015,
      colorBias: [0.85, 0.75, 0.6]
    },
    anxiety: {
      scale: 0.55, enclosure: 0.9, lightIntensity: 0.55, lightTemp: 0.4,
      verticality: 0.4, fragmentation: 0.8, fogDensity: 0.025,
      colorBias: [0.7, 0.65, 0.75]
    },
    awe: {
      scale: 1.4, enclosure: 0.25, lightIntensity: 0.95, lightTemp: 0.6,
      verticality: 0.95, fragmentation: 0.15, fogDensity: 0.008,
      colorBias: [0.7, 0.78, 0.95]
    },
    longing: {
      scale: 1.1, enclosure: 0.4, lightIntensity: 0.5, lightTemp: 0.55,
      verticality: 0.35, fragmentation: 0.3, fogDensity: 0.03,
      colorBias: [0.65, 0.7, 0.8]
    },
    serenity: {
      scale: 1.0, enclosure: 0.35, lightIntensity: 0.75, lightTemp: 0.65,
      verticality: 0.3, fragmentation: 0.05, fogDensity: 0.012,
      colorBias: [0.75, 0.8, 0.78]
    }
  };

  const SECONDARY_MODS = {
    none:    { lightTemp: 0, fragmentation: 0, fogDensity: 0 },
    hope:    { lightTemp: 0.15, fragmentation: -0.1, fogDensity: -0.005 },
    memory:  { lightTemp: -0.05, fragmentation: 0.1, fogDensity: 0.008 },
    tension: { lightTemp: -0.1, fragmentation: 0.25, fogDensity: 0.005 },
    warmth:  { lightTemp: 0.2, fragmentation: -0.05, fogDensity: -0.003 },
    void:    { lightTemp: -0.15, fragmentation: 0.05, fogDensity: 0.015 }
  };

  /* ========================================================================
     2. STATE
     ======================================================================== */
  const state = {
    currentTheme: 'liminal',
    currentView: 'brief',
    brief: null,
    spatial: null,
    isGenerating: false
  };

  /* ========================================================================
     3. DOM
     ======================================================================== */
  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      brief: document.getElementById('view-brief'),
      chamber: document.getElementById('view-chamber'),
      atmosphere: document.getElementById('view-atmosphere'),
      refine: document.getElementById('view-refine')
    },
    briefForm: document.getElementById('brief-form'),
    intensitySlider: document.getElementById('intensity'),
    intensityValue: document.getElementById('intensity-value'),
    overlay: document.getElementById('generation-overlay'),
    generationStatus: document.getElementById('generation-status'),
    generationBar: document.querySelector('.generation-bar'),
    chamberCanvas: document.getElementById('chamber-canvas'),
    hudEmotion: document.getElementById('hud-emotion'),
    atmosphereControls: document.getElementById('atmosphere-controls'),
    refineContent: document.getElementById('refine-content')
  };

  /* ========================================================================
     4. THEME
     ======================================================================== */
  function setTheme(name) {
    if (!THEMES.includes(name)) return;
    state.currentTheme = name;
    dom.body.setAttribute('data-theme', name);
    dom.themeButtons.forEach((btn) => {
      const active = btn.dataset.theme === name;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    if (chamber.ready) chamber.applyThemeColors();
  }

  function initThemeSwitcher() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
  }

  /* ========================================================================
     5. VIEWS
     ======================================================================== */
  function switchView(name) {
    if (!VIEWS.includes(name)) return;
    if (name !== 'brief' && !state.spatial) return;
    state.currentView = name;

    Object.entries(dom.views).forEach(([key, el]) => {
      if (!el) return;
      const active = key === name;
      el.classList.toggle('is-active', active);
      if (active) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });

    dom.navButtons.forEach((btn) => {
      const active = btn.dataset.view === name;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (name === 'chamber' && chamber.ready) {
      requestAnimationFrame(() => {
        chamber.resize();
        chamber.render();
      });
    }
  }

  function enableViews() {
    dom.navButtons.forEach((btn) => { btn.disabled = false; });
  }

  function initNavigation() {
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) switchView(btn.dataset.view);
      });
    });
  }

  /* ========================================================================
     6. FORM
     ======================================================================== */
  function getBriefParameters() {
    const form = dom.briefForm;
    if (!form) return null;
    const primary = form.querySelector('input[name="primary"]:checked')?.value;
    const secondary = form.querySelector('input[name="secondary"]:checked')?.value || 'none';
    const intensity = Number(form.querySelector('input[name="intensity"]')?.value || 50);
    const temporal = form.querySelector('input[name="temporal"]:checked')?.value || 'still';
    const spatial = form.querySelector('input[name="spatial"]:checked')?.value || 'enclosed';
    const language = form.querySelector('input[name="language"]:checked')?.value || 'abstract';
    if (!primary) return null;
    return { primary, secondary, intensity, temporal, spatial, language };
  }

  function initIntensitySlider() {
    if (!dom.intensitySlider || !dom.intensityValue) return;
    dom.intensitySlider.addEventListener('input', () => {
      dom.intensityValue.textContent = dom.intensitySlider.value;
    });
  }

  /* ========================================================================
     7. SPATIAL ENGINE
     ======================================================================== */
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function generateSpatialAttributes(brief) {
    const base = Object.assign({}, EMOTION_SPATIAL[brief.primary]);
    const mod = SECONDARY_MODS[brief.secondary] || SECONDARY_MODS.none;
    const t = brief.intensity / 100;

    const attrs = {
      scale: base.scale * (0.7 + t * 0.6),
      enclosure: clamp(base.enclosure + (t - 0.5) * 0.2, 0.1, 0.95),
      lightIntensity: clamp(base.lightIntensity * (0.6 + t * 0.8), 0.2, 1.2),
      lightTemp: clamp(base.lightTemp + mod.lightTemp, 0, 1),
      verticality: base.verticality,
      fragmentation: clamp(base.fragmentation + mod.fragmentation, 0, 1),
      fogDensity: clamp(base.fogDensity + mod.fogDensity, 0.005, 0.08),
      colorBias: base.colorBias.slice(),
      temporal: brief.temporal,
      spatialPref: brief.spatial,
      language: brief.language,
      primary: brief.primary,
      secondary: brief.secondary,
      intensity: brief.intensity
    };

    if (brief.spatial === 'open') {
      attrs.enclosure = clamp(attrs.enclosure - 0.3, 0.1, 1);
      attrs.scale *= 1.15;
    } else if (brief.spatial === 'vertical') {
      attrs.verticality = clamp(attrs.verticality + 0.35, 0, 1);
      attrs.scale *= 1.2;
    } else if (brief.spatial === 'transitional') {
      attrs.enclosure = clamp(attrs.enclosure - 0.15, 0.1, 1);
      attrs.fragmentation = clamp(attrs.fragmentation + 0.15, 0, 1);
    }

    return attrs;
  }

  /* ========================================================================
     8. GENERATION
     ======================================================================== */
  function showOverlay() {
    state.isGenerating = true;
    dom.overlay.removeAttribute('hidden');
    dom.overlay.setAttribute('aria-busy', 'true');
    dom.generationBar.style.width = '0%';
    dom.generationStatus.textContent = GENERATION_MESSAGES[0];
  }

  function updateProgress(pct, msgIndex) {
    const v = Math.min(100, Math.max(0, pct));
    dom.generationBar.style.width = v + '%';
    const bar = dom.overlay.querySelector('.generation-progress');
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(v)));
    if (msgIndex !== undefined && GENERATION_MESSAGES[msgIndex]) {
      dom.generationStatus.textContent = GENERATION_MESSAGES[msgIndex];
    }
  }

  function hideOverlay() {
    state.isGenerating = false;
    dom.overlay.setAttribute('hidden', '');
    dom.overlay.setAttribute('aria-busy', 'false');
  }

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  async function runGeneration(options) {
    options = options || {};
    if (state.isGenerating) return;

    const brief = getBriefParameters();
    if (!brief) return;
    if (options.forceVariation) brief._entropy = Date.now() % 100000;

    state.brief = brief;
    showOverlay();

    const stages = [
      { pct: 20, msg: 0, delay: 450 },
      { pct: 45, msg: 1, delay: 500 },
      { pct: 70, msg: 2, delay: 480 },
      { pct: 90, msg: 3, delay: 420 },
      { pct: 100, msg: 4, delay: 350 }
    ];

    for (let i = 0; i < stages.length; i++) {
      await wait(stages[i].delay);
      updateProgress(stages[i].pct, stages[i].msg);
    }

    try {
      state.spatial = generateSpatialAttributes(brief);
      enableViews();
      renderAtmosphereControls();
      renderRefine();
      updateHud();
      chamber.build(state.spatial);
    } catch (err) {
      console.error('Generation error:', err);
      dom.generationStatus.textContent = 'The chamber could not form. Please try again.';
      await wait(1400);
      hideOverlay();
      return;
    }

    await wait(500);
    hideOverlay();
    switchView('chamber');
  }

  function updateHud() {
    if (!dom.hudEmotion || !state.brief) return;
    const sec = state.brief.secondary !== 'none' ? ' + ' + state.brief.secondary : '';
    dom.hudEmotion.textContent = capitalize(state.brief.primary) + sec;
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  /* ========================================================================
     9. ATMOSPHERE + REFINE
     ======================================================================== */
  function renderAtmosphereControls() {
    if (!dom.atmosphereControls || !state.spatial) return;
    const s = state.spatial;
    dom.atmosphereControls.innerHTML =
      '<div class="param-block">' +
        '<p class="param-legend">Current Spatial Profile</p>' +
        '<ul class="profile-list">' +
          '<li><span>Scale</span> <strong>' + s.scale.toFixed(2) + '</strong></li>' +
          '<li><span>Enclosure</span> <strong>' + (s.enclosure * 100).toFixed(0) + '%</strong></li>' +
          '<li><span>Light Intensity</span> <strong>' + (s.lightIntensity * 100).toFixed(0) + '%</strong></li>' +
          '<li><span>Light Temperature</span> <strong>' + (s.lightTemp > 0.6 ? 'Warm' : s.lightTemp < 0.4 ? 'Cool' : 'Neutral') + '</strong></li>' +
          '<li><span>Verticality</span> <strong>' + (s.verticality * 100).toFixed(0) + '%</strong></li>' +
          '<li><span>Fragmentation</span> <strong>' + (s.fragmentation * 100).toFixed(0) + '%</strong></li>' +
          '<li><span>Fog Density</span> <strong>' + s.fogDensity.toFixed(3) + '</strong></li>' +
        '</ul>' +
        '<p class="profile-note">These values drive the 3D chamber. Theme switches update material response live.</p>' +
      '</div>';
  }

  function renderRefine() {
    if (!dom.refineContent || !state.brief) return;
    dom.refineContent.innerHTML =
      '<div class="param-block">' +
        '<p class="view-desc" style="margin-bottom:1.5rem">' +
          'Primary: <strong>' + capitalize(state.brief.primary) + '</strong>' +
          (state.brief.secondary !== 'none' ? ' · Secondary: <strong>' + capitalize(state.brief.secondary) + '</strong>' : '') +
          ' · Intensity: <strong>' + state.brief.intensity + '</strong>' +
        '</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:center">' +
          '<button type="button" class="btn btn-primary" id="btn-variation"><span class="btn-text">Generate Variation</span></button>' +
          '<button type="button" class="btn btn-secondary" id="btn-rewrite"><span class="btn-text">Rewrite Brief</span></button>' +
        '</div>' +
      '</div>';

    var btnVar = document.getElementById('btn-variation');
    var btnRewrite = document.getElementById('btn-rewrite');
    if (btnVar) btnVar.addEventListener('click', function () { runGeneration({ forceVariation: true }); });
    if (btnRewrite) btnRewrite.addEventListener('click', function () { switchView('brief'); });
  }

  /* ========================================================================
     10. CHAMBER (Canvas 2D atmospheric renderer)
     ======================================================================== */
  var chamber = {
    ready: false,
    view: null,

    build: function (spatial) {
      if (!dom.chamberCanvas) return;
      if (!this.view) {
        this.view = new Chamber2D(dom.chamberCanvas);
        this.view.resize();
        window.addEventListener('resize', function () {
          if (chamber.view) chamber.view.resize();
        });
      }
      this.view.setTheme(state.currentTheme);
      this.view.setSpatial(spatial);
      this.view.resize();
      this.view.start();
      this.ready = true;
    },

    resize: function () {
      if (this.view) this.view.resize();
    },

    render: function () {
      if (this.view) this.view.draw();
    },

    applyThemeColors: function () {
      if (this.view) {
        this.view.setTheme(state.currentTheme);
        this.view.draw();
      }
    }
  };

  /* ========================================================================
     11. INIT
     ======================================================================== */
  function initForm() {
    if (!dom.briefForm) return;
    dom.briefForm.addEventListener('submit', function (e) {
      e.preventDefault();
      runGeneration();
    });
  }

  function init() {
    if (!dom.briefForm) {
      console.error('Critical DOM missing');
      return;
    }
    initThemeSwitcher();
    initNavigation();
    initIntensitySlider();
    initForm();
    setTheme('liminal');
    switchView('brief');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
