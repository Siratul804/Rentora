import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../lib/models/User.js";
import Notification from "../lib/models/Notification.js";
import NotificationPreference from "../lib/models/NotificationPreference.js";
import { AuditLog } from "../lib/models/AuditLog.js";

function readTestConfiguration() {
  const databaseUri = process.env.TEST_MONGODB_URI;
  const serverDatabaseUri = process.env.TEST_SERVER_MONGODB_URI;
  const serverUrl = process.env.TEST_SERVER_URL;
  const applicationDatabaseUri = process.env.MONGODB_URI;

  if (!databaseUri || !serverDatabaseUri || !serverUrl || !applicationDatabaseUri) {
    throw new Error(
      "Notification tests require TEST_MONGODB_URI, TEST_SERVER_MONGODB_URI, TEST_SERVER_URL, and MONGODB_URI from the app server configuration."
    );
  }

  function parseDatabaseUri(uri, variableName, requireTestDatabase = true) {
    let parsed;
    try {
      parsed = new URL(uri);
    } catch {
      throw new Error(`${variableName} must be a valid MongoDB URI.`);
    }

    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) {
      throw new Error(`${variableName} must use a MongoDB URI scheme.`);
    }

    const name = decodeURIComponent(parsed.pathname.replace(/^\/+/, "").split("/")[0]);
    if (!name || (requireTestDatabase && !name.toLowerCase().includes("test"))) {
      throw new Error(`${variableName} must select a database whose name includes 'test'.`);
    }

    const options = [...parsed.searchParams.entries()].sort(([keyA, valueA], [keyB, valueB]) =>
      keyA === keyB ? valueA.localeCompare(valueB) : keyA.localeCompare(keyB)
    );
    return {
      name,
      identity: JSON.stringify({
        protocol: parsed.protocol,
        hostname: parsed.hostname.toLowerCase(),
        port: parsed.port,
        database: name,
        username: parsed.username,
        password: parsed.password,
        options,
      }),
    };
  }

  const testDatabase = parseDatabaseUri(databaseUri, "TEST_MONGODB_URI");
  const serverDatabase = parseDatabaseUri(serverDatabaseUri, "TEST_SERVER_MONGODB_URI");
  if (testDatabase.identity !== serverDatabase.identity) {
    throw new Error(
      "TEST_SERVER_MONGODB_URI must exactly identify the isolated database used by TEST_MONGODB_URI."
    );
  }

  const applicationDatabase = parseDatabaseUri(
    applicationDatabaseUri,
    "MONGODB_URI",
    false
  );
  if (applicationDatabase.identity !== testDatabase.identity) {
    throw new Error(
      "The app server MONGODB_URI must exactly identify the isolated database used by TEST_MONGODB_URI."
    );
  }

  let parsedServerUrl;
  try {
    parsedServerUrl = new URL(serverUrl);
  } catch {
    throw new Error("TEST_SERVER_URL must be a valid HTTP(S) URL.");
  }

  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(parsedServerUrl.hostname);
  if (
    !["http:", "https:"].includes(parsedServerUrl.protocol) ||
    parsedServerUrl.username ||
    parsedServerUrl.password ||
    (!isLoopback && !parsedServerUrl.hostname.toLowerCase().includes("test"))
  ) {
    throw new Error(
      "TEST_SERVER_URL must use HTTP(S) and identify a local or test host without embedded credentials."
    );
  }

  return {
    databaseUri,
    serverUrl: serverUrl.replace(/\/+$/, ""),
  };
}

export const TEST_CONFIG = readTestConfiguration();
export const TEST_PASSWORD = `Rentora-Test-${randomUUID()}`;

const createdUserIds = [];
const createdNotificationIds = [];

export function verifyTestConfiguration() {
  return TEST_CONFIG;
}

export async function connectTestDatabase() {
  verifyTestConfiguration();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_CONFIG.databaseUri, {
      bufferCommands: false,
    });
  }

  if (!mongoose.connection.name.toLowerCase().includes("test")) {
    throw new Error("Connected MongoDB database name does not identify a test database.");
  }
}

