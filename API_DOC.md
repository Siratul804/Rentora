# Rentora API Documentation

Complete API documentation for all endpoints implemented in `app/api`.

---

## Overview & Architecture

- **Base URL:** `/api`
- **Content-Type:** `application/json` (unless specified otherwise, e.g., multipart/form-data for payment callbacks or PDF downloads)
- **Authentication:**
  - **Cookie-based (Primary):** JWT stored in the HTTP-only cookie named `auth-token`.
  - **Bearer Token Header (Alternative):** `Authorization: Bearer <token>`.
- **User Roles:** `admin` / `superadmin`, `owner`, `tenant`, `service_provider`.

---

## Quick Endpoint Reference

| Category | Endpoint | Method(s) | Role / Auth |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/register` | `POST` | Public |
| | `/api/auth/login` | `POST` | Public |
| | `/api/auth/logout` | `POST` | Public |
| | `/api/auth/me` | `GET` | Authenticated |
| **Owner: Properties** | `/api/owner/properties` | `GET`, `POST` | Owner / Admin |
| | `/api/owner/properties/[propertyId]` | `GET`, `PATCH`, `DELETE` | Owner / Admin |
| | `/api/properties` | `GET`, `POST` | Owner / Admin (Alias) |
| **Owner: Units** | `/api/owner/unit` | `GET`, `POST` | Owner / Admin |
| | `/api/owner/properties/[propertyId]/units` | `GET` | Owner (Bearer token) |
| | `/api/owner/properties/[propertyId]/units/[unitId]` | `PUT`, `DELETE` | Owner (Bearer token) |
| **Owner: Tenants** | `/api/owner/tenants` | `GET`, `POST` | Owner |
| | `/api/owner/tenants/[id]` | `GET`, `PUT`, `PATCH`, `DELETE` | Owner |
| | `/api/owner/properties/[propertyId]/units/[unitId]/tenants` | `POST` | Owner (Bearer token) |
| **Owner: Leases** | `/api/owner/leases` | `GET`, `POST` | Owner / Admin |
| | `/api/owner/leases/[id]` | `GET`, `PUT`, `PATCH`, `DELETE` | Owner / Admin |
| **Owner: Invoices** | `/api/owner/invoices` | `GET`, `POST`, `PATCH` | Owner |
| | `/api/owner/invoices/[invoiceId]` | `GET`, `PUT`, `PATCH` | Owner |
| | `/api/owner/invoices/[invoiceId]/send` | `POST` | Owner |
| | `/api/owner/properties/[propertyId]/units/[unitId]/invoices` | `GET`, `POST` | Owner (Alias) |
| **Owner: Maintenance** | `/api/owner/maintenance` | `GET`, `PATCH` | Owner |
| **Owner: Payment Info** | `/api/owner/payment-info` | `GET` | Owner |
| **Tenant Portal** | `/api/tenant/rent-summary` | `GET` | Tenant |
| | `/api/tenant/invoices` | `GET` | Tenant |
| | `/api/tenant/maintenance` | `GET`, `POST` | Tenant |
| **Invoices** | `/api/invoices/[invoiceId]/pdf` | `GET` | Owner / Tenant |
| **Notifications** | `/api/notifications` | `GET`, `PUT`, `PATCH` | Owner / Tenant |
| **Job History** | `/api/provider-job-history` | `GET` | Owner / Admin |
| **Payment (SSLCOMMERZ)**| `/api/payment/initiate` | `POST` | Public / Owner |
| | `/api/payment/success` | `POST`, `GET` | Gateway callback |
| | `/api/payment/fail` | `POST`, `GET` | Gateway callback |
| | `/api/payment/cancel` | `POST`, `GET` | Gateway callback |
| | `/api/payment/ipn` | `POST` | Gateway IPN Webhook |
| **Admin** | `/api/admin/dashboard` | `GET` | Superadmin (Bearer) |
| | `/api/admin/owner` | `GET` | Admin (Session Cookie) |
| | `/api/admin/providers` | `GET` | Superadmin (Bearer) |
| | `/api/admin/providers/[id]/approve` | `POST` | Superadmin (Bearer) |
| | `/api/admin/providers/[id]/reject` | `POST` | Superadmin (Bearer) |
| **Diagnostics** | `/api/test_mongo` | `GET` | Public |

---

## 1. Authentication APIs

### `POST /api/auth/register`
Creates a pending Property Owner account and initiates an SSLCOMMERZ checkout session (৳499 activation fee).

- **Authentication:** None (Public)
- **Request Body (JSON):**
  ```json
  {
    "name": "string (required)",
    "email": "string (required)",
    "password": "string (required, min length: 6)",
    "phone": "string (optional)"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "requiresPayment": true,
      "gatewayUrl": "https://sandbox.sslcommerz.com/...",
      "message": "Registration initiated. Redirecting to SSLCOMMERZ checkout for ৳499 activation."
    }
    ```
  - `400 Bad Request`: Validation failure or payment initialization error.
  - `409 Conflict`: User already exists with `status: "Paid"`.
  - `500 Internal Server Error`: SSLCOMMERZ credentials missing or database error.

---

### `POST /api/auth/login`
Authenticates a user (via `.env` admin credentials or MongoDB users) and sets an HTTP-only `auth-token` cookie.

- **Authentication:** None (Public)
- **Request Body (JSON):**
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Signed in successfully",
      "user": {
        "id": "string",
        "email": "string",
        "name": "string",
        "role": "admin | owner | tenant | service_provider",
        "avatar": "string"
      },
      "redirectUrl": "/owner/dashboard"
    }
    ```
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials or pending activation payment.
  - `500 Internal Server Error`: Server failure.

