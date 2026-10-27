"use client";

import React from "react";
import { ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  [key: string]: any;
}

interface CartDrawerItemListProps {
  cart: CartItem[];
  addToCart: (product: any, qtyToAdd?: number) => void;
  addOne?: (id: string | number) => void;
  removeOne: (id: string | number) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  onBrowseProducts: () => void;
}

export default function CartDrawerItemList({
  cart,
  addToCart,
  addOne,
  removeOne,
  removeFromCart,
  clearCart,
  onBrowseProducts,
}: CartDrawerItemListProps) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
          <ShoppingBag size={36} />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Your basket is empty</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1 mb-6 leading-relaxed">
          Looks like you haven&apos;t added any groceries yet. Explore our supermarket aisles to get started!
        </p>
        <button
          onClick={onBrowseProducts}
          className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Items in Basket ({cart.length})
        </span>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Clear All</span>
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {cart.map((item) => {
          const itemId = String(item.productId || item._id || item.id || "");
          const unitPrice = Number(item.price) || 0;
          const lineTotal = unitPrice * (Number(item.qty) || 1);

          return (
            <div key={itemId || item.name} className="py-4 first:pt-1 last:pb-1 flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag size={24} className="text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                <p className="text-xs font-black text-brand-primary mt-0.5">
                  ₦{unitPrice.toLocaleString()}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => removeOne(itemId)}
                      className="p-1 text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="px-2.5 text-xs font-bold text-gray-900 dark:text-white min-w-5 text-center">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => (addOne ? addOne(itemId) : addToCart(item, 1))}
                      disabled={typeof item.stock === "number" && item.stock >= 0 && item.qty >= item.stock}
                      className={
                        typeof item.stock === "number" && item.stock >= 0 && item.qty >= item.stock
                          ? "p-1 text-gray-300 dark:text-zinc-600 cursor-not-allowed"
                          : "p-1 text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors cursor-pointer"
                      }
                      title={
                        typeof item.stock === "number" && item.stock >= 0 && item.qty >= item.stock
                          ? `Max available stock reached (${item.stock})`
                          : "Increase quantity"
                      }
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {typeof item.stock === "number" && item.stock >= 0 && item.qty >= item.stock && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/50">
                      Max ({item.stock})
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFromCart(itemId)}
                    className="p-1 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-gray-900 dark:text-white">
                  ₦{lineTotal.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
