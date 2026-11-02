# Rentora Owner-to-Tenant E2E Test Pack

## Scope and usage

This document is aligned to the current Rentora routes and UI. It is test documentation only; it does not request or imply application changes. Execute against a non-production environment with a reachable MongoDB and dedicated test accounts/data. The tenant online payment flow uses the SSLCommerz sandbox and requires configured sandbox credentials plus callback URLs reachable by the gateway. Never use real tenant credentials or payment details.

Record each case's actual result and set Status to `Pass`, `Fail`, `Blocked`, or `Not Run`. Attach screenshots, request/response evidence, and sanitized database query results where appropriate. A blocked or unsupported behavior is not a pass. Use unique test-specific property, unit, tenant, lease, invoice, and maintenance names/IDs. Clean up only test records using the approved environment process.

## Project behavior notes and exclusions

- Unit creation uses `POST /api/owner/unit` and is scoped to an owner-owned property. Owner tenant creation uses `POST /api/owner/tenants`; an active lease is created through `POST /api/owner/leases`.
- Lease creation accepts a property ID, but the owner lease page's form submits property name and unit, not a property ID. Therefore, a lease created through that UI may have `propertyId: null`; this test pack verifies the fields as currently saved and records the relationship result rather than assuming it exists.
- Owner invoice generation uses `POST /api/owner/invoices` with lease ID(s), billing period, due date, and optional payment instructions. Invoice generation creates an `invoice-generated` notification. Duplicate lease/month invoices return a conflict.
- Tenant rent payments use the SSLCommerz sandbox. A verified callback updates the rent Invoice to `Paid`, stores the transaction/validation IDs on that Invoice, updates the tenant's `rentStatus`, and writes an AuditLog event. There is no separate Payment collection/model in this rent-payment flow. No payment-success notification is created by the current callback; invoice-generation and maintenance notifications are separate existing events.
- The tenant maintenance form accepts issue summary, category, and optional notes. The API sets status to `Pending` and uses the schema's default priority, `Medium`. There is no maintenance attachment upload in the current form/API, so upload validation/persistence cases are unsupported here.
- The tenant maintenance API lists and creates requests, but has no request-specific detail route. Owner maintenance GET/PATCH is owner-only; no admin maintenance-management API is present. Owner updates accept free-text assignment and statuses `Pending`, `Assigned`, `Dispatched`, `In Progress`, `Done`, `Resolved`, or `Closed`. They do not accept due dates or verify an assignee against a staff/provider directory.
- The provider job history route is read-only for owners/admins. Its normal result includes completed `Resolved` and `Closed` requests with a non-empty assignment. The initial maintenance status is `Pending`; there is no `Open` status.

## Execution record

| Field | Value |
|---|---|
| Build / commit | |
| Environment / base URL | |
| MongoDB environment (test/staging) | |
| Browser / device | |
| Tester / date | |
| Owner test ID | |
| Tenant test ID | |
| Property / unit / lease IDs | |
| Invoice ID / billing period / transaction ID | |
| Maintenance request ID | |
| Evidence location | |

## Workflow execution cases

