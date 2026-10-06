import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Store Location",
  description:
    "Visit AMStores in Akobo, Ibadan or contact our customer care team for inquiries, order assistance, or wholesale questions.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us & Store Location | AMStores",
    description: "Visit or reach AMStores in Akobo, Ibadan.",
    url: "https://agbenimercantilestores.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
