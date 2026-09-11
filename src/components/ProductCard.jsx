"use client";

import Image from "@/components/MediaImage";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProductCard({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images = product.images || [];

  useEffect(() => {
    if (!isHovered || images.length <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sliderInterval = setInterval(() => {
      setCurrentImageIndex((currentIndex) => {
        return (currentIndex + 1) % images.length;
      });
    }, 2400);

    return () => {
      clearInterval(sliderInterval);
    };
  }, [isHovered, images.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sliding product images */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#e9e6df]">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
          style={{
            transform: `translateX(-${currentImageIndex * 100}%)`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={`${product.id}-${index}`}
              className="relative h-full min-w-full"
            >
              {Math.abs(index - currentImageIndex) <= 1 && <Image
                src={image}
                alt={`${product.name} - View ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />}
            </div>
          ))}
        </div>

        {/* Image slider dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {images.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentImageIndex === index
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Image number */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2 py-1 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            {currentImageIndex + 1}/{images.length}
          </span>
        )}
      </div>

      {/* Product details */}
      <div className="mt-3 text-sm">
        <p className="font-medium">{product.name}</p>

        <p className="mt-1 text-[#6b6a65]">
          From ₹{formatPrice(product.price)}

          {product.oldPrice && (
            <span className="ml-2 text-[#a9a7a1] line-through">
              ₹{formatPrice(product.oldPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
