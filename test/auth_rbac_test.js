require("dotenv").config({ path: ".env.local" });

const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
  resetSession,
  runSuite,
  waitForBodyText,
} = require("./selenium-helpers");

const testPassword = `Rentora-${Date.now()}-test`;
const fixturePrefix = `selenium-auth-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const fixtures = {
  owner: { name: "Selenium Paid Owner", email: `${fixturePrefix}-owner@example.test` },
  pendingOwner: { name: "Selenium Pending Owner", email: `${fixturePrefix}-pending@example.test` },
  inactiveTenant: { name: "Selenium Inactive Tenant", email: `${fixturePrefix}-inactive@example.test` },
};

let mongoose;
let User;
let fixtureError = "";

function documentedCase(id, description, preconditions, steps, expectedResult, requiresDatabase, run) {
  return {
    id,
    name: description,
    description,
    preconditions,
    steps,
    expectedResult,
    actualResult: "Not run",
    status: "Not Run",
    requiresDatabase,
    run: async (driver) => {
      try {
        await run(driver);
        const testCase = tests.find((item) => item.id === id);
        testCase.actualResult = "Passed: observed behavior matched the expected result.";
        testCase.status = "Pass";
      } catch (error) {
        const testCase = tests.find((item) => item.id === id);
        testCase.actualResult = `Failed: ${error.message || error}`;
        testCase.status = "Fail";
        throw error;
      }
    },
  };
}

async function browserRequest(driver, path, method = "GET", body) {
  return driver.executeAsyncScript((requestPath, requestMethod, requestBody, done) => {
    fetch(requestPath, {
      method: requestMethod,
      headers: requestBody === null ? {} : { "Content-Type": "application/json" },
      body: requestBody === null ? undefined : JSON.stringify(requestBody),
      cache: "no-store",
    })
      .then(async (response) => ({
        status: response.status,
        body: await response.json().catch(() => null),
        setCookie: response.headers.get("set-cookie"),
      }))
      .then(done)
      .catch((error) => done({ error: error.message }));
  }, path, method, body === undefined ? null : body);
}

async function clearBrowserSession(driver) {
  await driver.get(BASE_URL);
  await driver.manage().deleteAllCookies();
  await driver.executeScript("localStorage.clear(); sessionStorage.clear();");
}

async function setRoleSession(driver, role, expired = false) {
  const { SignJWT } = await import("jose");
  const now = Math.floor(Date.now() / 1000);
  const builder = new SignJWT({
    id: `selenium-${role}`,
    email: `selenium-${role}@example.test`,
    name: `Selenium ${role}`,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(expired ? now - 120 : now);
  const token = await builder
    .setExpirationTime(expired ? now - 60 : now + 300)
    .sign(new TextEncoder().encode(process.env.JWT_SECRET || "rentora_super_secret_jwt_key_2026_fallback"));
  await driver.manage().addCookie({ name: "rentora_token", value: token, path: "/" });
}

const tests = [
  documentedCase(
    "AUTH-LOGIN-001",
    "Login API rejects a missing email",
    "Application is running and no authenticated session is required.",
    ["POST /api/auth/login with a password and no email."],
    "HTTP 400 with a required-credentials error; no session is created.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/login", "POST", { password: "example-password" });
      assert.equal(response.status, 400);
      assert.match(response.body.error, /required/i);
      assert.equal(
        (await driver.manage().getCookies()).some((cookie) => cookie.name === "rentora_token"),
        false
      );
    }
  ),
  documentedCase(
    "AUTH-LOGIN-002",
    "Login API rejects a missing password",
    "Application is running and no authenticated session is required.",
    ["POST /api/auth/login with an email and no password."],
    "HTTP 400 with a required-credentials error; no session is created.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/login", "POST", { email: "missing-password@example.test" });
      assert.equal(response.status, 400);
      assert.match(response.body.error, /required/i);
      assert.equal(
        (await driver.manage().getCookies()).some((cookie) => cookie.name === "rentora_token"),
        false
      );
    }
  ),
  documentedCase(
    "AUTH-LOGIN-003",
    "Inactive tenant login is denied",
    "A disabled tenant fixture exists in the configured test database.",
    ["POST /api/auth/login with the disabled tenant's valid credentials."],
    "HTTP 403 explains the account is deactivated; no authenticated session is issued.",
    true,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/login", "POST", {
        email: fixtures.inactiveTenant.email,
        password: testPassword,
      });
      assert.equal(response.status, 403);
      assert.match(response.body.error, /deactivated/i);
      assert.equal(
        (await driver.manage().getCookies()).some((cookie) => cookie.name === "rentora_token"),
        false
      );
    }
  ),
  documentedCase(
    "AUTH-LOGIN-004",
    "Unpaid owner login requires activation payment",
    "An active owner fixture with Pending payment status exists.",
    ["POST /api/auth/login with the pending owner's valid credentials."],
    "HTTP 402 identifies the required activation payment and does not issue a session.",
    true,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/login", "POST", {
        email: fixtures.pendingOwner.email,
        password: testPassword,
      });
      assert.equal(response.status, 402);
      assert.equal(response.body.requiresPayment, true);
      assert.equal(response.body.amount, 499);
      assert.equal(
        (await driver.manage().getCookies()).some((cookie) => cookie.name === "rentora_token"),
        false
      );
      await driver.get(`${BASE_URL}/login`);
      await driver.findElement(By.id("email-address")).sendKeys(fixtures.pendingOwner.email);
      await driver.findElement(By.id("password")).sendKeys(testPassword);
      await driver.findElement(By.css("form button[type='submit']")).click();
      await waitForBodyText(driver, "Owner Account Activation Required");
      await waitForBodyText(driver, "Continue to ৳499 checkout");
    }
  ),
  documentedCase(
    "AUTH-LOGIN-005",
    "Paid owner login creates a persistent owner session",
    "A paid owner fixture exists in the configured test database.",
    [
      "Sign in with the paid fixture account.",
      "Verify the owner dashboard redirect and /api/auth/me session.",
      "Reload the dashboard and verify the remembered session.",
    ],
    "The owner reaches /owner/dashboard and remains authenticated after reload.",
    true,
    async (driver) => {
      await loginAndWaitDashboard(driver, "owner", {
        email: fixtures.owner.email,
        password: testPassword,
      });
      assert.match(await driver.getCurrentUrl(), /\/owner\/dashboard$/);
      const session = await browserRequest(driver, "/api/auth/me");
      assert.equal(session.status, 200);
      assert.equal(session.body.user.role, "owner");
      await driver.navigate().refresh();
      await driver.wait(until.urlContains("/owner/dashboard"), WAIT_MS);
      assert.equal(await driver.executeScript("return Boolean(localStorage.getItem('rentora_current_user'));"), true);
    }
  ),
  documentedCase(
    "AUTH-REGISTER-001",
    "Registration API rejects missing required fields",
    "Application is running; no database fixture is required.",
    ["POST /api/auth/register with an empty JSON object."],
    "HTTP 400 lists the required registration fields.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/register", "POST", {});
      assert.equal(response.status, 400);
      assert.match(response.body.error, /required/i);
    }
  ),
  documentedCase(
    "AUTH-REGISTER-002",
    "Registration form rejects an invalid email format",
    "Registration form is available.",
    [
      "Open /register.",
      "Enter a name, invalid email, and a password of at least six characters.",
      "Check native form validity before submitting.",
    ],
    "The email input reports a type mismatch and the form cannot submit.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      await driver.get(`${BASE_URL}/register`);
      await driver.wait(until.elementLocated(By.id("full-name")), WAIT_MS);
      await driver.findElement(By.id("full-name")).sendKeys("Selenium Invalid Email");
      const email = await driver.findElement(By.id("email-address"));
      await email.sendKeys("not-an-email");
      await driver.findElement(By.id("create-password")).sendKeys(testPassword);
      assert.equal(await email.getAttribute("type"), "email");
      assert.equal(await email.getAttribute("required"), "true");
      assert.equal(await driver.executeScript("return arguments[0].validity.typeMismatch;", email), true);
      assert.equal(await driver.executeScript("return document.querySelector('form').checkValidity();"), false);
    }
  ),
  documentedCase(
    "AUTH-REGISTER-003",
    "Registration rejects an existing paid owner email",
    "A paid owner fixture exists in the configured test database.",
    ["POST /api/auth/register using the existing paid owner's email."],
    "HTTP 409 informs the user to sign in; no second account or checkout is created.",
    true,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/register", "POST", {
        name: "Duplicate Selenium Owner",
        email: fixtures.owner.email,
        password: testPassword,
      });
      assert.equal(response.status, 409);
      assert.match(response.body.error, /already exists/i);
    }
  ),
  documentedCase(
    "AUTH-REGISTER-004",
    "Registration rejects passwords shorter than six characters",
    "Application is running; validation occurs before database access.",
    ["POST /api/auth/register with valid name/email and a five-character password."],
    "HTTP 400 explains that passwords must contain at least six characters.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      const response = await browserRequest(driver, "/api/auth/register", "POST", {
        name: "Short Password",
        email: `${fixturePrefix}-short-password@example.test`,
        password: "12345",
      });
      assert.equal(response.status, 400);
      assert.match(response.body.error, /at least 6 characters/i);
    }
  ),
  documentedCase(
    "AUTH-RBAC-001",
    "Owner can access owner dashboard and owner API but not tenant dashboard",
    "A paid owner fixture exists in the configured test database.",
    [
      "Sign in as the fixture owner.",
      "Request GET /api/owner/tenants and check its response.",
      "Open /tenant/dashboard directly.",
    ],
    "Owner API returns HTTP 200 and a direct tenant URL redirects to /owner/dashboard.",
    true,
    async (driver) => {
      await loginAndWaitDashboard(driver, "owner", {
        email: fixtures.owner.email,
        password: testPassword,
      });
      const ownerApi = await browserRequest(driver, "/api/owner/tenants");
      assert.equal(ownerApi.status, 200);
      await driver.get(`${BASE_URL}/tenant/dashboard`);
      await driver.wait(until.urlContains("/owner/dashboard"), WAIT_MS);
      assert.match(await driver.getCurrentUrl(), /\/owner\/dashboard$/);
    }
  ),
  documentedCase(
    "AUTH-RBAC-002",
    "Tenant can access tenant dashboard and tenant API but not owner dashboard",
    "A valid tenant test account is configured using TENANT_EMAIL and TENANT_PASSWORD.",
    [
      "Sign in as the configured tenant.",
      "Request GET /api/tenant/rent-summary.",
      "Open /owner/dashboard directly.",
    ],
    "Tenant API returns HTTP 200 and a direct owner URL redirects to /tenant/dashboard.",
    true,
    async (driver) => {
      const credentials = {
        email: process.env.TENANT_EMAIL || "23201111@uap-bd.edu",
        password: process.env.TENANT_PASSWORD || "23201111",
      };
      await loginAndWaitDashboard(driver, "tenant", credentials);
      const tenantApi = await browserRequest(driver, "/api/tenant/rent-summary");
      assert.equal(tenantApi.status, 200);
      await driver.get(`${BASE_URL}/owner/dashboard`);
      await driver.wait(until.urlContains("/tenant/dashboard"), WAIT_MS);
      assert.match(await driver.getCurrentUrl(), /\/tenant\/dashboard$/);
    }
  ),
  documentedCase(
    "AUTH-RBAC-003",
    "Admin-only owner API is forbidden to owner and tenant sessions",
    "Admin, owner, and tenant credentials are available.",
    [
      "Sign in separately as owner and tenant.",
      "Request GET /api/admin/owner with each session.",
    ],
    "Both non-admin roles receive HTTP 403.",
    true,
    async (driver) => {
      const accounts = [
        {
          email: process.env.OWNER_EMAIL || "23201128@uap-bd.edu",
          password: process.env.OWNER_PASSWORD || "23201128",
        },
        {
          email: process.env.TENANT_EMAIL || "23201111@uap-bd.edu",
          password: process.env.TENANT_PASSWORD || "23201111",
        },
      ];
      for (const account of accounts) {
        await loginAndWaitDashboard(driver, account.email === accounts[0].email ? "owner" : "tenant", account);
        const response = await browserRequest(driver, "/api/admin/owner");
        assert.equal(response.status, 403);
      }
    }
  ),
  documentedCase(
    "AUTH-RBAC-004",
    "Super Admin can access the admin-only owner API",
    "Valid Super Admin credentials are configured.",
    ["Sign in as Super Admin and request GET /api/admin/owner."],
    "The admin-only API responds with HTTP 200 and a successful response body.",
    true,
    async (driver) => {
      await loginAndWaitDashboard(driver, "admin", {
        email: process.env.ADMIN_EMAIL || "admin@rentora.com",
        password: process.env.ADMIN_PASSWORD || "admin123456",
      });
      const response = await browserRequest(driver, "/api/admin/owner");
      assert.equal(response.status, 200);
      assert.equal(response.body.success, true);
    }
  ),
  documentedCase(
    "AUTH-RBAC-005",
    "Unauthenticated API requests are denied",
    "Application is running and browser cookies are cleared.",
    ["Request owner, tenant, and admin APIs without an authentication cookie."],
    "Each protected API responds with HTTP 401 or 403.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      for (const path of ["/api/owner/tenants", "/api/tenant/rent-summary", "/api/admin/owner"]) {
        const response = await browserRequest(driver, path);
        assert.ok([401, 403].includes(response.status), `${path} returned ${response.status}`);
      }
    }
  ),
  documentedCase(
    "AUTH-RBAC-006",
    "Each role is restricted to its own dashboard by middleware",
    "Application is running and JWT_SECRET matches the application configuration.",
    [
      "For Admin, Owner, and Tenant, open each of /admin/dashboard, /owner/dashboard, and /tenant/dashboard.",
      "Verify the user's own dashboard is permitted and all other dashboards redirect to their role dashboard.",
    ],
    "All nine role/route combinations enforce role-specific access.",
    false,
    async (driver) => {
      const dashboards = {
        admin: "/admin/dashboard",
        owner: "/owner/dashboard",
        tenant: "/tenant/dashboard",
      };
      for (const [role, ownDashboard] of Object.entries(dashboards)) {
        for (const requestedDashboard of Object.values(dashboards)) {
          await clearBrowserSession(driver);
          await setRoleSession(driver, role);
          await driver.get(`${BASE_URL}${requestedDashboard}`);
          await driver.wait(until.urlContains(ownDashboard), WAIT_MS);
          assert.equal(new URL(await driver.getCurrentUrl()).pathname, ownDashboard);
        }
      }
    }
  ),
  documentedCase(
    "AUTH-RBAC-007",
    "Role-restricted APIs deny requests from other authenticated roles",
    "Application is running and JWT_SECRET matches the application configuration.",
    [
      "Use Admin and Tenant sessions to request GET /api/owner/tenants.",
      "Use Admin and Owner sessions to request GET /api/tenant/rent-summary.",
      "Use Owner and Tenant sessions to request GET /api/admin/owner.",
    ],
    "Every non-authorized role receives HTTP 403.",
    false,
    async (driver) => {
      const restrictedRequests = [
        { roles: ["admin", "tenant"], path: "/api/owner/tenants" },
        { roles: ["admin", "owner"], path: "/api/tenant/rent-summary" },
        { roles: ["owner", "tenant"], path: "/api/admin/owner" },
      ];
      for (const request of restrictedRequests) {
        for (const role of request.roles) {
          await clearBrowserSession(driver);
          await setRoleSession(driver, role);
          const response = await browserRequest(driver, request.path);
          assert.equal(response.status, 403, `${role} accessing ${request.path}`);
        }
      }
    }
  ),
  documentedCase(
    "AUTH-SESSION-002",
    "Expired sessions are rejected and protected routes redirect to login",
    "Application is running and JWT_SECRET matches the application configuration.",
    [
      "Set an expired rentora_token cookie.",
      "Request /api/auth/me.",
      "Open /admin/dashboard directly.",
    ],
    "The session API returns no user and middleware redirects to login.",
    false,
    async (driver) => {
      await clearBrowserSession(driver);
      await setRoleSession(driver, "admin", true);
      const session = await browserRequest(driver, "/api/auth/me");
      assert.equal(session.status, 200);
      assert.equal(session.body.user, null);
      await driver.get(`${BASE_URL}/admin/dashboard`);
      await driver.wait(until.urlContains("/login"), WAIT_MS);
      const url = new URL(await driver.getCurrentUrl());
      assert.equal(url.pathname, "/login");
      assert.equal(url.searchParams.get("redirect"), "/admin/dashboard");
    }
  ),
  documentedCase(
    "AUTH-LOGOUT-001",
    "Logout clears the session and remembered authentication state",
    "A paid owner fixture exists in the configured test database.",
    [
      "Sign in as the fixture owner.",
      "Click Logout.",
      "Request /api/auth/me and inspect local storage.",
    ],
    "The user is redirected to login, server session is null, and remembered user data is removed.",
    true,
    async (driver) => {
      await loginAndWaitDashboard(driver, "owner", {
        email: fixtures.owner.email,
        password: testPassword,
      });
      await driver.findElement(By.xpath("//button[normalize-space()='Logout']")).click();
      await driver.wait(until.urlContains("/login"), WAIT_MS);
      const session = await browserRequest(driver, "/api/auth/me");
      assert.equal(session.body.user, null);
      assert.equal(await driver.executeScript("return localStorage.getItem('rentora_current_user');"), null);
    }
  ),
];

async function createFixtures() {
  const [{ default: dbConnect }, userModule, mongooseModule, bcryptModule] = await Promise.all([
    import("../lib/dbConnect.js"),
    import("../lib/models/User.js"),
    import("mongoose"),
    import("bcryptjs"),
  ]);
  mongoose = mongooseModule.default;
  User = userModule.default;
  await dbConnect();
  const passwordHash = await bcryptModule.default.hash(testPassword, 10);
  await User.create([
    {
      ...fixtures.owner,
      passwordHash,
      role: "owner",
      status: "Paid",
      approvalStatus: "Approved",
    },
    {
      ...fixtures.pendingOwner,
      passwordHash,
      role: "owner",
      status: "Pending",
      approvalStatus: "Approved",
    },
    {
      ...fixtures.inactiveTenant,
      passwordHash,
      role: "tenant",
      status: "Paid",
      isActive: false,
    },
  ]);
}

async function main() {
  try {
    await createFixtures();
  } catch (error) {
    fixtureError = "Database fixture setup failed; check MongoDB connectivity and configuration.";
    for (const testCase of tests) {
      if (testCase.requiresDatabase) {
        testCase.skip = fixtureError;
        testCase.blockingSkip = true;
        testCase.actualResult = fixtureError;
      }
    }
    console.warn(`WARN auth/RBAC fixtures: ${fixtureError}`);
  }

  try {
    const summary = await runSuite("auth/RBAC", tests);
    console.log("\nAuth/RBAC case results:");
    for (const testCase of tests) {
      console.log(JSON.stringify({
        id: testCase.id,
        description: testCase.description,
        preconditions: testCase.preconditions,
        steps: testCase.steps,
        expectedResult: testCase.expectedResult,
        actualResult: testCase.actualResult,
        status: testCase.status,
      }));
    }
    if (summary.failed) process.exitCode = 1;
  } finally {
    if (mongoose) {
      if (User && mongoose.connection.readyState === 1) {
        await User.deleteMany({ email: { $in: Object.values(fixtures).map((fixture) => fixture.email) } });
      }
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(`FAIL auth/RBAC setup: ${error.message || error}`);
  process.exitCode = 1;
});
