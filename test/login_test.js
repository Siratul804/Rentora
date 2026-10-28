const assert = require("node:assert/strict");
const {
  loginAndWaitDashboard,
  resetSession,
  runSuite,
  submitLogin,
  waitForBodyText,
} = require("./selenium-helpers");

const credentials = {
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@rentora.com",
    password: process.env.ADMIN_PASSWORD || "admin123456",
  },
  owner: {
    email: process.env.OWNER_EMAIL || "23201128@uap-bd.edu",
    password: process.env.OWNER_PASSWORD || "23201128",
  },
  tenant: {
    email: process.env.TENANT_EMAIL || "23201111@uap-bd.edu",
    password: process.env.TENANT_PASSWORD || "23201111",
  },
};

runSuite("login", [
  {
    name: "valid admin login redirects to the admin dashboard",
    // Verify that the admin credentials route to the admin dashboard.
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "admin", credentials.admin);
      assert.match(await driver.getCurrentUrl(), /\/admin\/dashboard$/);
    },
  },
  {
    name: "valid owner login redirects to the owner dashboard",
    // Verify that the owner credentials route to the owner dashboard.
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "owner", credentials.owner);
      assert.match(await driver.getCurrentUrl(), /\/owner\/dashboard$/);
    },
  },
  {
    name: "valid tenant login redirects to the tenant dashboard",
    // Verify that the tenant credentials route to the tenant dashboard.
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "tenant", credentials.tenant);
      assert.match(await driver.getCurrentUrl(), /\/tenant\/dashboard$/);
    },
  },
  {
    name: "invalid credentials show the login error and do not redirect",
    // Verify the form's actual invalid-credentials message.
    run: async (driver) => {
      await resetSession(driver);
      await submitLogin(driver, "invalid.selenium@example.com", "wrong-password");
      await waitForBodyText(driver, "Invalid email or password");
      assert.match(await driver.getCurrentUrl(), /\/login/);
    },
  },
]);