| ID | Description | Preconditions | Test steps | Expected results | Actual results | Status |
|---|---|---|---|---|---|---|
| E2E-001 | Owner sign-in and role routing | Active owner test account; app and test database available. | Open `/login`; sign in as owner; inspect final URL and session. | Authentication succeeds and routes to the owner portal; session role is owner. | | Not Run |
| E2E-002 | Create and retrieve a property | E2E-001 passed. | In Owner Properties, create a unique property with valid name, address, type, and total unit count; reload and inspect it; query Property by ID. | Property is visible and stored with the authenticated owner's ID and submitted values. | | Not Run |
| E2E-003 | Edit property details | E2E-002 passed. | Edit the test property's address/details; reload page and inspect the database record. | Edited values persist and the owner retains the property. | | Not Run |
| E2E-004 | Create unit under property | E2E-002 passed. | Create a unique unit under the property with rent, deposit, bedrooms, and bathrooms; inspect Owner Units and the Unit record. | Unit is stored with correct `propertyId` and `ownerId`; supplied values and default/selected status match. | | Not Run |
| E2E-005 | Create tenant account | E2E-004 passed; unique test email available. | As owner, add a tenant with a test-only name/email/password and property/unit details; inspect owner tenant list and User record. | Tenant is created with role `tenant`, `createdBy` set to the owner, and supplied account/property/unit/rent information. | | Not Run |
| E2E-006 | Tenant authentication and assigned portal | E2E-005 passed. | Sign out owner; sign in using the test tenant credentials; inspect URL and tenant dashboard information. | Tenant can authenticate and is routed to tenant portal; no owner/admin route is granted. Tenant profile data shown matches stored data. | | Not Run |
| E2E-007 | Create lease agreement | E2E-005 and E2E-004 passed. | As owner, create an active lease for the test tenant and property/unit with unique lease ID, dates, rent, deposit, billing cycle, and terms; inspect lease list and Lease record. | Lease record contains submitted values and tenant linkage. Record whether `propertyId` is populated; the current UI may submit only property name/unit. | | Not Run |
| E2E-008 | Generate rent invoice and invoice notification | E2E-007 passed; chosen billing period has no invoice for this lease. | As owner, generate an invoice for the test lease and period with a due date and payment instructions; inspect owner invoices, Invoice record, Notification, and AuditLog. | Invoice is created with tenant/lease/owner/property details available from the lease, amount from lease rent, period, due date, and instructions. Tenant receives an `invoice-generated` notification. Generation audit record is present. | | Not Run |
| E2E-009 | Prevent duplicate invoice for same lease/period | E2E-008 passed. | Generate the same lease/billing period invoice again. | Duplicate is not created; API/UI reports duplicate/conflict. Existing invoice remains unchanged. | | Not Run |
| E2E-010 | Tenant views own invoice | E2E-008 passed; tenant account is active. | Sign in as tenant; open `/tenant/payments`; inspect invoice list and `GET /api/tenant/invoices`. | Tenant can view their invoice and correct amount, period, due date, property/unit details, and status; another tenant's invoices are not returned. | | Not Run |
| E2E-011 | Initiate SSLCommerz sandbox payment | E2E-010 passed; sandbox credentials set; app callback URL reachable to gateway. | Start online payment for the unpaid test invoice; inspect initiation response and sandbox checkout. | Gateway session starts in sandbox for the exact invoice amount and includes the test tenant/invoice/transaction references. Invoice remains unpaid until verified callback. | | Not Run |
| E2E-012 | Complete payment and verify persisted state | E2E-011 passed; sandbox payment can be completed. | Complete sandbox checkout; follow success callback; refresh tenant and owner views; inspect Invoice, User, and AuditLog records. | Callback verifies transaction, amount, and invoice; invoice status becomes `Paid`, `valId`/`tranId` are retained, tenant `rentStatus` becomes `Paid`, and payment-confirmed audit event is recorded. No separate Payment model is expected. | | Not Run |
| E2E-013 | Payment failure/cancellation does not mark invoice paid | E2E-011 passed; sandbox test can be declined/cancelled or failure callback invoked. | Cancel or fail a sandbox transaction; inspect tenant payment UI and invoice/user records. | Tenant sees failure/cancellation feedback and invoice is not marked Paid. | | Not Run |
| E2E-014 | Submit tenant maintenance request | E2E-007 passed and tenant has an active lease linked to a property. | As tenant, open `/tenant/maintenance`; provide issue summary, listed category, and optional notes; submit. | Success message appears; a request is stored as `Pending`, `Unassigned`, default priority `Medium`, linked to tenant/property/unit/owner; owner receives a `maintenance-submitted` notification. | | Not Run |
| E2E-015 | Owner reviews, assigns, and updates request | E2E-014 passed. | As owner, open maintenance page; assign free-text provider/staff name; update status to `In Progress`, then `Resolved` or `Closed`; inspect tenant notification, request record/history, and provider job history. | Owner sees own request only. Assignment/status and activity history persist; tenant receives `maintenance-updated` notification. Completion date is recorded for terminal status. Resolved/Closed assigned requests appear in provider job history. | | Not Run |
| E2E-016 | Tenant cannot access another tenant's maintenance data or mutate requests | Two tenant accounts exist; one test request belongs to Tenant B. | As Tenant A, list maintenance requests; attempt PATCH to owner maintenance endpoint; attempt unauthenticated list access. | Tenant A receives only own requests; tenant and unauthenticated mutation/list attempts are rejected; stored request remains unchanged. | | Not Run |
| E2E-017 | Owner cannot access another owner's maintenance request | Two owners with separate test properties/requests. | As Owner A, GET own maintenance list and attempt to PATCH Owner B's request ID. | Owner list is owner-scoped; cross-owner update is not found/denied; Owner B's request remains unchanged. | | Not Run |
| E2E-018 | Input validation and visible failure messages | Test accounts and non-production environment; no destructive production data. | Try invalid property, unit, tenant, lease, invoice, and maintenance inputs; inspect client messages and API status/body. | Invalid inputs are rejected with an error message and do not create unintended records. Capture any case where response or UI does not match. | | Not Run |
| E2E-019 | Owner/admin permissions match current routes | Owner and admin accounts available. | As admin, try owner maintenance GET/PATCH; as owner/admin, open provider job history; inspect response and displayed result. | Admin maintenance management is not implemented and is denied by owner-only maintenance route. Owner/admin provider job history is read-only and limited by its current query behavior. Record observed responses without treating unsupported admin management as a pass. | | Not Run |

