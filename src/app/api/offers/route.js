import connectMongoDB from "@/lib/mongodb";
import Offer from "@/models/Offer";
import { json, apiError } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await connectMongoDB(); const now = new Date();
    const offers = await Offer.find({ active: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] }] })
      .select("code title description type value minOrder maxDiscount endsAt").sort({ createdAt: -1 }).limit(20).lean();
    return json({ offers });
  } catch (error) { return apiError(error, "Offers could not be loaded."); }
}
