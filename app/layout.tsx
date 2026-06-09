import type { Metadata } from "next";
import { Pontano_Sans } from "next/font/google";
import "./globals.css";

const pontanoSans = Pontano_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pontano-sans",
});

export const metadata: Metadata = {
  title: "AutoPrice | On-Road Vehicle Pricing",
  description: "Check city-wise on-road vehicle prices and connect with verified dealers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pontanoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
