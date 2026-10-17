function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function downloadInvoice(invoice) {
  const invoiceNumber = invoice._id || "invoice";
  const amount = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(invoice.rentAmount);
  const rows = [
    ["Invoice", invoiceNumber],
    ["Billing period", invoice.billingPeriod || "—"],
    ["Tenant", invoice.tenantName || invoice.tenantId?.name || "—"],
    ["Property", invoice.propertyName || "—"],
    ["Unit", invoice.unit || "—"],
    ["Rent amount", amount],
    ["Due date", invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"],
    ["Status", invoice.status || "Pending"],
    ["Payment instructions", invoice.paymentInstructions || "Please contact your property owner."],
  ];
  const content = rows.map(([label, value]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
  ).join("");
  const document = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rent invoice ${escapeHtml(invoiceNumber)}</title><style>body{font:16px Arial,sans-serif;color:#18181b;max-width:760px;margin:40px auto;padding:24px}h1{color:#047857}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid #e4e4e7}th{width:35%;color:#52525b}@media print{body{margin:0}}</style></head><body><h1>Rentora rent invoice</h1><table>${content}</table><p>Open this file in a browser and use Print to save a PDF copy.</p></body></html>`;
  const blob = new Blob([document], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `rent-invoice-${String(invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, "")}.html`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
