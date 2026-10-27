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
  addToCart: (product: any, qtyToAdd?: number) => void;
  addOne: (id: string | number) => void;
  removeOne: (id: string | number) => void;
  removeFromCart: (id: string | number) => void;
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
  addOne: () => {},
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
              const rawQty = Math.floor(Number(item.qty) || 1);
              const itemStock = typeof item.stock === "number" && item.stock >= 0 ? item.stock : undefined;
              // Auto-heal corrupted or runaway quantities, and clamp to actual stock if available
              let safeQty = rawQty > 999 || rawQty < 1 ? 1 : rawQty;
              if (itemStock !== undefined) {
                safeQty = Math.min(itemStock, safeQty);
              }
              return {
                ...item,
                productId: id,
                _id: id,
                id: id,
                stock: itemStock,
                qty: safeQty,
                price: Number(item.price) || 0,
              };
            })
            .filter((i: any) => Boolean(i.productId));
          setCart(normalized);
          localStorage.setItem("cart", JSON.stringify(normalized));
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
          const sanitized = data.items
            .map((item: any) => {
              const id = String(item.productId || item._id || item.id || "");
              const rawQty = Math.floor(Number(item.qty) || 1);
              const itemStock = typeof item.stock === "number" && item.stock >= 0 ? item.stock : undefined;
              let safeQty = rawQty > 999 || rawQty < 1 ? 1 : rawQty;
              if (itemStock !== undefined) {
                safeQty = Math.min(itemStock, safeQty);
              }
              return {
                ...item,
                productId: id,
                _id: id,
                id: id,
                stock: itemStock,
                qty: safeQty,
                price: Number(item.price) || 0,
              };
            })
            .filter((i: any) => Boolean(i.productId));

          if (sanitized.length > 0) {
            setCart(sanitized);
            localStorage.setItem("cart", JSON.stringify(sanitized));
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

  // Add item (strictly bounded by actual stock quantity)
  function addToCart(product: any, qtyToAdd?: number) {
    if (!product) return;
    const rawId = product.productId || product._id || product.id;
    if (!rawId) return;
    const id = String(rawId);

    const existingIndex = cart.findIndex(
      (item) => item.productId === id || item._id === id || item.id === id
    );

    // Look up stock from product or existing cart item
    const rawStock =
      typeof product.stock === "number" && product.stock >= 0
        ? product.stock
        : typeof product.stockQuantity === "number" && product.stockQuantity >= 0
        ? product.stockQuantity
        : existingIndex > -1 && typeof cart[existingIndex].stock === "number"
        ? cart[existingIndex].stock
        : undefined;

    // Out of stock guard
    if (rawStock !== undefined && rawStock <= 0) {
      return;
    }

    const maxStock = rawStock !== undefined ? rawStock : 99;

    // Safeguard: Determine exact quantity to increment
    let addQty = 1;
    if (typeof qtyToAdd === "number" && qtyToAdd > 0) {
      addQty = Math.floor(qtyToAdd);
    } else if (existingIndex > -1 && product.qty === cart[existingIndex].qty) {
      // Called with the existing cart item itself (e.g. from an increment button)
      // Increment by 1 rather than doubling existing quantity!
      addQty = 1;
    } else if (product.qty !== undefined && product.qty !== null) {
      addQty = Math.max(1, Math.floor(Number(product.qty) || 1));
    }

    let updated: CartItem[];

    if (existingIndex > -1) {
      const currentQty = Math.floor(Number(cart[existingIndex].qty) || 1);
      if (currentQty >= maxStock) {
        // Already at maximum available stock
        return;
      }
      const newQty = Math.min(maxStock, currentQty + addQty);
      updated = cart.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              stock: rawStock !== undefined ? rawStock : item.stock,
              qty: newQty,
            }
          : item
      );
    } else {
      const initialQty = Math.min(maxStock, addQty);
      const newItem: CartItem = {
        productId: id,
        _id: id,
        id: id,
        name: product.name || product.title || "Unnamed Product",
        price: Number(product.price) || 0,
        image: product.image || (Array.isArray(product.images) ? product.images[0] : "") || "",
        stock: rawStock,
        qty: initialQty,
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

  // Add one quantity (increment by exactly 1, never exceeding stock)
  function addOne(rawId: string | number) {
    if (!rawId) return;
    const id = String(rawId);

    const existingIndex = cart.findIndex(
      (item) => item.productId === id || item._id === id || item.id === id
    );
    if (existingIndex === -1) return;

    const existing = cart[existingIndex];
    const maxStock =
      typeof existing.stock === "number" && existing.stock >= 0
        ? existing.stock
        : 99;

    const currentQty = Math.floor(Number(existing.qty) || 1);
    if (currentQty >= maxStock) {
      // Cannot exceed actual stock quantity
      return;
    }

    const updated = cart.map((item, idx) =>
      idx === existingIndex
        ? { ...item, qty: Math.min(maxStock, currentQty + 1) }
        : item
    );
    persist(updated);
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
        addOne,
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
