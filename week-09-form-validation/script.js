/**
 * Forma — Week 09 Multi-step Form Validation
 * Real-time regex validation. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "forma-theme";
  const THEMES = ["noir", "lumen"];

  const themeSwitch = document.getElementById("theme-switch");
  const form = document.getElementById("form");
  const btnNext = document.getElementById("btn-next");
  const btnBack = document.getElementById("btn-back");
  const formActions = document.getElementById("form-actions");
  const successEl = document.getElementById("success");
  const resetBtn = document.getElementById("reset-form");
  const progressFill = document.getElementById("progress-fill");
  const stepIndicators = document.querySelectorAll("[data-step-indicator]");
  const togglePassword = document.getElementById("toggle-password");

  let currentStep = 1;
  const totalSteps = 3;

  // ---------- Validation rules ----------
  const rules = {
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: "Enter a valid email address",
    },
    password: {
      test: (v) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(v),
      message: "Min 8 characters, 1 uppercase, 1 number",
    },
    confirm: {
      test: (v) => v === document.getElementById("password").value && v.length > 0,
      message: "Passwords do not match",
    },
    fullname: {
      test: (v) => v.trim().length >= 2,
      message: "Enter your full name",
    },
    username: {
      test: (v) => /^[a-zA-Z0-9_]{3,20}$/.test(v),
      message: "3–20 characters: letters, numbers, underscores",
    },
    role: {
      test: (v) => v !== "",
      message: "Please select a role",
    },
    terms: {
      test: () => document.getElementById("terms").checked,
      message: "You must agree to continue",
    },
  };

  const stepFields = {
    1: ["email", "password", "confirm"],
    2: ["fullname", "username", "role"],
    3: ["terms"],
  };

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

  // ---------- Field validation ----------
  function getFieldEl(name) {
    return document.querySelector(`[data-field="${name}"]`);
  }

  function getInput(name) {
    if (name === "terms") return document.getElementById("terms");
    return document.getElementById(name);
  }

  function showError(name, message) {
    const field = getFieldEl(name);
    const input = getInput(name);
    const errorEl = field.querySelector(`[data-error="${name}"]`);
    if (input && input.classList) {
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  }

  function clearError(name) {
    const field = getFieldEl(name);
    const input = getInput(name);
    const errorEl = field.querySelector(`[data-error="${name}"]`);
    if (input && input.classList) {
      input.classList.remove("is-invalid");
    }
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
  }

  function markValid(name) {
    const input = getInput(name);
    if (input && input.classList && name !== "terms") {
      input.classList.remove("is-invalid");
      input.classList.add("is-valid");
    }
  }

  function validateField(name) {
    const rule = rules[name];
    if (!rule) return true;

    let value;
    if (name === "terms") {
      value = document.getElementById("terms").checked;
    } else {
      value = document.getElementById(name).value;
    }

    const ok = rule.test(value);
    if (ok) {
      clearError(name);
      markValid(name);
    } else {
      showError(name, rule.message);
    }
    return ok;
  }

  function validateStep(step) {
    const fields = stepFields[step];
    let allValid = true;
    fields.forEach((name) => {
      if (!validateField(name)) allValid = false;
    });
    return allValid;
  }

  // ---------- Steps ----------
  function updateProgress() {
    const pct = (currentStep / totalSteps) * 100;
    progressFill.style.width = pct + "%";

    stepIndicators.forEach((el) => {
      const n = Number(el.getAttribute("data-step-indicator"));
      el.classList.remove("is-active", "is-done");
      if (n === currentStep) el.classList.add("is-active");
      else if (n < currentStep) el.classList.add("is-done");
    });
  }

  function showStep(step) {
    document.querySelectorAll(".form__step").forEach((el) => {
      const n = Number(el.getAttribute("data-step"));
      el.hidden = n !== step;
      el.classList.toggle("is-active", n === step);
    });

    btnBack.hidden = step === 1;
    btnNext.textContent = step === totalSteps ? "Create account" : "Continue";
    updateProgress();
  }

  function fillSummary() {
    const map = {
      email: document.getElementById("email").value,
      fullname: document.getElementById("fullname").value,
      username: "@" + document.getElementById("username").value,
      role: document.getElementById("role").selectedOptions[0]?.text || "—",
    };
    Object.keys(map).forEach((key) => {
      const el = document.querySelector(`[data-summary="${key}"]`);
      if (el) el.textContent = map[key] || "—";
    });
  }

  function goNext() {
    if (!validateStep(currentStep)) return;

    if (currentStep === totalSteps) {
      // Submit success
      formActions.hidden = true;
      document.querySelectorAll(".form__step").forEach((el) => (el.hidden = true));
      successEl.hidden = false;
      progressFill.style.width = "100%";
      stepIndicators.forEach((el) => {
        el.classList.remove("is-active");
        el.classList.add("is-done");
      });
      return;
    }

    currentStep += 1;
    if (currentStep === 3) fillSummary();
    showStep(currentStep);
  }

  function goBack() {
    if (currentStep <= 1) return;
    currentStep -= 1;
    showStep(currentStep);
  }

  function resetForm() {
    form.reset();
    currentStep = 1;
    successEl.hidden = true;
    formActions.hidden = false;
    document.querySelectorAll(".field__input").forEach((el) => {
      el.classList.remove("is-valid", "is-invalid");
    });
    document.querySelectorAll(".field__error").forEach((el) => {
      el.hidden = true;
    });
    showStep(1);
  }

  // ---------- Password toggle ----------
  function setupPasswordToggle() {
    const input = document.getElementById("password");
    const eye = togglePassword.querySelector(".icon-eye");
    const eyeOff = togglePassword.querySelector(".icon-eye-off");

    togglePassword.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      eye.hidden = isPassword;
      eyeOff.hidden = !isPassword;
      togglePassword.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  // ---------- Real-time validation ----------
  function bindRealtime() {
    ["email", "password", "confirm", "fullname", "username", "role"].forEach((name) => {
      const input = document.getElementById(name);
      if (!input) return;
      input.addEventListener("blur", () => validateField(name));
      input.addEventListener("input", () => {
        if (input.classList.contains("is-invalid") || input.classList.contains("is-valid")) {
          validateField(name);
        }
        // Keep confirm in sync when password changes
        if (name === "password") {
          const confirm = document.getElementById("confirm");
          if (confirm.value) validateField("confirm");
        }
      });
    });

    document.getElementById("terms").addEventListener("change", () => {
      validateField("terms");
    });
  }

  // ---------- Events ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);
    btnNext.addEventListener("click", goNext);
    btnBack.addEventListener("click", goBack);
    resetBtn.addEventListener("click", resetForm);
    form.addEventListener("submit", (e) => e.preventDefault());
    setupPasswordToggle();
    bindRealtime();
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    showStep(1);
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
