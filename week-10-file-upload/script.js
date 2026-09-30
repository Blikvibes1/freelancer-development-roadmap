/**
 * Dropzone — Week 10 File Upload UI
 * Drag-and-drop, validation, progress. Clean & modular.
 */

(function () {
  "use strict";

  const THEME_KEY = "dropzone-theme";
  const THEMES = ["noir", "lumen"];
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"];

  const themeSwitch = document.getElementById("theme-switch");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");
  const uploadNote = document.getElementById("upload-note");

  let files = []; // { id, file, status, progress, error, previewUrl }

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

  // ---------- Helpers ----------
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getExt(name) {
    return name.split(".").pop().toLowerCase();
  }

  function validateFile(file) {
    const ext = getExt(file.name);
    if (!ALLOWED_EXT.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      return "File type not allowed";
    }
    if (file.size > MAX_SIZE) {
      return "File exceeds 5 MB limit";
    }
    return null;
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  // ---------- Render ----------
  function renderList() {
    fileList.innerHTML = "";

    files.forEach((item) => {
      const el = document.createElement("div");
      el.className = "file-item";
      el.dataset.id = item.id;
      if (item.error) el.classList.add("is-error");
      if (item.status === "done") el.classList.add("is-done");

      let thumbHtml = "";
      if (item.previewUrl) {
        thumbHtml = `<img class="file-item__thumb" src="${item.previewUrl}" alt="" />`;
      } else {
        const ext = getExt(item.file.name);
        thumbHtml = `<div class="file-item__icon">${ext}</div>`;
      }

      const meta = item.error
        ? `<p class="file-item__error">${item.error}</p>`
        : `<p class="file-item__meta">${formatSize(item.file.size)}${
            item.status === "uploading" ? ` · ${item.progress}%` : ""
          }${item.status === "done" ? " · Uploaded" : ""}</p>`;

      const progressHtml =
        item.status === "uploading" || item.status === "done"
          ? `<div class="file-item__progress"><div class="file-item__progress-bar" style="width:${item.progress}%"></div></div>`
          : "";

      el.innerHTML = `
        ${thumbHtml}
        <div class="file-item__info">
          <p class="file-item__name">${item.file.name}</p>
          ${meta}
          ${progressHtml}
        </div>
        <button type="button" class="file-item__remove" aria-label="Remove ${item.file.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      `;

      el.querySelector(".file-item__remove").addEventListener("click", () => {
        removeFile(item.id);
      });

      fileList.appendChild(el);
    });

    uploadNote.hidden = files.length === 0;
    if (files.length > 0) {
      const ok = files.filter((f) => !f.error).length;
      const bad = files.filter((f) => f.error).length;
      uploadNote.textContent =
        bad > 0
          ? `${ok} file(s) ready · ${bad} rejected`
          : `${ok} file(s) ready (demo upload — nothing is sent to a server)`;
    }
  }

  // ---------- File handling ----------
  function addFiles(fileListLike) {
    const incoming = Array.from(fileListLike);

    incoming.forEach((file) => {
      const error = validateFile(file);
      const id = uid();
      const item = {
        id,
        file,
        status: error ? "error" : "pending",
        progress: 0,
        error,
        previewUrl: null,
      };

      if (!error && file.type.startsWith("image/")) {
        item.previewUrl = URL.createObjectURL(file);
      }

      files.push(item);

      if (!error) {
        simulateUpload(item);
      }
    });

    renderList();
  }

  function removeFile(id) {
    const item = files.find((f) => f.id === id);
    if (item && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    files = files.filter((f) => f.id !== id);
    renderList();
  }

  function simulateUpload(item) {
    item.status = "uploading";
    item.progress = 0;
    renderList();

    const duration = 1200 + Math.random() * 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      item.progress = pct;
      renderList();

      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        item.status = "done";
        renderList();
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- Dropzone events ----------
  function openPicker() {
    fileInput.click();
  }

  function onDragOver(e) {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  }

  function onDragLeave(e) {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
  }

  function onDrop(e) {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
    if (e.dataTransfer?.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  function onKeydown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }

  // ---------- Bind ----------
  function bindEvents() {
    themeSwitch.addEventListener("click", toggleTheme);

    dropzone.addEventListener("click", openPicker);
    dropzone.addEventListener("keydown", onKeydown);
    dropzone.addEventListener("dragover", onDragOver);
    dropzone.addEventListener("dragleave", onDragLeave);
    dropzone.addEventListener("drop", onDrop);

    fileInput.addEventListener("change", () => {
      if (fileInput.files?.length) {
        addFiles(fileInput.files);
        fileInput.value = "";
      }
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
