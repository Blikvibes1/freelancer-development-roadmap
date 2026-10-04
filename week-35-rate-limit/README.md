# Throttle — Week 35 Rate Limiting Middleware

Protect APIs from brute-force and abuse by limiting requests **per IP**.

## Purpose

Week 35 of the Freelancer 100-week development program.  
Roadmap requirement: **Rate Limiting Middleware — limit requests per IP to stop brute-force attacks.**

## Features

- Custom in-memory **sliding-window** limiter (no extra deps)
- Per-IP keys (`X-Forwarded-For` / `req.ip`)
- Different limits:
  - Global: 30 / minute
  - Heavy route: 10 / minute
  - Login: **5 / 15 minutes** (brute-force shield)
- Standard headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`
- `429` JSON error envelope
- Stats endpoint for demos
- Production note: swap Map for Redis

## Setup

```bash
cd week-35-rate-limit
npm install
npm start
```

## Try it

```bash
# Hit heavy endpoint until 429
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/heavy
done

# Brute-force login simulation
for i in $(seq 1 6); do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"wrong"}' | head -c 120
  echo
done
```

Valid demo login: `demo@example.com` / `password123`

## API

| Method | Path | Limit |
|--------|------|--------|
| GET | `/api/public` | 30/min (global) |
| GET | `/api/heavy` | 10/min |
| POST | `/api/auth/login` | 5 / 15 min |
| GET | `/api/admin/rate-limit-stats` | inspect counters |

## Project structure

```
week-35-rate-limit/
├── package.json
├── README.md
└── src/
    ├── server.js
    ├── middleware/rateLimit.js   ← core limiter
    └── routes/
        ├── api.js
        └── auth.js
```

## GitHub

https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-35-rate-limit

## Concepts

- Sliding window vs fixed window
- IP keying behind proxies (`trust proxy`)
- Stricter limits on auth endpoints
- `429` + `Retry-After` client contract

---

**Freelancer Development Program · Phase 4 · Week 35**
