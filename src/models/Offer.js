import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 300 },
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0.01 },
  minOrder: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: 0, min: 0 },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  active: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
