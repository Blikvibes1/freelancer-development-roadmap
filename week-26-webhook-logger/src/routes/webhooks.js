const express = require("express");
const { randomUUID } = require("crypto");
const { withDb, read } = require("../data/store");
const {
  verifyGitHub,
  verifyStripe,
  verifySharedSecret,
} = require("../utils/signatures");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

function getRawBody(req) {
  // Prefer raw buffer from verify middleware
  if (req.rawBody) return req.rawBody.toString("utf8");
  return JSON.stringify(req.body || {});
}

function logWebhook(entry) {
  return withDb((db) => {
    db.webhooks.unshift(entry);
    // Cap log size
    if (db.webhooks.length > 500) {
      db.webhooks = db.webhooks.slice(0, 500);
    }
    return entry;
  });
}

function buildEntry(req, provider, verification) {
  const raw = getRawBody(req);
  let payload = req.body;
  try {
    if (typeof payload === "string") payload = JSON.parse(payload);
  } catch (_) {}

  return {
    id: randomUUID(),
    provider,
    event:
      req.get("X-GitHub-Event") ||
      (payload && payload.type) ||
      (payload && payload.action) ||
      "unknown",
    verification: verification.mode || (verification.ok ? "verified" : "failed"),
    headers: {
      "content-type": req.get("content-type"),
      "user-agent": req.get("user-agent"),
      "x-github-event": req.get("X-GitHub-Event") || null,
      "x-github-delivery": req.get("X-GitHub-Delivery") || null,
      "stripe-signature": req.get("Stripe-Signature") ? "[present]" : null,
    },
    payload,
    rawPreview: raw.slice(0, 2000),
    receivedAt: new Date().toISOString(),
    ip: req.ip,
  };
}

// POST /webhooks/github
router.post("/github", (req, res, next) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  const raw = getRawBody(req);
  const verification = verifyGitHub(raw, req.get("X-Hub-Signature-256"), secret);

  if (!verification.ok) {
    return next(createError(401, "INVALID_SIGNATURE", verification.reason));
  }

  const entry = logWebhook(buildEntry(req, "github", verification));
  console.log(`[webhook:github] ${entry.event} id=${entry.id}`);
  res.status(200).json({ received: true, id: entry.id, verification: entry.verification });
});

// POST /webhooks/stripe
router.post("/stripe", (req, res, next) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const raw = getRawBody(req);
  const verification = verifyStripe(raw, req.get("Stripe-Signature"), secret);

  if (!verification.ok) {
    return next(createError(401, "INVALID_SIGNATURE", verification.reason));
  }

  const entry = logWebhook(buildEntry(req, "stripe", verification));
  console.log(`[webhook:stripe] ${entry.event} id=${entry.id}`);
  res.status(200).json({ received: true, id: entry.id, verification: entry.verification });
});

// POST /webhooks/generic — shared secret or open (demo)
router.post("/generic", (req, res, next) => {
  const secret = process.env.WEBHOOK_SECRET || "";
  const verification = verifySharedSecret(req.get("X-Webhook-Secret"), secret);

  if (!verification.ok) {
    return next(createError(401, "INVALID_SIGNATURE", verification.reason));
  }

  const entry = logWebhook(buildEntry(req, "generic", verification));
  console.log(`[webhook:generic] ${entry.event} id=${entry.id}`);
  res.status(200).json({ received: true, id: entry.id, verification: entry.verification });
});

// GET /api/webhooks — list logs
router.get("/logs", (req, res) => {
  const db = read();
  let list = [...db.webhooks];

  if (req.query.provider) {
    list = list.filter((w) => w.provider === req.query.provider);
  }
  if (req.query.event) {
    list = list.filter((w) => String(w.event).includes(String(req.query.event)));
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  list = list.slice(0, limit);

  res.json({ data: list, count: list.length });
});

// GET /api/webhooks/:id
router.get("/logs/:id", (req, res, next) => {
  const db = read();
  const entry = db.webhooks.find((w) => w.id === req.params.id);
  if (!entry) return next(createError(404, "NOT_FOUND", "Webhook log not found"));
  res.json({ data: entry });
});

// DELETE /api/webhooks/logs — clear all
router.delete("/logs", (req, res) => {
  withDb((db) => {
    db.webhooks = [];
  });
  res.status(204).send();
});

module.exports = router;
