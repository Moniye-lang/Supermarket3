import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products & Groceries",
  description:
    "Browse our full catalog of fresh groceries, drinks, toiletries, bakery items, and household goods at AMStores Akobo, Ibadan. Order online for swift pickup.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "All Products & Groceries | AMStores",
    description:
      "Browse thousands of groceries, beverages, toiletries, and household essentials in Ibadan.",
    url: "https://agbenimercantilestores.com/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
