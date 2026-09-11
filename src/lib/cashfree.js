import { createHmac, timingSafeEqual } from "node:crypto";
export const CASHFREE_API_VERSION = "2025-01-01";
export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const mode = process.env.CASHFREE_ENV;
  if (!["production", "sandbox"].includes(mode)) throw new Error("Set CASHFREE_ENV explicitly to production or sandbox.");
  if (!appId || !secretKey) throw new Error("Cashfree credentials are missing.");
  if (mode === "production" && (appId.startsWith("TEST_") || secretKey.startsWith("TEST_"))) throw new Error("Sandbox credentials cannot be used in production.");
  return { appId, secretKey, mode, baseUrl: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg" };
}
export function getSiteUrl() {
  const url = new URL(process.env.SITE_URL);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("SITE_URL must be a site origin.");
  if (getCashfreeMode() === "production" && (url.protocol !== "https:" || url.hostname === "localhost")) throw new Error("Live Cashfree requires a public HTTPS SITE_URL.");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid SITE_URL.");
  return url.origin;
}
async function cashfreeRequest(path, options = {}) {
  const config = getCashfreeConfig();
  const response = await fetch(config.baseUrl + path, {
    ...options, cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/json", "Content-Type": "application/json", "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": config.appId, "x-client-secret": config.secretKey, ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("Payment service is temporarily unavailable. Please retry the same checkout.");
    error.statusCode = response.status;
    console.error("Cashfree request failed", { status: response.status, code: data.code });
    throw error;
  }
  return data;
}
export const getCashfreeMode = () => getCashfreeConfig().mode;
export const createCashfreeOrder = (payload, idempotencyKey) => cashfreeRequest("/orders", {
  method: "POST", headers: { "x-idempotency-key": idempotencyKey }, body: JSON.stringify(payload),
});
export const getCashfreeOrder = orderId => cashfreeRequest("/orders/" + encodeURIComponent(orderId));
export const getCashfreePayments = orderId => cashfreeRequest("/orders/" + encodeURIComponent(orderId) + "/payments");
export const getCashfreeRefunds = orderId => cashfreeRequest("/orders/" + encodeURIComponent(orderId) + "/refunds");
export function verifyCashfreeWebhookSignature({ rawBody, timestamp, signature }) {
  if (!rawBody || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  const { secretKey } = getCashfreeConfig();
  const expected = createHmac("sha256", secretKey).update(timestamp + rawBody).digest("base64");
  const received = Buffer.from(signature);
  return received.length === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(expected), received);
}
