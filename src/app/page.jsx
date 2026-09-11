import Image from "@/components/MediaImage";
import HeroVideo from "@/components/HeroVideo";
import StoreOffers from "@/components/StoreOffers";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/catalog";
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  const favorites = products.slice(0, 4);
  const newArrivals = products.slice(0, 4);

  const collections = [...new Set(products.map(product => product.collection).filter(Boolean))];

  const highlights = [
    "Thoughtfully Designed",
    "Carefully Hand-Finished",
    "Securely Packed",
    "Made for Indian Homes",
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[500px] w-full overflow-hidden bg-[#e9e6df]">
        <HeroVideo />

        {/* 40% black video overlay */}
        <div className="absolute inset-0 z-10 bg-black/40" />

        {/* Hero content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end px-6 pb-16 text-center text-white">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">
            Thoughtfully made for your home
          </p>

          <h1 className="mb-4 max-w-4xl text-4xl font-medium leading-tight sm:text-6xl">
            Your Wall Isn&apos;t Empty.
            <br />
            It&apos;s Missing Sajawat.
          </h1>

          <p className="mb-7 max-w-xl text-sm text-white/85 sm:text-base">
            Discover artistic 3D plant frames and statement wall décor created
            to make every corner of your home feel complete.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Top-to-bottom black button animation */}
            <Link
              href="/products"
              className="group relative isolate overflow-hidden bg-white px-7 py-3 font-medium text-[#2b2b28]"
            >
              <span className="absolute inset-0 -z-10 origin-top scale-y-0 bg-black transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-y-100" />

              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                Shop Frames
              </span>
            </Link>

            <Link
              href="#collections"
              className="border border-white px-7 py-3 font-medium text-white transition-colors duration-300 hover:bg-white hover:text-[#2b2b28]"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Founder’s Favorites */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 grid items-center gap-10 sm:grid-cols-2">
          <div className="relative aspect-video w-full overflow-hidden bg-[#e9e6df]">
            <Image
              src="/images/founders-favorites.png"
              alt="Sajawat founder's favourite wall frames"
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
              Chosen for You
            </p>

            <h2 className="mb-4 text-3xl font-medium">
              Founder&apos;s Favorites
            </h2>

            <p className="mb-5 max-w-lg leading-relaxed text-[#6b6a65]">
              A selection of our most-loved wall frames, chosen for their
              details, balanced colours and ability to transform an ordinary
              wall into a beautiful focal point.
            </p>

            <Link
              href="/products"
              className="inline-block border-b border-[#2b2b28] pb-1 text-sm"
            >
              Shop the Collection
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 grid items-center gap-10 sm:grid-cols-2">
          <div className="order-2 sm:order-1">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
              Just Arrived
            </p>

            <h2 className="mb-4 text-3xl font-medium">New Wall Stories</h2>

            <p className="mb-5 max-w-lg leading-relaxed text-[#6b6a65]">
              Fresh designs, new finishes and thoughtful combinations created
              to bring character and warmth to your favourite spaces.
            </p>

            <Link
              href="/products"
              className="inline-block border-b border-[#2b2b28] pb-1 text-sm"
            >
              Explore New Arrivals
            </Link>
          </div>

          <div className="relative order-1 aspect-video w-full overflow-hidden bg-[#e9e6df] sm:order-2">
            <Image
              src="/images/signature-box.png"
              alt="New Sajawat wall frame arrivals"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Brand Highlights */}
      <section className="bg-[#2b2b28] py-7 text-[#f5f3ef]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 text-center sm:grid-cols-4">
          {highlights.map((highlight) => (
            <p
              key={highlight}
              className="text-xs uppercase tracking-[0.18em] sm:text-sm"
            >
              {highlight}
            </p>
          ))}
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-6xl px-6 py-14"><StoreOffers />{collections.map(collection => <div className="mb-14" key={collection}><div className="mb-8 flex items-center justify-between"><h2 className="text-3xl font-medium">{collection}</h2><Link className="text-sm underline" href={"/products?collection=" + encodeURIComponent(collection)}>Shop all</Link></div><div className="grid grid-cols-2 gap-6 sm:grid-cols-4">{products.filter(product => product.collection === collection).slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}</div></div>)}</section>
      {/* Collection CTA */}
      <section
        id="frame-finder"
        className="relative flex h-[420px] items-center justify-center overflow-hidden bg-[#dedad2] text-center"
      >
        <Image
          src="/images/quiz-bg.png"
          alt="Sajawat wall frame collection"
          fill
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 z-10 bg-black/45" />

        <div className="relative z-20 max-w-xl px-6 text-white">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/80">
            Find Your Style
          </p>

          <h2 className="mb-4 text-3xl font-medium">
            A Frame for Every Wall
          </h2>

          <p className="mb-7 leading-relaxed text-white/80">
            Whether your space is minimal, traditional or modern, discover a
            Sajawat frame designed to feel naturally at home.
          </p>

          <Link
            href="/products"
            className="inline-block bg-white px-7 py-3 font-medium text-[#2b2b28] transition-colors duration-300 hover:bg-black hover:text-white"
          >
            Find My Frame
          </Link>
        </div>
      </section>

      {/* Signature Packaging */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 sm:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden bg-[#e9e6df]">
          <Image
            src="/images/signature-box.png"
            alt="Sajawat signature product packaging"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
            Delivered with Care
          </p>

          <h2 className="mb-4 text-3xl font-medium">
            The Sajawat Experience
          </h2>

          <p className="max-w-lg leading-relaxed text-[#6b6a65]">
            Every Sajawat piece is carefully checked, securely packed and
            delivered ready to become part of your home.
          </p>
        </div>
      </section>
    </div>
  );
}