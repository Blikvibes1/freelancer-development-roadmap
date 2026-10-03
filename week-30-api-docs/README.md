# Atlas — Week 30 API Documentation (OpenAPI / Swagger)

REST Notes API fully documented with **OpenAPI 3** and interactive **Swagger UI**.

## Purpose

Week 30 of the Freelancer 100-week development program.  
Roadmap requirement: **API Documentation — Swagger/OpenAPI (or Postman) with examples and authentication requirements.**

This completes **Phase 3: Backend Basics & Databases**.

## Features

- Live **Swagger UI** at `/docs`
- OpenAPI 3.0 spec (`openapi.yaml` + `/openapi.json`)
- Documented request/response schemas and examples
- API key security scheme (`X-API-Key`)
- Notes CRUD with filter query params
- Seed data for try-it-out in Swagger

## Setup

```bash
cd week-30-api-docs
npm install
npm run seed
npm start
```

Open: **http://localhost:3000/docs**

### Auth in Swagger

1. Click **Authorize**
2. Enter: `demo-key-atlas`
3. Try any endpoint

To **enforce** auth:

```bash
REQUIRE_AUTH=true npm start
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | Swagger UI |
| GET | `/openapi.json` | OpenAPI JSON |
| GET | `/openapi.yaml` | OpenAPI YAML |
| GET | `/api/health` | Health |
| GET | `/api/notes` | List notes (`?tag=&q=`) |
| POST | `/api/notes` | Create note |
| GET | `/api/notes/:id` | Get note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

## Project structure

```
week-30-api-docs/
├── openapi.yaml          ← source of truth for docs
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js         ← mounts Swagger UI
    ├── data/store.js
    ├── middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── routes/notes.js
    └── utils/seed.js
```

## Concepts

- OpenAPI as a contract
- Swagger UI for interactive exploration
- Documenting auth schemes and error shapes
- Keeping docs next to the running API

---

**Freelancer Development Program · Phase 3 · Week 30**  
**Phase 3 complete.**
