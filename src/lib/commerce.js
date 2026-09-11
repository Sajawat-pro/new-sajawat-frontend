// Money is compared and calculated in paise to avoid floating-point drift.
export const paise = value => Math.round(Number(value) * 100);
export const rupees = value => Math.round(value) / 100;

export function calculateDiscount(offer, subtotal, now = new Date()) {
  if (!offer || !offer.active || (offer.startsAt && new Date(offer.startsAt) > now) ||
      (offer.endsAt && new Date(offer.endsAt) <= now) || paise(subtotal) < paise(offer.minOrder || 0)) return 0;
  let discount = offer.type === "percentage" ? Math.round(paise(subtotal) * offer.value / 100) : paise(offer.value);
  if (offer.maxDiscount > 0) discount = Math.min(discount, paise(offer.maxDiscount));
  return rupees(Math.max(0, Math.min(discount, paise(subtotal) - 100)));
}

export const orderTransitions = {
  payment_pending: [], placed: ["confirmed", "cancelled"], confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [],
};

export function paymentDecision(order, remote) {
  if (remote.order_id !== order.cashfreeOrderId || remote.order_currency !== "INR" ||
      !Number.isFinite(Number(remote.order_amount)) || paise(remote.order_amount) !== paise(order.amountDueNow)) {
    throw new Error("Payment amount, currency or order identity did not match.");
  }
  if (["paid", "partially_paid", "refunded"].includes(order.paymentStatus)) return null;
  if (remote.order_status === "PAID") {
    const balanceDue = rupees(Math.max(0, paise(order.total) - paise(order.amountDueNow)));
    return { amountPaid: order.amountDueNow, balanceDue, expectedBalanceAfterPayment: balanceDue,
      paymentStatus: balanceDue > 0 ? "partially_paid" : "paid", cashfreeOrderStatus: "PAID" };
  }
  if (["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"].includes(remote.order_status)) {
    return { paymentStatus: "failed", cashfreeOrderStatus: remote.order_status };
  }
  return { cashfreeOrderStatus: "ACTIVE" };
}
