import { createContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export function CartProvider({ children, user, token }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Load cart from localStorage first
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

  // 🟢 Load from backend if logged in
  useEffect(() => {
    async function loadCart() {
      if (!token || !user?._id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/cart/${user._id}`, {
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

  // 🧮 Totals
  const totalItems = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.qty || 0) * (item.price || 0),
    0
  );

  // 🟡 Save to localStorage + backend
  async function persist(updatedCart) {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    if (!token || !user?._id) return; // Only sync online when logged in

    try {
      const res = await fetch("http://localhost:5000/api/cart/save", {
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

  // ➕ Add item
  function addToCart(product) {
    if (!product?._id) return;

    const existing = cart.find((item) => item.productId === product._id);
    let updated;

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
  }

  // ➖ Remove one quantity
  function removeOne(id) {
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

  // ❌ Remove item entirely
  function removeFromCart(id) {
    const updated = cart.filter((item) => item.productId !== id);
    persist(updated);
  }

  // 🧹 Clear cart
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
