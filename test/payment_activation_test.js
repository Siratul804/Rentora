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

const demoPaymentDisabled =
  process.env.NODE_ENV === "production" || process.env.PAYMENT_MODE === "sslcommerz";
const skipDemoFlow = demoPaymentDisabled
  ? "run this test in development with PAYMENT_MODE unset or set to demo"
  : undefined;

const credentials = {
  email: `selenium-activation-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.test`,
  password: `Rentora-${Date.now()}-test`,
};
const failureEmail = `selenium-payment-failed-${Date.now()}@example.test`;
const cancellationEmail = `selenium-payment-cancelled-${Date.now()}@example.test`;
let mongoose;
let User;
let Invoice;
let transactionId;

async function postPaymentCallback(driver, endpoint, email) {
  return driver.executeAsyncScript((url, value, done) => {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ value_a: value }),
      redirect: "follow",
    })
      .then((response) => done({ status: response.status, url: response.url }))
      .catch((error) => done({ error: error.message }));
  }, endpoint, email);
}

async function findOwner() {
  return User.findOne({ email: credentials.email, role: "owner" }).lean();
}

async function findRegistrationInvoice(ownerId) {
  return Invoice.findOne({ ownerId, type: "owner_registration" }).lean();
}

const tests = [
  {
    id: "AUTH-PAYMENT-001",
    description: "New owner remains unpaid while activation invoice is pending",
    preconditions: "Demo payment is enabled and MongoDB is available.",
    name: "new owner starts unpaid with a pending registration invoice",
    skip: skipDemoFlow,
    requiresDatabase: true,
    steps: ["Register a new owner.", "Verify the owner and activation invoice before checkout completes."],
    expectedResult: "Owner and invoice are Pending until successful payment.",
    actualResult: "Not run",
    status: "Not Run",
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
    id: "AUTH-PAYMENT-002",
    dependsOn: ["AUTH-PAYMENT-001"],
    description: "Successful demo payment activates owner account",
    preconditions: "A pending demo registration transaction exists.",
    name: "successful payment callback marks the demo checkout complete",
    skip: skipDemoFlow,
    requiresDatabase: true,
    steps: ["Complete the demo checkout.", "Verify login success banner."],
    expectedResult: "Payment succeeds and user is redirected to login with a success message.",
    actualResult: "Not run",
    status: "Not Run",
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
    id: "AUTH-PAYMENT-003",
    dependsOn: ["AUTH-PAYMENT-002"],
    description: "Successful payment updates owner subscription",
    preconditions: "The demo payment callback completed successfully.",
    name: "owner subscription status changes to Paid",
    skip: skipDemoFlow,
    requiresDatabase: true,
    steps: ["Read the registered owner from the database."],
    expectedResult: "Owner status is Paid.",
    actualResult: "Not run",
    status: "Not Run",
    run: async () => {
      const owner = await findOwner();
      assert.ok(owner, "The registered owner must still exist.");
      assert.equal(owner.status, "Paid");
    },
  },
  {
    id: "AUTH-PAYMENT-004",
    dependsOn: ["AUTH-PAYMENT-003"],
    description: "Paid owner can sign in",
    preconditions: "Owner activation payment succeeded.",
    name: "paid owner can log in successfully",
    skip: skipDemoFlow,
    requiresDatabase: true,
    steps: ["Sign in using the activated owner account."],
    expectedResult: "Owner is redirected to the owner dashboard.",
    actualResult: "Not run",
    status: "Not Run",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "owner", credentials);
    },
  },
  {
    id: "AUTH-PAYMENT-005",
    dependsOn: ["AUTH-PAYMENT-004"],
    description: "Paid owner can open owner dashboard",
    preconditions: "Owner activation payment succeeded.",
    name: "paid owner gains access to the owner dashboard",
    skip: skipDemoFlow,
    requiresDatabase: true,
    steps: ["Open /owner/dashboard directly."],
    expectedResult: "Owner dashboard is accessible.",
    actualResult: "Not run",
    status: "Not Run",
    run: async (driver) => {
      await driver.get(`${BASE_URL}/owner/dashboard`);
      await driver.wait(until.urlContains("/owner/dashboard"), WAIT_MS);
      assert.equal(new URL(await driver.getCurrentUrl()).pathname, "/owner/dashboard");
    },
  },
  {
    id: "AUTH-PAYMENT-006",
    dependsOn: ["AUTH-PAYMENT-002"],
    description: "Successful payment updates activation invoice",
    preconditions: "Owner activation payment succeeded.",
    name: "owner registration invoice status changes to Paid",
    skip: skipDemoFlow,
    requiresDatabase: true,
    steps: ["Read the registration invoice from the database."],
    expectedResult: "Invoice is Paid and records the transaction and validation IDs.",
    actualResult: "Not run",
    status: "Not Run",
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
  {
    id: "AUTH-PAYMENT-007",
    description: "Failed payment marks owner failed and displays error",
    preconditions: "A pending failure-test owner exists and MongoDB is available.",
    name: "failed activation payment is reflected on login",
    requiresDatabase: true,
    steps: ["POST a failed payment callback.", "Verify owner status and failure banner."],
    expectedResult: "Owner status is Failed and login shows the payment failure message.",
    actualResult: "Not run",
    status: "Not Run",
    run: async (driver) => {
      await resetSession(driver);
      const callback = await postPaymentCallback(driver, "/api/payment/fail", failureEmail);
      assert.equal(new URL(callback.url).pathname, "/login");
      assert.equal(new URL(callback.url).searchParams.get("payment"), "failed");
      const owner = await User.findOne({ email: failureEmail }).lean();
      assert.equal(owner.status, "Failed");
      await driver.get(callback.url);
      await waitForBodyText(driver, "Payment failed or was declined");
    },
  },
  {
    id: "AUTH-PAYMENT-008",
    description: "Cancelled payment leaves owner pending and displays warning",
    preconditions: "A pending cancellation-test owner exists and MongoDB is available.",
    name: "cancelled activation payment leaves account pending",
    requiresDatabase: true,
    steps: ["POST a payment cancellation callback.", "Verify owner status and cancellation banner."],
    expectedResult: "Owner remains Pending and login explains payment is required.",
    actualResult: "Not run",
    status: "Not Run",
    run: async (driver) => {
      await resetSession(driver);
      const callback = await postPaymentCallback(driver, "/api/payment/cancel", cancellationEmail);
      assert.equal(new URL(callback.url).pathname, "/login");
      assert.equal(new URL(callback.url).searchParams.get("payment"), "cancelled");
      const owner = await User.findOne({ email: cancellationEmail }).lean();
      assert.equal(owner.status, "Pending");
      await driver.get(callback.url);
      await waitForBodyText(driver, "Payment cancelled");
    },
  },
  {
    id: "AUTH-PAYMENT-009",
    description: "Demo checkout cancellation returns to login",
    preconditions: "Demo checkout page is available.",
    name: "demo checkout cancel link returns to login",
    skip: skipDemoFlow,
    steps: ["Open demo checkout.", "Click Cancel and return to sign in."],
    expectedResult: "Browser returns to login with payment=cancelled.",
    actualResult: "Not run",
    status: "Not Run",
    run: async (driver) => {
      await resetSession(driver);
      await driver.get(`${BASE_URL}/payment/demo?tran_id=selenium-cancel`);
      await driver.findElement(By.linkText("Cancel and return to sign in")).click();
      await driver.wait(until.urlContains("/login?payment=cancelled"), WAIT_MS);
      await waitForBodyText(driver, "Payment cancelled");
    },
  },
];

