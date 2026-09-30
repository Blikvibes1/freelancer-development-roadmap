/**
 * Portal — Week 07 Modal Dialog
 * Focus trap, ESC, backdrop, restore focus. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "portal-theme";
  const THEMES = ["noir", "lumen"];
  const FOCUSABLE =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  const themeSwitch = document.getElementById("theme-switch");
  const openTriggers = document.querySelectorAll("[data-open-modal]");
  let activeModal = null;
  let previouslyFocused = null;

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

  // ---------- Modal core ----------
  function getFocusable(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  function openModal(modal) {
    if (activeModal) closeModal(activeModal);

    previouslyFocused = document.activeElement;
    activeModal = modal;

    modal.hidden = false;
    document.body.classList.add("modal-open");

    // Force reflow then animate in
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
    });

    // Focus first focusable element inside panel
    const panel = modal.querySelector(".modal__panel");
    const focusable = getFocusable(panel);
    if (focusable.length) {
      focusable[0].focus();
    } else {
      panel.setAttribute("tabindex", "-1");
      panel.focus();
    }
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");

    const panel = modal.querySelector(".modal__panel");
    const onEnd = (e) => {
      if (e.target !== panel) return;
      modal.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
      activeModal = null;

      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
      previouslyFocused = null;
    };
    panel.addEventListener("transitionend", onEnd);

    // Fallback
    setTimeout(() => {
      if (!modal.classList.contains("is-open")) {
        modal.hidden = true;
        activeModal = null;
        if (previouslyFocused && typeof previouslyFocused.focus === "function") {
          previouslyFocused.focus();
        }
        previouslyFocused = null;
      }
    }, 350);
  }

  // ---------- Focus trap ----------
  function trapFocus(e) {
    if (!activeModal || e.key !== "Tab") return;

    const panel = activeModal.querySelector(".modal__panel");
    const focusable = getFocusable(panel);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);

    openTriggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open-modal");
        const modal = document.getElementById(id);
        if (modal) openModal(modal);
      });
    });

    document.addEventListener("click", (e) => {
      if (!activeModal) return;
      if (e.target.closest("[data-close-modal]")) {
        closeModal(activeModal);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activeModal) {
        e.preventDefault();
        closeModal(activeModal);
      }
      trapFocus(e);
    });
  }

  // ---------- Init ----------
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
