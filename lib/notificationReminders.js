import { Invoice } from "@/lib/models/Invoice";
import { createNotification } from "@/lib/notificationDelivery";

const REMINDER_DAYS = [1, 3, 7, 14, 30, 60, 90];

export async function createRentDueReminders(tenant) {
  const event = tenant.notificationPreferences?.events?.rentDue || {};
  if (event.enabled === false) return 0;

  const daysBefore = Array.isArray(event.daysBefore)
    ? [...new Set(event.daysBefore.filter((day) => REMINDER_DAYS.includes(day)))]
    : [7];
  if (!daysBefore.length) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const invoices = await Invoice.find({
    tenantId: tenant._id,
    status: "Pending",
    dueDate: {
      $gte: today,
      $lte: new Date(today.getTime() + Math.max(...daysBefore) * 86400000),
    },
    $or: [{ type: "rent" }, { type: { $exists: false } }],
  }).lean();

  let createdCount = 0;
  for (const invoice of invoices) {
    const dueDate = new Date(invoice.dueDate);
    dueDate.setUTCHours(0, 0, 0, 0);
    const remainingDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    if (!daysBefore.includes(remainingDays)) continue;

    const notification = await createNotification({
      recipient: tenant,
      tenantId: tenant._id,
      ownerId: invoice.ownerId,
      invoiceId: invoice._id,
      leaseId: invoice.leaseId,
      type: "rent-due",
      title: `Rent due in ${remainingDays} ${remainingDays === 1 ? "day" : "days"}`,
      message: `${Number(invoice.rentAmount).toLocaleString()} for ${invoice.propertyName}${invoice.unit ? `, ${invoice.unit}` : ""} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.`,
      details: {
        propertyName: invoice.propertyName,
        unit: invoice.unit || "",
        dueDate: invoice.dueDate,
        rentAmount: invoice.rentAmount,
        daysBefore: remainingDays,
      },
    });
    createdCount += Number(Boolean(notification));
  }
  return createdCount;
}
