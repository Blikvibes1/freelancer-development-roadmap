/**
 * Auth + RBAC middleware.
 */

const { verifyToken } = require("../utils/tokens");
const { hasPermission, isValidRole } = require("../config/roles");
const { createError } = require("./errorHandler");

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(createError(401, "UNAUTHORIZED", "Bearer token required"));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Require one of the listed roles */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "UNAUTHORIZED", "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, "FORBIDDEN", "Insufficient role", {
          required: roles,
          actual: req.user.role,
        })
      );
    }
    next();
  };
}

/** Require a specific permission (from role matrix) */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "UNAUTHORIZED", "Authentication required"));
    }
    if (!hasPermission(req.user.role, permission)) {
      return next(
        createError(403, "FORBIDDEN", "Missing permission", {
          required: permission,
          role: req.user.role,
        })
      );
    }
    next();
  };
}

/**
 * Allow if user has permission OR owns the resource.
 * getOwnerId(req) must return the resource owner user id.
 */
function requirePermissionOrOwn(permission, ownPermission, getOwnerId) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    if (ownPermission && hasPermission(req.user.role, ownPermission)) {
      const ownerId = getOwnerId(req);
      if (ownerId && ownerId === req.user.id) {
        return next();
      }
    }

    return next(
      createError(403, "FORBIDDEN", "Not allowed to modify this resource")
    );
  };
}

function assertValidRole(role) {
  if (!isValidRole(role)) {
    throw createError(400, "VALIDATION_ERROR", `Invalid role. Use: admin, editor, viewer`);
  }
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requirePermissionOrOwn,
  assertValidRole,
};
