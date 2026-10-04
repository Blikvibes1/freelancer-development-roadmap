/**
 * Scrub — Week 36 Input Sanitization
 * Middleware to harden against XSS & SQL-injection style payloads.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const commentsRouter = require("./routes/comments");
const demoRouter = require("./routes/demo");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Scrub Input Sanitization API",
    version: "1.0.0",
    phase: "Week 36 · Phase 4",
    endpoints: {
      comments: "GET/POST /api/comments",
      inspect: "POST /api/demo/inspect  { value }",
      strict: "POST /api/demo/strict   rejects XSS + SQLi patterns",
    },
    tryAttack: {
      xss: { author: "x", body: "<script>alert(1)</script>" },
      sqli: { author: "x", body: "1' OR '1'='1" },
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({ status: "ok", comments: db.comments.length });
});

app.use("/api/comments", commentsRouter);
app.use("/api/demo", demoRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Scrub at http://localhost:${PORT}`);
  console.log("  POST /api/comments  — escape HTML, block SQLi-like input");
  console.log("  POST /api/demo/inspect — see what the sanitizer thinks");
});
