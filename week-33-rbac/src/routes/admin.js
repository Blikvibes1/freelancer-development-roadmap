const express = require("express");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");
const {
  requireAuth,
  requirePermission,
  requireRole,
  assertValidRole,
} = require("../middleware/rbac");
const { publicUser } = require("../utils/tokens");
const { ROLE_PERMISSIONS, ROLES } = require("../config/roles");

const router = express.Router();

// GET /api/admin/dashboard
router.get(
  "/dashboard",
  requireAuth,
  requirePermission("admin:dashboard"),
  (req, res) => {
    const db = read();
    res.json({
      data: {
        message: "Admin dashboard",
        stats: {
          users: db.users.length,
          articles: db.articles.length,
          byRole: ROLES.reduce((acc, role) => {
            acc[role] = db.users.filter((u) => u.role === role).length;
            return acc;
          }, {}),
        },
      },
    });
  }
);

// GET /api/admin/users
router.get(
  "/users",
  requireAuth,
  requirePermission("users:read"),
  (req, res) => {
    const db = read();
    res.json({
      data: db.users.map(publicUser),
      count: db.users.length,
    });
  }
);

// PATCH /api/admin/users/:id/role
router.patch(
  "/users/:id/role",
  requireAuth,
  requirePermission("users:manage"),
  (req, res, next) => {
    const { role } = req.body || {};
    try {
      assertValidRole(role);
      if (req.params.id === req.user.id) {
        return next(
          createError(400, "VALIDATION_ERROR", "Cannot change your own role")
        );
      }
      const updated = withDb((db) => {
        const idx = db.users.findIndex((u) => u.id === req.params.id);
        if (idx === -1) throw createError(404, "NOT_FOUND", "User not found");
        db.users[idx].role = role;
        return db.users[idx];
      });
      res.json({ data: publicUser(updated) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/roles — matrix (any authenticated user can inspect)
router.get("/roles", requireAuth, (req, res) => {
  res.json({
    data: {
      roles: ROLES,
      permissions: ROLE_PERMISSIONS,
    },
  });
});

// Role-only demo: only admin
router.get(
  "/admins-only",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    res.json({ data: { message: "Admin role gate passed", user: req.user } });
  }
);

module.exports = router;
