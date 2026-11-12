# Owner-to-tenant E2E workflow execution

## Execution record

| Test Case ID | Description | Preconditions | Test Steps | Expected Results | Actual Results | Status |
|---|---|---|---|---|---|---|
| E2E-001 | Owner property setup through tenant maintenance resolution | Local Rentora server; configured owner and tenant test logins; Chrome/Selenium | Log in as owner; use the property, unit, tenant, lease, and invoice forms; send the invoice; log in as tenant; view and pay the invoice; submit maintenance; log back in as owner; assign and transition the request through In Progress, Resolved, and Closed. | Page actions succeed; invoice/payment and maintenance state remain linked to the created mock property, unit, and tenant; relevant notification events are generated. | The complete browser workflow passed. Browser mock state contained one property, unit, tenant, lease, invoice, payment, and maintenance request. Mock relationship assertions and invoice/maintenance notification assertions passed. | PASS (browser-mocked workflow) |

Run with `npm run test:e2e-workflow`. Latest execution: **1 passed, 0 failed, 0 skipped**.

## Scope and evidence

The test uses the real local UI, owner/tenant authentication, and dashboard route redirects. Workflow API responses and writes are intercepted in the browser and kept in test-only browser state. No property, unit, tenant, lease, invoice, payment, maintenance request, or notification is written to MongoDB. The newly onboarded tenant is a mock workflow record; the tenant portal login uses the configured existing tenant test account.

The payment action is simulated by the browser mock: it marks the mock invoice paid, creates a mock payment record and notification, and redirects to the app's local payment-success UI. It does **not** contact SSLCommerz or invoke a real success callback. Accordingly, the test verifies the UI and simulated state transition, not gateway processing or database persistence.

Notification events and relationship checks are against mock state, not persisted notification or domain records. Database record creation/relationship verification, real notification delivery, payment callback persistence, attachment upload, failure callbacks, and production/UAT sign-off are **not verified** by this run. No application frontend or backend behavior was changed for this test.

## Execution template / boundary cases

The following acceptance areas are not covered by E2E-001 and must not be inferred as passed:

| Area | Actual result | Status |
|---|---|---|
| Persisted database records and relationships | No database write or persistence assertion was performed. | NOT VERIFIED |
| SSLCommerz sandbox transaction and callback | Gateway was not contacted. | NOT VERIFIED |
| Real notification delivery/log persistence | Only browser-mocked notification events were asserted. | NOT VERIFIED |
| Invalid form submissions, failed payments, attachment validation, and unauthorized workflow actions | Not exercised in this end-to-end journey. | NOT VERIFIED |
| Newly onboarded tenant's credentials and assigned-information access | Tenant record was mocked; sign-in used an existing test fixture. | NOT VERIFIED |

No product defects were identified in the executed mocked browser path. This result is not a database, payment-gateway, or UAT sign-off.
