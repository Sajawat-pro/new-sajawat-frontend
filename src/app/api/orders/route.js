import connectMongoDB from "@/lib/mongodb";
import { getSessionUser } from "@/lib/getSessionUser";
import { json, apiError, HttpError } from "@/lib/http";
import Order from "@/models/Order";
export const runtime = "nodejs";
// All new orders go through verified checkout; the old endpoint bypassed the advance payment.
export async function POST() { return json({ message: "Please use the secure checkout to place an order." }, 405); }
export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Please sign in to view your orders.");
    await connectMongoDB();
    const page = Math.max(1, Math.min(10000, parseInt(new URL(request.url).searchParams.get("page")) || 1));
    const filter = { userId: user.id };
    const [orders, total] = await Promise.all([
      Order.find(filter).select("-cashfreePaymentSessionId -checkoutKey -checkoutFingerprint -cashfreeIdempotencyKey -adminNotes -statusHistory -firebaseUid")
        .sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(),
      Order.countDocuments(filter),
    ]);
    return json({ orders, total, page, pages: Math.ceil(total / 20) });
  } catch (error) { return apiError(error, "Unable to load your orders."); }
}
