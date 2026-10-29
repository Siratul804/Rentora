const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
  runSuite,
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

async function openProviderDirectory(driver) {
  await loginAndWaitDashboard(driver, "admin", credentials.admin);
  const serviceProvidersLink = await driver.wait(
    until.elementLocated(By.css('a[href="/admin/service-providers"]')),
    WAIT_MS
  );
  await serviceProvidersLink.click();
  await driver.wait(
    until.urlIs(`${BASE_URL}/admin/service-providers`),
    WAIT_MS
  );
  await waitForBodyText(driver, "Service Providers & Dispatch Fleet");
}

async function getProviderRows(driver) {
  return driver.findElements(By.css("tbody tr"));
}

async function selectCategory(driver, category, expectedCount) {
  await driver.findElement(
    By.xpath(`//button[normalize-space()='${category}']`)
  ).click();
  await driver.wait(async () =>
    (await getProviderRows(driver)).length === expectedCount, WAIT_MS
  );
}

async function verifyColumn(driver, name) {
  const header = await driver.wait(
    until.elementLocated(By.xpath(`//table/thead//th[normalize-space()='${name}']`)),
    WAIT_MS
  );
  assert.ok(await header.isDisplayed(), `${name} column header should be visible.`);
}

const tests = [
  {
    name: "Super Admin login",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "admin", credentials.admin);
      assert.match(await driver.getCurrentUrl(), /\/admin\/dashboard$/);
    },
  },
  {
    name: "Navigate to /admin/service-providers",
    run: async (driver) => {
      await openProviderDirectory(driver);
      assert.equal(await driver.getCurrentUrl(), `${BASE_URL}/admin/service-providers`);
    },
  },
  {
    name: "Provider list renders",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await waitForBodyText(driver, "Registered Technicians");
      assert.ok(await driver.findElement(By.css("table")).isDisplayed());
    },
  },
  {
    name: "At least one provider row exists",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await driver.wait(async () => (await getProviderRows(driver)).length > 0, WAIT_MS);
      assert.ok((await getProviderRows(driver)).length > 0);
    },
  },
  {
    name: "Provider Name column is displayed",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await verifyColumn(driver, "Provider Name");
    },
  },
  {
    name: "Trade Specialty column is displayed",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await verifyColumn(driver, "Trade Specialty");
    },
  },
  {
    name: "Coverage Zone column is displayed",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await verifyColumn(driver, "Coverage Zone");
    },
  },
  {
    name: "Rating column is displayed",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await verifyColumn(driver, "Rating");
    },
  },
  {
    name: "Contact column is displayed",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await verifyColumn(driver, "Contact");
    },
  },
  {
    name: "Status column and status badge are displayed",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await verifyColumn(driver, "Status");
      const status = await driver.wait(
        until.elementLocated(By.xpath("//table/tbody//td[normalize-space()='Active']")),
        WAIT_MS
      );
      assert.ok(await status.isDisplayed());
    },
  },
  {
    name: "View Profile button exists",
    run: async (driver) => {
      await openProviderDirectory(driver);
      const button = await driver.wait(
        until.elementLocated(By.xpath("//table//button[normalize-space()='View Profile']")),
        WAIT_MS
      );
      assert.ok(await button.isDisplayed());
    },
  },
  {
    name: "Category filters show matching providers",
    run: async (driver) => {
      await openProviderDirectory(driver);
      await selectCategory(driver, "All", 5);
      await selectCategory(driver, "Plumbing", 2);
      let rows = await getProviderRows(driver);
      assert.ok((await Promise.all(rows.map((row) => row.getText())))
        .every((text) => text.includes("Plumbing")));

      await selectCategory(driver, "Electrical", 1);
      rows = await getProviderRows(driver);
      assert.ok((await rows[0].getText()).includes("Electrical"));

      await selectCategory(driver, "HVAC & AC", 1);
      rows = await getProviderRows(driver);
      assert.ok((await rows[0].getText()).includes("HVAC & AC"));
      await selectCategory(driver, "All", 5);
    },
  },
  {
    name: "Super Admin can access the provider directory",
    run: async (driver) => {
      await openProviderDirectory(driver);
      assert.equal(await driver.getCurrentUrl(), `${BASE_URL}/admin/service-providers`);
      await waitForBodyText(driver, "Registered Technicians");
    },
  },
  {
    name: "Owner is redirected away from the provider directory",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "owner", credentials.owner);
      await driver.get(`${BASE_URL}/admin/service-providers`);
      await driver.wait(until.urlContains("/owner/dashboard"), WAIT_MS);
      assert.match(await driver.getCurrentUrl(), /\/owner\/dashboard$/);
    },
  },
  {
    name: "Tenant is redirected away from the provider directory",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "tenant", credentials.tenant);
      await driver.get(`${BASE_URL}/admin/service-providers`);
      await driver.wait(until.urlContains("/tenant/dashboard"), WAIT_MS);
      assert.match(await driver.getCurrentUrl(), /\/tenant\/dashboard$/);
    },
  },
];

runSuite("provider directory", tests).then(({ passed, failed, skipped }) => {
  console.log(
    `Provider directory summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${tests.length} total.`
  );
});
