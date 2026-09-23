"use client";

import React, { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import pusherClient from "@/lib/pusher-client";
import {
  X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ArrowLeft,
  Store, Clock, MapPin, PhoneCall, ShieldCheck, CreditCard,
  CheckCircle, Copy, Check, Sparkles, User, Phone, Lock, AlertCircle,
  Loader2, BellRing, AlertTriangle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isStoreOpen, nextOpeningMessage, getTodaySlots,
  getAllSlotsForToday, getNowWAT, STORE_NAME, STORE_ADDRESS
} from "@/lib/storeHours";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
  const [phoneNumber, setPhoneNumber]   = useState("");

  // Store Hours and Slots
  const [now, setNow]               = useState<Date>(getNowWAT);
  const storeOpen                   = useMemo(() => isStoreOpen(now), [now]);
  const closedMessage               = useMemo(() => nextOpeningMessage(now), [now]);
  const todaySlots                  = useMemo(() => getTodaySlots(now), [now]);
  const [pickupSlot, setPickupSlot] = useState(todaySlots[0]?.label ?? "");

  // Bank & Store Settings
  const [storeSettings, setStoreSettings] = useState({
    accountName: "AMStores Retail Ltd",
    accountNumber: "0123456789",
    bankName: "Guaranty Trust Bank (GTB)",
    paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
  });
  const [copied, setCopied] = useState(false);

  // Order submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

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

    // 1. Pusher listener for instant real-time worker confirmation
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

    // 2. Resilient polling check every 3.5s in case of connection fluctuations
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
        try { pusherClient.unsubscribe(`order-${orderId}`); } catch (e) {}
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

  function handleInitiateCheckout() {
    setError("");
    if (!customerName.trim()) { setError("Please enter your full name"); return; }
    if (!phoneNumber.trim()) { setError("Please enter your phone number so store staff can reach you"); return; }
    if (!pickupSlot && todaySlots.length > 0) { setError("Please select a pickup time slot"); return; }
    if (!cart.length) { setError("Your cart is empty"); return; }
    setShowConfirm(true);
  }

  async function handleConfirmOrder() {
    setShowConfirm(false);
    setLoading(true);

    try {
      const pickupTimeText = pickupSlot ? `Pickup Station (Time: ${pickupSlot})` : `Store Pickup — Today`;

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          collectionMethod: "pickup",
          deliveryAddress: pickupTimeText,
          customerPhone: phoneNumber,
          paymentMethod: "manual_transfer",
          deliveryFee: 0,
          items: cart.map((i: any) => ({
            productId: i.productId || i._id || i.id,
            name: i.name || i.title || "Product",
            image: i.image || (Array.isArray(i.images) ? i.images[0] : ""),
            price: Number(i.price) || 0,
            qty: Number(i.qty) || 1,
          })),
        }),
      });

      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Order placement failed"); return; }

      const id = data.order?._id || data._id;
      const orderCode = data.order?.pickupCode || data.pickupCode || data.code || (id ? id.slice(-6).toUpperCase() : "N/A");
      localStorage.setItem("orderId", id);
      clearCart();

      // Put customer into live waiting state until worker confirms
      setVerificationOrder({
        id,
        code: orderCode,
        amount: totalPrice,
        status: "verifying",
      });
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
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
            {/* ── Header ── */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCartStep("cart")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    cartStep === "cart"
                      ? "bg-brand-primary text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400"
                  }`}
                >
                  <ShoppingBag size={14} />
                  <span>Cart ({totalItems})</span>
                </button>
                <span className="text-gray-300 dark:text-zinc-700">/</span>
                <button
                  onClick={() => totalItems > 0 && setCartStep("checkout")}
                  disabled={totalItems === 0}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Drawer Body ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {cartStep === "cart" ? (
                /* STEP 1: CART ITEMS */
                <>
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-4">
                        <ShoppingBag size={36} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Cart is Empty</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                        Browse our supermarket shelves and add fresh items to your basket.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800/80 hover:border-gray-200 transition-colors"
                        >
                          <div className="w-16 h-16 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 relative overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag size={22} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</h4>
                            <p className="text-xs text-brand-primary font-black mt-0.5">₦{item.price.toLocaleString()}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  onClick={() => removeOne(item.id)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-bold w-6 text-center text-gray-900 dark:text-white">{item.qty}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between h-16 shrink-0">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={15} />
                            </button>
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                              ₦{(item.price * item.qty).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* STEP 2: CHECKOUT INFO & BANK DETAILS */
                <div className="space-y-6">
                  {/* Store Station Badge */}
                  <div className="bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/30 dark:to-orange-950/30 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white">Store Pickup Station</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{STORE_NAME} — {STORE_ADDRESS}</p>
                      <a href="tel:08023434790" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        <PhoneCall size={11} /> Call Frontdesk: 08023434790
                      </a>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={13} /> Pickup Customer Details
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. David Adeniyi"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number (For pickup verification call)</label>
                      <input
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  {/* Pickup Time Slot */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} /> Pickup Time Slot (Today)
                    </h3>
                    {todaySlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {todaySlots.map((slot) => (
                          <button
                            key={slot.label}
                            type="button"
                            onClick={() => setPickupSlot(slot.label)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                              pickupSlot === slot.label
                                ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-xs"
                                : "bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200">
                        {closedMessage}
                      </p>
                    )}
                  </div>

                  {/* Bank Transfer Details Box */}
                  <div className="bg-gray-50/80 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={14} className="text-brand-primary" /> Store Bank Account
                      </h4>
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Instant Verification</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-700 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Bank Name:</span>
                        <strong className="text-gray-900 dark:text-white font-bold">{storeSettings.bankName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Account Name:</span>
                        <strong className="text-gray-900 dark:text-white font-bold">{storeSettings.accountName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100 dark:border-zinc-800 mt-1">
                        <span className="text-gray-500">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-brand-primary tracking-wider">{storeSettings.accountNumber}</span>
                          <button
                            onClick={copyAccount}
                            className="p-1 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-brand-primary/10 text-gray-700 dark:text-gray-300 transition-colors"
                            title="Copy Account Number"
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      💡 <strong>Instructions:</strong> Please transfer the exact total <strong className="text-brand-primary font-bold">₦{totalPrice.toLocaleString()}</strong> to the account above.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer / Actions ── */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0 z-20 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Amount</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-brand-primary font-display">₦{totalPrice.toLocaleString()}</span>
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Free Store Pickup</span>
                </div>
              </div>

              {cartStep === "cart" ? (
                <button
                  onClick={() => setCartStep("checkout")}
                  disabled={cart.length === 0}
                  className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-extrabold text-sm transition-all duration-200 shadow-lg shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCartStep("cart")}
                      className="py-4 px-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
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

      {/* ── Confirm Order Modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Payment Transfer</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Have you transferred <strong className="text-brand-primary font-bold">₦{totalPrice.toLocaleString()}</strong> to AMStores bank account? Our store team will verify it live.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  Yes, Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LIVE PAYMENT VERIFICATION SCREEN (Waiting -> Accepted / Declined) ── */}
      <AnimatePresence>
        {verificationOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 select-none bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.2rem] shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative z-10 overflow-hidden border border-gray-100 dark:border-zinc-800"
            >
              {/* ---------------------------------------------------- */}
              {/* STATE 1: VERIFYING (Waiting for Store Staff action)   */}
              {/* ---------------------------------------------------- */}
              {verificationOrder.status === "verifying" && (
                <div className="space-y-5">
                  {/* Glowing Radar Animation */}
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.45, 1.1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-amber-400/25 rounded-full blur-xs"
                    />
                    <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-amber-500/25 relative z-10">
                      <Loader2 className="animate-spin text-white w-9 h-9" />
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <Clock size={12} className="text-amber-600 animate-spin" /> Verifying Payment
                    </span>
                    <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mt-1">
                      Waiting for Staff Confirmation...
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                      Please hold on while our store attendant at AMStores Akobo checks your transfer of <strong className="text-gray-900 dark:text-white font-bold">₦{verificationOrder.amount.toLocaleString()}</strong>.
                    </p>
                  </div>

                  {/* Order Code Box */}
                  <div className="bg-amber-50/70 dark:bg-zinc-800/80 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                      Order Reference Code
                    </p>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-widest font-mono my-1">
                      #{verificationOrder.code}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Station: <strong className="text-gray-800 dark:text-gray-200">AMStores Akobo Ibadan</strong>
                    </p>
                  </div>

                  {/* Live Status Pulse */}
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 py-2 px-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Store attendant notified · Live verification in progress</span>
                  </div>

                  {/* Option to navigate to tracking page in background */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        closeCart();
                        setVerificationOrder(null);
                        router.push("/order");
                      }}
                      className="w-full py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Track in Background on Orders Page</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STATE 2: ACCEPTED (Payment Confirmed By Staff)       */}
              {/* ---------------------------------------------------- */}
              {verificationOrder.status === "accepted" && (
                <div className="space-y-5">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1.15], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-emerald-400/25 rounded-full blur-xs"
                    />
                    <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/25 relative z-10 p-3">
                      <CheckCircle size={38} className="text-white" />
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles size={12} className="text-emerald-600" /> Payment Confirmed
                    </span>
                    <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mt-1">
                      Order Successfully Accepted!
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                      Your transfer was confirmed by our store staff. We are now preparing your order!
                    </p>
                  </div>

                  <div className="bg-emerald-50/70 dark:bg-zinc-800/80 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                      Your Pickup Code
                    </p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest font-mono my-1">
                      #{verificationOrder.code}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Total: <strong className="text-gray-900 dark:text-white font-bold">₦{verificationOrder.amount.toLocaleString()}</strong> · Station: Akobo
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-500 px-1">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Routing to live order tracking...
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">{countdown}s</span>
                    </div>

                    <button
                      onClick={() => {
                        closeCart();
                        setVerificationOrder(null);
                        router.push("/order");
                      }}
                      className="w-full py-3.5 px-6 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <span>Proceed to Order Tracking</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STATE 3: DECLINED (Payment Not Confirmed By Staff)   */}
              {/* ---------------------------------------------------- */}
              {verificationOrder.status === "declined" && (
                <div className="space-y-5">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                    <AlertTriangle size={36} />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                      Verification Issue
                    </span>
                    <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mt-1">
                      Payment Not Verified
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                      Our store attendants could not match this transfer reference. If you have already transferred, please call our frontdesk immediately.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <a
                      href="tel:08023434790"
                      className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <PhoneCall size={16} />
                      <span>Call Store Frontdesk (08023434790)</span>
                    </a>
                    <button
                      onClick={() => {
                        setVerificationOrder(null);
                        setCartStep("checkout");
                      }}
                      className="w-full py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Retry Payment Transfer
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
