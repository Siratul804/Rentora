/**
 * Authentication and Role-Based Access Control (RBAC) helpers for Rentora
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  TENANT: "TENANT",
};

export const MOCK_USERS = {
  [ROLES.SUPER_ADMIN]: {
    id: "admin-1",
    name: "Alex Rahman",
    email: "admin@rentora.com",
    role: ROLES.SUPER_ADMIN,
    avatar: "👑",
    title: "Platform Super Admin",
  },
  [ROLES.OWNER]: {
    id: "owner-1",
    name: "Siratul Islam",
    email: "siratul@rentora.com",
    role: ROLES.OWNER,
    avatar: "🏢",
    title: "Property Landlord",
    propertiesCount: 6,
    unitsCount: 24,
  },
  [ROLES.TENANT]: {
    id: "tenant-1",
    name: "Farhan Ahmed",
    email: "farhan@gmail.com",
    role: ROLES.TENANT,
    avatar: "👤",
    title: "Unit 4B Resident",
    property: "Green Horizon Residency, Dhaka",
    unit: "Unit 4B",
  },
};

/**
 * Checks if a user has a specific role
 * @param {object|null} user 
 * @param {string} role 
 * @returns {boolean}
 */
export function hasRole(user, role) {
  if (!user) return false;
  return user.role === role;
}

/**
 * Get route redirection according to user role
 * @param {string} role 
 * @returns {string}
 */
export function getRoleDashboardPath(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return "/admin/dashboard";
    case ROLES.OWNER:
      return "/owner/dashboard";
    case ROLES.TENANT:
      return "/tenant/dashboard";
    default:
      return "/login";
  }
}
