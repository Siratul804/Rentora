# Authentication and RBAC Selenium Test Cases

These cases are aligned with Rentora's current authentication behavior. Run the existing role-login and RBAC suites alongside the acceptance suite:

```powershell
node test/login_test.js
node test/rbac_test.js
npm run test:auth
```

The Selenium helper loads `.env.local`, starts a local Next.js development server when needed, and uses headless Chrome by default. Configure `BASE_URL` to target a local test instance. Do not point these tests at production.

## Test cases

| Test Case ID | Description | Preconditions | Test Steps | Expected Results | Actual Results | Status |
|---|---|---|---|---|---|---|
| AUTH-LOGIN-001 | Valid Super Admin login | `ADMIN_EMAIL` and `ADMIN_PASSWORD` are configured | Sign in with admin credentials | Redirects to `/admin/dashboard` | Redirected to `/admin/dashboard` | Pass |
| AUTH-LOGIN-002 | Valid Property Owner login | A paid owner test account is available via test credentials | Sign in with owner credentials | Redirects to `/owner/dashboard` | Redirected to `/owner/dashboard` | Pass |
| AUTH-LOGIN-003 | Valid Tenant login | An active tenant test account is available via test credentials | Sign in with tenant credentials | Redirects to `/tenant/dashboard` | Redirected to `/tenant/dashboard` | Pass |
| AUTH-LOGIN-004 | Invalid credentials | Selenium browser and app are available | Submit a non-existent email and incorrect password | Shows `Invalid email or password`; stays on login page | Error shown; remained on login page | Pass |
| AUTH-LOGIN-005 | Missing login email/password | Selenium browser and app are available | Submit the login form with fields blank | Browser validation prevents submission | Required-field validation blocked the empty form | Pass |
| AUTH-LOGIN-006 | Role dashboard redirect | Valid test credentials for each role | Sign in with each role | Each user lands on their matching dashboard | All three roles reached their matching dashboards | Pass |
| AUTH-REG-001 | Required registration fields | Selenium browser and app are available | Submit registration form with required fields blank | Browser validation blocks submission | Required-field validation blocked the empty form | Pass |
| AUTH-REG-002 | Invalid registration format | Selenium browser and app are available | Enter a malformed email in registration form | Browser rejects invalid email format | Browser marked the email as invalid | Pass |
| AUTH-REG-003 | Registration API required-field validation | App is available | POST an empty registration payload | API returns HTTP 400 and a required-fields error | HTTP 400 with required-fields error | Pass |
| AUTH-REG-004 | Registration API password validation | App is available | POST otherwise valid owner data with a password shorter than six characters | API returns HTTP 400 and password-length error | HTTP 400 with password-length error | Pass |
| AUTH-REG-005 | Owner payment-flow response handling | Selenium browser and app are available | Submit valid form data while Selenium stubs the registration response as payment-required | Form submits the expected owner data and follows the returned checkout URL | Submitted payload verified and mocked checkout redirect followed; no account or payment created | Pass |
| AUTH-RBAC-001 | Unauthenticated dashboard access | Selenium browser and app are available | Navigate directly to admin, owner, and tenant dashboards | Each route redirects to login with its requested path | All three routes redirected to login with the requested path | Pass |
| AUTH-RBAC-002 | Wrong-role dashboard access | Test JWT signing secret matches the app's `JWT_SECRET` | Navigate each signed role session to every role dashboard | User is redirected to their own role dashboard | All role/dashboard combinations enforced the expected route | Pass |
| AUTH-RBAC-003 | Admin-only API authorization | Selenium browser and app are available | Make an admin approval API request as owner and tenant | Both requests return HTTP 403 | Owner and tenant requests returned HTTP 403 | Pass |
| AUTH-SESSION-001 | No-auth session check | No login cookie is present | Request `/api/auth/me` | Returns HTTP 200 with `user: null` | HTTP 200 with `user: null` | Pass |
| AUTH-SESSION-002 | Remembered authentication and logout | Valid admin test credentials are available | Log in, refresh dashboard, check session, then log out | Session remains valid after refresh; logout clears session and returns to login | Admin session remained valid after refresh; logout cleared session and returned to login | Pass |

`AUTH-REG-005` deliberately mocks only the registration response so the UI's payment redirect can be tested without creating a real owner account or initiating an external transaction. Actual SSLCommerz checkout must be tested separately in an isolated sandbox environment. Inactive-account, pending-owner-payment, and duplicate-owner tests are omitted because they require dedicated database fixtures.

## Execution record

This execution record reflects the actual command output from 2026-11-04.

| Suite | Passed | Failed | Skipped | Execution date |
|---|---:|---:|---:|---|
| `node test/login_test.js` | 4 | 0 | 0 | 2026-11-04 |
| `node test/rbac_test.js` | 6 | 0 | 0 | 2026-11-04 |
| `npm run test:auth` | 11 | 0 | 0 | 2026-11-04 |
