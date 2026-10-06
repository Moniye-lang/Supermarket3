import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fast In-Store Pickup Service",
  description:
    "Skip the queues with AMStores Express In-Store Pickup. Order groceries online and collect them freshly packed at our Akobo, Ibadan branch in minutes.",
  alternates: {
    canonical: "/pickup",
  },
  openGraph: {
    title: "Fast In-Store Pickup Service | AMStores",
    description:
      "Skip the checkout queues with AMStores Express In-Store Pickup in Akobo, Ibadan.",
    url: "https://agbenimercantilestores.com/pickup",
  },
};

export default function PickupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