---

### `POST /api/auth/logout`
Clears the `auth-token` session cookie.

- **Authentication:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

---

### `GET /api/auth/me`
Retrieves the profile of the currently authenticated session.

- **Authentication:** Cookie `auth-token` or `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "user": {
        "id": "string",
        "email": "string",
        "name": "string",
        "role": "string",
        "phone": "string",
        "property": "string",
        "unit": "string",
        "avatar": "string"
      }
    }
    ```
  - `200 OK (Unauthenticated)`: `{ "user": null }`

---

## 2. Owner: Properties APIs

### `GET /api/owner/properties` (also available via `/api/properties`)
Retrieves all properties owned by the authenticated owner (or all properties if caller is admin).

- **Authentication:** Required (`owner` or `admin`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "properties": [
        {
          "id": "string",
          "name": "string",
          "address": "string",
          "type": "Residential | Commercial | Mixed | Industrial",
          "totalUnits": 12,
          "status": "Active | Inactive | Maintenance",
          "ownerId": "string",
          "createdAt": "ISO date string",
          "updatedAt": "ISO date string"
        }
      ]
    }
    ```
  - `401 Unauthorized`: User account not found.
  - `403 Forbidden`: Role not authorized.

---

### `POST /api/owner/properties` (also available via `/api/properties`)
Creates a new property under the authenticated owner.

- **Authentication:** Required (`owner` or `admin`)
- **Request Body (JSON):**
  ```json
  {
    "name": "string (required)",
    "address": "string (required)",
    "type": "Residential | Commercial | Mixed | Industrial (required)",
    "totalUnits": 10,
    "status": "Active | Inactive | Maintenance (optional, default: Active)"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Property added successfully",
      "property": { "id": "...", "name": "..." }
    }
    ```
  - `400 Bad Request`: Validation failure.

---

### `GET /api/owner/properties/[propertyId]`
Fetches details of a specific property.

- **Authentication:** Required (`owner` or `admin`)
- **Path Parameters:**
  - `propertyId`: MongoDB ObjectId of the property.
- **Responses:**
  - `200 OK`: `{ "success": true, "property": { ... } }`
  - `400 Bad Request`: Invalid property ID.
  - `404 Not Found`: Property does not exist or unauthorized.

---

### `PATCH /api/owner/properties/[propertyId]`
Updates details of an existing property.

- **Authentication:** Required (`owner` or `admin`)
- **Path Parameters:** `propertyId`
- **Request Body (JSON):**
  ```json
  {
    "name": "string (optional)",
    "address": "string (optional)",
    "type": "string (optional)",
    "totalUnits": 10,
    "status": "string (optional)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Property updated successfully", "property": { ... } }`
  - `400 Bad Request`: Invalid ID or invalid fields.
  - `404 Not Found`: Property not found.

---

### `DELETE /api/owner/properties/[propertyId]`
Deletes a property and cascades deletion of its associated units and maintenance requests.

- **Authentication:** Required (`owner` or `admin`)
- **Path Parameters:** `propertyId`
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Property deleted successfully" }`
  - `404 Not Found`: Property not found.

