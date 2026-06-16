import type { Metadata } from "next";
import { Pontano_Sans } from "next/font/google";
import "./globals.css";

const pontanoSans = Pontano_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pontano-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Gaadieasy | On-Road Vehicle Pricing",
    template: "%s | Gaadieasy",
  },
  description: "Check city-wise on-road vehicle prices, compare models, and connect with verified dealers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gaadieasy.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gaadieasy | On-Road Vehicle Pricing",
    description: "Check city-wise on-road vehicle prices, compare models, and connect with verified dealers.",
    type: "website",
    locale: "en_IN",
    siteName: "Gaadieasy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gaadieasy | On-Road Vehicle Pricing",
    description: "Check city-wise on-road vehicle prices and compare models before visiting the showroom.",
  },
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
