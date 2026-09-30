/**
 * Helix — Week 06 FAQ Accordion
 * Accessible, modular, no spaghetti.
 */

(function () {
  "use strict";

  const THEME_KEY = "helix-theme";
  const THEMES = ["noir", "lumen"];

  const themeSwitch = document.getElementById("theme-switch");
  const triggers = document.querySelectorAll(".faq__trigger");

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

  // ---------- Accordion ----------
  function openItem(trigger, panel, item) {
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    // Force reflow then open for transition
    requestAnimationFrame(() => {
      item.classList.add("is-open");
    });
  }

  function closeItem(trigger, panel, item) {
    trigger.setAttribute("aria-expanded", "false");
    item.classList.remove("is-open");

    // Wait for transition before setting hidden
    const onEnd = (e) => {
      if (e.propertyName !== "grid-template-rows") return;
      panel.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);

    // Fallback
    setTimeout(() => {
      if (trigger.getAttribute("aria-expanded") === "false") {
        panel.hidden = true;
      }
    }, 400);
  }

  function toggleItem(trigger) {
    const panelId = trigger.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);
    const item = trigger.closest(".faq__item");
    const isOpen = trigger.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeItem(trigger, panel, item);
    } else {
      openItem(trigger, panel, item);
    }
  }

  // Optional: close others when one opens (single-open mode)
  // Currently allowing multiple open for better UX on FAQ pages.
  // Uncomment below if single-open is preferred:
  /*
  function closeOthers(currentTrigger) {
    triggers.forEach((t) => {
      if (t !== currentTrigger && t.getAttribute("aria-expanded") === "true") {
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        const item = t.closest(".faq__item");
        closeItem(t, panel, item);
      }
    });
  }
  */

  function bindAccordion() {
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        // closeOthers(trigger); // enable for single-open
        toggleItem(trigger);
      });
    });
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);
    bindAccordion();
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
