/**
 * Rentora Type Definitions & Schema Constants (JSDoc)
 */

/**
 * @typedef {'SUPER_ADMIN' | 'OWNER' | 'TENANT'} UserRole
 */

/**
 * @typedef {'STARTER' | 'GROWTH' | 'ENTERPRISE'} SubscriptionTier
 */

/**
 * @typedef {'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'} MaintenanceStatus
 */

/**
 * @typedef {'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIALLY_PAID'} InvoiceStatus
 */

/**
 * @typedef {'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'DRAFT'} LeaseStatus
 */

/**
 * @typedef {'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'} UnitStatus
 */

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  TENANT: "TENANT",
};

export const MAINTENANCE_STATUS = {
  PENDING: "PENDING",
  DISPATCHED: "DISPATCHED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
};

export const INVOICE_STATUS = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  OVERDUE: "OVERDUE",
  PARTIALLY_PAID: "PARTIALLY_PAID",
};

export const LEASE_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  TERMINATED: "TERMINATED",
  DRAFT: "DRAFT",
};

export const SERVICE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry & Locks",
  "HVAC / Air Conditioning",
  "Painting & Cleaning",
  "Appliance Repair",
];
