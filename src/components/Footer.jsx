import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#2b2b28] text-[#f5f3ef] mt-24">
      <div className="max-w-2xl mx-auto text-center px-6 py-16">
        <h3 className="text-2xl mb-2">Become a Member</h3>
        <p className="text-sm text-[#c9c7c2] mb-6">
          Become a member to get exclusive content and first look at new arrivals.
        </p>
        <form className="flex max-w-md mx-auto">
          <input
            type="email"
            placeholder="Email Address"
            className="flex-1 px-4 py-3 text-[#2b2b28] bg-[#f5f3ef] outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#f5f3ef] text-[#2b2b28] font-medium"
          >
            Sign up
          </button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 px-6 py-12 text-sm border-t border-white/10">
        <div>
          <h4 className="font-medium mb-3">Shop Collections</h4>
          <ul className="space-y-2 text-[#c9c7c2]">
            <li><Link href="/products?collection=Solid">Solids</Link></li>
            <li><Link href="/products?collection=Washed">Washed</Link></li>
            <li><Link href="/products?collection=Stripe">Stripes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Explore Brand</h4>
          <ul className="space-y-2 text-[#c9c7c2]">
            <li><Link href="/products">Shop All</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Account</h4>
          <ul className="space-y-2 text-[#c9c7c2]">
            <li><Link href="/login">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Follow</h4>
          <ul className="space-y-2 text-[#c9c7c2]">
            <li><a href="#" target="_blank" rel="noreferrer">Instagram</a></li>
          </ul>
        </div>
      </div>

      <div className="text-center text-xs text-[#8f8d88] py-6 border-t border-white/10">
        SAJAWAT © {new Date().getFullYear()}
      </div>
    </footer>
  );
}