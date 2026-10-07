/**
 * LOCI — Memory Palace Builder
 * Spatial mnemonics: rooms, loci, encode, recall.
 */
(() => {
  'use strict';

  const THEMES = ['atrium', 'archive', 'night'];
  const VIEWS = ['palace', 'encode', 'recall', 'guide'];
  const STORAGE_KEY = 'memory-palace-v1';

  const DEFAULT_ROOMS = [
    { id: 'r1', name: 'Entry Hall', x: 0.15, y: 0.5, w: 0.2, h: 0.35 },
    { id: 'r2', name: 'Library', x: 0.4, y: 0.25, w: 0.25, h: 0.3 },
    { id: 'r3', name: 'Garden Court', x: 0.4, y: 0.6, w: 0.25, h: 0.28 },
    { id: 'r4', name: 'Study', x: 0.7, y: 0.4, w: 0.2, h: 0.35 }
  ];

  const state = {
    theme: 'atrium',
    view: 'palace',
    rooms: [],
    loci: [],
    activeRoomId: null,
    selectedLocusId: null,
    recallIndex: 0,
    recallQueue: []
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      palace: document.getElementById('view-palace'),
      encode: document.getElementById('view-encode'),
      recall: document.getElementById('view-recall'),
      guide: document.getElementById('view-guide')
    },
    canvas: document.getElementById('palace-canvas'),
    roomList: document.getElementById('room-list'),
    btnAddRoom: document.getElementById('btn-add-room'),
    locusDetail: document.getElementById('locus-detail'),
    encodeForm: document.getElementById('encode-form'),
    factText: document.getElementById('fact-text'),
    imageText: document.getElementById('image-text'),
    locusRoom: document.getElementById('locus-room'),
    encodeSuccess: document.getElementById('encode-success'),
    recallPanel: document.getElementById('recall-panel')
  };

  let ctx = null;
  let w = 0;
  let h = 0;

  /* Storage */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.rooms) state.rooms = data.rooms;
        if (data.loci) state.loci = data.loci;
      }
    } catch (e) { /* */ }
    if (!state.rooms.length) {
      state.rooms = DEFAULT_ROOMS.map((r) => Object.assign({}, r));
    }
    if (!state.activeRoomId) state.activeRoomId = state.rooms[0]?.id || null;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        rooms: state.rooms,
        loci: state.loci
      }));
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
    draw();
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
    if (name === 'palace') {
      requestAnimationFrame(() => { resize(); draw(); renderRooms(); });
    }
    if (name === 'encode') populateRoomSelect();
    if (name === 'recall') startRecall();
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  /* Rooms */
  function renderRooms() {
    if (!dom.roomList) return;
    dom.roomList.innerHTML = state.rooms.map((r) => {
      const count = state.loci.filter((l) => l.roomId === r.id).length;
      return `
        <li>
          <button type="button" class="room-item${r.id === state.activeRoomId ? ' is-active' : ''}" data-id="${r.id}">
            <span class="room-item-name">${escapeHtml(r.name)}</span>
            <span class="room-item-meta">${count} locus${count === 1 ? '' : 'es'}</span>
          </button>
        </li>
      `;
    }).join('');
    dom.roomList.querySelectorAll('.room-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeRoomId = btn.dataset.id;
        state.selectedLocusId = null;
        if (dom.locusDetail) dom.locusDetail.setAttribute('hidden', '');
        renderRooms();
        draw();
      });
    });
  }

  function initRooms() {
    if (dom.btnAddRoom) {
      dom.btnAddRoom.addEventListener('click', () => {
        const name = prompt('Room name?', 'New Room');
        if (!name || !name.trim()) return;
        const id = 'r-' + Date.now();
        const n = state.rooms.length;
        state.rooms.push({
          id,
          name: name.trim(),
          x: 0.1 + (n % 3) * 0.28,
          y: 0.2 + Math.floor(n / 3) * 0.35,
          w: 0.22,
          h: 0.28
        });
        state.activeRoomId = id;
        save();
        renderRooms();
        populateRoomSelect();
        draw();
      });
    }
  }

  /* Canvas palace */
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

  function roomRect(room) {
    return {
      x: room.x * w,
      y: room.y * h,
      rw: room.w * w,
      rh: room.h * h
    };
  }

  function draw() {
    if (!ctx || !w) return;
    const styles = getComputedStyle(document.body);
    const bg = styles.getPropertyValue('--color-bg').trim() || '#0f1218';
    const elevated = styles.getPropertyValue('--color-bg-elevated').trim() || '#161b24';
    const accent = styles.getPropertyValue('--color-accent').trim() || '#7eb8d4';
    const locusColor = styles.getPropertyValue('--color-locus').trim() || '#e8b86d';
    const muted = styles.getPropertyValue('--color-text-subtle').trim() || '#6a7488';
    const text = styles.getPropertyValue('--color-text').trim() || '#e8ecf4';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(128,128,128,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo((i / 10) * w, 0);
      ctx.lineTo((i / 10) * w, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (i / 10) * h);
      ctx.lineTo(w, (i / 10) * h);
      ctx.stroke();
    }

    state.rooms.forEach((room) => {
      const { x, y, rw, rh } = roomRect(room);
      const active = room.id === state.activeRoomId;
      ctx.fillStyle = active ? elevated : 'rgba(40,48,60,0.5)';
      ctx.strokeStyle = active ? accent : muted;
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      roundRect(ctx, x, y, rw, rh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = active ? accent : muted;
      ctx.font = '600 13px Figtree, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, x + rw / 2, y + 20);

      // Loci in room
      const roomLoci = state.loci.filter((l) => l.roomId === room.id);
      roomLoci.forEach((locus, i) => {
        const cols = Math.ceil(Math.sqrt(roomLoci.length));
        const col = i % cols;
        const row = Math.floor(i / cols);
        const lx = x + 24 + col * ((rw - 48) / Math.max(1, cols - 0.01) || 0);
        const ly = y + 40 + row * 28;
        const selected = locus.id === state.selectedLocusId;
        ctx.beginPath();
        ctx.arc(lx, ly, selected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = locusColor;
        ctx.globalAlpha = selected ? 1 : 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (selected) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        // store hit area
        locus._hx = lx;
        locus._hy = ly;
      });
    });
  }

  function roundRect(ctx, x, y, rw, rh, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, r);
    ctx.arcTo(x + rw, y + rh, x, y + rh, r);
    ctx.arcTo(x, y + rh, x, y, r);
    ctx.arcTo(x, y, x + rw, y, r);
    ctx.closePath();
  }

  function initCanvas() {
    if (!dom.canvas) return;
    ctx = dom.canvas.getContext('2d');
    resize();
    window.addEventListener('resize', () => {
      if (state.view === 'palace') { resize(); draw(); }
    });

    dom.canvas.addEventListener('click', (e) => {
      const rect = dom.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Hit loci first
      for (let i = state.loci.length - 1; i >= 0; i--) {
        const l = state.loci[i];
        if (l._hx == null) continue;
        const dx = x - l._hx;
        const dy = y - l._hy;
        if (dx * dx + dy * dy < 100) {
          state.selectedLocusId = l.id;
          showLocusDetail(l);
          draw();
          return;
        }
      }

      // Hit rooms
      for (let i = state.rooms.length - 1; i >= 0; i--) {
        const room = state.rooms[i];
        const { x: rx, y: ry, rw, rh } = roomRect(room);
        if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
          state.activeRoomId = room.id;
          state.selectedLocusId = null;
          if (dom.locusDetail) dom.locusDetail.setAttribute('hidden', '');
          renderRooms();
          draw();
          return;
        }
      }
    });
  }

  function showLocusDetail(locus) {
    if (!dom.locusDetail) return;
    const room = state.rooms.find((r) => r.id === locus.roomId);
    dom.locusDetail.innerHTML = `
      <h3>${escapeHtml(locus.image)}</h3>
      <p><strong>Fact:</strong> ${escapeHtml(locus.fact)}</p>
      <p><strong>Room:</strong> ${escapeHtml(room?.name || '?')} · <strong>Charge:</strong> ${escapeHtml(locus.emotion)}</p>
    `;
    dom.locusDetail.removeAttribute('hidden');
  }

  /* Encode */
  function populateRoomSelect() {
    if (!dom.locusRoom) return;
    dom.locusRoom.innerHTML = state.rooms.map((r) =>
      `<option value="${r.id}"${r.id === state.activeRoomId ? ' selected' : ''}>${r.name}</option>`
    ).join('');
  }

  function initEncode() {
    if (!dom.encodeForm) return;
    dom.encodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fact = (dom.factText?.value || '').trim();
      const image = (dom.imageText?.value || '').trim();
      const roomId = dom.locusRoom?.value;
      const emotion = document.querySelector('input[name="emotion"]:checked')?.value || 'wonder';
      if (!fact || !image || !roomId) return;

      const locus = {
        id: 'l-' + Date.now(),
        roomId,
        fact,
        image,
        emotion,
        createdAt: new Date().toISOString()
      };
      state.loci.push(locus);
      state.activeRoomId = roomId;
      save();

      if (dom.encodeSuccess) {
        const room = state.rooms.find((r) => r.id === roomId);
        dom.encodeSuccess.innerHTML = `
          <p>Placed in <strong>${escapeHtml(room?.name || 'room')}</strong>.</p>
          <p style="font-size:0.9rem;color:var(--color-text-muted)">Walk there in your mind and see the image. Then try Recall.</p>
        `;
        dom.encodeSuccess.removeAttribute('hidden');
      }
      if (dom.factText) dom.factText.value = '';
      if (dom.imageText) dom.imageText.value = '';
      renderRooms();
    });
  }

  /* Recall */
  function startRecall() {
    if (!dom.recallPanel) return;
    if (!state.loci.length) {
      dom.recallPanel.innerHTML = '<p class="empty-hint">Add at least one encoded locus to begin testing.</p>';
      return;
    }
    state.recallQueue = shuffle(state.loci.slice());
    state.recallIndex = 0;
    showRecallCard();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showRecallCard() {
    const locus = state.recallQueue[state.recallIndex];
    if (!locus) {
      dom.recallPanel.innerHTML = `
        <p class="recall-prompt">Round complete.</p>
        <button type="button" class="btn btn-primary" id="btn-recall-again">Test again</button>
      `;
      document.getElementById('btn-recall-again')?.addEventListener('click', startRecall);
      return;
    }
    const room = state.rooms.find((r) => r.id === locus.roomId);
    dom.recallPanel.innerHTML = `
      <p class="recall-prompt">You enter the <strong>${escapeHtml(room?.name || 'room')}</strong>.<br>
      You see: <em>${escapeHtml(locus.image)}</em></p>
      <p class="field-label">What fact does this encode?</p>
      <input type="text" class="recall-input" id="recall-answer" placeholder="Type the fact…" autocomplete="off">
      <div id="recall-feedback" class="recall-feedback" hidden></div>
      <button type="button" class="btn btn-primary" id="btn-recall-check">Check</button>
      <button type="button" class="btn btn-secondary" id="btn-recall-reveal" style="margin-top:0.5rem">Reveal</button>
    `;
    const check = () => {
      const ans = (document.getElementById('recall-answer')?.value || '').trim().toLowerCase();
      const target = locus.fact.toLowerCase();
      const fb = document.getElementById('recall-feedback');
      if (!fb) return;
      // Simple overlap score
      const aw = ans.split(/\W+/).filter((w) => w.length > 3);
      const tw = target.split(/\W+/).filter((w) => w.length > 3);
      const hits = aw.filter((w) => tw.includes(w)).length;
      const ok = hits >= Math.min(2, tw.length) || target.includes(ans) || ans.includes(target.slice(0, 20));
      fb.hidden = false;
      if (ok) {
        fb.className = 'recall-feedback ok';
        fb.textContent = 'Strong retrieval. The path is reinforced.';
      } else {
        fb.className = 'recall-feedback miss';
        fb.textContent = 'Not quite. Reveal or try again — struggle helps encoding.';
      }
    };
    document.getElementById('btn-recall-check')?.addEventListener('click', check);
    document.getElementById('recall-answer')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });
    document.getElementById('btn-recall-reveal')?.addEventListener('click', () => {
      const fb = document.getElementById('recall-feedback');
      if (fb) {
        fb.hidden = false;
        fb.className = 'recall-feedback';
        fb.textContent = locus.fact;
      }
      setTimeout(() => {
        state.recallIndex += 1;
        showRecallCard();
      }, 1200);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function init() {
    load();
    initChrome();
    initRooms();
    initCanvas();
    initEncode();
    setTheme('atrium');
    renderRooms();
    switchView('palace');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
