import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#E52521",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "AMStores | Premium Grocery Delivery & Pickup in Ibadan",
  description: "Shop fresh groceries, meat, bakery items, and household essentials online at AMStores. Fast 30-minute delivery to your doorstep in Ibadan.",
  keywords: ["AMStores", "Grocery Ibadan", "Online Supermarket", "Fresh Delivery Ibadan", "Agbeni Mercantile Stores"],
  openGraph: {
    title: "AMStores | Premium Grocery Delivery & Pickup",
    description: "Shop fresh groceries, meat, bakery items, and household essentials online at AMStores.",
    url: "https://agbenimercantilestores.com",
    siteName: "AMStores",
    locale: "en_NG",
    type: "website",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

