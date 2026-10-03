const express = require("express");
const { read } = require("../data/store");
const { toCsv, filenameWithDate } = require("../utils/csv");

const router = express.Router();

const HEADERS = [
  "Order ID",
  "Customer",
  "Email",
  "Product",
  "Category",
  "Quantity",
  "Unit Price",
  "Total",
  "Status",
  "Ordered At",
];

const KEYS = [
  "id",
  "customer",
  "email",
  "product",
  "category",
  "quantity",
  "unitPrice",
  "total",
  "status",
  "orderedAt",
];

function filterOrders(orders, query) {
  let list = [...orders];

  if (query.status) {
    list = list.filter(
      (o) => o.status.toLowerCase() === String(query.status).toLowerCase()
    );
  }
  if (query.category) {
    list = list.filter(
      (o) => o.category.toLowerCase() === String(query.category).toLowerCase()
    );
  }
  if (query.q) {
    const term = String(query.q).toLowerCase();
    list = list.filter(
      (o) =>
        o.customer.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term) ||
        o.product.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term)
    );
  }
  if (query.from) {
    const from = new Date(query.from).getTime();
    if (!Number.isNaN(from)) {
      list = list.filter((o) => new Date(o.orderedAt).getTime() >= from);
    }
  }
  if (query.to) {
    const to = new Date(query.to).getTime();
    if (!Number.isNaN(to)) {
      list = list.filter((o) => new Date(o.orderedAt).getTime() <= to);
    }
  }

  list.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
  return list;
}

// GET /api/orders — JSON list (same filters as export)
router.get("/orders", (req, res) => {
  const db = read();
  const data = filterOrders(db.orders, req.query);
  res.json({ data, count: data.length });
});

// GET /api/export/orders.csv — downloadable CSV
router.get("/export/orders.csv", (req, res) => {
  const db = read();
  const rows = filterOrders(db.orders, req.query);
  const csv = toCsv(HEADERS, rows, KEYS);
  const filename = filenameWithDate("orders");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(csv);
});

// GET /api/export/orders — same CSV, alternate path without .csv extension
router.get("/export/orders", (req, res) => {
  const db = read();
  const rows = filterOrders(db.orders, req.query);
  const csv = toCsv(HEADERS, rows, KEYS);
  const filename = filenameWithDate("orders");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(csv);
});

module.exports = router;