---

## 3. Owner: Units APIs

### `GET /api/owner/unit`
Lists units, optionally filtered by `propertyId`.

- **Authentication:** Required (`owner` or `admin`)
- **Query Parameters:**
  - `propertyId` (optional): Filter units belonging to a specific property.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "units": [
        {
          "id": "string",
          "propertyId": "string",
          "propertyName": "string",
          "unitNumber": "string",
          "floor": 2,
          "bedrooms": 2,
          "bathrooms": 2,
          "sizeSqFt": 1100,
          "rentAmount": 25000,
          "depositAmount": 50000,
          "status": "Vacant | Occupied | Maintenance",
          "tenantName": "string",
          "tenantEmail": "string",
          "tenantPhone": "string"
        }
      ]
    }
    ```

---

### `POST /api/owner/unit`
Creates a new unit inside a property.

- **Authentication:** Required (`owner` or `admin`)
- **Request Body (JSON):**
  ```json
  {
    "propertyId": "string (required, ObjectId)",
    "unitNumber": "string (required)",
    "floor": 1,
    "bedrooms": 2,
    "bathrooms": 1,
    "sizeSqFt": 950,
    "rentAmount": 22000,
    "depositAmount": 44000,
    "status": "Vacant | Occupied | Maintenance"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "message": "Unit created successfully", "unit": { ... } }`
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Unit number already exists in this property.

---

### `GET /api/owner/properties/[propertyId]/units`
Finds units associated with a property.

- **Authentication:** Header `Authorization: Bearer <token>` (`superadmin` or `owner`)
- **Path Parameters:** `propertyId`
- **Responses:**
  - `200 OK`: Array of `Unit` documents.
  - `400 Bad Request`: Unauthorized or database query error.

---

### `PUT /api/owner/properties/[propertyId]/units/[unitId]`
Updates unit specifications (e.g. unit number, size).

- **Authentication:** Header `Authorization: Bearer <token>` (`owner`)
- **Path Parameters:** `propertyId`, `unitId`
- **Request Body (JSON):**
  ```json
  {
    "unitNumber": "string (required)",
    "size": "string | number (required)",
    "status": "string (optional)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Unit updated successfully", "unit": { ... } }`
  - `404 Not Found`: Unit not found.

---

### `DELETE /api/owner/properties/[propertyId]/units/[unitId]`
Deletes a unit by ID.

- **Authentication:** Header `Authorization: Bearer <token>` (`owner`)
- **Path Parameters:** `propertyId`, `unitId`
- **Responses:**
  - `200 OK`: `{ "message": "Unit deleted successfully" }`
  - `404 Not Found`: Unit not found.

---

## 4. Owner: Tenants APIs

### `GET /api/owner/tenants`
Returns all tenants created by the authenticated owner.

- **Authentication:** Required (`owner`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "tenants": [
        {
          "id": "string",
          "name": "string",
          "email": "string",
          "phone": "string",
          "property": "string",
          "unit": "string",
          "rentStatus": "Paid | Pending | Overdue",
          "leaseEnd": "string",
          "isActive": true,
          "createdAt": "ISO date string"
        }
      ]
    }
    ```

---

### `POST /api/owner/tenants`
Registers a new tenant account under the authenticated owner.

- **Authentication:** Required (`owner`)
- **Request Body (JSON):**
  ```json
  {
    "name": "string (required)",
    "email": "string (required)",
    "password": "string (required, min: 6)",
    "phone": "string (optional)",
    "property": "string (optional)",
    "unit": "string (optional)",
    "rentStatus": "Pending | Paid | Overdue (optional)",
    "leaseEnd": "YYYY-MM-DD (optional)"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "message": "Tenant created successfully", "tenant": { ... } }`
  - `409 Conflict`: Email already in use.

---

### `GET /api/owner/tenants/[id]`
Gets detailed information for a single tenant.

- **Authentication:** Required (`owner`)
- **Path Parameters:** `id` (Tenant user ID)
- **Responses:**
  - `200 OK`: `{ "success": true, "tenant": { ... } }`
  - `404 Not Found`: Tenant not found.

---

### `PATCH /api/owner/tenants/[id]` (and `PUT`)
Updates tenant information (contact details, unit assignment, rent status, or password).

