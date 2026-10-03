/**
 * Rentora Central API Client
 * Wraps fetch with common JSON headers, error handling, and authorization.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Base request handler
 * @param {string} endpoint 
 * @param {RequestInit} [options] 
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.error || data?.message || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || "Network error occurred", 500);
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body, options) =>
    apiRequest(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body, options) =>
    apiRequest(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: "DELETE" }),
};

/**
 * Properties API endpoints
 */
export const propertiesApi = {
  /**
   * Fetch all properties for current owner
   */
  getAll: (options) => api.get("/owner/properties", options),

  /**
   * Fetch single property by ID
   */
  getById: (id, options) => api.get(`/owner/properties/${id}`, options),

  /**
   * Add a new property
   * @param {{ name: string, address: string, type: string, totalUnits: number, status?: string }} propertyData
   */
  create: (propertyData, options) => api.post("/owner/properties", propertyData, options),

  /**
   * Update property by ID
   */
  update: (id, propertyData, options) =>
    api.patch(`/owner/properties/${id}`, propertyData, options),

  /**
   * Delete property by ID
   */
  delete: (id, options) => api.delete(`/owner/properties/${id}`, options),
};

/**
 * Tenants API endpoints
 */
export const tenantsApi = {
  getAll: (options) => api.get("/owner/tenants", options),
  create: (tenantData, options) => api.post("/owner/tenants", tenantData, options),
  delete: (id, options) => api.delete(`/owner/tenants/${id}`, options),
};

/**
 * Auth API endpoints
 */
export const authApi = {
  login: (credentials, options) => api.post("/auth/login", credentials, options),
  register: (userData, options) => api.post("/auth/register", userData, options),
  logout: (options) => api.post("/auth/logout", {}, options),
  me: (options) => api.get("/auth/me", options),
};

export default api;
