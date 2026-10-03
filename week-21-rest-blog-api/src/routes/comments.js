const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { requireFields } = require("../middleware/validate");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/comments?postId=
router.get("/", (req, res) => {
  const db = read();
  let comments = [...db.comments];
  if (req.query.postId) {
    comments = comments.filter((c) => c.postId === req.query.postId);
  }
  comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json({ data: comments, count: comments.length });
});

// GET /api/comments/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const comment = db.comments.find((c) => c.id === req.params.id);
  if (!comment) {
    return next(createError(404, "COMMENT_NOT_FOUND", "Comment not found"));
  }
  res.json({ data: comment });
});

// POST /api/comments
router.post(
  "/",
  requireFields(["postId", "authorId", "content"]),
  (req, res, next) => {
    const { postId, authorId, content } = req.body;
    try {
      const comment = withDb((db) => {
        if (!db.posts.some((p) => p.id === postId)) {
          throw createError(400, "INVALID_POST", "postId does not exist");
        }
        if (!db.users.some((u) => u.id === authorId)) {
          throw createError(400, "INVALID_AUTHOR", "authorId does not exist");
        }
        const created = {
          id: randomUUID(),
          postId,
          authorId,
          content: String(content).trim(),
          createdAt: new Date().toISOString(),
        };
        db.comments.push(created);
        return created;
      });
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/comments/:id
router.put("/:id", (req, res, next) => {
  const { content } = req.body;
  if (content === undefined || String(content).trim() === "") {
    return next(
      createError(400, "VALIDATION_ERROR", "content is required")
    );
  }
  try {
    const updated = withDb((db) => {
      const idx = db.comments.findIndex((c) => c.id === req.params.id);
      if (idx === -1) {
        throw createError(404, "COMMENT_NOT_FOUND", "Comment not found");
      }
      db.comments[idx].content = String(content).trim();
      return db.comments[idx];
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id
router.delete("/:id", (req, res, next) => {
  try {
    withDb((db) => {
      const idx = db.comments.findIndex((c) => c.id === req.params.id);
      if (idx === -1) {
        throw createError(404, "COMMENT_NOT_FOUND", "Comment not found");
      }
      db.comments.splice(idx, 1);
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
