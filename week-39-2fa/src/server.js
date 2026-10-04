/**
 * Shield — Week 39 Two-Factor Authentication (TOTP)
 * Google Authenticator compatible setup, login challenge, backup codes.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRouter = require("./routes/auth");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Shield 2FA (TOTP)",
    version: "1.0.0",
    phase: "Week 39 · Phase 4",
    flow: [
      "POST /api/auth/login → if 2FA on, get pre2faToken",
      "POST /api/auth/2fa/verify-login { code } with Bearer pre2faToken",
      "Setup: POST /api/auth/2fa/setup → scan QR → POST /api/auth/2fa/confirm { code }",
    ],
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    users: db.users.length,
    with2fa: db.users.filter((u) => u.totpEnabled).length,
  });
});

app.use("/api/auth", authRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Shield 2FA at http://localhost:${PORT}`);
  console.log("  POST /api/auth/2fa/setup · /confirm · /verify-login");
});
