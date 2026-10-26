export async function downloadInvoice(invoiceId) {
  const response = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/pdf`);
  if (!response.ok) {
    let message = "Failed to download the invoice PDF.";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Keep the download error message when the server response is not JSON.
    }
    throw new Error(message);
  }

  const pdf = await response.blob();
  const url = URL.createObjectURL(pdf);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `rent-invoice-${String(invoiceId).replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
