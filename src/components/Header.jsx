"use client";

import Image from "@/components/MediaImage";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const BAG_STORAGE_KEY = "sajawat-bag";

const announcementMessages = [
  "Free Delivery | No Shipping Cost",
  "Thoughtful details for beautiful homes",
  "Beautiful Décor, Made for Every Home",
  "Secure Payments | Carefully Packed",
];

function getStoredBag() {
  try {
    const storedBag = localStorage.getItem(BAG_STORAGE_KEY);
    const parsed = storedBag ? JSON.parse(storedBag) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && Number.isFinite(Number(item.quantity))) : [];
  } catch {
    return [];
  }
}

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Header() {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [bagItems, setBagItems] = useState([]);
  const [bagAnimating, setBagAnimating] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  const bagAnimationTimer = useRef(null);

  const bagCount = bagItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const bagSubtotal = bagItems.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  useEffect(() => {
    queueMicrotask(() => setBagItems(getStoredBag()));
    const controller = new AbortController();
    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }).then(response => setLoggedIn(response.ok)).catch(() => {});
    const syncBag = () => setBagItems(getStoredBag());
    window.addEventListener("bag-state-changed", syncBag);

    const handleBagUpdated = (event) => {
      const updatedBag = event.detail || getStoredBag();

      setBagItems(updatedBag);
      setBagOpen(true);
      setBagAnimating(true);

      clearTimeout(bagAnimationTimer.current);

      bagAnimationTimer.current = setTimeout(() => {
        setBagAnimating(false);
      }, 600);
    };

    const handleStorageUpdate = (event) => {
      if (event.key === BAG_STORAGE_KEY) {
        setBagItems(getStoredBag());
      }

      if (event.key === "userLogin") {
        setLoggedIn(event.newValue === "true");
      }
    };

    window.addEventListener("bag-updated", handleBagUpdated);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      controller.abort();
      window.removeEventListener("bag-state-changed", syncBag);
      clearTimeout(bagAnimationTimer.current);
      window.removeEventListener("bag-updated", handleBagUpdated);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    const announcementTimer = setInterval(() => {
      setAnnouncementIndex(
        (currentIndex) =>
          (currentIndex + 1) % announcementMessages.length
      );
    }, 6000);

    return () => clearInterval(announcementTimer);
  }, []);

  useEffect(() => {
    if (!bagOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setBagOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [bagOpen]);

  const updateBag = (updatedBag) => {
    setBagItems(updatedBag);
    try { localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(updatedBag)); } catch { toast("Unable to save your bag. Please enable browser storage.", "error"); return; }

    window.dispatchEvent(
      new CustomEvent("bag-state-changed", {
        detail: updatedBag,
      })
    );
  };

  const changeQuantity = (itemId, change) => {
    const updatedBag = bagItems
      .map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.min(10, Math.max(0, Number(item.quantity) + change)),
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    updateBag(updatedBag);
  };

  const removeItem = (itemId) => {
    updateBag(bagItems.filter((item) => item.id !== itemId));
  };

  const toggleMenu = () => {
    setMenuOpen((current) => !current);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#f5f3ef]">

        {/* Announcement */}
        <div className="flex min-h-9 items-center justify-center overflow-hidden bg-[#2b2b28] px-4 py-2 text-center text-xs text-[#f5f3ef] sm:text-sm">
          <span
            key={announcementIndex}
            className="announcement-text"
            aria-live="polite"
          >
            {announcementMessages[announcementIndex]}
          </span>
        </div>

        {/* Main navbar */}
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between border-b border-black/10 px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            className="fade-up text-sm sm:hidden"
            style={{ animationDelay: "0.15s" }}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

          <Link
            href="/"
            className="fade-up text-xl font-semibold tracking-[0.22em] sm:text-2xl"
            style={{ animationDelay: "0.2s" }}
          >
            SAJAWAT
          </Link>

          <nav className="hidden items-center gap-7 text-sm sm:flex">
            <Link
              href="/products"
              className="fade-up relative py-2 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              style={{ animationDelay: "0.25s" }}
            >
              Shop All
            </Link>

            <Link
              href="/products?collection=3D%20Plant%20Frames"
              className="fade-up relative py-2 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              style={{ animationDelay: "0.3s" }}
            >
              3D Plant Frames
            </Link>

            <Link
              href="/products"
              className="fade-up relative py-2 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              style={{ animationDelay: "0.35s" }}
            >
              Wooden Frames
            </Link>

            <Link
              href="/products"
              className="fade-up relative py-2 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              style={{ animationDelay: "0.4s" }}
            >
              LED Frames
            </Link>
          </nav>

          <div
            className="fade-up flex items-center gap-3 sm:gap-5"
            style={{ animationDelay: "0.45s" }}
          >
            {loggedIn ? (
              <Link
                href="/profile"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/15 transition-colors hover:bg-[#2b2b28] hover:text-white sm:flex"
                aria-label="View profile"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4.5 19.5c1.6-3.2 4.4-4.8 7.5-4.8s5.9 1.6 7.5 4.8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden text-sm transition-opacity hover:opacity-60 sm:block"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className={`relative flex items-center gap-2 rounded-full border border-black/15 px-3 py-2 text-sm transition-all duration-300 hover:border-black hover:bg-[#2b2b28] hover:text-white ${
                bagAnimating ? "bag-bounce" : ""
              }`}
              aria-label={`Open shopping bag with ${bagCount} items`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 8h12l1 13H5L6 8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9V6a3 3 0 0 1 6 0v3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              <span className="hidden sm:inline">Bag</span>

              <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#2b2b28] px-1 text-[10px] text-white transition-colors group-hover:bg-white group-hover:text-black">
                {bagCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`grid overflow-hidden border-b border-black/10 bg-[#f5f3ef] transition-all duration-500 sm:hidden ${
            menuOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <nav className="min-h-0">
            <div className="flex flex-col gap-1 px-6 py-5 text-sm">
              <Link
                href="/products"
                onClick={closeMenu}
                className="border-b border-black/5 py-3"
              >
                Shop All
              </Link>

              <Link
                href="/products?collection=3D%20Plant%20Frames"
                onClick={closeMenu}
                className="border-b border-black/5 py-3"
              >
                3D Plant Frames
              </Link>

              <Link
                href="/products"
                onClick={closeMenu}
                className="border-b border-black/5 py-3"
              >
                Wooden Frames
              </Link>

              <Link
                href="/products"
                onClick={closeMenu}
                className="border-b border-black/5 py-3"
              >
                LED Frames
              </Link>

              {loggedIn ? (
                <Link href="/profile" onClick={closeMenu} className="py-3">
                  My Profile
                </Link>
              ) : (
                <Link href="/login" onClick={closeMenu} className="py-3">
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Bag backdrop */}
      <button
        type="button"
        aria-label="Close shopping bag"
        onClick={() => setBagOpen(false)}
        className={`fixed inset-0 z-[998] bg-black/50 backdrop-blur-[2px] transition-opacity duration-500 ${
          bagOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Bag drawer */}
      <aside
        className={`fixed right-0 top-0 z-[999] flex h-dvh w-full max-w-md flex-col bg-[#f8f6f1] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          bagOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!bagOpen}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div>
            <p className="text-lg font-medium">Your Bag</p>
            <p className="mt-0.5 text-xs text-[#6b6a65]">
              {bagCount} {bagCount === 1 ? "item" : "items"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setBagOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-[#2b2b28] hover:text-white"
            aria-label="Close bag"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {bagItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#ebe7df]">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 8h12l1 13H5L6 8Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9V6a3 3 0 0 1 6 0v3"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-xl font-medium">
              Your bag is empty
            </h2>

            <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#6b6a65]">
              Discover handcrafted décor designed to make your walls feel
              complete.
            </p>

            <Link
              href="/products"
              onClick={() => setBagOpen(false)}
              className="bg-[#2b2b28] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Explore Frames
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {bagItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-black/10 pb-6"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={() => setBagOpen(false)}
                    className="relative h-28 w-24 shrink-0 overflow-hidden bg-[#e9e6df]"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setBagOpen(false)}
                      className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-1 text-xs text-[#6b6a65]">
                      Size: {item.size}
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {formatPrice(item.price)}
                    </p>

                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex items-center border border-black/15">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-black/5"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span className="min-w-8 text-center text-xs">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-black/5"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-[#6b6a65] underline underline-offset-4 transition-colors hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-black/10 bg-[#f8f6f1] px-6 py-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm">Subtotal</span>

                <span className="text-lg font-medium">
                  {formatPrice(bagSubtotal)}
                </span>
              </div>

              <p className="mb-5 text-xs text-[#6b6a65]">
                Free delivery. Taxes are calculated at checkout.
              </p>

              <Link
                href="/checkout"
                onClick={() => setBagOpen(false)}
                className="flex w-full items-center justify-center bg-[#2b2b28] px-6 py-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-black"
              >
                Proceed to Checkout
              </Link>

              <button
                type="button"
                onClick={() => setBagOpen(false)}
                className="mt-3 w-full py-2 text-xs underline underline-offset-4"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}