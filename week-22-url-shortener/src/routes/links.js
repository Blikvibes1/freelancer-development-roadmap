const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { generateCode, isValidUrl, isValidCustomCode } = require("../utils/code");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

function baseUrl(req) {
  const host = req.get("host") || "localhost:3000";
  const proto = req.protocol || "http";
  return `${proto}://${host}`;
}

// GET /api/links — list all (newest first)
router.get("/", (req, res) => {
  const db = read();
  const links = [...db.links].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ data: links, count: links.length });
});

// GET /api/links/:code — metadata for a short code
router.get("/:code", (req, res, next) => {
  const db = read();
  const link = db.links.find((l) => l.code === req.params.code);
  if (!link) return next(createError(404, "LINK_NOT_FOUND", "Short link not found"));
  res.json({ data: link });
});

// POST /api/links — create a short link
// Body: { url, code? (custom), title? }
router.post("/", (req, res, next) => {
  const { url, code: customCode, title } = req.body || {};

  if (!url || !isValidUrl(url)) {
    return next(
      createError(400, "INVALID_URL", "A valid http(s) URL is required", {
        field: "url",
      })
    );
  }

  if (customCode !== undefined && customCode !== null && customCode !== "") {
    if (!isValidCustomCode(customCode)) {
      return next(
        createError(
          400,
          "INVALID_CODE",
          "Custom code must be 3–32 chars: letters, numbers, _ or -"
        )
      );
    }
  }

  try {
    const link = withDb((db) => {
      let code = customCode ? String(customCode) : null;

      if (code) {
        if (db.links.some((l) => l.code === code)) {
          throw createError(409, "CODE_TAKEN", "That short code is already in use");
        }
      } else {
        // Generate unique code (retry on rare collision)
        let attempts = 0;
        do {
          code = generateCode(7);
          attempts += 1;
          if (attempts > 20) {
            throw createError(500, "CODE_GEN_FAILED", "Could not generate a unique code");
          }
        } while (db.links.some((l) => l.code === code));
      }

      const created = {
        id: randomUUID(),
        code,
        url: String(url).trim(),
        title: title ? String(title).trim() : "",
        clicks: 0,
        createdAt: new Date().toISOString(),
        lastClickedAt: null,
      };
      db.links.push(created);
      return created;
    });

    const shortUrl = `${baseUrl(req)}/r/${link.code}`;
    res.status(201).json({
      data: {
        ...link,
        shortUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/links/:code
router.delete("/:code", (req, res, next) => {
  try {
    withDb((db) => {
      const idx = db.links.findIndex((l) => l.code === req.params.code);
      if (idx === -1) throw createError(404, "LINK_NOT_FOUND", "Short link not found");
      db.links.splice(idx, 1);
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/links/:code/stats — click stats
router.get("/:code/stats", (req, res, next) => {
  const db = read();
  const link = db.links.find((l) => l.code === req.params.code);
  if (!link) return next(createError(404, "LINK_NOT_FOUND", "Short link not found"));
  res.json({
    data: {
      code: link.code,
      url: link.url,
      clicks: link.clicks,
      createdAt: link.createdAt,
      lastClickedAt: link.lastClickedAt,
    },
  });
});

module.exports = router;
