/**
 * Catalog — Week 28 Search & Filter API
 * Complex querying: category, price range, tags, sort, pagination.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const productsRouter = require("./routes/products");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Catalog Search & Filter API",
    version: "1.0.0",
    phase: "Week 28 · Phase 3",
    example:
      "/api/products?category=Electronics&min_price=50&max_price=200&sort=price&order=asc&page=1&limit=5",
    endpoints: {
      search: "GET /api/products",
      facets: "GET /api/products/facets",
      one: "GET /api/products/:id",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    products: db.products.length,
  });
});

app.use("/api/products", productsRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Catalog API at http://localhost:${PORT}`);
  console.log(
    "  GET /api/products?category=Electronics&min_price=50&sort=price&order=asc"
  );
});
