import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartToast } from "@/components/CartToast";
import CartOverlayClient from "@/components/CartOverlayClient";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartToast />
      <CartOverlayClient />
    </>
  );
}
