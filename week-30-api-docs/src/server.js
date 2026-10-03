/**
 * Atlas — Week 30 API Documentation
 * REST Notes API + OpenAPI 3 + Swagger UI.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");

const notesRouter = require("./routes/notes");
const { apiKeyAuth } = require("./middleware/auth");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

const openapiPath = path.join(__dirname, "../openapi.yaml");
const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));

app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Atlas Notes API",
    version: "1.0.0",
    phase: "Week 30 · Phase 3 complete",
    documentation: {
      swaggerUi: "/docs",
      openapiJson: "/openapi.json",
      openapiYaml: "/openapi.yaml",
    },
    auth: {
      header: "X-API-Key",
      demoKey: "demo-key-atlas",
      enforced: process.env.REQUIRE_AUTH === "true",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    notes: db.notes.length,
  });
});

// Serve OpenAPI artifacts
app.get("/openapi.json", (req, res) => {
  res.json(openapiDoc);
});
app.get("/openapi.yaml", (req, res) => {
  res.type("text/yaml").send(fs.readFileSync(openapiPath, "utf8"));
});

// Swagger UI
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDoc, {
    customSiteTitle: "Atlas Notes API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

// API (optional API key)
app.use("/api/notes", apiKeyAuth, notesRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Atlas API at http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
});
