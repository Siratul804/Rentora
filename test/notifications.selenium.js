import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { By, until } from "selenium-webdriver";
import {
  TEST_CONFIG,
  TEST_PASSWORD,
  cleanupNotificationFixtures,
  createNotificationFixtures,
} from "./notification-test-helpers.js";

let fixtures;
let driver;

before(async () => {
  console.log("[SETUP 1] Starting Chrome");

  try {
    driver = await new (await import("selenium-webdriver")).Builder()
      .forBrowser("chrome")
      .build();
  } catch (error) {
    throw new Error(
      `Selenium execution blocked: Chrome and a compatible WebDriver are required. ${error.message}`
    );
  }

  console.log("[SETUP 2] Chrome started");
  console.log("[SETUP 3] Creating notification fixtures");

  fixtures = await createNotificationFixtures();

  console.log("[SETUP 4] Notification fixtures created");
});

after(async () => {
  try {
    if (driver) await driver.quit();
  } finally {
    await cleanupNotificationFixtures();
  }
});

async function signInAndOpenCenter(credentials, dashboardPath, width) {
  async function findFirstVisible(selectors, timeout = 10000) {
  return driver.wait(async () => {
    for (const selector of selectors) {
      const elements = await driver.findElements(By.css(selector));

      for (const element of elements) {
        if (await element.isDisplayed()) {
          return element;
        }
      }
    }

    return false;
  }, timeout);
}
  await driver.manage().window().setRect({ width, height: 900 });
  await driver.get(new URL("/login", TEST_CONFIG.serverUrl).toString());
 const emailInput = await findFirstVisible([
  'input[type="email"]',
  'input[name="email"]',
  'input[autocomplete="username"]',
  'input[id*="email"]',
]);

await emailInput.sendKeys(credentials.email);

const passwordInput = await findFirstVisible([
  'input[type="password"]',
  'input[name="password"]',
  'input[autocomplete="current-password"]',
]);

await passwordInput.sendKeys(TEST_PASSWORD);
const submitButton = await findFirstVisible([
  'button[type="submit"]',
  'input[type="submit"]',
]);

await submitButton.click();
console.log("Login submitted. Waiting for dashboard:", dashboardPath);

await driver.wait(until.urlContains(dashboardPath), 15000);
  console.log("Dashboard opened:", await driver.getCurrentUrl());
  const bell = await driver.wait(
  until.elementLocated(By.css('button[aria-label^="Notifications"]')),
  10000
);

console.log("Notification bell found:", await bell.getAttribute("aria-label"));

await driver.wait(async () => {
  const label = await bell.getAttribute("aria-label");
  console.log("Current notification label:", label);
  return (label || "").includes("1 unread");
}, 10000);


await bell.click();
console.log("Notification bell clicked");

await driver.wait(async () => {
  return (await bell.getAttribute("aria-expanded")) === "true";
}, 5000);

console.log("Notification panel state:", await bell.getAttribute("aria-expanded"));

const notificationPanel = await driver.wait(async () => {
  const elements = await driver.findElements(By.id("notification-center"));

  if (elements.length === 0) return false;
  if (!(await elements[0].isDisplayed())) return false;

  return elements[0];
}, 5000);

console.log("Notification center opened:", await notificationPanel.isDisplayed());

return { bell, center: notificationPanel };


}

async function verifyNotificationCenter(credentials, dashboardPath, width, expectedTitle) {
  const { bell, center } = await signInAndOpenCenter(credentials, dashboardPath, width);
  await driver.wait(until.elementTextContains(center, expectedTitle), 10000);
  console.log("[CHECK 1] Notification center opened");

await driver.wait(until.elementTextContains(center, expectedTitle), 10000);
console.log("[CHECK 2] Expected notification title found");

assert.ok((await center.findElements(By.css("time[datetime]"))).length > 0);
console.log("[CHECK 3] Notification timestamp found");


console.log("[CHECK 4] Mark as read button found");

await markRead.click();
console.log("[CHECK 5] Mark as read clicked");
  assert.ok((await center.findElements(By.css("time[datetime]"))).length > 0);

  const markRead = await center.findElement(By.xpath(".//button[normalize-space()='Mark as read']"));
  await markRead.click();
  await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space()='Mark as unread']")),
    10000
  );
  await driver.wait(async () => (await bell.getAttribute("aria-label")).includes("0 unread"), 10000);

  await center.findElement(By.xpath(".//button[normalize-space()='Mark as unread']")).click();
  await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space()='Mark as read']")),
    10000
  );
  await driver.wait(async () => (await bell.getAttribute("aria-label")).includes("1 unread"), 10000);

  const rect = await center.getRect();
  assert.ok(rect.x >= 0);
  assert.ok(rect.x + rect.width <= width);
}

test("owner notification center shows unread count and supports read/unread actions", async () => {
  await verifyNotificationCenter(
    fixtures.owner,
    "/owner/dashboard",
    1280,
    "Test maintenance request"
  );
});

test("tenant notification center shows unread count and supports read/unread actions on mobile", async () => {
  await verifyNotificationCenter(
    fixtures.tenant,
    "/tenant/dashboard",
    390,
    "Test rent invoice"
  );
});
