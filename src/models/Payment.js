import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  kind: { type: String, enum: ["payment", "refund"], default: "payment" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  orderNumber: { type: String, required: true },
  cashfreeOrderId: String,
  customerName: String,
  customerEmail: String,
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, required: true, index: true },
  method: String,
  bankReference: String,
  message: String,
  paidAt: Date,
}, { timestamps: true });

PaymentSchema.index({ createdAt: -1 });
export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
