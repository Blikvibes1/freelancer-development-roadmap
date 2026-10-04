const crypto = require("crypto");

const RESET_TTL_MS = Number(process.env.RESET_TTL_MS) || 60 * 60 * 1000; // 1 hour

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function expiresAt(from = Date.now()) {
  return new Date(from + RESET_TTL_MS).toISOString();
}

function isExpired(isoDate) {
  return new Date(isoDate).getTime() <= Date.now();
}

module.exports = {
  generateResetToken,
  hashToken,
  expiresAt,
  isExpired,
  RESET_TTL_MS,
};
