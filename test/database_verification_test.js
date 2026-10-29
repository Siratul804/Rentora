require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

const checks = [];

function report(name, passed, detail) {
  checks.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}: ${detail}`);
}

function getDatabaseType(uri) {
  if (!uri) return "not configured";

  try {
    const hostname = new URL(uri).hostname.toLowerCase();
    if (hostname.endsWith(".mongodb.net")) return "MongoDB Atlas";
    if (["localhost", "127.0.0.1", "::1"].includes(hostname)) return "local MongoDB";
    return "remote MongoDB";
  } catch {
    return "unrecognized MongoDB URI";
  }
}

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log(`MongoDB deployment: ${getDatabaseType(uri)}`);

  const [{ default: dbConnect }, { default: User }, { Invoice }] = await Promise.all([
    import("../lib/dbConnect.js"),
    import("../lib/models/User.js"),
    import("../lib/models/Invoice.js"),
  ]);

  const approvalStatusValues = User.schema.path("approvalStatus")?.enumValues || [];
  report(
    "Owner approval is stored on the User model",
    ["Pending", "Approved", "Rejected"].every((status) =>
      approvalStatusValues.includes(status)
    ),
    approvalStatusValues.length
      ? `User.approvalStatus supports: ${approvalStatusValues.join(", ")}.`
      : "User.approvalStatus is not defined."
  );

  if (!uri) {
    report("Payment record exists after successful payment", false, "MONGODB_URI is not configured.");
    report("Owner-registration invoice is updated correctly", false, "MONGODB_URI is not configured.");
    report("Owner subscription status is updated", false, "MONGODB_URI is not configured.");
    report("Transaction ID is stored", false, "MONGODB_URI is not configured.");
    report("Validation ID is stored when implemented", false, "MONGODB_URI is not configured.");
    report("Duplicate owner-registration payment records are absent", false, "MONGODB_URI is not configured.");
    return;
  }

  try {
    await dbConnect();
  } catch (error) {
    const reason = `MongoDB connection failed${error.code ? ` (${error.code})` : ""}; verify network access and Atlas IP access rules.`;
    report("Payment record exists after successful payment", false, reason);
    report("Owner-registration invoice is updated correctly", false, reason);
    report("Owner subscription status is updated", false, reason);
    report("Transaction ID is stored", false, reason);
    report("Validation ID is stored when implemented", false, reason);
    report("Duplicate owner-registration payment records are absent", false, reason);
    return;
  }

  try {
    const email = process.env.DATABASE_TEST_EMAIL?.trim().toLowerCase();
    const user = email
      ? await User.findOne({ email, role: "owner" }).select("_id email status").lean()
      : null;

    let paidInvoice;
    let invoiceOwnerId;
    if (email) {
      if (user) {
        invoiceOwnerId = user._id;
        paidInvoice = await Invoice.findOne({
          ownerId: user._id,
          type: "owner_registration",
          status: "Paid",
        })
          .sort({ updatedAt: -1 })
          .lean();
      }
    } else {
      paidInvoice = await Invoice.findOne({
        type: "owner_registration",
        status: "Paid",
      })
        .sort({ updatedAt: -1 })
        .lean();
      invoiceOwnerId = paidInvoice?.ownerId;
    }

    const owner = user || (invoiceOwnerId
      ? await User.findById(invoiceOwnerId).select("_id email status").lean()
      : null);

    report(
      "Payment record exists after successful payment",
      Boolean(paidInvoice),
      paidInvoice
        ? `Found a Paid owner_registration Invoice for ${owner?.email || "the linked owner"}; no separate Payment model exists.`
        : email
          ? `No Paid owner_registration Invoice found for ${email}.`
          : "No Paid owner_registration Invoice exists in the Invoice collection."
    );

    report(
      "Owner-registration invoice is updated correctly",
      Boolean(paidInvoice && paidInvoice.status === "Paid" && paidInvoice.rentAmount === 499),
      paidInvoice
        ? `Invoice status is ${paidInvoice.status}; amount is ${paidInvoice.rentAmount}.`
        : "A matching Paid owner_registration Invoice was not found."
    );

    report(
      "Owner subscription status is updated",
      owner?.status === "Paid",
      owner
        ? `User.status for ${owner.email} is ${owner.status}.`
        : "No owner linked to a Paid owner_registration Invoice was found."
    );

    report(
      "Transaction ID is stored",
      Boolean(paidInvoice?.tranId?.trim()),
      paidInvoice?.tranId
        ? "The Paid owner_registration Invoice contains a transaction ID."
        : "The Paid owner_registration Invoice has no transaction ID."
    );

    report(
      "Validation ID is stored when implemented",
      Boolean(paidInvoice?.valId?.trim()),
      paidInvoice?.valId
        ? "The Invoice model supports valId and the Paid record contains it."
        : "The Invoice model supports valId, but the Paid record has no validation ID."
    );

    const invoiceCount = invoiceOwnerId
      ? await Invoice.countDocuments({
        ownerId: invoiceOwnerId,
        type: "owner_registration",
      })
      : 0;
    report(
      "Duplicate owner-registration payment records are absent",
      Boolean(invoiceOwnerId && invoiceCount === 1),
      invoiceOwnerId
        ? `Found ${invoiceCount} owner_registration Invoice record(s) for the owner; expected exactly one.`
        : "Could not identify an owner to check for duplicate payment records."
    );
  } finally {
    await mongoose.disconnect();
  }
}

run()
  .catch((error) => {
    console.error(
      `FAIL database verification setup: ${error.message || "Unexpected setup error."}`
    );
    process.exitCode = 1;
  })
  .finally(() => {
    const passed = checks.filter((check) => check.passed).length;
    const failed = checks.length - passed;
    console.log(`Database verification summary: ${passed} passed, ${failed} failed, ${checks.length} total.`);
    if (failed) process.exitCode = 1;
  });
