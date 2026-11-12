const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

function pdfText(value) {
  return String(value ?? "—")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function wrapText(value, maxLength) {
  const words = String(value ?? "—").split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!word) continue;
    if (word.length > maxLength) {
      if (line) lines.push(line);
      line = "";
      for (let index = 0; index < word.length; index += maxLength) {
        lines.push(word.slice(index, index + maxLength));
      }
      continue;
    }

    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : ["—"];
}

function text(content, x, y, size, color, font = "F1") {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfText(content)}) Tj ET\n`;
}

function rectangle(x, y, width, height, color) {
  return `${color} rg ${x} ${y} ${width} ${height} re f\n`;
}

function line(x1, y1, x2, y2, color = "0.88 0.91 0.92") {
  return `${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S\n`;
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatPeriod(period) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period || "")) return period || "Not available";
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Not available";
  return `BDT ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(value)}`;
}

function createPageContent(invoice) {
  let stream = "";
  stream += rectangle(0, 730, PAGE_WIDTH, 112, "0.02 0.47 0.40");
  stream += rectangle(0, 730, PAGE_WIDTH, 7, "0.02 0.58 0.52");
  stream += rectangle(54, 768, 38, 38, "0.02 0.58 0.52");
  stream += text("R", 66, 777, 24, "1 1 1", "F2");
  stream += text("Rentora", 105, 789, 23, "1 1 1", "F2");
  stream += text("Property management", 106, 773, 9, "0.88 0.98 0.95");
  stream += text("RENT INVOICE", 430, 794, 10, "0.88 0.98 0.95", "F2");
  stream += text(`#${String(invoice._id || "").slice(-8).toUpperCase()}`, 430, 777, 11, "1 1 1", "F2");

  stream += text("Invoice details", 54, 694, 19, "0.10 0.16 0.18", "F2");
  stream += text(`Billing period: ${formatPeriod(invoice.billingPeriod)}`, 54, 672, 10, "0.36 0.42 0.43");
  stream += text(`Issued: ${formatDate(invoice.createdAt)}`, 364, 672, 10, "0.36 0.42 0.43");
  stream += line(54, 655, 541, 655);

  const rows = [
    ["Tenant", invoice.tenantName || invoice.tenantId?.name || "Not available"],
    ["Property", invoice.propertyName || "Not available"],
    ["Unit", invoice.unit || "Not available"],
    ["Rent amount", formatAmount(invoice.rentAmount)],
    ["Due date", formatDate(invoice.dueDate)],
    ["Payment status", invoice.status || "Pending"],
  ];
  let y = 632;

  for (const [label, value] of rows) {
    const valueLines = wrapText(value, 48);
    const rowHeight = Math.max(31, valueLines.length * 13 + 14);
    stream += text(label, 58, y, 10, "0.40 0.46 0.47", "F2");
    valueLines.forEach((valueLine, index) => {
      const isAmount = label === "Rent amount";
      stream += text(valueLine, 193, y - index * 13, 11, isAmount ? "0.02 0.47 0.40" : "0.10 0.16 0.18", isAmount ? "F2" : "F1");
    });
    y -= rowHeight;
    stream += line(54, y + 7, 541, y + 7);
  }

  const instructions = invoice.paymentInstructions || "Please contact your property owner for payment details.";
  const instructionLines = wrapText(instructions, 78);
  const panelHeight = instructionLines.length * 14 + 43;
  const panelTop = y - 9;
  const panelBottom = panelTop - panelHeight;
  stream += rectangle(54, panelBottom, 487, panelHeight, "0.94 0.98 0.97");
  stream += text("Payment instructions", 68, panelTop - 22, 11, "0.02 0.40 0.35", "F2");
  instructionLines.forEach((instructionLine, index) => {
    stream += text(instructionLine, 68, panelTop - 42 - index * 14, 10, "0.19 0.25 0.25");
  });

  const footerY = Math.max(24, panelBottom - 30);
  stream += line(54, footerY + 17, 541, footerY + 17);
  stream += text("Thank you for choosing Rentora.", 54, footerY, 9, "0.40 0.46 0.47");
  stream += text("Keep this invoice for your records.", 370, footerY, 9, "0.40 0.46 0.47");
  return stream;
}

export function createInvoicePdf(invoice) {
  const content = createPageContent(invoice);
  const contentLength = Buffer.byteLength(content, "ascii");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${contentLength} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];

  let document = "%PDF-1.4\n%Rentora\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(document, "ascii"));
    document += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(document, "ascii");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    document += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(document, "ascii");
}
