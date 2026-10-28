export function isDemoPaymentMode() {
  return process.env.NODE_ENV !== "production" && process.env.PAYMENT_MODE !== "sslcommerz";
}
