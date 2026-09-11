import nextEnv from "@next/env";
import mongoose from "mongoose";
import Offer from "../src/models/Offer.js";
nextEnv.loadEnvConfig(process.cwd());
const offers = [
  { code: "WELCOME10", title: "A warm welcome", description: "10% off your next beautiful find.", type: "percentage", value: 10, minOrder: 299, maxDiscount: 150 },
  { code: "HOME150", title: "Make room for more", description: "Save ₹150 when you spend ₹1,499.", type: "fixed", value: 150, minOrder: 1499, maxDiscount: 0 },
  { code: "WEEKEND15", title: "A little weekend refresh", description: "15% off a refresh for your favourite space.", type: "percentage", value: 15, minOrder: 499, maxDiscount: 250 },
];
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const result = await Offer.bulkWrite(offers.map(offer => ({ updateOne: { filter: { code: offer.code }, update: { $setOnInsert: { ...offer, active: false } }, upsert: true } })));
  console.log(`${result.upsertedCount} draft offers added. Activate them in Admin → Offers after reviewing the amounts.`);
} finally { await mongoose.disconnect(); }
