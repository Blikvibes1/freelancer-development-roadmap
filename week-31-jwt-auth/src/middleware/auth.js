const { verifyAccessToken } = require("../utils/tokens");
const { createError } = require("./errorHandler");

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      createError(401, "UNAUTHORIZED", "Bearer access token required")
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "UNAUTHORIZED", "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
