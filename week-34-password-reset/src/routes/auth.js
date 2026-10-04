const express = require("express");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const {
  generateResetToken,
  hashToken,
  expiresAt,
  isExpired,
  RESET_TTL_MS,
} = require("../utils/tokens");
const { sendPasswordResetEmail } = require("../utils/mailer");

const router = express.Router();
const SALT_ROUNDS = 10;

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function baseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

// POST /api/auth/signup — so the flow can be tested end-to-end
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
        createdAt: new Date().toISOString(),
      };
      db.users.push(created);
      return created;
    });

    res.status(201).json({ data: { user: publicUser(user) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — verify password after reset
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
    res.json({ data: { user: publicUser(user), message: "Login ok" } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password
 * Always returns a generic success message (do not leak whether email exists).
 */
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email || !isEmail(email)) {
      return next(createError(400, "VALIDATION_ERROR", "valid email is required"));
    }

    const normalized = String(email).trim().toLowerCase();
    const db = read();
    const user = db.users.find((u) => u.email === normalized);

    if (user) {
      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);
      const exp = expiresAt();

      withDb((store) => {
        // Invalidate previous tokens for this user
        store.resetTokens.forEach((t) => {
          if (t.userId === user.id && !t.usedAt) t.usedAt = new Date().toISOString();
        });
        store.resetTokens.push({
          id: randomUUID(),
          userId: user.id,
          tokenHash,
          expiresAt: exp,
          usedAt: null,
          createdAt: new Date().toISOString(),
        });
        // Cap list
        if (store.resetTokens.length > 200) {
          store.resetTokens = store.resetTokens.slice(-200);
        }
      });

      const resetUrl = `${baseUrl(req)}/reset-password?token=${rawToken}`;
      sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        expiresInMinutes: Math.round(RESET_TTL_MS / 60000),
      });

      // Dev helper: include token only when explicitly enabled
      if (process.env.EXPOSE_RESET_TOKEN === "true") {
        return res.json({
          data: {
            message: "If that email exists, a reset link was sent.",
            devToken: rawToken,
            devResetUrl: resetUrl,
          },
        });
      }
    }

    res.json({
      data: {
        message: "If that email exists, a reset link was sent.",
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/reset-password/validate?token=
 * Check token before showing the form.
 */
router.get("/reset-password/validate", (req, res, next) => {
  const token = req.query.token;
  if (!token || typeof token !== "string") {
    return next(createError(400, "VALIDATION_ERROR", "token is required"));
  }

  const tokenHash = hashToken(token);
  const db = read();
  const record = db.resetTokens.find((t) => t.tokenHash === tokenHash);

  if (!record || record.usedAt || isExpired(record.expiresAt)) {
    return next(
      createError(400, "INVALID_TOKEN", "Reset link is invalid or has expired")
    );
  }

  res.json({
    data: {
      valid: true,
      expiresAt: record.expiresAt,
    },
  });
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || typeof token !== "string") {
      return next(createError(400, "VALIDATION_ERROR", "token is required"));
    }
    if (!password || String(password).length < 8) {
      return next(
        createError(400, "VALIDATION_ERROR", "password must be at least 8 characters")
      );
    }

    const tokenHash = hashToken(token);
    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    withDb((db) => {
      const record = db.resetTokens.find((t) => t.tokenHash === tokenHash);
      if (!record || record.usedAt || isExpired(record.expiresAt)) {
        throw createError(400, "INVALID_TOKEN", "Reset link is invalid or has expired");
      }

      const user = db.users.find((u) => u.id === record.userId);
      if (!user) {
        throw createError(400, "INVALID_TOKEN", "Reset link is invalid or has expired");
      }

      user.passwordHash = passwordHash;
      record.usedAt = new Date().toISOString();

      // Invalidate any other outstanding tokens for this user
      db.resetTokens.forEach((t) => {
        if (t.userId === user.id && !t.usedAt) {
          t.usedAt = record.usedAt;
        }
      });
    });

    res.json({
      data: { message: "Password updated. You can log in with your new password." },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
