# Maintenance Request Test Cases

## Scope and execution notes

This test pack describes the maintenance functionality present in Rentora today. It does not imply support for fields, endpoints, or roles that are not implemented. Run database-backed cases only in a non-production environment with test accounts and test records.

The current tenant form submits a required **Issue Summary** (`title`), a required trade category, and optional detailed notes (`description`). It does not offer a priority selector or attachment upload. New requests are saved as `Pending`; the maintenance schema's default priority is `Medium`. The tenant view lists requests and shows the summary, category, submitted date, status, and assignment, but does not have a request-detail route.

Owner maintenance management is owner-only. An owner can list requests for their account and update a request's free-text `assignedTo` and/or status. The accepted statuses are `Pending`, `Assigned`, `Dispatched`, `In Progress`, `Done`, `Resolved`, and `Closed`. The update endpoint does not accept a due date or validate an assigned person/provider against a staff/provider directory. There is no admin maintenance-management API. Provider job history is a separate read-only view for owners/admins; completed statuses are `Resolved` and `Closed`, and normal history results require an assignment.

For each runnable case, record the actual result and mark **Pass**, **Fail**, **Blocked**, or **Not Run**. Use **N/A — unsupported** only in the actual-result/status fields for cases identified as unsupported. Do not mark an unexecuted or unsupported case as passed.

## Execution record

| Field | Value |
|---|---|
| Build / commit | |
| Test environment / URL | |
| Browser / device | |
| Tester / date | |
| Owner test account / ID | |
| Tenant test account / ID | |
| Property / unit / active lease IDs | |
| Maintenance request IDs | |
| Notification / audit-log IDs | |

## Tenant request submission and tracking

| ID | Description | Preconditions | Test steps | Expected result | Actual result | Status |
|---|---|---|---|---|---|---|
| MNT-TNT-001 | Open tenant maintenance page | Active tenant test account. | Sign in as tenant and open Maintenance & Repairs. | Submission form and the tenant's request list load. | | Not Run |
| MNT-TNT-002 | Submit a valid maintenance request | Tenant has an active lease linked to an existing property. | Enter an issue summary, choose a listed trade category, optionally enter detailed notes, and submit. | Success feedback appears; one request is created with `Pending` status and `Unassigned` assignment. | | Not Run |
| MNT-TNT-003 | Link new request to tenant, property, unit, and owner | MNT-TNT-002 completed; database read access available. | Inspect the created maintenance record and its referenced user/property/lease. | `tenantId`, `propertyId`, `ownerId`, and unit correspond to the tenant's active lease and owner. | | Not Run |
| MNT-TNT-004 | Reject missing or whitespace-only issue summary | Authenticated tenant with an active lease. | Submit with an empty summary, then with whitespace only. | Client required-field validation or API validation prevents creation; an error is shown; no request is stored. | | Not Run |
| MNT-TNT-005 | Reject missing or invalid trade category | Authenticated tenant with an active lease; API test access. | Submit without a category and then with a category outside Plumbing, Electrical, HVAC, Carpentry, or Appliance. | API rejects the request with a validation response; no record is created. | | Not Run |
| MNT-TNT-006 | Submit optional notes | Authenticated tenant with an active lease. | Submit a valid request with detailed notes and preferred-time text. | Request succeeds and the notes are saved in `description`. | | Not Run |
| MNT-TNT-007 | Reject request when tenant has no active lease | Authenticated tenant without an active lease. | Submit a valid summary and category. | Request is not created; the API explains that an active lease is required. | | Not Run |
| MNT-TNT-008 | Handle a persistence failure | Controlled non-production database failure can be induced. | Submit a valid request while database persistence is unavailable. | UI shows an error and does not add a success-shaped request; no request record is created. | | Not Run |
| MNT-TNT-009 | Tenant views own request history | Tenant has submitted requests. | Open or refresh Maintenance & Repairs. | Only the signed-in tenant's requests are listed, newest first, with summary, category, date, status, and assignment. | | Not Run |
| MNT-TNT-010 | Request status and assignment refresh | Owner has changed a tenant request's status or assignment. | Refresh the tenant maintenance page. | The tenant view reflects the latest status and assigned-to text. | | Not Run |
| MNT-TNT-011 | Tenant cannot list requests without tenant role | Use an owner session, then an unauthenticated session. | Request `GET /api/tenant/maintenance` in each session. | Neither session receives tenant request data; endpoint rejects each request. | | Not Run |
| MNT-TNT-012 | Historical requests remain listed | Tenant has older and newer requests, including completed statuses. | Refresh the tenant maintenance page and inspect all returned records. | The tenant list retains historical records; it does not silently remove completed requests. | | Not Run |

