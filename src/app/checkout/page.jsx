"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "@/components/MediaImage";
import StoreOffers from "@/components/StoreOffers";
import { clientApi } from "@/lib/clientApi";
import { useToast } from "@/components/ToastProvider";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
const bagKey = "sajawat-bag";

function sanitizeBagItems(stored) {
  const valid = [];
  const invalidNames = [];
  stored.forEach(item => {
    const size = item.size;
    if (!size || typeof size !== "string" || !size.trim()) {
      invalidNames.push(item.name || item.productId || item.id || "An item");
      return;
    }
    valid.push({ productId: item.productId || String(item.id).split("-")[0], size, quantity: Number(item.quantity) || 1 });
  });
  return { valid, invalidNames };
}

export default function CheckoutPage() {
  const router = useRouter(), toast = useToast(), submittingRef = useRef(false);
  const [checking, setChecking] = useState(true), [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null), [bag, setBag] = useState([]), [quote, setQuote] = useState(null);
  const [error, setError] = useState(""), [quoteLoading, setQuoteLoading] = useState(false), [offerCode, setOfferCode] = useState("");
  const [paymentOption, setPaymentOption] = useState("advance_99");
  const [form, setForm] = useState({ name: "", email: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" });
  const quoteRequest = useRef(0);
  const loadQuote = useCallback(async (items, code = "") => {
    const sequence = ++quoteRequest.current;
    setQuoteLoading(true);
    try {
      const result = await clientApi("/api/checkout/quote", { method: "POST", body: JSON.stringify({ items, offerCode: code }) });
      if (sequence !== quoteRequest.current) return;
      setQuote(result); setError(""); if (code) toast("Offer applied successfully.");
    } catch (error) {
      if (sequence !== quoteRequest.current) return;
      setError(error.message); toast(error.message, "error");
    } finally { if (sequence === quoteRequest.current) setQuoteLoading(false); }
  }, [toast]);
  useEffect(() => {
    let active = true;
    async function initialise() {
      try {
       const stored = JSON.parse(localStorage.getItem(bagKey) || "[]");
if (!Array.isArray(stored) || !stored.length) { router.replace("/products"); return; }
const { valid: items, invalidNames } = sanitizeBagItems(stored);
if (!items.length) {
  localStorage.removeItem(bagKey);
  router.replace("/products");
  return;
}
if (invalidNames.length) {
  localStorage.setItem(bagKey, JSON.stringify(stored.filter(item => item.size && typeof item.size === "string" && item.size.trim())));
  toast(invalidNames.join(", ") + " had no size selected and was removed from your bag.", "error");
}
if (!active) return;
setBag(items);
await loadQuote(items);
        try {
          const result = await clientApi("/api/auth/me");
          if (!active) return;
          setUser(result.user);
          setForm(current => ({ ...current, name: result.user.name || "", email: result.user.email || "" }));
        } catch (error) { if (error.status !== 401) throw error; }
      } catch (error) { if (active) setError(error.message || "Unable to prepare checkout. Please update your bag."); }
      finally { if (active) setChecking(false); }
    }
    initialise();
    return () => { active = false; };
  }, [router, loadQuote]);
  useEffect(() => {
    function syncBag() {
      if (submittingRef.current) return;
      try {
const stored = JSON.parse(localStorage.getItem(bagKey) || "[]");
if (!Array.isArray(stored) || !stored.length) { router.replace("/products"); return; }
const { valid: items, invalidNames } = sanitizeBagItems(stored);
if (!items.length) {
  localStorage.removeItem(bagKey);
  router.replace("/products");
  return;
}
if (invalidNames.length) {
  localStorage.setItem(bagKey, JSON.stringify(stored.filter(item => item.size && typeof item.size === "string" && item.size.trim())));
  toast(invalidNames.join(", ") + " had no size selected and was removed from your bag.", "error");
}
setBag(items); loadQuote(items, quote?.offerCode || "");
      } catch { setError("Your bag could not be read. Please reload checkout."); }
    }
    const storage = event => { if (event.key === bagKey) syncBag(); };
    window.addEventListener("bag-state-changed", syncBag); window.addEventListener("storage", storage);
    return () => { window.removeEventListener("bag-state-changed", syncBag); window.removeEventListener("storage", storage); };
  }, [loadQuote, quote?.offerCode, router]);
  const total = quote?.total || 0;
  const advance = Math.min(99, total), payable = paymentOption === "advance_99" ? advance : total;
  const balance = Math.max(0, total - payable);
  function change(event) {
    const { name } = event.target;
    let value = event.target.value;
    if (name === "phone" || name === "pincode") value = value.replace(/\D/g, "").slice(0, name === "phone" ? 10 : 6);
    setForm(current => ({ ...current, [name]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    if (submittingRef.current || !quote || quoteLoading) return;
    if (!user) { router.push("/login?next=/checkout"); return; }
    submittingRef.current = true; setSubmitting(true); setError("");
    try {
      const payload = { name: form.name, phone: form.phone, shippingAddress: { addressLine1: form.addressLine1, addressLine2: form.addressLine2, city: form.city, state: form.state, pincode: form.pincode }, items: bag, paymentOption, offerCode: quote.offerCode, quotedTotal: quote.total };
      const fingerprint = JSON.stringify(payload);
      let saved;
      try { saved = JSON.parse(sessionStorage.getItem("sajawat-checkout") || "null"); } catch {}
      const checkoutKey = saved?.fingerprint === fingerprint ? saved.key : crypto.randomUUID();
      sessionStorage.setItem("sajawat-checkout", JSON.stringify({ key: checkoutKey, fingerprint }));
      const data = await clientApi("/api/payments/create", { method: "POST", body: JSON.stringify({ ...payload, checkoutKey }) });
      sessionStorage.setItem("sajawat-pending-payment", data.cashfreeOrderId);
      if (data.confirmed) { router.push("/payment-return?cf_order_id=" + encodeURIComponent(data.cashfreeOrderId)); return; }
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({ mode: data.cashfreeMode });
      if (!cashfree) throw new Error("Payment checkout could not load. Check your connection and try again.");
      const result = await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      if (result?.error) throw new Error(result.error.message || "Payment checkout could not open.");
      if (result?.paymentDetails) router.push("/payment-return?cf_order_id=" + encodeURIComponent(data.cashfreeOrderId));
    } catch (error) {
      if (error.status === 401) setUser(null);
      if (error.status === 409) { sessionStorage.removeItem("sajawat-checkout"); await loadQuote(bag, quote.offerCode); }
      const message = error.name === "TimeoutError" ? "The payment service took too long. Retry to resume the same checkout." : error.message;
      setError(message); toast(message, "error");
    } finally { submittingRef.current = false; setSubmitting(false); }
  }
  if (checking) return <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4" role="status"><span className="spinner" /><p className="text-sm text-[#78846e]">Preparing your secure checkout…</p></div>;
  return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><p className="mb-3 text-xs uppercase tracking-[.25em] text-[#819172]">One step closer to a beautiful home</p><h1 className="mb-9 text-3xl font-medium">Checkout</h1>
    {!checking && !user && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-5">
    <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-xl">
      <h2 className="mb-2 text-lg font-medium">Sign in to continue</h2>
      <p className="mb-6 text-sm text-[#6e7c62]">Please sign in to your account to securely place this order.</p>
      <Link href="/login?next=/checkout" className="mb-3 block w-full rounded-lg bg-[#314b38] px-6 py-3 text-sm text-white transition hover:bg-[#223728]">Sign in</Link>
      <Link href="/products" className="block w-full text-xs underline text-[#6e7c62]">Continue shopping instead</Link>
    </div>
  </div>
)}
    {error && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} {!quote && <button type="button" className="ml-3 underline" onClick={() => window.location.reload()}>Reload</button>}</div>}
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]"><fieldset disabled={submitting} className="space-y-8">
      <section className="checkout-section"><h2><span>1</span>Contact details</h2><div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" name="name" form={form} change={change} autoComplete="name" minLength={2} /><Field label="Email" name="email" form={form} change={change} type="email" autoComplete="email" readOnly /><Field label="Mobile number" name="phone" form={form} change={change} type="tel" autoComplete="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit Indian mobile number" /></div></section>
      <section className="checkout-section"><h2><span>2</span>Delivery address</h2><div className="grid gap-5 sm:grid-cols-2"><Field label="Flat, house number or building" name="addressLine1" form={form} change={change} autoComplete="address-line1" wide /><Field label="Area, street or landmark (optional)" name="addressLine2" form={form} change={change} autoComplete="address-line2" required={false} wide /><Field label="City" name="city" form={form} change={change} autoComplete="address-level2" /><Field label="State" name="state" form={form} change={change} autoComplete="address-level1" /><Field label="PIN code" name="pincode" form={form} change={change} autoComplete="postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} /></div></section>
      <section className="checkout-section"><h2><span>3</span>Payment</h2>{[["advance_99", "Pay " + money(advance) + " now", total > advance ? "Pay the remaining " + money(total - advance) + " on delivery." : "Your full order amount will be paid."], ["pay_now", "Pay full amount now", "Pay " + money(total) + " securely with Cashfree."]].map(([value, title, description]) => <label key={value} className={"payment-choice " + (paymentOption === value ? "selected" : "")}><input type="radio" name="paymentOption" value={value} checked={paymentOption === value} onChange={() => setPaymentOption(value)} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</section>
    </fieldset><aside className="h-fit rounded-2xl border border-[#e0e5d8] bg-[#edf0e6] p-6 lg:sticky lg:top-28"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl">Order summary</h2><Link href="/products" className="text-xs underline">Keep shopping</Link></div><div className="max-h-80 space-y-5 overflow-y-auto">{quote?.items.map((item, index) => <div className="flex gap-4" key={index}><div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" /></div><div><p className="text-sm font-medium">{item.name}</p><p className="my-2 text-xs text-[#829071]">{item.size} · Qty {item.quantity}</p><p className="text-sm">{money(item.total)}</p></div></div>)}</div>
      <StoreOffers onApply={code => { if (submitting) return; setOfferCode(code); loadQuote(bag, code); }} /><div className="my-5 flex gap-2"><input aria-label="Offer code" disabled={submitting} value={offerCode} onChange={event => setOfferCode(event.target.value.toUpperCase())} maxLength={30} placeholder="Have an offer code?" className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs" /><button type="button" disabled={quoteLoading || submitting} onClick={() => loadQuote(bag, offerCode)} className="rounded-lg border border-[#9bab8a] px-4 py-2 text-xs">{quoteLoading ? "Applying…" : "Apply"}</button></div>
      {quote?.offerCode && <p className="mb-4 text-xs text-[#54713e]">{quote.offerCode} applied <button type="button" className="ml-2 underline" disabled={quoteLoading || submitting} onClick={() => { setOfferCode(""); loadQuote(bag); }}>Remove</button></p>}
      <dl className="space-y-3 border-t border-black/10 pt-5 text-sm">{[["Subtotal", money(quote?.subtotal)], ["Discount", "−" + money(quote?.discount)], ["Delivery", "Free"], ["Total", money(total)], ["Payable now", money(payable)], ...(balance > 0 ? [["Balance on delivery", money(balance)]] : [])].map(([key, value]) => <div key={key} className="flex justify-between gap-4"><dt>{key}</dt><dd className="font-medium">{value}</dd></div>)}</dl><button type={user ? "submit" : "button"} onClick={user ? undefined : () => router.push("/login?next=/checkout")} disabled={submitting || quoteLoading || !quote || total <= 0} className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg bg-[#314b38] px-6 py-4 text-sm text-white transition hover:bg-[#223728] disabled:opacity-50">{submitting ? <><span className="spinner" /> Opening secure payment…</> : (user ? "Continue to pay · " + money(payable) : "Sign in to continue")}</button><p className="mt-4 text-center text-[11px] text-[#839173]">Secure payments powered by Cashfree.<br />Your order is confirmed after payment verification.</p></aside></form></div>;
}
function Field({ label, name, form, change, wide, required = true, ...props }) { return <label className={"flex flex-col gap-2 text-xs text-[#6e7c62] " + (wide ? "sm:col-span-2" : "")}>{label}<input name={name} value={form[name]} onChange={change} required={required} maxLength={150} {...props} className="w-full rounded-lg border border-[#dce2d5] bg-white px-4 py-3 text-sm text-[#2e4225] outline-none transition focus:border-[#76915f] focus:ring-2 focus:ring-[#dfe9d4] read-only:bg-black/5" /></label>; }
