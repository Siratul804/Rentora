const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TENANT_EMAIL = process.env.TENANT_EMAIL || "23201111@uap-bd.edu";
const TENANT_PASSWORD = process.env.TENANT_PASSWORD || "23201111";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "23201128@uap-bd.edu";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "23201128";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedCount++;
  }
}

async function runSecurityTests() {
  console.log(`\n🔒 Starting Security Audit & Data Isolation Test Suite on ${BASE_URL}\n`);

  const options = new chrome.Options();
  if (process.env.HEADLESS !== "false") {
    options.addArguments("--headless=new");
  }
  options.addArguments("--no-sandbox", "--disable-dev-shm-usage", "--window-size=1280,800");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // ---------------------------------------------------------
    // Test 1: Unauthenticated UI Route Protection
    // ---------------------------------------------------------
    console.log("▶ Test 1: Unauthenticated Access to Protected UI Routes");
    await driver.get(`${BASE_URL}/owner/dashboard`);
    await driver.wait(until.urlContains("/login"), 8000);
    let currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes("/login"), "Unauthenticated request to /owner/dashboard redirected to /login");

    await driver.get(`${BASE_URL}/admin/dashboard`);
    await driver.wait(until.urlContains("/login"), 8000);
    currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes("/login"), "Unauthenticated request to /admin/dashboard redirected to /login");

    // ---------------------------------------------------------
    // Test 2: Unauthenticated Protected API Protection
    // ---------------------------------------------------------
    console.log("\n▶ Test 2: Unauthenticated Protected API Access");
    const unauthPropRes = await driver.executeAsyncScript((done) => {
      fetch("/api/properties")
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(
      unauthPropRes.status === 401 || unauthPropRes.status === 403,
      `GET /api/properties blocked for unauthenticated client (Status: ${unauthPropRes.status})`
    );

    const unauthLeaseRes = await driver.executeAsyncScript((done) => {
      fetch("/api/owner/leases")
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(
      unauthLeaseRes.status === 401 || unauthLeaseRes.status === 403,
      `GET /api/owner/leases blocked for unauthenticated client (Status: ${unauthLeaseRes.status})`
    );

    // ---------------------------------------------------------
    // Test 3: JWT Tampering / Forged Cookie Rejection
    // ---------------------------------------------------------
    console.log("\n▶ Test 3: Forged / Invalid Authentication Token Rejection");
    await driver.manage().addCookie({
      name: "rentora_token",
      value: "tampered_fake_signature_token_xyz_123",
      path: "/",
    });
    await driver.get(`${BASE_URL}/owner/dashboard`);
    await driver.wait(until.urlContains("/login"), 8000);
    currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes("/login"), "Tampered JWT cookie rejected and redirected to /login");
    await driver.manage().deleteAllCookies();

    // ---------------------------------------------------------
    // Test 4: Role-Based Access Control (Tenant attempting Owner/Admin actions)
    // ---------------------------------------------------------
    console.log("\n▶ Test 4: RBAC Isolation - Tenant Accessing Owner Resources");
    await driver.get(`${BASE_URL}/login`);

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000
    );
    const passInput = await driver.findElement(By.css('input[type="password"]'));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys(TENANT_EMAIL);
    await passInput.sendKeys(TENANT_PASSWORD);
    await submitBtn.click();

    await driver.wait(until.urlContains("/tenant/"), 10000);
    currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes("/tenant/"), "Tenant successfully logged in and redirected to tenant portal");

    // Tenant attempting to access Owner UI route
    await driver.get(`${BASE_URL}/owner/dashboard`);
    await driver.wait(until.urlContains("/tenant/"), 8000);
    currentUrl = await driver.getCurrentUrl();
    assert(!currentUrl.includes("/owner/dashboard"), "Tenant blocked from /owner/dashboard route");

    // Tenant attempting to call Owner Property Creation API
    const tenantWriteAttempt = await driver.executeAsyncScript((done) => {
      fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Malicious Property",
          address: "Unauthorized Street",
          type: "Apartment",
          totalUnits: 5,
        }),
      })
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(
      tenantWriteAttempt.status === 403,
      `Tenant rejected with 403 Forbidden when calling POST /api/properties (Status: ${tenantWriteAttempt.status})`
    );

    // ---------------------------------------------------------
    // Test 5: Multi-Tenant Data Isolation (Owner Data Scoping)
    // ---------------------------------------------------------
    console.log("\n▶ Test 5: Multi-Tenant Data Isolation Verification");
    await driver.manage().deleteAllCookies();

    // Log in as Owner
    await driver.get(`${BASE_URL}/login`);
    const ownerEmailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000
    );
    const ownerPassInput = await driver.findElement(By.css('input[type="password"]'));
    const ownerSubmitBtn = await driver.findElement(By.css('button[type="submit"]'));

    await ownerEmailInput.sendKeys(OWNER_EMAIL);
    await ownerPassInput.sendKeys(OWNER_PASSWORD);
    await ownerSubmitBtn.click();

    await driver.wait(until.urlContains("/owner/"), 10000);

    const ownerProps = await driver.executeAsyncScript((done) => {
      fetch("/api/properties")
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });

    assert(ownerProps.status === 200, "Owner successfully fetched scoped property inventory");
    const allPropsBelongToOwner =
      ownerProps.body?.properties?.length === 0 ||
      ownerProps.body?.properties?.every((p) => p.ownerId !== undefined);
    assert(allPropsBelongToOwner, "Property records are properly scoped to authenticated owner");

    // ---------------------------------------------------------
    // Test 6: Cross-Role Admin Route Guard
    // ---------------------------------------------------------
    console.log("\n▶ Test 6: Cross-Role Admin Route Guard for Owner");
    await driver.get(`${BASE_URL}/admin/dashboard`);
    await driver.wait(until.urlContains("/owner/"), 8000);
    currentUrl = await driver.getCurrentUrl();
    assert(!currentUrl.includes("/admin/dashboard"), "Owner blocked from entering /admin/dashboard");

  } catch (error) {
    console.error("\n❌ Unhandled error during security testing:", error.message);
    failedCount++;
  } finally {
    await driver.quit();
    console.log("\n==========================================");
    console.log(`Security Test Finished: ${passedCount} Passed, ${failedCount} Failed`);
    console.log("==========================================\n");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runSecurityTests();
