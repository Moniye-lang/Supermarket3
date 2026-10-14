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
    _id: "fav-1",
    id: "fav-1",
    name: "Farm-Fresh Strawberries & Organic Berries",
    price: 4500,
    image: "/AMstore1.jpg",
    category: "Fresh Farm Produce",
    tag: "Customer Favorite · Farm Fresh",
    subtitle: "Hand-picked daily, chilled and delivered within 30 minutes to preserve peak flavor and vital nutrients.",
    stockStatus: "In Stock",
  },
  {
    _id: "fav-2",
    id: "fav-2",
    name: "Artisan Sourdough & Pantry Essentials",
    price: 2800,
    image: "/IMG_4525.JPG",
    category: "Bakery & Gourmet",
    tag: "Top Rated · In-Store Bakery",
    subtitle: "Warm crusty baguettes, imported cheeses, and premium household favorites freshly stocked.",
    stockStatus: "In Stock",
  },
  {
    _id: "fav-3",
    id: "fav-3",
    name: "Prime Butchery Cuts & Daily Poultry",
    price: 6500,
    image: "/IMG_4523.JPG",
    category: "Butchery & Protein",
    tag: "Best Seller · Express Delivery",
    subtitle: "Quality-grade poultry, seasoned cuts, and fresh supermarket groceries packed with extreme care.",
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
