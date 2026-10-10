"use client";

import { createContext, useEffect, useState, useContext, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: (step?: "cart" | "checkout") => void;
  closeCart: () => void;
  cartStep: "cart" | "checkout";
  setCartStep: (step: "cart" | "checkout") => void;
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
  isCartOpen: false,
  setIsCartOpen: () => {},
  openCart: () => {},
  closeCart: () => {},
  cartStep: "cart",
  setCartStep: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAdded, setLastAdded] = useState<{ name: string; image?: string; ts: number } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<"cart" | "checkout">("cart");

  // Automatically clear cart completely whenever user signs out
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user && !token) {
      setCart([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        localStorage.removeItem("pending_cart_product");
      }
    }
    prevUserRef.current = user;
  }, [user, token]);

  const openCart = (step: "cart" | "checkout" = "cart") => {
    setCartStep(step);
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  // Load cart from localStorage first
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .map((item: any) => {
              const id = String(item.productId || item._id || item.id || "");
              return {
                ...item,
                productId: id,
                _id: id,
                id: id,
                qty: Number(item.qty) || 1,
                price: Number(item.price) || 0,
              };
            })
            .filter((i: any) => Boolean(i.productId));
          setCart(normalized);
        }
      } catch {
        // keep local storage safe
      }
    }
  }, []);

  // Load from backend if logged in
  useEffect(() => {
    // If auth is still loading, wait before making backend decisions
    if (authLoading) return;

    async function loadCart() {
      if (!token || !user?._id) {
        setLoading(false);
        return;
      }

      try {
        const API_URL = "";
        const res = await fetch(`${API_URL}/api/cart/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          // Token expired or unauthenticated, preserve local cart
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error(`Failed to fetch cart (${res.status})`);

        const data = await res.json();
        if (Array.isArray(data?.items)) {
          if (data.items.length > 0) {
            setCart(data.items);
            localStorage.setItem("cart", JSON.stringify(data.items));
          } else {
            // If backend is empty but user had a local cart, sync local cart to backend
            const stored = localStorage.getItem("cart");
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setCart(parsed);
                  persist(parsed);
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error("Error loading cart:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [user?._id, token, authLoading]);

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
      const API_URL = "";
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

  // Auto-restore pending cart item after sign-in
  useEffect(() => {
    if ((token || user) && typeof window !== "undefined") {
      try {
        const pending = localStorage.getItem("pending_cart_product");
        if (pending) {
          const item = JSON.parse(pending);
          localStorage.removeItem("pending_cart_product");
          if (item) {
            addToCart(item);
            if (item.openCheckout) {
              openCart("checkout");
            } else {
              openCart("cart");
            }
          }
        }
      } catch (err) {
        console.warn("Failed restoring pending cart product:", err);
      }
    }
  }, [token, user]);

  // Add item
  function addToCart(product: any) {
    if (!token && !user) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pending_cart_product", JSON.stringify(product));
        } catch {}
        router.push("/signin");
      }
      return;
    }
    if (!product) return;
    const rawId = product.productId || product._id || product.id;
    if (!rawId) return;
    const id = String(rawId);

    const addQty = Math.max(1, Number(product.qty) || 1);
    const existingIndex = cart.findIndex(
      (item) => item.productId === id || item._id === id || item.id === id
    );
    let updated: CartItem[];

    if (existingIndex > -1) {
      updated = cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, qty: (Number(item.qty) || 1) + addQty }
          : item
      );
    } else {
      const newItem: CartItem = {
        productId: id,
        _id: id,
        id: id,
        name: product.name || product.title || "Unnamed Product",
        price: Number(product.price) || 0,
        image: product.image || (Array.isArray(product.images) ? product.images[0] : "") || "",
        qty: addQty,
      };
      updated = [...cart, newItem];
    }

    persist(updated);
    setLastAdded({
      name: product.name || product.title || "Unnamed Product",
      image: product.image || (Array.isArray(product.images) ? product.images[0] : "") || "",
      ts: Date.now(),
    });
  }

  // Remove one quantity
  function removeOne(rawId: string | number) {
    if (!rawId) return;
    const id = String(rawId);

    const existingIndex = cart.findIndex(
      (item) => item.productId === id || item._id === id || item.id === id
    );
    if (existingIndex === -1) return;

    const existing = cart[existingIndex];
    let updated: CartItem[];

    if ((Number(existing.qty) || 1) <= 1) {
      updated = cart.filter((_, idx) => idx !== existingIndex);
    } else {
      updated = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, qty: (Number(item.qty) || 1) - 1 } : item
      );
    }

    persist(updated);
  }

  // Remove item entirely
  function removeFromCart(rawId: string | number) {
    if (!rawId) return;
    const id = String(rawId);
    const updated = cart.filter(
      (item) => item.productId !== id && item._id !== id && item.id !== id
    );
    persist(updated);
  }

  // Clear cart
  function clearCart() {
    setCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cart");
      localStorage.removeItem("pending_cart_product");
    }
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
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        cartStep,
        setCartStep,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
