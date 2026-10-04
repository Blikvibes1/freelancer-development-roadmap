const express = require("express");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");
const {
  newSessionId,
  signAccessToken,
  publicUser,
  publicSession,
} = require("../utils/tokens");
const { parseDevice, clientIp } = require("../utils/device");

const router = express.Router();
const SALT_ROUNDS = 10;

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
}

function createSessionRecord(user, req) {
  const ua = req.get("user-agent") || "";
  const device = parseDevice(ua);
  const now = new Date().toISOString();
  return {
    id: newSessionId(),
    userId: user.id,
    userAgent: ua.slice(0, 300),
    ip: clientIp(req),
    device: device.label,
    createdAt: now,
    lastSeenAt: now,
    revokedAt: null,
  };
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
        createdAt: new Date().toISOString(),
      };
      db.users.push(created);
      return created;
    });

    const session = createSessionRecord(user, req);
    withDb((db) => {
      db.sessions.push(session);
    });
    const accessToken = signAccessToken(user, session.id);

    res.status(201).json({
      data: {
        user: publicUser(user),
        session: publicSession(session, session.id),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — creates a new session (device)
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

    const session = createSessionRecord(user, req);
    withDb((store) => {
      store.sessions.push(session);
      // Cap sessions per user (keep newest 20)
      const mine = store.sessions
        .filter((s) => s.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (mine.length > 20) {
        const drop = new Set(mine.slice(20).map((s) => s.id));
        store.sessions = store.sessions.filter((s) => !drop.has(s.id));
      }
    });

    const accessToken = signAccessToken(user, session.id);
    res.json({
      data: {
        user: publicUser(user),
        session: publicSession(session, session.id),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — revoke current session only
router.post("/logout", requireAuth, (req, res) => {
  withDb((db) => {
    const s = db.sessions.find((x) => x.id === req.sessionId);
    if (s && !s.revokedAt) s.revokedAt = new Date().toISOString();
  });
  res.status(204).send();
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res, next) => {
  const db = read();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return next(createError(404, "NOT_FOUND", "User not found"));
  res.json({
    data: {
      user: publicUser(user),
      sessionId: req.sessionId,
    },
  });
});

// GET /api/auth/sessions — list active (+ recently revoked) sessions
router.get("/sessions", requireAuth, (req, res) => {
  const db = read();
  const sessions = db.sessions
    .filter((s) => s.userId === req.user.id)
    .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
    .map((s) => publicSession(s, req.sessionId));

  res.json({
    data: sessions,
    count: sessions.length,
    activeCount: sessions.filter((s) => !s.revoked).length,
  });
});

// DELETE /api/auth/sessions/:id — revoke one device
router.delete("/sessions/:id", requireAuth, (req, res, next) => {
  try {
    withDb((db) => {
      const s = db.sessions.find(
        (x) => x.id === req.params.id && x.userId === req.user.id
      );
      if (!s) throw createError(404, "NOT_FOUND", "Session not found");
      if (!s.revokedAt) s.revokedAt = new Date().toISOString();
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/sessions/revoke-others — keep current, kill rest
router.post("/sessions/revoke-others", requireAuth, (req, res) => {
  let revoked = 0;
  withDb((db) => {
    db.sessions.forEach((s) => {
      if (s.userId === req.user.id && s.id !== req.sessionId && !s.revokedAt) {
        s.revokedAt = new Date().toISOString();
        revoked += 1;
      }
    });
  });
  res.json({ data: { revoked } });
});

// POST /api/auth/sessions/revoke-all — log out every device including this one
router.post("/sessions/revoke-all", requireAuth, (req, res) => {
  let revoked = 0;
  withDb((db) => {
    db.sessions.forEach((s) => {
      if (s.userId === req.user.id && !s.revokedAt) {
        s.revokedAt = new Date().toISOString();
        revoked += 1;
      }
    });
  });
  res.json({
    data: {
      revoked,
      message: "All sessions revoked. Sign in again on this device.",
    },
  });
});

module.exports = router;
