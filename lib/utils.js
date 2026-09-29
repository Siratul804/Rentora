/**
 * Utility functions for Rentora platform
 */

/**
 * Combines conditional class names
 * @param  {...(string|undefined|null|false)} classes 
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format currency amount
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export function formatCurrency(amount, currency = "BDT") {
  if (typeof amount !== "number" || isNaN(amount)) return "৳ 0";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: currency === "BDT" ? "BDT" : "USD",
    maximumFractionDigits: 0,
  }).format(amount).replace("BDT", "৳");
}

/**
 * Format date string
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Returns badge color classes based on status
 * @param {string} status 
 * @returns {string}
 */
export function getStatusBadgeClass(status) {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "active":
    case "paid":
    case "resolved":
    case "completed":
    case "approved":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "pending":
    case "dispatched":
    case "in_progress":
    case "in progress":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "overdue":
    case "unpaid":
    case "cancelled":
    case "rejected":
    case "suspended":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "vacant":
    case "inactive":
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    default:
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  }
}
