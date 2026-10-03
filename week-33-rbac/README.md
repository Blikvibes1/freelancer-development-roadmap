# Sentinel — Week 33 Role-Based Access Control (RBAC)

Middleware that restricts routes by **role** and **permission** (Admin, Editor, Viewer).

## Purpose

Week 33 of the Freelancer 100-week development program.  
Roadmap requirement: **RBAC — middleware that restricts routes based on user roles (Admin, Editor, Viewer).**

## Roles & permissions

| Permission | Viewer | Editor | Admin |
|------------|:------:|:------:|:-----:|
| articles:read | ✓ | ✓ | ✓ |
| articles:create | | ✓ | ✓ |
| articles:update:own | | ✓ | ✓ |
| articles:delete:own | | ✓ | ✓ |
| articles:update (any) | | | ✓ |
| articles:delete (any) | | | ✓ |
| users:read | | | ✓ |
| users:manage | | | ✓ |
| admin:dashboard | | | ✓ |

Editors may only update/delete **their own** articles. Admins may modify any.

## Setup

```bash
cd week-33-rbac
npm install
npm run seed
npm start
```

## Seeded accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| editor@example.com | password123 | editor |
| viewer@example.com | password123 | viewer |

## Try it

```bash
# Login as viewer
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"password123"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).data.accessToken")

# Can read
curl http://localhost:3000/api/articles -H "Authorization: Bearer $TOKEN"

# Cannot create (403)
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Nope"}'
```

## Middleware

- `requireAuth` — valid JWT
- `requireRole('admin')` — role gate
- `requirePermission('articles:create')` — permission gate
- `requirePermissionOrOwn('articles:update', 'articles:update:own', getOwnerId)` — admin any / editor own

## Project structure

```
week-33-rbac/
├── package.json
├── README.md
└── src/
    ├── config/roles.js      ← matrix
    ├── middleware/rbac.js   ← gates
    ├── routes/
    │   ├── auth.js
    │   ├── articles.js
    │   └── admin.js
    └── utils/
```

---

**Freelancer Development Program · Phase 4 · Week 33**
