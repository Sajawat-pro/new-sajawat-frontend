import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const OrderSchema = new mongoose.Schema(
  {
    checkoutKey: { type: String, unique: true, sparse: true },
    checkoutFingerprint: String,
    cashfreeIdempotencyKey: String,
    discount: { type: Number, default: 0, min: 0 },
    amountRefunded: { type: Number, default: 0, min: 0 },
    deliveryPayment: { amount: Number, reference: String, actor: String, collectedAt: Date },
    offerCode: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    courier: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    statusHistory: { type: [{ status: String, note: String, actor: String, at: { type: Date, default: Date.now } }], default: [] },
    lastPaymentSyncAt: Date,
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    firebaseUid: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    shippingAddress: {
      addressLine1: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine2: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    items: {
      type: [OrderItemSchema],
      required: true,

      validate: {
        validator(items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "An order must contain at least one item.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Keep COD for compatibility with any older orders.
     * New online orders use cashfree.
     */
    paymentMethod: {
      type: String,
      enum: ["cashfree", "cod"],
      default: "cod",
      required: true,
    },

    /*
     * advance_99:
     * Pay ₹99 now and remaining amount on delivery.
     *
     * pay_now:
     * Pay the complete amount online.
     *
     * cod:
     * Retained for compatibility with older COD orders.
     */
    paymentOption: {
      type: String,
      enum: ["advance_99", "pay_now", "cod"],
      default: "cod",
      required: true,
    },

    /*
     * Amount Cashfree must collect for the current order.
     */
    amountDueNow: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Successfully verified amount received online.
     */
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Current unpaid amount.
     *
     * Before payment verification: complete order total.
     * After verification: total minus amountPaid.
     */
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Expected remaining COD balance after a successful
     * ₹99 confirmation payment.
     */
    expectedBalanceAfterPayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,

      enum: [
        "pending",
        "awaiting_payment",
        "partially_paid",
        "paid",
        "failed",
        "refunded",
      ],

      default: "pending",
      index: true,
    },

    orderStatus: {
      type: String,

      enum: [
        "payment_pending",
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],

      default: "placed",
      index: true,
    },

    /*
     * Cashfree-specific information.
     */
    cashfreeOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },

    cashfreePaymentSessionId: {
      type: String,
      default: "",
      trim: true,
    },

    cashfreeOrderStatus: {
      type: String,
      enum: [
        "ACTIVE",
        "PAID",
        "EXPIRED",
        "TERMINATED",
        "TERMINATION_REQUESTED",
      ],
      default: "ACTIVE",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);
