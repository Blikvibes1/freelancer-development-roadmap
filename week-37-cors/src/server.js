/**
 * Border — Week 37 CORS Configuration
 * Allow only specific frontend origins to call the API.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const { corsOptions, adminCorsOptions, allowedOrigins } = require("./config/cors");
const apiRouter = require("./routes/api");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());

// Global CORS for API
app.use("/api", cors(corsOptions));
// Explicit preflight (cors middleware also handles OPTIONS)
app.options("/api/*", cors(corsOptions));

app.use("/api/admin", cors(adminCorsOptions));

app.get("/", (req, res) => {
  res.json({
    name: "Border CORS API",
    version: "1.0.0",
    phase: "Week 37 · Phase 4",
    allowedOrigins,
    endpoints: {
      public: "GET /api/public",
      echo: "POST /api/echo",
      me: "GET /api/me",
      demoPage: "GET /demo",
    },
    tip: "Open /demo and watch browser DevTools Network for CORS headers / errors.",
  });
});

app.get("/api/health", cors(corsOptions), (req, res) => {
  res.json({ status: "ok", allowedOrigins });
});

app.use("/api", apiRouter);

app.get("/api/admin/stats", (req, res) => {
  res.json({ data: { secrets: "admin-only origin policy", ok: true } });
});

// Static demo page (same origin when served from this app)
app.use("/demo", express.static(path.join(__dirname, "../public")));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Border CORS at http://localhost:${PORT}`);
  console.log(`  Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`  Demo page: http://localhost:${PORT}/demo/`);
});
