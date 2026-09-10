import {
  Geist,
  Geist_Mono,
  Roboto_Condensed,
} from "next/font/google";

import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IntroLoader from "@/components/IntroLoader";
import ScrollEffects from "@/components/ScrollEffects";

const geistSans = Geist({
  variable: "--font-main",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const introFont = Roboto_Condensed({
  variable: "--font-intro",
  subsets: ["latin"],
  weight: ["100", "200", "300"],
  display: "swap",
});

export const metadata = {
  title: "SAJAWAT STORE",
  description:
    "TRY SOMETHING AESTHETIC FOR YOUR HOME",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${introFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f3ef] text-[#2b2b28]">
        {/* Detects active scrolling for the scrollbar animation */}
        <ScrollEffects />

        {/* Animated transparent intro screen */}
        <IntroLoader />

        <Header />

        <main className="flex-1">{children}</main>

        <Footer />
      </body>
    </html>
  );
}