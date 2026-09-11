"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/MediaImage";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useToast } from "@/components/ToastProvider";

const BAG_STORAGE_KEY = "sajawat-bag";

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Stars({ rating }) {
  return (
    <div
      className="flex gap-0.5 text-sm text-[#2b2b28]"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((number) => (
        <span key={number}>
          {number <= Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium"
        aria-expanded={open}
      >
        {title}

        <span
          className={`text-lg font-light transition-transform duration-300 ${
            open ? "rotate-45" : "rotate-0"
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`grid transition-all duration-500 ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-5 text-sm leading-relaxed text-[#3f3e3a]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetails({ product, relatedProducts = [] }) {
  const toast = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.[1] || product.sizes?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);

  const addedTimer = useRef(null);


  const discountPercentage = product.oldPrice
    ? Math.round(
        ((product.oldPrice - product.price) / product.oldPrice) * 100
      )
    : 0;

  useEffect(() => {
    return () => {
      clearTimeout(addedTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!showSizeGuide) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowSizeGuide(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showSizeGuide]);

  const handleAddToBag = () => {
    let currentBag = [];

    try {
      const storedBag = localStorage.getItem(BAG_STORAGE_KEY);
      currentBag = storedBag ? JSON.parse(storedBag) : [];
    } catch {
      currentBag = [];
    }

    if (!Array.isArray(currentBag)) currentBag = [];
    const bagItemId = `${product.id}-${selectedSize}`;

    const existingItemIndex = currentBag.findIndex(
      (item) => item.id === bagItemId
    );

    let updatedBag;

    if (existingItemIndex >= 0) {
      updatedBag = currentBag.map((item, index) =>
        index === existingItemIndex
          ? {
              ...item,
              quantity: Math.min(10, Number(item.quantity) + quantity),
            }
          : item
      );
    } else {
      updatedBag = [
        ...currentBag,
        {
          id: bagItemId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          oldPrice: product.oldPrice,
          size: selectedSize,
          quantity,
        },
      ];
    }

    try { localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(updatedBag)); } catch { toast("Your browser could not save the bag. Please allow local storage and retry.", "error"); return; }
    toast("Added to your shopping bag.");

    window.dispatchEvent(
      new CustomEvent("bag-updated", {
        detail: updatedBag,
      })
    );

    setAddedToBag(true);

    clearTimeout(addedTimer.current);

    addedTimer.current = setTimeout(() => {
      setAddedToBag(false);
    }, 1500);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-6 pt-8 text-xs text-[#6b6a65]">
        <Link
          href="/products"
          className="transition-colors hover:text-[#2b2b28] hover:underline"
        >
          Shop All
        </Link>

        <span className="mx-2">/</span>

        <span className="text-[#2b2b28]">{product.name}</span>
      </div>

      {/* Product section */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-8 sm:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="relative mb-4 aspect-square w-full overflow-hidden bg-[#e9e6df]">
            <Image
              key={product.images[activeImage]}
              src={product.images[activeImage]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              className="animate-[fadeUp_0.5s_ease-out] object-cover"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                type="button"
                key={image}
                onClick={() => setActiveImage(index)}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden border-2 bg-[#e9e6df] transition-all duration-300 ${
                  activeImage === index
                    ? "border-[#2b2b28] opacity-100"
                    : "border-transparent opacity-65 hover:opacity-100"
                }`}
                aria-label={`View product image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product information */}
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#6b6a65]">
            {product.collection}
          </p>

          <h1 className="mb-4 text-3xl font-medium leading-tight">
            {product.name}
          </h1>

          <div className="mb-5 flex items-center gap-2">
            <Stars rating={product.rating} />

            <span className="text-xs text-[#6b6a65]">
              {product.reviewCount > 0 ? `${product.rating} (${product.reviewCount} reviews)` : "No reviews yet"}
            </span>
          </div>

          {/* Rupee prices */}
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-medium">
              {formatPrice(product.price)}
            </span>

            {product.oldPrice && (
              <span className="text-base text-[#a9a7a1] line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}

            {discountPercentage > 0 && (
              <span className="bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                Save {discountPercentage}%
              </span>
            )}
          </div>

          <p className="mb-7 text-xs text-[#6b6a65]">
            Inclusive of all taxes · SKU: {product.sku}
          </p>

          <p className="mb-8 text-sm leading-relaxed text-[#3f3e3a]">
            {product.description}
          </p>

          {/* Size selection */}
          <div className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">
                Select size:{" "}
                <span className="font-normal">{selectedSize}</span>
              </span>

              <button
                type="button"
                onClick={() => setShowSizeGuide(true)}
                className="text-xs text-[#6b6a65] underline underline-offset-4 transition-colors hover:text-[#2b2b28]"
              >
                Size Guide
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-24 border px-4 py-2.5 text-sm transition-all duration-300 ${
                    selectedSize === size
                      ? "border-[#2b2b28] bg-[#2b2b28] text-white"
                      : "border-black/20 hover:border-[#2b2b28]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-[#6b6a65]">
              {product.dimensions[selectedSize]}
            </p>
          </div>

          {/* Quantity and Add to Bag */}
          <div className="mb-4 flex gap-3">
            <div className="flex shrink-0 items-center border border-black/20">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="flex h-12 w-11 items-center justify-center text-lg transition-colors hover:bg-black/5"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span className="min-w-10 text-center text-sm">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                className="flex h-12 w-11 items-center justify-center text-lg transition-colors hover:bg-black/5"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToBag}
              className={`group relative flex-1 overflow-hidden px-4 py-3 text-sm font-medium text-white transition-all duration-300 active:scale-[0.98] ${
                addedToBag ? "bg-green-700" : "bg-[#2b2b28]"
              }`}
            >
              <span
                className={`absolute inset-0 origin-top bg-black transition-transform duration-500 ${
                  addedToBag
                    ? "scale-y-100"
                    : "scale-y-0 group-hover:scale-y-100"
                }`}
              />

              <span className="relative z-10">
                {addedToBag
                  ? "Added to Bag ✓"
                  : `Add to Bag — ${formatPrice(
                      product.price * quantity
                    )}`}
              </span>
            </button>
          </div>

          <div className="mb-8 space-y-1.5 text-xs text-[#6b6a65]">
            <p>✓ Free delivery on all orders</p>
            <p>✓ Ready to hang, no assembly required</p>
            <p>✓ Secure packaging for safe delivery</p>
            <p>✓ 30-day hassle-free returns</p>
          </div>

          {/* Accordions */}
          <div className="border-t border-black/10">
            <Accordion title="Features" defaultOpen>
              <ul className="list-inside list-disc space-y-1.5">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </Accordion>

            <Accordion title="Materials">
              <ul className="list-inside list-disc space-y-1.5">
                {product.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </Accordion>

            <Accordion title="Dimensions">
              <ul className="space-y-1.5">
                {Object.entries(product.dimensions).map(
                  ([size, dimension]) => (
                    <li key={size}>
                      <span className="font-medium">{size}:</span>{" "}
                      {dimension}
                    </li>
                  )
                )}
              </ul>
            </Accordion>

            <Accordion title="Care Instructions">
              <ul className="list-inside list-disc space-y-1.5">
                {product.care.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            </Accordion>

            <Accordion title="Shipping & Returns">
              <p>
                Orders are dispatched within 2–4 business days. Delivery is
                free across India. Products can be returned within 30 days,
                subject to our return policy.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mx-auto max-w-6xl border-t border-black/10 px-6 py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-medium">Customer Reviews</h2>

          <div className="flex items-center gap-2">
            <Stars rating={product.rating} />

            <span className="text-sm text-[#6b6a65]">
              {product.reviewCount > 0 ? `${product.rating} out of 5 (${product.reviewCount})` : "No reviews yet"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {product.reviews.map((review, index) => (
            <article
              key={index}
              className="border border-black/10 bg-white/20 p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <Stars rating={review.rating} />

              <p className="my-4 text-sm leading-relaxed text-[#3f3e3a]">
                &ldquo;{review.text}&rdquo;
              </p>

              <p className="text-xs font-medium text-[#6b6a65]">
                {review.name} · Verified Buyer
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Related products */}
      <section className="mx-auto max-w-6xl border-t border-black/10 px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-medium">You Might Also Like</h2>

          <Link
            href="/products"
            className="text-sm underline underline-offset-4"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard
              key={relatedProduct.id}
              product={relatedProduct}
            />
          ))}
        </div>
      </section>

      {/* Size guide */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-[#f8f6f1] p-7 shadow-2xl sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSizeGuide(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-[#2b2b28] hover:text-white"
              aria-label="Close size guide"
            >
              ×
            </button>

            <h3 className="mb-2 text-2xl font-medium">Size Guide</h3>

            <p className="mb-6 text-sm text-[#6b6a65]">
              Choose the right frame size for your wall and available space.
            </p>

            <table className="mb-7 w-full text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="py-3 font-medium">Size</th>
                  <th className="py-3 font-medium">Dimensions</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(product.dimensions).map(
                  ([size, dimension]) => (
                    <tr key={size} className="border-b border-black/5">
                      <td className="py-3">{size}</td>
                      <td className="py-3 text-[#6b6a65]">
                        {dimension}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            <div className="relative aspect-video w-full overflow-hidden bg-[#e9e6df]">
              <Image
                src="/images/size-guide.png"
                alt="Sajawat frame size guide"
                fill
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}