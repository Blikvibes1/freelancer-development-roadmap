/**
 * RELIC — Future Artifact Generator
 * Plausible everyday objects from 20–100 years ahead.
 */
(() => {
  'use strict';

  const THEMES = ['archive', 'lab', 'dusk'];

  const TECH = ['biotech', 'ambient compute', 'energy scarcity', 'materials revolution', 'post-screen'];
  const SOCIAL = ['hyperlocal', 'mass migration', 'care economy', 'surveillance normal', 'post-work leisure'];
  const CULTURE = ['repair culture', 'ritual revival', 'minimal possession', 'status-as-access', 'nostalgia industry'];
  const DOMAIN = ['home', 'body', 'street', 'work', 'play', 'mourning'];

  const FORMS = {
    home: ['wall-embedded panel', 'tabletop vessel', 'doorway threshold device', 'ceiling mote cluster', 'foldable room divider'],
    body: ['skin-adjacent band', 'ear canal insert', 'collar pendant', 'fingernail lamina', 'breath mask shell'],
    street: ['kerb-mounted post', 'shared locker brick', 'umbrella-scale canopy node', 'pavement inlay', 'pole-hung lantern'],
    work: ['desk orthotic', 'portable booth shell', 'tool caddy', 'credential lanyard core', 'meeting-table lens'],
    play: ['handheld puzzle shell', 'floor projection mat', 'voice-toy vessel', 'score token', 'group circle marker'],
    mourning: ['memory bead strand', 'ash-safe vessel', 'voice archive locket', 'ritual cloth weight', 'name-light plaque']
  };

  const MATERIALS = {
    biotech: ['mycelium composite', 'lab-grown keratin sheet', 'algal polymer', 'self-healing protein film'],
    'ambient compute': ['recycled rare-earth mesh', 'printed circuit paper', 'low-power ceramic substrate'],
    'energy scarcity': ['hand-wound spring alloy', 'phase-change wax core', 'thermoelectric scrap laminate'],
    'materials revolution': ['carbon lattice foam', 'programmable textile yarn', 'transparent aluminum flake'],
    'post-screen': ['haptic gel membrane', 'e-ink textile', 'projection-catch fabric']
  };

  const USES = {
    home: ['regulates indoor microclimate by negotiation with neighbors', 'stores shared tools on a rotating trust ledger', 'mediates family argument volume'],
    body: ['translates stress into a private tactile code', 'rations medication by circadian need', 'signals consent boundaries in dense crowds'],
    street: ['allocates shade and seating by queue fairness', 'filters particulate while displaying local air debt', 'hosts ephemeral neighborhood notices'],
    work: ['certifies deep-work intervals against interruption', 'shares attention budget across a team', 'archives decisions with forced cooling-off delays'],
    play: ['scores cooperative rather than competitive play', 'generates rules that expire after one session', 'remembers unfinished games across households'],
    mourning: ['plays a voice only when specific people gather', 'releases a scent timed to anniversary windows', 'holds a name that fades unless retold']
  };

  const CONTEXTS = {
    hyperlocal: 'In a world of strong block-level governance, ownership is often temporary and negotiated.',
    'mass migration': 'Objects are designed to pack, re-root, and survive irregular infrastructure.',
    'care economy': 'Status accrues to those who maintain systems and people, not only those who invent.',
    'surveillance normal': 'Transparency is default; privacy is a paid or earned exception.',
    'post-work leisure': 'Time is abundant for some; tools fight boredom and meaning-collapse.'
  };

  const SIDES = [
    'Creates black markets for unlocked or “dumb” versions.',
    'Encourages dependence that collapses when the network fails.',
    'Turns intimate data into ambient social pressure.',
    'Privileges those fluent in its ritual interface language.',
    'Outlives its ethical frame; later generations inherit awkward defaults.',
    'Is gamed into a status object, defeating its original civic purpose.',
    'Makes non-users look suspicious in shared spaces.',
    'Requires rare maintenance skills that concentrate power in a guild.'
  ];

  const NAME_A = ['Lumen', 'Hearth', 'Knot', 'Veil', 'Ledger', 'Pulse', 'Root', 'Ash', 'Quota', 'Choir'];
  const NAME_B = ['brace', 'vessel', 'index', 'mantle', 'relay', 'casket', 'loom', 'witness', 'ration', 'threshold'];

  const state = {
    theme: 'archive',
    tech: 'ambient compute',
    social: 'care economy',
    culture: 'repair culture',
    domain: 'home',
    artifact: null
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    horizon: document.getElementById('horizon'),
    techChips: document.getElementById('tech-chips'),
    socialChips: document.getElementById('social-chips'),
    cultureChips: document.getElementById('culture-chips'),
    domainChips: document.getElementById('domain-chips'),
    btnGenerate: document.getElementById('btn-generate'),
    emptyState: document.getElementById('empty-state'),
    artifactCard: document.getElementById('artifact-card'),
    canvas: document.getElementById('artifact-canvas'),
    yearBadge: document.getElementById('year-badge'),
    artifactName: document.getElementById('artifact-name'),
    artifactTagline: document.getElementById('artifact-tagline'),
    specForm: document.getElementById('spec-form'),
    specMaterials: document.getElementById('spec-materials'),
    specUse: document.getElementById('spec-use'),
    specContext: document.getElementById('spec-context'),
    specSide: document.getElementById('spec-side'),
    seedMeta: document.getElementById('seed-meta')
  };

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
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
    if (state.artifact) drawArtifact(state.artifact);
  }

  function renderChips(container, options, key) {
    if (!container) return;
    container.innerHTML = options.map((o) => {
      const on = state[key] === o;
      return `<button type="button" class="chip${on ? ' is-on' : ''}" data-val="${o}">${o}</button>`;
    }).join('');
    container.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state[key] = chip.dataset.val;
        renderChips(container, options, key);
      });
    });
  }

  function generate() {
    const year = 2026 + Number(dom.horizon?.value || 40);
    const seedStr = [state.tech, state.social, state.culture, state.domain, year, Date.now() % 10000].join('|');
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (Math.imul(31, seed) + seedStr.charCodeAt(i)) | 0;
    seed = seed >>> 0;
    const rng = mulberry32(seed || 1);

    const form = pick(rng, FORMS[state.domain] || FORMS.home);
    const mats = MATERIALS[state.tech] || MATERIALS['ambient compute'];
    const material = pick(rng, mats) + (rng() > 0.5 ? ', ' + pick(rng, mats) : '');
    const use = pick(rng, USES[state.domain] || USES.home);
    const context = CONTEXTS[state.social] || CONTEXTS.hyperlocal;
    const cultureNote = {
      'repair culture': 'Designed to be opened, mended, and passed down with visible scars.',
      'ritual revival': 'Activation involves a short shared gesture rather than a button.',
      'minimal possession': 'Often leased from a commons; personalization is temporary.',
      'status-as-access': 'Rarer modes unlock through contribution scores, not purchase alone.',
      'nostalgia industry': 'Surface language quotes a twentieth-century object category.'
    }[state.culture] || '';
    const side = pick(rng, SIDES);
    const name = pick(rng, NAME_A) + ' ' + pick(rng, NAME_B);

    const artifact = {
      name,
      year,
      tagline: `A ${state.domain} object shaped by ${state.tech} under ${state.social} pressures.`,
      form,
      materials: material,
      use,
      context: context + ' ' + cultureNote,
      side,
      domain: state.domain,
      tech: state.tech,
      seed
    };
    state.artifact = artifact;
    showArtifact(artifact);
  }

  function showArtifact(a) {
    if (dom.emptyState) dom.emptyState.hidden = true;
    if (dom.artifactCard) dom.artifactCard.hidden = false;
    if (dom.yearBadge) dom.yearBadge.textContent = 'Circa ' + a.year;
    if (dom.artifactName) dom.artifactName.textContent = a.name;
    if (dom.artifactTagline) dom.artifactTagline.textContent = a.tagline;
    if (dom.specForm) dom.specForm.textContent = a.form;
    if (dom.specMaterials) dom.specMaterials.textContent = a.materials;
    if (dom.specUse) dom.specUse.textContent = a.use;
    if (dom.specContext) dom.specContext.textContent = a.context;
    if (dom.specSide) dom.specSide.textContent = a.side;
    if (dom.seedMeta) dom.seedMeta.textContent = `Seed ${a.seed} · ${a.tech} · ${a.domain}`;
    drawArtifact(a);
  }

  function drawArtifact(a) {
    const canvas = dom.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const rng = mulberry32(a.seed);
    const bg = getComputedStyle(document.body).getPropertyValue('--color-bg-elevated').trim() || '#161210';
    const accent = getComputedStyle(document.body).getPropertyValue('--color-accent').trim() || '#c8a060';
    const muted = getComputedStyle(document.body).getPropertyValue('--color-text-subtle').trim() || '#807060';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Soft ground
    ctx.fillStyle = muted;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.78, w * 0.28, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const cx = w / 2;
    const cy = h * 0.45;
    const domain = a.domain;

    if (domain === 'body') {
      // band / pendant
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 40, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (domain === 'street') {
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 60);
      ctx.lineTo(cx - 10, cy - 30);
      ctx.lineTo(cx + 30, cy - 50);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 30, cy - 50, 12, 0, Math.PI * 2);
      ctx.stroke();
    } else if (domain === 'mourning') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 40);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(cx + (i % 2 === 0 ? 12 : -12), cy - 40 + i * 18);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + 55, 14, 0, Math.PI * 2);
      ctx.stroke();
    } else if (domain === 'play') {
      const sides = 5 + Math.floor(rng() * 3);
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const r = 40 + rng() * 15;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // home / work default vessel
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy + 40);
      ctx.lineTo(cx - 40, cy - 10);
      ctx.quadraticCurveTo(cx, cy - 55, cx + 40, cy - 10);
      ctx.lineTo(cx + 35, cy + 40);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 25);
      ctx.lineTo(cx + 20, cy - 25);
      ctx.stroke();
    }

    // Material texture dots
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(cx + (rng() - 0.5) * 80, cy + (rng() - 0.5) * 70, 1.5 + rng() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function init() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    renderChips(dom.techChips, TECH, 'tech');
    renderChips(dom.socialChips, SOCIAL, 'social');
    renderChips(dom.cultureChips, CULTURE, 'culture');
    renderChips(dom.domainChips, DOMAIN, 'domain');
    if (dom.btnGenerate) dom.btnGenerate.addEventListener('click', generate);
    setTheme('archive');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