async function main() {
  let summary = { passed: 0, failed: 0, skipped: 0 };

  try {
    const [{ default: dbConnect }, userModel, invoiceModel, mongooseModule, bcryptModule] = await Promise.all([
      import("../lib/dbConnect.js"),
      import("../lib/models/User.js"),
      import("../lib/models/Invoice.js"),
      import("mongoose"),
      import("bcryptjs"),
    ]);
    mongoose = mongooseModule.default;
    User = userModel.default;
    Invoice = invoiceModel.Invoice;
    await dbConnect();
    const passwordHash = await bcryptModule.default.hash(credentials.password, 10);
    await User.create([
      { name: "Selenium Failed Payment", email: failureEmail, passwordHash, role: "owner", status: "Pending" },
      { name: "Selenium Cancelled Payment", email: cancellationEmail, passwordHash, role: "owner", status: "Pending" },
    ]);
  } catch (error) {
    console.error(`FAIL payment activation setup: ${error.message || error}`);
    const databaseSkip = "Database fixture setup failed; check MongoDB connectivity and configuration.";
    for (const test of tests) {
      if (test.requiresDatabase) {
        test.skip = databaseSkip;
        test.blockingSkip = true;
      }
    }
  }

  try {
    summary = await runSuite("payment activation", tests);
  } finally {
    let cleanupFailed = false;
    if (mongoose?.connection.readyState === 1) {
      try {
        const owner = await findOwner();
        if (owner) {
          await Invoice.deleteMany({ ownerId: owner._id, type: "owner_registration" });
          await User.deleteOne({ _id: owner._id, email: credentials.email, role: "owner" });
        }
        await User.deleteMany({ email: { $in: [failureEmail, cancellationEmail] } });
      } catch (error) {
        cleanupFailed = true;
        summary.failed += 1;
        console.error(`FAIL payment activation cleanup: ${error.message || error}`);
      } finally {
        await mongoose.disconnect();
      }
    } else if (mongoose) {
      await mongoose.disconnect();
    }
    console.log(
      `Payment activation summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${summary.blocked} blocked, ${tests.length + Number(cleanupFailed)} total.`
    );
    if (summary.failed) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL payment activation setup: ${error.message || error}`);
  console.log(`Payment activation summary: 0 passed, ${tests.length} failed, 0 skipped, ${tests.length} total.`);
  process.exitCode = 1;
});
