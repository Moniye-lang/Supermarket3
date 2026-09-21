"use client";

import React, { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import Link from "next/link";

export const CartToast: React.FC = () => {
  const { lastAdded, openCart } = useContext(CartContext);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<{ name: string; image?: string } | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    setCurrent({ name: lastAdded.name, image: lastAdded.image });
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [lastAdded?.ts]);

  if (!current) return null;

  return (
    <div
      onClick={() => { setVisible(false); openCart("cart"); }}
      className={`fixed top-5 right-4 z-[9999] transition-all duration-400 cursor-pointer ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-3 scale-95 pointer-events-none"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl px-4 py-3 min-w-[220px] max-w-[300px] hover:scale-[1.02] transition-transform">
        {/* Product thumbnail */}
        {current.image && (
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-800">
            <img
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text */}
        <div className="flex-grow min-w-0 text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
            <Check size={11} strokeWidth={3} /> Added to cart
          </p>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{current.name}</p>
        </div>

        {/* View cart button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            openCart("cart");
          }}
          className="shrink-0 p-2 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-300 hover:text-gray-800 transition-colors cursor-pointer"
          title="Open Cart & Checkout Drawer"
        >
          <ShoppingCart size={14} />
        </button>
      </div>
    </div>
  );
};
