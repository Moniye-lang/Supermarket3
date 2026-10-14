"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import dynamic from "next/dynamic";

// Load PushNotificationInit only on the client — never during SSR
const PushNotificationInit = dynamic(() => import("@/components/PushNotificationInit"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <PushNotificationInit />
            <CartProvider>
              {children}
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
