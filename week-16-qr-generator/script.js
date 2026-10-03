/**
 * Signal — Week 16 QR Code Generator
 * Uses qrcode library (CDN). Clean & modular.
 */
(function () {
  "use strict";
  const THEME_KEY = "signal-theme";
  const THEMES = ["noir", "lumen"];
  const themeSwitch = document.getElementById("theme-switch");
  const input = document.getElementById("qr-input");
  const btnGen = document.getElementById("btn-generate");
  const btnDl = document.getElementById("btn-download");
  const canvas = document.getElementById("qr-canvas");
  const placeholder = document.getElementById("qr-placeholder");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const isLumen = theme === "lumen";
    themeSwitch.setAttribute("aria-checked", String(isLumen));
    themeSwitch.setAttribute("aria-label", isLumen ? "Switch to Noir theme" : "Switch to Lumen theme");
    if (canvas.classList.contains("is-visible")) generate();
  }
  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && THEMES.includes(stored)) { applyTheme(stored); return; }
    applyTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "lumen" : "noir");
  }

  function getColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      dark: style.getPropertyValue("--qr-dark").trim() || "#000",
      light: style.getPropertyValue("--qr-light").trim() || "#fff",
    };
  }

  function generate() {
    const text = input.value.trim();
    if (!text) {
      canvas.classList.remove("is-visible");
      placeholder.hidden = false;
      btnDl.disabled = true;
      return;
    }
    if (typeof QRCode === "undefined") {
      placeholder.textContent = "QR library failed to load.";
      return;
    }
    const colors = getColors();
    QRCode.toCanvas(canvas, text, {
      width: 240,
      margin: 2,
      color: { dark: colors.dark, light: colors.light },
    }, (err) => {
      if (err) {
        placeholder.textContent = "Could not generate QR.";
        placeholder.hidden = false;
        canvas.classList.remove("is-visible");
        btnDl.disabled = true;
        return;
      }
      canvas.classList.add("is-visible");
      placeholder.hidden = true;
      btnDl.disabled = false;
    });
  }

  function download() {
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function init() {
    initTheme();
    themeSwitch.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "noir" ? "lumen" : "noir");
    });
    btnGen.addEventListener("click", generate);
    btnDl.addEventListener("click", download);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
    });
    generate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