export async function createNotificationFixtures() {
  await connectTestDatabase();
  const suffix = randomUUID();
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  try {
    const owner = await User.create({
      name: "Notification Test Owner",
      email: `notification-owner-${suffix}@example.invalid`,
      passwordHash,
      role: "owner",
      status: "Paid",
    });
    createdUserIds.push(owner._id);

    const tenant = await User.create({
      name: "Notification Test Tenant",
      email: `notification-tenant-${suffix}@example.invalid`,
      passwordHash,
      role: "tenant",
      createdBy: owner._id,
    });
    createdUserIds.push(tenant._id);

    const otherTenant = await User.create({
      name: "Notification Test Other Tenant",
      email: `notification-other-tenant-${suffix}@example.invalid`,
      passwordHash,
      role: "tenant",
      createdBy: owner._id,
    });
    createdUserIds.push(otherTenant._id);

    const admin = await User.create({
      name: "Notification Test Admin",
      email: `notification-admin-${suffix}@example.invalid`,
      passwordHash,
      role: "admin",
    });
    createdUserIds.push(admin._id);

    const tenantNotification = await Notification.create({
      tenantId: tenant._id,
      invoiceId: new mongoose.Types.ObjectId(),
      type: "invoice-generated",
      title: "Test rent invoice",
      message: "Notification integration test fixture.",
    });
    createdNotificationIds.push(tenantNotification._id);

    const ownerNotification = await Notification.create({
      ownerId: owner._id,
      maintenanceRequestId: new mongoose.Types.ObjectId(),
      type: "maintenance-submitted",
      title: "Test maintenance request",
      message: "Owner notification integration test fixture.",
    });
    createdNotificationIds.push(ownerNotification._id);

    const otherTenantNotification = await Notification.create({
      tenantId: otherTenant._id,
      type: "rent-due-reminder",
      title: "Other tenant rent reminder",
      message: "Recipient isolation integration test fixture.",
    });
    createdNotificationIds.push(otherTenantNotification._id);

    return {
      owner: { id: owner._id.toString(), email: owner.email, role: owner.role },
      tenant: { id: tenant._id.toString(), email: tenant.email, role: tenant.role },
      otherTenant: {
        id: otherTenant._id.toString(),
        email: otherTenant.email,
        role: otherTenant.role,
      },
      admin: { id: admin._id.toString(), email: admin.email, role: admin.role },
      tenantNotificationId: tenantNotification._id.toString(),
      ownerNotificationId: ownerNotification._id.toString(),
      otherTenantNotificationId: otherTenantNotification._id.toString(),
    };
  } catch (error) {
    await cleanupNotificationFixtures();
    throw error;
  }
}

export async function cleanupNotificationFixtures() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    if (createdNotificationIds.length) {
      await AuditLog.deleteMany({ notificationId: { $in: createdNotificationIds } });
      await Notification.deleteMany({ _id: { $in: createdNotificationIds } });
    }
    if (createdUserIds.length) {
      await NotificationPreference.deleteMany({ userId: { $in: createdUserIds } });
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

export async function loginThroughApi(credentials) {
  const response = await fetch(new URL("/api/auth/login", TEST_CONFIG.serverUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: credentials.email,
      password: TEST_PASSWORD,
    }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, data.error || "Test account login failed.");

  const cookies = response.headers.getSetCookie?.() || [response.headers.get("set-cookie") || ""];
  const authCookie = cookies
    .map((cookie) => cookie.match(/(?:^|;\s*)rentora_token=([^;]+)/)?.[0])
    .find(Boolean);
  assert.ok(authCookie, "Login response did not contain the Rentora session cookie.");
  return authCookie;
}

export async function notificationApiRequest(path, { cookie, ...options } = {}) {
  verifyTestConfiguration();
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set("Cookie", cookie);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(new URL(path, TEST_CONFIG.serverUrl), {
    ...options,
    headers,
  });
}

export async function auditActionCount(notificationId, action) {
  await connectTestDatabase();
  return AuditLog.countDocuments({ notificationId, action });
}

export async function preferencesFor(userId) {
  await connectTestDatabase();
  return NotificationPreference.findOne({ userId }).lean();
}
