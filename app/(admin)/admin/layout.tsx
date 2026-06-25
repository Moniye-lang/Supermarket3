import { ReactNode } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
