const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/protected/profile
router.get("/profile", requireAuth, (req, res) => {
  res.json({
    data: {
      message: "You are authenticated.",
      user: req.user,
    },
  });
});

// GET /api/protected/admin — role check demo
router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
  res.json({
    data: {
      message: "Admin area.",
      user: req.user,
    },
  });
});

module.exports = router;
