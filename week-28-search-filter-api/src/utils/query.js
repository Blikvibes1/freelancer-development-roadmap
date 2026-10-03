/**
 * Parse and apply complex product search/filter/sort/pagination.
 *
 * Supported query params:
 *   q              text search (name, description, tags)
 *   category       single or comma-separated
 *   tag            single or comma-separated
 *   brand          exact match (case-insensitive)
 *   min_price      number
 *   max_price      number
 *   min_rating     number 0–5
 *   in_stock       true|false
 *   sort           price|rating|name|createdAt|popularity
 *   order          asc|desc
 *   page           default 1
 *   limit          default 10, max 50
 */

function parseList(val) {
  if (val === undefined || val === null || val === "") return [];
  return String(val)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseNum(val) {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function parseBool(val) {
  if (val === undefined || val === null || val === "") return undefined;
  if (val === true || val === "true" || val === "1") return true;
  if (val === false || val === "false" || val === "0") return false;
  return undefined;
}

function applyFilters(products, query) {
  let list = [...products];

  const q = query.q ? String(query.q).trim().toLowerCase() : "";
  const categories = parseList(query.category);
  const tags = parseList(query.tag);
  const brand = query.brand ? String(query.brand).trim().toLowerCase() : "";
  const minPrice = parseNum(query.min_price);
  const maxPrice = parseNum(query.max_price);
  const minRating = parseNum(query.min_rating);
  const inStock = parseBool(query.in_stock);

  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }

  if (categories.length) {
    list = list.filter((p) => categories.includes(String(p.category).toLowerCase()));
  }

  if (tags.length) {
    list = list.filter((p) =>
      tags.every((tag) => (p.tags || []).map((t) => t.toLowerCase()).includes(tag))
    );
  }

  if (brand) {
    list = list.filter((p) => String(p.brand).toLowerCase() === brand);
  }

  if (minPrice !== undefined) {
    list = list.filter((p) => p.price >= minPrice);
  }
  if (maxPrice !== undefined) {
    list = list.filter((p) => p.price <= maxPrice);
  }
  if (minRating !== undefined) {
    list = list.filter((p) => p.rating >= minRating);
  }
  if (inStock === true) {
    list = list.filter((p) => p.stock > 0);
  } else if (inStock === false) {
    list = list.filter((p) => p.stock <= 0);
  }

  return list;
}

function applySort(list, query) {
  const allowed = ["price", "rating", "name", "createdAt", "popularity"];
  const sort = allowed.includes(query.sort) ? query.sort : "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";

  const sorted = [...list].sort((a, b) => {
    let av = a[sort];
    let bv = b[sort];
    if (sort === "name") {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    } else if (sort === "createdAt") {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    }
    if (av < bv) return order === "asc" ? -1 : 1;
    if (av > bv) return order === "asc" ? 1 : -1;
    return 0;
  });

  return { sorted, sort, order };
}

function applyPagination(list, query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const total = list.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const data = list.slice(offset, offset + limit);

  return {
    data,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

function searchProducts(products, query) {
  const filtered = applyFilters(products, query);
  const { sorted, sort, order } = applySort(filtered, query);
  const page = applyPagination(sorted, query);

  return {
    ...page,
    meta: {
      sort,
      order,
      filters: {
        q: query.q || null,
        category: query.category || null,
        tag: query.tag || null,
        brand: query.brand || null,
        min_price: query.min_price ?? null,
        max_price: query.max_price ?? null,
        min_rating: query.min_rating ?? null,
        in_stock: query.in_stock ?? null,
      },
    },
  };
}

module.exports = { searchProducts, applyFilters, applySort, applyPagination };
