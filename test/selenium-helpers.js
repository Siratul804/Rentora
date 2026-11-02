require("dotenv").config({ path: ".env.local" });

const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const net = require("node:net");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const WAIT_MS = Number(process.env.SELENIUM_WAIT_MS || 12000);

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (connected) => {
      socket.destroy();
      resolve(connected);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function ensureLocalServer() {
  const url = new URL(BASE_URL);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const loopbackHosts = ["localhost", "127.0.0.1", "::1"];
  if (url.protocol !== "http:" || !loopbackHosts.includes(hostname)) return null;

  const port = Number(url.port || 80);
  const host = hostname === "localhost" ? "127.0.0.1" : hostname;
  if (await canConnect(host, port)) return null;

  const server = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "dev", "--port", String(port)],
    { stdio: "inherit" }
  );
  let startupError;
  server.once("error", (error) => {
    startupError = error;
  });

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await canConnect(host, port)) return server;
    if (startupError || server.exitCode !== null) {
      throw startupError || new Error(`Next.js server exited with code ${server.exitCode}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  server.kill();
  throw new Error(`Next.js server did not start at ${BASE_URL} within 60 seconds.`);
}

async function createDriver() {
  const options = new chrome.Options();
  options.addArguments(
    "--window-size=1440,1000",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage"
  );
  if (process.env.HEADLESS !== "false") options.addArguments("--headless=new");

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

async function resetSession(driver) {
  await driver.get(BASE_URL);
  await driver.manage().deleteAllCookies();
  await driver.executeScript("localStorage.clear(); sessionStorage.clear();");
  await driver.get(`${BASE_URL}/login`);
}

async function submitLogin(driver, email, password) {
  await driver.wait(until.elementLocated(By.id("email-address")), WAIT_MS);
  await driver.findElement(By.id("email-address")).sendKeys(email);
  await driver.findElement(By.id("password")).sendKeys(password);
  await driver.findElement(By.css("form button[type='submit']")).click();
}

async function loginAndWaitDashboard(driver, role, credentials) {
  const routes = {
    admin: "/admin/dashboard",
    owner: "/owner/dashboard",
    tenant: "/tenant/dashboard",
  };
  assert.ok(routes[role], `Unknown login role: ${role}`);

  await resetSession(driver);
  await submitLogin(driver, credentials.email, credentials.password);
  await driver.wait(until.urlContains(routes[role]), WAIT_MS);
}

async function waitForBodyText(driver, text) {
  await driver.wait(async () => {
    const body = await driver.findElement(By.css("body")).getText();
    return body.includes(text);
  }, WAIT_MS, `Expected page text: ${text}`);
}

async function runSuite(suiteName, tests) {
  let driver;
  let server;
  let passed = 0;
  let skipped = 0;
  let blocked = 0;
  let failures = 0;
  const completedCases = new Map();

  try {
    server = await ensureLocalServer();
    driver = await createDriver();
    for (const [index, test] of tests.entries()) {
      test.caseId = test.caseId || `${suiteName.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${String(index + 1).padStart(3, "0")}`;
      test.description = test.description || test.name;
      test.preconditions = test.preconditions || "Application and required test accounts are configured.";
      test.steps = test.steps || [`Execute the scenario: ${test.description}.`];
      test.expectedResult = test.expectedResult || "The scenario completes and all assertions pass.";
      test.actualResult = test.actualResult || "Not run";
      test.status = test.status || "Not Run";

      const failedDependency = (test.dependsOn || []).find(
        (dependencyId) => completedCases.get(dependencyId) !== "Pass"
      );
      if (failedDependency) {
        test.actualResult = `Not run: prerequisite ${failedDependency} did not pass.`;
        test.status = "Not Run";
        test.blockingSkip = true;
        blocked += 1;
        console.log(`BLOCKED ${suiteName}: ${test.name} (${test.actualResult})`);
        completedCases.set(test.id || test.caseId, test.status);
        continue;
      }

      if (test.skip) {
        test.actualResult = test.skip;
        if (test.blockingSkip) {
          blocked += 1;
          console.log(`BLOCKED ${suiteName}: ${test.name} (${test.skip})`);
        } else {
          skipped += 1;
          console.log(`SKIP ${suiteName}: ${test.name} (${test.skip})`);
        }
        completedCases.set(test.id || test.caseId, test.status);
        continue;
      }

      try {
        await test.run(driver);
        passed += 1;
        test.actualResult = "Passed: observed behavior matched the expected result.";
        test.status = "Pass";
        completedCases.set(test.id || test.caseId, test.status);
        console.log(`PASS ${suiteName}: ${test.name}`);
      } catch (error) {
        failures += 1;
        test.actualResult = `Failed: ${error.message || error}`;
        test.status = "Fail";
        completedCases.set(test.id || test.caseId, test.status);
        console.error(`FAIL ${suiteName}: ${test.name}`);
        console.error(error.stack || error.message || error);
      }
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${suiteName}: could not start the test environment`);
    console.error(error.stack || error.message || error);
  } finally {
    if (driver) await driver.quit();
    if (server) server.kill();
  }

  const reportDirectory = path.join(__dirname, "test-results");
  const reportPath = path.join(
    reportDirectory,
    `${suiteName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-latest.json`
  );
  try {
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(
      reportPath,
      `${JSON.stringify({
        suite: suiteName,
        executedAt: new Date().toISOString(),
        summary: { passed, failed: failures, skipped, blocked },
        cases: tests.map((test) => ({
          id: test.id || test.caseId,
          description: test.description,
          preconditions: test.preconditions,
          steps: test.steps,
          expectedResult: test.expectedResult,
          actualResult: test.actualResult,
          status: test.status,
        })),
      }, null, 2)}\n`
    );
    console.log(`Test execution report written to ${reportPath}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${suiteName}: could not write execution report`);
    console.error(error.stack || error.message || error);
  }

  if (failures || blocked) process.exitCode = 1;
  return { passed, failed: failures, skipped, blocked, reportPath };
}

module.exports = {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
  resetSession,
  runSuite,
  submitLogin,
  waitForBodyText,
};
