const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-rbac-secret-change-me";
const TTL = process.env.JWT_TTL || "8h";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    SECRET,
    { expiresIn: TTL }
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
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = { signToken, verifyToken, publicUser };
