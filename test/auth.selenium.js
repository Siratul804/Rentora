import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { By, until } from "selenium-webdriver";
import {
  cleanupAuthFixtures,
  createAuthFixtures,
  TEST_CONFIG,
} from "./auth-test-helpers.js";

const DASHBOARDS = {
  admin: "/admin/dashboard",
  owner: "/owner/dashboard",
  tenant: "/tenant/dashboard",
};

let fixtures;
let driver;

before(async () => {
  fixtures = await createAuthFixtures();
  try {
    const { Builder } = await import("selenium-webdriver");
    driver = await new Builder().forBrowser("chrome").build();
    await driver.manage().window().setRect({ width: 1280, height: 900 });
  } catch (error) {
    throw new Error(
      `Selenium execution blocked: Chrome and a compatible WebDriver are required. ${error.message}`
    );
  }
});

beforeEach(async () => {
  if (!driver) return;
  await driver.manage().deleteAllCookies();
  await driver.get(TEST_CONFIG.serverUrl);
  await driver.executeScript("localStorage.clear(); sessionStorage.clear();");
});

after(async () => {
  try {
    if (driver) await driver.quit();
  } finally {
    await cleanupAuthFixtures();
  }
});

async function openLogin() {
  await driver.get(new URL("/login", TEST_CONFIG.serverUrl).toString());
}

async function signIn(credentials, dashboard) {
  await openLogin();
  await driver.findElement(By.css('input[type="email"]')).sendKeys(credentials.email);
  await driver
    .findElement(By.css('input[type="password"]'))
    .sendKeys(credentials.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(until.urlContains(dashboard), 15000);
}

test("valid admin, owner, and tenant logins open their role-specific dashboard and persist session state", async () => {
  for (const role of ["admin", "owner", "tenant"]) {
    await signIn(fixtures[role], DASHBOARDS[role]);
    const storedUser = await driver.executeScript(
      "return JSON.parse(localStorage.getItem('rentora_current_user'));"
    );
    assert.equal(storedUser.role, role);
    assert.equal(await driver.getCurrentUrl().then((url) => new URL(url).pathname), DASHBOARDS[role]);

    await driver.navigate().refresh();
    await driver.wait(until.urlContains(DASHBOARDS[role]), 10000);
    const rememberedUser = await driver.executeScript(
      "return JSON.parse(localStorage.getItem('rentora_current_user'));"
    );
    assert.equal(rememberedUser.email, fixtures[role].email);

    await driver.manage().deleteAllCookies();
    await driver.get(TEST_CONFIG.serverUrl);
    await driver.executeScript("localStorage.clear();");
  }
});

test("invalid credentials show an error and required login fields prevent empty submission", async () => {
  await openLogin();
  await driver.findElement(By.css('input[type="email"]')).sendKeys(fixtures.owner.email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys("incorrect-test-password");
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(async () =>
    (await driver.findElement(By.css("body")).getText()).includes("Invalid email or password")
  );

  await openLogin();
  await driver.findElement(By.css('button[type="submit"]')).click();
  assert.equal(new URL(await driver.getCurrentUrl()).pathname, "/login");
  assert.equal(
    await driver.findElement(By.css('input[type="email"]')).getAttribute("required"),
    "true"
  );
  assert.equal(
    await driver.executeScript(
      "return document.querySelector('input[type=\"email\"]').validity.valid;"
    ),
    false
  );
});

test("unpaid owner login displays the activation-payment requirement without contacting the gateway", async () => {
  await openLogin();
  await driver.findElement(By.css('input[type="email"]')).sendKeys(fixtures.pendingOwner.email);
  await driver
    .findElement(By.css('input[type="password"]'))
    .sendKeys(fixtures.pendingOwner.password);
  await driver.findElement(By.css('button[type="submit"]')).click();

  await driver.wait(async () =>
    (await driver.findElement(By.css("body")).getText()).includes("Owner Account Activation Required")
  );
  assert.equal(new URL(await driver.getCurrentUrl()).pathname, "/login");
  assert.equal(
    await driver.findElements(
      By.xpath("//button[contains(., 'Pay') and contains(., 'Activate')]")
    ).then((buttons) => buttons.length),
    1
  );
});

test("direct dashboard URLs redirect each authenticated role away from other role dashboards", async () => {
  for (const role of ["admin", "owner", "tenant"]) {
    await signIn(fixtures[role], DASHBOARDS[role]);
    for (const path of Object.values(DASHBOARDS)) {
      await driver.get(new URL(path, TEST_CONFIG.serverUrl).toString());
      await driver.wait(until.urlContains(DASHBOARDS[role]), 10000);
      assert.equal(new URL(await driver.getCurrentUrl()).pathname, DASHBOARDS[role]);
    }

    await driver.manage().deleteAllCookies();
    await driver.get(TEST_CONFIG.serverUrl);
    await driver.executeScript("localStorage.clear();");
  }
});

test("direct dashboard URLs require a session", async () => {
  for (const path of Object.values(DASHBOARDS)) {
    await driver.get(new URL(path, TEST_CONFIG.serverUrl).toString());
    await driver.wait(until.urlContains("/login"), 10000);
    assert.equal(new URL(await driver.getCurrentUrl()).pathname, "/login");
  }
});

test("registration form blocks missing fields and invalid email in the browser", async () => {
  await driver.get(new URL("/register", TEST_CONFIG.serverUrl).toString());
  const submit = await driver.findElement(By.css('button[type="submit"]'));
  await submit.click();

  const email = await driver.findElement(By.css('input[type="email"]'));
  assert.equal(await email.getAttribute("required"), "true");
  assert.equal(await driver.findElement(By.css('input[type="password"]')).getAttribute("required"), "true");

  await driver.findElement(By.css('input[type="text"]')).sendKeys("Rentora Test Owner");
  await email.sendKeys("invalid-email");
  await driver.findElement(By.css('input[type="password"]')).sendKeys("test-password-123");
  assert.equal(
    await driver.executeScript("return arguments[0].validity.valid;", email),
    false
  );
  assert.equal(new URL(await driver.getCurrentUrl()).pathname, "/register");
});

test("logout clears browser authentication and protected-route access returns to login", async () => {
  await signIn(fixtures.owner, DASHBOARDS.owner);
  await driver.findElement(By.xpath("//button[normalize-space()='Logout']")).click();
  await driver.wait(until.urlContains("/login"), 10000);
  assert.equal(
    await driver.executeScript("return localStorage.getItem('rentora_current_user');"),
    null
  );

  await driver.get(new URL(DASHBOARDS.owner, TEST_CONFIG.serverUrl).toString());
  await driver.wait(until.urlContains("/login"), 10000);
  assert.equal(new URL(await driver.getCurrentUrl()).pathname, "/login");
});
