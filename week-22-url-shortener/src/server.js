/**
 * Clip — Week 22 URL Shortener Service
 * Create short codes, redirect, track clicks.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const linksRouter = require("./routes/links");
const { read, withDb } = require("./data/store");
const { notFound, errorHandler, createError } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(morgan("dev"));

// Root
app.get("/", (req, res) => {
  res.json({
    name: "Clip URL Shortener",
    version: "1.0.0",
    phase: "Week 22 · Phase 3",
    endpoints: {
      health: "/api/health",
      links: "/api/links",
      redirect: "/r/:code",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    links: db.links.length,
    totalClicks: db.links.reduce((sum, l) => sum + (l.clicks || 0), 0),
  });
});

// API
app.use("/api/links", linksRouter);

// Redirect: /r/:code
app.get("/r/:code", (req, res, next) => {
  const code = req.params.code;
  try {
    const url = withDb((db) => {
      const link = db.links.find((l) => l.code === code);
      if (!link) return null;
      link.clicks = (link.clicks || 0) + 1;
      link.lastClickedAt = new Date().toISOString();
      return link.url;
    });

    if (!url) {
      return next(createError(404, "LINK_NOT_FOUND", "Short link not found"));
    }

    // 302 temporary redirect (common for shorteners that track clicks)
    res.redirect(302, url);
  } catch (err) {
    next(err);
  }
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Clip URL Shortener at http://localhost:${PORT}`);
  console.log(`  POST /api/links  → create`);
  console.log(`  GET  /r/:code    → redirect`);
});
