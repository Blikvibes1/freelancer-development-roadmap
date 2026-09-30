/**
 * Pulse — Week 08 Skeleton Loaders
 * Toggle loading state + Theme Mode. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "pulse-theme";
  const THEMES = ["noir", "lumen"];

  const themeSwitch = document.getElementById("theme-switch");
  const toggleBtn = document.getElementById("toggle-loading");
  const toggleLabel = toggleBtn.querySelector(".toggle-label");

  let isLoading = true;

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const isLumen = theme === "lumen";
    themeSwitch.setAttribute("aria-checked", String(isLumen));
    themeSwitch.setAttribute(
      "aria-label",
      isLumen ? "Switch to Noir theme" : "Switch to Lumen theme"
    );
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && THEMES.includes(stored)) {
      applyTheme(stored);
      return;
    }
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "lumen" : "noir");
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "noir" ? "lumen" : "noir");
  }

  // ---------- Loading toggle ----------
  function setLoadingState(loading) {
    isLoading = loading;
    const skeletons = document.querySelectorAll("[data-skeleton]");
    const reals = document.querySelectorAll("[data-real]");

    skeletons.forEach((el) => {
      el.hidden = !loading;
    });
    reals.forEach((el) => {
      el.hidden = loading;
    });

    toggleBtn.setAttribute("aria-pressed", String(loading));
    toggleLabel.textContent = loading ? "Show skeletons" : "Show content";
  }

  function toggleLoading() {
    setLoadingState(!isLoading);
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);
    toggleBtn.addEventListener("click", toggleLoading);
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    setLoadingState(true);
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
