import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://agbenimercantilestores.com";

export const viewport: Viewport = {
  themeColor: "#E52521",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AMStores | Premium Grocery Shopping & In-Store Pickup in Ibadan",
    template: "%s | AMStores",
  },
  description:
    "Shop fresh groceries, meat, bakery items, household essentials, and beverages online at AMStores with lightning-fast in-store pickup in Akobo, Ibadan.",
  keywords: [
    "AMStores",
    "Agbeni Mercantile Stores",
    "Grocery Ibadan",
    "Online Supermarket Ibadan",
    "Store Pickup Ibadan",
    "Supermarket Akobo",
    "Fresh Groceries Nigeria",
    "Buy Foodstuff Ibadan",
    "Beverages and Provisions Ibadan",
  ],
  authors: [{ name: "Agbeni Mercantile Stores" }],
  creator: "AMStores",
  publisher: "AMStores",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AMStores",
  },
  openGraph: {
    title: "AMStores | Premium Grocery Shopping & Fast In-Store Pickup",
    description:
      "Shop thousands of fresh groceries, drinks, bakery items, toiletries, and household goods at AMStores with quick in-store pickup in Ibadan.",
    url: SITE_URL,
    siteName: "AMStores (Agbeni Mercantile Stores)",
    images: [
      {
        url: "/AMstore1.jpg",
        width: 1200,
        height: 630,
        alt: "AMStores - Premium Supermarket and Grocery Pickup in Ibadan",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMStores | Premium Grocery Shopping & In-Store Pickup in Ibadan",
    description:
      "Browse thousands of groceries, beverages, and daily essentials with fast pickup in Akobo, Ibadan.",
    images: ["/AMstore1.jpg"],
  },
  verification: {
    google: "googlebe62655778d79e27",
    other: {
      "google-site-verification": ["googlebe62655778d79e27", "googlebe62655778d79e27.html"],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["GroceryStore", "LocalBusiness"],
      "@id": `${SITE_URL}/#store`,
      name: "AMStores (Agbeni Mercantile Stores)",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      image: `${SITE_URL}/AMstore1.jpg`,
      description:
        "Premium grocery shopping, supermarket essentials, and fast in-store pickup in Akobo, Ibadan.",
      priceRange: "₦₦",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Akobo",
        addressLocality: "Ibadan",
        addressRegion: "Oyo State",
        addressCountry: "NG",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 7.426,
        longitude: 3.931,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "08:00",
          closes: "21:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Sunday",
          opens: "10:00",
          closes: "19:00",
        },
      ],
      currenciesAccepted: "NGN",
      paymentAccepted: "Cash, Credit Card, Bank Transfer, Paystack",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "AMStores",
      description: "Online Supermarket & In-Store Grocery Pickup in Ibadan",
      publisher: {
        "@id": `${SITE_URL}/#store`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
