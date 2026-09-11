import nextEnv from "@next/env";
import mongoose from "mongoose";
import { products } from "../src/data/products.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import Payment from "../src/models/Payment.js";
import Offer from "../src/models/Offer.js";
import RateLimit from "../src/models/RateLimit.js";
nextEnv.loadEnvConfig(process.cwd());
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([Product, Order, Payment, Offer, RateLimit].map(model => model.createIndexes()));
  const result = await Product.bulkWrite(products.map(product => ({ updateOne: { filter: { id: product.id }, update: { $setOnInsert: { ...product, reviews: [], rating: 0, reviewCount: 0, active: true } }, upsert: true } })));
  console.log(`Catalogue ready: ${result.upsertedCount} imported, existing records preserved. Required indexes created.`);
} catch (error) { console.error("Catalogue setup failed:", error.name, error.code || "connection unavailable"); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
