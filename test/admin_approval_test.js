const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
  runSuite,
  waitForBodyText,
} = require("./selenium-helpers");

const adminCredentials = {
  email: process.env.ADMIN_EMAIL || "admin@rentora.com",
  password: process.env.ADMIN_PASSWORD || "admin123456",
};
const pendingOwnerEmail = process.env.PENDING_OWNER_EMAIL || "";
const approvalSkip = pendingOwnerEmail
  ? undefined
  : "set PENDING_OWNER_EMAIL to a dedicated owner account in the configured database";

async function openPendingOwner(driver) {
  await loginAndWaitDashboard(driver, "admin", adminCredentials);
  await driver.findElement(By.css('a[href="/admin/owners"]')).click();
  await driver.wait(until.urlContains("/admin/owners"), WAIT_MS);
  await waitForBodyText(driver, "Property Owners Directory");

  await driver.wait(async () => {
    const rows = await driver.findElements(By.css("tbody tr"));
    for (const row of rows) {
      if ((await row.getText()).includes(pendingOwnerEmail)) return true;
    }
    return false;
  }, WAIT_MS, `Owner directory did not show ${pendingOwnerEmail}`);

  const rows = await driver.findElements(By.css("tbody tr"));
  for (const row of rows) {
    if ((await row.getText()).includes(pendingOwnerEmail)) return row;
  }
  throw new Error(`Pending owner ${pendingOwnerEmail} was not rendered in the owners table.`);
}

async function readOwnersFromApi(driver) {
  return driver.executeAsyncScript((done) => {
    fetch("/api/admin/owner", { cache: "no-store" })
      .then(async (response) => ({
        status: response.status,
        body: await response.json(),
      }))
      .then(done)
      .catch((error) => done({ error: error.message }));
  });
}

runSuite("admin approval", [
  {
    name: "admin approves a pending owner and the UI/API show the change",
    skip: approvalSkip,
    // Verify the directory's Approve action, success message, and persisted status.
    run: async (driver) => {
      const ownerRow = await openPendingOwner(driver);
      const approveButton = await ownerRow.findElement(
        By.xpath(".//button[normalize-space()='Approve']")
      );
      await approveButton.click();
      await waitForBodyText(driver, "Owner approved");

      const apiResult = await readOwnersFromApi(driver);
      assert.equal(apiResult.status, 200);
      assert.equal(apiResult.body.success, true);
      const owner = apiResult.body.owners.find((item) => item.email === pendingOwnerEmail);
      assert.ok(owner, `Owner API must include ${pendingOwnerEmail}.`);
      assert.equal(owner.status, "Approved");
    },
  },
  {
    name: "admin rejects a pending owner and the UI/API show the change",
    skip: approvalSkip,
    // Verify the directory's Reject action, success message, and persisted status.
    run: async (driver) => {
      const ownerRow = await openPendingOwner(driver);
      const rejectButton = await ownerRow.findElement(
        By.xpath(".//button[normalize-space()='Reject']")
      );
      await rejectButton.click();
      await waitForBodyText(driver, "Owner rejected");

      const apiResult = await readOwnersFromApi(driver);
      assert.equal(apiResult.status, 200);
      assert.equal(apiResult.body.success, true);
      const owner = apiResult.body.owners.find((item) => item.email === pendingOwnerEmail);
      assert.ok(owner, `Owner API must include ${pendingOwnerEmail}.`);
      assert.equal(owner.status, "Rejected");
    },
  },
]);