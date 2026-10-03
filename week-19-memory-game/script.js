/**
 * Match — Week 19 Memory Card Game
 * Flip, match, timer, moves, win. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "match-theme";
  const THEMES = ["noir", "lumen"];
  const SYMBOLS = ["🍎", "🌊", "🔥", "🌙", "⭐", "🍀", "🎵", "💎"];

  const themeSwitch = document.getElementById("theme-switch");
  const board = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timerEl = document.getElementById("timer");
  const pairsEl = document.getElementById("pairs");
  const winEl = document.getElementById("win");
  const winMoves = document.getElementById("win-moves");
  const winTime = document.getElementById("win-time");
  const btnRestart = document.getElementById("btn-restart");
  const btnPlayAgain = document.getElementById("btn-play-again");

  let cards = [];
  let flipped = [];
  let matched = 0;
  let moves = 0;
  let lock = false;
  let started = false;
  let seconds = 0;
  let timerId = null;

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
    applyTheme(
      window.matchMedia("(prefers-color-scheme: light)").matches ? "lumen" : "noir"
    );
  }

  // ---------- Helpers ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ":" + String(sec).padStart(2, "0");
  }

  function updateHud() {
    movesEl.textContent = String(moves);
    timerEl.textContent = formatTime(seconds);
    pairsEl.textContent = matched + "/8";
  }

  // ---------- Timer ----------
  function startTimer() {
    if (started) return;
    started = true;
    timerId = setInterval(() => {
      seconds += 1;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  // ---------- Board ----------
  function buildDeck() {
    const deck = shuffle([...SYMBOLS, ...SYMBOLS]);
    cards = deck.map((symbol, index) => ({
      id: index,
      symbol,
      matched: false,
    }));
  }

  function renderBoard() {
    board.innerHTML = "";
    cards.forEach((card) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.dataset.id = String(card.id);
      btn.setAttribute("aria-label", "Hidden card");
      btn.innerHTML = `
        <span class="card__face card__back" aria-hidden="true"></span>
        <span class="card__face card__front" aria-hidden="true">${card.symbol}</span>
      `;
      if (card.matched) {
        btn.classList.add("is-flipped", "is-matched");
        btn.disabled = true;
        btn.setAttribute("aria-label", "Matched " + card.symbol);
      }
      btn.addEventListener("click", () => onCardClick(card.id));
      board.appendChild(btn);
    });
  }

  function getCardEl(id) {
    return board.querySelector(`[data-id="${id}"]`);
  }

  function onCardClick(id) {
    if (lock) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched) return;
    if (flipped.includes(id)) return;
    if (flipped.length >= 2) return;

    startTimer();

    const el = getCardEl(id);
    el.classList.add("is-flipped");
    el.setAttribute("aria-label", card.symbol);
    flipped.push(id);

    if (flipped.length === 2) {
      moves += 1;
      updateHud();
      checkMatch();
    }
  }

  function checkMatch() {
    const [aId, bId] = flipped;
    const a = cards.find((c) => c.id === aId);
    const b = cards.find((c) => c.id === bId);

    if (a.symbol === b.symbol) {
      a.matched = true;
      b.matched = true;
      matched += 1;
      getCardEl(aId).classList.add("is-matched");
      getCardEl(bId).classList.add("is-matched");
      getCardEl(aId).disabled = true;
      getCardEl(bId).disabled = true;
      getCardEl(aId).setAttribute("aria-label", "Matched " + a.symbol);
      getCardEl(bId).setAttribute("aria-label", "Matched " + b.symbol);
      flipped = [];
      updateHud();
      if (matched === 8) {
        endGame();
      }
    } else {
      lock = true;
      setTimeout(() => {
        getCardEl(aId).classList.remove("is-flipped");
        getCardEl(bId).classList.remove("is-flipped");
        getCardEl(aId).setAttribute("aria-label", "Hidden card");
        getCardEl(bId).setAttribute("aria-label", "Hidden card");
        flipped = [];
        lock = false;
      }, 700);
    }
  }

  function endGame() {
    stopTimer();
    winMoves.textContent = String(moves);
    winTime.textContent = formatTime(seconds);
    winEl.hidden = false;
  }

  function resetGame() {
    stopTimer();
    flipped = [];
    matched = 0;
    moves = 0;
    lock = false;
    started = false;
    seconds = 0;
    winEl.hidden = true;
    buildDeck();
    renderBoard();
    updateHud();
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "noir" ? "lumen" : "noir");
    });
    btnRestart.addEventListener("click", resetGame);
    btnPlayAgain.addEventListener("click", resetGame);
  }

  function init() {
    initTheme();
    bindEvents();
    resetGame();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
