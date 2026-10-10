import { ReactNode } from "react";
import type { Metadata } from "next";
import AdminLayout from "@/components/AdminLayout";

export const metadata: Metadata = {
  title: "AMStores Admin Portal",
  description: "AMStores Management & Order Fulfillment Operations",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AMStores Admin",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
