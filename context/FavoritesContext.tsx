"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface FavoriteProduct {
  _id: string;
  id?: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  rating?: number;
  discount?: number;
  tag?: string;
  subtitle?: string;
  stockStatus?: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  favoritesCount: number;
  isFavorite: (id?: string) => boolean;
  toggleFavorite: (product: any) => void;
  addToFavorites: (product: any) => void;
  removeFromFavorites: (id: string) => void;
  clearFavorites: () => void;
}

const STORAGE_KEY = "amstores_user_favorites";

// Fallback curated favorites if customer hasn't saved anything yet
export const DEFAULT_CURATED_FAVORITES: FavoriteProduct[] = [
  {
    _id: "prod_001",
    id: "prod_001",
    name: "Delis Signature Charcuterie Board",
    price: 18500,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    category: "Charcuterie",
    tag: "Customer Favorite · Gourmet",
    subtitle: "A hand-curated selection of prosciutto, salami, aged cheddar, camembert cheese, grapes, and crackers.",
    stockStatus: "In Stock",
  },
  {
    _id: "prod_005",
    id: "prod_005",
    name: "Premium Salmon Nigiri Set",
    price: 9500,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
    category: "Sushi & Sashimi",
    tag: "Top Rated · Chef Selection",
    subtitle: "Fresh Atlantic salmon slices over seasoned sushi rice with wasabi and pickled ginger.",
    stockStatus: "In Stock",
  },
  {
    _id: "prod_008",
    id: "prod_008",
    name: "Organic Green Cleanse Juice (500ml)",
    price: 3500,
    image: "https://images.unsplash.com/photo-1610970881699-44a5587caaec?w=600&auto=format&fit=crop&q=80",
    category: "Fresh Juice",
    tag: "Best Seller · 100% Organic",
    subtitle: "Cold-pressed kale, organic celery, cucumber, green apple, ginger, and fresh lime juice.",
    stockStatus: "In Stock",
  },
];

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  favoritesCount: 0,
  isFavorite: () => false,
  toggleFavorite: () => {},
  addToFavorites: () => {},
  removeFromFavorites: () => {},
  clearFavorites: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to read favorites from localStorage", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn("Failed to persist favorites to localStorage", e);
    }
  }, [favorites, hydrated]);

  const isFavorite = useCallback(
    (id?: string) => {
      if (!id) return false;
      return favorites.some((item) => (item._id || item.id) === id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback((product: any) => {
    if (!product) return;
    const prodId = product._id || product.id || String(product.name);

    setFavorites((prev) => {
      const exists = prev.some((item) => (item._id || item.id) === prodId);
      if (exists) {
        return prev.filter((item) => (item._id || item.id) !== prodId);
      } else {
        const cleanItem: FavoriteProduct = {
          _id: prodId,
          id: prodId,
          name: product.name || product.title || "Selected Item",
          price: typeof product.price === "number" ? product.price : parseFloat(product.price) || 0,
          image: product.image || product.images?.[0] || "/placeholder-food.png",
          category: product.category || "Grocery",
          discount: product.discount || 0,
          subtitle: product.subtitle || product.description || "Fresh grocery item from AMStores.",
          tag: product.tag || "Customer Favorite",
          stockStatus: product.stockStatus || "In Stock",
        };
        return [cleanItem, ...prev];
      }
    });
  }, []);

  const addToFavorites = useCallback((product: any) => {
    if (!product) return;
    const prodId = product._id || product.id || String(product.name);
    setFavorites((prev) => {
      if (prev.some((item) => (item._id || item.id) === prodId)) return prev;
      return [
        {
          _id: prodId,
          id: prodId,
          name: product.name || product.title || "Selected Item",
          price: typeof product.price === "number" ? product.price : parseFloat(product.price) || 0,
          image: product.image || "/placeholder-food.png",
          category: product.category || "Grocery",
          subtitle: product.subtitle || "Fresh grocery item from AMStores.",
          tag: product.tag || "Customer Favorite",
        },
        ...prev,
      ];
    });
  }, []);

  const removeFromFavorites = useCallback((id: string) => {
    if (!id) return;
    setFavorites((prev) => prev.filter((item) => (item._id || item.id) !== id));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount: favorites.length,
        isFavorite,
        toggleFavorite,
        addToFavorites,
        removeFromFavorites,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
