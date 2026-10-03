const express = require("express");
const passport = require("passport");
const { signUserToken, publicUser } = require("../utils/tokens");
const { read } = require("../data/store");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function issueAndRedirect(req, res) {
  const token = signUserToken(req.user);
  // Frontend-friendly: redirect with token, or JSON if Accept: application/json
  const wantsJson =
    req.query.format === "json" ||
    (req.get("Accept") || "").includes("application/json");

  if (wantsJson) {
    return res.json({
      data: {
        user: publicUser(req.user),
        accessToken: token,
      },
    });
  }

  const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
  const url = new URL("/auth/callback", frontend);
  url.searchParams.set("token", token);
  res.redirect(url.toString());
}

// Google
router.get(
  "/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        error: {
          code: "OAUTH_NOT_CONFIGURED",
          message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        },
      });
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/?error=google_failed",
    session: true,
  }),
  issueAndRedirect
);

// GitHub
router.get(
  "/github",
  (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(503).json({
        error: {
          code: "OAUTH_NOT_CONFIGURED",
          message: "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
        },
      });
    }
    next();
  },
  passport.authenticate("github", {
    scope: ["user:email"],
    session: true,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/?error=github_failed",
    session: true,
  }),
  issueAndRedirect
);

// Current user
router.get("/me", requireAuth, (req, res) => {
  const db = read();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "User not found" },
    });
  }
  res.json({ data: publicUser(user) });
});

// Logout session
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.status(204).send();
  });
});

// Demo login (no real OAuth) — for local testing without provider apps
router.post("/demo", (req, res) => {
  if (process.env.ALLOW_DEMO_LOGIN === "false") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Demo login disabled" },
    });
  }

  const { provider = "demo" } = req.body || {};
  const { upsertOAuthUser } = require("../config/passport");
  const profile = {
    id: "demo-user-1",
    displayName: "Demo OAuth User",
    emails: [{ value: "demo.oauth@example.com" }],
    photos: [{ value: null }],
  };
  const user = upsertOAuthUser(profile, provider === "github" ? "github" : "google");
  const token = signUserToken(user);
  res.json({
    data: {
      user: publicUser(user),
      accessToken: token,
      note: "Demo login — configure real Google/GitHub OAuth for production.",
    },
  });
});

module.exports = router;
