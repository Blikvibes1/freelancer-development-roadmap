/**
 * RBAC role → permissions matrix.
 *
 * Roles: admin | editor | viewer
 */

const ROLES = ["admin", "editor", "viewer"];

/** permission strings used by middleware */
const PERMISSIONS = {
  "articles:read": "Read articles",
  "articles:create": "Create articles",
  "articles:update": "Update any article",
  "articles:update:own": "Update own articles",
  "articles:delete": "Delete any article",
  "articles:delete:own": "Delete own articles",
  "users:read": "List users",
  "users:manage": "Change user roles",
  "admin:dashboard": "Access admin dashboard",
};

const ROLE_PERMISSIONS = {
  viewer: ["articles:read"],
  editor: [
    "articles:read",
    "articles:create",
    "articles:update:own",
    "articles:delete:own",
  ],
  admin: [
    "articles:read",
    "articles:create",
    "articles:update",
    "articles:update:own",
    "articles:delete",
    "articles:delete:own",
    "users:read",
    "users:manage",
    "admin:dashboard",
  ],
};

function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(role, permission) {
  const list = permissionsFor(role);
  return list.includes(permission);
}

function isValidRole(role) {
  return ROLES.includes(role);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsFor,
  hasPermission,
  isValidRole,
};
