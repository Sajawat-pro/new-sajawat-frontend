"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCollection = searchParams.get("collection") || "All";

  const [collection, setCollection] = useState(initialCollection);
  const [size, setSize] = useState("All");
  const [sort, setSort] = useState("featured");

  const collections = ["All", "Solid", "Washed", "Stripe"];
  const sizes = ["All", "Small", "Medium", "Large"];

  const filtered = useMemo(() => {
    let list = [...products];

    if (collection !== "All") {
      list = list.filter((p) => p.collection === collection);
    }
    if (size !== "All") {
      list = list.filter((p) => p.sizes.includes(size));
    }
    if (sort === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [collection, size, sort]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-8">Shop All</h1>

      <div className="flex flex-wrap gap-6 mb-10 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[#6b6a65]">Collection:</span>
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => setCollection(c)}
              className={`px-3 py-1 border ${
                collection === c
                  ? "bg-[#2b2b28] text-white border-[#2b2b28]"
                  : "border-black/20"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#6b6a65]">Size:</span>
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1 border ${
                size === s
                  ? "bg-[#2b2b28] text-white border-[#2b2b28]"
                  : "border-black/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[#6b6a65]">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-black/20 px-3 py-1"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[#6b6a65] py-20">
          No products match your filters.
        </p>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}