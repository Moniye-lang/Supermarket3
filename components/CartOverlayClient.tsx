"use client";

import dynamic from "next/dynamic";

const CartOverlay = dynamic(() => import("@/components/CartOverlay"), {
  ssr: false,
});

export default function CartOverlayClient() {
  return <CartOverlay />;
}

