"use client";
import { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CreditCard, CheckCircle, User, ShieldCheck,
  Phone, X, AlertCircle, Clock, Store, Lock, PhoneCall, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import {
  isStoreOpen, nextOpeningMessage, getTodaySlots,
  getAllSlotsForToday, getNowWAT, STORE_NAME, STORE_ADDRESS
} from "@/lib/storeHours";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Checkout() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // Customer contact state
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");

  // Pickup state (Pickup only)
  const [now, setNow]               = useState<Date>(getNowWAT);
  const storeOpen                   = useMemo(() => isStoreOpen(now), [now]);
  const closedMessage               = useMemo(() => nextOpeningMessage(now), [now]);
  const todaySlots                  = useMemo(() => getTodaySlots(now), [now]);
  const [pickupSlot, setPickupSlot] = useState(todaySlots[0]?.label ?? "");

  // Tick clock every 60 s to auto-expire slots
  useEffect(() => {
    const tick = setInterval(() => setNow(getNowWAT()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Keep selected slot valid as time passes
  useEffect(() => {
    if (!todaySlots.find((s) => s.label === pickupSlot)) {
      setPickupSlot(todaySlots[0]?.label ?? "");
    }
  }, [todaySlots, pickupSlot]);

  // Cart & Pricing
  const { clearCart, cart, totalPrice } = useContext(CartContext);
  const items = cart;
  const subtotal = totalPrice;
  const orderTotal = subtotal; // Store pickup has 0 delivery fee

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!token) router.push("/signin");
  }, [token, router]);

  useEffect(() => {
    if (user) {
      setCustomerName((p) => p || user.name || "");
      setPhoneNumber((p) => p || user.phone || "");
    }
  }, [user]);

  // Bank settings from admin
  const [storeSettings, setStoreSettings] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    paymentInstructions: string;
  }>({
    bankName: "Zenith Bank",
    accountNumber: "1012345678",
    accountName: "AMStores Limited",
    paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        const data = await res.json();
        if (res.ok && data.accountNumber) {
          setStoreSettings({
            bankName: data.bankName || "Zenith Bank",
            accountNumber: data.accountNumber || "1012345678",
            accountName: data.accountName || "AMStores Limited",
            paymentInstructions: data.paymentInstructions || "Please transfer the exact amount and use your full name or Order Code as payment reference.",
          });
        }
      } catch (err) {
        console.warn("Could not fetch store settings, using defaults");
      }
    }
    fetchSettings();
  }, []);

  // Order submission flow
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  function copyAccount() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storeSettings.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handlePlaceOrder() {
    setError("");
    if (!customerName.trim()) { setError("Please enter your full name"); return; }
    if (!phoneNumber.trim()) { setError("Please enter your phone number so store staff can reach you"); return; }
    if (!pickupSlot && todaySlots.length > 0) { setError("Please select a pickup time slot"); return; }
    if (!items.length) { setError("Your cart is empty"); return; }
    setShowConfirm(true);
  }

  async function handleCheckout() {
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
          items: items.map((i: any) => ({
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
      localStorage.setItem("orderId", id);
      clearCart();
      router.push("/pickup");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-display font-bold text-brand-dark">
            Checkout
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Store Pickup at AMStores · Fast, Fresh &amp; Ready on Arrival
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* ── Left: Pickup & Contact Form ────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Store Pickup Station Header */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                  <Store size={22} className="text-brand-primary" /> Store Pickup
                </h2>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded-full px-3 py-1 flex items-center gap-1">
                  <span>FREE PICKUP</span>
                </span>
              </div>

              {/* Store Location & 1-Click Call Banner */}
              <div className="bg-gradient-to-r from-red-50/70 to-orange-50/70 border border-red-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">🏪 {STORE_NAME}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${storeOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {storeOpen ? "OPEN NOW" : "CURRENTLY CLOSED"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <MapPin size={14} className="text-brand-primary shrink-0" />
                    {STORE_ADDRESS}
                  </p>
                  {!storeOpen && (
                    <p className="text-xs text-red-600 font-semibold mt-1">{closedMessage}</p>
                  )}
                </div>

                {/* 1-Click Call Button */}
                <a
                  href="tel:08023434790"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all shrink-0"
                  title="Call Store Frontdesk"
                >
                  <PhoneCall size={14} />
                  <span>Call 08023434790</span>
                </a>
              </div>

              {/* Pickup Slot Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-brand-primary" />
                  <p className="text-sm font-bold text-gray-800">
                    Select Pickup Time Slot
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      (WAT {now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })})
                    </span>
                  </p>
                </div>

                {todaySlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 text-center">
                    All scheduled slots for today have passed. Pickup remains available until 8:00 PM closing.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {getAllSlotsForToday(now).map((slot) => {
                      const available = todaySlots.some((s) => s.label === slot.label);
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          disabled={!available}
                          onClick={() => available && setPickupSlot(slot.label)}
                          className={`px-3 py-3 rounded-xl text-xs font-semibold border-2 transition-all text-center
                            ${pickupSlot === slot.label
                              ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                              : available
                              ? "border-gray-200 text-gray-700 hover:border-brand-primary/40 bg-white"
                              : "border-dashed border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                            }`}
                        >
                          {slot.label}
                          {!available && <span className="block text-[9px] opacity-60 mt-0.5">Passed</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                <User size={20} className="text-brand-primary" /> Collector Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Adewale Johnson"
                    value={customerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="08012345678"
                    value={phoneNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                    icon={<Phone size={18} className="text-gray-400" />}
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Used to notify you when your order is packed and ready.
                  </span>
                </div>
              </div>
            </section>

            {/* Payment Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                <CreditCard size={20} className="text-brand-primary" /> Payment Method
              </h2>
              
              {/* Bank Details Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-50/60 to-orange-50/60 border border-brand-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                      ₦
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Direct Bank Transfer</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">Official Account</span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-brand-primary/15 shadow-sm space-y-2 text-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Bank Name:</span>
                    <span className="font-bold text-gray-900">{storeSettings.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Account Name:</span>
                    <span className="font-semibold text-gray-800">{storeSettings.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-medium text-xs">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-brand-primary text-base tracking-wider">{storeSettings.accountNumber}</span>
                      <button
                        type="button"
                        onClick={copyAccount}
                        className="px-2.5 py-1 text-[11px] font-bold bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg transition-colors cursor-pointer"
                      >
                        {copied ? "Copied! ✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed italic">
                  💡 {storeSettings.paymentInstructions}
                </p>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full sm:w-auto py-3.5 px-8 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ShieldCheck size={18} /> Continue to Confirmation</>
                }
              </Button>
            </section>
          </div>

          {/* ── Right: Summary ───────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-100 sticky top-28 border border-gray-100">
              <h3 className="text-xl font-bold text-brand-dark mb-6">Order Summary</h3>

              {/* Items List */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 divide-y divide-gray-50">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="pt-2.5 first:pt-0 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                        <img src={item.image || "/placeholder.png"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-800 font-medium truncate max-w-[130px]">{item.name}</p>
                        <p className="text-xs text-gray-400 font-semibold">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">
                      ₦{((Number(item.price) || 0) * (Number(item.qty) || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pickup Slot Pill */}
              {pickupSlot && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                  <Store size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-800">Store Pickup · Today</p>
                    <p className="text-emerald-700 font-medium mt-0.5">{pickupSlot}</p>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 my-4" />

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₦{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Store Pickup Fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>

                <div className="flex justify-between text-lg font-bold text-brand-dark mt-4 pt-4 border-t border-gray-100">
                  <span>Total Due</span>
                  <span className="text-brand-primary">₦{orderTotal.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3.5 rounded-xl mb-4 text-center font-medium border border-red-100">
                  {error}
                </div>
              )}

              <Button
                className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl flex items-center justify-center gap-2"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ShieldCheck size={18} /> Place Pickup Order</>
                }
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" /> Guaranteed Safe &amp; Direct Pickup
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !loading && setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-gray-100"
            >
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Store size={32} className="text-brand-primary" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Confirm Store Pickup</h2>
              <p className="text-gray-500 text-center text-sm mb-4 leading-relaxed">
                Confirm your pickup order of{" "}
                <strong className="text-brand-primary text-base">₦{orderTotal.toLocaleString()}</strong>
                . Once submitted, make your transfer and you will receive your unique Pickup Code.
              </p>

              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3.5 mb-5 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <MapPin size={14} /> AMStores Ibadan
                </div>
                <div className="text-emerald-700">
                  {STORE_ADDRESS}
                </div>
                {pickupSlot && (
                  <div className="pt-1 border-t border-emerald-200/60 font-medium">
                    Scheduled Slot: <strong>{pickupSlot}</strong>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle size={18} /> Confirm Order</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
