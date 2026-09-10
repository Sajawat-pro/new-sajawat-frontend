"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

const BAG_STORAGE_KEY = "sajawat-bag";

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bagItems, setBagItems] = useState([]);
  const [error, setError] = useState("");

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const subtotal = bagItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const fetchAndFillUser = async () => {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Not authenticated");
    }

    const data = await response.json();

    setForm((current) => ({
      ...current,
      name: data.user.name || "",
      email: data.user.email || "",
    }));
  };

  useEffect(() => {
    const init = async () => {
      let items = [];

      try {
        const storedBag = localStorage.getItem(BAG_STORAGE_KEY);
        items = storedBag ? JSON.parse(storedBag) : [];
      } catch {
        items = [];
      }

      if (!Array.isArray(items) || items.length === 0) {
        router.replace("/products");
        return;
      }

      setBagItems(items);

      const isLoggedIn = localStorage.getItem("userLogin") === "true";

      if (!isLoggedIn) {
        setShowLoginModal(true);
        setChecking(false);
        return;
      }

      try {
        await fetchAndFillUser();
        setChecking(false);
      } catch {
        localStorage.removeItem("userLogin");
        setShowLoginModal(true);
        setChecking(false);
      }
    };

    init();
  }, [router]);

  const completeModalLogin = async (idToken) => {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to complete login.");
    }

    await signOut(firebaseAuth);

    localStorage.setItem("userLogin", "true");

    await fetchAndFillUser();

    setShowLoginModal(false);
  };

  const handleModalEmailLogin = async (event) => {
    event.preventDefault();

    try {
      setModalLoading(true);
      setModalError("");

      await setPersistence(firebaseAuth, inMemoryPersistence);

      const result = await signInWithEmailAndPassword(
        firebaseAuth,
        modalEmail,
        modalPassword
      );

      const idToken = await result.user.getIdToken(true);

      await completeModalLogin(idToken);
    } catch (loginError) {
      console.error(loginError);

      if (
        loginError.code === "auth/invalid-credential" ||
        loginError.code === "auth/wrong-password" ||
        loginError.code === "auth/user-not-found"
      ) {
        setModalError("Incorrect email or password.");
      } else {
        setModalError(
          loginError.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalGoogleLogin = async () => {
    try {
      setModalLoading(true);
      setModalError("");

      await setPersistence(firebaseAuth, inMemoryPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken(true);

      await completeModalLogin(idToken);
    } catch (loginError) {
      console.error(loginError);

      if (loginError.code === "auth/popup-closed-by-user") {
        setModalError("Google sign-in was cancelled.");
      } else if (loginError.code === "auth/popup-blocked") {
        setModalError("Please allow pop-ups and try again.");
      } else {
        setModalError(
          loginError.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    let cleanValue = value;

    if (name === "phone") {
      cleanValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "pincode") {
      cleanValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setForm((current) => ({
      ...current,
      [name]: cleanValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (localStorage.getItem("userLogin") !== "true") {
      setShowLoginModal(true);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: form.name,
          phone: form.phone,

          shippingAddress: {
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },

          items: bagItems.map((item) => ({
            productId: item.productId || String(item.id).split("-")[0],
            size: item.size,
            quantity: item.quantity,
          })),

          paymentMethod: "cod",
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("userLogin");
        setSubmitting(false);
        setShowLoginModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to place order.");
      }

      localStorage.removeItem(BAG_STORAGE_KEY);

      window.location.assign(
        `/order-success?order=${encodeURIComponent(data.orderNumber)}`
      );
    } catch (submitError) {
      setError(
        submitError.message || "Unable to place your order. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-[#2b2b28]" />
        <p className="text-sm text-[#6b6a65]">Preparing your checkout...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-md bg-white p-8">
            <h2 className="mb-2 text-2xl font-medium">Sign in to continue</h2>
            <p className="mb-6 text-sm text-[#6b6a65]">
              Please sign in to complete your checkout.
            </p>

            {modalError && (
              <div
                role="alert"
                className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalEmailLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[#3f3e3a]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#2b2b28]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#3f3e3a]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#2b2b28]"
                />
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="flex w-full items-center justify-center bg-[#2b2b28] px-5 py-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {modalLoading ? "Signing you in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-[#8a8984]">
              <span className="h-px flex-1 bg-black/10" />
              or
              <span className="h-px flex-1 bg-black/10" />
            </div>

            <button
              type="button"
              onClick={handleModalGoogleLogin}
              disabled={modalLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 border border-black/20 bg-white px-5 py-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {modalLoading ? "Signing you in..." : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-5 w-full text-center text-xs underline text-[#6b6a65]"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
          Secure Checkout
        </p>

        <h1 className="text-3xl font-medium sm:text-4xl">
          Complete your order
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-10 lg:grid-cols-[1fr_420px]"
      >
        <div className="space-y-8">
          <section className="border border-black/10 bg-white/30 p-6 sm:p-8">
            <div className="mb-7 flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b2b28] text-xs text-white">
                1
              </span>

              <h2 className="text-xl font-medium">Contact details</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <CheckoutInput
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />

              <CheckoutInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                readOnly
              />

              <CheckoutInput
                label="Mobile number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section className="border border-black/10 bg-white/30 p-6 sm:p-8">
            <div className="mb-7 flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b2b28] text-xs text-white">
                2
              </span>

              <h2 className="text-xl font-medium">Delivery address</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <CheckoutInput
                label="Flat, house number or building"
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                autoComplete="address-line1"
                className="sm:col-span-2"
              />

              <CheckoutInput
                label="Area, landmark or street (optional)"
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
                autoComplete="address-line2"
                required={false}
                className="sm:col-span-2"
              />

              <CheckoutInput
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                autoComplete="address-level2"
              />

              <CheckoutInput
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                autoComplete="address-level1"
              />

              <CheckoutInput
                label="PIN code"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </div>
          </section>

          <section className="border border-black/10 bg-white/30 p-6 sm:p-8">
            <div className="mb-7 flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b2b28] text-xs text-white">
                3
              </span>

              <h2 className="text-xl font-medium">Payment</h2>
            </div>

            <label className="flex cursor-pointer items-center gap-4 border border-[#2b2b28] bg-[#f5f3ef] p-5">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked
                readOnly
                className="h-4 w-4 accent-[#2b2b28]"
              />

              <span className="flex-1">
                <span className="block text-sm font-medium">
                  Cash on Delivery
                </span>

                <span className="mt-1 block text-xs text-[#6b6a65]">
                  Pay safely when your order is delivered.
                </span>
              </span>

              <span className="text-xl">₹</span>
            </label>
          </section>

          {error && (
            <div
              role="alert"
              className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <aside className="h-fit border border-black/10 bg-[#ebe7df] p-6 lg:sticky lg:top-32">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-medium">Order summary</h2>

            <Link href="/products" className="text-xs underline underline-offset-4">
              Continue shopping
            </Link>
          </div>

          <div className="max-h-[380px] space-y-5 overflow-y-auto pr-1">
            {bagItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-white">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />

                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2b2b28] px-1 text-[10px] text-white">
                    {item.quantity}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{item.name}</p>

                  <p className="mt-1 text-xs text-[#6b6a65]">Size: {item.size}</p>

                  <p className="mt-2 text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 space-y-3 border-t border-black/10 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b6a65]">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#6b6a65]">Delivery</span>
              <span className="font-medium text-green-700">Free</span>
            </div>

            <div className="flex justify-between border-t border-black/10 pt-4 text-lg font-medium">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center bg-[#2b2b28] px-6 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Placing your order...
              </>
            ) : (
              `Place Order · ${formatPrice(subtotal)}`
            )}
          </button>

          <div className="mt-5 space-y-2 text-center text-[11px] text-[#6b6a65]">
            <p>🔒 Secure authenticated checkout</p>
            <p>Free delivery · Carefully packed</p>
          </div>
        </aside>
      </form>
    </main>
  );
}

function CheckoutInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = true,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-medium text-[#3f3e3a]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#a9a7a1] focus:border-[#2b2b28] read-only:cursor-not-allowed read-only:bg-black/[0.03]"
        {...props}
      />
    </div>
  );
}