## Owner assignment and status management

| ID | Description | Preconditions | Test steps | Expected result | Actual result | Status |
|---|---|---|---|---|---|---|
| MNT-OWN-001 | Owner lists maintenance requests | Owner has maintenance requests. | Sign in as the owner and load the owner maintenance view/API. | Owner sees requests scoped to their owner ID with tenant/property/unit context where available. | | Not Run |
| MNT-OWN-002 | Owner assigns free-text provider/staff name | Owner has an unassigned request. | Submit an owner update with the request ID and a non-empty `assignedTo` value. | Assignment text is saved and an activity-history entry is created. | | Not Run |
| MNT-OWN-003 | Owner reassigns a request | Owner has a request assigned to one name. | Change `assignedTo` to a different non-empty value. | Current assignment changes and activity history records the reassignment. | | Not Run |
| MNT-OWN-004 | Owner updates status | Owner has a request. | Update status through each supported value: Pending, Assigned, Dispatched, In Progress, Done, Resolved, and Closed. | Each supported value is saved and added to activity history; `completedAt` is set for Done, Resolved, or Closed and cleared for non-terminal statuses. | | Not Run |
| MNT-OWN-005 | Reject malformed request ID | Authenticated owner; API test access. | PATCH owner maintenance with a malformed request ID. | API returns a client error and changes no record. | | Not Run |
| MNT-OWN-006 | Reject invalid status | Authenticated owner with an existing request. | PATCH with a status not in the supported status list. | API returns a validation error; status and history remain unchanged. | | Not Run |
| MNT-OWN-007 | Reject blank assignment | Authenticated owner with an existing request. | PATCH with `assignedTo` as an empty or whitespace-only string. | API returns a validation error; assignment and history remain unchanged. | | Not Run |
| MNT-OWN-008 | Tenant cannot assign or change status | Tenant has an existing request. | Attempt to PATCH `/api/owner/maintenance` with assignment and status changes. | Request is rejected; assignment, status, and activity history remain unchanged. | | Not Run |
| MNT-OWN-009 | Owner cannot access another owner's requests | Two owners have separate requests. | As Owner A, list requests and PATCH a request ID belonging to Owner B. | Owner A cannot view or update Owner B's request; the other owner's data remains unchanged. | | Not Run |
| MNT-OWN-010 | Unauthenticated owner management is denied | No authenticated session. | GET and PATCH `/api/owner/maintenance`. | Both operations are rejected and return no private maintenance data. | | Not Run |

## Notifications and persistence