- **Authentication:** Required (`owner`)
- **Path Parameters:** `id`
- **Request Body (JSON):**
  ```json
  {
    "name": "string (optional)",
    "email": "string (optional)",
    "phone": "string (optional)",
    "property": "string (optional)",
    "unit": "string (optional)",
    "rentStatus": "string (optional)",
    "leaseEnd": "string (optional)",
    "password": "string (optional, min: 6)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Tenant updated successfully", "tenant": { ... } }`
  - `400 Bad Request`: Validation failure.
  - `404 Not Found`: Tenant not found.

---

### `DELETE /api/owner/tenants/[id]`
Deletes a tenant account.

- **Authentication:** Required (`owner`)
- **Path Parameters:** `id`
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Tenant removed successfully" }`
  - `404 Not Found`: Tenant not found.

---

### `POST /api/owner/properties/[propertyId]/units/[unitId]/tenants`
Assigns a tenant document to a specific unit & property.

- **Authentication:** Header `Authorization: Bearer <token>` (`owner`)
- **Path Parameters:** `propertyId`, `unitId`
- **Request Body (JSON):**
  ```json
  {
    "name": "string (required)",
    "contactInfo": "string (required)",
    "leaseStart": "string (required)",
    "leaseEnd": "string (required)",
    "documents": "array (optional)",
    "notes": "string (optional)",
    "paymentDetails": "object (optional)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Tenant added successfully", "tenant": { ... } }`

---

## 5. Owner: Leases APIs

### `GET /api/owner/leases`
Lists leases for the owner.

- **Authentication:** Required (`owner` or `admin`)
- **Query Parameters:**
  - `status` (optional): `Active` | `Pending` | `Expired` | `Terminated`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "leases": [
        {
          "id": "string",
          "leaseId": "L-2026-1234",
          "ownerId": "string",
          "tenantId": "string",
          "tenant": "string",
          "tenantEmail": "string",
          "propertyName": "string",
          "unit": "string",
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "rent": 25000,
          "deposit": 50000,
          "billingCycle": "1st - 5th Monthly",
          "status": "Active"
        }
      ]
    }
    ```

---

### `POST /api/owner/leases`
Creates a new lease contract.

- **Authentication:** Required (`owner` or `admin`)
- **Request Body (JSON):**
  ```json
  {
    "tenant": "string (required, name)",
    "tenantEmail": "string (optional)",
    "tenantPhone": "string (optional)",
    "property": "string (required, property name)",
    "unit": "string (optional)",
    "startDate": "YYYY-MM-DD (required)",
    "endDate": "YYYY-MM-DD (required)",
    "rent": 20000,
    "deposit": 40000,
    "billingCycle": "1st - 5th Monthly (optional)",
    "status": "Active | Pending | Expired | Terminated (optional)",
    "terms": ["string"]
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "message": "Lease created successfully", "lease": { ... } }`
  - `400 Bad Request`: Validation failure.

---

### `GET /api/owner/leases/[id]`
Fetches details of a specific lease.

- **Authentication:** Required (`owner` or `admin`)
- **Path Parameters:** `id`
- **Responses:**
  - `200 OK`: `{ "success": true, "lease": { ... } }`
  - `404 Not Found`: Lease not found or unauthorized.

---

### `PATCH /api/owner/leases/[id]` (and `PUT`)
Updates an existing lease agreement.

- **Authentication:** Required (`owner` or `admin`)
- **Path Parameters:** `id`
- **Request Body (JSON):** Updatable fields (`tenant`, `property`, `unit`, `startDate`, `endDate`, `rent`, `deposit`, `billingCycle`, `status`, `terms`, `notes`).
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Lease updated successfully", "lease": { ... } }`
  - `400 Bad Request`: Invalid data.
  - `404 Not Found`: Lease not found.

---

### `DELETE /api/owner/leases/[id]`
Deletes a lease contract.

- **Authentication:** Required (`owner` or `admin`)
- **Path Parameters:** `id`
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Lease contract deleted successfully" }`

---

## 6. Owner: Invoices APIs

### `GET /api/owner/invoices` (also `/api/owner/properties/[propertyId]/units/[unitId]/invoices`)
Lists all tenant rent invoices generated by the owner, with active lease metadata.

