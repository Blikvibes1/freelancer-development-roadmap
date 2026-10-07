/**
 * INNER LIFE — Character Consciousness Engine
 * Persistent characters with memory, beliefs, contradictions, gradual change.
 */
(() => {
  'use strict';

  const THEMES = ['inward', 'clinic', 'theater'];
  const VIEWS = ['chat', 'mind', 'create'];
  const STORAGE_KEY = 'consciousness-engine-v1';

  const TEMPERAMENT_VOICE = {
    warm: {
      openers: ['I\'ve been thinking about what you said…', 'That lands somewhere soft in me.', 'I want to meet you there.'],
      hedges: ['maybe', 'I feel', 'it seems'],
      closers: ['Does that make sense?', 'I\'m still turning it over.', 'Tell me more if you want.']
    },
    reserved: {
      openers: ['Noted.', 'I heard that.', 'Interesting.'],
      hedges: ['perhaps', 'one might say', 'in a sense'],
      closers: ['That\'s all for now.', 'I need to sit with this.', 'Continue if you wish.']
    },
    volatile: {
      openers: ['Wait—', 'That hits hard.', 'No, listen—'],
      hedges: ['honestly', 'I swear', 'look'],
      closers: ['Or am I wrong?', 'Don\'t leave that hanging.', 'Say something.']
    },
    analytical: {
      openers: ['Let me parse that.', 'There are layers here.', 'Structurally…'],
      hedges: ['it follows that', 'on balance', 'the pattern suggests'],
      closers: ['What do you conclude?', 'I\'d revise that model.', 'Data point filed.']
    }
  };

  const MOODS = ['steady', 'guarded', 'open', 'restless', 'wistful', 'sharp'];

  const state = {
    theme: 'inward',
    view: 'chat',
    characters: [],
    activeId: null
  };

  const dom = {
    body: document.body,
    navButtons: document.querySelectorAll('.nav-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    views: {
      chat: document.getElementById('view-chat'),
      mind: document.getElementById('view-mind'),
      create: document.getElementById('view-create')
    },
    charRail: document.getElementById('char-rail'),
    chatHeader: document.getElementById('chat-header'),
    chatName: document.querySelector('.chat-name'),
    chatMood: document.getElementById('chat-mood'),
    chatLog: document.getElementById('chat-log'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    chatSend: document.getElementById('chat-send'),
    mindContent: document.getElementById('mind-content'),
    createForm: document.getElementById('create-form')
  };

  /* Storage */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.characters) state.characters = data.characters;
        if (data.activeId) state.activeId = data.activeId;
      }
    } catch (e) { /* */ }
    if (!state.characters.length) seedDefault();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        characters: state.characters,
        activeId: state.activeId
      }));
    } catch (e) { /* */ }
  }

  function seedDefault() {
    state.characters = [
      createCharacter({
        name: 'Maris',
        temperament: 'warm',
        belief: 'People leave when things get hard',
        tension: 'Craves closeness but tests it constantly'
      }),
      createCharacter({
        name: 'Corvin',
        temperament: 'analytical',
        belief: 'Patterns explain more than feelings',
        tension: 'Secretly wants to be surprised by chaos'
      })
    ];
    state.activeId = state.characters[0].id;
    save();
  }

  function createCharacter({ name, temperament, belief, tension }) {
    return {
      id: 'c-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
      name,
      temperament,
      mood: 'steady',
      beliefs: [
        { text: belief, strength: 0.8 },
        { text: 'Trust is earned slowly', strength: 0.5 }
      ],
      tension,
      goals: ['Understand the other person', 'Protect the core belief'],
      memories: [],
      opinionOfUser: 0.5,
      conversationCount: 0,
      createdAt: new Date().toISOString(),
      lastTalkAt: null
    };
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
    if (name === 'mind') renderMind();
  }

  function initChrome() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  /* Character rail */
  function renderRail() {
    if (!dom.charRail) return;
    if (!state.characters.length) {
      dom.charRail.innerHTML = '<p class="char-rail-empty">No characters yet. Create one.</p>';
      return;
    }
    dom.charRail.innerHTML = state.characters.map((c) => `
      <button type="button" class="char-item${c.id === state.activeId ? ' is-active' : ''}" data-id="${c.id}">
        <span class="char-item-name">${escapeHtml(c.name)}</span>
        <span class="char-item-meta">${c.temperament} · ${c.mood}</span>
      </button>
    `).join('');
    dom.charRail.querySelectorAll('.char-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeId = btn.dataset.id;
        save();
        renderRail();
        renderChat();
        if (state.view === 'mind') renderMind();
      });
    });
  }

  function activeChar() {
    return state.characters.find((c) => c.id === state.activeId) || null;
  }

  /* Chat */
  function renderChat() {
    const c = activeChar();
    if (!c) {
      if (dom.chatName) dom.chatName.textContent = 'Select a character';
      if (dom.chatMood) dom.chatMood.textContent = '';
      if (dom.chatLog) dom.chatLog.innerHTML = '';
      if (dom.chatInput) dom.chatInput.disabled = true;
      if (dom.chatSend) dom.chatSend.disabled = true;
      return;
    }
    if (dom.chatName) dom.chatName.textContent = c.name;
    if (dom.chatMood) dom.chatMood.textContent = `${c.temperament} · mood: ${c.mood} · opinion of you: ${opinionLabel(c.opinionOfUser)}`;
    if (dom.chatInput) dom.chatInput.disabled = false;
    if (dom.chatSend) dom.chatSend.disabled = false;

    if (!dom.chatLog) return;
    if (!c.memories.length) {
      dom.chatLog.innerHTML = `<p class="msg-system">${escapeHtml(c.name)} is present. They have not spoken with you yet.</p>`;
      return;
    }
    dom.chatLog.innerHTML = c.memories.map((m) => {
      if (m.role === 'system') {
        return `<p class="msg-system">${escapeHtml(m.text)}</p>`;
      }
      return `
        <div class="msg ${m.role === 'user' ? 'user' : 'char'}">
          <p class="msg-meta">${m.role === 'user' ? 'You' : escapeHtml(c.name)}</p>
          <p>${escapeHtml(m.text)}</p>
        </div>
      `;
    }).join('');
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
  }

  function opinionLabel(v) {
    if (v > 0.75) return 'warm';
    if (v > 0.55) return 'favorable';
    if (v > 0.4) return 'neutral';
    if (v > 0.25) return 'wary';
    return 'distant';
  }

  function generateReply(c, userText) {
    const voice = TEMPERAMENT_VOICE[c.temperament] || TEMPERAMENT_VOICE.warm;
    const lower = userText.toLowerCase();

    // Opinion shift
    const positive = /\b(thanks|thank|love|like|agree|good|beautiful|kind|sorry|please)\b/.test(lower);
    const negative = /\b(hate|stupid|wrong|never|always|idiot|shut)\b/.test(lower);
    if (positive) c.opinionOfUser = Math.min(1, c.opinionOfUser + 0.04);
    if (negative) c.opinionOfUser = Math.max(0, c.opinionOfUser - 0.06);

    // Belief activation
    let beliefEcho = '';
    c.beliefs.forEach((b) => {
      const words = b.text.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      if (words.some((w) => lower.includes(w))) {
        b.strength = Math.min(1, b.strength + 0.03);
        beliefEcho = b.text;
      }
    });

    // Mood drift
    if (negative) c.mood = pick(['guarded', 'sharp', 'restless']);
    else if (positive) c.mood = pick(['open', 'steady', 'wistful']);
    else if (Math.random() < 0.2) c.mood = pick(MOODS);

    // Memory reference
    const pastUser = c.memories.filter((m) => m.role === 'user').slice(-5);
    let memoryBit = '';
    if (pastUser.length > 2 && Math.random() < 0.35) {
      const past = pastUser[Math.floor(Math.random() * pastUser.length)];
      memoryBit = ` Earlier you mentioned something like “${clip(past.text, 40)}” — it still sits with me.`;
    }

    // Contradiction surfaces occasionally
    let tensionBit = '';
    if (Math.random() < 0.25) {
      tensionBit = ` (Between us: ${c.tension.toLowerCase()}.)`;
    }

    // Goal evolution
    if (c.conversationCount > 0 && c.conversationCount % 5 === 0) {
      const newGoals = [
        'Test whether this person stays',
        'Share one true thing',
        'Revise the core belief',
        'Protect the soft parts',
        'Find out what they fear'
      ];
      const g = pick(newGoals);
      if (!c.goals.includes(g)) c.goals.push(g);
      if (c.goals.length > 4) c.goals.shift();
    }

    const opener = pick(voice.openers);
    const hedge = pick(voice.hedges);
    const closer = pick(voice.closers);

    let core;
    if (beliefEcho) {
      core = `${hedge} what you said brushes against something I hold: “${beliefEcho}.”`;
    } else if (c.opinionOfUser < 0.3) {
      core = `${hedge} I am not sure I trust the shape of this yet.`;
    } else if (c.opinionOfUser > 0.7) {
      core = `${hedge} talking with you is starting to rearrange me a little.`;
    } else {
      core = `${hedge} there is more under your words than the surface.`;
    }

    return `${opener} ${core}${memoryBit}${tensionBit} ${closer}`.replace(/\s+/g, ' ').trim();
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clip(s, n) {
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function handleSend(text) {
    const c = activeChar();
    if (!c || !text.trim()) return;

    c.memories.push({ role: 'user', text: text.trim(), at: new Date().toISOString() });
    c.conversationCount += 1;
    c.lastTalkAt = new Date().toISOString();

    const reply = generateReply(c, text.trim());
    c.memories.push({ role: 'char', text: reply, at: new Date().toISOString() });

    // Cap memory
    if (c.memories.length > 80) {
      c.memories = c.memories.slice(-80);
    }

    // Occasional internal development system note
    if (c.conversationCount % 7 === 0) {
      c.memories.push({
        role: 'system',
        text: `${c.name}'s inner state shifted. Mood: ${c.mood}. A goal may have changed.`,
        at: new Date().toISOString()
      });
    }

    save();
    renderChat();
    renderRail();
  }

  function initChat() {
    if (!dom.chatForm) return;
    dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = dom.chatInput?.value || '';
      if (dom.chatInput) dom.chatInput.value = '';
      handleSend(text);
    });
  }

  /* Mind view */
  function renderMind() {
    const c = activeChar();
    if (!dom.mindContent) return;
    if (!c) {
      dom.mindContent.innerHTML = '<p class="empty-hint">Select a character in Dialogue first.</p>';
      return;
    }
    dom.mindContent.innerHTML = `
      <div class="mind-grid">
        <div class="mind-card">
          <h3>Beliefs</h3>
          <ul>
            ${c.beliefs.map((b) =>
              `<li>${escapeHtml(b.text)} <span class="belief-strength">(${Math.round(b.strength * 100)}%)</span></li>`
            ).join('')}
          </ul>
        </div>
        <div class="mind-card">
          <h3>Private tension</h3>
          <ul><li>${escapeHtml(c.tension)}</li></ul>
        </div>
        <div class="mind-card">
          <h3>Goals</h3>
          <ul>${c.goals.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
        </div>
        <div class="mind-card">
          <h3>State</h3>
          <ul>
            <li>Mood: ${escapeHtml(c.mood)}</li>
            <li>Temperament: ${escapeHtml(c.temperament)}</li>
            <li>Opinion of you: ${opinionLabel(c.opinionOfUser)}</li>
            <li>Conversations: ${c.conversationCount}</li>
          </ul>
        </div>
        <div class="mind-card">
          <h3>Recent memory traces</h3>
          <ul>
            ${c.memories.filter((m) => m.role === 'user').slice(-4).map((m) =>
              `<li>${escapeHtml(clip(m.text, 60))}</li>`
            ).join('') || '<li>None yet</li>'}
          </ul>
        </div>
      </div>
    `;
  }

  /* Create */
  function initCreate() {
    if (!dom.createForm) return;
    dom.createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('char-name')?.value?.trim();
      const temperament = document.querySelector('input[name="temperament"]:checked')?.value || 'warm';
      const belief = document.getElementById('char-belief')?.value?.trim();
      const tension = document.getElementById('char-tension')?.value?.trim();
      if (!name || !belief || !tension) return;

      const c = createCharacter({ name, temperament, belief, tension });
      state.characters.push(c);
      state.activeId = c.id;
      save();
      renderRail();
      renderChat();
      switchView('chat');
      dom.createForm.reset();
      document.querySelector('input[name="temperament"][value="warm"]')?.setAttribute('checked', '');
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
    initChat();
    initCreate();
    setTheme('inward');
    renderRail();
    renderChat();
    switchView('chat');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
