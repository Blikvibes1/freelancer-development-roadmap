const express = require("express");
const { HEADER_GUIDE } = require("../config/helmet");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/**
 * Echo response security headers actually sent for this request.
 * Useful for demos and verification.
 */
router.get("/security-headers", (req, res) => {
  // Capture headers that will be on the response after helmet ran
  const interesting = [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "x-dns-prefetch-control",
    "x-download-options",
    "x-permitted-cross-domain-policies",
  ];

  const applied = {};
  for (const name of interesting) {
    const value = res.getHeader(name);
    if (value !== undefined) applied[name] = value;
  }

  res.json({
    data: {
      environment: process.env.NODE_ENV || "development",
      applied,
      guide: HEADER_GUIDE,
      tip: "Also run: curl -I http://localhost:3000/",
    },
  });
});

router.get("/public", (req, res) => {
  res.json({
    data: {
      message: "Public payload under Helmet defaults",
    },
  });
});

module.exports = router;
