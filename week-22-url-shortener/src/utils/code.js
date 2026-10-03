/**
 * Short code generator — URL-safe, collision-resistant enough for demos.
 */

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 7) {
  let out = "";
  const bytes = require("crypto").randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function isValidUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidCustomCode(code) {
  return typeof code === "string" && /^[a-zA-Z0-9_-]{3,32}$/.test(code);
}

module.exports = { generateCode, isValidUrl, isValidCustomCode };
