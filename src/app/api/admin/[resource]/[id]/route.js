import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin";
import { assertSameOrigin, readJson, apiError, HttpError, json, cleanText } from "@/lib/http";
import { validateProduct, validateOffer } from "@/lib/adminValidation";
import { orderTransitions } from "@/lib/commerce";
import { synchronizeCashfreeOrder } from "@/lib/finalizeCashfreeOrder";
import { rateLimit } from "@/lib/rateLimit";
import connectMongoDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Offer from "@/models/Offer";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export async function PATCH(request, { params }) {
  try {
    assertSameOrigin(request); const admin = await requireAdmin(); await connectMongoDB();
    const { resource, id } = await params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid record ID.");
    const body = await readJson(request);
    if (resource === "products" || resource === "offers") {
      const model = resource === "products" ? Product : Offer;
      const data = Object.keys(body).length === 1 && typeof body.active === "boolean" ? { active: body.active } : resource === "products" ? validateProduct(body) : validateOffer(body);
      const item = await model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
      if (!item) throw new HttpError(404, "Record not found.");
      return json({ item });
    }
    if (resource !== "orders") throw new HttpError(404, "Resource not found.");
    const order = await Order.findById(id);
    if (!order) throw new HttpError(404, "Order not found.");
    if (body.action === "collect_delivery") {
      if (!["shipped", "delivered"].includes(order.orderStatus) || order.paymentStatus === "refunded" || order.amountRefunded > 0) throw new HttpError(400, "Delivery payments can only be recorded for shipped or delivered orders without refunds.");
      if (!order.deliveryPayment?.collectedAt) {
        if (body.updatedAt !== order.updatedAt.toISOString()) throw new HttpError(409, "This order changed. Refresh it before recording a payment.");
        const balance = Math.round((order.total - (order.amountPaid || 0)) * 100) / 100;
        if (balance <= 0 || Number(body.amount) !== balance || !cleanText(body.reference, 150)) throw new HttpError(400, "Enter the exact outstanding amount and a collection reference.");
        const result = await Order.updateOne({ _id: id, updatedAt: order.updatedAt }, {
          $set: { amountPaid: order.total, balanceDue: 0, paymentStatus: "paid", deliveryPayment: { amount: balance, reference: cleanText(body.reference, 150), actor: admin.email, collectedAt: new Date() } },
          $push: { statusHistory: { status: "delivery_payment", note: `₹${balance} collected; ${cleanText(body.reference, 150)}`, actor: admin.email, at: new Date() } },
        });
        if (!result.modifiedCount) throw new HttpError(409, "This order changed. Refresh before continuing.");
      }
      // Retrying after an interrupted write reconstructs this ledger row from the recorded collection.
      const saved = await Order.findById(id);
      const collection = saved.deliveryPayment;
      await Payment.updateOne({ paymentId: "delivery_" + id }, { $setOnInsert: { paymentId: "delivery_" + id, orderId: id, orderNumber: order.orderNumber,
        customerName: order.customer.name, customerEmail: order.customer.email, amount: collection.amount, currency: "INR", status: "SUCCESS",
        method: "cash_on_delivery", bankReference: collection.reference, paidAt: collection.collectedAt, message: "Recorded by " + collection.actor } }, { upsert: true });
      return json({ message: "Delivery payment recorded." });
    }
    if (body.action === "reconcile") {
      if (!order.cashfreeOrderId) throw new HttpError(400, "This order has no Cashfree payment.");
      await rateLimit("admin-sync:" + id, 5);
      await synchronizeCashfreeOrder(order.cashfreeOrderId);
      return json({ message: "Payment history refreshed from Cashfree." });
    }
    if (body.updatedAt !== order.updatedAt.toISOString()) throw new HttpError(409, "This order changed. Close it and refresh before saving.");
    const next = body.orderStatus;
    if (next !== order.orderStatus && ["confirmed", "packed", "shipped"].includes(next) && order.paymentMethod === "cashfree" &&
      (!["paid", "partially_paid"].includes(order.paymentStatus) || order.amountRefunded > 0)) throw new HttpError(400, "This payment needs to be resolved before fulfilment can continue.");
    if (next !== order.orderStatus && !orderTransitions[order.orderStatus]?.includes(next)) throw new HttpError(400, "That order status transition is not allowed.");
    const trackingNumber = cleanText(body.trackingNumber, 100), courier = cleanText(body.courier, 100);
    if (next === "shipped" && (!trackingNumber || !courier)) throw new HttpError(400, "Add the courier and tracking number before shipping.");
    const update = { $set: { orderStatus: next, trackingNumber, courier, adminNotes: cleanText(body.adminNotes, 3000) },
      $push: { statusHistory: { status: next, note: next === order.orderStatus ? "Order details updated" : "Status updated by administrator", actor: admin.email, at: new Date() } } };
    if (next === "delivered" && order.orderStatus !== next) update.$set.deliveredAt = new Date();
    if (next === "cancelled" && order.orderStatus !== next) update.$set.cancelledAt = new Date();
    const result = await Order.updateOne({ _id: id, updatedAt: order.updatedAt }, update, { runValidators: true });
    if (!result.modifiedCount) throw new HttpError(409, "This order changed. Refresh before saving.");
    return json({ message: "Order updated." });
  } catch (error) {
    if (error.code === 11000) return json({ message: "That slug or code is already in use." }, 409);
    return apiError(error, "Unable to update this record.");
  }
}
