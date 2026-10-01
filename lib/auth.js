/**
 * Auth constants and pure helper functions.
 * ✅ Safe to import in both Client and Server components.
 * ❌ Do NOT add any server-only imports (next/headers, etc.) here.
 */

export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  TENANT: "tenant",
  // Alias for compatibility with any legacy code
  SUPER_ADMIN: "admin",
};

/**
 * Normalizes a role string to lowercase.
 * @param {string} role
 * @returns {string}
 */
export function normalizeRole(role) {
  if (!role) return "";
  const r = role.toLowerCase();
  if (r === "super_admin") return ROLES.ADMIN;
  return r;
}

/**
 * Checks if a user object has a specific role.
 * @param {object|null} user
 * @param {string} role
 * @returns {boolean}
 */
export function hasRole(user, role) {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === normalizeRole(role);
}

/**
 * Returns the dashboard path for a given role.
 * @param {string} role
 * @returns {string}
 */
export function getRoleDashboardPath(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case ROLES.ADMIN:
      return "/admin/dashboard";
    case ROLES.OWNER:
      return "/owner/dashboard";
    case ROLES.TENANT:
      return "/tenant/dashboard";
    default:
      return "/login";
  }
}
