import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function Home() {
  const favorites = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);

  const woodenFrames = products.filter(
    (product) => product.collection === "Wooden"
  );

  const metalFrames = products.filter(
    (product) => product.collection === "Metal"
  );

  const testimonials = [
    {
      quote:
        "The frame completely changed the look of my living room. It looks elegant, unique and much more premium in person.",
      name: "Priya S.",
      product: "3D Plant Frame",
      image: "/images/testimonials/testimonial-1.png",
    },
    {
      quote:
        "The detailing is beautiful and the packaging was very secure. It was ready to place on the wall immediately.",
      name: "Aarav M.",
      product: "Wooden Décor Frame",
      image: "/images/testimonials/testimonial-2.png",
    },
    {
      quote:
        "I wanted something different for an empty wall, and this frame was exactly what the space needed.",
      name: "Neha R.",
      product: "LED Plant Frame",
      image: "/images/testimonials/testimonial-3.png",
    },
  ];

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
        <video
          className="absolute inset-0 h-full w-full object-cover"
          poster="/images/hero/hero-poster.jpg"
          src="/videos/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* 40% black video overlay */}
        <div className="absolute inset-0 z-10 bg-black/40" />

        {/* Hero content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end px-6 pb-16 text-center text-white">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">
            Brand Opening Sale Is Live
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
              src="/images/home/new-arrivals.jpg"
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

      {/* Wooden Collection */}
      <section id="collections" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
              Natural and Timeless
            </p>

            <h2 className="text-3xl font-medium">The Wooden Collection</h2>
          </div>

          <Link
            href="/products?collection=Wooden"
            className="shrink-0 border-b border-[#2b2b28] pb-1 text-sm"
          >
            Shop All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {woodenFrames.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Metal Collection */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
              Modern and Refined
            </p>

            <h2 className="text-3xl font-medium">The Metal Collection</h2>
          </div>

          <Link
            href="/products?collection=Metal"
            className="shrink-0 border-b border-[#2b2b28] pb-1 text-sm"
          >
            Shop All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {metalFrames.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
            Sajawat in Your Homes
          </p>

          <h2 className="text-3xl font-medium">Loved in Every Corner</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index}>
              <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden bg-[#e9e6df]">
                <Image
                  src={testimonial.image}
                  alt={`${testimonial.product} purchased by ${testimonial.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              <p className="mb-3 text-sm leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <p className="text-xs uppercase tracking-wider text-[#6b6a65]">
                {testimonial.name} — {testimonial.product}
              </p>
            </div>
          ))}
        </div>
      </section>

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