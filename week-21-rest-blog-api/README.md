# Quill — Week 21 RESTful Blog API

Backend API with full CRUD for **users**, **posts**, and **comments**.  
Built with **Express (Node.js)** and a JSON file store (no external database required to run).

## Purpose

Week 21 of the Freelancer 100-week development program.  
Roadmap requirement: **RESTful Blog API — CRUD endpoints for posts, comments, and users using Express/Node.**

This begins **Phase 3: Backend Basics & Databases**.

## Features

- RESTful resources: `/api/users`, `/api/posts`, `/api/comments`
- Create, read, update, delete for all three resources
- Validation (required fields, email format, foreign keys)
- Consistent JSON error envelope
- Filter posts by `authorId`, `tag`, or search `q`
- Nested post detail (author + comments)
- Cascade delete (user → posts/comments; post → comments)
- Seed script with sample data
- CORS enabled for local frontends
- Request logging (morgan)

## Project structure

```
week-21-rest-blog-api/
├── package.json
├── README.md
├── .gitignore
├── data/
│   └── db.json          ← created by seed / first write
└── src/
    ├── server.js
    ├── data/
    │   └── store.js     ← JSON read/write helpers
    ├── middleware/
    │   ├── errorHandler.js
    │   └── validate.js
    ├── routes/
    │   ├── users.js
    │   ├── posts.js
    │   └── comments.js
    └── utils/
        └── seed.js
```

## Setup

```bash
cd week-21-rest-blog-api
npm install
npm run seed    # sample users, posts, comments
npm start       # http://localhost:3000
```

Dev mode (auto-restart on file change, Node 18+):

```bash
npm run dev
```

## API reference

Base URL: `http://localhost:3000`

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/api/health` | Status + resource counts |

### Users

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/users` | — | List users |
| GET | `/api/users/:id` | — | Get one user |
| POST | `/api/users` | `{ name, email, bio? }` | Create user |
| PUT | `/api/users/:id` | `{ name?, email?, bio? }` | Update user |
| DELETE | `/api/users/:id` | — | Delete user (+ cascade) |

### Posts

| Method | Path | Body / Query | Description |
|--------|------|--------------|-------------|
| GET | `/api/posts` | `?authorId=&tag=&q=` | List / filter posts |
| GET | `/api/posts/:id` | — | Post + author + comments |
| POST | `/api/posts` | `{ authorId, title, content, tags? }` | Create post |
| PUT | `/api/posts/:id` | `{ title?, content?, tags? }` | Update post |
| DELETE | `/api/posts/:id` | — | Delete post (+ comments) |

### Comments

| Method | Path | Body / Query | Description |
|--------|------|--------------|-------------|
| GET | `/api/comments` | `?postId=` | List / filter comments |
| GET | `/api/comments/:id` | — | Get one comment |
| POST | `/api/comments` | `{ postId, authorId, content }` | Create comment |
| PUT | `/api/comments/:id` | `{ content }` | Update comment |
| DELETE | `/api/comments/:id` | — | Delete comment |

### Example

```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com"}'

# List posts
curl http://localhost:3000/api/posts

# Create a post (use a real authorId from seed/users)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"authorId":"<USER_ID>","title":"Hello API","content":"First post.","tags":["intro"]}'
```

### Error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": { "missing": ["email"] }
  }
}
```

## Design notes

- **JSON file store** keeps setup zero-friction for learning. Later weeks can swap `store.js` for SQLite, Postgres, or Mongo without changing route contracts much.
- **Consistent envelopes** (`{ data }` / `{ error }`) make client integration predictable.
- **Cascade deletes** keep the data model coherent.

## Concepts this teaches

- Express routing and middleware
- REST resource design
- Request validation
- HTTP status codes (200, 201, 204, 400, 404, 409, 500)
- File-based persistence
- Modular project layout

---

**Freelancer Development Program · Phase 3 · Week 21**
