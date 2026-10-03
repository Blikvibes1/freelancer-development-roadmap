# Ledger — Week 25 Data Export to CSV

Query order data and download a properly formatted CSV file.

## Purpose

Week 25 of the Freelancer 100-week development program.  
Roadmap requirement: **Data Export to CSV — query a database and generate a downloadable CSV file.**

## Features

- Seeded order dataset (customers, products, totals, status)
- JSON list endpoint with filters
- **CSV download** with:
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment` (browser download)
  - UTF-8 BOM (Excel-friendly)
  - RFC 4180-style escaping
- Filters: `status`, `category`, `q` (search), `from`, `to` (dates)
- No external CSV libraries

## Setup

```bash
cd week-25-csv-export
npm install
npm run seed
npm start
```

## Examples

```bash
# JSON
curl "http://localhost:3000/api/orders?status=paid"

# Download CSV
curl -OJ "http://localhost:3000/api/export/orders.csv"

# Filtered CSV
curl -OJ "http://localhost:3000/api/export/orders.csv?status=shipped&category=Electronics"

# Search
curl -OJ "http://localhost:3000/api/export/orders.csv?q=ava"
```

Open in browser:  
http://localhost:3000/api/export/orders.csv

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Status |
| GET | `/api/orders` | Orders as JSON (filterable) |
| GET | `/api/export/orders.csv` | **Download CSV** |
| GET | `/api/export/orders` | Same CSV (alternate path) |

### Query params (both JSON and CSV)

| Param | Example | Effect |
|-------|---------|--------|
| `status` | `paid` | Filter by order status |
| `category` | `Electronics` | Filter by product category |
| `q` | `ava` | Search customer, email, product, id |
| `from` | `2026-01-01` | Ordered on/after |
| `to` | `2026-12-31` | Ordered on/before |

## Project structure

```
week-25-csv-export/
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/errorHandler.js
    ├── routes/export.js
    └── utils/
        ├── csv.js
        └── seed.js
```

## Concepts

- Streaming-friendly response headers for file download
- CSV escaping (commas, quotes, newlines)
- Filtering the same dataset for JSON vs export
- Date-stamped filenames

---

**Freelancer Development Program · Phase 3 · Week 25**
