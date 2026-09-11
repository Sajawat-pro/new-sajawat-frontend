import connectMongoDB from "@/lib/mongodb";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { synchronizeCashfreeOrder } from "@/lib/finalizeCashfreeOrder";
import { json, apiError, HttpError, readLimitedText } from "@/lib/http";
import Order from "@/models/Order";
export const runtime = "nodejs";
export async function POST(request) {
  try {
    const rawBody = await readLimitedText(request, 256000);
    if (!verifyCashfreeWebhookSignature({ rawBody, timestamp: request.headers.get("x-webhook-timestamp"), signature: request.headers.get("x-webhook-signature") })) throw new HttpError(401, "Invalid webhook signature.");
    let event;
    try { event = JSON.parse(rawBody); } catch { throw new HttpError(400, "Invalid webhook payload."); }
    // Unsupported event types are acknowledged without changing payment state.
    if (!["PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK", "REFUND_STATUS_WEBHOOK"].includes(event.type)) return json({ received: true });
    const cashfreeOrderId = event?.data?.order?.order_id || event?.data?.refund?.order_id || event?.data?.order_id;
    if (typeof cashfreeOrderId !== "string") throw new HttpError(400, "Order ID is missing.");
    await connectMongoDB();
    const order = await Order.findOne({ cashfreeOrderId }).select("_id");
    if (order) await synchronizeCashfreeOrder(cashfreeOrderId);
    return json({ received: true });
  } catch (error) { return apiError(error, "Webhook processing failed."); }
}
