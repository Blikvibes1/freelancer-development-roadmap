/**
 * Typeflow — Week 18 Typing Speed Test
 * WPM, accuracy, live error highlight. Clean & modular.
 */
(function () {
  "use strict";
  const THEME_KEY = "typeflow-theme";
  const THEMES = ["noir", "lumen"];

  const PASSAGES = [
    "The quick brown fox jumps over the lazy dog. Practice makes progress when you type with intention and focus.",
    "Design is not just what it looks like and feels like. Design is how it works. Clarity beats cleverness every time.",
    "A good developer writes code that humans can read. Machines will manage either way. Keep functions small and names honest.",
    "The best way to predict the future is to invent it. Build things that matter and ship them before they feel perfect.",
    "Typing speed is useful but accuracy keeps you trusted. Slow down just enough to stay correct, then speed comes naturally.",
  ];

  const themeSwitch = document.getElementById("theme-switch");
  const passageEl = document.getElementById("passage");
  const inputEl = document.getElementById("input");
  const wpmEl = document.getElementById("wpm");
  const accuracyEl = document.getElementById("accuracy");
  const errorsEl = document.getElementById("errors");
  const timeEl = document.getElementById("time");
  const btnRestart = document.getElementById("btn-restart");
  const btnNew = document.getElementById("btn-new");
  const doneMsg = document.getElementById("done-msg");

  let target = "";
  let started = false;
  let finished = false;
  let startTime = 0;
  let timerId = null;
  let errors = 0;

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

  function pickPassage() {
    target = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
  }

  function renderPassage(typed) {
    let html = "";
    for (let i = 0; i < target.length; i++) {
      let cls = "char";
      if (i < typed.length) {
        cls += typed[i] === target[i] ? " is-correct" : " is-wrong";
      } else if (i === typed.length && !finished) {
        cls += " is-current";
      }
      const ch = target[i] === " " ? " " : target[i];
      html += `<span class="${cls}">${ch === " " ? "&nbsp;" : escapeHtml(ch)}</span>`;
    }
    passageEl.innerHTML = html;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function countErrors(typed) {
    let e = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== target[i]) e++;
    }
    return e;
  }

  function updateStats(typed) {
    const elapsed = started ? (Date.now() - startTime) / 1000 : 0;
    timeEl.textContent = Math.floor(elapsed);
    errors = countErrors(typed);
    errorsEl.textContent = errors;
    const correct = typed.length - errors;
    const accuracy = typed.length === 0 ? 100 : Math.max(0, Math.round((correct / typed.length) * 100));
    accuracyEl.textContent = accuracy;
    // WPM: (correct chars / 5) / minutes
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    wpmEl.textContent = wpm;
  }

  function onInput() {
    if (finished) return;
    const typed = inputEl.value;
    if (!started && typed.length > 0) {
      started = true;
      startTime = Date.now();
      timerId = setInterval(() => updateStats(inputEl.value), 200);
    }
    renderPassage(typed);
    updateStats(typed);
    if (typed.length >= target.length) {
      finish();
    }
  }

  function finish() {
    finished = true;
    clearInterval(timerId);
    inputEl.disabled = true;
    doneMsg.hidden = false;
    updateStats(inputEl.value);
  }

  function restart() {
    clearInterval(timerId);
    started = false;
    finished = false;
    startTime = 0;
    errors = 0;
    inputEl.value = "";
    inputEl.disabled = false;
    doneMsg.hidden = true;
    wpmEl.textContent = "0";
    accuracyEl.textContent = "100";
    errorsEl.textContent = "0";
    timeEl.textContent = "0";
    renderPassage("");
    inputEl.focus();
  }

  function newPassage() {
    pickPassage();
    restart();
  }

  function init() {
    initTheme();
    themeSwitch.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "noir" ? "lumen" : "noir");
    });
    inputEl.addEventListener("input", onInput);
    btnRestart.addEventListener("click", restart);
    btnNew.addEventListener("click", newPassage);
    // Prevent easy paste cheating a bit
    inputEl.addEventListener("paste", (e) => e.preventDefault());
    pickPassage();
    renderPassage("");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
