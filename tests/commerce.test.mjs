import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount, paymentDecision, orderTransitions, paise } from "../src/lib/commerce.js";
import { createHmac } from "node:crypto";
import { verifyCashfreeWebhookSignature, getCashfreeConfig, getSiteUrl } from "../src/lib/cashfree.js";

test("offer calculation respects schedules, spend thresholds, caps and paise rounding", () => {
  const offer = { active: true, type: "percentage", value: 15, minOrder: 100, maxDiscount: 50 };
  assert.equal(calculateDiscount(offer, 99), 0);
  assert.equal(calculateDiscount(offer, 199), 29.85);
  assert.equal(calculateDiscount(offer, 1000), 50);
  assert.equal(calculateDiscount({ ...offer, active: false }, 1000), 0);
  assert.equal(calculateDiscount({ ...offer, startsAt: "2030-01-01" }, 1000, new Date("2026-01-01")), 0);
  assert.equal(calculateDiscount({ ...offer, endsAt: "2026-01-01" }, 1000, new Date("2026-01-01")), 0);
  assert.equal(calculateDiscount({ active: true, type: "fixed", value: 500 }, 100), 99);
  assert.equal(calculateDiscount({ active: true, type: "percentage", value: 100 }, 1), 0);
});
const order = { cashfreeOrderId: "SJ_123", amountDueNow: 99, total: 499, paymentStatus: "awaiting_payment", orderStatus: "payment_pending" };
const remote = { order_id: "SJ_123", order_amount: 99, order_currency: "INR", order_status: "PAID" };
test("only the matching order, currency, and amount can confirm payment", () => {
  for (const changes of [{ order_id: "other" }, { order_currency: "USD" }, { order_amount: 98.99 }, { order_amount: NaN }, { order_amount: null }]) assert.throws(() => paymentDecision(order, { ...remote, ...changes }));
  const result = paymentDecision(order, remote);
  assert.equal(result.paymentStatus, "partially_paid");
  assert.equal(result.amountPaid, 99);
  assert.equal(result.balanceDue, 400);
  assert.equal(paymentDecision({ ...order, total: 99 }, remote).paymentStatus, "paid");
  assert.equal(paise(result.amountPaid) + paise(result.balanceDue), paise(order.total));
});
test("duplicate and out-of-order verification never resets paid or fulfilled state", () => {
  for (const paymentStatus of ["paid", "partially_paid", "refunded"]) for (const orderStatus of ["confirmed", "shipped", "delivered", "cancelled"]) {
    assert.equal(paymentDecision({ ...order, paymentStatus, orderStatus }, { ...remote, order_status: "ACTIVE" }), null);
    assert.equal(paymentDecision({ ...order, paymentStatus, orderStatus }, remote), null);
  }
  assert.equal(paymentDecision(order, { ...remote, order_status: "EXPIRED" }).paymentStatus, "failed");
  assert.equal(paymentDecision(order, { ...remote, order_status: "ACTIVE" }).orderStatus, undefined);
  assert.deepEqual(orderTransitions.payment_pending, []);
  assert.deepEqual(orderTransitions.shipped, ["delivered"]);
  assert.deepEqual(orderTransitions.delivered, []);
});
test("Cashfree signatures require the exact raw payload", () => {
  process.env.CASHFREE_APP_ID = "test-app"; process.env.CASHFREE_SECRET_KEY = "test-secret"; process.env.CASHFREE_ENV = "sandbox";
  const rawBody = '{"amount":170.00}', timestamp = "1740000000000";
  const signature = createHmac("sha256", "test-secret").update(timestamp + rawBody).digest("base64");
  assert.equal(verifyCashfreeWebhookSignature({ rawBody, timestamp, signature }), true);
  assert.equal(verifyCashfreeWebhookSignature({ rawBody: JSON.stringify(JSON.parse(rawBody)), timestamp, signature }), false);
  assert.equal(verifyCashfreeWebhookSignature({ rawBody, timestamp, signature: "bad" }), false);
  assert.equal(verifyCashfreeWebhookSignature({ rawBody, timestamp: "", signature }), false);
});
test("Cashfree configuration fails closed for invalid modes and unsafe live URLs", () => {
  process.env.CASHFREE_ENV = "development";
  assert.throws(getCashfreeConfig);
  process.env.CASHFREE_ENV = "production"; process.env.CASHFREE_APP_ID = "TEST_example";
  assert.throws(getCashfreeConfig);
  process.env.CASHFREE_APP_ID = "live-app"; process.env.SITE_URL = "http://localhost:3000";
  assert.throws(getSiteUrl);
  process.env.SITE_URL = "https://shop.example.com/path";
  assert.throws(getSiteUrl);
  process.env.SITE_URL = "https://shop.example.com";
  assert.equal(getSiteUrl(), "https://shop.example.com");
});
