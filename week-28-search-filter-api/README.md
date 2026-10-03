# Catalog — Week 28 Search & Filter API

Product catalog endpoint with complex query parameters: category, price range, tags, sort, and pagination.

## Purpose

Week 28 of the Freelancer 100-week development program.  
Roadmap requirement: **Search & Filter API — complex querying (e.g. `?category=tech&min_price=50&sort=date`).**

## Query parameters

| Param | Example | Effect |
|-------|---------|--------|
| `q` | `keyboard` | Text name, description, tags |
| `category` | `Electronics` or `Home,Sports` | Filter by category |
| `tag` | `wireless` or `usb-c,travel` | All listed tags must match |
| `brand` | `Sony` | Exact brand (case-insensitive) |
| `min_price` | `50` | Minimum price |
| `max_price` | `200` | Maximum price |
| `min_rating` | `4` | Minimum rating |
| `in_stock` | `true` | Only items with stock > 0 |
| `sort` | `price` \| `rating` \| `name` \| `createdAt` \| `popularity` | Sort field |
| `order` | `asc` \| `desc` | Sort direction |
| `page` | `1` | Page number |
| `limit` | `10` | Page size (max 50) |

## Setup

```bash
cd week-28-search-filter-api
npm install
npm run seed
npm start
```

## Examples

```bash
# Roadmap-style query
curl "http://localhost:3000/api/products?category=Electronics&min_price=50&sort=price&order=asc"

# Multi-filter
curl "http://localhost:3000/api/products?tag=wireless&min_rating=4&in_stock=true&sort=popularity&order=desc"

# Facets for building a filter UI
curl http://localhost:3000/api/products/facets
```

## Response shape

```json
{
  "data": [ /* products */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 7,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "meta": {
    "sort": "price",
    "order": "asc",
    "filters": { "category": "Electronics", "min_price": "50", ... }
  }
}
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | Search / filter / sort / paginate |
| GET | `/api/products/facets` | Distinct categories, brands, tags, price range |
| GET | `/api/products/:id` | Single product |

## Project structure

```
week-28-search-filter-api/
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js
    ├── data/store.js
    ├── middleware/errorHandler.js
    ├── routes/products.js
    └── utils/
        ├── query.js
        └── seed.js
```

## Concepts

- Composable query-string filters
- Multi-value params (comma-separated)
- Sort + pagination on filtered sets
- Facets endpoint for UI filter panels

---

**Freelancer Development Program · Phase 3 · Week 28**
