const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  resetSession,
  runSuite,
  submitLogin,
  waitForBodyText,
} = require("./selenium-helpers");

const unpaidOwnerEmail = "selenium-unpaid@example.com";
const unpaidOwnerPassword = "selenium-test-password";

async function attemptUnpaidOwnerLogin(driver) {
  await resetSession(driver);
  await driver.executeScript((email) => {
    window.__seleniumLoginRequests = [];
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      if (new URL(input, window.location.href).pathname === "/api/auth/login") {
        window.__seleniumLoginRequests.push({
          method: init.method || "GET",
          body: init.body || "",
        });
        return Promise.resolve(new Response(
          JSON.stringify({
            error: "Property Owner account requires a ৳499 activation payment before signing in.",
            requiresPayment: true,
            email,
            name: "Selenium Unpaid Owner",
            phone: "",
            amount: 499,
          }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        ));
      }
      return nativeFetch(input, init);
    };
  }, unpaidOwnerEmail);
  await submitLogin(driver, unpaidOwnerEmail, unpaidOwnerPassword);
  await waitForBodyText(driver, "Owner Account Activation Required");
  const [loginRequest] = await driver.executeScript(
    () => window.__seleniumLoginRequests
  );
  assert.equal(loginRequest.method, "POST");
  assert.equal(JSON.parse(loginRequest.body).email, unpaidOwnerEmail);
  assert.match(await driver.getCurrentUrl(), /\/login/);
}

runSuite("payment", [
  {
    name: "payment-required login response shows activation banner without redirecting",
    run: async (driver) => {
      await attemptUnpaidOwnerLogin(driver);
      await waitForBodyText(driver, "A one-time activation fee of");
      assert.doesNotMatch(await driver.getCurrentUrl(), /\/owner\/dashboard/);
    },
  },
  {
    name: "activation button triggers POST /api/payment/initiate",
    // Intercept the request to verify the real button without contacting SSLCommerz.
    run: async (driver) => {
      await attemptUnpaidOwnerLogin(driver);
      const paymentButton = await driver.wait(
        until.elementLocated(By.xpath(
          "//button[contains(normalize-space(.), 'Continue to ৳499 checkout')]"
        )),
        WAIT_MS
      );
      await driver.executeScript(() => {
        window.__seleniumPaymentRequests = [];
        const nativeFetch = window.fetch.bind(window);
        window.fetch = (input, init = {}) => {
          if (String(input).includes("/api/payment/initiate")) {
            window.__seleniumPaymentRequests.push({
              url: String(input),
              method: init.method || "GET",
              body: init.body || "",
            });
            return Promise.resolve(new Response(
              JSON.stringify({ success: false, error: "Selenium intercepted payment initiation." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            ));
          }
          return nativeFetch(input, init);
        };
      });

      await paymentButton.click();
      await driver.wait(async () => {
        const requests = await driver.executeScript(
          () => window.__seleniumPaymentRequests
        );
        return requests.length > 0;
      }, WAIT_MS, "Expected the activation button to call /api/payment/initiate.");

      const [paymentRequest] = await driver.executeScript(
        () => window.__seleniumPaymentRequests
      );
      assert.equal(new URL(paymentRequest.url, BASE_URL).pathname, "/api/payment/initiate");
      assert.equal(paymentRequest.method, "POST");
      assert.equal(JSON.parse(paymentRequest.body).email, unpaidOwnerEmail);
    },
  },
  {
    name: "owner registration demo checkout is clearly labeled and uses the activation amount",
    run: async (driver) => {
      await driver.get(`${BASE_URL}/payment/demo?tran_id=RENTORA_TEST`);
      await waitForBodyText(driver, "DEMO CHECKOUT");
      await waitForBodyText(driver, "BDT 499");
      await waitForBodyText(driver, "No money or payment details are collected.");
      await driver.findElement(
        By.xpath("//button[contains(normalize-space(.), 'Simulate successful payment')]")
      );
    },
  },
  {
    name: "success URL query displays the successful activation banner",
    // Verify the login form handles the success query produced by the callback.
    run: async (driver) => {
      await driver.get(`${BASE_URL}/login?payment=success&email=selenium@example.com`);
      await waitForBodyText(driver, "Payment of ৳499 verified!");
    },
  },
  {
    name: "failed callback redirects to login and shows the failure banner",
    // Verify the actual callback route and its login-page feedback.
    run: async (driver) => {
      await driver.get(`${BASE_URL}/api/payment/fail`);
      await driver.wait(until.urlContains("/login?payment=failed"), WAIT_MS);
      await waitForBodyText(driver, "Payment failed or was declined.");
    },
  },
  {
    name: "cancelled callback redirects to login and shows the cancellation banner",
    // Verify the actual callback route and its login-page feedback.
    run: async (driver) => {
      await driver.get(`${BASE_URL}/api/payment/cancel`);
      await driver.wait(until.urlContains("/login?payment=cancelled"), WAIT_MS);
      await waitForBodyText(driver, "Payment cancelled.");
    },
  },
]);