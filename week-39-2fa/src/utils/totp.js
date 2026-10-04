/**
 * TOTP helpers using otplib (RFC 6238).
 */

const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const crypto = require("crypto");

authenticator.options = {
  window: 1, // allow ±1 step clock skew
  step: 30,
};

const APP_NAME = process.env.TOTP_ISSUER || "Shield2FA";

function generateSecret() {
  return authenticator.generateSecret();
}

function keyuri(email, secret) {
  return authenticator.keyuri(email, APP_NAME, secret);
}

async function qrDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}

function verifyToken(secret, token) {
  if (!secret || !token) return false;
  const code = String(token).replace(/\s/g, "");
  return authenticator.verify({ token: code, secret });
}

function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex"));
  }
  return codes;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code).toLowerCase()).digest("hex");
}

module.exports = {
  generateSecret,
  keyuri,
  qrDataUrl,
  verifyToken,
  generateBackupCodes,
  hashCode,
  APP_NAME,
};
