# Scrub — Week 36 Input Sanitization

Middleware that hardens request input against **XSS** and **SQL injection**-style payloads.

## Purpose

Week 36 of the Freelancer 100-week development program.  
Roadmap requirement: **Input Sanitization — prevent SQL injection and XSS.**

## What it does

| Threat | Approach |
|--------|----------|
| **XSS** | Escape HTML entities (`<`, `>`, `"`, `'`, …) before storage/reflection |
| **SQLi** | Detect common patterns and **reject** (`400 UNSAFE_INPUT`) |
| **Misc** | Strip null bytes & control characters; max length |

> Real SQL safety = **parameterized queries / ORM bind parameters**.  
> Pattern filters are defense-in-depth, not a substitute.

## Setup

```bash
cd week-36-input-sanitization
npm install
npm run seed
npm start
```

## Try attacks

```bash
# XSS payload — accepted but escaped
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"author":"attacker","body":"<script>alert(1)</script>"}'

# SQLi-like payload — rejected
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d "{\"author\":\"x\",\"body\":\"1' OR '1'='1\"}"

# Inspect any string
curl -X POST http://localhost:3000/api/demo/inspect \
  -H "Content-Type: application/json" \
  -d '{"value":"<img src=x onerror=alert(1)>"}'

# Strict mode rejects XSS too
curl -X POST http://localhost:3000/api/demo/strict \
  -H "Content-Type: application/json" \
  -d '{"value":"<script>x</script>"}'
```

## API

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/comments` | List / search (`?q=`) |
| POST | `/api/comments` | Create (sanitized) |
| POST | `/api/demo/inspect` | Dry-run analysis |
| POST | `/api/demo/strict` | Reject XSS + SQLi |

## Project structure

```
week-36-input-sanitization/
├── package.json
├── README.md
└── src/
    ├── server.js
    ├── middleware/sanitize.js   ← core
    ├── routes/comments.js
    └── routes/demo.js
```

## GitHub

https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-36-input-sanitization

## Concepts

- Escape for the right output context
- Validate + sanitize + parameterized queries
- Reject vs neutralize trade-offs
- Never trust `req.body` / `req.query`

---

**Freelancer Development Program · Phase 4 · Week 36**
