# Hookdesk — Week 26 Webhook Receiver & Logger

Accept incoming webhooks (GitHub, Stripe, generic), optionally validate signatures, and log payloads.

## Purpose

Week 26 of the Freelancer 100-week development program.  
Roadmap requirement: **Webhook Receiver & Logger — accept webhooks, validate them, and log the payload.**

## Features

- `POST /webhooks/github` — GitHub-style `X-Hub-Signature-256` (HMAC SHA-256)
- `POST /webhooks/stripe` — Stripe-style `Stripe-Signature` (`t` + `v1`, timestamp tolerance)
- `POST /webhooks/generic` — optional shared secret header `X-Webhook-Secret`
- Raw body capture for correct HMAC verification
- Persistent log (JSON file), list/filter/clear
- **Demo mode**: if secrets are not set, signature checks are skipped so you can test immediately

## Setup

```bash
cd week-26-webhook-logger
npm install
npm start
```

Optional secrets:

```bash
export GITHUB_WEBHOOK_SECRET=your_github_secret
export STRIPE_WEBHOOK_SECRET=whsec_...
export WEBHOOK_SECRET=shared_secret
npm start
```

## Try it (demo mode)

```bash
# Send a generic webhook
curl -X POST http://localhost:3000/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{"action":"order.created","orderId":"ORD-1001","amount":49.99}'

# Simulate GitHub push event
curl -X POST http://localhost:3000/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","repository":{"name":"demo"}}'

# View logs
curl http://localhost:3000/api/webhooks/logs
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/github` | Receive GitHub webhook |
| POST | `/webhooks/stripe` | Receive Stripe webhook |
| POST | `/webhooks/generic` | Receive generic webhook |
| GET | `/api/webhooks/logs` | List logs (`?provider=&event=&limit=`) |
| GET | `/api/webhooks/logs/:id` | One log entry |
| DELETE | `/api/webhooks/logs` | Clear all logs |

## Project structure

```
week-26-webhook-logger/
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/errorHandler.js
    ├── routes/webhooks.js
    └── utils/signatures.js
```

## Concepts

- Webhook endpoints vs normal APIs
- HMAC signature verification
- Raw body vs parsed JSON
- Replay protection (Stripe timestamp)
- Structured event logging

---

**Freelancer Development Program · Phase 3 · Week 26**
