import Order from "@/models/Order";
import Payment from "@/models/Payment";
import { getCashfreeOrder, getCashfreePayments, getCashfreeRefunds } from "@/lib/cashfree";
import { paymentDecision, paise, rupees } from "@/lib/commerce";
export async function synchronizeCashfreeOrder(cashfreeOrderId) {
  const order = await Order.findOne({ cashfreeOrderId });
  if (!order) throw new Error("Order not found.");
  const remote = await getCashfreeOrder(cashfreeOrderId);
  const decision = paymentDecision(order, remote);
  const payments = await getCashfreePayments(cashfreeOrderId);
  if (!Array.isArray(payments)) throw new Error("Payment history could not be verified.");
  for (const payment of payments) {
    if (!payment.cf_payment_id || !Number.isFinite(Number(payment.payment_amount))) continue;
    const paymentId = String(payment.cf_payment_id);
    const fields = {
      orderId: order._id, orderNumber: order.orderNumber, cashfreeOrderId,
      customerName: order.customer.name, customerEmail: order.customer.email,
      amount: Number(payment.payment_amount), currency: payment.payment_currency || "INR",
      status: payment.payment_status, method: payment.payment_group || "online",
      bankReference: String(payment.bank_reference || ""), message: String(payment.payment_message || "").slice(0, 300),
      paidAt: payment.payment_completion_time || payment.payment_time || null,
    };
    try { await Payment.updateOne({ paymentId }, { $setOnInsert: { paymentId, ...fields } }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
    // Delayed responses cannot downgrade successful payment attempts.
    await Payment.updateOne({ paymentId, status: { $ne: "SUCCESS" } }, { $set: fields });
  }
  if (decision) {
    const update = { $set: { ...decision, lastPaymentSyncAt: new Date() } };
    if (remote.order_status === "PAID") {
      update.$set.paidAt = order.paidAt || new Date();
      update.$push = { statusHistory: { status: "payment_received", note: "Cashfree payment verified", actor: "Cashfree", at: new Date() } };
    }
    await Order.updateOne({ _id: order._id, paymentStatus: { $nin: ["paid", "partially_paid", "refunded"] } }, update);
  }
  // A guarded transition prevents duplicate webhooks from rewinding fulfilment.
  await Order.updateOne({ _id: order._id, orderStatus: "payment_pending", paymentStatus: { $in: ["paid", "partially_paid"] } }, {
    $set: { orderStatus: "confirmed" },
    $push: { statusHistory: { status: "confirmed", note: "Payment confirmed", actor: "Cashfree", at: new Date() } },
  });
  if (remote.order_status === "PAID") {
    const refunds = await getCashfreeRefunds(cashfreeOrderId);
    if (!Array.isArray(refunds)) throw new Error("Refund history could not be verified.");
    for (const refund of refunds) {
      if (!refund.cf_refund_id || refund.refund_currency !== "INR" || !Number.isFinite(Number(refund.refund_amount))) continue;
      const paymentId = "refund_" + refund.cf_refund_id;
      const fields = { kind: "refund", orderId: order._id, orderNumber: order.orderNumber, cashfreeOrderId,
        customerName: order.customer.name, customerEmail: order.customer.email, amount: Number(refund.refund_amount), currency: "INR",
        status: "REFUND_" + refund.refund_status, method: "refund", bankReference: refund.refund_arn || "",
        message: String(refund.refund_note || refund.status_description || "").slice(0, 300), paidAt: refund.processed_at || refund.created_at || null };
      try { await Payment.updateOne({ paymentId }, { $setOnInsert: { paymentId, ...fields } }, { upsert: true }); }
      catch (error) { if (error.code !== 11000) throw error; }
      await Payment.updateOne({ paymentId, status: { $ne: "REFUND_SUCCESS" } }, { $set: fields });
    }
    const recordedRefunds = await Payment.find({ orderId: order._id, kind: "refund", status: "REFUND_SUCCESS" }).select("amount").lean();
    const amountRefunded = rupees(recordedRefunds.reduce((sum, item) => sum + paise(item.amount), 0));
    await Order.updateOne({ _id: order._id }, { $max: { amountRefunded }, $set: { lastPaymentSyncAt: new Date() } });
    if (amountRefunded > 0) await Order.updateOne({ _id: order._id, amountPaid: { $lte: amountRefunded }, paymentStatus: { $ne: "refunded" } }, {
      $set: { paymentStatus: "refunded" }, $push: { statusHistory: { status: "refunded", note: "Refund verified with Cashfree", actor: "Cashfree", at: new Date() } },
    });
  }
  return Order.findById(order._id);
}
