# Clockwork — Week 27 Cron Job / Scheduled Task

Background jobs that clean up expired records and write a simulated daily digest.

## Purpose

Week 27 of the Freelancer 100-week development program.  
Roadmap requirement: **Cron Job / Scheduled Task — run daily to clean up expired records or send scheduled emails.**

## Features

- **cleanupExpired** — deletes sessions past `expiresAt`
- **dailyDigest** — simulated email summary → `logs/digest.log`
- Cron via `node-cron` (configurable expressions)
- Run jobs **once** from CLI or HTTP
- Job run history in the data store
- Seed data with mix of expired + active sessions

## Setup

```bash
cd week-27-cron-jobs
npm install
npm run seed
npm start
```

## Schedules (default)

| Job | Cron | Notes |
|-----|------|--------|
| Cleanup | `* * * * *` | Every minute (demo). Prod example: `0 3 * * *` |
| Digest | `0 9 * * *` | Daily at 09:00 |

Override:

```bash
CRON_CLEANUP="0 3 * * *" CRON_DIGEST="0 8 * * *" npm start
```

## Manual runs

```bash
# CLI
npm run job:cleanup
npm run job:digest

# HTTP
curl -X POST http://localhost:3000/api/jobs/cleanup
curl -X POST http://localhost:3000/api/jobs/digest
curl http://localhost:3000/api/sessions
curl http://localhost:3000/api/jobs
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Counts |
| GET | `/api/sessions` | Sessions + expired flag |
| GET | `/api/jobs` | Job run history |
| POST | `/api/jobs/cleanup` | Run cleanup now |
| POST | `/api/jobs/digest` | Run digest now |

## Project structure

```
week-27-cron-jobs/
├── package.json
├── logs/
├── data/db.json
└── src/
    ├── server.js
    ├── jobs/
    │   ├── scheduler.js
    │   ├── cleanupExpired.js
    │   ├── dailyDigest.js
    │   └── runOnce.js
    ├── routes/admin.js
    └── utils/
```

## Concepts

- Cron expressions
- Idempotent cleanup jobs
- Separating schedule from job logic
- CLI + HTTP triggers for the same job
- Logging side effects (digest file)

---

**Freelancer Development Program · Phase 3 · Week 27**
