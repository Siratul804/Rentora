import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  authApiRequest,
  cleanupAuthFixtures,
  createAuthFixtures,
  loginThroughApi,
  TEST_CONFIG,
  TEST_PASSWORD,
  trackRegistrationEmail,
} from "./auth-test-helpers.js";
import { signToken } from "../lib/jwt.js";

let fixtures;
let adminCookie;
let ownerCookie;
let tenantCookie;

before(async () => {
  fixtures = await createAuthFixtures();
  [adminCookie, ownerCookie, tenantCookie] = await Promise.all([
    loginThroughApi(fixtures.admin),
    loginThroughApi(fixtures.owner),
    loginThroughApi(fixtures.tenant),
  ]);
});

after(async () => {
  await cleanupAuthFixtures();
});

async function postJson(path, body) {
  return authApiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

test("valid admin, owner, and tenant credentials receive role-specific sessions and redirects", async () => {
  const cases = [
    [fixtures.admin, adminCookie, "/admin/dashboard"],
    [fixtures.owner, ownerCookie, "/owner/dashboard"],
    [fixtures.tenant, tenantCookie, "/tenant/dashboard"],
  ];

  for (const [user, cookie, dashboard] of cases) {
    const response = await authApiRequest("/api/auth/me", { cookie });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.user.email, user.email);
    assert.equal(data.user.role, user.role);

    const login = await postJson("/api/auth/login", {
      email: user.email,
      password: TEST_PASSWORD,
    });
    const loginData = await login.json();
    assert.equal(login.status, 200);
    assert.equal(loginData.redirectUrl, dashboard);
    assert.match(login.headers.get("set-cookie") || "", /HttpOnly/i);
    assert.match(login.headers.get("set-cookie") || "", /SameSite=Lax/i);
  }
});

test("invalid and missing login credentials return explicit client errors", async () => {
  const invalid = await postJson("/api/auth/login", {
    email: fixtures.owner.email,
    password: `${TEST_PASSWORD}-wrong`,
  });
  assert.equal(invalid.status, 401);
  assert.equal((await invalid.json()).error, "Invalid email or password");

  for (const body of [{ email: fixtures.owner.email }, { password: TEST_PASSWORD }, {}]) {
    const missing = await postJson("/api/auth/login", body);
    assert.equal(missing.status, 400);
    assert.match((await missing.json()).error, /Email and password are required/);
  }
});

test("inactive accounts and unpaid owners cannot establish a session", async () => {
  const inactive = await postJson("/api/auth/login", {
    email: fixtures.inactiveTenant.email,
    password: TEST_PASSWORD,
  });
  assert.equal(inactive.status, 403);
  assert.match((await inactive.json()).error, /deactivated/i);

  const unpaid = await postJson("/api/auth/login", {
    email: fixtures.pendingOwner.email,
    password: TEST_PASSWORD,
  });
  const unpaidData = await unpaid.json();
  assert.equal(unpaid.status, 402);
  assert.equal(unpaidData.requiresPayment, true);
  assert.equal(unpaidData.amount, 499);
});

