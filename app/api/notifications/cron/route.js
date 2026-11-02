import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { createRentDueReminders } from "@/lib/notificationReminders";

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Notification scheduler is not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await dbConnect();
    const tenants = await User.find({
      role: "tenant",
      isActive: { $ne: false },
    }).select("email phone role notificationPreferences");
    let createdCount = 0;
    for (const tenant of tenants) {
      createdCount += await createRentDueReminders(tenant);
    }

    return NextResponse.json({ success: true, createdCount });
  } catch (error) {
    console.error("Scheduled rent notification error:", error);
    return NextResponse.json({ error: "Failed to process scheduled rent reminders." }, { status: 500 });
  }
}
