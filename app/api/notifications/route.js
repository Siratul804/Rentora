import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import AuditLog from "@/lib/models/AuditLog";
import Lease from "@/lib/models/Lease";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";

const ALLOWED_DAYS = [30, 15, 7];

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
  const preferences = user.notificationPreferences?.leaseExpiry;
  const daysBefore = Array.isArray(preferences?.daysBefore)
    ? preferences.daysBefore.filter((day) => ALLOWED_DAYS.includes(day))
    : ALLOWED_DAYS;

  return { daysBefore };
}

function daysUntil(dateString, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) return null;
  const expiry = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(expiry.getTime()) || expiry.toISOString().slice(0, 10) !== dateString) return null;
  return Math.round((expiry.getTime() - today.getTime()) / 86400000);
}

async function createReminder(lease, recipient, role, daysBefore) {
  try {
    const notification = await Notification.create({
      recipientId: recipient._id,
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
      deliveredChannels: ["inApp"],
    });

    await AuditLog.create({
      action: "lease-expiry-reminder-delivered",
      leaseId: lease._id,
      notificationId: notification._id,
      recipientId: recipient._id,
      tenantId: lease.tenantId || null,
      ownerId: lease.ownerId,
      propertyId: lease.propertyId || null,
      actorRole: role,
      status: "in-app-delivered",
    });
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
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
    const leases =
      session.role === "owner"
        ? await Lease.find({ ownerId: user._id, status: "Active" }).lean()
        : await Lease.find({
            $or: [{ tenantId: user._id }, { tenantEmail: user.email }],
            status: "Active",
          }).lean();

    let createdCount = 0;
    for (const lease of leases) {
      const remainingDays = daysUntil(lease.endDate, today);
      if (!preferences.daysBefore.includes(remainingDays)) continue;
      createdCount += Number(
        await createReminder(lease, user, session.role, remainingDays)
      );
    }

    const notificationQuery =
      session.role === "tenant"
        ? {
            $or: [
              { recipientId: user._id },
              { recipientId: { $exists: false }, tenantId: user._id },
            ],
          }
        : { recipientId: user._id };
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
    if (
      !Array.isArray(body.daysBefore) ||
      !body.daysBefore.every((day) => ALLOWED_DAYS.includes(day))
    ) {
      return NextResponse.json({ error: "Select valid lease reminder periods." }, { status: 400 });
    }

    await dbConnect();
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 401 });
    }

    user.notificationPreferences = {
      ...user.notificationPreferences?.toObject?.(),
      leaseExpiry: {
        daysBefore: [...new Set(body.daysBefore)].sort((a, b) => b - a),
      },
    };
    await user.save();

    return NextResponse.json({ preferences: getPreferences(user) });
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

    const { notificationId } = await request.json();
    if (!mongoose.isValidObjectId(notificationId)) {
      return NextResponse.json({ error: "A valid notification ID is required." }, { status: 400 });
    }

    await dbConnect();
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 401 });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      ...(session.role === "tenant"
        ? {
            $or: [
              { recipientId: user._id },
              { recipientId: { $exists: false }, tenantId: user._id },
            ],
          }
        : { recipientId: user._id }),
    });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
      if (notification.type === "lease-expiry") {
        await AuditLog.create({
          action: "lease-expiry-reminder-read",
          leaseId: notification.leaseId,
          notificationId: notification._id,
          recipientId: user._id,
          tenantId: notification.tenantId,
          ownerId: notification.ownerId,
          actorId: user._id,
          actorRole: session.role,
          status: "read",
        });
      }
    }

    const unreadCount = await Notification.countDocuments({
      ...(session.role === "tenant"
        ? {
            $or: [
              { recipientId: user._id },
              { recipientId: { $exists: false }, tenantId: user._id },
            ],
          }
        : { recipientId: user._id }),
      readAt: null,
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Update notification read status error:", error);
    return NextResponse.json({ error: "Failed to update notification status." }, { status: 500 });
  }
}
