import { requireAdmin } from "@/lib/admin";
import connectMongoDB from "@/lib/mongodb";
import { apiError, HttpError, json } from "@/lib/http";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import Product from "@/models/Product";
import Offer from "@/models/Offer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateOrderFields = "-cashfreePaymentSessionId -checkoutKey -checkoutFingerprint -cashfreeIdempotencyKey -firebaseUid";
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    await connectMongoDB();
    const params = new URL(request.url).searchParams;
    const view = params.get("view") || "overview";
    const query = (params.get("q") || "").trim().slice(0, 100);
    const page = Math.max(1, Math.min(10000, parseInt(params.get("page")) || 1));
    const limit = 20;
    const status = params.get("status") || "";
    const dateFilter = {};
    for (const [param, op] of [["from", "$gte"], ["to", "$lte"]]) {
      const value = params.get(param);
      if (value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, "Use a valid date range.");
        const date = new Date(value + (param === "to" ? "T23:59:59.999+05:30" : "T00:00:00+05:30"));
        if (Number.isNaN(date.getTime())) throw new HttpError(400, "Use a valid date range.");
        dateFilter[op] = date;
      }
    }
    if (dateFilter.$gte && dateFilter.$lte && dateFilter.$gte > dateFilter.$lte) throw new HttpError(400, "The start date must precede the end date.");
    const filter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    if (view === "overview") {
      const since = new Date(Date.now() - 29 * 86400000); since.setUTCHours(0, 0, 0, 0);
      const [totals, trend, recent, products, offers, statuses] = await Promise.all([
        Order.aggregate([{ $group: { _id: null, orders: { $sum: 1 }, collected: { $sum: { $max: [0, { $subtract: [{ $ifNull: ["$amountPaid", 0] }, { $ifNull: ["$amountRefunded", 0] }] }] } },
          outstanding: { $sum: { $cond: [{ $and: [{ $in: ["$orderStatus", ["placed", "confirmed", "packed", "shipped", "delivered"]] }, { $ne: ["$paymentStatus", "refunded"] }] }, { $max: [0, { $subtract: ["$total", { $ifNull: ["$amountPaid", 0] }] }] }, 0] } },
          toShip: { $sum: { $cond: [{ $in: ["$orderStatus", ["placed", "confirmed", "packed"]] }, 1, 0] } },
          pendingPayments: { $sum: { $cond: [{ $eq: ["$orderStatus", "payment_pending"] }, 1, 0] } } } }]),
        Payment.aggregate([{ $match: { paidAt: { $gte: since }, status: "SUCCESS", kind: { $ne: "refund" } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "Asia/Kolkata" } }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Order.find().select(privateOrderFields).sort({ createdAt: -1 }).limit(6).lean(), Product.countDocuments({ active: true }), Offer.countDocuments({ active: true }),
        Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
      ]);
      return json({ admin: { name: admin.name, email: admin.email }, totals: totals[0] || { orders: 0, collected: 0, outstanding: 0, toShip: 0, pendingPayments: 0 }, trend, recent, products, offers, statuses, updatedAt: new Date() });
    }
    if (view === "customers") {
      const pipeline = [{ $sort: { createdAt: -1 } }, { $group: { _id: "$userId", name: { $first: "$customer.name" }, email: { $first: "$customer.email" }, phone: { $first: "$customer.phone" },
        orders: { $sum: 1 }, paid: { $sum: { $max: [0, { $subtract: [{ $ifNull: ["$amountPaid", 0] }, { $ifNull: ["$amountRefunded", 0] }] }] } }, lastOrder: { $first: "$createdAt" } } }];
      if (query) pipeline.push({ $match: { $or: ["name", "email", "phone"].map(field => ({ [field]: { $regex: escapeRegex(query), $options: "i" } })) } });
      pipeline.push({ $sort: { lastOrder: -1 } }, { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: "total" }] } });
      const [result] = await Order.aggregate(pipeline);
      return json({ items: result.items, total: result.count[0]?.total || 0, page, limit });
    }
    const config = {
      orders: { model: Order, fields: ["orderNumber", "customer.name", "customer.email", "customer.phone"], status: "orderStatus" },
      payments: { model: Payment, fields: ["paymentId", "orderNumber", "customerName", "customerEmail", "bankReference"], status: "status" },
      products: { model: Product, fields: ["name", "sku", "collection"] },
      offers: { model: Offer, fields: ["code", "title"] },
    }[view];
    if (!config) throw new HttpError(400, "Unknown dashboard view.");
    if (query) filter.$or = config.fields.map(field => ({ [field]: { $regex: escapeRegex(query), $options: "i" } }));
    if (status && config.status) filter[config.status] = status;
    const [items, total] = await Promise.all([
      config.model.find(filter).select(view === "orders" ? privateOrderFields : "").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      config.model.countDocuments(filter),
    ]);
    return json({ items, total, page, limit });
  } catch (error) { return apiError(error, "Unable to load the dashboard. Please try again."); }
}
