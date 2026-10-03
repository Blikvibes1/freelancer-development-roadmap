const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-oauth-jwt-secret-change-me";
const TTL = process.env.JWT_TTL || "7d";

function signUserToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    },
    SECRET,
    { expiresIn: TTL }
  );
}

function verifyUserToken(token) {
  return jwt.verify(token, SECRET);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    providers: (user.providers || []).map((p) => p.provider),
    role: user.role || "user",
    createdAt: user.createdAt,
  };
}

module.exports = { signUserToken, verifyUserToken, publicUser };
