/**
 * Gateway — Week 32 OAuth Social Login
 * Google + GitHub via Passport, JWT after callback, demo login.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

const { configurePassport } = require("./config/passport");
const authRouter = require("./routes/auth");
const { read } = require("./data/store");

const app = express();
const PORT = process.env.PORT || 3000;

const strategies = configurePassport();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    users: db.users.length,
    oauth: strategies,
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    name: "Gateway OAuth Login",
    version: "1.0.0",
    phase: "Week 32 · Phase 4",
    oauth: strategies,
    routes: {
      google: "/auth/google",
      github: "/auth/github",
      me: "/auth/me",
      demo: "POST /auth/demo",
    },
  });
});

app.use("/auth", authRouter);

// Simple callback page when FRONTEND_URL points here
app.get("/auth/callback", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Gateway OAuth at http://localhost:${PORT}`);
  console.log(`  Google: ${strategies.googleEnabled ? "ON" : "OFF"}`);
  console.log(`  GitHub: ${strategies.githubEnabled ? "ON" : "OFF"}`);
  console.log(`  Demo:   POST /auth/demo`);
});
