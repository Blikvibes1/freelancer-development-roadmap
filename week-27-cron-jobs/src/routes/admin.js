const express = require("express");
const { read } = require("../data/store");
const { cleanupExpired } = require("../jobs/cleanupExpired");
const { dailyDigest } = require("../jobs/dailyDigest");

const router = express.Router();

// GET /api/sessions
router.get("/sessions", (req, res) => {
  const db = read();
  const now = Date.now();
  const sessions = db.sessions.map((s) => ({
    ...s,
    expired: new Date(s.expiresAt).getTime() <= now,
  }));
  res.json({
    data: sessions,
    count: sessions.length,
    expiredCount: sessions.filter((s) => s.expired).length,
  });
});

// GET /api/jobs
router.get("/jobs", (req, res) => {
  const db = read();
  res.json({ data: db.jobRuns || [], count: (db.jobRuns || []).length });
});

// POST /api/jobs/cleanup — trigger manually
router.post("/jobs/cleanup", (req, res) => {
  const result = cleanupExpired();
  res.json({ data: result });
});

// POST /api/jobs/digest — trigger manually
router.post("/jobs/digest", (req, res) => {
  const result = dailyDigest();
  res.json({ data: result });
});

module.exports = router;
