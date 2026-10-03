const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/notes
router.get("/", (req, res) => {
  const db = read();
  let notes = [...db.notes];

  if (req.query.tag) {
    const tag = String(req.query.tag).toLowerCase();
    notes = notes.filter((n) => (n.tags || []).some((t) => t.toLowerCase() === tag));
  }
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.body || "").toLowerCase().includes(q)
    );
  }

  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ data: notes, count: notes.length });
});

// GET /api/notes/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const note = db.notes.find((n) => n.id === req.params.id);
  if (!note) return next(createError(404, "NOTE_NOT_FOUND", "Note not found"));
  res.json({ data: note });
});

// POST /api/notes
router.post("/", (req, res, next) => {
  const { title, body, tags } = req.body || {};
  if (!title || !String(title).trim()) {
    return next(
      createError(400, "VALIDATION_ERROR", "title is required", { field: "title" })
    );
  }

  const now = new Date().toISOString();
  const note = withDb((db) => {
    const created = {
      id: randomUUID(),
      title: String(title).trim(),
      body: body ? String(body).trim() : "",
      tags: Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
      createdAt: now,
      updatedAt: now,
    };
    db.notes.push(created);
    return created;
  });

  res.status(201).json({ data: note });
});

// PUT /api/notes/:id
router.put("/:id", (req, res, next) => {
  const { title, body, tags } = req.body || {};
  try {
    const updated = withDb((db) => {
      const idx = db.notes.findIndex((n) => n.id === req.params.id);
      if (idx === -1) throw createError(404, "NOTE_NOT_FOUND", "Note not found");
      if (title !== undefined) {
        if (!String(title).trim()) {
          throw createError(400, "VALIDATION_ERROR", "title cannot be empty");
        }
        db.notes[idx].title = String(title).trim();
      }
      if (body !== undefined) db.notes[idx].body = String(body).trim();
      if (tags !== undefined) {
        db.notes[idx].tags = Array.isArray(tags)
          ? tags.map((t) => String(t).trim()).filter(Boolean)
          : [];
      }
      db.notes[idx].updatedAt = new Date().toISOString();
      return db.notes[idx];
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id
router.delete("/:id", (req, res, next) => {
  try {
    withDb((db) => {
      const idx = db.notes.findIndex((n) => n.id === req.params.id);
      if (idx === -1) throw createError(404, "NOTE_NOT_FOUND", "Note not found");
      db.notes.splice(idx, 1);
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
