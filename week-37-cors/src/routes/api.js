const express = require("express");
const { allowedOrigins } = require("../config/cors");

const router = express.Router();

router.get("/public", (req, res) => {
  res.json({
    data: {
      message: "Public API response",
      requestOrigin: req.get("Origin") || null,
      allowedOrigins,
    },
  });
});

router.post("/echo", (req, res) => {
  res.json({
    data: {
      received: req.body || {},
      origin: req.get("Origin") || null,
    },
  });
});

router.get("/me", (req, res) => {
  // Demo cookie-sensitive response when credentials: true
  res.json({
    data: {
      user: "demo",
      note: "Browser only sends cookies cross-origin if CORS allows credentials and Access-Control-Allow-Origin is not *",
    },
  });
});

module.exports = router;
