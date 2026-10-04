# Shield — Week 39 Two-Factor Authentication (TOTP)

TOTP 2FA compatible with **Google Authenticator**, Authy, 1Password, etc.

## Purpose

Week 39 of the Freelancer 100-week development program.  
Roadmap requirement: **2FA — TOTP using an app like Google Authenticator.**

## Features

- Enable 2FA: secret + **QR code** (`otpauth://`)
- Confirm with first valid code before activation
- Login challenge when 2FA is on (`pre2faToken` → verify code)
- **Backup codes** (hashed at rest, shown once)
- Disable 2FA with a valid TOTP code
- Clock skew window ±1 step (30s)

## Setup

```bash
cd week-39-2fa
npm install
npm run seed
npm start
```

## Flow

### 1. Login without 2FA
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
```

### 2. Enable 2FA
```bash
# Use accessToken from login
curl -X POST http://localhost:3000/api/auth/2fa/setup \
  -H "Authorization: Bearer <accessToken>"

# Response includes qrCodeDataUrl + secret
# Scan QR in Google Authenticator, then:

curl -X POST http://localhost:3000/api/auth/2fa/confirm \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

### 3. Login with 2FA
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
# → requires2fa + pre2faToken

curl -X POST http://localhost:3000/api/auth/2fa/verify-login \
  -H "Authorization: Bearer <pre2faToken>" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/signup` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/2fa/verify-login` | pre2fa Bearer |
| POST | `/api/auth/2fa/setup` | access Bearer |
| POST | `/api/auth/2fa/confirm` | access Bearer |
| POST | `/api/auth/2fa/disable` | access Bearer |
| GET | `/api/auth/me` | access Bearer |

## Project structure

```
week-39-2fa/
├── package.json
└── src/
    ├── server.js
    ├── utils/totp.js
    ├── middleware/auth.js
    └── routes/auth.js
```

## GitHub

https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-39-2fa

## Concepts

- TOTP (RFC 6238) shared secret
- Enrollment vs verification
- Pre-auth token after password
- One-time backup codes

---

**Freelancer Development Program · Phase 4 · Week 39**
