
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export const dynamic = "force-dynamic";

let units = [
  {
    id: "1",
    unitNumber: "A-101",
    property: "Green View Apartments",
    tenant: "Rahim Ahmed",
    rent: 25000,
    status: "Occupied",
  },
  {
    id: "2",
    unitNumber: "B-202",
    property: "Lake City Residence",
    tenant: "Karim Hasan",
    rent: 30000,
    status: "Occupied",
  },
  {
    id: "3",
    unitNumber: "C-301",
    property: "Sunrise Heights",
    tenant: null,
    rent: 22000,
    status: "Vacant",
  },
];

async function authenticateAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return {
      error: Response.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  let user = null;

  try {
    user = await verifyToken(token);
  } catch {
    user = null;
  }

  if (!user) {
    return {
      error: Response.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      error: Response.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

// GET - View all units
export async function GET() {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    return Response.json({
      success: true,
      units,
    });
  } catch (error) {
    console.error("Admin Units GET Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Add unit
export async function POST(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const {
      unitNumber,
      property,
      tenant,
      rent,
      status,
    } = body;

    if (!unitNumber || !property) {
      return Response.json(
        {
          message: "Unit number and property are required.",
        },
        { status: 400 }
      );
    }

    const newUnit = {
      id: Date.now().toString(),
      unitNumber,
      property,
      tenant: tenant || null,
      rent: rent || 0,
      status: status || "Vacant",
    };

    units.push(newUnit);

    return Response.json(
      {
        success: true,
        message: "Unit added successfully.",
        unit: newUnit,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Units POST Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Edit unit
export async function PUT(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const {
      id,
      unitNumber,
      property,
      tenant,
      rent,
      status,
    } = body;

    if (!id) {
      return Response.json(
        { message: "Unit ID is required." },
        { status: 400 }
      );
    }

    const unitIndex = units.findIndex(
      (unit) => unit.id === id
    );

    if (unitIndex === -1) {
      return Response.json(
        { message: "Unit not found." },
        { status: 404 }
      );
    }

    units[unitIndex] = {
      ...units[unitIndex],
      ...(unitNumber !== undefined && { unitNumber }),
      ...(property !== undefined && { property }),
      ...(tenant !== undefined && { tenant }),
      ...(rent !== undefined && { rent }),
      ...(status !== undefined && { status }),
    };

    return Response.json({
      success: true,
      message: "Unit updated successfully.",
      unit: units[unitIndex],
    });
  } catch (error) {
    console.error("Admin Units PUT Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete unit
export async function DELETE(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { message: "Unit ID is required." },
        { status: 400 }
      );
    }

    const unitIndex = units.findIndex(
      (unit) => unit.id === id
    );

    if (unitIndex === -1) {
      return Response.json(
        { message: "Unit not found." },
        { status: 404 }
      );
    }

    const deletedUnit = units[unitIndex];

    units = units.filter(
      (unit) => unit.id !== id
    );

    return Response.json({
      success: true,
      message: "Unit deleted successfully.",
      unit: deletedUnit,
    });
  } catch (error) {
    console.error("Admin Units DELETE Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

