/**
 * Access + refresh token helpers with rotation support.
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";

const ACCESS_TTL = process.env.ACCESS_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TTL || "7d";

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || "user",
      type: "access",
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user, jti) {
  return jwt.sign(
    {
      sub: user.id,
      type: "refresh",
      jti,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, ACCESS_SECRET);
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, REFRESH_SECRET);
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload;
}

function newJti() {
  return crypto.randomUUID();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    createdAt: user.createdAt,
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  newJti,
  hashToken,
  publicUser,
  ACCESS_TTL,
  REFRESH_TTL,
};
