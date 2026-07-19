"use client";

import { createContext, useEffect, useState, useContext, ReactNode } from "react";
import { AuthContext } from "./AuthContext";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  [key: string]: any;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (product: any) => void;
  removeOne: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  lastAdded: { name: string; image?: string; ts: number } | null;
}

export const CartContext = createContext<CartContextType>({
  cart: [],
  loading: true,
  addToCart: () => {},
  removeOne: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  lastAdded: null,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAdded, setLastAdded] = useState<{ name: string; image?: string; ts: number } | null>(null);

  // Load cart from localStorage first
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCart(parsed);
      } catch {
        localStorage.removeItem("cart");
      }
    }
  }, []);

  // Load from backend if logged in
  useEffect(() => {
    async function loadCart() {
      if (!token || !user?._id) {
        setCart([]);
        localStorage.removeItem("cart");
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${API_URL}/api/cart/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to fetch cart (${res.status})`);

        const data = await res.json();
        if (data?.items) {
          setCart(data.items);
          localStorage.setItem("cart", JSON.stringify(data.items));
        }
      } catch (err) {
        console.error("Error loading cart:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [user?._id, token]);

  // Totals
  const totalItems = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.qty || 0) * (item.price || 0),
    0
  );

  // Save to localStorage + backend
  async function persist(updatedCart: CartItem[]) {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    if (!token || !user?._id) return; // Only sync online when logged in

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_URL}/api/cart/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: updatedCart }),
      });

      if (!res.ok) {
        console.warn("Cart sync failed:", await res.text());
      }
    } catch (err) {
      console.error("Error saving cart:", err);
    }
  }

  // Add item
  function addToCart(product: any) {
    if (!product?._id) return;

    const existing = cart.find((item) => item.productId === product._id);
    let updated: CartItem[];

    if (existing) {
      updated = cart.map((item) =>
        item.productId === product._id
          ? { ...item, qty: item.qty + 1 }
          : item
      );
    } else {
      updated = [
        ...cart,
        {
          productId: product._id,
          name: product.name || "Unnamed Product",
          price: product.price || 0,
          image: product.image || "",
          qty: 1,
        },
      ];
    }

    persist(updated);
    setLastAdded({ name: product.name || "Unnamed Product", image: product.image || "", ts: Date.now() });
  }

  // Remove one quantity
  function removeOne(id: string) {
    const existing = cart.find((item) => item.productId === id);
    if (!existing) return;

    const updated =
      existing.qty <= 1
        ? cart.filter((item) => item.productId !== id)
        : cart.map((item) =>
          item.productId === id ? { ...item, qty: item.qty - 1 } : item
        );

    persist(updated);
  }

  // Remove item entirely
  function removeFromCart(id: string) {
    const updated = cart.filter((item) => item.productId !== id);
    persist(updated);
  }

  // Clear cart
  function clearCart() {
    persist([]);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeOne,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        lastAdded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