| ID | Description | Preconditions | Test steps | Expected result | Actual result | Status |
|---|---|---|---|---|---|---|
| MNT-NOT-001 | Notify owner when tenant submits a request | Tenant has an active lease; owner exists and maintenance-submitted preference is enabled. | Submit a valid tenant request; inspect owner notifications. | Owner receives an in-app `maintenance-submitted` notification linked to the tenant, owner, and request, with request/property/unit context. | | Not Run |
| MNT-NOT-002 | Notify tenant when owner assigns or updates a request | Request exists; tenant's maintenance-updated preference is enabled. | Change assignment and then status as owner; inspect tenant notifications after each update. | Tenant receives `maintenance-updated` notifications containing the request title, current status, and assignment when assigned. | | Not Run |
| MNT-NOT-003 | Disabled event preference suppresses notification | Relevant recipient preference can be changed in the notification preferences UI. | Disable the applicable maintenance event, trigger it, and inspect notifications. | No in-app notification is created for the disabled event; verify whether the underlying maintenance action succeeds independently. | | Not Run |
| MNT-NOT-004 | Optional notification channel failure is recorded | Controlled non-production email/SMS provider failure; in-app notifications enabled. | Enable an optional channel and trigger a notification while that channel is unavailable. | In-app behavior remains observable; AuditLog records delivery outcome for the optional channel, including failure/not-configured status as applicable. | | Not Run |
| MNT-NOT-005 | Validate request and activity-history persistence | A request has been submitted and updated. | Query its database record after creation, assignment, and status changes. | Required references, title, description, category, priority default, status, assignment, timestamps, and activity history match observed actions. | | Not Run |
| MNT-NOT-006 | Validate notification and delivery audit records | A maintenance notification has been triggered. | Query Notification and AuditLog records by request ID and recipient ID. | Notification type, request/tenant/owner/recipient references, message/details, delivered channels, and delivery audit records correspond to the event. | | Not Run |
| MNT-NOT-007 | Verify owner status change appears in provider job history | Owner has assigned a request and changed its status to Resolved or Closed. | Open provider job history as the owner and as admin; query the history API. | Resolved/Closed assigned requests appear as completed jobs; active statuses do not appear in normal completed-history results. | | Not Run |

## Project behavior boundaries

The following requested scenarios do not currently match an implemented maintenance UI/API. They are recorded for scope clarity and are **not executable acceptance tests** for the current project version.

| Requested scenario | Current project behavior | Test disposition |
|---|---|---|
| Required issue-description field separate from issue summary | The form requires Issue Summary (`title`). Detailed notes (`description`) are optional. | Do not test description as a required field. |
| Tenant-selected priority level and missing-priority validation | The form has no priority input. The model defaults priority to Medium; the create API does not accept/validate a tenant-selected priority. | Excluded from runnable tests. |
| Attachment type/size validation, upload, preview, persistence, and retrieval | The tenant maintenance form and create API do not implement attachment upload. The model has an attachments field, but no upload flow is exposed. | Excluded from runnable tests. |
| Dedicated tenant request-detail view, invalid/deleted detail ID, and detail-history view | Tenant API exposes list and create only; there is no request-specific detail route. List output includes no request activity history. | Excluded from runnable tests. |
| Status named Open | The implemented initial status is Pending. Other accepted owner-update statuses are listed above. | Test Pending, not Open. |
| Due-date assignment | Owner PATCH accepts `id`, `assignedTo`, and `status`; it does not update `dueDate`. | Excluded from runnable tests. |
| Validated staff/provider assignment | Assignment is free text and is not checked against a staff/provider record. | Test free-text persistence only; do not assert directory validation. |
| Admin system-wide maintenance list and updates | No admin maintenance-management API exists. Owner maintenance GET/PATCH require the owner role. | Excluded from runnable tests; admin can test the separate provider job-history read view only. |
| Notification preference disabled and notification service unavailable | In-app notifications are suppressed when the event preference is disabled. Optional email/SMS delivery outcomes are audited. In-app database/service failure is not independently simulated by the normal UI flow. | Test preference and configured optional-channel behavior only in a controlled environment. |

## Sign-off

| Field | Value |
|---|---|
| Runnable cases passed / failed / blocked / not run | |
| Unsupported cases reviewed | |
| Defects linked | |
| QA reviewer / date | |
| Approval | |

**Execution status:** Not Run until an authorized tester executes the cases in a non-production environment. This document is test documentation only; unsupported scenarios above do not imply planned implementation work.
