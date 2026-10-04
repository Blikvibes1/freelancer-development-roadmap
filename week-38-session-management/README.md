# Presence — Week 38 Session Management

Track **active user sessions** (devices) and support **log out of all devices**.

## Purpose

Week 38 of the Freelancer 100-week development program.  
Roadmap requirement: **Session Management — track active sessions; allow log out of all devices.**

## Features

- Each login creates a **server-side session** (`sid` embedded in JWT)
- List sessions with device label, IP, last seen, current flag
- Revoke **one** session (remote device)
- **Revoke others** (keep this device)
- **Revoke all** (including current)
- Access rejected if session is revoked (`SESSION_REVOKED`)
- Session touch on authenticated requests

## Setup

```bash
cd week-38-session-management
npm install
npm run seed
npm start
```

## Try multi-device flow

```bash
# Device A
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh) Chrome/120" \
  -d '{"email":"demo@example.com","password":"password123"}'

# Device B
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone) Mobile Safari" \
  -d '{"email":"demo@example.com","password":"password123"}'

# List (use token from A)
curl http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer <tokenA>"

# Log out everywhere
curl -X POST http://localhost:3000/api/auth/sessions/revoke-all \
  -H "Authorization: Bearer <tokenA>"
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register + session |
| POST | `/api/auth/login` | New session |
| POST | `/api/auth/logout` | Revoke current |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/sessions` | List sessions |
| DELETE | `/api/auth/sessions/:id` | Revoke one |
| POST | `/api/auth/sessions/revoke-others` | Keep current |
| POST | `/api/auth/sessions/revoke-all` | Kill all |

## Project structure

```
week-38-session-management/
├── package.json
└── src/
    ├── server.js
    ├── middleware/auth.js   ← JWT + session still active?
    ├── routes/auth.js
    └── utils/tokens.js
```

## GitHub

https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-38-session-management

## Concepts

- Session id in JWT vs pure stateless JWT
- Server-side revoke list / session store
- Multi-device security UX (“log out everywhere”)

---

**Freelancer Development Program · Phase 4 · Week 38**
