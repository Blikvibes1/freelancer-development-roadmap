const { verifyToken } = require("../utils/tokens");
const { createError } = require("./errorHandler");

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(createError(401, "UNAUTHORIZED", "Bearer access token required"));
  }
  try {
    const payload = verifyToken(token);
    if (payload.type !== "access") {
      return next(createError(401, "UNAUTHORIZED", "Full access token required"));
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
}

function requirePre2fa(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(createError(401, "UNAUTHORIZED", "Pre-2FA token required"));
  }
  try {
    const payload = verifyToken(token);
    if (payload.type !== "pre2fa") {
      return next(createError(401, "UNAUTHORIZED", "Expected pre-2FA token"));
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requirePre2fa };
