const { verifyUserToken } = require("../utils/tokens");

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme === "Bearer" && token) {
    try {
      const payload = verifyUserToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
      return next();
    } catch {
      return res.status(401).json({
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      });
    }
  }

  // Fallback: session from Passport
  if (req.isAuthenticated && req.isAuthenticated()) {
    req.user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
    return next();
  }

  return res.status(401).json({
    error: { code: "UNAUTHORIZED", message: "Login required" },
  });
}

module.exports = { requireAuth };
