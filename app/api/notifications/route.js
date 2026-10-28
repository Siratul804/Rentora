import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import { AuditLog } from "@/lib/models/AuditLog";

async function getAccount() {
  const session = await getServerSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Please sign in to view notifications." }, { status: 401 }),
    };
  }
  if (!["owner", "tenant"].includes(session.role)) {
    return {
      response: NextResponse.json({ error: "Only owners and tenants can access notifications." }, { status: 403 }),
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

function notificationRecipient(user) {
  return user.role === "tenant" ? { tenantId: user._id } : { ownerId: user._id };
}

export async function GET() {
  try {
    const account = await getAccount();
    if (account.response) return account.response;

    const recipient = notificationRecipient(account.user);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(recipient).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ ...recipient, readAt: null }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        ...notification,
        _id: notification._id.toString(),
        tenantId: notification.tenantId?.toString() || null,
        ownerId: notification.ownerId?.toString() || null,
        invoiceId: notification.invoiceId?.toString() || null,
        maintenanceRequestId: notification.maintenanceRequestId?.toString() || null,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
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

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !mongoose.isValidObjectId(body.notificationId) ||
      typeof body.read !== "boolean" ||
      Object.keys(body).some((key) => !["notificationId", "read"].includes(key))
    ) {
      return NextResponse.json(
        { error: "Provide a valid notificationId and boolean read value." },
        { status: 400 }
      );
    }

    const notification = await Notification.findOne({
      _id: body.notificationId,
      ...notificationRecipient(account.user),
    });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const currentlyRead = Boolean(notification.readAt);
    if (currentlyRead !== body.read) {
      const previousReadAt = notification.readAt;
      const previousUpdatedAt = notification.updatedAt || null;
      const changedAt = new Date(
        Math.max(Date.now(), (previousUpdatedAt?.getTime() || 0) + 1)
      );
      const updatedNotification = await Notification.findOneAndUpdate(
        {
          _id: notification._id,
          ...notificationRecipient(account.user),
          readAt: previousReadAt,
          updatedAt: previousUpdatedAt,
        },
        {
          $set: {
            readAt: body.read ? changedAt : null,
            updatedAt: changedAt,
          },
        },
        { new: true, timestamps: false }
      );

      if (!updatedNotification) {
        const latestNotification = await Notification.findOne({
          _id: notification._id,
          ...notificationRecipient(account.user),
        }).select("_id readAt");
        if (!latestNotification) {
          return NextResponse.json({ error: "Notification not found." }, { status: 404 });
        }

        return NextResponse.json({
          notification: {
            _id: latestNotification._id.toString(),
            readAt: latestNotification.readAt,
          },
        });
      }

      try {
        await AuditLog.create({
          action: body.read ? "notification-marked-read" : "notification-marked-unread",
          notificationId: updatedNotification._id,
          notificationType: updatedNotification.type,
          tenantId: updatedNotification.tenantId,
          ownerId: updatedNotification.ownerId,
          actorId: account.user._id,
          actorRole: account.user.role,
          status: body.read ? "read" : "unread",
        });
      } catch (auditError) {
        try {
          const rollback = await Notification.findOneAndUpdate(
            {
              _id: updatedNotification._id,
              ...notificationRecipient(account.user),
              readAt: updatedNotification.readAt,
              updatedAt: changedAt,
            },
            {
              $set: {
                readAt: previousReadAt,
                updatedAt: previousUpdatedAt,
              },
            },
            { timestamps: false }
          );
          if (!rollback) {
            console.error(
              "Notification audit failed and state rollback was skipped because the notification changed concurrently."
            );
          }
        } catch (rollbackError) {
          console.error("Notification state rollback failed after audit error:", rollbackError);
        }
        throw auditError;
      }

      notification.readAt = updatedNotification.readAt;
    }

    return NextResponse.json({
      notification: {
        _id: notification._id.toString(),
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    console.error("Update notification read status error:", error);
    return NextResponse.json({ error: "Failed to update notification read status." }, { status: 500 });
  }
}
