# Rentora Maintenance & Tenant Testing

## Test Environment
- Application: Rentora
- Base URL: http://localhost:3000
- Automation: Selenium WebDriver with Node.js
- Browser: Google Chrome
- Test execution status: Not executed unless explicitly updated below

## Test Cases

| Test Case ID | Description | Preconditions | Test Steps | Expected Results | Actual Results | Pass/Fail |
|---|---|---|---|---|---|---|
| MNT-001 | Open tenant maintenance page | App is running; tenant access is available | Open /tenant/maintenance | Maintenance form and request list appear | Not executed | Not Run |
| MNT-002 | Submit a valid maintenance request | Tenant page is open | Enter title and description; submit | Request is created and appears in the list | Not executed | Not Run |
| MNT-003 | Submit with empty title | Tenant page is open | Leave title empty; submit | Submission is blocked and validation is shown | Not executed | Not Run |
| MNT-004 | Submit with empty description | Tenant page is open | Enter title; leave description empty; submit | Required-description validation appears | Not executed | Not Run |
| MNT-005 | Submit request through API with valid data | App is running | POST description and priority to /api/tenant/maintenance | HTTP 201 and success response | Not executed | Not Run |
| MNT-006 | Submit API request without description | App is running | POST priority without description | HTTP 400 with validation message | Not executed | Not Run |
| MNT-007 | Submit API request without priority | App is running | POST description without priority | HTTP 400 with validation message | Not executed | Not Run |
| MNT-008 | Retrieve maintenance requests | App is running | GET /api/tenant/maintenance | Only authorized tenant requests are returned | Current code returns an empty list; verify after execution | Not Run |
| MNT-009 | Track a submitted request | Request exists | Open tenant request list and locate request | Saved request and current status appear | Not executed | Not Run |
| MNT-010 | Open owner maintenance page | Owner access is available | Open /owner/maintenance | Owner can review maintenance requests | Not executed | Not Run |
| MNT-011 | Dispatch a technician | Owner page is open; eligible provider exists | Select Dispatch Tech for a pending request | Provider assignment is saved and visible | Not executed | Not Run |
| MNT-012 | Reassign a technician | Request is already assigned | Change assigned provider | New provider is saved and displayed | Not executed | Not Run |
| MNT-013 | Update maintenance status | Authorized owner/admin access exists | Change request status | Updated status is saved and visible to authorized users | Not executed | Not Run |
| MNT-014 | Unauthorized tenant accesses another tenant's request | Two tenant accounts exist | Sign in as tenant A and request tenant B's record | Access is denied | Not executed | Not Run |
| MNT-015 | Tenant attempts dispatch/status update | Tenant account exists | Attempt owner-only assignment or status action | Access is denied | Not executed | Not Run |
| MNT-016 | Verify request database record | Database connection and test data are available | Submit a request and inspect the database | Request, tenant, property and unit relationships are stored correctly | Not executed | Not Run |
| MNT-017 | Verify notification on request creation | Notification service is configured | Submit a request and inspect notification records | Intended recipient is notified and delivery status is recorded | Not executed | Not Run |
| MNT-018 | Submit invalid attachment | Attachment support is implemented | Upload a disallowed file type | File is rejected with a clear error | Not executed | Not Run |
| MNT-019 | Submit oversized attachment | Attachment size limit is configured | Upload a file exceeding the limit | Upload is rejected with a clear error | Not executed | Not Run |
| MNT-020 | Verify historical requests | Saved historical requests exist | Open the tenant request list | Authorized historical requests are available | Not executed | Not Run |

## Initial Code Review Findings

1. Tenant form currently adds a request to local React state instead of calling the maintenance API.
2. The tenant form checks the title but does not require the description.
3. The API requires description and priority, but the visible form does not show a priority field.
4. The API GET handler returns an empty request list.
5. The API POST handler creates a response object; persistent database storage is not shown in the inspected code.
6. Notification delivery is not verified by the success message alone.
7. Owner assignment and role-based access require further implementation review and execution.

## Execution Rules
- Mark Pass only after observing the expected result.
- Mark Fail when the observed result differs from the expected result.
- Mark Blocked when a prerequisite, account, service, or feature is unavailable.
- Record actual results, errors, and evidence for every executed test.
- Do not claim database persistence, notification delivery, or authorization without verification.

## Definition of Done
- Positive and negative cases executed.
- Tenant workflow and owner dispatch tested.
- Notifications and role-based access verified.
- Database relationships and stored status verified.
- Actual results and evidence recorded.
- Outstanding defects documented and reviewed.

## API Test Execution — 2026-10-29

