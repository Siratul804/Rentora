import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export const dynamic = "force-dynamic";

let tenants = [
  {
    id: "1",
    name: "Nusrat Jahan",
    email: "nusrat@example.com",
    phone: "01711111111",
    property: "Green View Apartments",
    unit: "A-101",
    rent: 25000,
    status: "Active",
  },
  {
    id: "2",
    name: "Tanvir Hasan",
    email: "tanvir@example.com",
    phone: "01822222222",
    property: "Lake City Residence",
    unit: "B-202",
    rent: 30000,
    status: "Active",
  },
  {
    id: "3",
    name: "Sadia Rahman",
    email: "sadia@example.com",
    phone: "01933333333",
    property: "Sunrise Heights",
    unit: "C-301",
    rent: 22000,
    status: "Pending",
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

// GET - View all tenants
export async function GET() {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    return Response.json({
      success: true,
      tenants,
    });
  } catch (error) {
    console.error("Admin Tenants GET Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Add tenant
export async function POST(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      property,
      unit,
      rent,
      status,
    } = body;

    if (!name || !email || !property || !unit) {
      return Response.json(
        {
          message:
            "Name, email, property and unit are required.",
        },
        { status: 400 }
      );
    }

    const newTenant = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone || "",
      property,
      unit,
      rent: rent || 0,
      status: status || "Active",
    };

    tenants.push(newTenant);

    return Response.json(
      {
        success: true,
        message: "Tenant added successfully.",
        tenant: newTenant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Tenants POST Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Edit tenant
export async function PUT(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const {
      id,
      name,
      email,
      phone,
      property,
      unit,
      rent,
      status,
    } = body;

    if (!id) {
      return Response.json(
        { message: "Tenant ID is required." },
        { status: 400 }
      );
    }

    const tenantIndex = tenants.findIndex(
      (tenant) => tenant.id === id
    );

    if (tenantIndex === -1) {
      return Response.json(
        { message: "Tenant not found." },
        { status: 404 }
      );
    }

    tenants[tenantIndex] = {
      ...tenants[tenantIndex],
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(property !== undefined && { property }),
      ...(unit !== undefined && { unit }),
      ...(rent !== undefined && { rent }),
      ...(status !== undefined && { status }),
    };

    return Response.json({
      success: true,
      message: "Tenant updated successfully.",
      tenant: tenants[tenantIndex],
    });
  } catch (error) {
    console.error("Admin Tenants PUT Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tenant
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
        { message: "Tenant ID is required." },
        { status: 400 }
      );
    }

    const tenantIndex = tenants.findIndex(
      (tenant) => tenant.id === id
    );

    if (tenantIndex === -1) {
      return Response.json(
        { message: "Tenant not found." },
        { status: 404 }
      );
    }

    const deletedTenant = tenants[tenantIndex];

    tenants = tenants.filter(
      (tenant) => tenant.id !== id
    );

    return Response.json({
      success: true,
      message: "Tenant deleted successfully.",
      tenant: deletedTenant,
    });
  
} catch (error) {
  console.error("Admin Tenants DELETE Error:", error);

  return Response.json(
    { message: "Internal Server Error" },
    { status: 500 }
  );
}
}