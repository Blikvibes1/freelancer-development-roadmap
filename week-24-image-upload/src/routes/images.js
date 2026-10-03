const express = require("express");
const { upload } = require("../middleware/upload");
const { processAndStore, deleteFiles } = require("../services/storage");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/images
router.get("/", (req, res) => {
  const db = read();
  const images = [...db.images].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ data: images, count: images.length });
});

// GET /api/images/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const image = db.images.find((i) => i.id === req.params.id);
  if (!image) return next(createError(404, "IMAGE_NOT_FOUND", "Image not found"));
  res.json({ data: image });
});

// POST /api/images  (multipart field name: "image")
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(
        createError(400, "NO_FILE", 'Attach an image file with field name "image"')
      );
    }

    const meta = await processAndStore(req.file, req);

    withDb((db) => {
      db.images.push(meta);
    });

    res.status(201).json({ data: meta });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/images/:id
router.delete("/:id", (req, res, next) => {
  try {
    const removed = withDb((db) => {
      const idx = db.images.findIndex((i) => i.id === req.params.id);
      if (idx === -1) throw createError(404, "IMAGE_NOT_FOUND", "Image not found");
      const [item] = db.images.splice(idx, 1);
      return item;
    });

    deleteFiles(removed.paths);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
