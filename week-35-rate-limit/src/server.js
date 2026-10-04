/**
 * Throttle — Week 35 Rate Limiting Middleware
 * Per-IP limits, stricter auth limits, standard RateLimit headers.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { createRateLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const authRouter = require("./routes/auth");
const apiRouter = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy so req.ip / X-Forwarded-For work behind nginx
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Global API limiter: 30 req / minute / IP
const globalLimiter = createRateLimiter({
  windowMs: 60_000,
  max: Number(process.env.GLOBAL_MAX) || 30,
  message: "Global rate limit exceeded. Slow down.",
  code: "RATE_LIMITED",
});

// Tighter limiter for /api/heavy: 10 / minute
const heavyLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  message: "Heavy endpoint limit exceeded.",
  code: "HEAVY_RATE_LIMITED",
});

app.get("/", (req, res) => {
  res.json({
    name: "Throttle Rate Limit API",
    version: "1.0.0",
    phase: "Week 35 · Phase 4",
    limits: {
      global: "30 requests / minute / IP (default)",
      heavy: "10 requests / minute / IP",
      login: "5 attempts / 15 minutes / IP",
    },
    endpoints: {
      public: "GET /api/public",
      heavy: "GET /api/heavy",
      login: "POST /api/auth/login",
      stats: "GET /api/admin/rate-limit-stats",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api", globalLimiter);
app.use("/api/heavy", heavyLimiter);
app.use("/api", apiRouter);
app.use("/api/auth", authRouter);

// Dev/admin: inspect in-memory counters
app.get("/api/admin/rate-limit-stats", (req, res) => {
  res.json({
    data: {
      global: globalLimiter.getStats(),
      heavy: heavyLimiter.getStats(),
    },
  });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Throttle at http://localhost:${PORT}`);
  console.log("  GET  /api/public   (30/min global)");
  console.log("  GET  /api/heavy    (10/min)");
  console.log("  POST /api/auth/login (5 / 15min)");
});
