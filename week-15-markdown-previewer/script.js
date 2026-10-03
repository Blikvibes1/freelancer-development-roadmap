/**
 * Ink — Week 15 Markdown Previewer
 * Lightweight MD → HTML. Clean & modular.
 */
(function () {
  "use strict";
  const THEME_KEY = "ink-theme";
  const THEMES = ["noir", "lumen"];
  const themeSwitch = document.getElementById("theme-switch");
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const isLumen = theme === "lumen";
    themeSwitch.setAttribute("aria-checked", String(isLumen));
    themeSwitch.setAttribute("aria-label", isLumen ? "Switch to Noir theme" : "Switch to Lumen theme");
  }
  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && THEMES.includes(stored)) { applyTheme(stored); return; }
    applyTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "lumen" : "noir");
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function parseInline(text) {
    let s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function parseMarkdown(src) {
    const lines = src.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;
    let inCode = false;
    let codeBuf = [];

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (inCode) {
          out.push("<pre><code>" + escapeHtml(codeBuf.join("\n")) + "</code></pre>");
          codeBuf = [];
          inCode = false;
        } else {
          inCode = true;
        }
        i++;
        continue;
      }
      if (inCode) {
        codeBuf.push(line);
        i++;
        continue;
      }

      if (/^#{1,3}\s/.test(line)) {
        const level = line.match(/^(#{1,3})/)[1].length;
        const text = line.replace(/^#{1,3}\s+/, "");
        out.push(`<h${level}>${parseInline(text)}</h${level}>`);
        i++;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const text = line.replace(/^>\s?/, "");
        out.push(`<blockquote><p>${parseInline(text)}</p></blockquote>`);
        i++;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push("<li>" + parseInline(lines[i].replace(/^[-*]\s+/, "")) + "</li>");
          i++;
        }
        out.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push("<li>" + parseInline(lines[i].replace(/^\d+\.\s+/, "")) + "</li>");
          i++;
        }
        out.push("<ol>" + items.join("") + "</ol>");
        continue;
      }

      if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
        out.push("<hr>");
        i++;
        continue;
      }

      if (line.trim() === "") {
        i++;
        continue;
      }

      out.push("<p>" + parseInline(line) + "</p>");
      i++;
    }

    if (inCode && codeBuf.length) {
      out.push("<pre><code>" + escapeHtml(codeBuf.join("\n")) + "</code></pre>");
    }
    return out.join("\n");
  }

  function render() {
    preview.innerHTML = parseMarkdown(editor.value);
  }

  function init() {
    initTheme();
    themeSwitch.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "noir" ? "lumen" : "noir");
    });
    editor.addEventListener("input", render);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
