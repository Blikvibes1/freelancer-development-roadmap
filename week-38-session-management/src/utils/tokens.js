const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "dev-session-secret-change-me";
const TTL = process.env.JWT_TTL || "7d";

function newSessionId() {
  return crypto.randomUUID();
}

function signAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      sid: sessionId,
      type: "access",
    },
    SECRET,
    { expiresIn: TTL }
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, SECRET);
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function publicSession(session, currentSessionId) {
  return {
    id: session.id,
    userAgent: session.userAgent,
    ip: session.ip,
    device: session.device,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    current: session.id === currentSessionId,
    revoked: Boolean(session.revokedAt),
  };
}

module.exports = {
  newSessionId,
  signAccessToken,
  verifyAccessToken,
  publicUser,
  publicSession,
};
