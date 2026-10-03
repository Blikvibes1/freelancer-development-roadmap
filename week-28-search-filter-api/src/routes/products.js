const express = require("express");
const { read } = require("../data/store");
const { searchProducts } = require("../utils/query");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/products — complex search & filter
router.get("/", (req, res) => {
  const db = read();
  const result = searchProducts(db.products, req.query);
  res.json(result);
});

// GET /api/products/facets — distinct categories, brands, tags for UI filters
router.get("/facets", (req, res) => {
  const db = read();
  const categories = new Set();
  const brands = new Set();
  const tags = new Set();
  let minPrice = Infinity;
  let maxPrice = 0;

  db.products.forEach((p) => {
    categories.add(p.category);
    brands.add(p.brand);
    (p.tags || []).forEach((t) => tags.add(t));
    if (p.price < minPrice) minPrice = p.price;
    if (p.price > maxPrice) maxPrice = p.price;
  });

  res.json({
    data: {
      categories: [...categories].sort(),
      brands: [...brands].sort(),
      tags: [...tags].sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice,
      },
    },
  });
});

// GET /api/products/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return next(createError(404, "NOT_FOUND", "Product not found"));
  res.json({ data: product });
});

module.exports = router;
