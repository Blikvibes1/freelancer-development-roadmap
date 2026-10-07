/**
 * CELESTIAL CODEX — Generative Mythology Engine
 * ==============================================
 * Clean, modular, error-resistant architecture.
 * Every function has a single responsibility.
 */

(() => {
  'use strict';

  /* ========================================================================
     1. CONSTANTS & CONFIG
     ======================================================================== */
  const THEMES = ['astral', 'primordial', 'ethereal'];
  const VIEWS = ['forge', 'codex', 'constellation', 'evolve'];

  const GENERATION_MESSAGES = [
    'Consulting the celestial patterns…',
    'Aligning the first principles…',
    'Breathing life into the pantheon…',
    'Weaving creation myths…',
    'Mapping sacred relationships…',
    'Inscribing moral codes…',
    'The codex is complete.'
  ];

  /* ========================================================================
     2. STATE
     ======================================================================== */
  const state = {
    currentTheme: 'astral',
    currentView: 'forge',
    mythology: null,          // Generated mythology object
    isGenerating: false,
    selectedGodId: null
  };

  /* ========================================================================
     3. DOM REFERENCES (cached once)
     ======================================================================== */
  const dom = {
    body: document.body,
    starfield: document.getElementById('starfield'),
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      forge: document.getElementById('view-forge'),
      codex: document.getElementById('view-codex'),
      constellation: document.getElementById('view-constellation'),
      evolve: document.getElementById('view-evolve')
    },
    forgeForm: document.getElementById('forge-form'),
    generateBtn: document.getElementById('generate-btn'),
    overlay: document.getElementById('generation-overlay'),
    generationStatus: document.getElementById('generation-status'),
    generationBar: document.querySelector('.generation-bar'),
    codexContent: document.getElementById('codex-content'),
    constellationCanvas: document.getElementById('constellation-canvas'),
    godDetailPanel: document.getElementById('god-detail-panel'),
    evolveContent: document.getElementById('evolve-content')
  };

  /* ========================================================================
     4. THEME SYSTEM
     ======================================================================== */
  function setTheme(themeName) {
    if (!THEMES.includes(themeName)) return;

    state.currentTheme = themeName;
    dom.body.setAttribute('data-theme', themeName);

    // Update theme buttons
    dom.themeButtons.forEach((btn) => {
      const isActive = btn.dataset.theme === themeName;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Redraw starfield with new palette if needed
    if (starfield && starfield.redraw) {
      starfield.redraw();
    }
  }

  function initThemeSwitcher() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme);
      });
    });
  }

  /* ========================================================================
     5. VIEW MANAGEMENT
     ======================================================================== */
  function switchView(viewName) {
    if (!VIEWS.includes(viewName)) return;
    if (viewName !== 'forge' && !state.mythology) return;

    state.currentView = viewName;

    // Toggle view visibility
    Object.entries(dom.views).forEach(([name, el]) => {
      if (!el) return;
      const isActive = name === viewName;
      el.classList.toggle('is-active', isActive);
      if (isActive) {
        el.removeAttribute('hidden');
      } else {
        el.setAttribute('hidden', '');
      }
    });

    // Update nav
    dom.navButtons.forEach((btn) => {
      const isActive = btn.dataset.view === viewName;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    // Special handling
    if (viewName === 'constellation' && state.mythology) {
      requestAnimationFrame(() => {
        if (constellation && constellation.resize) {
          constellation.resize();
          constellation.render();
        }
      });
    }
  }

  function enableViews() {
    dom.navButtons.forEach((btn) => {
      btn.disabled = false;
    });
  }

  function initNavigation() {
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        switchView(btn.dataset.view);
      });
    });
  }

  /* ========================================================================
     6. STARFIELD BACKGROUND
     ======================================================================== */
  const starfield = {
    canvas: null,
    ctx: null,
    stars: [],
    animationId: null,
    width: 0,
    height: 0,

    init() {
      this.canvas = dom.starfield;
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.createStars();
      this.animate();

      window.addEventListener('resize', () => {
        this.resize();
        this.createStars();
      });
    },

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    createStars() {
      const count = Math.floor((this.width * this.height) / 9000);
      this.stars = [];

      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.4 + 0.3,
          alpha: Math.random() * 0.6 + 0.15,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    },

    getStarColor() {
      const theme = state.currentTheme;
      if (theme === 'primordial') return '210, 180, 140';
      if (theme === 'ethereal') return '100, 130, 220';
      return '200, 190, 255'; // astral
    },

    draw() {
      if (!this.ctx) return;

      this.ctx.clearRect(0, 0, this.width, this.height);
      const color = this.getStarColor();

      for (const star of this.stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
        const alpha = star.alpha * twinkle;

        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
        this.ctx.fill();
      }
    },

    animate() {
      for (const star of this.stars) {
        star.twinklePhase += star.twinkleSpeed;
      }
      this.draw();
      this.animationId = requestAnimationFrame(() => this.animate());
    },

    redraw() {
      this.draw();
    }
  };

  /* ========================================================================
     7. GENERATION OVERLAY
     ======================================================================== */
  function showGenerationOverlay() {
    state.isGenerating = true;
    dom.overlay.removeAttribute('hidden');
    dom.overlay.setAttribute('aria-busy', 'true');
    dom.generationBar.style.width = '0%';
    dom.generationStatus.textContent = GENERATION_MESSAGES[0];
  }

  function updateGenerationProgress(percent, messageIndex) {
    const clamped = Math.min(100, Math.max(0, percent));
    dom.generationBar.style.width = `${clamped}%`;
    dom.overlay.querySelector('.generation-progress').setAttribute('aria-valuenow', String(Math.round(clamped)));

    if (messageIndex !== undefined && GENERATION_MESSAGES[messageIndex]) {
      dom.generationStatus.textContent = GENERATION_MESSAGES[messageIndex];
    }
  }

  function hideGenerationOverlay() {
    state.isGenerating = false;
    dom.overlay.setAttribute('hidden', '');
    dom.overlay.setAttribute('aria-busy', 'false');
  }

  /* ========================================================================
     8. FORM HANDLING
     ======================================================================== */
  function getFormParameters() {
    const form = dom.forgeForm;
    if (!form) return null;

    const climate = form.querySelector('input[name="climate"]:checked')?.value;
    const social = form.querySelector('input[name="social"]:checked')?.value;
    const nature = form.querySelector('input[name="nature"]:checked')?.value;
    const tech = form.querySelector('input[name="tech"]:checked')?.value;
    const scale = form.querySelector('input[name="scale"]:checked')?.value;

    const values = Array.from(form.querySelectorAll('input[name="values"]:checked'))
      .map((el) => el.value);

    if (!climate || !social || !nature || !tech || !scale) {
      return null;
    }

    return { climate, social, nature, tech, scale, values };
  }

  /* ========================================================================
     9. MYTHOLOGY GENERATION ENGINE (core logic)
     ======================================================================== */
  /**
   * Seeded random number generator for reproducibility
   */
  function createSeededRandom(seed) {
    let s = seed;
    return function next() {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Domain pools influenced by cultural parameters
   */
  const DOMAIN_POOLS = {
    climate: {
      arctic: ['Frost', 'Aurora', 'Endurance', 'Silence', 'Ice', 'Night'],
      temperate: ['Seasons', 'Harvest', 'Growth', 'Balance', 'Forest', 'River'],
      desert: ['Sun', 'Mirage', 'Scarcity', 'Sand', 'Oasis', 'Wind'],
      tropical: ['Storm', 'Jungle', 'Abundance', 'Rain', 'Canopy', 'Tide'],
      volcanic: ['Fire', 'Ash', 'Rebirth', 'Magma', 'Smoke', 'Forge']
    },
    social: {
      tribal: ['Kinship', 'Ancestors', 'Hunt', 'Story', 'Blood'],
      hierarchical: ['Order', 'Throne', 'Law', 'Hierarchy', 'Crown'],
      egalitarian: ['Council', 'Voice', 'Equity', 'Gathering', 'Share'],
      theocratic: ['Sacred', 'Oracle', 'Rite', 'Temple', 'Doctrine']
    },
    nature: {
      reverent: ['Spirit', 'Grove', 'Blessing', 'Cycle'],
      dominant: ['Dominion', 'Taming', 'Harvest', 'Mastery'],
      symbiotic: ['Weave', 'Bond', 'Exchange', 'Harmony'],
      fearful: ['Wrath', 'Shadow', 'Omen', 'Ward']
    },
    tech: {
      stone: ['Bone', 'Flint', 'Cave', 'Hunt'],
      bronze: ['Bronze', 'City', 'Trade', 'Wall'],
      iron: ['Iron', 'Script', 'Forge', 'Legion'],
      classical: ['Philosophy', 'Empire', 'Academy', 'Law']
    }
  };

  const PERSONALITY_TRAITS = [
    'stoic', 'wrathful', 'benevolent', 'cunning', 'melancholic',
    'joyful', 'stern', 'curious', 'protective', 'unpredictable',
    'wise', 'fierce', 'gentle', 'proud', 'mysterious'
  ];

  const NAME_PREFIXES = [
    'Ael', 'Thal', 'Mor', 'Kael', 'Syl', 'Vey', 'Orin', 'Lir',
    'Nyx', 'Zha', 'Ery', 'Tor', 'Isa', 'Rav', 'Sol', 'Umb'
  ];

  const NAME_SUFFIXES = [
    'ion', 'ara', 'eth', 'or', 'iel', 'une', 'ath', 'is',
    'on', 'ea', 'us', 'yx', 'orim', 'el', 'an', 'ira'
  ];

  function generateGodName(rand) {
    const prefix = NAME_PREFIXES[Math.floor(rand() * NAME_PREFIXES.length)];
    const suffix = NAME_SUFFIXES[Math.floor(rand() * NAME_SUFFIXES.length)];
    return prefix + suffix;
  }

  function pickUnique(pool, count, rand) {
    const copy = [...pool];
    const result = [];
    while (result.length < count && copy.length > 0) {
      const idx = Math.floor(rand() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  function generateMythology(params) {
    const seedStr = JSON.stringify(params);
    const seed = hashString(seedStr);
    const rand = createSeededRandom(seed);

    // Determine pantheon size
    const sizeMap = { small: [4, 6], medium: [7, 10], large: [11, 14] };
    const [min, max] = sizeMap[params.scale] || [7, 10];
    const count = min + Math.floor(rand() * (max - min + 1));

    // Build domain pool from parameters
    const domains = [
      ...DOMAIN_POOLS.climate[params.climate],
      ...DOMAIN_POOLS.social[params.social],
      ...DOMAIN_POOLS.nature[params.nature],
      ...DOMAIN_POOLS.tech[params.tech]
    ];

    // Generate gods
    const gods = [];
    const usedNames = new Set();
    const usedDomains = new Set();

    for (let i = 0; i < count; i++) {
      let name;
      do {
        name = generateGodName(rand);
      } while (usedNames.has(name));
      usedNames.add(name);

      // Assign primary domain
      let domain;
      do {
        domain = domains[Math.floor(rand() * domains.length)];
      } while (usedDomains.has(domain) && usedDomains.size < domains.length);
      usedDomains.add(domain);

      const traits = pickUnique(PERSONALITY_TRAITS, 2 + Math.floor(rand() * 2), rand);

      gods.push({
        id: `god-${i}`,
        name,
        domain,
        traits,
        title: generateTitle(domain, traits[0], rand),
        description: generateDescription(name, domain, traits, params, rand)
      });
    }

    // Generate relationships
    const relationships = [];
    for (let i = 0; i < gods.length; i++) {
      for (let j = i + 1; j < gods.length; j++) {
        if (rand() < 0.35) {
          const types = ['ally', 'rival', 'kin', 'lover', 'mentor', 'conflict'];
          const type = types[Math.floor(rand() * types.length)];
          relationships.push({
            from: gods[i].id,
            to: gods[j].id,
            type
          });
        }
      }
    }

    // Cosmology
    const cosmology = generateCosmology(params, gods, rand);

    // Rituals
    const rituals = generateRituals(params, gods, rand);

    // Symbols & Sacred Places
    const symbols = generateSymbols(params, gods, rand);
    const sacredPlaces = generateSacredPlaces(params, gods, rand);

    // Moral codes
    const moralCodes = generateMoralCodes(params, rand);

    return {
      seed,
      params,
      generatedAt: new Date().toISOString(),
      pantheon: gods,
      relationships,
      cosmology,
      rituals,
      symbols,
      sacredPlaces,
      moralCodes
    };
  }

  function generateTitle(domain, trait, rand) {
    const titles = {
      stoic: ['the Unmoved', 'the Eternal', 'the Silent'],
      wrathful: ['the Tempest', 'the Scorned', 'the Burning'],
      benevolent: ['the Gentle', 'the Giver', 'the Kind'],
      cunning: ['the Weaver', 'the Shadowed', 'the Clever'],
      melancholic: ['the Weeping', 'the Distant', 'the Faded'],
      joyful: ['the Radiant', 'the Laughing', 'the Bright'],
      stern: ['the Judge', 'the Iron', 'the Unyielding'],
      curious: ['the Seeker', 'the Questioner', 'the Wanderer'],
      protective: ['the Shield', 'the Guardian', 'the Ward'],
      unpredictable: ['the Wild', 'the Shifting', 'the Chaos'],
      wise: ['the Sage', 'the Knowing', 'the Deep'],
      fierce: ['the Blade', 'the Storm', 'the Untamed'],
      gentle: ['the Soft', 'the Whisper', 'the Tender'],
      proud: ['the High', 'the Glorious', 'the Majestic'],
      mysterious: ['the Veiled', 'the Hidden', 'the Unknown']
    };

    const options = titles[trait] || ['the Ancient'];
    return options[Math.floor(rand() * options.length)];
  }

  function generateDescription(name, domain, traits, params, rand) {
    const openings = [
      `${name} holds dominion over ${domain.toLowerCase()}.`,
      `Known as the keeper of ${domain.toLowerCase()}, ${name} moves through the world unseen.`,
      `${name} embodies the essence of ${domain.toLowerCase()}.`
    ];
    const traitText = `Their nature is ${traits.join(' and ')}.`;
    const climateNote = {
      arctic: 'The cold does not touch them.',
      temperate: 'They walk with the turning of the seasons.',
      desert: 'They are born of heat and silence.',
      tropical: 'Storms answer their call.',
      volcanic: 'Fire is their oldest companion.'
    }[params.climate] || '';

    return `${openings[Math.floor(rand() * openings.length)]} ${traitText} ${climateNote}`.trim();
  }

  function generateCosmology(params, gods, rand) {
    const creators = gods.slice(0, Math.min(3, gods.length));
    const creatorNames = creators.map((g) => g.name).join(', ');

    const structures = {
      arctic: 'a vast frozen firmament suspended above an endless night sea',
      temperate: 'layered realms of canopy, earth, and deep root',
      desert: 'a single great dune of time under a merciless sun-disk',
      tropical: 'a living canopy that breathes storms and memory',
      volcanic: 'a cracked world-shell floating upon a sea of primordial fire'
    };

    return {
      structure: structures[params.climate] || 'a woven tapestry of light and shadow',
      origin: `In the time before time, ${creatorNames} shaped the first patterns.`,
      layers: [
        'The Upper Firmament — domain of pure principle',
        'The Middle World — realm of living beings',
        'The Deep Below — memory, death, and origin'
      ]
    };
  }

  function generateRituals(params, gods, rand) {
    const count = 3 + Math.floor(rand() * 3);
    const rituals = [];
    const used = new Set();

    const templates = [
      { name: 'First Light Offering', desc: 'At dawn, offerings are placed to honor the returning light.' },
      { name: 'Naming of the Dead', desc: 'Names of the departed are spoken so they may find the path.' },
      { name: 'Seasonal Turning', desc: 'The community gathers to mark the shift of the world\'s breath.' },
      { name: 'Blood of the Hunt', desc: 'The first blood of the season is returned to the earth.' },
      { name: 'Silent Vigil', desc: 'A night spent without speech beneath the open sky.' },
      { name: 'Weaving of Bonds', desc: 'Threads are exchanged to bind kinship and promise.' },
      { name: 'Ash Circumambulation', desc: 'Walking the sacred circle of ash to invite renewal.' },
      { name: 'Oracle Smoke', desc: 'Questions are whispered into rising smoke for the gods to answer.' }
    ];

    while (rituals.length < count && templates.length > 0) {
      const idx = Math.floor(rand() * templates.length);
      const t = templates.splice(idx, 1)[0];
      if (!used.has(t.name)) {
        used.add(t.name);
        const associated = gods[Math.floor(rand() * gods.length)];
        rituals.push({
          name: t.name,
          description: t.desc,
          associatedGod: associated.name
        });
      }
    }

    return rituals;
  }

  function generateSymbols(params, gods, rand) {
    const symbols = [];
    const base = [
      'Spiral of Returning', 'Broken Circle', 'Three-Root Tree',
      'Eye of Stillness', 'Flame That Does Not Consume', 'River Without Banks',
      'Stone That Remembers', 'Feather of Judgment', 'Hollow Crown'
    ];

    const count = 4 + Math.floor(rand() * 3);
    const chosen = pickUnique(base, count, rand);

    chosen.forEach((name, i) => {
      symbols.push({
        name,
        meaning: `Represents the principle of ${gods[i % gods.length].domain.toLowerCase()} made visible.`,
        associatedGod: gods[i % gods.length].name
      });
    });

    return symbols;
  }

  function generateSacredPlaces(params, gods, rand) {
    const places = {
      arctic: ['The Whispering Glacier', 'Aurora Throne', 'Ice-Mirror Lake'],
      temperate: ['The Rooted Grove', 'River of Names', 'Hill of First Fire'],
      desert: ['The Singing Dune', 'Oasis of Memory', 'Sunken Temple of Salt'],
      tropical: ['Canopy of Storms', 'Tide-Stone Circle', 'Heartwood Hollow'],
      volcanic: ['Ash Cathedral', 'Magma Gate', 'The Still Crater']
    };

    const list = places[params.climate] || ['The Forgotten Threshold'];
    return list.map((name, i) => ({
      name,
      description: `A place where the veil thins and ${gods[i % gods.length].name} may be felt.`,
      associatedGod: gods[i % gods.length].name
    }));
  }

  function generateMoralCodes(params, rand) {
    const codes = [];

    const valueMap = {
      honor: 'Keep your word even when the cost is high.',
      wisdom: 'Seek understanding before judgment.',
      strength: 'Protect those who cannot protect themselves.',
      harmony: 'Do not take more than the world can restore.',
      sacrifice: 'What is given freely returns in another form.',
      curiosity: 'Question what is given as truth.'
    };

    params.values.forEach((v) => {
      if (valueMap[v]) {
        codes.push(valueMap[v]);
      }
    });

    // Always add a climate-influenced code
    const climateCodes = {
      arctic: 'Endure without becoming cold to others.',
      temperate: 'Honor the turning of seasons in all things.',
      desert: 'Share water before gold.',
      tropical: 'Respect the storm as teacher.',
      volcanic: 'From destruction, allow rebirth.'
    };

    codes.push(climateCodes[params.climate] || 'Walk carefully upon the world.');

    return codes;
  }

  /* ========================================================================
     10. GENERATION ORCHESTRATION
     ======================================================================== */
  async function runGeneration(options = {}) {
    if (state.isGenerating) return;

    const params = getFormParameters();
    if (!params) {
      return;
    }

    if (params.values.length === 0) {
      params.values = ['wisdom'];
    }

    // Force variation by injecting entropy into the seed string
    if (options.forceVariation) {
      params._variation = Date.now() % 100000;
    }

    showGenerationOverlay();

    const stages = [
      { pct: 15, msg: 0, delay: 400 },
      { pct: 30, msg: 1, delay: 500 },
      { pct: 50, msg: 2, delay: 550 },
      { pct: 70, msg: 3, delay: 500 },
      { pct: 85, msg: 4, delay: 450 },
      { pct: 95, msg: 5, delay: 400 },
      { pct: 100, msg: 6, delay: 300 }
    ];

    for (const stage of stages) {
      await wait(stage.delay);
      updateGenerationProgress(stage.pct, stage.msg);
    }

    try {
      state.mythology = generateMythology(params);
      enableViews();
      renderCodex();
      renderEvolve();
      if (constellation) {
        constellation.load(state.mythology);
      }
    } catch (err) {
      console.error('Generation failed:', err);
      dom.generationStatus.textContent = 'The patterns could not be read. Please try again.';
      await wait(1500);
      hideGenerationOverlay();
      return;
    }

    await wait(600);
    hideGenerationOverlay();
    switchView('codex');
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ========================================================================
     11. CODEX RENDERER
     ======================================================================== */
  function renderCodex() {
    const myth = state.mythology;
    if (!myth || !dom.codexContent) return;

    const html = `
      <article class="codex-section">
        <h3 class="codex-section-title">Cosmology</h3>
        <p class="codex-lead">${escapeHtml(myth.cosmology.origin)}</p>
        <p>${escapeHtml(myth.cosmology.structure)}</p>
        <ul class="codex-list">
          ${myth.cosmology.layers.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}
        </ul>
      </article>

      <article class="codex-section">
        <h3 class="codex-section-title">Pantheon</h3>
        <div class="god-grid">
          ${myth.pantheon.map((god) => `
            <div class="god-card" data-god-id="${god.id}">
              <h4 class="god-name">${escapeHtml(god.name)}</h4>
              <p class="god-title">${escapeHtml(god.title)}</p>
              <p class="god-domain">Domain: <strong>${escapeHtml(god.domain)}</strong></p>
              <p class="god-traits">${god.traits.map((t) => escapeHtml(t)).join(' · ')}</p>
              <p class="god-desc">${escapeHtml(god.description)}</p>
            </div>
          `).join('')}
        </div>
      </article>

      <article class="codex-section">
        <h3 class="codex-section-title">Rituals</h3>
        <div class="ritual-list">
          ${myth.rituals.map((r) => `
            <div class="ritual-item">
              <h4>${escapeHtml(r.name)}</h4>
              <p>${escapeHtml(r.description)}</p>
              <p class="associated">Associated: ${escapeHtml(r.associatedGod)}</p>
            </div>
          `).join('')}
        </div>
      </article>

      <article class="codex-section">
        <h3 class="codex-section-title">Symbols</h3>
        <div class="symbol-list">
          ${myth.symbols.map((s) => `
            <div class="symbol-item">
              <h4>${escapeHtml(s.name)}</h4>
              <p>${escapeHtml(s.meaning)}</p>
            </div>
          `).join('')}
        </div>
      </article>

      <article class="codex-section">
        <h3 class="codex-section-title">Sacred Places</h3>
        <div class="place-list">
          ${myth.sacredPlaces.map((p) => `
            <div class="place-item">
              <h4>${escapeHtml(p.name)}</h4>
              <p>${escapeHtml(p.description)}</p>
            </div>
          `).join('')}
        </div>
      </article>

      <article class="codex-section">
        <h3 class="codex-section-title">Moral Codes</h3>
        <ul class="codex-list moral">
          ${myth.moralCodes.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </article>
    `;

    dom.codexContent.innerHTML = html;

    // Make god cards interactive — click opens constellation detail
    const cards = dom.codexContent.querySelectorAll('.god-card');
    cards.forEach((card) => {
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => {
        const godId = card.dataset.godId;
        if (!godId) return;
        switchView('constellation');
        // Allow view transition then show detail
        requestAnimationFrame(() => {
          if (constellation && constellation.showGodDetail) {
            constellation.showGodDetail(godId);
            constellation.render();
          }
        });
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ========================================================================
     12. EVOLVE VIEW (basic)
     ======================================================================== */
  function renderEvolve() {
    if (!dom.evolveContent || !state.mythology) return;

    dom.evolveContent.innerHTML = `
      <div class="evolve-panel">
        <p class="evolve-intro">The mythology has been woven. You may now generate a variation from the same cultural seeds, or return to the Forge to begin anew.</p>
        <div class="evolve-actions">
          <button type="button" class="btn btn-primary" id="btn-variation">
            <span class="btn-text">Generate Variation</span>
            <span class="btn-icon" aria-hidden="true">↻</span>
          </button>
          <button type="button" class="btn btn-secondary" id="btn-refire">
            <span class="btn-text">Return to Forge</span>
          </button>
        </div>
        <p class="seed-info">Seed: <code>${state.mythology.seed}</code></p>
      </div>
    `;

    const btnVar = document.getElementById('btn-variation');
    const btnRefire = document.getElementById('btn-refire');

    if (btnVar) {
      btnVar.addEventListener('click', () => {
        // Force a variation by temporarily appending entropy to params
        runGeneration({ forceVariation: true });
      });
    }

    if (btnRefire) {
      btnRefire.addEventListener('click', () => {
        switchView('forge');
      });
    }
  }

  /* ========================================================================
     13. CONSTELLATION — Interactive living map
     ======================================================================== */
  const RELATIONSHIP_STYLES = {
    ally:     { alpha: 0.45, dash: [],      width: 1.8 },
    rival:    { alpha: 0.55, dash: [6, 4],  width: 1.6 },
    kin:      { alpha: 0.40, dash: [],      width: 2.0 },
    lover:    { alpha: 0.50, dash: [2, 3],  width: 1.7 },
    mentor:   { alpha: 0.40, dash: [8, 3],  width: 1.5 },
    conflict: { alpha: 0.60, dash: [3, 3],  width: 1.8 }
  };

  const constellation = {
    canvas: null,
    ctx: null,
    nodes: [],
    links: [],
    width: 0,
    height: 0,
    draggedNode: null,
    offsetX: 0,
    offsetY: 0,
    hoveredNode: null,
    selectedNodeId: null,

    init() {
      this.canvas = dom.constellationCanvas;
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.bindEvents();
    },

    resize() {
      if (!this.canvas || !this.canvas.parentElement) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    load(mythology) {
      if (!mythology) return;

      const gods = mythology.pantheon;
      const relationships = mythology.relationships;

      const cx = this.width / 2;
      const cy = this.height / 2;
      const radius = Math.min(this.width, this.height) * 0.32;

      this.nodes = gods.map((god, i) => {
        const angle = (i / gods.length) * Math.PI * 2 - Math.PI / 2;
        return {
          id: god.id,
          name: god.name,
          domain: god.domain,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          radius: 20 + Math.min(god.name.length, 7)
        };
      });

      this.links = relationships.map((rel) => ({
        source: this.nodes.find((n) => n.id === rel.from),
        target: this.nodes.find((n) => n.id === rel.to),
        type: rel.type
      })).filter((l) => l.source && l.target);

      this.selectedNodeId = null;
      this.hoveredNode = null;
      this.render();
    },

    bindEvents() {
      if (!this.canvas) return;

      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
      this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
      this.canvas.addEventListener('pointerleave', () => this.onPointerLeave());

      window.addEventListener('resize', () => {
        this.resize();
        if (state.mythology) this.load(state.mythology);
      });
    },

    getPointerPos(e) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    },

    findNodeAt(x, y) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        const dx = x - n.x;
        const dy = y - n.y;
        if (dx * dx + dy * dy < (n.radius + 4) * (n.radius + 4)) {
          return n;
        }
      }
      return null;
    },

    onPointerDown(e) {
      const pos = this.getPointerPos(e);
      const node = this.findNodeAt(pos.x, pos.y);
      if (node) {
        this.draggedNode = node;
        this.offsetX = pos.x - node.x;
        this.offsetY = pos.y - node.y;
        this.canvas.setPointerCapture(e.pointerId);
        this.selectedNodeId = node.id;
        this.showGodDetail(node.id);
        this.render();
      } else {
        // Click empty space closes panel
        this.selectedNodeId = null;
        if (dom.godDetailPanel) {
          dom.godDetailPanel.setAttribute('hidden', '');
        }
        this.render();
      }
    },

    onPointerMove(e) {
      const pos = this.getPointerPos(e);

      if (this.draggedNode) {
        this.draggedNode.x = pos.x - this.offsetX;
        this.draggedNode.y = pos.y - this.offsetY;
        // Keep inside canvas bounds
        this.draggedNode.x = Math.max(this.draggedNode.radius, Math.min(this.width - this.draggedNode.radius, this.draggedNode.x));
        this.draggedNode.y = Math.max(this.draggedNode.radius, Math.min(this.height - this.draggedNode.radius, this.draggedNode.y));
        this.render();
        return;
      }

      // Hover detection
      const node = this.findNodeAt(pos.x, pos.y);
      if (node !== this.hoveredNode) {
        this.hoveredNode = node;
        this.canvas.style.cursor = node ? 'pointer' : 'grab';
        this.render();
      }
    },

    onPointerUp(e) {
      if (this.draggedNode) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
      this.draggedNode = null;
    },

    onPointerLeave() {
      this.draggedNode = null;
      this.hoveredNode = null;
      this.canvas.style.cursor = 'grab';
      this.render();
    },

    showGodDetail(godId) {
      const myth = state.mythology;
      const god = myth?.pantheon.find((g) => g.id === godId);
      if (!god || !dom.godDetailPanel) return;

      state.selectedGodId = godId;
      this.selectedNodeId = godId;

      // Collect relationships for this god
      const relations = (myth.relationships || [])
        .filter((r) => r.from === godId || r.to === godId)
        .map((r) => {
          const otherId = r.from === godId ? r.to : r.from;
          const other = myth.pantheon.find((g) => g.id === otherId);
          return {
            type: r.type,
            name: other ? other.name : 'Unknown'
          };
        });

      const relationHtml = relations.length > 0
        ? `<div class="panel-relations">
             <h4 class="panel-relations-title">Relationships</h4>
             <ul class="panel-relations-list">
               ${relations.map((r) => `
                 <li><span class="rel-type">${escapeHtml(r.type)}</span> — ${escapeHtml(r.name)}</li>
               `).join('')}
             </ul>
           </div>`
        : `<p class="panel-no-rel">No recorded relationships.</p>`;

      dom.godDetailPanel.innerHTML = `
        <button type="button" class="panel-close" aria-label="Close detail panel">×</button>
        <h3 class="panel-god-name">${escapeHtml(god.name)}</h3>
        <p class="panel-god-title">${escapeHtml(god.title)}</p>
        <p class="panel-domain"><strong>Domain:</strong> ${escapeHtml(god.domain)}</p>
        <p class="panel-traits">${god.traits.map(escapeHtml).join(' · ')}</p>
        <p class="panel-desc">${escapeHtml(god.description)}</p>
        ${relationHtml}
      `;

      dom.godDetailPanel.removeAttribute('hidden');

      const closeBtn = dom.godDetailPanel.querySelector('.panel-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          dom.godDetailPanel.setAttribute('hidden', '');
          state.selectedGodId = null;
          this.selectedNodeId = null;
          this.render();
        });
      }
    },

    getThemeColors() {
      const theme = state.currentTheme;
      if (theme === 'primordial') {
        return {
          link: '196, 122, 58',
          node: '#c47a3a',
          glow: 'rgba(196, 122, 58, 0.18)',
          text: '#f0e6d6',
          selected: '#e8a060'
        };
      }
      if (theme === 'ethereal') {
        return {
          link: '91, 124, 250',
          node: '#5b7cfa',
          glow: 'rgba(91, 124, 250, 0.15)',
          text: '#1e2433',
          selected: '#3d5ce5'
        };
      }
      // astral
      return {
        link: '212, 168, 75',
        node: '#d4a84b',
        glow: 'rgba(212, 168, 75, 0.16)',
        text: '#e8e4f5',
        selected: '#f0c060'
      };
    },

    render() {
      if (!this.ctx) return;

      this.ctx.clearRect(0, 0, this.width, this.height);
      const colors = this.getThemeColors();

      // Draw links with type-specific styling
      for (const link of this.links) {
        const style = RELATIONSHIP_STYLES[link.type] || RELATIONSHIP_STYLES.ally;
        const isHighlighted = this.selectedNodeId &&
          (link.source.id === this.selectedNodeId || link.target.id === this.selectedNodeId);

        this.ctx.beginPath();
        this.ctx.moveTo(link.source.x, link.source.y);
        this.ctx.lineTo(link.target.x, link.target.y);
        this.ctx.lineWidth = isHighlighted ? style.width + 0.8 : style.width;
        this.ctx.setLineDash(style.dash);
        this.ctx.strokeStyle = `rgba(${colors.link}, ${isHighlighted ? Math.min(style.alpha + 0.25, 0.9) : style.alpha})`;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // Draw nodes
      for (const node of this.nodes) {
        const isSelected = node.id === this.selectedNodeId;
        const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
        const scale = isSelected || isHovered ? 1.12 : 1;

        // Outer glow
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, (node.radius + 8) * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.glow;
        this.ctx.fill();

        // Core
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = isSelected ? colors.selected : colors.node;
        this.ctx.fill();

        // Subtle inner highlight
        this.ctx.beginPath();
        this.ctx.arc(node.x - node.radius * 0.25, node.y - node.radius * 0.25, node.radius * 0.35 * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        this.ctx.fill();

        // Label
        this.ctx.fillStyle = colors.text;
        this.ctx.font = `600 ${isSelected || isHovered ? 12 : 11}px Outfit, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.name, node.x, node.y);
      }
    }
  };

  /* ========================================================================
     14. FORM SUBMIT
     ======================================================================== */
  function initForgeForm() {
    if (!dom.forgeForm) return;

    dom.forgeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      runGeneration();
    });
  }

  /* ========================================================================
     15. ADDITIONAL CODEX STYLES (injected for completeness)
     ======================================================================== */
  function injectCodexStyles() {
    // Styles for dynamically generated codex content are in style.css
    // This function reserved for future dynamic needs
  }

  /* ========================================================================
     16. INIT
     ======================================================================== */
  function init() {
    // Guard against missing critical elements
    if (!dom.forgeForm || !dom.body) {
      console.error('Critical DOM elements missing.');
      return;
    }

    initThemeSwitcher();
    initNavigation();
    initForgeForm();
    starfield.init();
    constellation.init();

    // Set initial theme
    setTheme('astral');
    switchView('forge');
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
