/**
 * Vespera Nav — Week 02
 * Modular, readable, no spaghetti.
 */

(function () {
  "use strict";

  // ---------- DOM references ----------
  const header = document.getElementById("site-header");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeTriggers = document.querySelectorAll("[data-close-menu]");
  const navLinks = document.querySelectorAll("[data-link]");

  // ---------- Theme ----------
  const THEME_KEY = "vespera-theme";
  const themes = ["noir", "lumen"];

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    const nextLabel =
      theme === "noir" ? "Switch to Lumen theme" : "Switch to Noir theme";
    themeToggle.setAttribute("aria-label", nextLabel);
  }

  function initTheme() {
    const stored = getStoredTheme();
    if (stored && themes.includes(stored)) {
      setTheme(stored);
      return;
    }
    // Respect system preference on first visit
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(prefersLight ? "lumen" : "noir");
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "noir" ? "lumen" : "noir");
  }

  // ---------- Scroll-aware header ----------
  const SCROLL_THRESHOLD = 24;

  function updateScrollState() {
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    header.setAttribute("data-scrolled", String(scrolled));
  }

  // ---------- Mobile menu ----------
  let previouslyFocused = null;

  function openMenu() {
    previouslyFocused = document.activeElement;
    mobileMenu.hidden = false;

    // Force reflow so transition plays
    requestAnimationFrame(() => {
      mobileMenu.classList.add("is-open");
    });

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");

    // Focus first interactive element inside panel
    const firstFocusable = mobileMenu.querySelector(
      "button, a[href], [tabindex]:not([tabindex='-1'])"
    );
    if (firstFocusable) firstFocusable.focus();
  }

  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");

    // Wait for transition before hiding
    const panel = mobileMenu.querySelector(".mobile-menu__panel");
    const onEnd = (e) => {
      if (e.target !== panel) return;
      mobileMenu.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
      if (previouslyFocused) previouslyFocused.focus();
    };
    panel.addEventListener("transitionend", onEnd);

    // Fallback if transitionend never fires
    setTimeout(() => {
      if (!mobileMenu.hidden && !mobileMenu.classList.contains("is-open")) {
        mobileMenu.hidden = true;
        if (previouslyFocused) previouslyFocused.focus();
      }
    }, 500);
  }

  function toggleMenu() {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu();
    else openMenu();
  }

  // ---------- Active link highlighting ----------
  function setActiveLink(href) {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === href;
      link.classList.toggle("is-active", isMatch);
    });
  }

  // ---------- Focus trap (mobile menu) ----------
  function trapFocus(e) {
    if (menuToggle.getAttribute("aria-expanded") !== "true") return;
    if (e.key !== "Tab") return;

    const focusable = mobileMenu.querySelectorAll(
      'button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---------- Keyboard ----------
  function handleGlobalKeydown(e) {
    if (e.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
    trapFocus(e);
  }

  // ---------- Event bindings ----------
  function bindEvents() {
    themeToggle.addEventListener("click", toggleTheme);
    menuToggle.addEventListener("click", toggleMenu);

    closeTriggers.forEach((el) => {
      el.addEventListener("click", closeMenu);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const href = link.getAttribute("href");
        setActiveLink(href);
        if (menuToggle.getAttribute("aria-expanded") === "true") {
          closeMenu();
        }
      });
    });

    window.addEventListener("scroll", updateScrollState, { passive: true });
    document.addEventListener("keydown", handleGlobalKeydown);

    // Close menu on resize to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 900 && menuToggle.getAttribute("aria-expanded") === "true") {
        closeMenu();
      }
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    updateScrollState();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
