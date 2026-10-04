/**
 * Keyring — Week 34 Password Reset Flow
 * forgot → secure token → (simulated) email → validate → update password
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRouter = require("./routes/auth");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.json({
    name: "Keyring Password Reset API",
    version: "1.0.0",
    phase: "Week 34 · Phase 4",
    flow: [
      "POST /api/auth/forgot-password { email }",
      "User opens link with ?token=",
      "GET  /api/auth/reset-password/validate?token=",
      "POST /api/auth/reset-password { token, password }",
      "POST /api/auth/login { email, password }",
    ],
    dev: {
      exposeToken: "EXPOSE_RESET_TOKEN=true",
      mailLog: "logs/mail.log",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    users: db.users.length,
    resetTokens: db.resetTokens.length,
  });
});

app.use("/api/auth", authRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Keyring at http://localhost:${PORT}`);
  console.log(`  POST /api/auth/forgot-password`);
  console.log(`  POST /api/auth/reset-password`);
  console.log(`  Set EXPOSE_RESET_TOKEN=true to see tokens in API responses (dev only)`);
});
