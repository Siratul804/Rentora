import AuditLog from "@/lib/models/AuditLog";
import Notification from "@/lib/models/Notification";

const EVENT_KEYS = {
  "invoice-generated": "invoiceGenerated",
  "invoice-sent": "invoiceSent",
  "lease-expiry": "leaseExpiry",
  "rent-due": "rentDue",
  "maintenance-submitted": "maintenanceSubmitted",
  "maintenance-updated": "maintenanceUpdated",
};

function getChannelPreferences(recipient, eventKey) {
  const preferences = recipient.notificationPreferences || {};
  const event = preferences.events?.[eventKey] || {};
  return {
    enabled: event.enabled !== false,
    email: event.email === true,
    sms: event.sms === true,
  };
}

async function recordDelivery(notification, recipient, channel, status, error = "") {
  await AuditLog.create({
    action: "notification-delivery",
    notificationId: notification._id,
    notificationType: notification.type,
    recipientId: recipient._id,
    tenantId: notification.tenantId,
    ownerId: notification.ownerId,
    actorRole: recipient.role,
    channel,
    status,
    error,
  });
}

async function sendEmail(notification, recipient) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from || !recipient.email) {
    return { status: "not-configured", error: "Email provider or recipient is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient.email],
      subject: notification.title,
      text: notification.message,
    }),
  });
  if (!response.ok) {
    return { status: "failed", error: `Email provider returned HTTP ${response.status}.` };
  }
  return { status: "delivered" };
}

async function sendSms(notification, recipient) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from || !recipient.phone) {
    return { status: "not-configured", error: "SMS provider or recipient is not configured." };
  }

  const body = new URLSearchParams({
    To: recipient.phone,
    From: from,
    Body: `${notification.title}: ${notification.message}`,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  if (!response.ok) {
    return { status: "failed", error: `SMS provider returned HTTP ${response.status}.` };
  }
  return { status: "delivered" };
}

export async function createNotification({
  recipient,
  type,
  title,
  message,
  tenantId = null,
  ownerId = null,
  invoiceId = null,
  leaseId = null,
  maintenanceRequestId = null,
  details = {},
}) {
  const eventKey = EVENT_KEYS[type];
  if (!eventKey) throw new Error(`Unsupported notification type: ${type}`);

  const channels = getChannelPreferences(recipient, eventKey);
  if (!channels.enabled) return null;

  let notification;
  try {
    notification = await Notification.create({
      recipientId: recipient._id,
      tenantId,
      ownerId,
      invoiceId,
      leaseId,
      maintenanceRequestId,
      type,
      title,
      message,
      details,
      deliveredChannels: ["inApp"],
    });
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }

  await recordDelivery(notification, recipient, "inApp", "delivered");

  for (const [channel, isEnabled, deliver] of [
    ["email", channels.email, sendEmail],
    ["sms", channels.sms, sendSms],
  ]) {
    if (!isEnabled) continue;

    let result;
    try {
      result = await deliver(notification, recipient);
    } catch (error) {
      result = {
        status: "failed",
        error: error instanceof Error ? error.message : "The delivery provider request failed.",
      };
    }

    await recordDelivery(notification, recipient, channel, result.status, result.error);
    if (result.status === "delivered") notification.deliveredChannels.push(channel);
    if (result.status === "failed") {
      console.error(`Notification ${channel} delivery failed:`, result.error);
    }
  }

  if (notification.isModified("deliveredChannels")) await notification.save();
  return notification;
}
