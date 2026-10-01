import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const conn = await dbConnect();
    const dbName = conn.connection.name;

    // Count existing users
    const userCount = await User.countDocuments();
    const users = await User.find({}, { passwordHash: 0 }).limit(10).lean();

    return NextResponse.json({
      success: true,
      message: "✅ MongoDB Connected Successfully!",
      database: dbName,
      userCount,
      users,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