- **Authentication:** Required (`owner`)
- **Query Parameters:**
  - `period` (optional): Filter by billing period formatted as `YYYY-MM`.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "invoices": [
        {
          "_id": "string",
          "invoiceNumber": "INV-2026-03-0001",
          "leaseId": "string",
          "tenantId": "string",
          "tenantName": "string",
          "propertyName": "string",
          "unit": "string",
          "billingPeriod": "2026-03",
          "rentAmount": 25000,
          "status": "Pending | Paid | Overdue",
          "dueDate": "ISO date string",
          "pdfGeneratedAt": "ISO date string"
        }
      ],
      "activeLeases": [ ... ]
    }
    ```

---

### `POST /api/owner/invoices`
Generates monthly invoices in batch for active leases.

- **Authentication:** Required (`owner`)
- **Request Body (JSON):**
  ```json
  {
    "leaseIds": ["string (required, ObjectId)"],
    "billingMonth": "YYYY-MM (required)",
    "dueDate": "YYYY-MM-DD (required)",
    "paymentInstructions": "string (optional, max 1000 chars)"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "message": "Generated 2 new invoices. 0 duplicates skipped.",
      "invoices": [ ... ],
      "duplicates": [ ... ]
    }
    ```
  - `400 Bad Request`: Validation failure.

---

### `PATCH /api/owner/invoices`
Batch or single update of invoice payment status.

- **Authentication:** Required (`owner`)
- **Request Body (JSON):**
  ```json
  {
    "invoiceId": "string (required, ObjectId)",
    "status": "Pending | Paid | Overdue (required)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Payment status updated to Paid.", "invoice": { ... } }`

---

### `GET /api/owner/invoices/[invoiceId]`
Fetches details of an individual invoice.

- **Authentication:** Required (`owner`)
- **Path Parameters:** `invoiceId`
- **Responses:**
  - `200 OK`: `{ "invoice": { ... } }`
  - `404 Not Found`: Invoice not found.

---

### `PATCH /api/owner/invoices/[invoiceId]` (and `PUT`)
Updates payment status on a specific invoice.

- **Authentication:** Required (`owner`)
- **Path Parameters:** `invoiceId`
- **Request Body (JSON):**
  ```json
  {
    "status": "Pending | Paid | Overdue (required)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Payment status updated to Paid.", "invoice": { ... } }`

---

### `POST /api/owner/invoices/[invoiceId]/send`
Sends an in-app and email notification to the tenant regarding an invoice.

- **Authentication:** Required (`owner`)
- **Path Parameters:** `invoiceId`
- **Responses:**
  - `200 OK`: `{ "message": "Invoice notification sent to John Doe." }`
  - `400 Bad Request`: Tenant account inactive.
  - `404 Not Found`: Invoice not found.

---

## 7. Owner: Maintenance & Payment Info

### `GET /api/owner/maintenance`
Fetches all maintenance requests across properties belonging to the authenticated owner.

- **Authentication:** Required (`owner`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "requests": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "category": "Plumbing | Electrical | HVAC | Appliance | Carpentry | Roofing | Pest Control | Other",
          "status": "Pending | Dispatched | In Progress | Resolved | Closed",
          "assignedTo": "string",
          "property": "string",
          "unit": "string",
          "tenant": "string",
          "tenantPhone": "string",
          "activityHistory": [ ... ]
        }
      ]
    }
    ```

---

### `PATCH /api/owner/maintenance`
Updates status and technician assignment for a maintenance request.

- **Authentication:** Required (`owner`)
- **Request Body (JSON):**
  ```json
  {
    "id": "string (required, ObjectId)",
    "status": "Pending | Dispatched | In Progress | Resolved | Closed (optional)",
    "assignedTo": "string (optional)"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Maintenance request updated successfully.",
      "request": { "id": "...", "assignedTo": "...", "status": "..." }
    }
    ```

---

### `GET /api/owner/payment-info`
Summarizes owner revenue, collection rate, pending payments, and recent transaction history.

- **Authentication:** Required (`owner`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "summary": {
        "totalCollected": 150000,
        "pendingAmount": 25000,
        "overdueAmount": 0,
        "collectionRate": 85.7
      },
      "transactions": [ ... ]
    }
    ```

---

## 8. Tenant Portal APIs

### `GET /api/tenant/rent-summary`
Fetches current tenant active lease rent summary, upcoming due date, and invoice ID.

- **Authentication:** Required (`tenant`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "rent": {
        "amount": 25000,
        "paymentFrequency": "Monthly",
        "dueDate": "2026-11-05",
        "status": "Pending | Paid | Overdue",
        "propertyName": "Green Valley Apartment",
        "unit": "4B",
        "invoiceId": "string"
      }
    }
    ```
  - `200 OK (No Lease)`: `{ "rent": null }`

