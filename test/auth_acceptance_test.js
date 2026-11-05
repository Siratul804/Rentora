const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const { TextEncoder } = require("node:util");
const {
  BASE_URL,
  WAIT_MS,
  resetSession,
  runSuite,
  submitLogin,
  waitForBodyText,
} = require("./selenium-helpers");

async function browserFetch(driver, url, options = {}) {
  return driver.executeAsyncScript((target, requestOptions, done) => {
    fetch(target, requestOptions)
      .then(async (response) => ({
        status: response.status,
        body: await response.json().catch(() => null),
      }))
      .then(done)
      .catch((error) => done({ error: error.message }));
  }, url, options);
}

async function authenticateAsRole(driver, role) {
  await driver.get(BASE_URL);
  await driver.manage().deleteAllCookies();
  await driver.executeScript("localStorage.clear(); sessionStorage.clear();");

  const { SignJWT } = await import("jose");
  const secret = process.env.JWT_SECRET || "rentora_super_secret_jwt_key_2026_fallback";
  const token = await new SignJWT({
    id: `selenium-${role}`,
    email: `selenium-${role}@example.com`,
    name: `Selenium ${role}`,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  await driver.manage().addCookie({
    name: "rentora_token",
    value: token,
    path: "/",
  });
}

const tests = [
  {
    name: "AUTH-001 unauthenticated session returns no user",
    run: async (driver) => {
      await resetSession(driver);
      const result = await browserFetch(driver, "/api/auth/me");
      assert.equal(result.status, 200);
      assert.equal(result.body?.user, null);
    },
  },
  {
    name: "AUTH-002 missing login credentials are blocked by required fields",
    run: async (driver) => {
      await resetSession(driver);
      const form = await driver.findElement(By.css("form"));
      assert.equal(await form.isDisplayed(), true);
      assert.equal(await form.isEnabled(), true);
      assert.equal(await driver.executeScript("return arguments[0].checkValidity()", form), false);
      assert.match(await driver.getCurrentUrl(), /\/login/);
    },
  },
  {
    name: "AUTH-003 unauthenticated direct dashboard URLs redirect to login",
    run: async (driver) => {
      for (const route of ["/admin/dashboard", "/owner/dashboard", "/tenant/dashboard"]) {
        await resetSession(driver);
        await driver.get(`${BASE_URL}${route}`);
        await driver.wait(until.urlContains("/login"), WAIT_MS);
        const currentUrl = new URL(await driver.getCurrentUrl());
        assert.equal(currentUrl.pathname, "/login");
        assert.equal(currentUrl.searchParams.get("redirect"), route);
      }
    },
  },
  {
    name: "AUTH-004 registration form requires name, email, and password",
    run: async (driver) => {
      await resetSession(driver);
      await driver.get(`${BASE_URL}/register`);
      await driver.wait(until.elementLocated(By.css("form input[type='email']")), WAIT_MS);
      const form = await driver.findElement(By.css("form"));
      assert.equal(await driver.executeScript("return arguments[0].checkValidity()", form), false);
      assert.equal(await driver.findElements(By.css("form input[required]")).then((items) => items.length), 3);
    },
  },
  {
    name: "AUTH-005 invalid registration email format is rejected by browser validation",
    run: async (driver) => {
      await resetSession(driver);
      await driver.get(`${BASE_URL}/register`);
      const email = await driver.findElement(By.css("form input[type='email']"));
      await email.sendKeys("not-an-email");
      assert.equal(await driver.executeScript("return arguments[0].validity.typeMismatch", email), true);
    },
  },
  {
    name: "AUTH-006 missing registration fields are rejected by the registration API",
    run: async (driver) => {
      await resetSession(driver);
      const result = await browserFetch(driver, "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(result.status, 400);
      assert.match(result.body?.error || "", /required/i);
    },
  },
  {
    name: "AUTH-007 short owner-registration password is rejected by the registration API",
    run: async (driver) => {
      await resetSession(driver);
      const result = await browserFetch(driver, "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Selenium Validation",
          email: "selenium-validation@example.invalid",
          password: "short",
        }),
      });
      assert.equal(result.status, 400);
      assert.match(result.body?.error || "", /at least 6/i);
    },
  },
  {
    name: "AUTH-008 valid owner-registration form follows a payment-required response",
    run: async (driver) => {
      await resetSession(driver);
      await driver.get(`${BASE_URL}/register`);
      await driver.wait(until.elementLocated(By.css("form input[type='email']")), WAIT_MS);
      await driver.executeScript(() => {
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, options) => {
          if (String(input).includes("/api/auth/register")) {
            window.sessionStorage.setItem("seleniumRegistrationPayload", options.body);
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              requiresPayment: true,
              gatewayUrl: `${window.location.origin}/login?selenium-payment-flow=1`,
            }), { status: 200, headers: { "Content-Type": "application/json" } }));
          }
          return originalFetch(input, options);
        };
      });
      await driver.findElement(By.css("form input[type='text']")).sendKeys("Selenium Owner");
      await driver.findElement(By.css("form input[type='email']")).sendKeys("selenium-owner@example.invalid");
      await driver.findElement(By.css("form input[type='password']")).sendKeys("selenium-pass-123");
      await driver.findElement(By.css("form button[type='submit']")).click();
      await driver.wait(until.urlContains("selenium-payment-flow=1"), WAIT_MS);
      const payload = await driver.executeScript(
        "return JSON.parse(sessionStorage.getItem('seleniumRegistrationPayload'))"
      );
      assert.equal(payload?.name, "Selenium Owner");
      assert.equal(payload?.email, "selenium-owner@example.invalid");
      assert.equal(payload?.password, "selenium-pass-123");
    },
  },
  {
    name: "AUTH-009 owner and tenant cannot call the admin approval API",
    run: async (driver) => {
      for (const role of ["owner", "tenant"]) {
        await authenticateAsRole(driver, role);
        const result = await browserFetch(driver, "/api/admin/owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "1", action: "approve" }),
        });
        assert.equal(result.status, 403, `${role} should not access admin approval API`);
      }
    },
  },
  {
    name: "AUTH-010 role-specific dashboards redirect users away from other roles' routes",
    run: async (driver) => {
      const destinations = {
        admin: "/admin/dashboard",
        owner: "/owner/dashboard",
        tenant: "/tenant/dashboard",
      };
      for (const role of Object.keys(destinations)) {
        for (const target of Object.keys(destinations)) {
          await authenticateAsRole(driver, role);
          await driver.get(`${BASE_URL}${destinations[target]}`);
          const expected = role === target ? destinations[target] : destinations[role];
          await driver.wait(until.urlContains(expected), WAIT_MS);
          assert.ok((await driver.getCurrentUrl()).endsWith(expected));
        }
      }
    },
  },
  {
    name: "AUTH-011 authenticated session survives page refresh and logout clears it",
    run: async (driver) => {
      const email = process.env.ADMIN_EMAIL || "admin@rentora.com";
      const password = process.env.ADMIN_PASSWORD || "admin123456";
      await resetSession(driver);
      await submitLogin(driver, email, password);
      await driver.wait(until.urlContains("/admin/dashboard"), WAIT_MS);
      await driver.navigate().refresh();
      await driver.wait(until.urlContains("/admin/dashboard"), WAIT_MS);

      const session = await browserFetch(driver, "/api/auth/me");
      assert.equal(session.body?.user?.role, "admin");

      await driver.findElement(By.xpath("//button[normalize-space()='Logout']")).click();
      await driver.wait(until.urlContains("/login"), WAIT_MS);
      const loggedOutSession = await browserFetch(driver, "/api/auth/me");
      assert.equal(loggedOutSession.body?.user, null);
    },
  },
];

runSuite("auth acceptance", tests).then(({ passed, failed, skipped }) => {
  console.log(
    `Auth acceptance summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${tests.length} total.`
  );
});
