/**
 * Vault — Week 31 JWT Authentication
 * Signup/login, access + refresh tokens, rotation, protected routes.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRouter = require("./routes/auth");
const protectedRouter = require("./routes/protected");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Vault JWT Auth API",
    version: "1.0.0",
    phase: "Week 31 · Phase 4",
    endpoints: {
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      refresh: "POST /api/auth/refresh",
      logout: "POST /api/auth/logout",
      me: "GET /api/auth/me",
      profile: "GET /api/protected/profile",
    },
    note: "Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production.",
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    users: db.users.length,
    activeRefreshTokens: db.refreshTokens.filter((t) => !t.revoked).length,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/protected", protectedRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Vault JWT Auth at http://localhost:${PORT}`);
  console.log(`  POST /api/auth/signup | /login | /refresh | /logout`);
  console.log(`  GET  /api/auth/me  (Bearer access token)`);
});