| Test Case ID | Actual Results | Pass/Fail |
|---|---|---|
| MNT-API-001 | HTTP 201; success=true; ticket number returned | PASS |
| MNT-API-002 | HTTP 400; required-field validation returned | PASS |
| MNT-API-003 | HTTP 400; required-field validation returned | PASS |
| MNT-API-004 | HTTP 400; required-field validation returned | PASS |

API Test Summary: 4 PASS, 0 FAIL/ERROR.

Note: These tests validate API responses only. They do not prove database persistence, notification delivery, or role-based access control.

## Tenant Maintenance Page Test Execution — 2026-10-29

| Test Case ID | Actual Result | Pass/Fail |
|---|---|---|
| MNT-001 | GET /tenant/maintenance returned HTTP 200; response HTML contains "maintenance" | PASS |

Note: This is a basic HTTP response check. Browser rendering, form submission, authentication, and tracking are not verified by this test.

## Manual UI Test Execution — 2026-10-29

| Test Area | Actual Result | Status |
|---|---|---|
| Tenant request submission | Success message displayed | PASS - UI only |
| Tenant request tracking | New request appeared before refresh | PASS - UI only |
| Persistence after refresh | Request disappeared after refresh | FAIL |
| Owner maintenance page | Page opened successfully | PASS - UI only |
| Dispatch & assignment | Status changed to Dispatched and provider name appeared | PASS - UI only |
| Dispatch success notification | No success message appeared | NEEDS INVESTIGATION |
| Tenant status tracking after dispatch | Request was not visible on tenant page | FAIL |

### Findings
1. Tenant-created request disappeared after browser refresh.
2. Tenant did not see the dispatched request on the tenant maintenance page.
3. Dispatch status and assigned provider were visible on the owner page, but database persistence has not been verified.
4. Notification delivery has not been verified. A UI message alone does not prove that a notification was sent.

Note: These are manual UI observations. Database persistence, authorization, and actual notification delivery remain unverified.

## Notification Testing Status — 2026-10-29

| Test Case | Actual Result | Status |
|---|---|---|
| Notify tenant when request status changes | Notification feature not implemented | BLOCKED |
| Notify owner when tenant submits a request | Notification feature not implemented | BLOCKED |
| Notify assigned provider after dispatch | Notification feature not implemented | BLOCKED |
| Notification preference disabled | Cannot test; notification feature not implemented | BLOCKED |
| Invalid notification recipient / service unavailable | Cannot test; notification feature not implemented | BLOCKED |

### Note
The notification feature has not been implemented yet. Therefore, notification delivery, recipient validation, notification preferences, and service-failure handling could not be tested. UI success messages do not confirm that notifications were actually sent.

## RBAC Code Review — 2026-10-29

| Test Area | Finding | Status |
|---|---|---|
| Tenant identity verification | Tenant identity is not verified in the reviewed POST code | FAIL - code review |
| Request ownership validation | Ownership check is not present in the reviewed code | FAIL - code review |
| Unauthenticated submission prevention | Session/role validation is not present in the reviewed POST code | FAIL - code review |
| Tenant access to another tenant's requests | Requires further runtime testing and full GET-handler review | NOT VERIFIED |

### Findings
The reviewed POST handler accepts tenant details from the request body and constructs a maintenance request object. The reviewed code does not show authentication, role validation, ownership validation, or database persistence. These are security and functionality gaps that require investigation.

Note: This review covers the supplied code section only. It does not prove that no protections exist elsewhere in the application.

## Maintenance & Tenant Testing — Summary
**Execution Date:** 2026-10-29

### Test Results

| Area | Result | Notes |
|---|---|---|
| API validation | 4 PASS | Valid request and missing required fields |
| Tenant page availability | PASS | HTTP 200 received |
| Tenant request submission | PASS - UI only | Success message displayed |
| Tenant request tracking | FAIL | Request disappeared after refresh |
| Owner maintenance page | PASS - UI only | Page opened |
| Dispatch & assignment | PASS - UI only | Dispatched status and provider name visible |
| Tenant tracking after dispatch | FAIL | Request not visible to tenant |
| Database persistence | NOT VERIFIED | Save operation not confirmed |
| Notifications | BLOCKED | Feature not implemented |
| RBAC | FAIL - code review | Authentication and ownership checks not shown in reviewed API code |

### Overall Assessment
Testing is partially complete. API validation and selected UI flows were exercised, but maintenance request persistence, tenant-owner synchronization, notifications, and role-based access control require further implementation or verification.

### Outstanding Work
1. Persist maintenance requests in the database.
2. Load tenant requests from persistent storage and filter by authenticated tenant.
3. Ensure owner dispatch updates are visible to the correct tenant.
4. Implement and test notifications.
5. Enforce authentication, role checks, and request ownership.
6. Complete remaining negative tests and record actual results.

**Final Status: IN PROGRESS — Do not mark the task Done until outstanding items are resolved and verified.**
