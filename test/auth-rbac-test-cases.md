# Authentication and RBAC Test Cases

The Jira acceptance criteria supplied with the task were grouped into the IDs
below; these IDs are test-document mappings, not Jira issue numbers.

- **AC-AUTH**: Login, account state, role dashboard routing, error handling, and session validation.
- **AC-REG**: Owner registration validation, duplicate handling, and payment initiation.
- **AC-RBAC**: Role permissions, protected pages/APIs, cookies, remembered sessions, and logout.

Tests use unique `@example.invalid` accounts and a MongoDB database whose name
includes `test`. The test helper verifies the app server and fixture process use
the exact same isolated database URI. The successful registration test runs
only when sandbox SSLCommerz credentials are configured; it verifies the
returned checkout URL is the SSLCommerz sandbox and never completes a payment.
The API registration handler currently has no server-side email-format check;
the invalid-email API case records the required validation behavior and may
expose that existing gap when the suite can run.

| Test Case ID | AC | Description | Preconditions | Test Steps | Expected Results | Actual Results | Status |
|---|---|---|---|---|---|---|---|
| AUTH-API-01 | AC-AUTH | Valid admin, owner, and tenant credentials | Test DB and app server available | Log in with one isolated account per role; inspect session and response | HTTP 200, valid cookie/session, correct role and dashboard URL | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-API-02 | AC-AUTH | Invalid and missing login credentials | Test server available | Submit wrong password and omit email/password | Wrong credentials return 401; missing values return 400 | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-API-03 | AC-AUTH | Inactive account is denied | Inactive tenant fixture | Log in with its valid password | HTTP 403; no authenticated session | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-API-04 | AC-AUTH | Unpaid owner requires activation | Pending owner fixture | Log in with valid credentials | HTTP 402 with `requiresPayment` and fee amount | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-API-05 | AC-AUTH | Missing, malformed, and expired tokens | Test server uses the same test JWT secret | Query session without token, with malformed cookie, and with an expired signed token | `/api/auth/me` reports `user: null` for each invalid session | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-UI-01 | AC-AUTH | Valid role-specific login and remembered state | Chrome, test server, isolated fixtures | Sign in as each role; inspect URL and local storage; refresh | Correct dashboard and role-specific session survives refresh | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-UI-02 | AC-AUTH | Login failure and required inputs | Chrome and test server | Submit incorrect credentials, then submit empty login form | Error is visible; browser blocks missing required values | Blocked before setup: required isolated test environment variables are unset | Not Run |
| AUTH-UI-03 | AC-AUTH | Owner activation prompt | Pending owner fixture | Sign in as pending owner | Login stays on page and shows activation-payment prompt; no gateway request | Blocked before setup: required isolated test environment variables are unset | Not Run |
| REG-API-01 | AC-REG | Required registration fields and password length | Test server available | Omit each required field; submit a password shorter than six characters | Each invalid request returns HTTP 400 | Blocked before setup: required isolated test environment variables are unset | Not Run |
| REG-API-02 | AC-REG | Duplicate paid-owner email | Paid owner fixture | Register using its email | HTTP 409 duplicate-account response | Blocked before setup: required isolated test environment variables are unset | Not Run |
| REG-API-03 | AC-REG | Invalid email address is rejected | Test DB and server; unique test email | Submit owner registration with malformed email | HTTP 400 before account or payment creation | Not run; static inspection found no API email-format validation | Not Run |
| REG-API-04 | AC-REG | Valid owner registration starts sandbox payment | Sandbox store credentials; test server | Submit valid owner registration; inspect response URL | HTTP 200 indicates payment required and returns only an HTTPS sandbox checkout URL | Not run: SSLCommerz sandbox credentials and isolated test environment are not configured | Not Run |
| REG-UI-01 | AC-REG | Browser registration validation | Chrome and test server | Submit blank form, then provide malformed email | Browser blocks submission for missing fields and invalid email | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-API-01 | AC-RBAC | Admin API permissions | Admin, owner, and tenant fixtures | Request `/api/admin/owner` as each role and anonymously | Admin receives 200; other roles 403; anonymous receives 401 | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-API-02 | AC-RBAC | Owner API permissions | Admin, owner, and tenant fixtures | Request `/api/owner/properties` as each role and anonymously | Admin/owner receive 200; tenant and anonymous receive 403 per route behavior | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-API-03 | AC-RBAC | Tenant API permissions | Admin, owner, and tenant fixtures | Request `/api/tenant/rent-summary` as each role and anonymously | Tenant receives 200; admin/owner receive 403; anonymous receives 401 | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-UI-01 | AC-RBAC | Cross-role direct dashboard URLs | Chrome and authenticated role fixtures | For each role, navigate to every role dashboard URL | Middleware redirects to that user’s own dashboard | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-UI-02 | AC-RBAC | Unauthenticated direct dashboard URLs | Chrome and no session cookie | Navigate directly to each dashboard | Each page redirects to `/login` | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-API-04 | AC-RBAC | Logout invalidates browser session state | Owner fixture and test server | Call logout with session cookie; inspect cookie-clearing response | Cookie is cleared with `Max-Age=0`; subsequent browser navigation requires login | Blocked before setup: required isolated test environment variables are unset | Not Run |
| RBAC-UI-03 | AC-RBAC | Logout and subsequent protected-route access | Chrome, owner fixture, and test server | Sign in, log out, then open owner dashboard directly | Local auth state and cookie are cleared; protected page redirects to login | Blocked before setup: required isolated test environment variables are unset | Not Run |

## Running on Windows

Use an isolated MongoDB database whose name contains `test`. Configure the app
server and test process with the same `MONGODB_URI`, `TEST_MONGODB_URI`, and
`TEST_SERVER_MONGODB_URI`, plus a local `TEST_SERVER_URL`. Set the same
temporary test-only `JWT_SECRET` in the server and test terminal. Never point
these variables at production or a shared development database.

In the first PowerShell terminal, set the isolated test values and start the
app (replace the database URI and test-only JWT secret with local values):

```powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/rentora_test'
$env:TEST_MONGODB_URI = $env:MONGODB_URI
$env:TEST_SERVER_MONGODB_URI = $env:MONGODB_URI
$env:TEST_SERVER_URL = 'http://localhost:3000'
$env:JWT_SECRET = '<same temporary test-only secret in both terminals>'
$env:APP_URL = $env:TEST_SERVER_URL
pnpm.cmd dev
```

In a second PowerShell terminal, use the same test database and secret, then run:

```powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/rentora_test'
$env:TEST_MONGODB_URI = $env:MONGODB_URI
$env:TEST_SERVER_MONGODB_URI = $env:MONGODB_URI
$env:TEST_SERVER_URL = 'http://localhost:3000'
$env:JWT_SECRET = '<same temporary test-only secret in both terminals>'
$env:APP_URL = $env:TEST_SERVER_URL
pnpm.cmd exec node --test test/auth-api.test.js
pnpm.cmd exec node --test test/auth.selenium.js
```

Chrome and a compatible WebDriver are required for Selenium. To run the
successful registration scenario, configure sandbox-only
`SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` in both terminals. The
test runs only when `APP_URL` matches the local test server. The payment
endpoint itself targets the SSLCommerz sandbox; no live payment should be used
for testing.
