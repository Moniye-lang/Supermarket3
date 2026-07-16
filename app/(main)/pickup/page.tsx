"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Pickup() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/order?type=pickup");
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-tr from-rose-50/60 via-slate-50 to-orange-50/20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold text-brand-muted animate-pulse uppercase tracking-wider">Redirecting to order tracking...</p>
    </div>
  );
}
