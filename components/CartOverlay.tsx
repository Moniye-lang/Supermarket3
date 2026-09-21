"use client";

import React, { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import {
  X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ArrowLeft,
  Store, Clock, MapPin, PhoneCall, ShieldCheck, CreditCard,
  CheckCircle, Copy, Check, Sparkles, User, Phone, Lock, AlertCircle
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

  // Completed Animation state
  const [successOrder, setSuccessOrder] = useState<{ id: string; code: string; amount: number } | null>(null);
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

  // Countdown effect for completed order
  useEffect(() => {
    if (!successOrder) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          closeCart();
          setSuccessOrder(null);
          router.push("/order");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [successOrder, router, closeCart]);

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
      setSuccessOrder({ id, code: orderCode, amount: totalPrice });
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

                <button
                  onClick={() => cart.length > 0 && setCartStep("checkout")}
                  disabled={cart.length === 0}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    cartStep === "checkout"
                      ? "bg-brand-primary text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent"
                  }`}
                >
                  <Lock size={12} />
                  <span>Checkout</span>
                </button>
              </div>

              <button
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 hover:text-gray-900 dark:text-gray-300 transition-colors flex items-center justify-center cursor-pointer"
                title="Close overlay"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Body Container ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* ───────────────────────────────────────────────
                  STEP 1: CART REVIEW
              ─────────────────────────────────────────────── */}
              {cartStep === "cart" && (
                <motion.div
                  key="cart-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-4">
                        <ShoppingBag size={38} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Your cart is empty</h3>
                      <p className="text-xs text-gray-500 max-w-xs mb-6">
                        Explore our freshly baked goods, pantry groceries, and daily essentials.
                      </p>
                      <button
                        onClick={() => { closeCart(); router.push("/products"); }}
                        className="px-6 py-2.5 rounded-full bg-brand-primary text-white font-bold text-xs shadow-md hover:bg-brand-primary/90 transition-all cursor-pointer"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Items List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Selected Items ({totalItems})
                          </span>
                          <button
                            onClick={clearCart}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors"
                          >
                            Clear All
                          </button>
                        </div>

                        <AnimatePresence>
                          {cart.map((item: any) => (
                            <motion.div
                              key={item.productId || item._id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -12 }}
                              layout
                              className="p-3.5 bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center gap-3.5"
                            >
                              <div className="w-16 h-16 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-zinc-700 flex items-center justify-center p-1">
                                <img
                                  src={item.image || "/placeholder-food.png"}
                                  alt={item.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                    {item.name}
                                  </h4>
                                  <button
                                    onClick={() => removeFromCart(item.productId)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Remove item"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                                <p className="text-xs font-bold text-brand-primary mt-0.5">
                                  ₦{item.price?.toLocaleString()}
                                </p>

                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-900 shadow-2xs">
                                    <button
                                      onClick={() => removeOne(item.productId)}
                                      disabled={item.qty <= 1}
                                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-primary disabled:opacity-30 transition-colors"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-gray-800 dark:text-gray-100">
                                      {item.qty}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-primary transition-colors"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>

                                  <span className="text-xs font-extrabold text-gray-900 dark:text-gray-200">
                                    ₦{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Summary Breakdown */}
                      <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 space-y-2.5 text-xs">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                          <span>Subtotal</span>
                          <span className="font-bold text-gray-900 dark:text-white">₦{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                          <span>Store Pickup</span>
                          <span className="text-emerald-600 font-bold">FREE</span>
                        </div>
                        <div className="border-t border-gray-200/60 dark:border-zinc-700 pt-2.5 flex justify-between text-sm font-extrabold text-gray-900 dark:text-white">
                          <span>Total Due</span>
                          <span className="text-base text-brand-primary font-display font-black">
                            ₦{totalPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ───────────────────────────────────────────────
                  STEP 2: IN-OVERLAY CHECKOUT
              ─────────────────────────────────────────────── */}
              {cartStep === "checkout" && (
                <motion.div
                  key="checkout-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <button
                    onClick={() => setCartStep("cart")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} /> Back to Cart
                  </button>

                  {/* Store Pickup & Location Banner */}
                  <div className="bg-gradient-to-r from-red-50/70 to-orange-50/70 dark:from-red-950/20 dark:to-orange-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store size={16} className="text-brand-primary" />
                        <span className="font-bold text-gray-900 dark:text-white text-xs">🏪 {STORE_NAME}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${storeOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {storeOpen ? "OPEN NOW" : "CURRENTLY CLOSED"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <MapPin size={12} className="text-brand-primary shrink-0" />
                      {STORE_ADDRESS}
                    </p>
                    <a
                      href="tel:08023434790"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-all"
                    >
                      <PhoneCall size={12} /> Call Frontdesk (08023434790)
                    </a>
                  </div>

                  {/* Pickup Slot Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                      <Clock size={14} className="text-brand-primary" />
                      <span>Select Pickup Time</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {getAllSlotsForToday(now).map((slot) => {
                        const available = todaySlots.some((s) => s.label === slot.label);
                        const isSelected = pickupSlot === slot.label;
                        return (
                          <button
                            key={slot.label}
                            type="button"
                            disabled={!available}
                            onClick={() => available && setPickupSlot(slot.label)}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-red-50 dark:bg-red-950/30 border-brand-primary text-brand-primary font-bold shadow-2xs"
                                : available
                                ? "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                                : "bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-300 dark:text-zinc-600 cursor-not-allowed"
                            }`}
                          >
                            <p className="text-xs">{slot.label}</p>
                            <p className="text-[9px] opacity-70 mt-0.5">{available ? "Available" : "Passed"}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                        <User size={13} className="text-brand-primary" /> Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:border-brand-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                        <Phone size={13} className="text-brand-primary" /> Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Bank Transfer Details */}
                  <div className="bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-zinc-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <CreditCard size={14} className="text-brand-primary" /> Bank Transfer Details
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        Manual Transfer
                      </span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Bank Name</span>
                        <span className="font-bold text-gray-900 dark:text-white">{storeSettings.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Account Name</span>
                        <span className="font-bold text-gray-900 dark:text-white">{storeSettings.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-zinc-800">
                        <span className="text-gray-500">Account No.</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-brand-primary">
                            {storeSettings.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={copyAccount}
                            className="p-1 rounded-md bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors"
                            title="Copy Account Number"
                          >
                            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      💡 {storeSettings.paymentInstructions}
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl font-medium border border-red-100 dark:border-red-900/40 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* ── Sticky Bottom Action Footer ── */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md sticky bottom-0 z-20 space-y-2">
                {cartStep === "cart" ? (
                  <button
                    onClick={() => setCartStep("checkout")}
                    className="w-full py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Proceed to Pickup Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleInitiateCheckout}
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Place Pickup Order (₦{totalPrice.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full text-center border border-gray-100 dark:border-zinc-800"
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
              <Store size={28} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">Confirm Pickup Order</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Confirm your order for <strong className="text-brand-primary">₦{totalPrice.toLocaleString()}</strong>.
              Upon submission, make your bank transfer and you will receive your unique Pickup Code.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={14} /> Confirm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Ultra-Smooth Payment Success Completed Animation Screen ── */}
      {successOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 select-none bg-black/65 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 220, mass: 0.9 }}
            className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-7 sm:p-9 max-w-lg w-full text-center relative z-10 overflow-hidden border border-emerald-100 dark:border-emerald-900/30"
          >
            {/* Ambient glows */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* Floating Sparkles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-8 left-10 text-emerald-400 pointer-events-none"
            >
              <Sparkles size={16} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.7, 0.2], y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-12 right-12 text-teal-400 pointer-events-none"
            >
              <Sparkles size={18} />
            </motion.div>

            {/* SVG Draw Checkmark */}
            <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: [1, 1.35, 1.15], opacity: [0.45, 0, 0.45] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                className="absolute inset-0 bg-emerald-300/30 rounded-full blur-xs"
              />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
                className="w-20 h-20 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/25 relative z-10 p-3"
              >
                <svg className="w-full h-full" viewBox="0 0 60 60" fill="none">
                  <motion.circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
                  />
                  <motion.path
                    d="M18 31.5 L26 39.5 L42 22.5"
                    stroke="#ffffff"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: [0.65, 0, 0.35, 1] }}
                  />
                </svg>
              </motion.div>
            </div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-emerald-600" /> Payment & Order Completed
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white mt-1 mb-1.5 tracking-tight">
                Order Successfully Placed!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Your transfer has been recorded. Our store attendants are preparing your order right now.
              </p>
            </motion.div>

            {/* Pickup Code Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 bg-gradient-to-b from-gray-50/90 via-white to-gray-50/50 dark:from-zinc-800/80 dark:via-zinc-850 dark:to-zinc-800/50 border-2 border-dashed border-emerald-300/90 dark:border-emerald-700/60 rounded-2xl p-4.5"
            >
              <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                Pickup Identification Code
              </p>
              <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest font-mono my-1">
                #{successOrder.code}
              </p>
              <div className="flex items-center justify-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100/80 dark:border-zinc-700 mt-1.5">
                <span>Total: <strong className="text-gray-900 dark:text-white font-bold">₦{successOrder.amount.toLocaleString()}</strong></span>
                <span className="text-gray-300 dark:text-zinc-600">·</span>
                <span>Station: <strong className="text-gray-900 dark:text-white font-bold">AMStores Akobo</strong></span>
              </div>
            </motion.div>

            {/* Progress & Route Action */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 space-y-3"
            >
              <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Routing to live order tracking...
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{countdown}s</span>
              </div>

              <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3.2, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-full"
                />
              </div>

              <button
                onClick={() => {
                  closeCart();
                  setSuccessOrder(null);
                  router.push("/order");
                }}
                className="w-full mt-1.5 py-3.5 px-6 rounded-2xl bg-gray-950 hover:bg-black text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Track Live Order Status</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
