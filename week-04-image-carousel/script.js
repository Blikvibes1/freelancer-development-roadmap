/**
 * Aperture — Week 04 Image Carousel
 * Modular, readable, no spaghetti.
 */

(function () {
  "use strict";

  // ---------- Config ----------
  const AUTOPLAY_MS = 5000;
  const THEME_KEY = "aperture-theme";
  const THEMES = ["noir", "lumen"];

  // ---------- DOM ----------
  const track = document.getElementById("carousel-track");
  const slides = Array.from(track.querySelectorAll(".carousel__slide"));
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const playBtn = document.getElementById("play-btn");
  const dotsContainer = document.getElementById("dots");
  const progressBar = document.getElementById("progress-bar");
  const statusEl = document.getElementById("carousel-status");
  const themeSwitch = document.getElementById("theme-switch");
  const carousel = document.getElementById("carousel");

  const total = slides.length;
  let current = 0;
  let isPlaying = true;
  let autoplayTimer = null;
  let progressTimer = null;
  let progressStart = 0;
  let touchStartX = 0;
  let touchDeltaX = 0;

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
    const currentTheme = document.documentElement.getAttribute("data-theme");
    applyTheme(currentTheme === "noir" ? "lumen" : "noir");
  }

  // ---------- Dots ----------
  function buildDots() {
    dotsContainer.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.setAttribute("aria-selected", i === current ? "true" : "false");
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    });
  }

  function updateDots() {
    const dots = dotsContainer.querySelectorAll(".carousel__dot");
    dots.forEach((dot, i) => {
      dot.setAttribute("aria-selected", i === current ? "true" : "false");
    });
  }

  // ---------- Slide control ----------
  function updateSlides() {
    track.style.transform = `translateX(-${current * 100}%)`;

    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });

    updateDots();
    statusEl.textContent = `Slide ${current + 1} of ${total}`;
  }

  function goTo(index) {
    current = (index + total) % total;
    updateSlides();
    restartAutoplay();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  // ---------- Autoplay + Progress ----------
  function clearTimers() {
    if (autoplayTimer) clearTimeout(autoplayTimer);
    if (progressTimer) cancelAnimationFrame(progressTimer);
    autoplayTimer = null;
    progressTimer = null;
  }

  function startProgress() {
    progressStart = performance.now();
    progressBar.style.width = "0%";

    function tick(now) {
      if (!isPlaying) return;
      const elapsed = now - progressStart;
      const pct = Math.min((elapsed / AUTOPLAY_MS) * 100, 100);
      progressBar.style.width = pct + "%";

      if (elapsed < AUTOPLAY_MS) {
        progressTimer = requestAnimationFrame(tick);
      }
    }
    progressTimer = requestAnimationFrame(tick);
  }

  function startAutoplay() {
    clearTimers();
    if (!isPlaying) return;
    startProgress();
    autoplayTimer = setTimeout(() => {
      next();
    }, AUTOPLAY_MS);
  }

  function restartAutoplay() {
    if (isPlaying) startAutoplay();
    else {
      clearTimers();
      progressBar.style.width = "0%";
    }
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    playBtn.classList.toggle("is-paused", !isPlaying);
    playBtn.setAttribute(
      "aria-label",
      isPlaying ? "Pause autoplay" : "Play autoplay"
    );
    if (isPlaying) startAutoplay();
    else clearTimers();
  }

  // ---------- Touch / Swipe ----------
  function onTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchDeltaX = 0;
  }

  function onTouchMove(e) {
    touchDeltaX = e.changedTouches[0].screenX - touchStartX;
  }

  function onTouchEnd() {
    const threshold = 50;
    if (touchDeltaX > threshold) prev();
    else if (touchDeltaX < -threshold) next();
    touchDeltaX = 0;
  }

  // ---------- Keyboard ----------
  function onKeydown(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  }

  // ---------- Pause on hover / focus ----------
  function pauseOnInteract() {
    if (isPlaying) {
      clearTimers();
    }
  }

  function resumeOnLeave() {
    if (isPlaying) startAutoplay();
  }

  // ---------- Bind ----------
  function bindEvents() {
    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);
    playBtn.addEventListener("click", togglePlay);
    themeSwitch.addEventListener("click", toggleTheme);

    carousel.addEventListener("touchstart", onTouchStart, { passive: true });
    carousel.addEventListener("touchmove", onTouchMove, { passive: true });
    carousel.addEventListener("touchend", onTouchEnd, { passive: true });

    carousel.addEventListener("mouseenter", pauseOnInteract);
    carousel.addEventListener("mouseleave", resumeOnLeave);
    carousel.addEventListener("focusin", pauseOnInteract);
    carousel.addEventListener("focusout", (e) => {
      if (!carousel.contains(e.relatedTarget)) resumeOnLeave();
    });

    document.addEventListener("keydown", onKeydown);

    // Visibility API — pause when tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearTimers();
      else if (isPlaying) startAutoplay();
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    buildDots();
    updateSlides();
    bindEvents();
    startAutoplay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
