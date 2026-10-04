# Aegis — Week 40 Security Headers (Helmet)

Configure **Helmet** for strict transport security, CSP, X-Frame-Options, and related headers.

## Purpose

Week 40 of the Freelancer 100-week development program.  
Roadmap requirement: **Security Headers — Helmet (HSTS, CSP, X-Frame-Options).**

This completes **Phase 4: Authentication & Security**.

## Headers configured

| Header | Role |
|--------|------|
| `Content-Security-Policy` | Limit script/style/img/connect sources |
| `Strict-Transport-Security` | Force HTTPS (production only here) |
| `X-Frame-Options: DENY` | Block clickjacking |
| `X-Content-Type-Options: nosniff` | No MIME sniffing |
| `Referrer-Policy` | Limit referrer leakage |
| `Cross-Origin-Opener-Policy` | Window isolation |
| `Cross-Origin-Resource-Policy` | Who can load resources |
| Hide `X-Powered-By` | Less fingerprinting |

## Setup

```bash
cd week-40-security-headers
npm install
npm start

# Production-like HSTS:
NODE_ENV=production npm start
```

## Verify

```bash
curl -I http://localhost:3000/

curl -s http://localhost:3000/api/security-headers | jq .
```

Demo UI: http://localhost:3000/demo/

## Project structure

```
week-40-security-headers/
├── package.json
├── public/index.html
└── src/
    ├── server.js
    ├── config/helmet.js    ← CSP / HSTS / frameguard options
    └── routes/api.js
```

## GitHub

https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-40-security-headers

## Concepts

- Defense-in-depth browser controls
- CSP as XSS mitigation (not a full substitute for escaping)
- HSTS only over real HTTPS
- Clickjacking and `frame-ancestors` / `X-Frame-Options`

---

**Freelancer Development Program · Phase 4 · Week 40**  
**Phase 4 complete.**
