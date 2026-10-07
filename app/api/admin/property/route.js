
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// Temporary property data
let properties = [
  {
    id: "1",
    name: "Green View Apartments",
    location: "Dhanmondi, Dhaka",
    owner: "Rahim Ahmed",
    units: 24,
    tenants: 18,
    status: "Active",
  },
  {
    id: "2",
    name: "Lake City Residence",
    location: "Gulshan, Dhaka",
    owner: "Karim Hasan",
    units: 32,
    tenants: 27,
    status: "Active",
  },
  {
    id: "3",
    name: "Sunrise Heights",
    location: "Banani, Dhaka",
    owner: "Mariam Sultana",
    units: 18,
    tenants: 12,
    status: "Pending",
  },
];

// Check admin authentication
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

// GET - View all properties
export async function GET() {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    return Response.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error("Admin Properties GET Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Add a new property
export async function POST(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const { name, location, owner, units, tenants, status } = body;

    // Basic validation
    if (!name || !location || !owner) {
      return Response.json(
        {
          message: "Name, location and owner are required.",
        },
        { status: 400 }
      );
    }

    const newProperty = {
      id: Date.now().toString(),
      name,
      location,
      owner,
      units: units || 0,
      tenants: tenants || 0,
      status: status || "Active",
    };

    properties.push(newProperty);

    return Response.json(
      {
        success: true,
        message: "Property added successfully.",
        property: newProperty,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Properties POST Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Edit a property
export async function PUT(request) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const { id, name, location, owner, units, tenants, status } = body;

    if (!id) {
      return Response.json(
        { message: "Property ID is required." },
        { status: 400 }
      );
    }

    const propertyIndex = properties.findIndex(
      (property) => property.id === id
    );

    if (propertyIndex === -1) {
      return Response.json(
        { message: "Property not found." },
        { status: 404 }
      );
    }

    properties[propertyIndex] = {
      ...properties[propertyIndex],
      ...(name !== undefined && { name }),
      ...(location !== undefined && { location }),
      ...(owner !== undefined && { owner }),
      ...(units !== undefined && { units }),
      ...(tenants !== undefined && { tenants }),
      ...(status !== undefined && { status }),
    };

    return Response.json({
      success: true,
      message: "Property updated successfully.",
      property: properties[propertyIndex],
    });
  } catch (error) {
    console.error("Admin Properties PUT Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a property
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
        { message: "Property ID is required." },
        { status: 400 }
      );
    }

    const propertyIndex = properties.findIndex(
      (property) => property.id === id
    );

    if (propertyIndex === -1) {
      return Response.json(
        { message: "Property not found." },
        { status: 404 }
      );
    }

    const deletedProperty = properties[propertyIndex];

    properties = properties.filter(
      (property) => property.id !== id
    );

    return Response.json({
      success: true,
      message: "Property deleted successfully.",
      property: deletedProperty,
    });
  } catch (error) {
    console.error("Admin Properties DELETE Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

