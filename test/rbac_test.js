const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const { TextEncoder } = require("node:util");
const {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
  resetSession,
  runSuite,
  waitForBodyText,
} = require("./selenium-helpers");

const adminCredentials = {
  email: process.env.ADMIN_EMAIL || "admin@rentora.com",
  password: process.env.ADMIN_PASSWORD || "admin123456",
};

async function authenticateAsRole(driver, role) {
  await driver.get(BASE_URL);
  await driver.manage().deleteAllCookies();
  await driver.executeScript("localStorage.clear(); sessionStorage.clear();");

  const { SignJWT } = await import("jose");
  const secret = process.env.JWT_SECRET || "rentora_super_secret_jwt_key_2026_fallback";
  const token = await new SignJWT({
    id: `selenium-${role}`,
    email: `selenium-${role}@example.com`,
    name: `Selenium ${role}`,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  await driver.manage().addCookie({
    name: "rentora_token",
    value: token,
    path: "/",
  });
}

async function postOwnerApprovalAction(driver, action) {
  return driver.executeAsyncScript((requestAction, done) => {
    fetch("/api/admin/owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "1", action: requestAction }),
    })
      .then(async (response) => ({
        status: response.status,
        body: await response.json(),
      }))
      .then(done)
      .catch((error) => done({ error: error.message }));
  }, action);
}

const tests = [
  {
    name: "Owner is redirected away from the admin dashboard",
    run: async (driver) => {
      await authenticateAsRole(driver, "owner");
      await driver.get(`${BASE_URL}/admin/dashboard`);
      await driver.wait(until.urlContains("/owner/dashboard"), WAIT_MS);
      assert.match(await driver.getCurrentUrl(), /\/owner\/dashboard$/);
    },
  },
  {
    name: "Tenant is redirected away from the admin dashboard",
    run: async (driver) => {
      await authenticateAsRole(driver, "tenant");
      await driver.get(`${BASE_URL}/admin/dashboard`);
      await driver.wait(until.urlContains("/tenant/dashboard"), WAIT_MS);
      assert.match(await driver.getCurrentUrl(), /\/tenant\/dashboard$/);
    },
  },
  {
    name: "Owner is blocked from owner approval API functionality",
    run: async (driver) => {
      await authenticateAsRole(driver, "owner");
      const result = await postOwnerApprovalAction(driver, "approve");
      assert.equal(result.status, 403, result.body?.message || result.error);
    },
  },
  {
    name: "Tenant is blocked from owner approval API functionality",
    run: async (driver) => {
      await authenticateAsRole(driver, "tenant");
      const result = await postOwnerApprovalAction(driver, "reject");
      assert.equal(result.status, 403, result.body?.message || result.error);
    },
  },
  {
    name: "Unauthorized user is redirected to login from a protected admin route",
    run: async (driver) => {
      await resetSession(driver);
      await driver.get(`${BASE_URL}/admin/dashboard`);
      await driver.wait(until.urlContains("/login"), WAIT_MS);
      await waitForBodyText(driver, "Welcome back");
      const currentUrl = new URL(await driver.getCurrentUrl());
      assert.equal(currentUrl.pathname, "/login");
      assert.equal(currentUrl.searchParams.get("redirect"), "/admin/dashboard");
    },
  },
  {
    name: "Super Admin can access protected admin routes",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "admin", adminCredentials);
      assert.match(await driver.getCurrentUrl(), /\/admin\/dashboard$/);

      const ownersLink = await driver.findElement(By.css('a[href="/admin/owners"]'));
      await ownersLink.click();
      await driver.wait(until.urlContains("/admin/owners"), WAIT_MS);
      await waitForBodyText(driver, "Property Owners Directory");

      const providersLink = await driver.findElement(
        By.css('a[href="/admin/service-providers"]')
      );
      await providersLink.click();
      await driver.wait(until.urlContains("/admin/service-providers"), WAIT_MS);
      await waitForBodyText(driver, "Service Providers & Dispatch Fleet");
      assert.match(await driver.getCurrentUrl(), /\/admin\/service-providers$/);
    },
  },
];

runSuite("RBAC", tests).then(({ passed, failed, skipped }) => {
  console.log(
    `RBAC summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${tests.length} total.`
  );
});
