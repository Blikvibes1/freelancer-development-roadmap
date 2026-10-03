/**
 * Frame — Week 24 Image Upload Endpoint
 * Multipart upload, resize (sharp), local storage.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const imagesRouter = require("./routes/images");
const { read } = require("./data/store");
const { ensureDirs, UPLOAD_ROOT } = require("./services/storage");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

ensureDirs();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_ROOT));

app.get("/", (req, res) => {
  res.json({
    name: "Frame Image Upload API",
    version: "1.0.0",
    phase: "Week 24 · Phase 3",
    endpoints: {
      health: "/api/health",
      upload: "POST /api/images (multipart field: image)",
      list: "GET /api/images",
      get: "GET /api/images/:id",
      delete: "DELETE /api/images/:id",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    images: db.images.length,
  });
});

app.use("/api/images", imagesRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Frame Image Upload at http://localhost:${PORT}`);
  console.log(`  POST /api/images  field name: image`);
  console.log(`  Files served from /uploads/...`);
});
