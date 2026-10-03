/**
 * Hookdesk — Week 26 Webhook Receiver & Logger
 * Accept webhooks, validate signatures, persist payload logs.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const webhooksRouter = require("./routes/webhooks");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Capture raw body for HMAC verification (Stripe/GitHub)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Hookdesk Webhook Logger",
    version: "1.0.0",
    phase: "Week 26 · Phase 3",
    endpoints: {
      github: "POST /webhooks/github",
      stripe: "POST /webhooks/stripe",
      generic: "POST /webhooks/generic",
      logs: "GET /api/webhooks/logs",
    },
    secrets: {
      GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET ? "set" : "not set (demo mode)",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "set" : "not set (demo mode)",
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ? "set" : "not set (demo mode)",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    logged: db.webhooks.length,
  });
});

// Receive endpoints
app.use("/webhooks", webhooksRouter);
// Logs under /api/webhooks/*
app.use("/api/webhooks", webhooksRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Hookdesk at http://localhost:${PORT}`);
  console.log(`  POST /webhooks/generic  (demo — no secret required unless WEBHOOK_SECRET set)`);
  console.log(`  GET  /api/webhooks/logs`);
});
