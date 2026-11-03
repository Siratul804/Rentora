const assert = require("node:assert/strict");
const { By, Select, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  resetSession,
  runSuite,
  submitLogin,
  waitForBodyText,
} = require("./selenium-helpers");

const credentials = {
  owner: {
    email: process.env.OWNER_EMAIL || "23201128@uap-bd.edu",
    password: process.env.OWNER_PASSWORD || "23201128",
  },
  tenant: {
    email: process.env.TENANT_EMAIL || "23201111@uap-bd.edu",
    password: process.env.TENANT_PASSWORD || "23201111",
  },
};

const baseUrl = new URL(BASE_URL);
if (
  baseUrl.protocol !== "http:" ||
  !["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname.replace(/^\[|\]$/g, ""))
) {
  throw new Error("E2E workflow tests are restricted to a local HTTP server.");
}

const initialState = {
  properties: [],
  units: [],
  tenants: [],
  leases: [],
  invoices: [],
  payments: [],
  requests: [],
  notifications: [],
  nextId: 1,
};

function installWorkflowMocks(state) {
  return `(() => {
    const key = "__rentoraE2EWorkflow";
    const seed = ${state === null ? "null" : JSON.stringify(state)};
    if (seed) {
      localStorage.setItem(key, JSON.stringify(seed));
      window.__rentoraE2EState = seed;
    } else if (!window.__rentoraE2EState) {
      try {
        window.__rentoraE2EState = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        window.__rentoraE2EState = null;
      }
    }
    if (window.__rentoraE2EInstalled) return;
    window.__rentoraE2EInstalled = true;
    const originalFetch = window.fetch.bind(window);
    const save = () => localStorage.setItem(key, JSON.stringify(window.__rentoraE2EState));
    const response = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
    const id = () => "64b0000000000000000000" + String(window.__rentoraE2EState.nextId++).padStart(2, "0");
    const state = () => window.__rentoraE2EState;
    const notification = (type, title, message, relatedId) => {
      state().notifications.unshift({
        _id: id(), type, title, message, relatedId, createdAt: new Date().toISOString(),
      });
    };

    window.fetch = async (input, options = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, window.location.href);
      const path = url.pathname;
      const method = (options.method || "GET").toUpperCase();
      const body = options.body ? JSON.parse(options.body) : {};
      if (path.startsWith("/api/notifications")) return response({ notifications: state()?.notifications || [] });
      if (!state() || !path.startsWith("/api/")) return originalFetch(input, options);
      if (path.startsWith("/api/auth/")) return originalFetch(input, options);
      if (path === "/api/owner/payment-info" && method === "GET") return response({ payment: null });
      if (path === "/api/tenant/rent-summary" && method === "GET") return response({ rent: null });

      if (path === "/api/owner/properties" || path === "/api/properties") {
        if (method === "GET") return response({ properties: state().properties });
        if (method === "POST") {
          const property = { ...body, id: id(), createdAt: new Date().toISOString() };
          state().properties.push(property);
          save();
          return response({ property, message: "Property created successfully." }, 201);
        }
      }
      if (path === "/api/units") {
        if (method === "GET") return response({ units: state().units });
        if (method === "POST") {
          const property = state().properties.find((item) => item.id === body.propertyId);
          const unit = {
            ...body, id: id(), propertyName: property?.name || "",
            status: body.status || "Vacant", tenant: null,
          };
          state().units.push(unit);
          save();
          return response({ unit, message: "Unit created successfully." }, 201);
        }
      }
      if (path === "/api/owner/tenants") {
        if (method === "GET") return response({ tenants: state().tenants });
        if (method === "POST") {
          const { password, ...tenantFields } = body;
          const tenant = {
            ...tenantFields, id: id(), isActive: true, status: "Active",
            leaseEnd: body.leaseEnd || "", rentStatus: body.rentStatus || "Pending",
          };
          state().tenants.push(tenant);
          save();
          return response({ tenant, message: "Tenant created successfully." }, 201);
        }
      }
      if (path === "/api/owner/leases") {
        if (method === "GET") return response({ leases: state().leases });
        if (method === "POST") {
          const lease = { ...body, id: id(), status: body.status || "Active" };
          state().leases.push(lease);
          save();
          return response({ lease, message: "Lease created successfully." }, 201);
        }
      }
      if (path === "/api/owner/invoices") {
        if (method === "GET") {
          return response({ invoices: state().invoices, leases: state().leases.filter((lease) => lease.status === "Active") });
        }
        if (method === "POST") {
          const lease = state().leases.find((item) => item.id === body.leaseIds?.[0]);
          if (!lease) return response({ error: "No active lease selected." }, 400);
          const invoice = {
            _id: id(), tenantId: lease.tenantId, tenantName: lease.tenantName,
            propertyName: lease.propertyName, unit: lease.unit, rentAmount: lease.rent,
            billingPeriod: body.billingPeriod, dueDate: body.dueDate,
            paymentInstructions: body.paymentInstructions || "", status: "Pending",
          };
          state().invoices.push(invoice);
          notification("invoice-generated", "Rent invoice generated", "Your rent invoice is ready.", invoice._id);
          save();
          return response({ message: "Invoices generated.", invoices: [invoice] }, 201);
        }
      }
      const sendInvoice = path.match(/^\\/api\\/owner\\/invoices\\/([^/]+)\\/send$/);
      if (sendInvoice && method === "POST") {
        const invoice = state().invoices.find((item) => item._id === sendInvoice[1]);
        if (!invoice) return response({ error: "Invoice not found." }, 404);
        notification("invoice-sent", "New rent invoice", "Your property owner sent a rent invoice.", invoice._id);
        save();
        return response({ message: "Invoice notification sent to tenant." });
      }
      if (path === "/api/tenant/invoices" && method === "GET") {
        return response({
          invoices: state().invoices,
          notifications: state().notifications.filter((item) => item.type.startsWith("invoice") || item.type === "payment-success"),
        });
      }
      if (path === "/api/tenant/payment/initiate" && method === "POST") {
        const invoice = state().invoices.find((item) => item._id === body.invoiceId);
        if (!invoice) return response({ error: "Invoice not found." }, 404);
        invoice.status = "Paid";
        const payment = { id: id(), invoiceId: invoice._id, tenantId: invoice.tenantId, amount: invoice.rentAmount, status: "Paid" };
        state().payments.push(payment);
        notification("payment-success", "Rent payment received", "Your rent payment was recorded.", invoice._id);
        save();
        return response({ success: true, gatewayUrl: ${JSON.stringify(BASE_URL)} + "/tenant/payments?payment=success" });
      }
      if (path === "/api/tenant/maintenance") {
        if (method === "GET") return response({ requests: state().requests });
        if (method === "POST") {
          const tenant = state().tenants[0];
          const property = state().properties[0];
          const request = {
            ...body, id: id(), tenantId: tenant?.id, tenantName: tenant?.name,
            propertyId: property?.id, property: property?.name, unit: tenant?.unit || "",
            status: "Pending", priority: "Medium", assignedTo: "Unassigned",
            createdAt: new Date().toISOString(), activityHistory: [],
          };
          state().requests.unshift(request);
          notification("maintenance-submitted", "Maintenance request received", request.title, request.id);
          save();
          return response({ success: true, request }, 201);
        }
      }
      if (path === "/api/owner/maintenance") {
        if (method === "GET") {
          return response({
            requests: state().requests.map((request) => ({
              ...request, tenant: { name: request.tenantName },
            })),
          });
        }
        if (method === "PATCH") {
          const request = state().requests.find((item) => item.id === body.id);
          if (!request) return response({ error: "Maintenance request not found." }, 404);
          if (body.status) request.status = body.status;
          if (body.assignedTo) request.assignedTo = body.assignedTo;
          notification("maintenance-updated", "Maintenance request updated", request.title, request.id);
          save();
          return response({ success: true, request });
        }
      }
      return response({ error: "Blocked by the E2E workflow mock." }, 501);
    };
  })();`;
}

async function enableMocks(driver, state) {
  await driver.sendDevToolsCommand("Page.addScriptToEvaluateOnNewDocument", {
    source: installWorkflowMocks(null),
  });
  await driver.executeScript(installWorkflowMocks(state));
}

async function readMockState(driver) {
  return driver.executeScript("return window.__rentoraE2EState");
}

async function loginWithWorkflowMocks(driver, role, credentials, state) {
  const routes = {
    owner: "/owner/dashboard",
    tenant: "/tenant/dashboard",
  };
  await resetSession(driver);
  await enableMocks(driver, state);
  await submitLogin(driver, credentials.email, credentials.password);
  await driver.wait(until.urlContains(routes[role]), WAIT_MS);
}

async function goTo(driver, path, expectedText) {
  await driver.get(`${BASE_URL}${path}`);
  if (expectedText) await waitForBodyText(driver, expectedText);
}

async function enterText(driver, selector, value) {
  const element = await driver.findElement(By.css(selector));
  await element.clear();
  await element.sendKeys(value);
}

const tests = [
  {
    name: "E2E-001 owner-to-tenant property, lease, invoice, payment, and maintenance journey (mocked writes)",
    run: async (driver) => {
      await loginWithWorkflowMocks(driver, "owner", credentials.owner, initialState);

      await goTo(driver, "/owner/properties", "Properties & Units");
      await driver.findElement(By.xpath("//button[contains(., 'Add New Property')]")).click();
      await enterText(driver, 'input[placeholder*="Green Horizon Residency"]', "Selenium E2E Residence");
      await enterText(driver, 'input[placeholder*="Dhanmondi"]', "1 Selenium Test Road");
      await enterText(driver, 'input[type="number"]', "1");
      await driver.findElement(By.xpath("//form//button[@type='submit']")).click();
      await waitForBodyText(driver, "Selenium E2E Residence");

      await goTo(driver, "/owner/dashboard/units", "Unit Management");
      await driver.findElement(By.xpath("//button[normalize-space()='Add Unit']")).click();
      await driver.wait(until.elementLocated(By.css('form input[name="unitNumber"]')), WAIT_MS);
      await new Select(await driver.findElement(By.css('form select[name="propertyId"]'))).selectByIndex(1);
      await enterText(driver, 'input[name="unitNumber"]', "E2E-101");
      await enterText(driver, 'input[name="rentAmount"]', "25000");
      await enterText(driver, 'input[name="deposit"]', "50000");
      await driver.findElement(By.xpath("//form//button[@type='submit']")).click();
      await waitForBodyText(driver, "E2E-101");

      await goTo(driver, "/owner/tenants", "Tenants Directory");
      await driver.findElement(By.xpath("//button[contains(., 'Onboard New Tenant')]")).click();
      await enterText(driver, 'input[placeholder="e.g. Farhan Ahmed"]', "Selenium E2E Tenant");
      await enterText(driver, 'input[placeholder="e.g. farhan@gmail.com"]', credentials.tenant.email);
      await enterText(driver, 'input[placeholder="Temporary password"]', "MockedTestPassword123!");
      await enterText(driver, 'input[placeholder="+880 1711-000000"]', "+880 1700-000001");
      await enterText(driver, 'input[placeholder="e.g. Unit 4B"]', "E2E-101");
      await driver.findElement(By.xpath("//form//button[@type='submit']")).click();
      await waitForBodyText(driver, "Tenant Onboarded Successfully!");

      await goTo(driver, "/owner/leases", "Lease Agreements");
      await driver.findElement(By.xpath("//button[contains(., 'Draft New Lease')]")).click();
      await driver.wait(until.elementLocated(By.css('form input[placeholder="e.g. L-2025-05"]')), WAIT_MS);
      const leaseForm = await driver.findElement(By.css("form"));
      const leaseSelects = await leaseForm.findElements(By.css("select"));
      await new Select(leaseSelects[0]).selectByIndex(1);
      await enterText(driver, 'input[placeholder="e.g. L-2025-05"]', "L-E2E-001");
      await new Select(leaseSelects[1]).selectByIndex(1);
      await driver.findElement(By.xpath("//form//button[@type='submit']")).click();
      await waitForBodyText(driver, "Lease created successfully.");

      await goTo(driver, "/owner/invoices", "Rent invoices");
      await driver.findElement(By.xpath("//button[contains(., 'Generate monthly invoices')]")).click();
      await driver.wait(until.elementLocated(By.css('button[type="submit"]')), WAIT_MS);
      await driver.findElement(By.css('textarea[placeholder*="payment method"]')).sendKeys("Test-only payment instructions.");
      await driver.findElement(By.xpath("//form//button[@type='submit']")).click();
      await waitForBodyText(driver, "Invoices generated.");
      const ownerState = await readMockState(driver);
      assert.equal(ownerState.properties.length, 1);
      assert.equal(ownerState.units.length, 1);
      assert.equal(ownerState.tenants.length, 1);
      assert.equal(ownerState.leases.length, 1);
      assert.equal(ownerState.invoices.length, 1);
      assert.equal(ownerState.units[0].propertyId, ownerState.properties[0].id);
      assert.equal(ownerState.tenants[0].property, ownerState.properties[0].name);
      assert.equal(ownerState.tenants[0].unit, ownerState.units[0].unitNumber);
      assert.equal(ownerState.leases[0].tenantId, ownerState.tenants[0].id);
      assert.equal(ownerState.invoices[0].tenantId, ownerState.tenants[0].id);
      assert.equal(ownerState.leases[0].propertyId, ownerState.properties[0].id);
      const invoiceId = ownerState.invoices[0]._id;

      await driver.findElement(By.xpath("//button[normalize-space()='Send']")).click();
      await waitForBodyText(driver, "Invoice notification sent to tenant.");
      let state = await readMockState(driver);

      await loginWithWorkflowMocks(driver, "tenant", credentials.tenant, state);
      await goTo(driver, "/tenant/payments", "My invoices");
      await waitForBodyText(driver, "Pending");
      await driver.findElement(By.css(`button[aria-label="Pay invoice ${invoiceId.slice(-8).toUpperCase()} online"]`)).click();
      await driver.wait(until.urlContains("payment=success"), WAIT_MS);
      await waitForBodyText(driver, "Rent payment completed successfully.");
      await waitForBodyText(driver, "Paid");
      state = await readMockState(driver);
      assert.equal(state.invoices[0].status, "Paid");
      assert.equal(state.payments.length, 1);
      assert.equal(state.payments[0].invoiceId, invoiceId);

      await goTo(driver, "/tenant/maintenance", "Submit Service Request");
      await driver.findElement(By.id("issue-summary")).sendKeys("E2E kitchen sink leak");
      await driver.findElement(By.css("form textarea")).sendKeys("Water is leaking below the kitchen sink.");
      await driver.findElement(By.css('form button[type="submit"]')).click();
      await waitForBodyText(driver, "Request submitted. Your property owner can now see it.");
      await waitForBodyText(driver, "E2E kitchen sink leak");
      state = await readMockState(driver);
      assert.equal(state.requests.length, 1);
      assert.equal(state.requests[0].tenantId, state.tenants[0].id);
      assert.equal(state.requests[0].propertyId, state.properties[0].id);

      await loginWithWorkflowMocks(driver, "owner", credentials.owner, state);
      await goTo(driver, "/owner/maintenance", "Maintenance requests");
      await waitForBodyText(driver, "E2E kitchen sink leak");
      const requestId = state.requests[0].id;
      const requestStatus = By.css(`select[aria-label="Status for ${requestId}"]`);
      const requestStatusSelector = `select[aria-label="Status for ${requestId}"]`;
      await driver.findElement(By.xpath(`//tr[contains(., "${requestId}")]//button[normalize-space()='Assign']`)).click();
      await driver.wait(async () =>
        driver.executeScript("return document.querySelector(arguments[0])?.value === 'Assigned'", requestStatusSelector),
      WAIT_MS);
      for (const status of ["In Progress", "Resolved", "Closed"]) {
        await new Select(await driver.findElement(requestStatus)).selectByVisibleText(status);
        await driver.wait(async () =>
          driver.executeScript("return document.querySelector(arguments[0])?.value === arguments[1]", requestStatusSelector, status),
        WAIT_MS);
      }

      await goTo(driver, "/owner/invoices", "Rent invoices");
      await waitForBodyText(driver, "Paid");
      state = await readMockState(driver);
      assert.equal(state.requests[0].status, "Closed");
      assert.ok(state.notifications.some((item) => item.type === "invoice-generated"));
      assert.ok(state.notifications.some((item) => item.type === "invoice-sent"));
      assert.ok(state.notifications.some((item) => item.type === "payment-success"));
      assert.ok(state.notifications.some((item) => item.type === "maintenance-submitted"));
      assert.ok(state.notifications.some((item) => item.type === "maintenance-updated"));
      assert.ok(state.payments.length === 1 && state.invoices[0].status === "Paid");
    },
  },
];

runSuite("E2E owner-tenant workflow", tests).then(({ passed, failed, skipped }) => {
  console.log(
    `E2E workflow summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${tests.length} total.`
  );
});
