"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (localStorage.getItem("userLogin") !== "true") {
        router.replace("/login?next=/profile");
        return;
      }

      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });

        if (!meResponse.ok) {
          localStorage.removeItem("userLogin");
          router.replace("/login?next=/profile");
          return;
        }

        const meData = await meResponse.json();
        setUser(meData.user);

        const ordersResponse = await fetch("/api/orders", {
          cache: "no-store",
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }
      } catch {
        setError("Unable to load your profile right now.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-[#2b2b28]" />
        <p className="text-sm text-[#6b6a65]">Loading your profile...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2b2b28] text-lg font-medium text-white">
          {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
        </div>

        <div>
          <h1 className="text-2xl font-medium">
            {user?.name || "Your Account"}
          </h1>
          <p className="text-sm text-[#6b6a65]">{user?.email}</p>
        </div>
      </div>

      <h2 className="mb-5 text-lg font-medium">Your Orders</h2>

      {error && (
        <div
          role="alert"
          className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="border border-black/10 bg-white/30 p-10 text-center">
          <p className="mb-5 text-sm text-[#6b6a65]">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#2b2b28] px-6 py-3 text-sm font-medium text-white hover:bg-black"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="border border-black/10 bg-white/30 p-5 sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-[#6b6a65]">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <span className="rounded-full border border-black/15 px-3 py-1 text-xs capitalize">
                  {order.orderStatus || "placed"}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                {order.items?.map((item, i) => (
                  <p key={i} className="text-[#6b6a65]">
                    {item.quantity} × {item.name}
                    {item.size ? ` (${item.size})` : ""}
                  </p>
                ))}
              </div>

              <p className="mt-3 text-sm font-medium">
                Total: {formatPrice(order.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}