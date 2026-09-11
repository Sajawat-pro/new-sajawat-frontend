import { randomUUID, createHash } from "node:crypto";
import { getSessionUser } from "@/lib/getSessionUser";
import { createCashfreeOrder, getCashfreeMode, getSiteUrl, getCashfreeOrder } from "@/lib/cashfree";
import { synchronizeCashfreeOrder } from "@/lib/finalizeCashfreeOrder";
import { paise, paymentDecision } from "@/lib/commerce";
import { quoteCheckout, deliveryDetails } from "@/lib/checkout";
import { assertSameOrigin, readJson, apiError, HttpError, json } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import Order from "@/models/Order";
export const runtime = "nodejs";
export async function POST(request) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Please sign in before making payment.");
    await rateLimit("checkout:" + user.id, 10);
    const body = await readJson(request);
    if (!["advance_99", "pay_now"].includes(body.paymentOption)) throw new HttpError(400, "Select a valid payment option.");
    if (!Number.isFinite(body.quotedTotal) || body.quotedTotal < 1) throw new HttpError(400, "Refresh checkout to review the latest total.");
    if (!/^[0-9a-f-]{36}$/i.test(body.checkoutKey || "")) throw new HttpError(400, "Refresh checkout and try again.");
    const siteUrl = getSiteUrl();
    const delivery = deliveryDetails(body);
    const checkoutKey = user.id + ":" + body.checkoutKey;
    const fingerprint = createHash("sha256").update(JSON.stringify({ delivery, items: body.items, paymentOption: body.paymentOption, offerCode: body.offerCode || "", quotedTotal: body.quotedTotal })).digest("hex");
    let order = await Order.findOne({ checkoutKey });
    if (order && order.checkoutFingerprint !== fingerprint) throw new HttpError(409, "Checkout changed. Refresh the page before trying again.");
    if (!order) {
      const quote = await quoteCheckout(body);
      if (paise(quote.total) !== paise(body.quotedTotal)) throw new HttpError(409, "Your total has changed. Review the updated amount before paying.");
      const orderNumber = "SJ-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") + "-" + randomUUID().slice(0, 8).toUpperCase();
      const amountDueNow = body.paymentOption === "advance_99" ? Math.min(99, quote.total) : quote.total;
      try {
        order = await Order.create({ ...quote, orderNumber, checkoutKey, checkoutFingerprint: fingerprint, cashfreeIdempotencyKey: randomUUID(),
          userId: user.id, firebaseUid: user.firebaseUid, customer: { name: delivery.name, email: user.email, phone: delivery.phone },
          shippingAddress: delivery.shippingAddress, paymentMethod: "cashfree", paymentOption: body.paymentOption,
          amountDueNow, amountPaid: 0, balanceDue: quote.total, expectedBalanceAfterPayment: Number((quote.total - amountDueNow).toFixed(2)),
          paymentStatus: "awaiting_payment", orderStatus: "payment_pending", cashfreeOrderId: orderNumber.replaceAll("-", "_"),
          statusHistory: [{ status: "payment_pending", note: "Checkout created", actor: "Customer" }],
        });
      } catch (error) { if (error.code !== 11000) throw error; order = await Order.findOne({ checkoutKey }); if (!order) throw error; }
    }
    if (order.checkoutFingerprint !== fingerprint) throw new HttpError(409, "Another checkout is in progress. Refresh and try again.");
    if (["paid", "partially_paid"].includes(order.paymentStatus)) return json({ confirmed: true, cashfreeOrderId: order.cashfreeOrderId });
    if (order.paymentStatus === "refunded" || order.orderStatus === "cancelled") throw new HttpError(409, "This order is closed. Start a new checkout.");
    if (order.cashfreePaymentSessionId) {
      const remote = await getCashfreeOrder(order.cashfreeOrderId);
      paymentDecision(order, remote);
      if (remote.order_status === "PAID") {
        await synchronizeCashfreeOrder(order.cashfreeOrderId);
        return json({ confirmed: true, cashfreeOrderId: order.cashfreeOrderId });
      }
      if (["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"].includes(remote.order_status)) {
        await Order.updateOne({ _id: order._id, paymentStatus: { $nin: ["paid", "partially_paid", "refunded"] } }, { $set: { cashfreeOrderStatus: remote.order_status, paymentStatus: "failed" } });
        throw new HttpError(409, "This session expired. Review your checkout and try again.");
      }
    }
    if (["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"].includes(order.cashfreeOrderStatus)) throw new HttpError(409, "This payment session expired. Refresh checkout to start again.");
    if (!order.cashfreePaymentSessionId) {
      // Persisting the key and payload makes retries safe after a timeout.
      const remote = await createCashfreeOrder({
        order_id: order.cashfreeOrderId, order_amount: order.amountDueNow, order_currency: "INR",
        customer_details: { customer_id: user.id, customer_name: order.customer.name, customer_email: order.customer.email, customer_phone: order.customer.phone },
        order_meta: { return_url: siteUrl + "/payment-return?cf_order_id={order_id}", ...(siteUrl.startsWith("https:") ? { notify_url: siteUrl + "/api/payments/webhook" } : {}) },
        order_note: "Payment for " + order.orderNumber,
      }, order.cashfreeIdempotencyKey);
      if (!remote.payment_session_id) throw new Error("Payment session was not returned.");
      await Order.updateOne({ _id: order._id }, { $set: { cashfreePaymentSessionId: remote.payment_session_id } });
      order.cashfreePaymentSessionId = remote.payment_session_id;
    }
    return json({ orderNumber: order.orderNumber, cashfreeOrderId: order.cashfreeOrderId, paymentSessionId: order.cashfreePaymentSessionId,
      cashfreeMode: getCashfreeMode(), total: order.total, amountDueNow: order.amountDueNow, balanceAfterPayment: order.expectedBalanceAfterPayment }, 201);
  } catch (error) { return apiError(error, "Unable to start payment. Please retry; your checkout will be safely resumed."); }
}
