const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const {
  requireAuth,
  requirePermission,
  requirePermissionOrOwn,
} = require("../middleware/rbac");

const router = express.Router();

// GET /api/articles — viewers+
router.get(
  "/",
  requireAuth,
  requirePermission("articles:read"),
  (req, res) => {
    const db = read();
    const articles = [...db.articles].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ data: articles, count: articles.length });
  }
);

// GET /api/articles/:id
router.get(
  "/:id",
  requireAuth,
  requirePermission("articles:read"),
  (req, res, next) => {
    const db = read();
    const article = db.articles.find((a) => a.id === req.params.id);
    if (!article) return next(createError(404, "NOT_FOUND", "Article not found"));
    res.json({ data: article });
  }
);

// POST /api/articles — editors+
router.post(
  "/",
  requireAuth,
  requirePermission("articles:create"),
  (req, res, next) => {
    const { title, body } = req.body || {};
    if (!title || !String(title).trim()) {
      return next(createError(400, "VALIDATION_ERROR", "title is required"));
    }
    const now = new Date().toISOString();
    const article = withDb((db) => {
      const created = {
        id: randomUUID(),
        title: String(title).trim(),
        body: body ? String(body).trim() : "",
        authorId: req.user.id,
        createdAt: now,
        updatedAt: now,
      };
      db.articles.push(created);
      return created;
    });
    res.status(201).json({ data: article });
  }
);

// PUT /api/articles/:id — admin any, editor own
router.put(
  "/:id",
  requireAuth,
  (req, res, next) => {
    const db = read();
    const article = db.articles.find((a) => a.id === req.params.id);
    if (!article) return next(createError(404, "NOT_FOUND", "Article not found"));
    req.resource = article;
    next();
  },
  requirePermissionOrOwn("articles:update", "articles:update:own", (req) =>
    req.resource ? req.resource.authorId : null
  ),
  (req, res, next) => {
    const { title, body } = req.body || {};
    try {
      const updated = withDb((db) => {
        const idx = db.articles.findIndex((a) => a.id === req.params.id);
        if (idx === -1) throw createError(404, "NOT_FOUND", "Article not found");
        if (title !== undefined) db.articles[idx].title = String(title).trim();
        if (body !== undefined) db.articles[idx].body = String(body).trim();
        db.articles[idx].updatedAt = new Date().toISOString();
        return db.articles[idx];
      });
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/articles/:id — admin any, editor own
router.delete(
  "/:id",
  requireAuth,
  (req, res, next) => {
    const db = read();
    const article = db.articles.find((a) => a.id === req.params.id);
    if (!article) return next(createError(404, "NOT_FOUND", "Article not found"));
    req.resource = article;
    next();
  },
  requirePermissionOrOwn("articles:delete", "articles:delete:own", (req) =>
    req.resource ? req.resource.authorId : null
  ),
  (req, res, next) => {
    try {
      withDb((db) => {
        const idx = db.articles.findIndex((a) => a.id === req.params.id);
        if (idx === -1) throw createError(404, "NOT_FOUND", "Article not found");
        db.articles.splice(idx, 1);
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
