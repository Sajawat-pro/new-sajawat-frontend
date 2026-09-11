import localFont from "next/font/local";

import "./globals.css";

import StoreShell from "@/components/StoreShell";
import ToastProvider from "@/components/ToastProvider";
import IntroLoader from "@/components/IntroLoader";

const geistSans = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-main",
  display: "swap",
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f3ef] text-[#2b2b28]">
        <IntroLoader />
        <ToastProvider><StoreShell>{children}</StoreShell></ToastProvider>
      </body>
    </html>
  );
}