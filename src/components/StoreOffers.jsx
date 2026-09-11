"use client";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/clientApi";
import { useToast } from "@/components/ToastProvider";
export default function StoreOffers({ onApply }) {
  const [offers, setOffers] = useState([]);
  const toast = useToast();
  useEffect(() => { const controller = new AbortController(); clientApi("/api/offers", { signal: controller.signal }).then(data => setOffers(data.offers)).catch(() => {}); return () => controller.abort(); }, []);
  if (!offers.length) return null;
  return <div className="store-offers"><p className="text-xs uppercase tracking-widest text-[#718168]">A little extra, just for you</p>{offers.map(offer => <button key={offer._id} type="button" className="store-offer" onClick={async () => { if (onApply) onApply(offer.code); else try { await navigator.clipboard.writeText(offer.code); toast("Offer code copied. Apply it at checkout."); } catch { toast("Use code " + offer.code + " at checkout."); } }}><span><strong>{offer.title}</strong><small>{offer.description || (offer.type === "percentage" ? offer.value + "% off" : "₹" + offer.value + " off")}{offer.minOrder > 0 ? " · Minimum ₹" + offer.minOrder : ""}</small></span><code>{offer.code}</code></button>)}</div>;
}
