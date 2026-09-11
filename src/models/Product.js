import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true, maxlength: 180 },
  collection: { type: String, default: "" },
  price: { type: Number, required: true, min: 1 },
  oldPrice: { type: Number, default: 0, min: 0 },
  color: { type: String, default: "" },
  plantType: { type: String, default: "" },
  sku: { type: String, default: "" },
  description: { type: String, default: "" },
  features: [String], materials: [String], care: [String], sizes: [String], images: [String],
  dimensions: { type: Map, of: String, default: {} },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  reviews: { type: [{ name: String, rating: Number, text: String }], default: [] },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true, suppressReservedKeysWarning: true });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
