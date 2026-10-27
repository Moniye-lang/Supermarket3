"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Store,
  Sparkles
} from "lucide-react";
import { useFavorites, DEFAULT_CURATED_FAVORITES } from "@/context/FavoritesContext";
import { CartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";

export default function FavoritesPage() {
  const { favorites, favoritesCount, removeFromFavorites, clearFavorites, addToFavorites } = useFavorites();
  const { addToCart, openCart } = useContext(CartContext);

  const handleAddAllToCart = () => {
    favorites.forEach((item) => {
      addToCart({
        _id: item._id || item.id || "item",
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        stockStatus: item.stockStatus || "In Stock"
      });
    });
  };

  const handleAddSingleToCart = (item: any) => {
    addToCart({
      _id: item._id || item.id || "item",
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      stockStatus: item.stockStatus || "In Stock"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-zinc-950 pt-24 pb-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Favorites</span>
        </nav>

        {/* Header Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-zinc-800 shadow-sm mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#AD343E] dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Heart size={14} className="fill-current" />
                <span>My Saved Collection</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark dark:text-white">
                Favorited Products
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
                Quickly reorder your trusted pantry essentials, prime cuts, and everyday favorites in one tap.
              </p>
            </div>

            {favoritesCount > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={clearFavorites}
                  className="rounded-full text-xs text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 size={14} className="mr-1.5" /> Clear All
                </Button>
                <Button
                  onClick={handleAddAllToCart}
                  className="rounded-full bg-[#AD343E] hover:bg-[#8e2b33] text-white shadow-lg shadow-[#AD343E]/20 text-xs sm:text-sm px-6 py-2.5 font-bold"
                >
                  <ShoppingCart size={16} className="mr-2" /> Add All to Cart ({favoritesCount})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Favorites List */}
        {favoritesCount > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Saved Items ({favoritesCount})
              </span>
              <Link
                href="/products"
                className="text-xs font-bold text-[#AD343E] dark:text-red-400 hover:underline inline-flex items-center gap-1"
              >
                Browse more products <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {favorites.map((item) => {
                  const itemId = item._id || item.id || "";
                  return (
                    <motion.div
                      key={itemId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-[#AD343E]/5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image & Remove button */}
                        <div className="relative aspect-square w-full bg-gray-50 dark:bg-zinc-800/50 overflow-hidden">
                          <img
                            src={item.image || "/placeholder-food.png"}
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-food.png";
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Category Badge */}
                          {item.category && (
                            <span className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-[11px] font-bold text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full shadow-sm">
                              {item.category}
                            </span>
                          )}

                          {/* Remove from favorites */}
                          <button
                            onClick={() => removeFromFavorites(itemId)}
                            title="Remove from favorites"
                            className="absolute top-3 right-3 p-2 bg-white/95 dark:bg-zinc-900/95 hover:bg-red-50 dark:hover:bg-red-950/50 text-gray-400 hover:text-red-500 rounded-full shadow-md transition-all duration-200 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <Link href={`/product/${itemId}`}>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 hover:text-[#AD343E] dark:hover:text-red-400 transition-colors">
                              {item.name}
                            </h3>
                          </Link>

                          {item.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                              {item.subtitle}
                            </p>
                          )}

                          <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-xl font-extrabold text-[#AD343E] dark:text-red-400 font-display">
                              ₦{item.price?.toLocaleString()}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                              {item.stockStatus || "In Stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="p-5 pt-0">
                        <Button
                          onClick={() => handleAddSingleToCart(item)}
                          className="w-full rounded-xl bg-gray-900 hover:bg-[#AD343E] dark:bg-zinc-800 dark:hover:bg-[#AD343E] text-white text-xs font-bold py-3 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={15} /> Add to Cart
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-14 text-center border border-gray-100 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto my-6">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-6 text-[#AD343E] dark:text-red-400 shadow-inner">
              <Heart size={38} className="fill-[#AD343E]/20" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-dark dark:text-white mb-3">
              Your Favorites List is Empty
            </h2>

            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Tap the love/heart icon on any product card while shopping to keep your favorite items organized here for instant re-ordering.
            </p>

            <Link href="/products">
              <Button className="rounded-full bg-[#AD343E] hover:bg-[#8e2b33] text-white px-8 py-3.5 font-bold shadow-lg shadow-[#AD343E]/20">
                <Store size={18} className="mr-2" /> Start Browsing Products
              </Button>
            </Link>

            {/* Curated Recommendations */}
            <div className="mt-14 pt-10 border-t border-gray-100 dark:border-zinc-800 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-[#AD343E]" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Popular Store Favorites
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DEFAULT_CURATED_FAVORITES.map((curated) => (
                  <div
                    key={curated._id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-gray-200">
                        <img
                          src={curated.image}
                          alt={curated.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                        {curated.name}
                      </h4>
                      <p className="text-xs text-[#AD343E] font-bold mt-1">
                        ₦{curated.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToFavorites(curated)}
                        className="flex-1 text-[11px] rounded-lg py-1.5 h-auto font-medium"
                      >
                        <Heart size={12} className="mr-1 text-red-500 fill-red-500" /> Save
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddSingleToCart(curated)}
                        className="flex-1 text-[11px] rounded-lg py-1.5 h-auto bg-[#AD343E] hover:bg-[#8e2b33] text-white font-medium"
                      >
                        <ShoppingCart size={12} className="mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
