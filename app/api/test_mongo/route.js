import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();

        // Create sample user
        const newUser = await User.create({ name: "Test User", email: "test@rentora.com", phone: "1234567890" });

        // Read back
        const users = await User.find();

        return NextResponse.json({ message: "✅ MongoDB Connected Successfully!", users });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
