/**
 * Aegis — Week 40 Security Headers
 * Helmet: CSP, HSTS (prod), X-Frame-Options, nosniff, referrer-policy, …
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");

const { buildHelmetOptions } = require("./config/helmet");
const apiRouter = require("./routes/api");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers first
app.use(helmet(buildHelmetOptions()));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Aegis Security Headers",
    version: "1.0.0",
    phase: "Week 40 · Phase 4 complete",
    docs: {
      inspect: "GET /api/security-headers",
      demo: "GET /demo/",
      curl: "curl -I http://localhost:3000/",
    },
  });
});

app.use("/api", apiRouter);
app.use("/demo", express.static(path.join(__dirname, "../public")));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Aegis at http://localhost:${PORT}`);
  console.log(`  Inspect: GET /api/security-headers`);
  console.log(`  Demo UI: http://localhost:${PORT}/demo/`);
  console.log(`  curl -I http://localhost:${PORT}/`);
});
