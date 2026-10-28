const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OWNER_EMAIL = "23201128@uap-bd.edu";
const OWNER_PASSWORD = "23201128";

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

async function runTests() {
  console.log(`\n🚀 Starting Property & Lease Test Suite on ${BASE_URL}\n`);

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
    // Setup / Auth: Login as Owner
    // ---------------------------------------------------------
    console.log("▶ Test 1: Sign in with Property Owner Credentials");
    await driver.get(`${BASE_URL}/login`);

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000
    );
    const passInput = await driver.findElement(By.css('input[type="password"]'));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys(OWNER_EMAIL);
    await passInput.sendKeys(OWNER_PASSWORD);
    await submitBtn.click();

    await driver.wait(until.urlContains("/owner/"), 10000);
    const currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes("/owner/"), "Owner successfully logged in and redirected");

    // ---------------------------------------------------------
    // Property API: Verification & Validation
    // ---------------------------------------------------------
    console.log("\n▶ Test 2: GET /api/properties Endpoint Verification");
    const getPropsResult = await driver.executeAsyncScript((done) => {
      fetch("/api/properties")
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(getPropsResult.status === 200, "GET /api/properties returned status 200");
    assert(getPropsResult.body && Array.isArray(getPropsResult.body.properties), "GET /api/properties returned properties array");

    console.log("\n▶ Test 3: POST /api/properties Validation (Missing Name & Invalid Units)");
    const invalidPropResult = await driver.executeAsyncScript((done) => {
      fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", address: "Dhaka", type: "Apartment", totalUnits: 0 }),
      })
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(invalidPropResult.status === 400, "POST /api/properties rejected invalid data with 400");
    assert(Boolean(invalidPropResult.body?.error), "Error message returned for invalid property payload");

    // ---------------------------------------------------------
    // Property UI: Create New Property
    // ---------------------------------------------------------
    console.log("\n▶ Test 4: Property UI Flow - Add New Property");
    await driver.get(`${BASE_URL}/owner/properties`);

    const addPropertyBtn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "Add New Property")]')),
      10000
    );
    await addPropertyBtn.click();

    const propNameInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder*="Green Horizon"]')),
      5000
    );
    const propAddressInput = await driver.findElement(By.css('input[placeholder*="House 42"]'));
    const propUnitsInput = await driver.findElement(By.css('input[type="number"]'));

    const testPropName = `Test Residency ${Date.now()}`;
    await propNameInput.sendKeys(testPropName);
    await propAddressInput.sendKeys("Road 15, Dhanmondi, Dhaka");
    await propUnitsInput.clear();
    await propUnitsInput.sendKeys("12");

    const savePropBtn = await driver.findElement(By.xpath('//form//button[@type="submit"]'));
    await savePropBtn.click();

    const createdCard = await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(text(), "${testPropName}")]`)),
      10000
    );
    assert(Boolean(createdCard), `Newly created property "${testPropName}" visible on properties page`);

    // ---------------------------------------------------------
    // Lease API: Verification & Validation
    // ---------------------------------------------------------
    console.log("\n▶ Test 5: GET /api/owner/leases Endpoint Verification");
    const getLeasesResult = await driver.executeAsyncScript((done) => {
      fetch("/api/owner/leases")
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(getLeasesResult.status === 200, "GET /api/owner/leases returned status 200");
    assert(getLeasesResult.body && Array.isArray(getLeasesResult.body.leases), "GET /api/owner/leases returned leases array");

    console.log("\n▶ Test 6: POST /api/owner/leases Validation (Missing Tenant Name)");
    const invalidLeaseResult = await driver.executeAsyncScript((done) => {
      fetch("/api/owner/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName: "", propertyName: "Test Prop", rent: 20000 }),
      })
        .then((res) => res.json().then((body) => done({ status: res.status, body })))
        .catch((err) => done({ error: err.message }));
    });
    assert(invalidLeaseResult.status === 400, "POST /api/owner/leases rejected missing tenant with 400");
    assert(Boolean(invalidLeaseResult.body?.error), "Error message returned for invalid lease payload");


  } catch (error) {
    console.error("\n❌ Unhandled error during test execution:", error.message);
    failedCount++;
  } finally {
    await driver.quit();
    console.log("\n==========================================");
    console.log(`Test Execution Finished: ${passedCount} Passed, ${failedCount} Failed`);
    console.log("==========================================\n");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
