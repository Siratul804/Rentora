import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Invoice } from "../lib/models/Invoice.js";
import User from "../lib/models/User.js";
import {
  connectTestDatabase,
  TEST_CONFIG,
  TEST_PASSWORD,
} from "./notification-test-helpers.js";

const createdUserIds = [];
const registeredEmails = new Set();

export { TEST_CONFIG, TEST_PASSWORD };

export async function createAuthFixtures() {
  await connectTestDatabase();
  const suffix = randomUUID();
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  async function createUser(role, options = {}) {
    const user = await User.create({
      name: `Rentora Auth Test ${role}`,
      email: `rentora-auth-test-${role}-${suffix}@example.invalid`,
      passwordHash,
      role,
      ...options,
    });
    createdUserIds.push(user._id);
    return {
      id: user._id.toString(),
      email: user.email,
      password: TEST_PASSWORD,
      role: user.role,
    };
  }

  try {
    return {
      admin: await createUser("admin"),
      owner: await createUser("owner", { status: "Paid" }),
      pendingOwner: await createUser("pending-owner", {
        role: "owner",
        status: "Pending",
      }),
      tenant: await createUser("tenant"),
      inactiveTenant: await createUser("inactive-tenant", {
        role: "tenant",
        isActive: false,
      }),
      duplicateOwner: await createUser("duplicate-owner", {
        role: "owner",
        status: "Paid",
      }),
    };
  } catch (error) {
    await cleanupAuthFixtures();
    throw error;
  }
}

export function trackRegistrationEmail(email) {
  registeredEmails.add(email);
}

export async function cleanupAuthFixtures() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const users = await User.find({
      $or: [
        { _id: { $in: createdUserIds } },
        { email: { $in: [...registeredEmails] } },
      ],
    })
      .select("_id")
      .lean();
    const userIds = users.map((user) => user._id);

    if (userIds.length) {
      await Invoice.deleteMany({
        ownerId: { $in: userIds },
        type: "owner_registration",
      });
      await User.deleteMany({ _id: { $in: userIds } });
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    createdUserIds.length = 0;
    registeredEmails.clear();
  }
}

export async function authApiRequest(path, { cookie, ...options } = {}) {
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

export async function loginThroughApi(credentials) {
  const response = await authApiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Login failed with HTTP ${response.status}.`);
  }

  const cookies = response.headers.getSetCookie?.() || [
    response.headers.get("set-cookie") || "",
  ];
  const authCookie = cookies
    .map((cookie) => cookie.match(/(?:^|;\s*)rentora_token=([^;]+)/)?.[0])
    .find(Boolean);

  if (!authCookie) {
    throw new Error("Login response did not contain the Rentora session cookie.");
  }
  return authCookie;
}
