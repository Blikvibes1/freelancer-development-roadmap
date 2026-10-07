/**
 * MYTH LOOM — Collaborative Myth-Weaving Platform
 * Shared world of fragments with integration, tension, and contributor influence.
 */
(() => {
  'use strict';

  const THEMES = ['loom', 'ink', 'gild'];
  const VIEWS = ['world', 'contribute', 'structure', 'contributors'];
  const TYPES = ['character', 'place', 'event', 'rule', 'artifact'];
  const STORAGE_KEY = 'myth-loom-v1';

  const SEED = [
    { id: 's1', type: 'place', title: 'The Salt Choir', body: 'A coastal city where the tide sings through hollow stone. Citizens measure time by which hymn is rising.', contributor: 'Seed', links: [], tension: [] },
    { id: 's2', type: 'character', title: 'The Glass Matriarch', body: 'Rules the Salt Choir from a balcony of fused sand. She remembers every name spoken within the walls.', contributor: 'Seed', links: ['s1'], tension: [] },
    { id: 's3', type: 'rule', title: 'Names Bind', body: 'To speak a true name three times under the new moon is to obligate the named for one favor.', contributor: 'Seed', links: ['s2'], tension: [] },
    { id: 's4', type: 'event', title: 'The Night the Tide Forgot', body: 'For seven hours the sea held still. Fish hung in the air like unfinished thoughts. No hymn came.', contributor: 'Seed', links: ['s1'], tension: [] },
    { id: 's5', type: 'artifact', title: 'The Unfinished Bell', body: 'Cast to mark the Night the Tide Forgot. It has never been rung; those who try lose the memory of why they came.', contributor: 'Seed', links: ['s4', 's1'], tension: [] },
    { id: 's6', type: 'character', title: 'Orrin the Cartographer', body: 'Maps roads that exist only after they are drawn. Claims the Matriarch\'s memory has gaps he can walk through.', contributor: 'Lira', links: ['s2', 's1'], tension: [] },
    { id: 's7', type: 'rule', title: 'Memory Is Public', body: 'In the Salt Choir, private recollection is considered a mild crime. All important events must be sung.', contributor: 'Lira', links: ['s1', 's3'], tension: ['s3'] }
  ];

  // s7 tensions with s3 conceptually (Names Bind vs Memory Is Public) - we'll detect keyword overlap

  const state = {
    theme: 'loom',
    view: 'world',
    fragments: [],
    filterType: 'all',
    selectedId: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      world: document.getElementById('view-world'),
      contribute: document.getElementById('view-contribute'),
      structure: document.getElementById('view-structure'),
      contributors: document.getElementById('view-contributors')
    },
    fragmentGrid: document.getElementById('fragment-grid'),
    typeFilters: document.getElementById('type-filters'),
    contributeForm: document.getElementById('contribute-form'),
    contributorName: document.getElementById('contributor-name'),
    fragTitle: document.getElementById('frag-title'),
    fragBody: document.getElementById('frag-body'),
    fragLinks: document.getElementById('frag-links'),
    integrateResult: document.getElementById('integrate-result'),
    structureCanvas: document.getElementById('structure-canvas'),
    structureDetail: document.getElementById('structure-detail'),
    contributorList: document.getElementById('contributor-list')
  };

  let ctx = null;
  let w = 0;
  let h = 0;
  let graphNodes = [];

  /* Storage */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length) {
          state.fragments = data;
          return;
        }
      }
    } catch (e) { /* */ }
    state.fragments = SEED.map((f) => Object.assign({}, f, { links: f.links.slice(), tension: f.tension.slice() }));
    // Seed tension between s3 and s7
    const s3 = state.fragments.find((f) => f.id === 's3');
    const s7 = state.fragments.find((f) => f.id === 's7');
    if (s3 && s7) {
      if (!s3.tension.includes('s7')) s3.tension.push('s7');
      if (!s7.tension.includes('s3')) s7.tension.push('s3');
    }
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.fragments));
    } catch (e) { /* */ }
  }

  /* Theme / nav */
  function setTheme(name) {
    if (!THEMES.includes(name)) return;
    state.theme = name;
    dom.body.setAttribute('data-theme', name);
    dom.themeButtons.forEach((btn) => {
      const on = btn.dataset.theme === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    if (state.view === 'structure') drawGraph();
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
    if (name === 'world') renderWorld();
    if (name === 'contribute') populateLinkSelect();
    if (name === 'structure') {
      requestAnimationFrame(() => {
        resizeCanvas();
        layoutGraph();
        drawGraph();
      });
    }
    if (name === 'contributors') renderContributors();
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    if (dom.typeFilters) {
      dom.typeFilters.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          state.filterType = chip.dataset.type;
          dom.typeFilters.querySelectorAll('.filter-chip').forEach((c) => {
            c.classList.toggle('is-active', c.dataset.type === state.filterType);
          });
          renderWorld();
        });
      });
    }
  }

  /* World */
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderWorld() {
    if (!dom.fragmentGrid) return;
    let list = state.fragments.slice();
    if (state.filterType !== 'all') {
      list = list.filter((f) => f.type === state.filterType);
    }
    list = list.slice().reverse();
    dom.fragmentGrid.innerHTML = list.map((f) => `
      <article class="frag-card${f.tension && f.tension.length ? ' has-tension' : ''}" data-id="${f.id}" tabindex="0" role="button">
        <p class="frag-type">${escapeHtml(f.type)}</p>
        <h3 class="frag-title">${escapeHtml(f.title)}</h3>
        <p class="frag-body">${escapeHtml(f.body)}</p>
        <p class="frag-meta">by ${escapeHtml(f.contributor)} · ${f.links.length} link${f.links.length === 1 ? '' : 's'}</p>
        ${f.tension && f.tension.length ? `<span class="frag-tension-badge">Tension ×${f.tension.length}</span>` : ''}
      </article>
    `).join('');

    dom.fragmentGrid.querySelectorAll('.frag-card').forEach((card) => {
      const open = () => {
        state.selectedId = card.dataset.id;
        switchView('structure');
        highlightNode(card.dataset.id);
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  /* Contribute */
  function populateLinkSelect() {
    if (!dom.fragLinks) return;
    dom.fragLinks.innerHTML = state.fragments.map((f) =>
      `<option value="${f.id}">${f.type}: ${f.title}</option>`
    ).join('');
  }

  function detectTension(newFrag) {
    const tensions = [];
    const words = newFrag.body.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    state.fragments.forEach((existing) => {
      if (existing.type === 'rule' && newFrag.type === 'rule') {
        const overlap = words.filter((w) => existing.body.toLowerCase().includes(w));
        if (overlap.length >= 2) tensions.push(existing.id);
      }
      // Contradictory keywords
      const negPairs = [
        ['must', 'never'], ['always', 'never'], ['public', 'private'],
        ['bind', 'free'], ['forbidden', 'required']
      ];
      const a = (existing.body + ' ' + newFrag.body).toLowerCase();
      negPairs.forEach(([x, y]) => {
        if (a.includes(x) && a.includes(y) && existing.type === 'rule') {
          if (!tensions.includes(existing.id)) tensions.push(existing.id);
        }
      });
    });
    return tensions;
  }

  function initContribute() {
    if (!dom.contributeForm) return;
    dom.contributeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const contributor = (dom.contributorName?.value || 'Anonymous').trim() || 'Anonymous';
      const type = document.querySelector('input[name="ftype"]:checked')?.value || 'character';
      const title = (dom.fragTitle?.value || '').trim();
      const body = (dom.fragBody?.value || '').trim();
      if (!title || !body) return;

      const links = Array.from(dom.fragLinks?.selectedOptions || []).map((o) => o.value);
      const frag = {
        id: 'f-' + Date.now(),
        type,
        title,
        body,
        contributor,
        links,
        tension: []
      };

      const tensions = detectTension(frag);
      frag.tension = tensions;
      // Reciprocal tension
      tensions.forEach((tid) => {
        const t = state.fragments.find((f) => f.id === tid);
        if (t && !t.tension.includes(frag.id)) t.tension.push(frag.id);
      });

      state.fragments.push(frag);
      save();

      if (dom.integrateResult) {
        let msg = `<h3>Fragment woven</h3><p><strong>${escapeHtml(title)}</strong> is now part of the world.</p>`;
        if (tensions.length) {
          const names = tensions.map((id) => {
            const f = state.fragments.find((x) => x.id === id);
            return f ? f.title : id;
          });
          msg += `<p style="color:var(--color-tension)">Tension detected with: ${names.map(escapeHtml).join(', ')}. The loom keeps both threads; resolution is left to future weavers.</p>`;
        } else {
          msg += `<p>No immediate contradictions found. Links: ${links.length}.</p>`;
        }
        dom.integrateResult.innerHTML = msg;
        dom.integrateResult.removeAttribute('hidden');
      }

      if (dom.fragTitle) dom.fragTitle.value = '';
      if (dom.fragBody) dom.fragBody.value = '';
      populateLinkSelect();
      renderWorld();
    });
  }

  /* Structure graph */
  function resizeCanvas() {
    if (!dom.structureCanvas || !dom.structureCanvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = dom.structureCanvas.parentElement.clientWidth;
    h = dom.structureCanvas.parentElement.clientHeight;
    dom.structureCanvas.width = w * dpr;
    dom.structureCanvas.height = h * dpr;
    dom.structureCanvas.style.width = w + 'px';
    dom.structureCanvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function layoutGraph() {
    const n = state.fragments.length;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.35;
    graphNodes = state.fragments.map((f, i) => {
      const angle = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      return {
        id: f.id,
        frag: f,
        x: cx + Math.cos(angle) * r * (0.75 + (i % 3) * 0.12),
        y: cy + Math.sin(angle) * r * (0.75 + (i % 3) * 0.12),
        radius: 8 + Math.min(f.links.length, 4)
      };
    });
  }

  function typeColor(type) {
    const map = {
      character: '#c47a9a',
      place: '#6b9fd4',
      event: '#c9a86c',
      rule: '#7cb87c',
      artifact: '#a78bfa'
    };
    return map[type] || '#888';
  }

  function drawGraph() {
    if (!ctx || !w) return;
    ctx.clearRect(0, 0, w, h);
    const accent = getComputedStyle(document.body).getPropertyValue('--color-accent').trim() || '#c4a35a';
    const tension = getComputedStyle(document.body).getPropertyValue('--color-tension').trim() || '#e07a7a';

    // Links
    graphNodes.forEach((node) => {
      (node.frag.links || []).forEach((lid) => {
        const target = graphNodes.find((n) => n.id === lid);
        if (!target) return;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(160,152,184,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      (node.frag.tension || []).forEach((tid) => {
        const target = graphNodes.find((n) => n.id === tid);
        if (!target || node.id > tid) return; // draw once
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = tension;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      });
    });

    // Nodes
    graphNodes.forEach((node) => {
      const selected = state.selectedId === node.id;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + (selected ? 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = typeColor(node.frag.type);
      ctx.globalAlpha = selected ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (selected) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  function highlightNode(id) {
    state.selectedId = id;
    const frag = state.fragments.find((f) => f.id === id);
    if (dom.structureDetail && frag) {
      dom.structureDetail.innerHTML = `
        <p class="frag-type">${escapeHtml(frag.type)}</p>
        <h3 class="frag-title">${escapeHtml(frag.title)}</h3>
        <p class="frag-body" style="-webkit-line-clamp:unset">${escapeHtml(frag.body)}</p>
        <p class="frag-meta">by ${escapeHtml(frag.contributor)}</p>
        ${frag.tension.length ? `<p class="frag-tension-badge">In tension with ${frag.tension.length} fragment(s)</p>` : ''}
      `;
      dom.structureDetail.removeAttribute('hidden');
    }
    drawGraph();
  }

  function initCanvas() {
    if (!dom.structureCanvas) return;
    ctx = dom.structureCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', () => {
      if (state.view === 'structure') {
        resizeCanvas();
        layoutGraph();
        drawGraph();
      }
    });
    dom.structureCanvas.addEventListener('click', (e) => {
      const rect = dom.structureCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (let i = graphNodes.length - 1; i >= 0; i--) {
        const n = graphNodes[i];
        const dx = x - n.x;
        const dy = y - n.y;
        if (dx * dx + dy * dy < (n.radius + 8) ** 2) {
          highlightNode(n.id);
          return;
        }
      }
    });
  }

  /* Contributors */
  function renderContributors() {
    if (!dom.contributorList) return;
    const map = {};
    state.fragments.forEach((f) => {
      if (!map[f.contributor]) map[f.contributor] = { name: f.contributor, count: 0, inbound: 0 };
      map[f.contributor].count += 1;
    });
    state.fragments.forEach((f) => {
      (f.links || []).forEach((lid) => {
        const target = state.fragments.find((x) => x.id === lid);
        if (target && map[target.contributor]) map[target.contributor].inbound += 1;
      });
    });
    const list = Object.values(map).sort((a, b) => (b.count + b.inbound) - (a.count + a.inbound));
    const max = Math.max(1, ...list.map((c) => c.count + c.inbound));
    dom.contributorList.innerHTML = list.map((c) => {
      const score = c.count + c.inbound;
      const pct = Math.round((score / max) * 100);
      return `
        <div class="contrib-card">
          <div>
            <p class="contrib-name">${escapeHtml(c.name)}</p>
            <p class="contrib-stats">${c.count} fragments · ${c.inbound} inbound links</p>
          </div>
          <div>
            <p class="contrib-stats">Influence</p>
            <div class="contrib-bar"><div class="contrib-fill" style="width:${pct}%"></div></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function init() {
    load();
    initChrome();
    initContribute();
    initCanvas();
    setTheme('loom');
    renderWorld();
    switchView('world');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
