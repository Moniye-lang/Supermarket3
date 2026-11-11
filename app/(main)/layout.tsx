import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartToast } from "@/components/CartToast";
import dynamic from "next/dynamic";

// Defer CartOverlay and its modals/Pusher connections from initial critical bundle
const CartOverlay = dynamic(() => import("@/components/CartOverlay"), { ssr: false });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartToast />
      <CartOverlay />
    </>
  );
}
