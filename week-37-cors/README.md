# Border — Week 37 CORS Configuration

Configure **Cross-Origin Resource Sharing** so only approved frontend domains can call the API.

## Purpose

Week 37 of the Freelancer 100-week development program.  
Roadmap requirement: **CORS — allow only specific frontend domains to access your API.**

## Features

- Origin **allowlist** via `ALLOWED_ORIGINS`
- `credentials: true` (cookies / auth headers) without using `*`
- Explicit methods & allowed/exposed headers
- Preflight caching (`maxAge`)
- Separate stricter policy for `/api/admin`
- Demo page at `/demo/`
- Clear `403 CORS_FORBIDDEN` when origin callback rejects

## Setup

```bash
cd week-37-cors
npm install

# Optional: customize allowlist
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,https://app.example.com"
npm start
```

## Test with curl

```bash
# Allowed origin (shows ACAO header)
curl -i http://localhost:3000/api/public \
  -H "Origin: http://localhost:5173"

# Unknown origin — browser would block; server may omit ACAO or return 403
curl -i http://localhost:3000/api/public \
  -H "Origin: https://evil.example"
```

## Browser demo

Open http://localhost:3000/demo/

To see a real browser CORS failure, serve the same HTML from another port **not** in `ALLOWED_ORIGINS` and point it at this API.

## Config reference

| Env | Meaning |
|-----|---------|
| `ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `ADMIN_ORIGINS` | Origins allowed on `/api/admin` |

## Project structure

```
week-37-cors/
├── package.json
├── public/index.html      ← demo UI
└── src/
    ├── server.js
    ├── config/cors.js     ← allowlist + options
    └── routes/api.js
```

## GitHub

https://github.com/Blikvibes1/freelancer-development-roadmap/tree/main/week-37-cors

## Concepts

- Simple requests vs preflight (`OPTIONS`)
- Why `Access-Control-Allow-Origin: *` cannot pair with credentials
- Allowlists over wildcards in production
- `trust` only known frontends

---

**Freelancer Development Program · Phase 4 · Week 37**
