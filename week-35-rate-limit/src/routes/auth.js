const express = require("express");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Strict limiter for login — brute-force protection
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts. Try again in 15 minutes.",
  code: "LOGIN_RATE_LIMITED",
});

// Simulated user store
const USERS = [
  { email: "demo@example.com", password: "password123" },
];

router.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "email and password required" },
    });
  }

  const user = USERS.find(
    (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
  );
  if (!user || user.password !== password) {
    return res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
  }

  res.json({
    data: {
      message: "Login successful",
      email: user.email,
      // Demo only — real apps use JWT (Week 31)
      token: "demo-session-token",
    },
  });
});

module.exports = router;
