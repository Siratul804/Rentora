import { cookies } from "next/headers";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import Property from "@/lib/models/Property";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export const dynamic = "force-dynamic";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = await verifyToken(token);
  return user?.role === "admin";
}

export async function GET() {
  try {
    if (!(await getAdmin())) {
      return Response.json({ message: "Forbidden. Admin access required." }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find({ role: "owner" })
      .select("name email phone status approvalStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const propertyCounts = users.length
      ? await Property.aggregate([
        { $match: { ownerId: { $in: users.map((owner) => owner._id) } } },
        {
          $group: {
            _id: "$ownerId",
            properties: { $sum: 1 },
            units: { $sum: "$totalUnits" },
          },
        },
      ])
      : [];
    const countsByOwner = new Map(
      propertyCounts.map((item) => [item._id.toString(), item])
    );
    const owners = users.map((owner) => {
      const counts = countsByOwner.get(owner._id.toString());
      return {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        phone: owner.phone || "",
        status: owner.approvalStatus || "Pending",
        paymentStatus: owner.status,
        properties: counts?.properties || 0,
        units: counts?.units || 0,
      };
    });

    return Response.json({
      success: true,
      owners,
    });
  } catch (error) {
    console.error("Admin Owners API Error:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await getAdmin())) {
      return Response.json({ message: "Forbidden. Admin access required." }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "A valid JSON request body is required." }, { status: 400 });
    }

    const { id, action } = body || {};
    const statusByAction = { approve: "Approved", reject: "Rejected" };
    if (
      typeof id !== "string" ||
      !mongoose.isValidObjectId(id) ||
      !Object.hasOwn(statusByAction, action)
    ) {
      return Response.json({ message: "A valid owner and action are required." }, { status: 400 });
    }

    await dbConnect();
    const updatedOwner = await User.findOneAndUpdate(
      { _id: id, role: "owner" },
      { $set: { approvalStatus: statusByAction[action] } },
      { new: true, runValidators: true }
    )
      .select("name email phone status approvalStatus")
      .lean();
    if (!updatedOwner) {
      return Response.json({ message: "Owner not found." }, { status: 404 });
    }

    const [counts] = await Property.aggregate([
      { $match: { ownerId: updatedOwner._id } },
      {
        $group: {
          _id: "$ownerId",
          properties: { $sum: 1 },
          units: { $sum: "$totalUnits" },
        },
      },
    ]);
    const owner = {
      id: updatedOwner._id.toString(),
      name: updatedOwner.name,
      email: updatedOwner.email,
      phone: updatedOwner.phone || "",
      status: updatedOwner.approvalStatus || "Pending",
      paymentStatus: updatedOwner.status,
      properties: counts?.properties || 0,
      units: counts?.units || 0,
    };
    return Response.json({
      success: true,
      message: `Owner ${action === "approve" ? "approved" : "rejected"}`,
      owner,
    });
  } catch (error) {
    console.error("Admin Owner Update Error:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}