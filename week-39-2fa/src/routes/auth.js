const express = require("express");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const { requireAuth, requirePre2fa } = require("../middleware/auth");
const {
  signAccessToken,
  signPre2faToken,
  publicUser,
} = require("../utils/tokens");
const {
  generateSecret,
  keyuri,
  qrDataUrl,
  verifyToken: verifyTotp,
  generateBackupCodes,
  hashCode,
} = require("../utils/totp");

const router = express.Router();
const SALT_ROUNDS = 10;

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
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
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
        createdAt: new Date().toISOString(),
      };
      db.users.push(created);
      return created;
    });

    const accessToken = signAccessToken(user);
    res.status(201).json({
      data: { user: publicUser(user), accessToken },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// If 2FA enabled → return requires2fa + pre2faToken
// Else → accessToken
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

    if (user.totpEnabled) {
      const pre2faToken = signPre2faToken(user);
      return res.json({
        data: {
          requires2fa: true,
          pre2faToken,
          message: "Enter the 6-digit code from your authenticator app",
        },
      });
    }

    const accessToken = signAccessToken(user);
    res.json({
      data: {
        requires2fa: false,
        user: publicUser(user),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/verify-login — complete login with TOTP or backup code
router.post("/2fa/verify-login", requirePre2fa, async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return next(createError(400, "VALIDATION_ERROR", "code is required"));
    }

    const db = read();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user || !user.totpEnabled || !user.totpSecret) {
      return next(createError(400, "2FA_NOT_ENABLED", "2FA is not enabled for this user"));
    }

    let valid = verifyTotp(user.totpSecret, code);

    // Try backup codes
    if (!valid && user.backupCodes && user.backupCodes.length) {
      const h = hashCode(code);
      const idx = user.backupCodes.findIndex((c) => c === h);
      if (idx !== -1) {
        valid = true;
        withDb((store) => {
          const u = store.users.find((x) => x.id === user.id);
          if (u) u.backupCodes.splice(idx, 1);
        });
      }
    }

    if (!valid) {
      return next(createError(401, "INVALID_CODE", "Invalid authentication code"));
    }

    const accessToken = signAccessToken(user);
    res.json({
      data: {
        user: publicUser(user),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/setup — start enrollment (authenticated)
router.post("/2fa/setup", requireAuth, async (req, res, next) => {
  try {
    const db = read();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) return next(createError(404, "NOT_FOUND", "User not found"));
    if (user.totpEnabled) {
      return next(createError(400, "ALREADY_ENABLED", "2FA is already enabled"));
    }

    const secret = generateSecret();
    const otpauthUrl = keyuri(user.email, secret);
    const qrCodeDataUrl = await qrDataUrl(otpauthUrl);

    // Store pending secret until confirmed
    withDb((store) => {
      store.pending2fa = store.pending2fa || {};
      store.pending2fa[user.id] = {
        secret,
        createdAt: new Date().toISOString(),
      };
    });

    res.json({
      data: {
        secret, // for manual entry
        otpauthUrl,
        qrCodeDataUrl,
        message: "Scan the QR code, then confirm with POST /api/auth/2fa/confirm",
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/confirm — enable after verifying first code
router.post("/2fa/confirm", requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return next(createError(400, "VALIDATION_ERROR", "code is required"));
    }

    const db = read();
    const pending = (db.pending2fa || {})[req.user.id];
    if (!pending || !pending.secret) {
      return next(
        createError(400, "NO_PENDING_SETUP", "Call /api/auth/2fa/setup first")
      );
    }

    if (!verifyTotp(pending.secret, code)) {
      return next(createError(401, "INVALID_CODE", "Invalid authentication code"));
    }

    const plainBackup = generateBackupCodes(8);
    const hashedBackup = plainBackup.map(hashCode);

    withDb((store) => {
      const u = store.users.find((x) => x.id === req.user.id);
      if (!u) throw createError(404, "NOT_FOUND", "User not found");
      u.totpEnabled = true;
      u.totpSecret = pending.secret;
      u.backupCodes = hashedBackup;
      if (store.pending2fa) delete store.pending2fa[req.user.id];
    });

    res.json({
      data: {
        enabled: true,
        backupCodes: plainBackup, // show once
        message: "2FA enabled. Store backup codes securely; they will not be shown again.",
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/disable — requires current TOTP code
router.post("/2fa/disable", requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return next(createError(400, "VALIDATION_ERROR", "code is required"));
    }

    const db = read();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user || !user.totpEnabled) {
      return next(createError(400, "2FA_NOT_ENABLED", "2FA is not enabled"));
    }

    if (!verifyTotp(user.totpSecret, code)) {
      return next(createError(401, "INVALID_CODE", "Invalid authentication code"));
    }

    withDb((store) => {
      const u = store.users.find((x) => x.id === req.user.id);
      if (u) {
        u.totpEnabled = false;
        u.totpSecret = null;
        u.backupCodes = [];
      }
    });

    res.json({ data: { enabled: false, message: "2FA disabled" } });
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
      backupCodesRemaining: (user.backupCodes || []).length,
    },
  });
});

module.exports = router;