---

### `GET /api/tenant/invoices`
Retrieves all invoices and notifications addressed to the authenticated tenant.

- **Authentication:** Required (`tenant`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "invoices": [ ... ],
      "notifications": [ ... ]
    }
    ```

---

### `GET /api/tenant/maintenance`
Lists maintenance requests submitted by the logged-in tenant.

- **Authentication:** Required (`tenant`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "requests": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "category": "Plumbing",
          "priority": "Medium",
          "status": "Pending",
          "assignedTo": "Unassigned",
          "unit": "4B",
          "createdAt": "ISO date string",
          "activityHistory": [ ... ]
        }
      ]
    }
    ```

---

### `POST /api/tenant/maintenance`
Submits a new maintenance request linked to the tenant's active lease.

- **Authentication:** Required (`tenant`)
- **Request Body (JSON):**
  ```json
  {
    "title": "string (required)",
    "category": "Plumbing | Electrical | HVAC | Appliance | Carpentry | Roofing | Pest Control | Other (required)",
    "description": "string (optional)"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Maintenance request submitted successfully.",
      "request": { ... }
    }
    ```
  - `400 Bad Request`: Missing active lease or invalid category.

---

## 9. Invoices & PDF Export

### `GET /api/invoices/[invoiceId]/pdf`
Generates and serves a formatted PDF document of an invoice.

- **Authentication:** Required (`owner` or `tenant`)
- **Path Parameters:** `invoiceId`
- **Responses:**
  - `200 OK`: Raw PDF binary stream
    - Header: `Content-Type: application/pdf`
    - Header: `Content-Disposition: attachment; filename="Rentora-Invoice-<id>.pdf"`
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Unauthorized user role.
  - `404 Not Found`: Invoice not found.

---

## 10. Notifications & Lease Expiry Reminders

### `GET /api/notifications`
Checks for upcoming lease expirations (30, 15, 7 days), creates reminders, and returns all in-app notifications with unread counts.

- **Authentication:** Required (`owner` or `tenant`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "notifications": [
        {
          "id": "string",
          "title": "Lease expires in 15 days",
          "message": "...",
          "type": "lease-expiry | invoice",
          "readAt": "ISO date string or null",
          "createdAt": "ISO date string",
          "details": { ... }
        }
      ],
      "unreadCount": 3,
      "preferences": {
        "leaseExpiry": { "daysBefore": [30, 15, 7] }
      }
    }
    ```

---

### `PUT /api/notifications`
Updates lease reminder timing preferences for the user.

- **Authentication:** Required (`owner` or `tenant`)
- **Request Body (JSON):**
  ```json
  {
    "preferences": {
      "leaseExpiry": {
        "daysBefore": [30, 15, 7]
      }
    }
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "preferences": { ... } }`

---

### `PATCH /api/notifications`
Marks a notification as read.

- **Authentication:** Required (`owner` or `tenant`)
- **Request Body (JSON):**
  ```json
  {
    "notificationId": "string (required, ObjectId)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "unreadCount": 2 }`
  - `404 Not Found`: Notification not found.

---

## 11. Service Provider Job History

### `GET /api/provider-job-history`
Aggregates job completion stats and customer feedback for service providers across resolved maintenance tickets.

- **Authentication:** Required (`owner` or `admin`)
- **Query Parameters:**
  - `provider` (optional): Filter by technician name.
  - `property` (optional): Filter by property ObjectId.
  - `from` (optional): Start date (`YYYY-MM-DD`).
  - `to` (optional): End date (`YYYY-MM-DD`).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "jobs": [
        {
          "id": "string",
          "issue": "string",
          "completionDate": "ISO date string",
          "provider": "Technician Name",
          "property": "Property Name",
          "tenant": "Tenant Name",
          "unit": "Unit 2A",
          "rating": 5,
          "comment": "Fast repair"
        }
      ],
      "providers": ["Technician A", "Technician B"],
      "properties": [{ "id": "...", "name": "..." }],
      "summaries": [
        {
          "provider": "Technician A",
          "completedJobs": 14,
          "averageRating": 4.8,
          "ratedJobs": 10
        }
      ]
    }
    ```

---

## 12. Payment Gateway (SSLCOMMERZ Sandbox)

### `POST /api/payment/initiate`
Initiates a payment session for ৳499 Owner Activation.

- **Authentication:** Public
- **Request Body (JSON):**
  ```json
  {
    "name": "string (optional)",
    "email": "string (required)",
    "phone": "string (optional)"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "gatewayUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?...",
      "tran_id": "RENTORA_1730000000000_123",
      "sessionkey": "string"
    }
    ```
  - `500 Internal Server Error`: Missing server gateway credentials.

---

### `POST /api/payment/success` & `GET /api/payment/success`
Callback endpoint invoked by SSLCOMMERZ upon successful transaction. Validates transaction via server-to-server call to SSLCOMMERZ validation API, activates owner status to `Paid`, updates the registration invoice, and redirects to `/login?payment=success`.

- **Payload:** `multipart/form-data` (received from SSLCOMMERZ gateway)
- **Response:** HTTP 303 Redirect to `/login?payment=success&email=...`

---

### `POST /api/payment/fail` & `GET /api/payment/fail`
Callback invoked when user payment fails. Updates user status to `Failed` and redirects to `/login?payment=failed`.

- **Response:** HTTP 303 Redirect to `/login?payment=failed`

---

### `POST /api/payment/cancel` & `GET /api/payment/cancel`
Callback invoked when user cancels checkout. Redirects to `/login?payment=cancelled`.

- **Response:** HTTP 303 Redirect to `/login?payment=cancelled`

---

### `POST /api/payment/ipn`
Instant Payment Notification (IPN) webhook for SSLCOMMERZ server-to-server asynchronous status notification.

- **Request:** `multipart/form-data` containing `val_id`, `tran_id`, `value_a`.
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "IPN verified and status updated to Paid" }`
  - `400 Bad Request`: Payment verification failed.
  - `502 Bad Gateway`: SSLCOMMERZ validator server error.

