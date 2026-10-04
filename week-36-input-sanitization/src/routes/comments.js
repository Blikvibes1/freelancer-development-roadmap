const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const { sanitizeInput } = require("../middleware/sanitize");

const router = express.Router();

// Sanitize all comment routes
router.use(
  sanitizeInput({
    escapeHtml: true,
    blockSqli: true,
    blockXss: false, // escape XSS payloads instead of rejecting (demo both modes)
    maxLength: 2000,
  })
);

// GET /api/comments
router.get("/", (req, res) => {
  const db = read();
  let list = [...db.comments];

  // Search uses sanitized query.q
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    list = list.filter(
      (c) =>
        c.author.toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ data: list, count: list.length });
});

// POST /api/comments
router.post("/", (req, res, next) => {
  const { author, body } = req.body || {};
  if (!author || !String(author).trim()) {
    return next(createError(400, "VALIDATION_ERROR", "author is required"));
  }
  if (!body || !String(body).trim()) {
    return next(createError(400, "VALIDATION_ERROR", "body is required"));
  }

  const comment = withDb((db) => {
    const created = {
      id: randomUUID(),
      author: String(author).trim(),
      body: String(body).trim(),
      createdAt: new Date().toISOString(),
    };
    db.comments.push(created);
    return created;
  });

  res.status(201).json({
    data: comment,
    meta: {
      sanitizeIssues: req.sanitizeIssues || [],
      note: "HTML special characters are escaped before storage",
    },
  });
});

// GET /api/comments/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const comment = db.comments.find((c) => c.id === req.params.id);
  if (!comment) return next(createError(404, "NOT_FOUND", "Comment not found"));
  res.json({ data: comment });
});

module.exports = router;
