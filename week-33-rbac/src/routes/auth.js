const express = require("express");
const bcrypt = require("bcryptjs");
const { read } = require("../data/store");
const { signToken, publicUser } = require("../utils/tokens");
const { createError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/rbac");
const { permissionsFor } = require("../config/roles");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return next(createError(400, "VALIDATION_ERROR", "email and password required"));
    }

    const db = read();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user) {
      return next(createError(401, "INVALID_CREDENTIALS", "Invalid email or password"));
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return next(createError(401, "INVALID_CREDENTIALS", "Invalid email or password"));
    }

    const token = signToken(user);
    res.json({
      data: {
        user: publicUser(user),
        permissions: permissionsFor(user.role),
        accessToken: token,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res, next) => {
  const db = read();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return next(createError(404, "NOT_FOUND", "User not found"));
  res.json({
    data: {
      user: publicUser(user),
      permissions: permissionsFor(user.role),
    },
  });
});

module.exports = router;
