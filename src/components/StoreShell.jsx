"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollEffects from "@/components/ScrollEffects";
export default function StoreShell({ children }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;
  return <><ScrollEffects /><Header /><main className="flex-1">{children}</main><Footer /></>;
}
