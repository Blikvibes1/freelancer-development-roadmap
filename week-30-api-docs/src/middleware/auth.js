/**
 * Demo API-key auth for documentation examples.
 * Header: X-API-Key: demo-key-atlas
 * Set REQUIRE_AUTH=true to enforce; default is optional (docs still show it).
 */

const { createError } = require("./errorHandler");

const VALID_KEYS = new Set(
  (process.env.API_KEYS || "demo-key-atlas").split(",").map((k) => k.trim())
);

function apiKeyAuth(req, res, next) {
  const requireAuth = process.env.REQUIRE_AUTH === "true";
  const key = req.get("X-API-Key") || req.get("x-api-key");

  if (!requireAuth) {
    req.apiKey = key || null;
    return next();
  }

  if (!key || !VALID_KEYS.has(key)) {
    return next(
      createError(401, "UNAUTHORIZED", "Valid X-API-Key header is required")
    );
  }

  req.apiKey = key;
  next();
}

module.exports = { apiKeyAuth, VALID_KEYS };
