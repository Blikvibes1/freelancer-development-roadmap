/**
 * Clockwork — Week 27 Cron / Scheduled Tasks
 * Background cleanup + daily digest, with manual triggers.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const adminRouter = require("./routes/admin");
const { read } = require("./data/store");
const { startScheduler } = require("./jobs/scheduler");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Clockwork Cron Jobs",
    version: "1.0.0",
    phase: "Week 27 · Phase 3",
    schedules: {
      cleanup: process.env.CRON_CLEANUP || "* * * * * (every minute — demo)",
      digest: process.env.CRON_DIGEST || "0 9 * * * (daily 09:00)",
    },
    endpoints: {
      sessions: "GET /api/sessions",
      jobHistory: "GET /api/jobs",
      runCleanup: "POST /api/jobs/cleanup",
      runDigest: "POST /api/jobs/digest",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  const now = Date.now();
  const expired = db.sessions.filter((s) => new Date(s.expiresAt).getTime() <= now).length;
  res.json({
    status: "ok",
    uptime: process.uptime(),
    sessions: db.sessions.length,
    expired,
    jobRuns: (db.jobRuns || []).length,
  });
});

app.use("/api", adminRouter);
app.use(notFound);
app.use(errorHandler);

// Start HTTP + cron
app.listen(PORT, () => {
  console.log(`Clockwork at http://localhost:${PORT}`);
  startScheduler();
});
