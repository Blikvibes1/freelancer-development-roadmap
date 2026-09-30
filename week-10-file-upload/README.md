# Dropzone — Week 10 File Upload UI

Drag-and-drop file upload zone with type/size validation, progress bars, image previews, and true Theme Mode.

## Purpose

Week 10 of the Freelancer 100-week development program.  
Roadmap requirement: **File Upload UI — drag-and-drop file upload zone with progress bars and file type/size validation.**

This completes **Phase 1: Frontend UI Components**.

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Drag-and-drop upload zone
- File list with status states
- Progress bars per file
- Image thumbnail previews
- Error / success states
- Dashed interactive drop target
- Keyboard-accessible custom control
- Theme-aware surfaces, borders, and geometry
- Micro-interactions (drag-over highlight, remove buttons)

## Features

- Drag & drop + click to browse
- Multiple files at once
- Type validation (images, PDF, DOC, TXT)
- Size validation (max 5 MB)
- Simulated per-file upload progress
- Image thumbnail previews
- Remove individual files
- Keyboard support (Enter / Space on dropzone)
- True Theme Mode (Noir / Lumen)
- `localStorage` theme preference
- Zero dependencies
- Demo only — no files are uploaded to a server

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Project Structure

```
week-10-file-upload/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 1 · Week 10**  
Phase 1 complete.
