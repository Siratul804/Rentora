# Maintenance Selenium Test Cases

Run the Selenium suite against a local Next.js server only:

```powershell
npm run test:maintenance
```

The suite uses configured owner and tenant test credentials or existing demo defaults. It blocks notification API calls to prevent reminder generation, and uses in-browser API mocks for submission and status changes so those checks do not create or alter records. One database check is read-only and verifies existing request and notification fixtures. Do not point the suite at a production URL.

## Test cases

| Test Case ID | Description | Preconditions | Test Steps | Expected Results | Actual Results | Status |
|---|---|---|---|---|---|---|
| MAINT-001 | Tenant opens maintenance submission | Active tenant test account | Sign in and open Maintenance from tenant navigation | Submission form and request list display | Form and request list displayed | Pass |
| MAINT-002 | Tenant views saved requests; owner maintenance API is available | Tenant and owner fixtures with saved requests | Read tenant request API, then owner maintenance API | Tenant gets own request list; owner endpoint responds with its non-closed request list | Both endpoints returned authorized request lists | Pass |
| MAINT-003 | Empty issue summary is blocked | Signed-in tenant | Check the form with its required issue field empty | Browser validity prevents submission | Browser validation blocked the empty form | Pass |
| MAINT-004 | Successful request submission UI flow | Signed-in tenant | Submit a title, trade category, and notes against a Selenium-mocked API | Success message and new request display; submitted fields match | Success message, request listing, and submitted fields verified (mocked; no DB write) | Pass |
| MAINT-005 | Submission failure is displayed | Signed-in tenant | Submit a request against a Selenium-mocked failing API response | The simulated server error is displayed to the tenant | Error displayed (mocked failure response) | Pass |
| MAINT-006 | API rejects missing issue summary and invalid trade category | Signed-in tenant | POST a request without a title, then one with an invalid category | Both requests return HTTP 400 with validation errors | Both invalid requests returned HTTP 400 | Pass |
| MAINT-007 | Owner assignment/status workflow | Signed-in owner | Assign a mock request, set In Progress, Resolved, and Closed | Updates are sent; closed request disappears from active maintenance list | Status changes verified; closed request removed from active list (mocked; no DB write) | Pass |
| MAINT-008 | Owner API rejects invalid request ID and status | Signed-in owner | PATCH with malformed ID and with an unsupported status | Both requests return HTTP 400 | Both invalid updates returned HTTP 400 | Pass |
| MAINT-009 | Tenant/admin cannot use owner maintenance API | Signed-in tenant and admin | GET owner maintenance API as each role | Both requests return HTTP 403 | Tenant and admin requests returned HTTP 403 | Pass |
| MAINT-010 | Owner cannot submit or view tenant maintenance requests | Signed-in owner | GET and POST tenant maintenance API | Both requests return HTTP 403 | Both requests returned HTTP 403 | Pass |
| MAINT-011 | Stored maintenance records and notifications preserve relationships | Existing tenant, owner, property, request, and notification fixtures in configured database | Read related documents; verify property ownership, unit, linked notification title, and in-app channel | Requests and notifications have valid linked records and expected details | Existing request/property/unit links and matching in-app notification details verified (read-only) | Pass |

## Scope aligned to the current project

- Maintenance submission currently requires an issue summary and one of the supported trade categories; priority defaults to Medium. The tenant form has no attachment upload or priority input.
- Owner maintenance currently offers status assignment/updates, but no staff/provider selection or due-date input. The Owner API supports an assignment string, but the management page does not provide provider dispatch.
- Closed requests are hidden from the active owner maintenance list. Historical database records remain associated with the tenant.
- Submission and status-change success flows are UI-tested with mocked API responses to avoid writing to the configured remote database. The database check validates existing records only; it does not claim that a new request was persisted or that a new notification was emitted during this run.
- Notification preference suppression, notification-service outage, invalid recipients, request detail-by-ID, deleted-request lookup, attachments, and due-date validation are not separate test cases: they do not have corresponding current workflow/API support or require mutating the remote database.
- The app currently exposes owner and tenant maintenance APIs; admin/provider assignment and admin maintenance API access are not part of the current maintenance API behavior.

## Execution record

| Suite | Passed | Failed | Skipped | Execution date |
|---|---:|---:|---:|---|
| `npm run test:maintenance` | 11 | 0 | 0 | 2026-11-04 |
