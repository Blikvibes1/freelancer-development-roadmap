const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-2fa-secret-change-me";
const TTL = process.env.JWT_TTL || "8h";
const PRE_TTL = process.env.JWT_PRE_TTL || "5m";

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: "access",
      tfa: Boolean(user.totpEnabled),
    },
    SECRET,
    { expiresIn: TTL }
  );
}

/** Short-lived token after password OK but before TOTP */
function signPre2faToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: "pre2fa",
    },
    SECRET,
    { expiresIn: PRE_TTL }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    totpEnabled: Boolean(user.totpEnabled),
    createdAt: user.createdAt,
  };
}

module.exports = {
  signAccessToken,
  signPre2faToken,
  verifyToken,
  publicUser,
};
