/**
 * Tempo — Week 13 Pomodoro Timer
 * Work/break cycles, audio, tasks. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "tempo-theme";
  const TASKS_KEY = "tempo-tasks";
  const SESSIONS_KEY = "tempo-sessions";
  const SETTINGS_KEY = "tempo-settings";
  const THEMES = ["noir", "lumen"];

  const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

  const themeSwitch = document.getElementById("theme-switch");
  const timeDisplay = document.getElementById("time-display");
  const modeLabel = document.getElementById("mode-label");
  const ringProgress = document.getElementById("ring-progress");
  const timerDisplay = document.querySelector(".timer-display");
  const btnStart = document.getElementById("btn-start");
  const btnReset = document.getElementById("btn-reset");
  const sessionCountEl = document.getElementById("session-count");
  const modeTabs = document.querySelectorAll(".mode-tab");
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const tasksEmpty = document.getElementById("tasks-empty");
  const btnApplySettings = document.getElementById("btn-apply-settings");

  let settings = {
    work: 25,
    short: 5,
    long: 15,
    sound: true,
  };

  let mode = "work"; // work | short | long
  let totalSeconds = settings.work * 60;
  let remaining = totalSeconds;
  let running = false;
  let intervalId = null;
  let sessionsToday = 0;

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

  // ---------- Settings ----------
  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (stored) {
        settings = { ...settings, ...stored };
      }
    } catch (_) {}
    document.getElementById("set-work").value = settings.work;
    document.getElementById("set-short").value = settings.short;
    document.getElementById("set-long").value = settings.long;
    document.getElementById("set-sound").checked = settings.sound;
  }

  function saveSettings() {
    settings.work = clamp(Number(document.getElementById("set-work").value) || 25, 1, 90);
    settings.short = clamp(Number(document.getElementById("set-short").value) || 5, 1, 30);
    settings.long = clamp(Number(document.getElementById("set-long").value) || 15, 1, 60);
    settings.sound = document.getElementById("set-sound").checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (!running) {
      setMode(mode, true);
    }
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  // ---------- Sessions ----------
  function loadSessions() {
    try {
      const data = JSON.parse(localStorage.getItem(SESSIONS_KEY));
      const today = new Date().toDateString();
      if (data && data.date === today) {
        sessionsToday = data.count || 0;
      } else {
        sessionsToday = 0;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: today, count: 0 }));
      }
    } catch (_) {
      sessionsToday = 0;
    }
    sessionCountEl.textContent = sessionsToday;
  }

  function incrementSession() {
    sessionsToday += 1;
    const today = new Date().toDateString();
    localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: today, count: sessionsToday }));
    sessionCountEl.textContent = sessionsToday;
  }

  // ---------- Timer ----------
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function updateRing() {
    const progress = remaining / totalSeconds;
    const offset = CIRCUMFERENCE * (1 - progress);
    ringProgress.style.strokeDasharray = String(CIRCUMFERENCE);
    ringProgress.style.strokeDashoffset = String(offset);
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(remaining);
    updateRing();
  }

  function modeDuration(m) {
    if (m === "short") return settings.short * 60;
    if (m === "long") return settings.long * 60;
    return settings.work * 60;
  }

  function modeName(m) {
    if (m === "short") return "Short break";
    if (m === "long") return "Long break";
    return "Focus";
  }

  function setMode(m, forceReset) {
    mode = m;
    modeTabs.forEach((tab) => {
      const active = tab.getAttribute("data-mode") === m;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    timerDisplay.setAttribute("data-mode", m);
    modeLabel.textContent = modeName(m);

    if (forceReset || !running) {
      stopTimer();
      totalSeconds = modeDuration(m);
      remaining = totalSeconds;
      updateDisplay();
      btnStart.textContent = "Start";
    }
  }

  function tick() {
    if (remaining <= 0) {
      completeCycle();
      return;
    }
    remaining -= 1;
    updateDisplay();
  }

  function startTimer() {
    if (running) return;
    running = true;
    btnStart.textContent = "Pause";
    intervalId = setInterval(tick, 1000);
  }

  function pauseTimer() {
    if (!running) return;
    running = false;
    btnStart.textContent = "Resume";
    clearInterval(intervalId);
    intervalId = null;
  }

  function stopTimer() {
    running = false;
    btnStart.textContent = "Start";
    clearInterval(intervalId);
    intervalId = null;
  }

  function resetTimer() {
    stopTimer();
    remaining = totalSeconds;
    updateDisplay();
  }

  function completeCycle() {
    stopTimer();
    remaining = 0;
    updateDisplay();
    playNotification();

    if (mode === "work") {
      incrementSession();
    }

    // Auto-suggest next mode
    if (mode === "work") {
      // After every 4th focus → long break, else short
      const next = sessionsToday % 4 === 0 ? "long" : "short";
      setMode(next, true);
    } else {
      setMode("work", true);
    }
  }

  function toggleStart() {
    if (running) pauseTimer();
    else startTimer();
  }

  // ---------- Audio ----------
  function playNotification() {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);

      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 660;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.12, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch (_) {
      // Audio not available
    }
  }

  // ---------- Tasks ----------
  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function renderTasks() {
    const tasks = loadTasks();
    taskList.innerHTML = "";
    tasksEmpty.hidden = tasks.length > 0;

    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " is-done" : "");
      li.innerHTML = `
        <button type="button" class="task-item__check" aria-label="${task.done ? "Mark incomplete" : "Mark complete"}" data-index="${index}"></button>
        <span class="task-item__text">${escapeHtml(task.text)}</span>
        <button type="button" class="task-item__remove" aria-label="Remove task" data-remove="${index}">×</button>
      `;
      taskList.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tasks = loadTasks();
    tasks.unshift({ text: trimmed, done: false });
    saveTasks(tasks);
    renderTasks();
    taskInput.value = "";
  }

  function toggleTask(index) {
    const tasks = loadTasks();
    if (!tasks[index]) return;
    tasks[index].done = !tasks[index].done;
    saveTasks(tasks);
    renderTasks();
  }

  function removeTask(index) {
    const tasks = loadTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);
    btnStart.addEventListener("click", toggleStart);
    btnReset.addEventListener("click", resetTimer);
    btnApplySettings.addEventListener("click", saveSettings);

    modeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setMode(tab.getAttribute("data-mode"), true);
      });
    });

    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addTask(taskInput.value);
    });

    taskList.addEventListener("click", (e) => {
      const check = e.target.closest("[data-index]");
      const remove = e.target.closest("[data-remove]");
      if (check) toggleTask(Number(check.getAttribute("data-index")));
      if (remove) removeTask(Number(remove.getAttribute("data-remove")));
    });

    // Keyboard: Space to start/pause when not typing
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggleStart();
      }
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    loadSettings();
    loadSessions();
    ringProgress.style.strokeDasharray = String(CIRCUMFERENCE);
    setMode("work", true);
    renderTasks();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
