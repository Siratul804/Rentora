const assert = require("node:assert/strict");
const { By, Select, until } = require("selenium-webdriver");
const {
  BASE_URL,
  WAIT_MS,
  loginAndWaitDashboard,
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
  throw new Error("Maintenance acceptance tests are restricted to a local HTTP server.");
}

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

async function installMaintenanceMocks(driver, role, requests = [], failSubmit = false) {
  await driver.executeScript((mockRole, initialRequests, shouldFailSubmit) => {
    const state = {
      requests: initialRequests,
      patches: [],
      submitted: null,
      failSubmit: shouldFailSubmit,
    };
    window.__maintenanceSelenium = state;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, window.location.href);
      const method = (options.method || "GET").toUpperCase();
      const expectedPath = mockRole === "tenant"
        ? "/api/tenant/maintenance"
        : "/api/owner/maintenance";
      if (url.pathname !== expectedPath) return originalFetch(input, options);

      if (method === "GET") {
        const responseRequests = mockRole === "owner"
          ? state.requests.filter((request) => request.status !== "Closed").map((request) => ({
              ...request,
              tenant: { name: request.tenantName || "Selenium Tenant" },
              property: request.property || "Selenium Property",
            }))
          : state.requests;
        return new Response(JSON.stringify({ success: true, requests: responseRequests }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (mockRole === "tenant" && method === "POST") {
        state.submitted = JSON.parse(options.body);
        if (state.failSubmit) {
          return new Response(JSON.stringify({ error: "Test-only simulated submission failure." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const savedRequest = {
          id: "64b000000000000000000001",
          title: state.submitted.title,
          description: state.submitted.description || "",
          category: state.submitted.category,
          priority: "Medium",
          status: "Pending",
          assignedTo: "Unassigned",
          unit: "Unit Selenium",
          createdAt: new Date().toISOString(),
          activityHistory: [],
        };
        state.requests.unshift(savedRequest);
        return new Response(JSON.stringify({
          success: true,
          message: "Maintenance request submitted successfully.",
          request: savedRequest,
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (mockRole === "owner" && method === "PATCH") {
        const patch = JSON.parse(options.body);
        state.patches.push(patch);
        const request = state.requests.find((item) => item.id === patch.id);
        if (!request) {
          return new Response(JSON.stringify({ error: "Maintenance request not found." }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (patch.status !== undefined) request.status = patch.status;
        if (patch.assignedTo !== undefined) request.assignedTo = patch.assignedTo;
        return new Response(JSON.stringify({
          success: true,
          message: "Maintenance request updated successfully.",
          request: { id: request.id, status: request.status, assignedTo: request.assignedTo },
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return originalFetch(input, options);
    };
  }, role, requests, failSubmit);
}

async function openTenantMaintenance(driver, mocks) {
  await loginAndWaitDashboard(driver, "tenant", credentials.tenant);
  if (mocks) await installMaintenanceMocks(driver, "tenant", [], mocks.failSubmit);
  await driver.findElement(By.css('a[href="/tenant/maintenance"]')).click();
  await driver.wait(until.elementLocated(By.id("issue-summary")), WAIT_MS);
  await waitForBodyText(driver, "My Maintenance Requests");
}

async function openOwnerMaintenance(driver, initialRequests) {
  await loginAndWaitDashboard(driver, "owner", credentials.owner);
  await installMaintenanceMocks(driver, "owner", initialRequests);
  await driver.findElement(By.css('a[href="/owner/maintenance"]')).click();
  await driver.wait(until.elementLocated(By.css("table")), WAIT_MS);
}

function seleniumRequest(overrides = {}) {
  return {
    id: "64b000000000000000000002",
    title: "Selenium maintenance workflow",
    description: "Test-only notes for workflow verification.",
    category: "Plumbing",
    priority: "Medium",
    status: "Pending",
    assignedTo: "Unassigned",
    unit: "Unit Selenium",
    property: "Selenium Property",
    tenantName: "Selenium Tenant",
    createdAt: new Date().toISOString(),
    activityHistory: [],
    ...overrides,
  };
}

const tests = [
  {
    name: "MAINT-001 tenant can access the maintenance submission form",
    run: async (driver) => {
      await driver.sendDevToolsCommand("Network.enable");
      await driver.sendDevToolsCommand("Network.setBlockedURLs", {
        urls: ["*://*/api/notifications*"],
      });
      await openTenantMaintenance(driver);
      await waitForBodyText(driver, "Submit Service Request");
      await waitForBodyText(driver, "Issue Summary");
    },
  },
  {
    name: "MAINT-002 tenant can view saved requests and owner maintenance API is available",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "tenant", credentials.tenant);
      const own = await browserFetch(driver, "/api/tenant/maintenance");
      assert.equal(own.status, 200);
      assert.ok(Array.isArray(own.body?.requests));
      assert.ok(own.body.requests.length > 0, "Expected saved tenant maintenance test fixtures.");
      for (const request of own.body.requests) {
        assert.ok(request.id);
        assert.ok(request.title);
        assert.ok(request.status);
        assert.ok(request.unit);
      }

      await loginAndWaitDashboard(driver, "owner", credentials.owner);
      const owned = await browserFetch(driver, "/api/owner/maintenance");
      assert.equal(owned.status, 200);
      assert.ok(Array.isArray(owned.body?.requests));
      for (const request of owned.body.requests) {
        assert.ok(request.id);
        assert.ok(request.status);
        assert.ok(request.tenant?.name);
      }
    },
  },
  {
    name: "MAINT-003 required issue summary prevents an empty UI submission",
    run: async (driver) => {
      await openTenantMaintenance(driver);
      const form = await driver.findElement(By.css("form"));
      assert.equal(await driver.executeScript("return arguments[0].checkValidity()", form), false);
      assert.equal(await driver.findElement(By.id("issue-summary")).getAttribute("required"), "true");
    },
  },
  {
    name: "MAINT-004 successful tenant submission displays the request and success message",
    run: async (driver) => {
      await openTenantMaintenance(driver, { failSubmit: false });
      await driver.findElement(By.id("issue-summary")).sendKeys("Selenium sink leak");
      await driver.findElement(By.css("form textarea")).sendKeys("Leak beneath the kitchen sink.");
      await driver.findElement(By.css("form button[type='submit']")).click();
      await waitForBodyText(driver, "Request submitted. Your property owner can now see it.");
      await waitForBodyText(driver, "Selenium sink leak");
      const submitted = await driver.executeScript("return window.__maintenanceSelenium.submitted");
      assert.equal(submitted.title, "Selenium sink leak");
      assert.equal(submitted.description, "Leak beneath the kitchen sink.");
      assert.equal(submitted.category, "Plumbing");
    },
  },
  {
    name: "MAINT-005 failed tenant submission displays the API error",
    run: async (driver) => {
      await openTenantMaintenance(driver, { failSubmit: true });
      await driver.findElement(By.id("issue-summary")).sendKeys("Selenium failed request");
      await driver.findElement(By.css("form button[type='submit']")).click();
      await waitForBodyText(driver, "Test-only simulated submission failure.");
      assert.equal(await driver.findElements(By.css('[role="alert"]')).then((items) => items.length), 1);
    },
  },
  {
    name: "MAINT-006 tenant API rejects missing issue summary and invalid category",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "tenant", credentials.tenant);
      const missingTitle = await browserFetch(driver, "/api/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "Plumbing" }),
      });
      assert.equal(missingTitle.status, 400);
      assert.match(missingTitle.body?.error || "", /issue summary is required/i);

      const invalidCategory = await browserFetch(driver, "/api/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Selenium validation", category: "Invalid Trade" }),
      });
      assert.equal(invalidCategory.status, 400);
      assert.match(invalidCategory.body?.error || "", /valid trade category/i);
    },
  },
  {
    name: "MAINT-007 owner can assign and update statuses in the maintenance UI",
    run: async (driver) => {
      const request = seleniumRequest();
      await openOwnerMaintenance(driver, [request]);
      const row = driver.findElement(By.xpath(`//tr[contains(., "${request.title}")]`));
      await row.findElement(By.xpath(".//button[normalize-space()='Assign']")).click();
      const statusSelector = By.css(`select[aria-label="Status for ${request.id}"]`);
      await driver.wait(async () =>
        driver.executeScript(
          "return document.querySelector(arguments[0])?.value === 'Assigned'",
          `select[aria-label="Status for ${request.id}"]`
        ), WAIT_MS);

      for (const status of ["In Progress", "Resolved", "Closed"]) {
        const select = new Select(await driver.findElement(statusSelector));
        await select.selectByVisibleText(status);
        await driver.wait(async () =>
          driver.executeScript(
            "return window.__maintenanceSelenium.patches.some((patch) => patch.id === arguments[0] && patch.status === arguments[1])",
            request.id,
            status
          ), WAIT_MS);
        if (status !== "Closed") {
          await driver.wait(async () =>
            driver.executeScript(
              "return document.querySelector(arguments[0])?.value === arguments[1]",
              `select[aria-label="Status for ${request.id}"]`,
              status
            ), WAIT_MS);
        }
      }

      await waitForBodyText(driver, "Request closed and moved to Provider Job History.");
      assert.equal(await driver.findElements(By.xpath(`//tr[contains(., "${request.title}")]`)).then((items) => items.length), 0);
    },
  },
  {
    name: "MAINT-008 owner API rejects invalid request IDs and status values",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "owner", credentials.owner);
      const invalidId = await browserFetch(driver, "/api/owner/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "not-an-object-id", status: "Closed" }),
      });
      assert.equal(invalidId.status, 400);

      const invalidStatus = await browserFetch(driver, "/api/owner/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "64b000000000000000000003", status: "Invalid Status" }),
      });
      assert.equal(invalidStatus.status, 400);
      assert.match(invalidStatus.body?.error || "", /invalid maintenance status/i);
    },
  },
  {
    name: "MAINT-009 tenant and admin cannot access owner maintenance management",
    run: async (driver) => {
      for (const role of ["tenant", "admin"]) {
        const roleCredentials = role === "tenant"
          ? credentials.tenant
          : {
              email: process.env.ADMIN_EMAIL || "admin@rentora.com",
              password: process.env.ADMIN_PASSWORD || "admin123456",
            };
        await loginAndWaitDashboard(driver, role, roleCredentials);
        const result = await browserFetch(driver, "/api/owner/maintenance");
        assert.equal(result.status, 403, `${role} should not access the owner maintenance API.`);
      }
    },
  },
  {
    name: "MAINT-010 owner cannot submit or view tenant maintenance requests",
    run: async (driver) => {
      await loginAndWaitDashboard(driver, "owner", credentials.owner);
      const read = await browserFetch(driver, "/api/tenant/maintenance");
      assert.equal(read.status, 403);
      const submit = await browserFetch(driver, "/api/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Selenium unauthorized", category: "Plumbing" }),
      });
      assert.equal(submit.status, 403);
    },
  },
  {
    name: "MAINT-011 stored requests and notifications preserve their relationships",
    run: async () => {
      let mongoose;
      try {
        const [
          { default: dbConnect },
          mongo,
          { default: User },
          { default: Property },
          { default: MaintenanceRequest },
          { default: Notification },
        ] = await Promise.all([
          import("../lib/dbConnect.js"),
          import("mongoose"),
          import("../lib/models/User.js"),
          import("../lib/models/Property.js"),
          import("../lib/models/MaintenanceRequest.js"),
          import("../lib/models/Notification.js"),
        ]);
        mongoose = mongo.default;
        await dbConnect();
        const [tenant, owner] = await Promise.all([
          User.findOne({ email: credentials.tenant.email.toLowerCase(), role: "tenant" })
            .select("_id")
            .lean(),
          User.findOne({ email: credentials.owner.email.toLowerCase(), role: "owner" })
            .select("_id")
            .lean(),
        ]);
        assert.ok(tenant, "Tenant maintenance fixture must exist.");
        assert.ok(owner, "Owner maintenance fixture must exist.");

        const requests = await MaintenanceRequest.find({
          tenantId: tenant._id,
          ownerId: owner._id,
        })
          .select("_id title tenantId ownerId propertyId unit")
          .lean();
        assert.ok(requests.length > 0, "Expected existing linked maintenance request fixtures.");
        for (const request of requests) {
          assert.equal(String(request.tenantId), String(tenant._id));
          assert.equal(String(request.ownerId), String(owner._id));
          assert.ok(request.unit);
          const property = await Property.exists({
            _id: request.propertyId,
            ownerId: owner._id,
          });
          assert.ok(property, "Maintenance request must link to a property owned by its owner.");
        }
        const titleByRequest = new Map(requests.map((request) => [String(request._id), request.title]));
        const notifications = await Notification.find({
          type: { $in: ["maintenance-submitted", "maintenance-updated"] },
          maintenanceRequestId: { $in: requests.map((request) => request._id) },
          $or: [
            { recipientId: { $in: [tenant._id, owner._id] } },
            { tenantId: tenant._id },
          ],
        })
          .select("type details maintenanceRequestId deliveredChannels")
          .lean();
        assert.ok(notifications.length > 0, "Expected existing linked maintenance notification fixtures.");
        assert.ok(
          notifications.some((notification) =>
            notification.details?.maintenanceTitle ===
              titleByRequest.get(String(notification.maintenanceRequestId)) &&
            notification.deliveredChannels?.includes("inApp")
          ),
          "Expected a linked in-app notification with the request title."
        );
      } finally {
        if (mongoose) await mongoose.disconnect();
      }
    },
  },
];

runSuite("maintenance acceptance", tests).then(({ passed, failed, skipped }) => {
  console.log(
    `Maintenance acceptance summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${tests.length} total.`
  );
});
