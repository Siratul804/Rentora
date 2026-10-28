const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
  runSuite,
  waitForBodyText,
} = require("./selenium-helpers");

const demoPaymentDisabled =
  process.env.NODE_ENV === "production" || process.env.PAYMENT_MODE === "sslcommerz";
const skipDemoFlow = demoPaymentDisabled
  ? "run this test in development with PAYMENT_MODE unset or set to demo"
  : undefined;

const credentials = {
  email: `selenium-activation-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.test`,
  password: `Rentora-${Date.now()}-test`,
};
let mongoose;
let User;
let Invoice;
let transactionId;

async function findOwner() {
  return User.findOne({ email: credentials.email, role: "owner" }).lean();
}

async function findRegistrationInvoice(ownerId) {
  return Invoice.findOne({ ownerId, type: "owner_registration" }).lean();
}

const tests = [
  {
    name: "new owner starts unpaid with a pending registration invoice",
    skip: skipDemoFlow,
    run: async (driver) => {
      await driver.get(`${BASE_URL}/register`);
      await driver.wait(until.elementLocated(By.id("full-name")), WAIT_MS);
      await driver.findElement(By.id("full-name")).sendKeys("Selenium Activation Owner");
      await driver.findElement(By.id("email-address")).sendKeys(credentials.email);
      await driver.findElement(By.id("phone-number")).sendKeys("01711111111");
      await driver.findElement(By.id("create-password")).sendKeys(credentials.password);
      await driver.findElement(
        By.xpath("//button[contains(normalize-space(.), 'Pay ৳499 & Register as Owner')]")
      ).click();
      await driver.wait(until.urlContains("/payment/demo"), WAIT_MS);

      const currentUrl = new URL(await driver.getCurrentUrl());
      transactionId = currentUrl.searchParams.get("tran_id");
      assert.ok(transactionId, "Registration must open checkout with a transaction ID.");

      const owner = await findOwner();
      assert.ok(owner, "Registration must create the owner account.");
      assert.equal(owner.status, "Pending");

      const invoice = await findRegistrationInvoice(owner._id);
      assert.ok(invoice, "Registration must create an owner activation invoice.");
      assert.equal(invoice.status, "Pending");
      assert.equal(invoice.rentAmount, 499);
      assert.equal(invoice.tranId, transactionId);
    },
  },
  {
    name: "successful payment callback marks the demo checkout complete",
    skip: skipDemoFlow,
    run: async (driver) => {
      assert.ok(transactionId, "The owner registration test must complete first.");
      await driver.wait(
        until.elementLocated(By.xpath(
          "//button[contains(normalize-space(.), 'Simulate successful payment')]"
        )),
        WAIT_MS
      ).then((button) => button.click());
      await driver.wait(until.urlContains("/login?payment=success"), WAIT_MS);
      await waitForBodyText(driver, "Payment of ৳499 verified!");
    },
  },
  {
    name: "owner subscription status changes to Paid",
    skip: skipDemoFlow,
    run: async () => {
      const owner = await findOwner();
      assert.ok(owner, "The registered owner must still exist.");
      assert.equal(owner.status, "Paid");
    },
  },
  {
    name: "paid owner can log in successfully",
    skip: skipDemoFlow,
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "owner", credentials);
    },
  },
  {
    name: "paid owner gains access to the owner dashboard",
    skip: skipDemoFlow,
    run: async (driver) => {
      await driver.get(`${BASE_URL}/owner/dashboard`);
      await driver.wait(until.urlContains("/owner/dashboard"), WAIT_MS);
      await waitForBodyText(driver, "Total Monthly Rent");
    },
  },
  {
    name: "owner registration invoice status changes to Paid",
    skip: skipDemoFlow,
    run: async () => {
      const owner = await findOwner();
      assert.ok(owner, "The registered owner must still exist.");
      const invoice = await findRegistrationInvoice(owner._id);
      assert.ok(invoice, "The owner activation invoice must still exist.");
      assert.equal(invoice.status, "Paid");
      assert.equal(invoice.rentAmount, 499);
      assert.equal(invoice.tranId, transactionId);
      assert.equal(invoice.valId, `DEMO_${transactionId}`);
    },
  },
];

async function main() {
  let summary = { passed: 0, failed: 0, skipped: 0 };

  if (!skipDemoFlow) {
    try {
      const [{ default: dbConnect }, userModel, invoiceModel, mongooseModule] = await Promise.all([
        import("../lib/dbConnect.js"),
        import("../lib/models/User.js"),
        import("../lib/models/Invoice.js"),
        import("mongoose"),
      ]);
      mongoose = mongooseModule.default;
      User = userModel.default;
      Invoice = invoiceModel.Invoice;
      await dbConnect();
    } catch (error) {
      console.error(`FAIL payment activation setup: ${error.message || error}`);
      summary.failed = tests.length;
      console.log(
        `Payment activation summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${tests.length} total.`
      );
      process.exitCode = 1;
      return;
    }
  }

  try {
    summary = await runSuite("payment activation", tests);
  } finally {
    let cleanupFailed = false;
    if (mongoose) {
      try {
        const owner = await findOwner();
        if (owner) {
          await Invoice.deleteMany({ ownerId: owner._id, type: "owner_registration" });
          await User.deleteOne({ _id: owner._id, email: credentials.email, role: "owner" });
        }
      } catch (error) {
        cleanupFailed = true;
        summary.failed += 1;
        console.error(`FAIL payment activation cleanup: ${error.message || error}`);
      } finally {
        await mongoose.disconnect();
      }
    }
    console.log(
      `Payment activation summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${tests.length + Number(cleanupFailed)} total.`
    );
    if (summary.failed) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL payment activation setup: ${error.message || error}`);
  console.log(`Payment activation summary: 0 passed, ${tests.length} failed, 0 skipped, ${tests.length} total.`);
  process.exitCode = 1;
});
