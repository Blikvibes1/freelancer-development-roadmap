/**
 * Nimbus — Week 05 Pricing Table
 * Clean, modular, no spaghetti.
 */

(function () {
  "use strict";

  const THEME_KEY = "nimbus-theme";
  const BILLING_KEY = "nimbus-billing";
  const THEMES = ["noir", "lumen"];

  const themeSwitch = document.getElementById("theme-switch");
  const billingSwitch = document.getElementById("billing-switch");
  const labelMonthly = document.getElementById("label-monthly");
  const labelYearly = document.getElementById("label-yearly");
  const amounts = document.querySelectorAll(".plan__amount");
  const periods = document.querySelectorAll("[data-period]");

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

  // ---------- Billing ----------
  function applyBilling(isYearly) {
    billingSwitch.setAttribute("aria-checked", String(isYearly));
    labelMonthly.classList.toggle("is-active", !isYearly);
    labelYearly.classList.toggle("is-active", isYearly);

    amounts.forEach((el) => {
      el.classList.add("is-updating");
      const value = isYearly ? el.dataset.yearly : el.dataset.monthly;
      // Small delay for a subtle update feel
      requestAnimationFrame(() => {
        el.textContent = value;
        el.classList.remove("is-updating");
      });
    });

    periods.forEach((el) => {
      el.textContent = "mo";
    });

    localStorage.setItem(BILLING_KEY, isYearly ? "yearly" : "monthly");
  }

  function initBilling() {
    const stored = localStorage.getItem(BILLING_KEY);
    const isYearly = stored === "yearly";
    applyBilling(isYearly);
  }

  function toggleBilling() {
    const isYearly = billingSwitch.getAttribute("aria-checked") === "true";
    applyBilling(!isYearly);
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);
    billingSwitch.addEventListener("click", toggleBilling);

    // Keyboard for billing switch
    billingSwitch.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        toggleBilling();
      }
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    initBilling();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
