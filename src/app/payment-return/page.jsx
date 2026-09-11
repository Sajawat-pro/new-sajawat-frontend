"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clientApi } from "@/lib/clientApi";
import { useToast } from "@/components/ToastProvider";
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
function PaymentReturn() {
  const params = useSearchParams(), orderId = params.get("cf_order_id");
  const [state, setState] = useState({ status: "checking" }), [retry, setRetry] = useState(0);
  const toast = useToast();
  useEffect(() => {
    const controller = new AbortController(); let timer, attempts = 0;
    async function verify() {
      try {
        if (!orderId) throw new Error("The payment order ID is missing. Open your order from your account.");
        const data = await clientApi("/api/payments/verify?cf_order_id=" + encodeURIComponent(orderId), { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (data.confirmed) {
          // Remove only the purchased quantities, and only once per verified order.
          try {
            const marker = "sajawat-cleared:" + orderId;
            if (!localStorage.getItem(marker)) {
              const bag = JSON.parse(localStorage.getItem("sajawat-bag") || "[]");
              const remaining = Array.isArray(bag) ? bag.map(item => ({ ...item })) : [];
              for (const purchased of data.items || []) {
                let quantity = purchased.quantity;
                for (const item of remaining) {
                  if ((item.productId || String(item.id).split("-")[0]) === purchased.productId && item.size === purchased.size) {
                    const remove = Math.min(Number(item.quantity), quantity); item.quantity -= remove; quantity -= remove;
                  }
                }
              }
              localStorage.setItem("sajawat-bag", JSON.stringify(remaining.filter(item => item.quantity > 0)));
              localStorage.setItem(marker, "true");
              window.dispatchEvent(new Event("bag-state-changed"));
            }
            sessionStorage.removeItem("sajawat-checkout");
            sessionStorage.removeItem("sajawat-pending-payment");
          } catch { /* A storage restriction must never hide a verified payment. */ }
          setState({ status: data.orderStatus === "cancelled" ? "cancelled" : "confirmed", data }); toast("Payment verified successfully."); return;
        }
        if (data.paymentStatus === "failed" || data.paymentStatus === "refunded") { setState({ status: data.paymentStatus, data }); return; }
        attempts += 1;
        setState({ status: "pending", data });
        if (attempts < 6) timer = setTimeout(verify, Math.min(10000, 2000 + attempts * 1500));
      } catch (error) {
        if (error.name !== "AbortError") setState({ status: error.status === 401 ? "login" : "error", error: error.message });
      }
    }
    verify();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [orderId, retry, toast]);
  const confirmed = state.status === "confirmed";
  const checking = state.status === "checking" || state.status === "pending";
  const titles = { checking: "Confirming your payment", pending: "Waiting for payment confirmation", confirmed: "Your order is confirmed", cancelled: "Payment received for a cancelled order", refunded: "Your payment was refunded", failed: "Payment was not completed", login: "Sign in to view your payment", error: "We couldn’t verify your payment yet" };
  return <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center"><div className="mb-7 grid h-20 w-20 place-items-center rounded-full bg-[#e6eede] text-3xl text-[#4f713a]">{checking ? <span className="spinner" /> : confirmed ? "✓" : "!"}</div><p className="mb-3 text-xs uppercase tracking-[.25em] text-[#8c9e7b]">Secure payment</p><h1 className="mb-5 text-3xl">{titles[state.status]}</h1><p role="status" className="mb-6 text-sm leading-relaxed text-[#7b896f]">{state.error || (confirmed ? money(state.data.amountPaid) + " received. " + (state.data.balanceDue > 0 ? "Pay the remaining " + money(state.data.balanceDue) + " on delivery." : "Your order is fully paid.") : state.status === "cancelled" ? "Please contact support to resolve the payment. This order will not be dispatched." : checking ? "We’re checking securely with Cashfree. If you were charged, please wait for confirmation before starting another payment." : "Your shopping bag is preserved. You can check the status again or view your account.")}</p>{state.data && <p className="mb-7 text-sm">Order <strong>{state.data.orderNumber}</strong></p>}<div className="flex flex-wrap justify-center gap-3">{state.status === "login" ? <Link className="rounded-lg bg-[#314b38] px-6 py-3 text-sm text-white" href={"/login?next=" + encodeURIComponent("/payment-return?cf_order_id=" + (orderId || ""))}>Sign in</Link> : !confirmed && <button onClick={() => { setState({ status: "checking" }); setRetry(value => value + 1); }} disabled={state.status === "checking"} className="rounded-lg bg-[#314b38] px-6 py-3 text-sm text-white disabled:opacity-50">Check again</button>}<Link className="rounded-lg border border-black/15 px-6 py-3 text-sm" href="/profile">View my orders</Link>{confirmed && <Link className="rounded-lg border border-black/15 px-6 py-3 text-sm" href="/products">Continue shopping</Link>}</div></div>;
}
export default function Page() { return <Suspense fallback={<div className="p-24 text-center" role="status">Loading payment…</div>}><PaymentReturn /></Suspense>; }
