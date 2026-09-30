/**
 * Aura — Week 03 Theme Mode System
 * Clean, single-responsibility functions. No spaghetti.
 */

(function () {
  "use strict";

  const THEME_KEY = "aura-theme";
  const THEMES = ["noir", "lumen"];

  const switchBtn = document.getElementById("theme-switch");
  const themeLabel = document.getElementById("theme-label");
  const heroToggle = document.getElementById("hero-toggle");

  // ---------- Theme core ----------
  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    const isLumen = theme === "lumen";
    switchBtn.setAttribute("aria-checked", String(isLumen));
    switchBtn.setAttribute(
      "aria-label",
      isLumen ? "Switch to Noir theme" : "Switch to Lumen theme"
    );
    themeLabel.textContent = isLumen ? "Lumen" : "Noir";
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "noir" ? "lumen" : "noir";
    applyTheme(next);
  }

  function initTheme() {
    const stored = getStoredTheme();
    if (stored && THEMES.includes(stored)) {
      applyTheme(stored);
      return;
    }
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "lumen" : "noir");
  }

  // ---------- Events ----------
  function bindEvents() {
    switchBtn.addEventListener("click", toggleTheme);
    heroToggle.addEventListener("click", toggleTheme);

    // Keyboard support for the switch (Space / Enter already work on button)
    switchBtn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // ---------- Boot ----------
  function init() {
    initTheme();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
