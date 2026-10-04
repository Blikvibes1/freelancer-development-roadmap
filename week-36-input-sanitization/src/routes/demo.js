const express = require("express");
const { sanitizeInput, escapeHtml, looksLikeSqli, looksLikeXss } = require("../middleware/sanitize");

const router = express.Router();

/**
 * POST /api/demo/inspect
 * Does not block — returns what sanitizer would do (teaching endpoint).
 */
router.post("/inspect", (req, res) => {
  const { value } = req.body || {};
  if (value === undefined) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "body.value is required" },
    });
  }
  const str = String(value);
  res.json({
    data: {
      original: str,
      escapedHtml: escapeHtml(str),
      looksLikeSqli: looksLikeSqli(str),
      looksLikeXss: looksLikeXss(str),
    },
  });
});

/**
 * POST /api/demo/strict
 * Strict mode: reject XSS and SQLi-looking input.
 */
router.post(
  "/strict",
  sanitizeInput({
    escapeHtml: true,
    blockSqli: true,
    blockXss: true,
    maxLength: 500,
  }),
  (req, res) => {
    res.json({
      data: {
        message: "Input accepted under strict policy",
        body: req.body,
      },
    });
  }
);

module.exports = router;
