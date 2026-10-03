# Clip — Week 22 URL Shortener Service

API that turns a long URL into a short code, stores it, tracks clicks, and redirects.

## Purpose

Week 22 of the Freelancer 100-week development program.  
Roadmap requirement: **URL Shortener Service — take a long URL, generate a short code, save it, and handle redirects.**

## Features

- `POST /api/links` — create short link (optional custom code + title)
- `GET /r/:code` — **302 redirect** to the original URL (increments click count)
- `GET /api/links` — list all links
- `GET /api/links/:code` — link metadata
- `GET /api/links/:code/stats` — click stats
- `DELETE /api/links/:code` — remove a link
- URL validation (http/https only)
- Custom codes or auto-generated (crypto-random, URL-safe)
- Collision handling for codes
- JSON file store (no external DB)
- Seed script with sample links

## Setup

```bash
cd week-22-url-shortener
npm install
npm run seed
npm start
# → http://localhost:3000
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/api/health` | Status + totals |
| POST | `/api/links` | Create short link |
| GET | `/api/links` | List links |
| GET | `/api/links/:code` | Get one link |
| GET | `/api/links/:code/stats` | Click stats |
| DELETE | `/api/links/:code` | Delete link |
| GET | `/r/:code` | **Redirect** to original URL |

### Create example

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/very/long/path","title":"Example"}'
```

Response:

```json
{
  "data": {
    "id": "...",
    "code": "aB3xY9k",
    "url": "https://example.com/very/long/path",
    "title": "Example",
    "clicks": 0,
    "shortUrl": "http://localhost:3000/r/aB3xY9k",
    "createdAt": "..."
  }
}
```

Then open: `http://localhost:3000/r/aB3xY9k` → redirects to the long URL.

### Custom code

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com","code":"gh"}'
```

## Project structure

```
week-22-url-shortener/
├── package.json
├── README.md
├── .gitignore
├── data/db.json
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/errorHandler.js
    ├── routes/links.js
    └── utils/
        ├── code.js
        └── seed.js
```

## Concepts

- Redirect responses (302)
- Idempotent-ish code generation
- Click analytics
- Input validation for URLs
- RESTful resource design for links

---

**Freelancer Development Program · Phase 3 · Week 22**
