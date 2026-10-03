# Gateway — Week 32 OAuth Social Login

Sign in with **Google** and **GitHub** using Passport.js. Issues a JWT after the OAuth callback.

## Purpose

Week 32 of the Freelancer 100-week development program.  
Roadmap requirement: **OAuth Social Login — Google and GitHub via Passport or Auth0.**

## Features

- Passport Google OAuth 2.0 strategy
- Passport GitHub strategy
- User upsert + account linking by email
- JWT issued after successful OAuth
- Session support during the OAuth dance
- **Demo login** when provider apps are not configured
- Minimal login UI at `/`

## Setup

```bash
cd week-32-oauth-login
npm install
npm start
```

### Real OAuth (optional)

Create apps and set env vars:

```bash
export GOOGLE_CLIENT_ID=...
export GOOGLE_CLIENT_SECRET=...
export GITHUB_CLIENT_ID=...
export GITHUB_CLIENT_SECRET=...
export BASE_URL=http://localhost:3000
export JWT_SECRET=long-random-string
export SESSION_SECRET=another-random-string
# Optional: where to send the browser after login
export FRONTEND_URL=http://localhost:3000
npm start
```

**Callback URLs to register with providers:**
- Google: `http://localhost:3000/auth/google/callback`
- GitHub: `http://localhost:3000/auth/github/callback`

### Demo without OAuth apps

```bash
curl -X POST http://localhost:3000/auth/demo \
  -H "Content-Type: application/json" \
  -d '{"provider":"google"}'
```

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Login UI |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google callback |
| GET | `/auth/github` | Start GitHub OAuth |
| GET | `/auth/github/callback` | GitHub callback |
| GET | `/auth/me` | Current user (Bearer JWT) |
| POST | `/auth/demo` | Demo login (no provider) |
| POST | `/auth/logout` | End session |

## Flow

1. User clicks “Continue with Google/GitHub”
2. Provider authenticates → callback
3. Server upserts user in store
4. Server signs JWT and redirects (or returns JSON)
5. Client stores token and calls `/auth/me`

## Project structure

```
week-32-oauth-login/
├── package.json
├── public/index.html
└── src/
    ├── server.js
    ├── config/passport.js
    ├── routes/auth.js
    ├── middleware/auth.js
    ├── data/store.js
    └── utils/tokens.js
```

## Concepts

- OAuth 2.0 authorization code flow
- Passport strategies
- Linking provider identities to local users
- Bridging OAuth session → API JWT

---

**Freelancer Development Program · Phase 4 · Week 32**
