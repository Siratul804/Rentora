import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import AuditLog from "@/lib/models/AuditLog";
import Lease from "@/lib/models/Lease";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { createNotification } from "@/lib/notificationDelivery";
import { createRentDueReminders } from "@/lib/notificationReminders";
import { getServerSession } from "@/lib/session";

const REMINDER_DAYS = [1, 3, 7, 14, 30, 60, 90];
const EVENT_KEYS = [
  "rentDue",
  "maintenanceSubmitted",
  "maintenanceUpdated",
  "invoiceGenerated",
  "invoiceSent",
  "leaseExpiry",
];

async function getCurrentUser(session) {
  const query = { role: session.role, isActive: { $ne: false } };
  if (mongoose.isValidObjectId(session.id)) {
    query._id = session.id;
  } else if (session.email) {
    query.email = String(session.email).toLowerCase();
  } else {
    return null;
  }
  return User.findOne(query);
}

function getPreferences(user) {
  const saved = user.notificationPreferences || {};
  const savedEvents = saved.events || {};
  const oldLeaseDays = saved.leaseExpiry?.daysBefore;
  const events = Object.fromEntries(
    EVENT_KEYS.map((key) => {
      const event = savedEvents[key] || {};
      const daysBefore = key === "leaseExpiry"
        ? oldLeaseDays
        : event.daysBefore;
      return [
        key,
        {
          enabled: event.enabled !== false,
          email: event.email === true,
          sms: event.sms === true,
          ...(key === "rentDue" || key === "leaseExpiry"
            ? {
                daysBefore: Array.isArray(daysBefore)
                  ? [...new Set(daysBefore.filter((day) => REMINDER_DAYS.includes(day)))].sort((a, b) => b - a)
                  : key === "rentDue" ? [7] : [30, 15, 7],
              }
            : {}),
        },
      ];
    })
  );
  return { events, daysBefore: events.leaseExpiry.daysBefore };
}

function daysUntil(date, today) {
  const dueDate = new Date(date);
  if (Number.isNaN(dueDate.getTime())) return null;
  dueDate.setUTCHours(0, 0, 0, 0);
  return Math.round((dueDate.getTime() - today.getTime()) / 86400000);
}

async function createLeaseReminder(lease, recipient, role, daysBefore) {
  return createNotification({
    recipient,
    tenantId: lease.tenantId || null,
    ownerId: lease.ownerId,
    leaseId: lease._id,
    type: "lease-expiry",
    title: `Lease expires in ${daysBefore} days`,
    message: `${lease.tenantName}'s lease at ${lease.propertyName}${lease.unit ? `, ${lease.unit}` : ""} expires on ${lease.endDate}.`,
    details: {
      tenantName: lease.tenantName,
      propertyName: lease.propertyName,
      unit: lease.unit || "",
      expiryDate: lease.endDate,
      renewalOptions:
        role === "tenant"
          ? "Contact your property owner to discuss renewal or move-out options."
          : "Contact the tenant to discuss renewal or move-out options.",
      daysBefore,
    },
  });
}

