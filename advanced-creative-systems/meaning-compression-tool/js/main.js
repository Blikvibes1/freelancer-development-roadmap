/**
 * DENSITAS — Meaning Compression Tool
 * Progressive densification across poetic, diagrammatic, mathematical, ritualistic aesthetics.
 */
(() => {
  'use strict';

  const THEMES = ['cipher', 'vellum', 'terminal'];
  const AESTHETICS = ['poetic', 'diagrammatic', 'mathematical', 'ritualistic'];

  const SAMPLE = `Yesterday the train stalled between stations for forty minutes. Strangers shared a charger, then a story about a dog that waited at the wrong platform every evening for three years. When we finally moved, nobody clapped. Someone had drawn a small house in the condensation on the window, and the sun erased it before we reached the city.`;

  const STOP = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been', 'are', 'that', 'this', 'it',
    'we', 'they', 'he', 'she', 'you', 'i', 'my', 'our', 'their', 'had', 'have', 'has',
    'not', 'no', 'so', 'if', 'when', 'then', 'than', 'too', 'very', 'just', 'about'
  ]);

  const state = {
    theme: 'cipher',
    aesthetic: 'poetic',
    depth: 3
  };

  const dom = {
    body: document.body,
    themeButtons: document.querySelectorAll('.theme-btn'),
    sourceText: document.getElementById('source-text'),
    aestheticChips: document.getElementById('aesthetic-chips'),
    depthRange: document.getElementById('depth-range'),
    depthVal: document.getElementById('depth-val'),
    btnCompress: document.getElementById('btn-compress'),
    btnSample: document.getElementById('btn-sample'),
    emptyState: document.getElementById('empty-state'),
    layers: document.getElementById('layers'),
    collapseMeter: document.getElementById('collapse-meter'),
    integrityFill: document.getElementById('integrity-fill'),
    integrityVal: document.getElementById('integrity-val')
  };

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

  function renderAesthetics() {
    if (!dom.aestheticChips) return;
    dom.aestheticChips.innerHTML = AESTHETICS.map((a) => {
      const on = state.aesthetic === a;
      return `<button type="button" class="chip${on ? ' is-on' : ''}" data-val="${a}">${a}</button>`;
    }).join('');
    dom.aestheticChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.aesthetic = chip.dataset.val;
        renderAesthetics();
      });
    });
  }

  function tokenize(text) {
    return text
      .replace(/[^\w\s'’-]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean);
  }

  function contentWords(tokens) {
    return tokens.filter((t) => !STOP.has(t.toLowerCase()) && t.length > 1);
  }

  function ratio(a, b) {
    if (!b) return 0;
    return a / b;
  }

  /* ——— Compression strategies ——— */

  function compressPoetic(text, level) {
    const tokens = tokenize(text);
    const content = contentWords(tokens);
    if (level === 1) {
      // Keep content words, light glue
      return content.slice(0, Math.max(8, Math.floor(content.length * 0.7))).join(' · ');
    }
    if (level === 2) {
      const picks = content.filter((_, i) => i % 2 === 0 || content[i].length > 5);
      return picks.slice(0, Math.max(5, Math.floor(picks.length * 0.55))).join(' / ');
    }
    if (level === 3) {
      return content
        .filter((w) => w.length > 4)
        .slice(0, Math.max(4, Math.floor(content.length * 0.35)))
        .join(' — ');
    }
    if (level === 4) {
      const core = content.filter((w) => w.length > 5).slice(0, 5);
      return core.map((w) => w.toLowerCase()).join(' · ');
    }
    if (level === 5) {
      const core = content.filter((w) => w.length > 5).slice(0, 3);
      return core.map((w) => w.slice(0, 4)).join(' ');
    }
    // level 6: near collapse
    const seed = content[0] || tokens[0] || '?';
    return seed.slice(0, 3).toUpperCase() + '…';
  }

  function compressDiagrammatic(text, level) {
    const tokens = tokenize(text);
    const content = contentWords(tokens);
    const nodes = content.slice(0, Math.max(3, 12 - level * 1.5));
    if (level <= 2) {
      return nodes.map((n, i) => `[${n}]`).join(level === 1 ? ' → ' : ' — ');
    }
    if (level === 3) {
      const mid = Math.floor(nodes.length / 2);
      return `{ ${nodes.slice(0, mid).join(', ')} } ⇒ { ${nodes.slice(mid).join(', ')} }`;
    }
    if (level === 4) {
      return nodes.slice(0, 4).map((n) => n[0].toUpperCase()).join('–') + ' graph';
    }
    if (level === 5) {
      return '●—' + nodes.slice(0, 2).map((n) => n.slice(0, 3)).join('—') + '—○';
    }
    return '●—○';
  }

  function compressMathematical(text, level) {
    const tokens = tokenize(text);
    const content = contentWords(tokens);
    const n = content.length;
    const unique = [...new Set(content.map((c) => c.toLowerCase()))];
    if (level === 1) {
      return `S = {${unique.slice(0, 8).join(', ')}} · |S|≈${unique.length}`;
    }
    if (level === 2) {
      return `μ(event) ≈ f(${unique.slice(0, 4).join(', ')}) · dim≈${Math.min(5, unique.length)}`;
    }
    if (level === 3) {
      return `∑ᵢ wᵢ·eᵢ  →  ⟨${unique.slice(0, 3).join('|')}⟩`;
    }
    if (level === 4) {
      return `‖x‖₁=${n} → ‖x̂‖₀≤${Math.max(2, Math.floor(unique.length / 3))}`;
    }
    if (level === 5) {
      return `x ↦ π(x) ∈ ℝ^{${Math.max(1, 4 - level + 3)}}`;
    }
    return 'x ↦ ∅';
  }

  function compressRitualistic(text, level) {
    const tokens = tokenize(text);
    const content = contentWords(tokens);
    const marks = ['✝', '○', '△', '□', '◉', '✦'];
    if (level === 1) {
      return content.slice(0, 10).map((w, i) => `${marks[i % marks.length]} ${w}`).join('  ');
    }
    if (level === 2) {
      return '⟨ ' + content.slice(0, 6).join(' · ') + ' ⟩';
    }
    if (level === 3) {
      return content.slice(0, 4).map((w) => w.toUpperCase()).join(' / ');
    }
    if (level === 4) {
      return marks.slice(0, 3).join(' ') + ' ' + content.slice(0, 2).join(' ') + ' ' + marks.slice(0, 3).reverse().join(' ');
    }
    if (level === 5) {
      return '○ ' + (content[0] || '—').slice(0, 4).toUpperCase() + ' ○';
    }
    return '○';
  }

  function compress(text, aesthetic, level) {
    const t = text.trim();
    if (!t) return '';
    switch (aesthetic) {
      case 'diagrammatic': return compressDiagrammatic(t, level);
      case 'mathematical': return compressMathematical(t, level);
      case 'ritualistic': return compressRitualistic(t, level);
      default: return compressPoetic(t, level);
    }
  }

  function integrityAt(level, depth) {
    // Approximate remaining meaning: drops nonlinearly
    const base = 1 - (level / (depth + 1));
    const curve = Math.pow(Math.max(0, base), 1.2);
    return Math.round(curve * 100);
  }

  function runCompress() {
    const src = (dom.sourceText?.value || '').trim();
    if (!src) {
      if (dom.sourceText) dom.sourceText.focus();
      return;
    }
    const depth = state.depth;
    const aesthetic = state.aesthetic;
    const originalTokens = tokenize(src).length;

    if (dom.emptyState) dom.emptyState.hidden = true;
    if (dom.layers) {
      dom.layers.hidden = false;
      dom.layers.innerHTML = '';
    }
    if (dom.collapseMeter) dom.collapseMeter.hidden = false;

    let lastIntegrity = 100;
    for (let level = 1; level <= depth; level++) {
      const out = compress(src, aesthetic, level);
      const integ = integrityAt(level, depth);
      lastIntegrity = integ;
      const isCollapse = integ < 25;
      const isWarn = integ < 45 && !isCollapse;
      const outTokens = tokenize(out).length;

      const el = document.createElement('article');
      el.className = 'layer' + (isCollapse ? ' is-collapse' : '') + (isWarn ? ' is-warn' : '');
      el.innerHTML = `
        <div class="layer-head">
          <span class="layer-level">Layer ${level}${isCollapse ? ' · collapse' : isWarn ? ' · thinning' : ''}</span>
          <span class="layer-stats">${outTokens} tokens · ~${integ}% integrity</span>
        </div>
        <div class="layer-body">${escapeHtml(out)}</div>
      `;
      dom.layers.appendChild(el);
    }

    if (dom.integrityFill) {
      dom.integrityFill.style.width = lastIntegrity + '%';
      dom.integrityFill.classList.toggle('is-low', lastIntegrity < 45 && lastIntegrity >= 25);
      dom.integrityFill.classList.toggle('is-collapse', lastIntegrity < 25);
    }
    if (dom.integrityVal) {
      dom.integrityVal.textContent = lastIntegrity + '%';
      dom.integrityVal.style.color = lastIntegrity < 25
        ? 'var(--color-collapse)'
        : lastIntegrity < 45
          ? 'var(--color-warn)'
          : 'var(--color-accent)';
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function init() {
    dom.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    renderAesthetics();
    if (dom.depthRange) {
      dom.depthRange.addEventListener('input', () => {
        state.depth = Number(dom.depthRange.value);
        if (dom.depthVal) dom.depthVal.textContent = String(state.depth);
      });
    }
    if (dom.btnCompress) dom.btnCompress.addEventListener('click', runCompress);
    if (dom.btnSample) {
      dom.btnSample.addEventListener('click', () => {
        if (dom.sourceText) dom.sourceText.value = SAMPLE;
      });
    }
    setTheme('cipher');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
