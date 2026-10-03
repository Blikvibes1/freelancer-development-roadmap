const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { requireFields } = require("../middleware/validate");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/posts?authorId=&tag=&q=
router.get("/", (req, res) => {
  const db = read();
  let posts = [...db.posts];

  if (req.query.authorId) {
    posts = posts.filter((p) => p.authorId === req.query.authorId);
  }
  if (req.query.tag) {
    const tag = String(req.query.tag).toLowerCase();
    posts = posts.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === tag));
  }
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }

  // Newest first
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ data: posts, count: posts.length });
});

// GET /api/posts/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return next(createError(404, "POST_NOT_FOUND", "Post not found"));

  const author = db.users.find((u) => u.id === post.authorId) || null;
  const comments = db.comments.filter((c) => c.postId === post.id);

  res.json({
    data: {
      ...post,
      author: author
        ? { id: author.id, name: author.name, email: author.email }
        : null,
      comments,
    },
  });
});

// POST /api/posts
router.post(
  "/",
  requireFields(["authorId", "title", "content"]),
  (req, res, next) => {
    const { authorId, title, content, tags } = req.body;
    try {
      const post = withDb((db) => {
        const author = db.users.find((u) => u.id === authorId);
        if (!author) throw createError(400, "INVALID_AUTHOR", "authorId does not exist");

        const created = {
          id: randomUUID(),
          authorId,
          title: String(title).trim(),
          content: String(content).trim(),
          tags: Array.isArray(tags)
            ? tags.map((t) => String(t).trim()).filter(Boolean)
            : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.posts.push(created);
        return created;
      });
      res.status(201).json({ data: post });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/posts/:id
router.put("/:id", (req, res, next) => {
  const { title, content, tags } = req.body;
  try {
    const updated = withDb((db) => {
      const idx = db.posts.findIndex((p) => p.id === req.params.id);
      if (idx === -1) throw createError(404, "POST_NOT_FOUND", "Post not found");

      if (title !== undefined) db.posts[idx].title = String(title).trim();
      if (content !== undefined) db.posts[idx].content = String(content).trim();
      if (tags !== undefined) {
        db.posts[idx].tags = Array.isArray(tags)
          ? tags.map((t) => String(t).trim()).filter(Boolean)
          : [];
      }
      db.posts[idx].updatedAt = new Date().toISOString();
      return db.posts[idx];
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id
router.delete("/:id", (req, res, next) => {
  try {
    withDb((db) => {
      const idx = db.posts.findIndex((p) => p.id === req.params.id);
      if (idx === -1) throw createError(404, "POST_NOT_FOUND", "Post not found");
      db.posts.splice(idx, 1);
      db.comments = db.comments.filter((c) => c.postId !== req.params.id);
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
