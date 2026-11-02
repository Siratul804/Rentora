function escapeText(value) {
  return String(value ?? "—")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

export function createReportPdf(report) {
  const rows = [
    ["Report generated", new Date(report.generatedAt).toLocaleString()],
    ["Registered owners", report.owners],
    ["Tenant accounts", report.tenants],
    ["Properties", report.properties],
    ["Portfolio units", report.units],
    ["Paid owner accounts", report.paidOwnerAccounts],
    ["Owner registration revenue (BDT)", report.ownerRegistrationRevenue],
    ["Maintenance requests", report.maintenanceRequests],
    ["Completed maintenance requests", report.completedRequests],
    ["Pending maintenance requests", report.pendingRequests],
    ["Assigned maintenance requests", report.assignedRequests],
    ["Average completed-job rating", report.averageRating === null ? "Not rated" : Number(report.averageRating).toFixed(2)],
    ["Audit events (last 30 days)", report.auditEventsLast30Days],
  ];
  let content = "0.02 0.47 0.40 rg 0 730 595 112 re f\n";
  content += "BT /F2 22 Tf 1 1 1 rg 54 785 Td (Rentora Platform Report) Tj ET\n";
  content += "BT /F1 10 Tf 0.88 0.98 0.95 rg 55 763 Td (Live platform records) Tj ET\n";
  let y = 695;
  for (const [label, value] of rows) {
    content += `BT /F2 11 Tf 0.30 0.36 0.37 rg 58 ${y} Td (${escapeText(label)}) Tj ET\n`;
    content += `BT /F1 11 Tf 0.08 0.12 0.13 rg 340 ${y} Td (${escapeText(value)}) Tj ET\n`;
    content += `0.88 0.91 0.92 RG 0.7 w 54 ${y - 10} m 541 ${y - 10} l S\n`;
    y -= 42;
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  let document = "%PDF-1.4\n%Rentora\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(document, "ascii"));
    document += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const crossReferenceOffset = Buffer.byteLength(document, "ascii");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    document += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`;
  return Buffer.from(document, "ascii");
}
