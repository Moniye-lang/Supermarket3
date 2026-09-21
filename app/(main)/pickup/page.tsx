"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PickupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/order");
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center p-6 text-center">
      <Loader2 size={36} className="animate-spin text-brand-primary mb-3" />
      <p className="text-sm font-bold text-brand-muted">Redirecting to Order Tracking...</p>
    </div>
  );
}
