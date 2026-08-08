"use client";
import { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Truck, CreditCard, CheckCircle, MapPin, User, ShieldCheck,
  Phone, X, AlertCircle, Clock, Store, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import {
  isStoreOpen, nextOpeningMessage, getAvailableSlots, getPickupDays,
  ALL_PICKUP_SLOTS, getNowWAT,
} from "@/lib/storeHours";

const CheckoutMap = dynamic(() => import("@/components/CheckoutMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full rounded-2xl bg-gray-50 flex items-center justify-center text-sm text-gray-500 border border-gray-200">
      Loading Geographical Map...
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Checkout() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [method, setMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [latitude, setLatitude] = useState(7.4332);
  const [longitude, setLongitude] = useState(3.9471);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Pickup scheduling — computed from real clock
  const [now, setNow] = useState<Date>(getNowWAT);
  const storeOpen = useMemo(() => isStoreOpen(now), [now]);
  const closedMessage = useMemo(() => nextOpeningMessage(now), [now]);
  const pickupDays = useMemo(() => getPickupDays(now), [now]);

  // Selected day offset — default to first day that has available slots
  const defaultDayOffset = pickupDays.find((d) => d.hasSlots)?.offset ?? 0;
  const [pickupDayOffset, setPickupDayOffset] = useState(defaultDayOffset);

  const availableSlots = useMemo(
    () => getAvailableSlots(pickupDayOffset, now),
    [pickupDayOffset, now]
  );

  // Always default slot to the first available for that day
  const [pickupSlot, setPickupSlot] = useState(availableSlots[0]?.label ?? "");

  // Re-tick the clock every 60 s so slots auto-expire without refresh
  useEffect(() => {
    const tick = setInterval(() => setNow(getNowWAT()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // When available slots change (day change or clock tick), keep selection valid
  useEffect(() => {
    if (!availableSlots.find((s) => s.label === pickupSlot)) {
      setPickupSlot(availableSlots[0]?.label ?? "");
    }
  }, [availableSlots, pickupSlot]);

  // Reset slot when user picks a different day
  function handleDayChange(offset: number) {
    setPickupDayOffset(offset);
    const slots = getAvailableSlots(offset, now);
    setPickupSlot(slots[0]?.label ?? "");
  }

  const { clearCart, cart, totalPrice } = useContext(CartContext);
  const items = cart;
  const total = totalPrice;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!token) router.push("/signin");
  }, [token, router]);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name || "");
      setPhoneNumber((prev) => prev || user.phone || "");
    }
  }, [user]);

  function handleIHavePaidClick() {
    setError("");
    if (!customerName.trim()) { setError("Please enter your name"); return; }
    if (method === "delivery" && !address.trim()) { setError("Please enter your delivery address"); return; }
    if (method === "delivery" && !phoneNumber.trim()) { setError("Please enter a phone number for delivery"); return; }
    if (method === "pickup" && !pickupSlot) { setError("Please select a pickup time slot"); return; }
    if (!items.length) { setError("No items in the cart"); return; }
    setShowPaymentConfirm(true);
  }

  async function handleCheckout() {
    setShowPaymentConfirm(false);
    setLoading(true);
    const selectedDay = pickupDays.find((d) => d.offset === pickupDayOffset);

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          collectionMethod: method,
          deliveryAddress:
            method === "delivery"
              ? address
              : `Pickup Station — ${selectedDay?.label ?? "Today"}, ${pickupSlot}`,
          customerPhone: method === "delivery" ? phoneNumber : undefined,
          paymentMethod: "manual_transfer",
          items: items.map((i: any) => ({
            productId: i.productId || i._id || i.id,
            name: i.name || i.title || "Product",
            image: i.image || (Array.isArray(i.images) ? i.images[0] : ""),
            price: Number(i.price) || 0,
            qty: Number(i.qty) || 1,
          })),
          latitude: method === "delivery" ? latitude : null,
          longitude: method === "delivery" ? longitude : null,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) { setError(data.error || "Order failed"); return; }

      const id = data.order?._id || data._id;
      localStorage.setItem("orderId", id);
      clearCart();
      router.push(method === "delivery" ? "/order" : "/pickup");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
      console.error(err);
    }
  }

  // ─── Store-closed banner for pickup card ─────────────────────────────────────
  const pickupCard = (
    <div
      onClick={() => storeOpen && setMethod("pickup")}
      className={`relative p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
        !storeOpen
          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
          : method === "pickup"
          ? "border-brand-primary bg-brand-primary/5 cursor-pointer"
          : "border-gray-100 hover:border-gray-200 cursor-pointer"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
          method === "pickup" && storeOpen ? "border-brand-primary" : "border-gray-300"
        }`}
      >
        {method === "pickup" && storeOpen && (
          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 block">Store Pickup</span>
          {!storeOpen && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
              <Lock size={9} /> CLOSED
            </span>
          )}
        </div>
        {storeOpen ? (
          <>
            <span className="text-sm text-gray-500">Pick up from our nearest station</span>
            {method === "pickup" && (
              <span className="text-sm text-brand-primary font-medium mt-1 block">
                Call 08023434790 when you arrive
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400">{closedMessage}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-display font-bold text-brand-dark mb-8 text-center md:text-left">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-8">

            {/* Delivery Method */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <Truck size={20} className="text-brand-primary" /> Delivery Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Delivery */}
                <div
                  onClick={() => setMethod("delivery")}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    method === "delivery"
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                      method === "delivery" ? "border-brand-primary" : "border-gray-300"
                    }`}
                  >
                    {method === "delivery" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Home Delivery</span>
                    <span className="text-sm text-gray-500">Delivered within 30–45 mins</span>
                  </div>
                </div>

                {/* Store Pickup — time-aware */}
                {pickupCard}
              </div>

              {/* Pickup Scheduler — only when store is open and pickup is selected */}
              <AnimatePresence>
                {method === "pickup" && storeOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-100 space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-brand-primary" />
                      <h3 className="text-md font-bold text-gray-900">Schedule Pickup Time</h3>
                    </div>

                    {/* Day selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Select Day
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {pickupDays.map((day) => (
                          <button
                            key={day.offset}
                            type="button"
                            disabled={!day.hasSlots}
                            onClick={() => handleDayChange(day.offset)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                              pickupDayOffset === day.offset
                                ? "border-brand-primary bg-brand-primary text-white"
                                : day.hasSlots
                                ? "border-gray-200 text-gray-700 hover:border-brand-primary/40"
                                : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                            }`}
                          >
                            {day.label}
                            {!day.hasSlots && (
                              <span className="block text-[10px] font-normal opacity-70">No slots</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time slot selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Select Time Slot
                      </label>
                      {availableSlots.length === 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
                          <AlertCircle size={16} />
                          No more pickup slots available today. Please select another day.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {ALL_PICKUP_SLOTS.map((slot) => {
                            const isAvailable = availableSlots.some((s) => s.label === slot.label);
                            return (
                              <button
                                key={slot.label}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => isAvailable && setPickupSlot(slot.label)}
                                className={`relative px-3 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-center ${
                                  pickupSlot === slot.label
                                    ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                                    : isAvailable
                                    ? "border-gray-200 text-gray-700 hover:border-brand-primary/40"
                                    : "border-dashed border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                                }`}
                              >
                                {slot.label}
                                {!isAvailable && (
                                  <span className="block text-[10px] font-normal opacity-60">Passed</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Real-time clock note */}
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      Slots update in real time. Current WAT time:{" "}
                      {now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Contact Info */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <User size={20} className="text-brand-primary" /> Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                  />
                </div>
                {method === "delivery" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Address
                        </label>
                        <Input
                          placeholder="123 Main Street"
                          value={address}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                          icon={<MapPin size={18} className="text-gray-400" />}
                        />
                      </div>
                      <CheckoutMap
                        latitude={latitude}
                        longitude={longitude}
                        onChange={(lat, lng, addr) => {
                          setLatitude(lat);
                          setLongitude(lng);
                          setAddress(addr);
                        }}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <Input
                          placeholder="08012345678"
                          value={phoneNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                          icon={<Phone size={18} className="text-gray-400" />}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-brand-primary" /> Payment
              </h2>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block">Bank Transfer (Manual)</span>
                  <span className="text-sm text-gray-500">
                    You will receive account details after placing order
                  </span>
                </div>
              </div>
              <Button
                onClick={handleIHavePaidClick}
                disabled={loading}
                className="w-full sm:w-auto py-3 px-6 shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShieldCheck size={18} /> I have paid</>
                )}
              </Button>
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-100 sticky top-28 border border-gray-100">
              <h3 className="text-xl font-bold text-brand-dark mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                        <img
                          src={item.image || "/placeholder-food.png"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-gray-600 line-clamp-1 max-w-[120px]">{item.name}</span>
                      <span className="text-xs text-gray-400">x{item.qty}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      ₦{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pickup summary pill */}
              {method === "pickup" && storeOpen && pickupSlot && (
                <div className="mb-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 flex items-start gap-2 text-sm">
                  <Store size={16} className="text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Store Pickup</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {pickupDays.find((d) => d.offset === pickupDayOffset)?.label} · {pickupSlot}
                    </p>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 my-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-brand-dark mt-4 pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}

              <Button
                className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl flex items-center justify-center gap-2"
                onClick={handleIHavePaidClick}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShieldCheck size={18} /> Place Order</>
                )}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Popup */}
      <AnimatePresence>
        {showPaymentConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !loading && setShowPaymentConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-gray-100"
            >
              <button
                onClick={() => setShowPaymentConfirm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ShieldCheck size={32} className="text-brand-primary" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Confirm Payment</h2>
              <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
                By clicking{" "}
                <strong className="text-gray-800">&ldquo;Yes, I&apos;ve Paid&rdquo;</strong>, you confirm
                that you have already transferred{" "}
                <strong className="text-brand-primary text-base">₦{total.toLocaleString()}</strong> to our
                account. Our team will verify your payment and begin packing your order.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  If payment is not verified, your order will not be processed. Ensure the exact amount was
                  transferred.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPaymentConfirm(false)}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  No, Go Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle size={18} /> Yes, I&apos;ve Paid</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
