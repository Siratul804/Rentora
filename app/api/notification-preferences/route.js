import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import NotificationPreference from "@/lib/models/NotificationPreference";

const PREFERENCE_KEYS = {
  events: [
    "invoiceGenerated",
    "invoiceSent",
    "rentDueReminders",
    "maintenanceSubmitted",
    "maintenanceUpdated",
  ],
  channels: ["inApp", "email", "sms"],
  eventChannels: [
    "invoiceGenerated",
    "invoiceSent",
    "rentDueReminders",
    "maintenanceSubmitted",
    "maintenanceUpdated",
  ],
};

async function getAccount() {
  const session = await getServerSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Please sign in to manage notification preferences." }, { status: 401 }),
    };
  }
  if (!["owner", "tenant"].includes(session.role)) {
    return {
      response: NextResponse.json({ error: "Only owners and tenants can manage notification preferences." }, { status: 403 }),
    };
  }

  await dbConnect();
  let user = mongoose.isValidObjectId(session.id)
    ? await User.findOne({
        _id: session.id,
        role: session.role,
        isActive: { $ne: false },
      }).select("_id role")
    : null;

  if (!user && session.email) {
    user = await User.findOne({
      email: String(session.email).toLowerCase(),
      role: session.role,
      isActive: { $ne: false },
    }).select("_id role");
  }

  if (!user) {
    return {
      response: NextResponse.json({ error: "User account not found. Please sign in again." }, { status: 401 }),
    };
  }

  return { user };
}

async function getOrCreatePreferences(userId) {
  try {
    return await NotificationPreference.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  } catch (error) {
    if (error.code !== 11000) throw error;
    return NotificationPreference.findOne({ userId }).lean();
  }
}

export async function GET() {
  try {
    const account = await getAccount();
    if (account.response) return account.response;

    const preferences = await getOrCreatePreferences(account.user._id);
    if (!preferences) {
      return NextResponse.json({ error: "Failed to load notification preferences." }, { status: 500 });
    }

    return NextResponse.json({
      preferences: {
        ...preferences,
        userId: preferences.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Fetch notification preferences error:", error);
    return NextResponse.json({ error: "Failed to load notification preferences." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const account = await getAccount();
    if (account.response) return account.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const updates = {};
    for (const [section, values] of Object.entries(body)) {
      if (!Object.hasOwn(PREFERENCE_KEYS, section)) {
        return NextResponse.json({ error: `Unknown preference section: ${section}.` }, { status: 400 });
      }
      if (!values || typeof values !== "object" || Array.isArray(values)) {
        return NextResponse.json({ error: `${section} must be an object.` }, { status: 400 });
      }

      const allowedKeys = PREFERENCE_KEYS[section];
      const entries = Object.entries(values);
      if (!entries.length) {
        return NextResponse.json({ error: `${section} must include at least one preference.` }, { status: 400 });
      }

      for (const [key, value] of entries) {
        if (!allowedKeys.includes(key)) {
          return NextResponse.json({ error: `Unknown ${section} preference: ${key}.` }, { status: 400 });
        }

        if (section === "eventChannels") {
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            return NextResponse.json({ error: `${section}.${key} must be an object.` }, { status: 400 });
          }
          const channelEntries = Object.entries(value);
          if (!channelEntries.length) {
            return NextResponse.json({ error: `${section}.${key} must include a channel preference.` }, { status: 400 });
          }
          for (const [channel, enabled] of channelEntries) {
            if (!PREFERENCE_KEYS.channels.includes(channel) || typeof enabled !== "boolean") {
              return NextResponse.json({ error: `Invalid preference value for ${section}.${key}.${channel}.` }, { status: 400 });
            }
            updates[`eventChannels.${key}.${channel}`] = enabled;
          }
        } else {
          if (typeof value !== "boolean") {
            return NextResponse.json({ error: `Invalid preference value for ${section}.${key}.` }, { status: 400 });
          }
          updates[`${section}.${key}`] = value;
        }
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Provide at least one notification preference to update." }, { status: 400 });
    }

    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId: account.user._id },
      {
        $set: updates,
        $setOnInsert: { userId: account.user._id },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      preferences: {
        ...preferences,
        userId: preferences.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json({ error: "Failed to update notification preferences." }, { status: 500 });
  }
}
