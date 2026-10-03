# Vault — Week 31 JWT Authentication

Secure signup/login with **access tokens**, **refresh tokens**, and **refresh rotation**.

## Purpose

Week 31 of the Freelancer 100-week development program.  
Roadmap requirement: **JWT Authentication — login/signup with access and refresh token rotation.**

This begins **Phase 4: Authentication & Security**.

## Features

- `POST /api/auth/signup` — register (bcrypt password hash)
- `POST /api/auth/login` — issue token pair
- `POST /api/auth/refresh` — rotate refresh token (reuse detection)
- `POST /api/auth/logout` — revoke refresh token
- `GET /api/auth/me` — current user (Bearer access token)
- Protected routes + role check demo (`admin`)
- Access token short-lived (default 15m)
- Refresh token longer-lived (default 7d), stored hashed

## Setup

```bash
cd week-31-jwt-auth
npm install
npm run seed
npm start
```

Production secrets:

```bash
export JWT_ACCESS_SECRET="long-random-string"
export JWT_REFRESH_SECRET="another-long-random-string"
npm start
```

## Try it

```bash
# Login as seeded user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'

# Use access token
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

Seeded accounts (after `npm run seed`):

| Email | Password | Role |
|-------|----------|------|
| demo@example.com | password123 | user |
| admin@example.com | password123 | admin |

## Token flow

1. Login/signup → `{ accessToken, refreshToken }`
2. Call APIs with `Authorization: Bearer <accessToken>`
3. When access expires → `POST /refresh` with refresh token
4. Server **revokes** old refresh, issues new pair
5. Logout → revoke refresh token

## Project structure

```
week-31-jwt-auth/
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── routes/
    │   ├── auth.js
    │   └── protected.js
    └── utils/
        ├── tokens.js
        └── seed.js
```

## Concepts

- Access vs refresh tokens
- bcrypt password hashing
- Bearer auth middleware
- Refresh rotation & reuse detection
- Role-based gate (simple)

---

**Freelancer Development Program · Phase 4 · Week 31**
