/**
 * Vault — Week 17 Password Generator
 * Crypto-random where available. Clean & modular.
 */
(function () {
  "use strict";
  const THEME_KEY = "vault-theme";
  const THEMES = ["noir", "lumen"];
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const NUMS = "0123456789";
  const SYMS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const themeSwitch = document.getElementById("theme-switch");
  const passwordEl = document.getElementById("password");
  const lengthEl = document.getElementById("length");
  const lengthVal = document.getElementById("length-val");
  const optUpper = document.getElementById("opt-upper");
  const optLower = document.getElementById("opt-lower");
  const optNumbers = document.getElementById("opt-numbers");
  const optSymbols = document.getElementById("opt-symbols");
  const btnGen = document.getElementById("btn-generate");
  const btnCopy = document.getElementById("btn-copy");
  const strengthFill = document.getElementById("strength-fill");
  const strengthLabel = document.getElementById("strength-label");
  const copyStatus = document.getElementById("copy-status");

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

  function randomIndex(max) {
    if (window.crypto && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function buildCharset() {
    let set = "";
    if (optUpper.checked) set += UPPER;
    if (optLower.checked) set += LOWER;
    if (optNumbers.checked) set += NUMS;
    if (optSymbols.checked) set += SYMS;
    return set;
  }

  function generate() {
    const len = Number(lengthEl.value);
    let charset = buildCharset();
    if (!charset) {
      passwordEl.textContent = "Select at least one option";
      updateStrength("");
      return;
    }
    let result = "";
    // Guarantee one of each selected type
    const required = [];
    if (optUpper.checked) required.push(UPPER[randomIndex(UPPER.length)]);
    if (optLower.checked) required.push(LOWER[randomIndex(LOWER.length)]);
    if (optNumbers.checked) required.push(NUMS[randomIndex(NUMS.length)]);
    if (optSymbols.checked) required.push(SYMS[randomIndex(SYMS.length)]);
    for (let i = 0; i < len; i++) {
      result += charset[randomIndex(charset.length)];
    }
    // Mix required chars in
    const arr = result.split("");
    required.forEach((ch, i) => {
      if (i < arr.length) arr[i] = ch;
    });
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const pwd = arr.join("");
    passwordEl.textContent = pwd;
    updateStrength(pwd);
    copyStatus.textContent = "";
  }

  function updateStrength(pwd) {
    if (!pwd) {
      strengthFill.style.width = "0%";
      strengthLabel.textContent = "—";
      return;
    }
    let score = 0;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (pwd.length >= 24) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    let label = "Weak", color = "var(--weak)", width = "25%";
    if (score >= 5) { label = "Strong"; color = "var(--strong)"; width = "100%"; }
    else if (score >= 3) { label = "Fair"; color = "var(--fair)"; width = "60%"; }
    strengthFill.style.width = width;
    strengthFill.style.background = color;
    strengthLabel.textContent = label;
  }

  async function copy() {
    const text = passwordEl.textContent;
    if (!text || text.includes("Select")) return;
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = "Copied to clipboard";
    } catch {
      copyStatus.textContent = "Could not copy";
    }
  }

  function init() {
    initTheme();
    themeSwitch.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "noir" ? "lumen" : "noir");
    });
    lengthEl.addEventListener("input", () => {
      lengthVal.textContent = lengthEl.value;
    });
    btnGen.addEventListener("click", generate);
    btnCopy.addEventListener("click", copy);
    [optUpper, optLower, optNumbers, optSymbols].forEach((el) => {
      el.addEventListener("change", generate);
    });
    lengthEl.addEventListener("change", generate);
    generate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
