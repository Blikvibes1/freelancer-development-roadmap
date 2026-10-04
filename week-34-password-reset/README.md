# Keyring — Week 34 Password Reset Flow

Full reset flow: **request → secure token → email link → update password**.

## Purpose

Week 34 of the Freelancer 100-week development program.  
Roadmap requirement: **Password Reset Flow — request reset → secure token → email link → update password.**

## Flow

1. `POST /api/auth/forgot-password` `{ "email": "demo@example.com" }`
2. Server creates a **random token**, stores only **SHA-256 hash**, sets expiry (1 hour)
3. Simulated email writes link to `logs/mail.log` (and console)
4. User opens `/reset-password.html?token=...` (or your frontend)
5. `GET /api/auth/reset-password/validate?token=`
6. `POST /api/auth/reset-password` `{ "token", "password" }`
7. Token marked used; user logs in with new password

## Security choices

- Generic response on forgot-password (no email enumeration)
- Raw token only in email / dev response — DB stores hash
- Single-use tokens + invalidate older tokens for same user
- Expiry window (`RESET_TTL_MS`, default 1 hour)
- Passwords hashed with bcrypt

## Setup

```bash
cd week-34-password-reset
npm install
npm run seed
EXPOSE_RESET_TOKEN=true npm start
```

`EXPOSE_RESET_TOKEN=true` returns the token in the API response for local testing (never in production).

## Try it

```bash
# 1. Request reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com"}'

# 2. Copy token from response (dev) or logs/mail.log

# 3. Reset
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<TOKEN>","password":"newpassword1"}'

# 4. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"newpassword1"}'
```

UI: http://localhost:3000/reset-password.html?token=...

Seeded user: `demo@example.com` / `oldpassword`

## API

| Method | Path | Body / query |
|--------|------|----------------|
| POST | `/api/auth/signup` | name, email, password |
| POST | `/api/auth/login` | email, password |
| POST | `/api/auth/forgot-password` | email |
| GET | `/api/auth/reset-password/validate` | `?token=` |
| POST | `/api/auth/reset-password` | token, password |

## Project structure

```
week-34-password-reset/
├── package.json
├── public/reset-password.html
├── logs/mail.log          ← simulated inbox
└── src/
    ├── server.js
    ├── routes/auth.js
    ├── utils/tokens.js
    ├── utils/mailer.js
    └── data/store.js
```

## Production

Replace `mailer.js` with Nodemailer, Resend, or SES. Never set `EXPOSE_RESET_TOKEN` in production.

---

**GitHub:** https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-34-password-reset  

**Freelancer Development Program · Phase 4 · Week 34**
