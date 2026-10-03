/**
 * Flux — Week 14 Currency Converter
 * Frankfurter API (no key). Clean & modular.
 */
(function () {
  "use strict";
  const THEME_KEY = "flux-theme";
  const THEMES = ["noir", "lumen"];
  const POPULAR = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "NGN", "BRL", "MXN", "ZAR", "KRW", "SGD"];

  const themeSwitch = document.getElementById("theme-switch");
  const amountEl = document.getElementById("amount");
  const fromEl = document.getElementById("from");
  const toEl = document.getElementById("to");
  const swapBtn = document.getElementById("swap");
  const resultMain = document.getElementById("result-main");
  const resultRate = document.getElementById("result-rate");
  const statusEl = document.getElementById("status");

  let rates = null;
  let base = "USD";

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

  async function fetchRates() {
    statusEl.textContent = "Fetching rates…";
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=USD");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      rates = { USD: 1, ...data.rates };
      base = data.base || "USD";
      populateSelects();
      convert();
      statusEl.textContent = "Rates updated · " + (data.date || "");
    } catch {
      statusEl.textContent = "Could not load rates. Check connection.";
      resultMain.textContent = "—";
      resultRate.textContent = "Unavailable";
    }
  }

  function populateSelects() {
    const codes = Object.keys(rates).sort((a, b) => {
      const ai = POPULAR.indexOf(a), bi = POPULAR.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
    const opts = codes.map((c) => `<option value="${c}">${c}</option>`).join("");
    fromEl.innerHTML = opts;
    toEl.innerHTML = opts;
    fromEl.value = "USD";
    toEl.value = "EUR";
  }

  function convert() {
    if (!rates) return;
    const amount = parseFloat(amountEl.value) || 0;
    const from = fromEl.value;
    const to = toEl.value;
    const fromRate = rates[from];
    const toRate = rates[to];
    if (!fromRate || !toRate) return;
    const usdAmount = amount / fromRate;
    const result = usdAmount * toRate;
    const rate = toRate / fromRate;
    resultMain.textContent = result.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " " + to;
    resultRate.textContent = `1 ${from} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}`;
  }

  function swap() {
    const f = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = f;
    convert();
  }

  function bind() {
    themeSwitch.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "noir" ? "lumen" : "noir");
    });
    amountEl.addEventListener("input", convert);
    fromEl.addEventListener("change", convert);
    toEl.addEventListener("change", convert);
    swapBtn.addEventListener("click", swap);
  }

  function init() {
    initTheme();
    bind();
    fetchRates();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