test("session validation rejects missing, malformed, and expired JWTs", async () => {
  const missing = await authApiRequest("/api/auth/me");
  assert.equal(missing.status, 200);
  assert.equal((await missing.json()).user, null);

  const malformed = await authApiRequest("/api/auth/me", {
    headers: { Cookie: "rentora_token=not-a-jwt" },
  });
  assert.equal(malformed.status, 200);
  assert.equal((await malformed.json()).user, null);

  const expiredToken = await signToken(
    {
      id: fixtures.tenant.id,
      email: fixtures.tenant.email,
      name: "Rentora Auth Test tenant",
      role: "tenant",
    },
    "3s"
  );
  const stillValid = await authApiRequest("/api/auth/me", {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal((await stillValid.json()).user.email, fixtures.tenant.email);

  await new Promise((resolve) => setTimeout(resolve, 3100));
  const expired = await authApiRequest("/api/auth/me", {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(expired.status, 200);
  assert.equal((await expired.json()).user, null);
});

test("admin, owner, and tenant APIs enforce their role permissions and status codes", async () => {
  const adminCases = [
    [undefined, 401],
    [adminCookie, 200],
    [ownerCookie, 403],
    [tenantCookie, 403],
  ];
  for (const [cookie, status] of adminCases) {
    const response = await authApiRequest("/api/admin/owner", { cookie });
    assert.equal(response.status, status);
  }

  const ownerCases = [
    [undefined, 403],
    [adminCookie, 200],
    [ownerCookie, 200],
    [tenantCookie, 403],
  ];
  for (const [cookie, status] of ownerCases) {
    const response = await authApiRequest("/api/owner/properties", { cookie });
    assert.equal(response.status, status);
  }

  const tenantCases = [
    [undefined, 401],
    [adminCookie, 403],
    [ownerCookie, 403],
    [tenantCookie, 200],
  ];
  for (const [cookie, status] of tenantCases) {
    const response = await authApiRequest("/api/tenant/rent-summary", { cookie });
    assert.equal(response.status, status);
  }
});

test("logout clears the authentication cookie", async () => {
  const response = await authApiRequest("/api/auth/logout", {
    method: "POST",
    cookie: ownerCookie,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") || "", /rentora_token=;/);
  assert.match(response.headers.get("set-cookie") || "", /Max-Age=0/i);

  const unauthenticated = await authApiRequest("/api/admin/owner");
  assert.equal(unauthenticated.status, 401);
});

test("registration rejects missing required fields, short passwords, and duplicate paid-owner email", async () => {
  for (const body of [
    { email: "rentora-auth-test-missing@example.invalid", password: TEST_PASSWORD },
    { name: "Test", password: TEST_PASSWORD },
    { name: "Test", email: "rentora-auth-test-missing@example.invalid" },
  ]) {
    const response = await postJson("/api/auth/register", body);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /required/i);
  }

  const shortPassword = await postJson("/api/auth/register", {
    name: "Rentora Auth Test",
    email: "rentora-auth-test-short@example.invalid",
    password: "short",
  });
  assert.equal(shortPassword.status, 400);

  const duplicate = await postJson("/api/auth/register", {
    name: "Rentora Auth Test",
    email: fixtures.duplicateOwner.email,
    password: TEST_PASSWORD,
  });
  assert.equal(duplicate.status, 409);
});

test("registration rejects invalid email addresses before creating an owner", async () => {
  const email = `rentora-auth-test-invalid-email-${Date.now()}`;
  trackRegistrationEmail(email);
  const response = await postJson("/api/auth/register", {
    name: "Rentora Auth Test",
    email,
    password: TEST_PASSWORD,
  });
  assert.equal(response.status, 400);
});

test(
  "valid owner registration starts payment only through the SSLCommerz sandbox",
  {
    skip:
      !process.env.SSLCOMMERZ_STORE_ID ||
      !process.env.SSLCOMMERZ_STORE_PASSWORD ||
      process.env.APP_URL !== TEST_CONFIG.serverUrl ||
      !["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(TEST_CONFIG.serverUrl).hostname
      ),
  },
  async () => {
    const email = `rentora-auth-test-registration-${Date.now()}@example.invalid`;
    trackRegistrationEmail(email);

    const response = await postJson("/api/auth/register", {
      name: "Rentora Auth Test Owner",
      email,
      password: TEST_PASSWORD,
      phone: "",
    });
    const data = await response.json();
    assert.equal(response.status, 200, data.error);
    assert.equal(data.success, true);
    assert.equal(data.requiresPayment, true);

    const gateway = new URL(data.gatewayUrl);
    assert.equal(gateway.protocol, "https:");
    assert.equal(gateway.hostname, "sandbox.sslcommerz.com");
  }
);
