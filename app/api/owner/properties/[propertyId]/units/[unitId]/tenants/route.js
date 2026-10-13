export async function POST(req, { params }) {
    await dbConnect();
    const ownerId = verifyOwner(req);
    const body = await req.json();
    const { name, contactInfo, leaseStart, leaseEnd, documents, notes, paymentDetails } = body;

    if (!name || !contactInfo || !leaseStart || !leaseEnd) {
        return NextResponse.json({ error: "Name, contact info, and lease dates are required." }, { status: 400 });
    }

    const tenant = await Tenant.create({
        name,
        contactInfo,
        leaseStart,
        leaseEnd,
        documents,
        notes,
        paymentDetails,
        unitId: params.unitId,
        propertyId: params.propertyId,
        ownerId,
    });

    await AuditLog.create({
        action: "add-tenant",
        tenantId: tenant._id,
        unitId: params.unitId,
        propertyId: params.propertyId,
        ownerId,
        timestamp: new Date(),
    });

    return NextResponse.json({ message: "Tenant added successfully", tenant });
}
