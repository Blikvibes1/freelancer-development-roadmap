/**
 * Presence — Week 38 Session Management
 * Track active sessions; revoke one device or log out everywhere.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRouter = require("./routes/auth");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Presence Session Management",
    version: "1.0.0",
    phase: "Week 38 · Phase 4",
    endpoints: {
      login: "POST /api/auth/login",
      sessions: "GET /api/auth/sessions",
      revokeOne: "DELETE /api/auth/sessions/:id",
      revokeOthers: "POST /api/auth/sessions/revoke-others",
      revokeAll: "POST /api/auth/sessions/revoke-all",
      logout: "POST /api/auth/logout",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    users: db.users.length,
    sessions: db.sessions.length,
    activeSessions: db.sessions.filter((s) => !s.revokedAt).length,
  });
});

app.use("/api/auth", authRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Presence at http://localhost:${PORT}`);
  console.log("  Login creates a session; JWT carries sid");
  console.log("  GET /api/auth/sessions · POST .../revoke-all");
});
