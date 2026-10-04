const express = require("express");

const router = express.Router();

router.get("/public", (req, res) => {
  res.json({
    data: {
      message: "Public endpoint — uses global rate limit",
      ip: req.ip,
    },
  });
});

router.get("/heavy", (req, res) => {
  res.json({
    data: {
      message: "Heavier endpoint — tighter limit applied on this route",
      tip: "Spam this to see 429 faster",
    },
  });
});

module.exports = router;
