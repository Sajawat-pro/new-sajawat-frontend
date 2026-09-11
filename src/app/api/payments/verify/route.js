import { getSessionUser } from "@/lib/getSessionUser";
import { synchronizeCashfreeOrder } from "@/lib/finalizeCashfreeOrder";
import { rateLimit } from "@/lib/rateLimit";
import { json, apiError, HttpError } from "@/lib/http";
import Order from "@/models/Order";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Please sign in to verify your payment.");
    const cashfreeOrderId = new URL(request.url).searchParams.get("cf_order_id");
    if (!cashfreeOrderId || !/^[\w-]{1,100}$/.test(cashfreeOrderId)) throw new HttpError(400, "A valid Cashfree order ID is required.");
    await rateLimit("verify:" + user.id, 30);
    const ownedOrder = await Order.findOne({ cashfreeOrderId, userId: user.id });
    if (!ownedOrder) throw new HttpError(404, "Order not found.");
    const order = ["paid", "partially_paid", "refunded"].includes(ownedOrder.paymentStatus) ? ownedOrder : await synchronizeCashfreeOrder(cashfreeOrderId);
    const confirmed = ["partially_paid", "paid"].includes(order.paymentStatus);
    return json({ confirmed, orderNumber: order.orderNumber, cashfreeOrderId, paymentOption: order.paymentOption,
      paymentStatus: order.paymentStatus, orderStatus: order.orderStatus, total: order.total, amountPaid: order.amountPaid, balanceDue: order.balanceDue,
      items: confirmed ? order.items.map(({ productId, size, quantity }) => ({ productId, size, quantity })) : [] }, confirmed ? 200 : 202);
  } catch (error) { return apiError(error, "Unable to verify the payment. Please check again shortly."); }
}