function getRecipientQuery(user, role) {
  return role === "tenant"
    ? {
        $or: [
          { recipientId: user._id },
          { recipientId: { $exists: false }, tenantId: user._id },
        ],
      }
    : { recipientId: user._id };
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !["owner", "tenant"].includes(session.role)) {
      return NextResponse.json({ error: "Please sign in to view notifications." }, { status: 401 });
    }

    await dbConnect();
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 401 });
    }

    const preferences = getPreferences(user);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let createdCount = 0;

    if (preferences.events.leaseExpiry.enabled) {
      const leases = session.role === "owner"
        ? await Lease.find({ ownerId: user._id, status: "Active" }).lean()
        : await Lease.find({
            $or: [{ tenantId: user._id }, { tenantEmail: user.email }],
            status: "Active",
          }).lean();

      for (const lease of leases) {
        const remainingDays = daysUntil(lease.endDate, today);
        if (!preferences.events.leaseExpiry.daysBefore.includes(remainingDays)) continue;
        createdCount += Number(
          Boolean(await createLeaseReminder(lease, user, session.role, remainingDays))
        );
      }
    }

    if (session.role === "tenant") {
      createdCount += await createRentDueReminders(user);
    }

    const notificationQuery = getRecipientQuery(user, session.role);
    const notifications = await Notification.find(notificationQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const unreadCount = await Notification.countDocuments({
      ...notificationQuery,
      readAt: null,
    });

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        ...notification,
        _id: notification._id.toString(),
        recipientId: notification.recipientId?.toString() || null,
        tenantId: notification.tenantId?.toString() || null,
        ownerId: notification.ownerId?.toString() || null,
        invoiceId: notification.invoiceId?.toString() || null,
        leaseId: notification.leaseId?.toString() || null,
        maintenanceRequestId: notification.maintenanceRequestId?.toString() || null,
      })),
      preferences,
      unreadCount,
      createdCount,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession();
    if (!session || !["owner", "tenant"].includes(session.role)) {
      return NextResponse.json({ error: "Please sign in to update notification preferences." }, { status: 401 });
    }

    const body = await request.json();
    if (!body?.events || typeof body.events !== "object" || Array.isArray(body.events)) {
      return NextResponse.json({ error: "Notification event preferences are required." }, { status: 400 });
    }

    const events = {};
    for (const key of EVENT_KEYS) {
      const event = body.events[key];
      if (!event || typeof event.enabled !== "boolean" ||
          typeof event.email !== "boolean" || typeof event.sms !== "boolean") {
        return NextResponse.json({ error: "Choose valid event and channel preferences." }, { status: 400 });
      }
      events[key] = { enabled: event.enabled, email: event.email, sms: event.sms };
      if (key === "rentDue" || key === "leaseExpiry") {
        if (!Array.isArray(event.daysBefore) ||
            !event.daysBefore.every((day) => REMINDER_DAYS.includes(day))) {
          return NextResponse.json({ error: "Select valid reminder periods." }, { status: 400 });
        }
        events[key].daysBefore = [...new Set(event.daysBefore)].sort((a, b) => b - a);
      }
    }

    await dbConnect();
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 401 });
    }

    user.notificationPreferences = {
      ...user.notificationPreferences,
      leaseExpiry: { daysBefore: events.leaseExpiry.daysBefore },
      events,
    };
    await user.save();

    return NextResponse.json({ preferences: { events, daysBefore: events.leaseExpiry.daysBefore } });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json({ error: "Failed to save notification preferences." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session || !["owner", "tenant"].includes(session.role)) {
      return NextResponse.json({ error: "Please sign in to update notifications." }, { status: 401 });
    }

    const { notificationId, isRead = true } = await request.json();
    if (!mongoose.isValidObjectId(notificationId) || typeof isRead !== "boolean") {
      return NextResponse.json({ error: "A valid notification ID and read status are required." }, { status: 400 });
    }

    await dbConnect();
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 401 });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      ...getRecipientQuery(user, session.role),
    });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const nextReadAt = isRead ? notification.readAt || new Date() : null;
    if (String(notification.readAt || "") !== String(nextReadAt || "")) {
      notification.readAt = nextReadAt;
      await notification.save();
      await AuditLog.create({
        action: isRead ? "notification-read" : "notification-unread",
        notificationId: notification._id,
        notificationType: notification.type,
        recipientId: user._id,
        tenantId: notification.tenantId,
        ownerId: notification.ownerId,
        actorId: user._id,
        actorRole: session.role,
        status: isRead ? "read" : "unread",
      });
    }

    const recipientQuery = getRecipientQuery(user, session.role);
    const unreadCount = await Notification.countDocuments({ ...recipientQuery, readAt: null });
    return NextResponse.json({ success: true, unreadCount, readAt: notification.readAt });
  } catch (error) {
    console.error("Update notification read status error:", error);
    return NextResponse.json({ error: "Failed to update notification status." }, { status: 500 });
  }
}
