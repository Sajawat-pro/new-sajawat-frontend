import Link from "next/link";

export default async function OrderSuccessPage({ searchParams }) {
  const parameters = await searchParams;
  const orderNumber = parameters?.order || "";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl text-green-800">
          ✓
        </div>

        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
          Order Confirmed
        </p>

        <h1 className="mb-4 text-3xl font-medium sm:text-4xl">
          Thank you for your order
        </h1>

        <p className="mx-auto mb-3 max-w-md text-sm leading-relaxed text-[#6b6a65]">
          We have received your order and will begin preparing it for
          delivery.
        </p>

        {orderNumber && (
          <p className="mb-9 text-sm">
            Order number:{" "}
            <span className="font-medium">{orderNumber}</span>
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="bg-[#2b2b28] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            Continue Shopping
          </Link>

          <Link
            href="/"
            className="border border-black/20 px-7 py-3 text-sm font-medium transition-colors hover:border-black"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}