const express = require("express");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  newJti,
  hashToken,
  publicUser,
} = require("../utils/tokens");

const router = express.Router();
const SALT_ROUNDS = 10;

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

function issueTokenPair(user) {
  const jti = newJti();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, jti);
  const tokenHash = hashToken(refreshToken);

  withDb((db) => {
    // Optional: revoke older tokens for this user (single-session style)
    // Keep last few for multi-device; here we keep max 5
    db.refreshTokens = db.refreshTokens.filter((t) => t.userId !== user.id);
    db.refreshTokens.push({
      jti,
      userId: user.id,
      tokenHash,
      createdAt: new Date().toISOString(),
      revoked: false,
    });
    // Cap global list
    if (db.refreshTokens.length > 200) {
      db.refreshTokens = db.refreshTokens.slice(-200);
    }
  });

  return { accessToken, refreshToken };
}

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !String(name).trim()) {
      return next(createError(400, "VALIDATION_ERROR", "name is required"));
    }
    if (!email || !isEmail(email)) {
      return next(createError(400, "VALIDATION_ERROR", "valid email is required"));
    }
    if (!password || String(password).length < 8) {
      return next(
        createError(400, "VALIDATION_ERROR", "password must be at least 8 characters")
      );
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const user = withDb((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw createError(409, "EMAIL_EXISTS", "Email is already registered");
      }
      const created = {
        id: randomUUID(),
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        passwordHash,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      db.users.push(created);
      return created;
    });

    const tokens = issueTokenPair(user);
    res.status(201).json({
      data: {
        user: publicUser(user),
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return next(
        createError(400, "VALIDATION_ERROR", "email and password are required")
      );
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

    const tokens = issueTokenPair(user);
    res.json({
      data: {
        user: publicUser(user),
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — rotate refresh token
router.post("/refresh", (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return next(createError(400, "VALIDATION_ERROR", "refreshToken is required"));
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const result = withDb((db) => {
      const stored = db.refreshTokens.find(
        (t) => t.jti === payload.jti && t.tokenHash === tokenHash
      );

      if (!stored || stored.revoked) {
        // Possible reuse — revoke all for this user
        db.refreshTokens.forEach((t) => {
          if (t.userId === payload.sub) t.revoked = true;
        });
        throw createError(401, "INVALID_REFRESH", "Refresh token is invalid or revoked");
      }

      const user = db.users.find((u) => u.id === payload.sub);
      if (!user) {
        throw createError(401, "INVALID_REFRESH", "User no longer exists");
      }

      // Rotate: revoke old
      stored.revoked = true;

      const jti = newJti();
      const accessToken = signAccessToken(user);
      const newRefresh = signRefreshToken(user, jti);
      db.refreshTokens.push({
        jti,
        userId: user.id,
        tokenHash: hashToken(newRefresh),
        createdAt: new Date().toISOString(),
        revoked: false,
      });

      return {
        user: publicUser(user),
        accessToken,
        refreshToken: newRefresh,
      };
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — revoke refresh token
router.post("/logout", (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return next(createError(400, "VALIDATION_ERROR", "refreshToken is required"));
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      // Already invalid — treat as success (idempotent logout)
      return res.status(204).send();
    }

    const tokenHash = hashToken(refreshToken);
    withDb((db) => {
      const stored = db.refreshTokens.find(
        (t) => t.jti === payload.jti && t.tokenHash === tokenHash
      );
      if (stored) stored.revoked = true;
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — protected
router.get("/me", requireAuth, (req, res, next) => {
  const db = read();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return next(createError(404, "USER_NOT_FOUND", "User not found"));
  res.json({ data: publicUser(user) });
});

module.exports = router;
