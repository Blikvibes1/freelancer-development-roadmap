# Taskflow — Week 23 To-Do List API

Task manager backend with **filtering**, **sorting**, and **pagination**.

## Purpose

Week 23 of the Freelancer 100-week development program.  
Roadmap requirement: **To-Do List API with filtering, sorting, and pagination.**

## Features

- Full CRUD for tasks
- Filter by `status`, `priority`, `completed`, text search `q`
- Sort by `createdAt`, `updatedAt`, `priority`, `title`, `dueDate`
- Pagination (`page`, `limit`) with `hasNext` / `hasPrev`
- Priority: `low` | `medium` | `high`
- Status: `pending` | `in_progress` | `done`
- Convenience `PATCH /api/tasks/:id/complete`
- JSON file store + seed data

## Setup

```bash
cd week-23-todo-api
npm install
npm run seed
npm start
```

## Query examples

```bash
# Pending tasks, highest priority first, page 1
curl "http://localhost:3000/api/tasks?status=pending&sort=priority&order=desc&page=1&limit=5"

# Search
curl "http://localhost:3000/api/tasks?q=api"

# Incomplete only
curl "http://localhost:3000/api/tasks?completed=false"

# Create
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Ship pagination","priority":"high","status":"pending"}'
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Counts by status |
| GET | `/api/tasks` | List (filter + sort + page) |
| GET | `/api/tasks/:id` | Get one |
| POST | `/api/tasks` | Create |
| PUT | `/api/tasks/:id` | Update |
| PATCH | `/api/tasks/:id/complete` | Mark done |
| DELETE | `/api/tasks/:id` | Delete |

### List response shape

```json
{
  "data": [ /* tasks */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "status": "pending",
    "priority": null,
    "completed": null,
    "q": null,
    "sort": "priority",
    "order": "desc"
  }
}
```

## Project structure

```
week-23-todo-api/
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/errorHandler.js
    ├── routes/tasks.js
    └── utils/seed.js
```

---

**Freelancer Development Program · Phase 3 · Week 23**
