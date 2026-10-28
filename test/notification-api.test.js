import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  auditActionCount,
  cleanupNotificationFixtures,
  createNotificationFixtures,
  loginThroughApi,
  notificationApiRequest,
  preferencesFor,
} from "./notification-test-helpers.js";

let fixtures;
let ownerCookie;
let tenantCookie;
let otherTenantCookie;
let adminCookie;

before(async () => {
  fixtures = await createNotificationFixtures();
  [ownerCookie, tenantCookie, otherTenantCookie, adminCookie] = await Promise.all([
    loginThroughApi(fixtures.owner),
    loginThroughApi(fixtures.tenant),
    loginThroughApi(fixtures.otherTenant),
    loginThroughApi(fixtures.admin),
  ]);
});

after(async () => {
  await cleanupNotificationFixtures();
});

test("notification API requires authentication and rejects unsupported roles", async () => {
  const unauthenticated = await notificationApiRequest("/api/notifications");
  assert.equal(unauthenticated.status, 401);

  const admin = await notificationApiRequest("/api/notifications", { cookie: adminCookie });
  assert.equal(admin.status, 403);
});

test("GET lists only notifications addressed to the signed-in owner or tenant", async () => {
  const [tenantResponse, ownerResponse, otherTenantResponse] = await Promise.all([
    notificationApiRequest("/api/notifications", { cookie: tenantCookie }),
    notificationApiRequest("/api/notifications", { cookie: ownerCookie }),
    notificationApiRequest("/api/notifications", { cookie: otherTenantCookie }),
  ]);
  const [tenantData, ownerData, otherTenantData] = await Promise.all([
    tenantResponse.json(),
    ownerResponse.json(),
    otherTenantResponse.json(),
  ]);

  assert.equal(tenantResponse.status, 200);
  assert.equal(ownerResponse.status, 200);
  assert.equal(otherTenantResponse.status, 200);
  assert.ok(tenantData.notifications.some((item) => item._id === fixtures.tenantNotificationId));
  assert.ok(ownerData.notifications.some((item) => item._id === fixtures.ownerNotificationId));
  assert.ok(otherTenantData.notifications.some((item) => item._id === fixtures.otherTenantNotificationId));
  assert.ok(!tenantData.notifications.some((item) => item._id === fixtures.otherTenantNotificationId));
  assert.ok(!ownerData.notifications.some((item) => item._id === fixtures.tenantNotificationId));
  assert.equal(tenantData.unreadCount, 1);
  assert.equal(ownerData.unreadCount, 1);
});

test("PATCH validates notification IDs and bodies and prevents cross-recipient updates", async () => {
  const invalidId = await notificationApiRequest("/api/notifications", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({ notificationId: "invalid", read: true }),
  });
  assert.equal(invalidId.status, 400);

  const invalidState = await notificationApiRequest("/api/notifications", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({ notificationId: fixtures.tenantNotificationId, read: "true" }),
  });
  assert.equal(invalidState.status, 400);

  const extraField = await notificationApiRequest("/api/notifications", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({
      notificationId: fixtures.tenantNotificationId,
      read: true,
      tenantId: fixtures.otherTenant.id,
    }),
  });
  assert.equal(extraField.status, 400);

  const crossRecipient = await notificationApiRequest("/api/notifications", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({ notificationId: fixtures.otherTenantNotificationId, read: true }),
  });
  assert.equal(crossRecipient.status, 404);
});

test("PATCH audits only actual read and unread transitions", async () => {
  const notificationId = fixtures.tenantNotificationId;
  const markRead = () =>
    notificationApiRequest("/api/notifications", {
      method: "PATCH",
      cookie: tenantCookie,
      body: JSON.stringify({ notificationId, read: true }),
    });
  const markUnread = () =>
    notificationApiRequest("/api/notifications", {
      method: "PATCH",
      cookie: tenantCookie,
      body: JSON.stringify({ notificationId, read: false }),
    });

  assert.equal((await markRead()).status, 200);
  assert.equal(await auditActionCount(notificationId, "notification-marked-read"), 1);
  assert.equal((await markRead()).status, 200);
  assert.equal(await auditActionCount(notificationId, "notification-marked-read"), 1);

  assert.equal((await markUnread()).status, 200);
  assert.equal(await auditActionCount(notificationId, "notification-marked-unread"), 1);
  assert.equal((await markUnread()).status, 200);
  assert.equal(await auditActionCount(notificationId, "notification-marked-unread"), 1);
});

test("preferences use defaults and preserve unspecified values on partial update", async () => {
  const getPreferences = () => notificationApiRequest("/api/notification-preferences", { cookie: tenantCookie });
  const initialResponse = await getPreferences();
  const initialData = await initialResponse.json();
  assert.equal(initialResponse.status, 200);
  assert.equal(initialData.preferences.events.rentDueReminders, true);
  assert.equal(initialData.preferences.channels.inApp, true);
  assert.equal(initialData.preferences.channels.email, false);

  const updateResponse = await notificationApiRequest("/api/notification-preferences", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({
      events: { rentDueReminders: false },
      eventChannels: { rentDueReminders: { sms: true } },
    }),
  });
  const updatedData = await updateResponse.json();
  assert.equal(updateResponse.status, 200);
  assert.equal(updatedData.preferences.events.rentDueReminders, false);
  assert.equal(updatedData.preferences.eventChannels.rentDueReminders.sms, true);
  assert.equal(updatedData.preferences.eventChannels.rentDueReminders.inApp, true);
  assert.equal(updatedData.preferences.events.invoiceGenerated, true);

  const persisted = await preferencesFor(fixtures.tenant.id);
  assert.equal(persisted.events.rentDueReminders, false);
  assert.equal(persisted.channels.email, false);
});

test("preference API rejects unknown fields and invalid preference values", async () => {
  const unknownKey = await notificationApiRequest("/api/notification-preferences", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({ events: { unknownEvent: true } }),
  });
  assert.equal(unknownKey.status, 400);

  const invalidChannel = await notificationApiRequest("/api/notification-preferences", {
    method: "PATCH",
    cookie: tenantCookie,
    body: JSON.stringify({ eventChannels: { invoiceSent: { push: true } } }),
  });
  assert.equal(invalidChannel.status, 400);
});