---

## 13. Admin & Superadmin APIs

### `GET /api/admin/dashboard`
Fetches global platform metrics (active tenant, owner, approved provider counts, properties, and maintenance requests).

- **Authentication:** Header `Authorization: Bearer <token>` (`superadmin`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "tenants": 45,
      "owners": 12,
      "providers": 8,
      "properties": 19,
      "pendingRegistrations": 2,
      "payments": 34,
      "maintenanceRequests": 15
    }
    ```
  - `400 Bad Request`: Unauthorized or invalid token.

---

### `GET /api/admin/owner`
Retrieves list of property owners for administrative review.

- **Authentication:** Cookie `auth-token` (`admin`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "owners": [
        {
          "id": "1",
          "name": "Rahim Ahmed",
          "email": "rahim@example.com",
          "status": "Pending"
        }
      ]
    }
    ```
  - `401 Unauthorized`: Not logged in.
  - `403 Forbidden`: Admin role required.

---

### `GET /api/admin/providers`
Retrieves all service providers with `status: "pending"`.

- **Authentication:** Header `Authorization: Bearer <token>` (`superadmin`)
- **Responses:**
  - `200 OK`: Array of pending provider records.

---

### `POST /api/admin/providers/[id]/approve`
Approves a pending service provider and records an audit log.

- **Authentication:** Header `Authorization: Bearer <token>` (`superadmin`)
- **Path Parameters:** `id` (Provider ObjectId)
- **Responses:**
  - `200 OK`: `{ "message": "Provider approved" }`
  - `404 Not Found`: Provider not found.

---

### `POST /api/admin/providers/[id]/reject`
Rejects a service provider with a stated reason and logs the decision.

- **Authentication:** Header `Authorization: Bearer <token>` (`superadmin`)
- **Path Parameters:** `id` (Provider ObjectId)
- **Request Body (JSON):**
  ```json
  {
    "reason": "string (required)"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Provider rejected", "reason": "..." }`
  - `404 Not Found`: Provider not found.

---

## 14. Diagnostics & Testing

### `GET /api/test_mongo`
Verifies MongoDB connectivity, active database name, and user collection counts.

- **Authentication:** None (Public)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "✅ MongoDB Connected Successfully!",
      "database": "rentora",
      "userCount": 24,
      "users": [ ... ]
    }
    ```
  - `500 Internal Server Error`: Database connection failure.
