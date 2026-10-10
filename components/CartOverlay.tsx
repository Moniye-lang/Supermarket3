"use client";

import React, { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import pusherClient from "@/lib/pusher-client";
import {
  X, ShoppingBag, ArrowRight, ArrowLeft,
  CreditCard, ShieldCheck, Copy, Check, Lock, LogIn, Loader2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  nextOpeningMessage, getTodaySlots, getNowWAT
} from "@/lib/storeHours";

import CartDrawerItemList from "./cart/CartDrawerItemList";
import CheckoutForm from "./cart/CheckoutForm";
import PaymentVerificationModal from "./cart/PaymentVerificationModal";

const API_URL = "";

export default function CartOverlay() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext);
  const {
    cart,
    addToCart,
    removeOne,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    closeCart,
    cartStep,
    setCartStep
  } = useContext(CartContext);

  // Customer contact state
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Store Hours and Slots
  const [now, setNow] = useState<Date>(getNowWAT);
  const closedMessage = useMemo(() => nextOpeningMessage(now), [now]);
  const todaySlots = useMemo(() => getTodaySlots(now), [now]);
  const [pickupSlot, setPickupSlot] = useState(todaySlots[0]?.label ?? "");

  // Bank & Store Settings
  const [storeSettings, setStoreSettings] = useState({
    accountName: "AMStores Retail Ltd",
    accountNumber: "0123456789",
    bankName: "Guaranty Trust Bank (GTB)",
    paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
  });
  const [copied, setCopied] = useState(false);
  const [copiedPrice, setCopiedPrice] = useState(false);

  // Order submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Real-time verification state (Verifying with Worker -> Accepted / Declined)
  const [verificationOrder, setVerificationOrder] = useState<{
    id: string;
    code: string;
    amount: number;
    status: "verifying" | "accepted" | "declined";
  } | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
    }
  }, [user]);

  // Tick clock every 60s
  useEffect(() => {
    const tick = setInterval(() => setNow(getNowWAT()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Keep pickup slot valid
  useEffect(() => {
    if (!todaySlots.find((s) => s.label === pickupSlot)) {
      setPickupSlot(todaySlots[0]?.label ?? "");
    }
  }, [todaySlots, pickupSlot]);

  // Fetch bank settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_URL}/api/settings/public`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.bankName || data.accountNumber) {
          setStoreSettings({
            accountName: data.accountName || "AMStores Retail Ltd",
            accountNumber: data.accountNumber || "0123456789",
            bankName: data.bankName || "Guaranty Trust Bank (GTB)",
            paymentInstructions: data.paymentInstructions || "Please transfer the exact amount and use your full name or Order Code as payment reference.",
          });
        }
      } catch (err) {
        console.warn("Could not fetch store settings, using defaults");
      }
    }
    fetchSettings();
  }, []);

  // Live Pusher listener & polling for payment verification by store staff
  useEffect(() => {
    if (!verificationOrder?.id || verificationOrder.status !== "verifying") return;

    const orderId = verificationOrder.id;

    let channel: any = null;
    if (pusherClient) {
      try {
        channel = pusherClient.subscribe(`order-${orderId}`);
        channel.bind("order:status", ({ status }: any) => {
          if (status === "packing" || status === "paid") {
            setVerificationOrder((prev) => prev ? { ...prev, status: "accepted" } : null);
          } else if (status === "payment_declined" || status === "cancelled") {
            setVerificationOrder((prev) => prev ? { ...prev, status: "declined" } : null);
          }
        });
        channel.bind("orderUpdated", (order: any) => {
          if (order.paymentStatus === "paid" || order.status === "packing") {
            setVerificationOrder((prev) => prev ? { ...prev, status: "accepted" } : null);
          } else if (order.paymentStatus === "declined" || order.status === "payment_declined") {
            setVerificationOrder((prev) => prev ? { ...prev, status: "declined" } : null);
          }
        });
      } catch (e) {
        console.error("Pusher subscription error:", e);
      }
    }

    const poll = setInterval(async () => {
      try {
        const authToken = localStorage.getItem("token") || token;
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.paymentStatus === "paid" || data.status === "packing") {
            setVerificationOrder((prev) => prev ? { ...prev, status: "accepted" } : null);
          } else if (data.paymentStatus === "declined" || data.status === "payment_declined") {
            setVerificationOrder((prev) => prev ? { ...prev, status: "declined" } : null);
          }
        }
      } catch (err) {
        // silent catch
      }
    }, 3500);

    return () => {
      if (channel && pusherClient) {
        try { pusherClient.unsubscribe(`order-${orderId}`); } catch (e) { }
      }
      clearInterval(poll);
    };
  }, [verificationOrder?.id, verificationOrder?.status, token]);

  // Countdown effect once worker accepts payment
  useEffect(() => {
    if (!verificationOrder || verificationOrder.status !== "accepted") return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          closeCart();
          setVerificationOrder(null);
          router.push("/order");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [verificationOrder?.status, router, closeCart]);

  function copyAccount() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storeSettings.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copyPrice() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(String(totalPrice));
      setCopiedPrice(true);
      setTimeout(() => setCopiedPrice(false), 2000);
    }
  }

  function handleProceedToCheckout() {
    if (!user && !token) {
      closeCart();
      router.push("/signin");
      return;
    }
    setCartStep("checkout");
  }

  async function handleInitiateCheckout() {
    setError("");
    const activeToken = typeof window !== "undefined" ? (localStorage.getItem("token") || token) : token;
    if (!user && !activeToken) {
      setError("Please sign in to complete your checkout.");
      closeCart();
      router.push("/signin");
      return;
    }

    const resolvedName = customerName.trim() || user?.name || user?.email?.split("@")[0] || "Customer";
    const resolvedPhone = phoneNumber.trim() || user?.phone || "08012345678";

    if (!cart.length) {
      setError("Your cart is empty. Please add items before checking out.");
      return;
    }

    const resolvedSlot = pickupSlot || todaySlots[0]?.label || "Store Pickup — Anytime Today";
    const currentTotal = totalPrice;

    setLoading(true);

    try {
      const pickupTimeText = `Pickup Station (Time: ${resolvedSlot})`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customerName: resolvedName,
          collectionMethod: "pickup",
          deliveryAddress: pickupTimeText,
          customerPhone: resolvedPhone,
          paymentMethod: "manual_transfer",
          items: cart.map((i: any) => ({
            productId: i.productId || i._id || i.id,
            name: i.name || i.title || "Product",
            image: i.image || (Array.isArray(i.images) ? i.images[0] : ""),
            qty: Number(i.qty) || 1,
            price: Number(i.price) || 0,
          })),
        }),
      });

      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Order placement failed. Please verify your items.");
        return;
      }

      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }

      const id = data.order?._id || data._id;
      const orderCode = data.order?.pickupCode || data.pickupCode || data.code || (id ? id.slice(-6).toUpperCase() : "N/A");
      if (typeof window !== "undefined") {
        localStorage.setItem("orderId", id);
      }
      clearCart();

      // Immediately launch the live payment verification popup
      setVerificationOrder({
        id,
        code: orderCode,
        amount: currentTotal,
        status: "verifying",
      });
    } catch (err: any) {
      console.error("[Checkout] Order placement error:", err);
      setError("Network connection issue. Please check your connection and retry.");
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-10 flex flex-col h-full border-l border-gray-100 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCartStep("cart")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    cartStep === "cart"
                      ? "bg-brand-primary text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400"
                  }`}
                >
                  <ShoppingBag size={14} />
                  <span>Basket ({totalItems})</span>
                </button>
                <span className="text-gray-300 dark:text-zinc-700">/</span>
                <button
                  type="button"
                  onClick={() => totalItems > 0 && handleProceedToCheckout()}
                  disabled={totalItems === 0}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    cartStep === "checkout"
                      ? "bg-brand-primary text-white shadow-xs"
                      : totalItems === 0
                      ? "text-gray-300 dark:text-zinc-700 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400"
                  }`}
                >
                  <CreditCard size={14} />
                  <span>Store Checkout</span>
                </button>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {cartStep === "cart" ? (
                <CartDrawerItemList
                  cart={cart}
                  addToCart={addToCart}
                  removeOne={removeOne}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  onBrowseProducts={() => {
                    closeCart();
                    router.push("/products");
                  }}
                />
              ) : (!user && !token) ? (
                <div className="space-y-6 py-6 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto shadow-sm">
                    <Lock size={30} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sign In Required to Order</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
                      To place an order and track fulfillment in real-time, please sign in to your AMStores account.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 text-left">
                    💡 <strong>Your basket is saved.</strong> Once you log in, you will be able to complete your transfer and get your unique pickup code.
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeCart();
                        router.push("/signin");
                      }}
                      className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn size={16} />
                      <span>Sign In to Your Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCartStep("cart")}
                      className="w-full py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Back to Basket
                    </button>
                  </div>
                </div>
              ) : (
                <CheckoutForm
                  cart={cart}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  todaySlots={todaySlots}
                  pickupSlot={pickupSlot}
                  setPickupSlot={setPickupSlot}
                  closedMessage={closedMessage}
                  storeSettings={storeSettings}
                  copied={copied}
                  copyAccount={copyAccount}
                  copiedPrice={copiedPrice}
                  copyPrice={copyPrice}
                  totalPrice={totalPrice}
                  error={error}
                  onModifyBasket={() => setCartStep("cart")}
                />
              )}
            </div>

            {/* Footer / Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0 z-20 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Amount</span>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span
                      onClick={copyPrice}
                      className="text-2xl font-black text-brand-primary font-display select-all cursor-pointer hover:opacity-90"
                      title="Click to copy amount"
                    >
                      ₦{totalPrice.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Free Store Pickup</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyPrice}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-brand-primary/10 text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors cursor-pointer"
                    title="Copy Total Amount"
                  >
                    {copiedPrice ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {cartStep === "cart" ? (
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-extrabold text-sm transition-all duration-200 shadow-lg shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>
              ) : (!user && !token) ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCartStep("cart")}
                    className="py-4 px-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeCart();
                      router.push("/signin");
                    }}
                    className="flex-1 py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-extrabold text-sm transition-all duration-200 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn size={16} />
                    <span>Sign In to Checkout</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-500" />
                      <span className="font-semibold">{error}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCartStep("cart")}
                      className="py-4 px-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleInitiateCheckout}
                      disabled={loading || cart.length === 0}
                      className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all duration-200 shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <span>I Have Transferred ₦{totalPrice.toLocaleString()}</span>}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center leading-tight pt-1">
                    By placing an order, you agree to our{" "}
                    <Link href="/terms" target="_blank" className="text-brand-primary font-semibold hover:underline">
                      Terms
                    </Link>{" "}
                    &amp;{" "}
                    <Link href="/privacy" target="_blank" className="text-brand-primary font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Live Payment Verification Modal Popup */}
    <AnimatePresence>
      {verificationOrder && (
        <PaymentVerificationModal
          key="payment-verification-popup"
          verificationOrder={verificationOrder}
          countdown={countdown}
          onClose={() => setVerificationOrder(null)}
          onNavigateToOrder={() => {
            closeCart();
            setVerificationOrder(null);
            router.push("/order");
          }}
        />
      )}
    </AnimatePresence>
  </>
  );
}
