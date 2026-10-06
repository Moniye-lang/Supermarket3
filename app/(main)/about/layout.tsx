import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Our Story & Mission",
  description:
    "Learn about Agbeni Mercantile Stores (AMStores) — Ibadan's trusted supermarket bringing quality, freshness, and convenience to everyday grocery shopping.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | AMStores",
    description:
      "Learn about Agbeni Mercantile Stores (AMStores) in Akobo, Ibadan.",
    url: "https://agbenimercantilestores.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
