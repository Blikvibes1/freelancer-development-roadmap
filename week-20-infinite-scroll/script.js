/**
 * Feed — Week 20 Infinite Scroll
 * Intersection Observer + mock data. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "feed-theme";
  const THEMES = ["noir", "lumen"];
  const PAGE_SIZE = 6;
  const MAX_POSTS = 36;

  const NAMES = [
    "Ava Chen", "Jordan Lee", "Sam Okonkwo", "Riley Park",
    "Morgan Díaz", "Casey Nguyen", "Quinn Brooks", "Alex Rivera",
  ];
  const CAPTIONS = [
    "Golden hour hits different when you stop to notice it.",
    "Built something small today. Shipping beats perfect.",
    "Coffee, code, and a quiet morning. That’s the stack.",
    "New trails, same curiosity. Keep moving.",
    "Design is how it works — not just how it looks.",
    "Weekend experiment: less noise, more focus.",
    "The best ideas show up after the second walk.",
    "Progress in public. Feedback welcome.",
  ];
  const PLACEHOLDER_COLORS = [
    "#2dd4bf", "#818cf8", "#f472b6", "#fbbf24",
    "#34d399", "#60a5fa", "#a78bfa", "#fb7185",
  ];

  const themeSwitch = document.getElementById("theme-switch");
  const feedEl = document.getElementById("feed");
  const sentinel = document.getElementById("sentinel");
  const loadingEl = document.getElementById("loading");
  const endMsg = document.getElementById("end-msg");

  let page = 0;
  let loading = false;
  let done = false;
  let observer = null;

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

  // ---------- Mock data ----------
  function mockPost(index) {
    const name = NAMES[index % NAMES.length];
    const caption = CAPTIONS[index % CAPTIONS.length];
    const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("");
    return {
      id: index,
      name,
      initials,
      caption,
      color,
      likes: 12 + ((index * 17) % 240),
      time: index === 0 ? "Just now" : index + "h",
    };
  }

  function fetchPage(pageNum) {
    return new Promise((resolve) => {
      // Simulate network latency
      setTimeout(() => {
        const start = pageNum * PAGE_SIZE;
        const items = [];
        for (let i = 0; i < PAGE_SIZE; i++) {
          const idx = start + i;
          if (idx >= MAX_POSTS) break;
          items.push(mockPost(idx));
        }
        resolve(items);
      }, 450 + Math.random() * 350);
    });
  }

  // ---------- Render ----------
  function createCard(post) {
    const article = document.createElement("article");
    article.className = "post";
    article.innerHTML = `
      <header class="post__header">
        <div class="post__avatar" style="background:${post.color}22;color:${post.color}" aria-hidden="true">${post.initials}</div>
        <div class="post__meta">
          <p class="post__author">${post.name}</p>
          <p class="post__time">${post.time}</p>
        </div>
      </header>
      <div class="post__media" style="--accent-soft:${post.color}33" role="img" aria-label="Post image placeholder"></div>
      <div class="post__body">
        <p class="post__caption"><strong>${post.name}</strong> ${post.caption}</p>
        <div class="post__actions"><span>${post.likes} likes</span></div>
      </div>
    `;
    return article;
  }

  function createSkeleton() {
    const el = document.createElement("div");
    el.className = "post post--skeleton";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="post__header">
        <div class="sk sk-avatar"></div>
        <div style="flex:1">
          <div class="sk sk-line sk-line--short"></div>
          <div class="sk sk-line sk-line--med"></div>
        </div>
      </div>
      <div class="sk sk-media"></div>
      <div class="post__body">
        <div class="sk sk-line sk-line--med"></div>
        <div class="sk sk-line sk-line--short"></div>
      </div>
    `;
    return el;
  }

  // ---------- Load ----------
  async function loadMore() {
    if (loading || done) return;
    loading = true;
    loadingEl.hidden = false;

    // Optional: show skeletons while loading first page feels emptier
    const skeletons = [];
    if (page === 0) {
      for (let i = 0; i < 3; i++) {
        const s = createSkeleton();
        feedEl.appendChild(s);
        skeletons.push(s);
      }
    }

    const items = await fetchPage(page);
    skeletons.forEach((s) => s.remove());

    if (items.length === 0) {
      done = true;
      loadingEl.hidden = true;
      endMsg.hidden = false;
      if (observer) observer.disconnect();
      loading = false;
      return;
    }

    items.forEach((post) => {
      feedEl.appendChild(createCard(post));
    });

    page += 1;
    loading = false;
    loadingEl.hidden = true;

    if (page * PAGE_SIZE >= MAX_POSTS) {
      done = true;
      endMsg.hidden = false;
      if (observer) observer.disconnect();
    }
  }

  // ---------- Observer ----------
  function setupObserver() {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "noir" ? "lumen" : "noir");
    });
  }

  function init() {
    initTheme();
    bindEvents();
    setupObserver();
    loadMore(); // initial page
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
