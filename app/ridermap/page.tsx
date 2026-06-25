"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const RiderMapComponent = dynamic(
  () => import("@/components/RiderMapComponent"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center text-gray-600 text-lg bg-gray-50 flex-col gap-4">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        Loading Rider Map...
      </div>
    )
  }
);

export default function RiderMapPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center text-gray-600 text-lg bg-gray-50 flex-col gap-4">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    }>
      <RiderMapComponent />
    </Suspense>
  );
}
