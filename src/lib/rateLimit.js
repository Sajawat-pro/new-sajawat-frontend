import { createHash } from "node:crypto";
import RateLimit from "@/models/RateLimit";
import connectMongoDB from "@/lib/mongodb";
import { HttpError } from "@/lib/http";

export async function rateLimit(key, limit = 30, seconds = 60) {
  await connectMongoDB();
  const window = Math.floor(Date.now() / (seconds * 1000));
  const id = createHash("sha256").update(`${key}:${window}`).digest("hex");
  let result;
  try {
    result = await RateLimit.findOneAndUpdate({ _id: id }, {
      $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * seconds * 1000) },
    }, { upsert: true, new: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    result = await RateLimit.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { new: true });
  }
  if (result.count > limit) throw new HttpError(429, "Too many requests. Please wait a minute and try again.");
}
