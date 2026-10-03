const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { requireFields, isEmail } = require("../middleware/validate");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/users
router.get("/", (req, res) => {
  const db = read();
  res.json({ data: db.users, count: db.users.length });
});

// GET /api/users/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return next(createError(404, "USER_NOT_FOUND", "User not found"));
  res.json({ data: user });
});

// POST /api/users
router.post("/", requireFields(["name", "email"]), (req, res, next) => {
  const { name, email, bio } = req.body;
  if (!isEmail(email)) {
    return next(createError(400, "VALIDATION_ERROR", "Invalid email address"));
  }

  const user = withDb((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw createError(409, "EMAIL_EXISTS", "Email is already registered");
    }
    const created = {
      id: randomUUID(),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      bio: bio ? String(bio).trim() : "",
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return created;
  });

  res.status(201).json({ data: user });
});

// PUT /api/users/:id
router.put("/:id", (req, res, next) => {
  const { name, email, bio } = req.body;
  try {
    const updated = withDb((db) => {
      const idx = db.users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) throw createError(404, "USER_NOT_FOUND", "User not found");

      if (email !== undefined) {
        if (!isEmail(email)) {
          throw createError(400, "VALIDATION_ERROR", "Invalid email address");
        }
        const taken = db.users.some(
          (u) => u.id !== req.params.id && u.email.toLowerCase() === email.toLowerCase()
        );
        if (taken) throw createError(409, "EMAIL_EXISTS", "Email is already registered");
        db.users[idx].email = String(email).trim().toLowerCase();
      }
      if (name !== undefined) db.users[idx].name = String(name).trim();
      if (bio !== undefined) db.users[idx].bio = String(bio).trim();
      return db.users[idx];
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete("/:id", (req, res, next) => {
  try {
    withDb((db) => {
      const idx = db.users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) throw createError(404, "USER_NOT_FOUND", "User not found");
      db.users.splice(idx, 1);
      // Cascade: remove their posts and comments
      const postIds = db.posts.filter((p) => p.authorId === req.params.id).map((p) => p.id);
      db.posts = db.posts.filter((p) => p.authorId !== req.params.id);
      db.comments = db.comments.filter(
        (c) => c.authorId !== req.params.id && !postIds.includes(c.postId)
      );
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
