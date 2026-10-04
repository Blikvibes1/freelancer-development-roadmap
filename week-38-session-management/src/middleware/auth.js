const { verifyAccessToken } = require("../utils/tokens");
const { read, withDb } = require("../data/store");
const { createError } = require("./errorHandler");

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(createError(401, "UNAUTHORIZED", "Bearer token required"));
  }

  try {
    const payload = verifyAccessToken(token);
    const db = read();
    const session = db.sessions.find((s) => s.id === payload.sid);

    if (!session || session.userId !== payload.sub || session.revokedAt) {
      return next(
        createError(401, "SESSION_REVOKED", "Session is invalid or has been revoked")
      );
    }

    // Touch lastSeen
    withDb((store) => {
      const s = store.sessions.find((x) => x.id === session.id);
      if (s && !s.revokedAt) s.lastSeenAt = new Date().toISOString();
    });

    req.user = { id: payload.sub, email: payload.email };
    req.sessionId = payload.sid;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
