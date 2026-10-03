/**
 * Ledger — Week 25 CSV Export API
 * Query orders and download as CSV.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const exportRouter = require("./routes/export");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Ledger CSV Export API",
    version: "1.0.0",
    phase: "Week 25 · Phase 3",
    endpoints: {
      health: "/api/health",
      ordersJson: "/api/orders",
      ordersCsv: "/api/export/orders.csv",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    orders: db.orders.length,
  });
});

app.use("/api", exportRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Ledger CSV Export at http://localhost:${PORT}`);
  console.log(`  GET /api/orders`);
  console.log(`  GET /api/export/orders.csv?status=paid`);
});
