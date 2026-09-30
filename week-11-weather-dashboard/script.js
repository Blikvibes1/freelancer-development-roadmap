/**
 * Skye — Week 11 Weather Dashboard
 * Open-Meteo API (no key). Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "skye-theme";
  const THEMES = ["noir", "lumen"];

  const themeSwitch = document.getElementById("theme-switch");
  const form = document.getElementById("search-form");
  const cityInput = document.getElementById("city-input");
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");
  const emptyEl = document.getElementById("empty");
  const forecastGrid = document.getElementById("forecast-grid");

  // WMO weather interpretation codes → icon + label
  const WEATHER_MAP = {
    0: { icon: "☀️", label: "Clear sky" },
    1: { icon: "🌤️", label: "Mainly clear" },
    2: { icon: "⛅", label: "Partly cloudy" },
    3: { icon: "☁️", label: "Overcast" },
    45: { icon: "🌫️", label: "Fog" },
    48: { icon: "🌫️", label: "Depositing rime fog" },
    51: { icon: "🌦️", label: "Light drizzle" },
    53: { icon: "🌦️", label: "Moderate drizzle" },
    55: { icon: "🌧️", label: "Dense drizzle" },
    61: { icon: "🌧️", label: "Slight rain" },
    63: { icon: "🌧️", label: "Moderate rain" },
    65: { icon: "🌧️", label: "Heavy rain" },
    71: { icon: "🌨️", label: "Slight snow" },
    73: { icon: "🌨️", label: "Moderate snow" },
    75: { icon: "❄️", label: "Heavy snow" },
    80: { icon: "🌦️", label: "Slight showers" },
    81: { icon: "🌧️", label: "Moderate showers" },
    82: { icon: "⛈️", label: "Violent showers" },
    95: { icon: "⛈️", label: "Thunderstorm" },
    96: { icon: "⛈️", label: "Thunderstorm with hail" },
    99: { icon: "⛈️", label: "Thunderstorm with heavy hail" },
  };

  function weatherInfo(code) {
    return WEATHER_MAP[code] || { icon: "🌡️", label: "Unknown" };
  }

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

  // ---------- API ----------
  async function geocode(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("City not found");
    }
    const r = data.results[0];
    return {
      name: r.name,
      country: r.country || "",
      lat: r.latitude,
      lon: r.longitude,
      admin: r.admin1 || "",
    };
  }

  async function fetchWeather(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: 5,
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");
    return res.json();
  }

  // ---------- Render ----------
  function setStatus(msg) {
    statusEl.textContent = msg || "";
  }

  function showResults(place, weather) {
    emptyEl.hidden = true;
    resultsEl.hidden = false;

    const current = weather.current;
    const info = weatherInfo(current.weather_code);

    document.getElementById("current-city").textContent =
      place.admin ? `${place.name}, ${place.admin}` : `${place.name}${place.country ? ", " + place.country : ""}`;
    document.getElementById("current-date").textContent = new Date(
      current.time
    ).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    document.getElementById("current-icon").textContent = info.icon;
    document.getElementById("current-temp").textContent = Math.round(current.temperature_2m);
    document.getElementById("current-desc").textContent = info.label;
    document.getElementById("feels-like").textContent =
      Math.round(current.apparent_temperature) + "°";
    document.getElementById("humidity").textContent = current.relative_humidity_2m + "%";
    document.getElementById("wind").textContent =
      Math.round(current.wind_speed_10m) + " km/h";
    document.getElementById("precip").textContent =
      (current.precipitation ?? 0) + " mm";

    // Forecast
    forecastGrid.innerHTML = "";
    const days = weather.daily;
    for (let i = 0; i < days.time.length; i++) {
      const dayInfo = weatherInfo(days.weather_code[i]);
      const date = new Date(days.time[i] + "T12:00:00");
      const dayName = date.toLocaleDateString(undefined, { weekday: "short" });

      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
        <p class="forecast-card__day">${dayName}</p>
        <div class="forecast-card__icon">${dayInfo.icon}</div>
        <p class="forecast-card__temps">
          ${Math.round(days.temperature_2m_max[i])}°
          <span class="forecast-card__low">${Math.round(days.temperature_2m_min[i])}°</span>
        </p>
      `;
      forecastGrid.appendChild(card);
    }
  }

  // ---------- Search ----------
  async function search(city) {
    if (!city.trim()) return;

    setStatus("Searching…");
    resultsEl.hidden = true;
    emptyEl.hidden = true;

    try {
      const place = await geocode(city.trim());
      setStatus("Loading weather…");
      const weather = await fetchWeather(place.lat, place.lon);
      showResults(place, weather);
      setStatus("");
      cityInput.value = place.name;
    } catch (err) {
      setStatus(err.message === "City not found" ? "City not found. Try another name." : "Something went wrong. Please try again.");
      emptyEl.hidden = false;
      resultsEl.hidden = true;
    }
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      search(cityInput.value);
    });

    document.querySelectorAll("[data-city]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const city = btn.getAttribute("data-city");
        cityInput.value = city;
        search(city);
      });
    });
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
