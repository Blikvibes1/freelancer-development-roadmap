/**
 * DREAM ARCHIVE — Collective Subconscious
 * Intimate dream collection, symbol clustering, constellation, lineages.
 */
(() => {
  'use strict';

  const THEMES = ['nocturne', 'mist', 'ember'];
  const VIEWS = ['archive', 'submit', 'constellation', 'lineages'];
  const STORAGE_KEY = 'dream-archive-v1';

  /* Symbol lexicon for extraction */
  const SYMBOL_LEXICON = [
    'water', 'ocean', 'river', 'rain', 'flood', 'sea',
    'house', 'room', 'door', 'window', 'stairs', 'corridor',
    'forest', 'tree', 'garden', 'flower', 'path',
    'sky', 'star', 'moon', 'sun', 'cloud', 'storm',
    'bird', 'animal', 'dog', 'cat', 'horse', 'fish',
    'child', 'mother', 'father', 'stranger', 'crowd',
    'flying', 'falling', 'running', 'chasing', 'searching',
    'mirror', 'shadow', 'light', 'darkness', 'fire',
    'train', 'car', 'bridge', 'city', 'mountain',
    'teeth', 'hair', 'eye', 'hand', 'voice',
    'school', 'book', 'letter', 'phone', 'clock',
    'death', 'birth', 'wedding', 'war', 'peace'
  ];

  /* Seed dreams for a living archive feel */
  const SEED_DREAMS = [
    {
      id: 'seed-1',
      text: 'I stood in a house that rearranged itself whenever I looked away. Each new room held a different season. In the winter room, my childhood dog waited by a frozen window.',
      feeling: 'longing',
      symbols: ['house', 'room', 'window', 'dog'],
      createdAt: '2026-09-12T03:14:00.000Z'
    },
    {
      id: 'seed-2',
      text: 'Flying over a dark ocean. The water rose toward me in slow columns. Below, a city of lights blinked like eyes opening and closing.',
      feeling: 'wonder',
      symbols: ['flying', 'ocean', 'water', 'city', 'light'],
      createdAt: '2026-09-14T01:22:00.000Z'
    },
    {
      id: 'seed-3',
      text: 'I was late for a train that never arrived. The station filled with strangers who all had my mother\'s face. Rain fell upward through the glass roof.',
      feeling: 'dread',
      symbols: ['train', 'stranger', 'mother', 'rain'],
      createdAt: '2026-09-18T04:05:00.000Z'
    },
    {
      id: 'seed-4',
      text: 'A forest path that kept branching. At every fork, a child pointed the way but never spoke. The trees leaned in as if listening.',
      feeling: 'confusion',
      symbols: ['forest', 'path', 'tree', 'child'],
      createdAt: '2026-09-20T02:40:00.000Z'
    },
    {
      id: 'seed-5',
      text: 'I found a mirror in an empty school hallway. My reflection aged while I watched. Behind it, another corridor stretched into soft blue light.',
      feeling: 'wonder',
      symbols: ['mirror', 'school', 'light', 'corridor'],
      createdAt: '2026-09-22T05:11:00.000Z'
    },
    {
      id: 'seed-6',
      text: 'Swimming through a flooded library. Books opened underwater and released silver fish. I could breathe if I stayed calm.',
      feeling: 'peace',
      symbols: ['water', 'book', 'fish', 'flood'],
      createdAt: '2026-09-25T03:33:00.000Z'
    },
    {
      id: 'seed-7',
      text: 'Chasing someone through a city of stairs. Every door opened onto the same room with a single window facing the sea.',
      feeling: 'longing',
      symbols: ['chasing', 'city', 'stairs', 'door', 'window', 'sea'],
      createdAt: '2026-09-28T01:55:00.000Z'
    },
    {
      id: 'seed-8',
      text: 'My teeth fell out one by one into a glass of water. Each tooth became a small moon. Outside, a storm held still in the sky.',
      feeling: 'dread',
      symbols: ['teeth', 'water', 'moon', 'storm', 'sky'],
      createdAt: '2026-09-30T04:18:00.000Z'
    }
  ];

  const state = {
    theme: 'nocturne',
    view: 'archive',
    dreams: [],
    filterSymbol: null,
    searchQuery: '',
    selectedDreamId: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      archive: document.getElementById('view-archive'),
      submit: document.getElementById('view-submit'),
      constellation: document.getElementById('view-constellation'),
      lineages: document.getElementById('view-lineages')
    },
    dreamGrid: document.getElementById('dream-grid'),
    archiveEmpty: document.getElementById('archive-empty'),
    searchInput: document.getElementById('search-input'),
    symbolChips: document.getElementById('symbol-chips'),
    dreamForm: document.getElementById('dream-form'),
    dreamText: document.getElementById('dream-text'),
    submitSuccess: document.getElementById('submit-success'),
    btnViewArchive: document.getElementById('btn-view-archive'),
    constellationCanvas: document.getElementById('constellation-canvas'),
    dreamDetail: document.getElementById('dream-detail'),
    lineageList: document.getElementById('lineage-list')
  };

  /* --------------------------------------------------------------------
     Storage
     -------------------------------------------------------------------- */
  function loadDreams() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) { /* ignore */ }
    return SEED_DREAMS.slice();
  }

  function saveDreams() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dreams));
    } catch (e) { /* ignore */ }
  }

  /* --------------------------------------------------------------------
     Symbol extraction
     -------------------------------------------------------------------- */
  function extractSymbols(text) {
    const lower = text.toLowerCase();
    const found = [];
    SYMBOL_LEXICON.forEach((sym) => {
      if (lower.includes(sym) && !found.includes(sym)) found.push(sym);
    });
    return found.slice(0, 8);
  }

  /* --------------------------------------------------------------------
     Theme & navigation
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
    if (state.view === 'constellation') constellation.render();
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
    if (name === 'constellation') {
      requestAnimationFrame(() => {
        constellation.resize();
        constellation.layout();
        constellation.render();
      });
    }
    if (name === 'lineages') renderLineages();
    if (name === 'archive') renderArchive();
  }

  function initThemeNav() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  /* --------------------------------------------------------------------
     Archive rendering
     -------------------------------------------------------------------- */
  function getFilteredDreams() {
    let list = state.dreams.slice();
    if (state.filterSymbol) {
      list = list.filter((d) => d.symbols && d.symbols.includes(state.filterSymbol));
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter((d) =>
        d.text.toLowerCase().includes(q) ||
        (d.symbols && d.symbols.some((s) => s.includes(q))) ||
        (d.feeling && d.feeling.includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function allSymbols() {
    const counts = {};
    state.dreams.forEach((d) => {
      (d.symbols || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([sym]) => sym);
  }

  function renderSymbolChips() {
    if (!dom.symbolChips) return;
    const syms = allSymbols();
    dom.symbolChips.innerHTML = syms.map((s) =>
      `<button type="button" class="symbol-chip${state.filterSymbol === s ? ' is-active' : ''}" data-symbol="${s}">${s}</button>`
    ).join('');
    dom.symbolChips.querySelectorAll('.symbol-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sym = btn.dataset.symbol;
        state.filterSymbol = state.filterSymbol === sym ? null : sym;
        renderSymbolChips();
        renderArchive();
      });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderArchive() {
    const list = getFilteredDreams();
    if (!dom.dreamGrid) return;

    if (!list.length) {
      dom.dreamGrid.innerHTML = '';
      if (dom.archiveEmpty) dom.archiveEmpty.removeAttribute('hidden');
      return;
    }
    if (dom.archiveEmpty) dom.archiveEmpty.setAttribute('hidden', '');

    dom.dreamGrid.innerHTML = list.map((d) => `
      <article class="dream-card" data-id="${d.id}" tabindex="0" role="button">
        <p class="dream-feeling">${escapeHtml(d.feeling || 'unknown')}</p>
        <p class="dream-excerpt">${escapeHtml(d.text)}</p>
        <div class="dream-symbols">
          ${(d.symbols || []).map((s) => `<span class="dream-symbol">${escapeHtml(s)}</span>`).join('')}
        </div>
      </article>
    `).join('');

    dom.dreamGrid.querySelectorAll('.dream-card').forEach((card) => {
      const open = () => {
        state.selectedDreamId = card.dataset.id;
        switchView('constellation');
        constellation.focusDream(card.dataset.id);
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  /* --------------------------------------------------------------------
     Submit
     -------------------------------------------------------------------- */
  function initForm() {
    if (!dom.dreamForm) return;
    dom.dreamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (dom.dreamText?.value || '').trim();
      if (!text || text.length < 10) return;
      const feeling = dom.dreamForm.querySelector('input[name="feeling"]:checked')?.value || 'wonder';
      const symbols = extractSymbols(text);
      const dream = {
        id: 'user-' + Date.now(),
        text,
        feeling,
        symbols: symbols.length ? symbols : ['shadow'],
        createdAt: new Date().toISOString()
      };
      state.dreams.unshift(dream);
      saveDreams();
      renderSymbolChips();
      renderArchive();
      dom.dreamForm.setAttribute('hidden', '');
      if (dom.submitSuccess) dom.submitSuccess.removeAttribute('hidden');
      if (dom.dreamText) dom.dreamText.value = '';
    });

    if (dom.btnViewArchive) {
      dom.btnViewArchive.addEventListener('click', () => {
        if (dom.submitSuccess) dom.submitSuccess.setAttribute('hidden', '');
        if (dom.dreamForm) dom.dreamForm.removeAttribute('hidden');
        switchView('archive');
      });
    }
  }

  function initSearch() {
    if (!dom.searchInput) return;
    let timer;
    dom.searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.searchQuery = dom.searchInput.value.trim();
        renderArchive();
      }, 180);
    });
  }

  /* --------------------------------------------------------------------
     Lineages
     -------------------------------------------------------------------- */
  function computeLineages() {
    const map = {};
    state.dreams.forEach((d) => {
      (d.symbols || []).forEach((s) => {
        if (!map[s]) map[s] = [];
        map[s].push(d);
      });
    });
    return Object.entries(map)
      .filter(([, dreams]) => dreams.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 12)
      .map(([motif, dreams]) => ({ motif, dreams }));
  }

  function renderLineages() {
    if (!dom.lineageList) return;
    const lineages = computeLineages();
    if (!lineages.length) {
      dom.lineageList.innerHTML = '<p class="empty-state">No shared motifs yet. More dreams will weave lineages.</p>';
      return;
    }
    dom.lineageList.innerHTML = lineages.map((L) => `
      <article class="lineage-card">
        <h3 class="lineage-motif">${escapeHtml(L.motif)}</h3>
        <p class="lineage-count">${L.dreams.length} dreams carry this motif</p>
        <ul class="lineage-dreams">
          ${L.dreams.slice(0, 4).map((d) =>
            `<li>${escapeHtml(d.text.slice(0, 120))}${d.text.length > 120 ? '…' : ''}</li>`
          ).join('')}
        </ul>
      </article>
    `).join('');
  }

  /* --------------------------------------------------------------------
     Constellation
     -------------------------------------------------------------------- */
  const constellation = {
    ctx: null,
    nodes: [],
    links: [],
    w: 0,
    h: 0,
    dragged: null,
    offset: { x: 0, y: 0 },

    init() {
      if (!dom.constellationCanvas) return;
      this.ctx = dom.constellationCanvas.getContext('2d');
      this.resize();
      this.bind();
      window.addEventListener('resize', () => {
        this.resize();
        this.layout();
        this.render();
      });
    },

    resize() {
      const canvas = dom.constellationCanvas;
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = canvas.parentElement.clientWidth;
      this.h = canvas.parentElement.clientHeight;
      canvas.width = this.w * dpr;
      canvas.height = this.h * dpr;
      canvas.style.width = this.w + 'px';
      canvas.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    layout() {
      const dreams = state.dreams;
      const cx = this.w / 2;
      const cy = this.h / 2;
      const r = Math.min(this.w, this.h) * 0.32;

      this.nodes = dreams.map((d, i) => {
        const angle = (i / Math.max(1, dreams.length)) * Math.PI * 2 - Math.PI / 2;
        return {
          id: d.id,
          dream: d,
          x: cx + Math.cos(angle) * r * (0.7 + (i % 3) * 0.15),
          y: cy + Math.sin(angle) * r * (0.7 + (i % 3) * 0.15),
          radius: 10 + Math.min((d.symbols || []).length, 6) * 2
        };
      });

      this.links = [];
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const a = this.nodes[i].dream.symbols || [];
          const b = this.nodes[j].dream.symbols || [];
          const shared = a.filter((s) => b.includes(s));
          if (shared.length) {
            this.links.push({
              source: this.nodes[i],
              target: this.nodes[j],
              weight: shared.length,
              symbols: shared
            });
          }
        }
      }
    },

    bind() {
      const canvas = dom.constellationCanvas;
      if (!canvas) return;
      const self = this;

      canvas.addEventListener('pointerdown', (e) => {
        const pos = self.pointer(e);
        const node = self.hit(pos.x, pos.y);
        if (node) {
          self.dragged = node;
          self.offset.x = pos.x - node.x;
          self.offset.y = pos.y - node.y;
          canvas.setPointerCapture(e.pointerId);
          self.showDetail(node.dream);
          state.selectedDreamId = node.id;
          self.render();
        } else {
          self.hideDetail();
          state.selectedDreamId = null;
          self.render();
        }
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!self.dragged) return;
        const pos = self.pointer(e);
        self.dragged.x = Math.max(12, Math.min(self.w - 12, pos.x - self.offset.x));
        self.dragged.y = Math.max(12, Math.min(self.h - 12, pos.y - self.offset.y));
        self.render();
      });

      canvas.addEventListener('pointerup', (e) => {
        if (self.dragged) {
          try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* */ }
        }
        self.dragged = null;
      });
    },

    pointer(e) {
      const rect = dom.constellationCanvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },

    hit(x, y) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        const dx = x - n.x;
        const dy = y - n.y;
        if (dx * dx + dy * dy < (n.radius + 6) * (n.radius + 6)) return n;
      }
      return null;
    },

    themeColor() {
      if (state.theme === 'mist') return { node: '#5b7cfa', link: '91,124,250', text: '#1e2433' };
      if (state.theme === 'ember') return { node: '#c4784a', link: '196,120,74', text: '#f2e8dc' };
      return { node: '#8b7ec8', link: '139,126,200', text: '#e6e4f0' };
    },

    render() {
      if (!this.ctx || !this.w) return;
      const ctx = this.ctx;
      const c = this.themeColor();
      ctx.clearRect(0, 0, this.w, this.h);

      // Links
      this.links.forEach((link) => {
        const alpha = 0.15 + link.weight * 0.12;
        const highlight = state.selectedDreamId &&
          (link.source.id === state.selectedDreamId || link.target.id === state.selectedDreamId);
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = `rgba(${c.link}, ${highlight ? Math.min(alpha + 0.35, 0.9) : alpha})`;
        ctx.lineWidth = highlight ? 2 : 1;
        ctx.stroke();
      });

      // Nodes
      this.nodes.forEach((n) => {
        const selected = n.id === state.selectedDreamId;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (selected ? 4 : 0), 0, Math.PI * 2);
        ctx.fillStyle = selected ? c.node : c.node;
        ctx.globalAlpha = selected ? 1 : 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Feeling initial
        ctx.fillStyle = state.theme === 'mist' ? '#fff' : '#0a0c14';
        ctx.font = '600 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = (n.dream.feeling || '?')[0].toUpperCase();
        ctx.fillText(letter, n.x, n.y);
      });
    },

    showDetail(dream) {
      if (!dom.dreamDetail || !dream) return;
      dom.dreamDetail.innerHTML = `
        <button type="button" class="detail-close" aria-label="Close">×</button>
        <p class="detail-feeling">${escapeHtml(dream.feeling || '')}</p>
        <p class="detail-text">${escapeHtml(dream.text)}</p>
        <p class="detail-symbols">${(dream.symbols || []).map(escapeHtml).join(' · ')}</p>
      `;
      dom.dreamDetail.removeAttribute('hidden');
      const close = dom.dreamDetail.querySelector('.detail-close');
      if (close) {
        close.addEventListener('click', () => {
          this.hideDetail();
          state.selectedDreamId = null;
          this.render();
        });
      }
    },

    hideDetail() {
      if (dom.dreamDetail) dom.dreamDetail.setAttribute('hidden', '');
    },

    focusDream(id) {
      this.layout();
      state.selectedDreamId = id;
      const node = this.nodes.find((n) => n.id === id);
      if (node) this.showDetail(node.dream);
      this.render();
    }
  };

  /* --------------------------------------------------------------------
     Init
     -------------------------------------------------------------------- */
  function init() {
    state.dreams = loadDreams();
    initThemeNav();
    initForm();
    initSearch();
    constellation.init();
    setTheme('nocturne');
    renderSymbolChips();
    renderArchive();
    switchView('archive');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
