/**
 * Reel — Week 12 Movie Search
 * OMDb API + favorites in localStorage. Clean & modular.
 *
 * Get a free API key: https://www.omdbapi.com/apikey.aspx
 * Paste it below.
 */

(function () {
  "use strict";

  // ========== ADD YOUR OMDb API KEY HERE ==========
  const OMDB_KEY = "YOUR_OMDB_API_KEY";
  // ================================================

  const THEME_KEY = "reel-theme";
  const FAV_KEY = "reel-favorites";
  const THEMES = ["noir", "lumen"];

  const themeSwitch = document.getElementById("theme-switch");
  const form = document.getElementById("search-form");
  const queryInput = document.getElementById("query");
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");
  const movieGrid = document.getElementById("movie-grid");
  const emptyEl = document.getElementById("empty");
  const favToggle = document.getElementById("fav-toggle");
  const favCountEl = document.getElementById("fav-count");
  const favoritesView = document.getElementById("favorites-view");
  const favGrid = document.getElementById("fav-grid");
  const favEmpty = document.getElementById("fav-empty");
  const modal = document.getElementById("detail-modal");
  const modalBody = document.getElementById("modal-body");

  let showingFavorites = false;
  let lastResults = [];
  let previouslyFocused = null;

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

  // ---------- Favorites ----------
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveFavorites(list) {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    favCountEl.textContent = list.length;
  }

  function isFavorite(imdbID) {
    return getFavorites().some((m) => m.imdbID === imdbID);
  }

  function toggleFavorite(movie) {
    let list = getFavorites();
    if (isFavorite(movie.imdbID)) {
      list = list.filter((m) => m.imdbID !== movie.imdbID);
    } else {
      list.push({
        imdbID: movie.imdbID,
        Title: movie.Title,
        Year: movie.Year,
        Poster: movie.Poster,
      });
    }
    saveFavorites(list);
    return isFavorite(movie.imdbID);
  }

  // ---------- API ----------
  async function searchMovies(query) {
    if (!OMDB_KEY || OMDB_KEY === "YOUR_OMDB_API_KEY") {
      throw new Error("Add your free OMDb API key in script.js (see README)");
    }
    const url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=movie`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    if (data.Response === "False") throw new Error(data.Error || "No results");
    return data.Search || [];
  }

  async function getMovie(imdbID) {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbID}&plot=full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    if (data.Response === "False") throw new Error(data.Error || "Not found");
    return data;
  }

  // ---------- Render cards ----------
  function posterUrl(poster) {
    return poster && poster !== "N/A" ? poster : null;
  }

  function createCard(movie) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "movie-card";
    btn.setAttribute("aria-label", `${movie.Title} (${movie.Year})`);

    const poster = posterUrl(movie.Poster);
    const fav = isFavorite(movie.imdbID);

    btn.innerHTML = `
      <span class="movie-card__fav ${fav ? "is-active" : ""}" data-fav="${movie.imdbID}" aria-label="${fav ? "Remove from" : "Add to"} favorites">♥</span>
      ${
        poster
          ? `<img class="movie-card__poster" src="${poster}" alt="" loading="lazy" />`
          : `<div class="movie-card__poster movie-card__poster--placeholder">No image</div>`
      }
      <div class="movie-card__body">
        <span class="movie-card__title">${movie.Title}</span>
        <span class="movie-card__year">${movie.Year}</span>
      </div>
    `;

    btn.addEventListener("click", (e) => {
      if (e.target.closest("[data-fav]")) {
        e.stopPropagation();
        const active = toggleFavorite(movie);
        e.target.closest("[data-fav]").classList.toggle("is-active", active);
        e.target.closest("[data-fav]").setAttribute(
          "aria-label",
          active ? "Remove from favorites" : "Add to favorites"
        );
        if (showingFavorites) renderFavorites();
        return;
      }
      openDetail(movie.imdbID);
    });

    return btn;
  }

  function renderGrid(container, movies) {
    container.innerHTML = "";
    movies.forEach((m) => container.appendChild(createCard(m)));
  }

  // ---------- Views ----------
  function showSearchResults(movies) {
    lastResults = movies;
    showingFavorites = false;
    favToggle.setAttribute("aria-pressed", "false");
    emptyEl.hidden = true;
    favoritesView.hidden = true;
    resultsEl.hidden = false;
    renderGrid(movieGrid, movies);
  }

  function renderFavorites() {
    const list = getFavorites();
    favCountEl.textContent = list.length;
    favGrid.innerHTML = "";
    if (list.length === 0) {
      favEmpty.hidden = false;
    } else {
      favEmpty.hidden = true;
      renderGrid(favGrid, list);
    }
  }

  function showFavorites() {
    showingFavorites = true;
    favToggle.setAttribute("aria-pressed", "true");
    emptyEl.hidden = true;
    resultsEl.hidden = true;
    favoritesView.hidden = false;
    renderFavorites();
  }

  function setStatus(msg) {
    statusEl.textContent = msg || "";
  }

  // ---------- Detail modal ----------
  async function openDetail(imdbID) {
    previouslyFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalBody.innerHTML = `<p style="color:var(--text-muted)">Loading…</p>`;

    requestAnimationFrame(() => modal.classList.add("is-open"));

    try {
      const movie = await getMovie(imdbID);
      const poster = posterUrl(movie.Poster);
      const fav = isFavorite(movie.imdbID);

      modalBody.innerHTML = `
        <div class="detail">
          ${
            poster
              ? `<img class="detail__poster" src="${poster}" alt="" />`
              : `<div class="detail__poster" style="display:grid;place-items:center;color:var(--text-subtle)">No image</div>`
          }
          <div>
            <h2 class="detail__title" id="modal-title">${movie.Title}</h2>
            <p class="detail__meta">${movie.Year} · ${movie.Rated || "N/A"} · ${movie.Runtime || ""}</p>
            <p class="detail__plot">${movie.Plot || "No plot available."}</p>
            <div class="detail__stats">
              ${movie.imdbRating && movie.imdbRating !== "N/A" ? `<span class="detail__stat">IMDb ${movie.imdbRating}</span>` : ""}
              ${movie.Genre ? `<span class="detail__stat">${movie.Genre.split(",")[0]}</span>` : ""}
              ${movie.Director && movie.Director !== "N/A" ? `<span class="detail__stat">${movie.Director}</span>` : ""}
            </div>
            <div class="detail__actions">
              <button type="button" class="btn btn--primary" id="modal-fav-btn">
                ${fav ? "Remove favorite" : "Add to favorites"}
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById("modal-fav-btn").addEventListener("click", () => {
        const active = toggleFavorite({
          imdbID: movie.imdbID,
          Title: movie.Title,
          Year: movie.Year,
          Poster: movie.Poster,
        });
        document.getElementById("modal-fav-btn").textContent = active
          ? "Remove favorite"
          : "Add to favorites";
        if (showingFavorites) renderFavorites();
        // refresh heart on cards
        if (!showingFavorites && lastResults.length) {
          renderGrid(movieGrid, lastResults);
        }
      });
    } catch (err) {
      modalBody.innerHTML = `<p style="color:var(--text-muted)">${err.message}</p>`;
    }
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      modal.hidden = true;
      if (previouslyFocused) previouslyFocused.focus();
    }, 280);
  }

  // ---------- Search ----------
  async function search(query) {
    if (!query.trim()) return;
    setStatus("Searching…");
    resultsEl.hidden = true;
    favoritesView.hidden = true;
    emptyEl.hidden = true;
    showingFavorites = false;
    favToggle.setAttribute("aria-pressed", "false");

    try {
      const movies = await searchMovies(query.trim());
      showSearchResults(movies);
      setStatus(`${movies.length} result${movies.length === 1 ? "" : "s"}`);
    } catch (err) {
      setStatus(err.message);
      emptyEl.hidden = false;
      resultsEl.hidden = true;
    }
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      search(queryInput.value);
    });

    document.querySelectorAll("[data-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const q = btn.getAttribute("data-q");
        queryInput.value = q;
        search(q);
      });
    });

    favToggle.addEventListener("click", () => {
      if (showingFavorites) {
        showingFavorites = false;
        favToggle.setAttribute("aria-pressed", "false");
        favoritesView.hidden = true;
        if (lastResults.length) {
          resultsEl.hidden = false;
          emptyEl.hidden = true;
        } else {
          emptyEl.hidden = false;
        }
      } else {
        showFavorites();
      }
    });

    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-modal]")) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    favCountEl.textContent = getFavorites().length;
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
