# Authentication and RBAC Validation

Run `npm run test:auth` with the application database reachable, test accounts configured, and demo payments enabled to execute the complete browser regression suite. In development demo mode, owner registration returns a demo-checkout URL; production/SSLCommerz mode continues to use the gateway. Each suite writes its latest case-level results to `test/test-results/` as JSON with case ID, preconditions, steps, expected and actual results, status, timestamp, and totals. A required database-dependent case that cannot run is reported as blocked and causes a nonzero test exit; optional cases disabled by the payment mode are reported as skipped.

## Coverage

| Area | Scenarios |
|---|---|
| Login | Valid roles, invalid credentials, missing credentials, inactive users, unpaid owner activation prompt |
| Registration | Required fields, invalid email, duplicate email, minimum password length, owner payment initiation |
| Session | Authenticated state persistence, expired token rejection, logout and remembered-state cleanup |
| Route protection | Unauthenticated redirects and all Admin/Owner/Tenant dashboard-role combinations |
| API authorization | Positive role APIs and denial of cross-role and unauthenticated requests |
| Activation payment | Pending owner and invoice, successful activation, failed callback, cancellation callback and checkout cancellation |

## Bug report

| ID | Severity | Defect | Fix | Retest |
|---|---|---|---|---|
| AUTH-TEST-001 | LOW | Selenium `getCookie()` throws when an expected authentication cookie is absent after denied login. | Assert absence using `getCookies()` and a cookie-name check. | Code updated; database-backed retest is blocked until MongoDB is reachable. |
| AUTH-TEST-002 | MEDIUM | Owner activation registration tests expected a demo URL even though development registration always initialized SSLCOMMERZ. | Route development demo-mode registration to the existing demo checkout and make payment cases dependent on successful setup. | Registration flow fix is in place; full activation retest is blocked until MongoDB is reachable. |

No Critical or High severity authentication defects have been observed in the available test results. This is not a final sign-off: all database-dependent cases must pass in a complete run before the Auth/RBAC flow is approved.

## Sign-off

**Pending.** The current environment cannot resolve the configured MongoDB Atlas SRV record, so database-backed authentication and payment cases cannot execute here. Sign-off requires a successful `npm run test:auth` run with zero failures and zero blocked required cases.