## Requested behavior not supported by the current project

These acceptance statements should be recorded as out of scope/unsupported for this execution rather than tested as if the feature exists:

| Requested acceptance | Current behavior | Disposition |
|---|---|---|
| Upload image/document with maintenance request; validate type/size; store and retrieve attachments | No upload control or attachment handling in tenant maintenance create API. | Unsupported; do not mark as passed. |
| Create a separate Payment record after tenant rent payment | No separate rent Payment model/collection is used; payment state and IDs are stored on Invoice and confirmed through AuditLog. | Verify Invoice/User/AuditLog instead. |
| Notify tenant/owner on successful online rent payment | Current payment success callback records invoice/user state and AuditLog; it does not create a payment-success notification. | Report as a coverage/behavior gap; no implementation change in this task. |
| Admin views/updates maintenance requests or assigns staff/providers | Maintenance management endpoint requires owner role; no admin maintenance API. | Unsupported for admin maintenance management. |
| `Open` maintenance status | New request status is `Pending`; supported owner status values are in Project behavior notes. | Use `Pending` for new-request assertions. |
| Maintenance due date assignment and validated staff/provider ID assignment | Owner update accepts only free-text `assignedTo` and status. | Test current free-text assignment; due date and directory-validation expectations are excluded. |
| Dedicated tenant request detail page or detail endpoint | Tenant maintenance API provides list/create only. | Verify list and status refresh; detail-ID tests are excluded. |

## Test execution summary template

| Metric | Result |
|---|---|
| Total runnable cases | 19 |
| Passed | |
| Failed | |
| Blocked | |
| Not Run | 19 |
| Unsupported acceptance items reviewed | 7 |
| Critical/high defects open | |
| Overall result | Not Run / Pending execution |

## Database verification record

Record observed identifiers and values; do not include passwords, full card data, or sensitive customer information.

| Entity | Expected check | Actual result / evidence | Status |
|---|---|---|---|
| Property | Owner reference and submitted property fields match. | | Not Run |
| Unit | Owner/property references and unit amounts/details match. | | Not Run |
| Tenant User | Role is tenant; createdBy and account/property/unit details match. | | Not Run |
| Lease | Owner/tenant references and agreement values match; note if propertyId is null. | | Not Run |
| Rent Invoice | Lease/tenant/owner linkage, rent, billing period, due date, instructions, and status match. | | Not Run |
| Rent payment state | Invoice Paid, transaction/validation IDs, tenant rentStatus, and audit event match after valid callback. No standalone Payment record expected. | | Not Run |
| MaintenanceRequest | Tenant/property/owner/unit relationships, title/description/category/status/assignment/activity history match. Attachments are not supported. | | Not Run |
| Notification | Invoice-generated and maintenance-submitted/updated notification recipient and references match; no payment-success notification expected. | | Not Run |
| AuditLog | Invoice generation/status and verified payment audit entries match actions. | | Not Run |

## Defect and retest log

| Defect ID | Severity | Description / evidence | Retest case | Status |
|---|---|---|---|---|
| | | | | |

## Final UAT sign-off

| Sign-off item | Result |
|---|---|
| Full owner → tenant → invoice → sandbox payment → maintenance journey completed | Pending execution |
| Database relationships verified | Pending execution |
| Notification behavior verified against current implementation | Pending execution |
| RBAC checks executed | Pending execution |
| Critical/high defects resolved or formally accepted | Pending review |
| Tester / date | |
| QA approver / date | |

**Current result: Not Run.** No database-backed browser journey or live sandbox callback was executed for this documentation task. A final sign-off requires tester execution in a configured non-production environment. This file documents tests and current scope only; it makes no frontend or backend changes.
