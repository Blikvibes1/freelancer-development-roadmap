# Frame — Week 24 Image Upload Endpoint

Accept image uploads, resize them, store files, and return public URLs.

## Purpose

Week 24 of the Freelancer 100-week development program.  
Roadmap requirement: **Image Upload Endpoint — accept image files, resize them, and store them (S3/Cloudinary-style).**

This implementation uses **local disk + Sharp** so it runs without cloud credentials. The storage service is structured so you can later swap in AWS S3 or Cloudinary.

## Features

- `POST /api/images` — multipart upload (`image` field)
- File type validation (JPEG, PNG, WebP, GIF)
- Max size **5MB**
- **Resize** to max width 1200px (Sharp)
- **Thumbnail** 320px wide
- Keeps original + resized + thumb
- Static file serving at `/uploads/...`
- List / get / delete metadata + files
- JSON metadata store

## Setup

```bash
cd week-24-image-upload
npm install
npm start
```

## Upload example

```bash
curl -X POST http://localhost:3000/api/images \
  -F "image=@./photo.jpg"
```

Response:

```json
{
  "data": {
    "id": "...",
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 182340,
    "width": 1200,
    "height": 800,
    "urls": {
      "original": "http://localhost:3000/uploads/original/....jpg",
      "resized": "http://localhost:3000/uploads/resized/....jpg",
      "thumb": "http://localhost:3000/uploads/thumbs/....jpg"
    },
    "createdAt": "..."
  }
}
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Status |
| GET | `/api/images` | List uploads |
| GET | `/api/images/:id` | One image |
| POST | `/api/images` | Upload (`image` field) |
| DELETE | `/api/images/:id` | Delete files + metadata |

## Project structure

```
week-24-image-upload/
├── package.json
├── README.md
├── uploads/
│   ├── original/
│   ├── resized/
│   └── thumbs/
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/
    │   ├── upload.js      ← multer
    │   └── errorHandler.js
    ├── routes/images.js
    └── services/storage.js  ← sharp resize + disk
```

## Production upgrade path

| Target | Change |
|--------|--------|
| **Cloudinary** | In `storage.js`, upload buffer via Cloudinary SDK; store returned URLs |
| **AWS S3** | Upload buffers with `@aws-sdk/client-s3`; return S3 or CDN URLs |

Route contracts stay the same.

## Concepts

- `multipart/form-data` with Multer
- Memory storage → process → write disk
- Image pipelines with Sharp
- Static file serving
- Cleanup on delete

---

**Freelancer Development Program · Phase 3 · Week 24**
