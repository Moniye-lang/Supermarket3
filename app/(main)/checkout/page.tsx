"use client";
import { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Truck, CreditCard, CheckCircle, User, ShieldCheck,
  Phone, X, AlertCircle, Clock, Store, Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import {
  isStoreOpen, nextOpeningMessage, getTodaySlots,
  ALL_PICKUP_SLOTS, getNowWAT, STORE_LAT, STORE_LNG,
  haversineKm, calcDeliveryFee,
} from "@/lib/storeHours";

// Load map only client-side — Leaflet needs the browser
const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-2xl bg-gray-50 animate-pulse flex items-center justify-center text-sm text-gray-400 border border-gray-200">
      Loading map…
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Checkout() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // Delivery state
  const [method, setMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [latitude, setLatitude]   = useState(7.3775);
  const [longitude, setLongitude] = useState(3.9470);
  const [deliveryFee, setDeliveryFee] = useState(() =>
    calcDeliveryFee(haversineKm(STORE_LAT, STORE_LNG, 7.3775, 3.9470))
  );
  const [distanceKm, setDistanceKm] = useState(() =>
    haversineKm(STORE_LAT, STORE_LNG, 7.3775, 3.9470)
  );

  // Pickup state
  const [now, setNow]             = useState<Date>(getNowWAT);
  const storeOpen                 = useMemo(() => isStoreOpen(now), [now]);
  const closedMessage             = useMemo(() => nextOpeningMessage(now), [now]);
  const todaySlots                = useMemo(() => getTodaySlots(now), [now]);
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

  // Cart
  const { clearCart, cart, totalPrice } = useContext(CartContext);
  const items = cart;
  const subtotal = totalPrice;
  const orderTotal = method === "delivery" ? subtotal + deliveryFee : subtotal;

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

  // Map callback
  function handleMapChange(lat: number, lng: number, addr: string, fee: number, dist: number) {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setDeliveryFee(fee);
    setDistanceKm(dist);
  }

  // Order flow
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  function handlePlaceOrder() {
    setError("");
    if (!customerName.trim()) { setError("Please enter your name"); return; }
    if (method === "delivery" && !address.trim()) { setError("Please set your delivery location on the map"); return; }
    if (method === "delivery" && !phoneNumber.trim()) { setError("Please enter your phone number"); return; }
    if (method === "pickup" && !pickupSlot) { setError("No pickup slots available today"); return; }
    if (!items.length) { setError("Your cart is empty"); return; }
    setShowConfirm(true);
  }

  async function handleCheckout() {
    setShowConfirm(false);
    setLoading(true);

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
          deliveryAddress: method === "delivery" ? address : `Store Pickup — Today, ${pickupSlot}`,
          customerPhone: phoneNumber || undefined,
          paymentMethod: "manual_transfer",
          deliveryFee: method === "delivery" ? deliveryFee : 0,
          items: items.map((i: any) => ({
            productId: i.productId || i._id || i.id,
            name: i.name || i.title || "Product",
            image: i.image || (Array.isArray(i.images) ? i.images[0] : ""),
            price: Number(i.price) || 0,
            qty: Number(i.qty) || 1,
          })),
          latitude:  method === "delivery" ? latitude  : null,
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
    }
  }

  // ─── Pickup card ─────────────────────────────────────────────────────────────
  const pickupCard = (
    <div
      onClick={() => storeOpen && todaySlots.length > 0 && setMethod("pickup")}
      className={`relative p-4 rounded-xl border-2 transition-all flex items-start gap-3
        ${!storeOpen || todaySlots.length === 0
          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
          : method === "pickup"
          ? "border-brand-primary bg-brand-primary/5 cursor-pointer"
          : "border-gray-100 hover:border-gray-200 cursor-pointer"
        }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0
        ${method === "pickup" && storeOpen ? "border-brand-primary" : "border-gray-300"}`}>
        {method === "pickup" && storeOpen && (
          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900">Store Pickup</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            FREE
          </span>
          {(!storeOpen || todaySlots.length === 0) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
              <Lock size={9} />
              {!storeOpen ? "CLOSED" : "NO SLOTS"}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {!storeOpen
            ? closedMessage
            : todaySlots.length === 0
            ? "All slots for today have passed"
            : "Same-day pickup · Call 08023434790 on arrival"}
        </span>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-display font-bold text-brand-dark mb-8 text-center md:text-left">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* ── Left: Form ──────────────────────────────────────────────── */}
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
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3
                    ${method === "delivery" ? "border-brand-primary bg-brand-primary/5" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0
                    ${method === "delivery" ? "border-brand-primary" : "border-gray-300"}`}>
                    {method === "delivery" && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Home Delivery</span>
                    <span className="text-sm text-gray-500">30–45 min · Fee based on distance</span>
                  </div>
                </div>

                {pickupCard}
              </div>

              {/* Pickup slot grid */}
              <AnimatePresence>
                {method === "pickup" && storeOpen && todaySlots.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-100 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-brand-primary" />
                      <p className="text-sm font-bold text-gray-800">
                        Today's Available Slots
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          WAT {now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_PICKUP_SLOTS.map((slot) => {
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
                                ? "border-gray-200 text-gray-700 hover:border-brand-primary/40"
                                : "border-dashed border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                              }`}
                          >
                            {slot.label}
                            {!available && <span className="block text-[9px] opacity-60 mt-0.5">Passed</span>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Contact + Delivery Map */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <User size={20} className="text-brand-primary" /> Contact &amp; Location
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
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <Input
                        placeholder="08012345678"
                        value={phoneNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                        icon={<Phone size={18} className="text-gray-400" />}
                      />
                    </div>

                    {/* Chowdeck-style map */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
                      <DeliveryMap
                        latitude={latitude}
                        longitude={longitude}
                        deliveryFee={deliveryFee}
                        distanceKm={distanceKm}
                        onChange={handleMapChange}
                      />
                    </div>
                  </motion.div>
                )}

                {method === "pickup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (optional)</label>
                    <Input
                      placeholder="08012345678"
                      value={phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                      icon={<Phone size={18} className="text-gray-400" />}
                    />
                  </div>
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
                  <span className="text-sm text-gray-500">You will receive account details after placing order</span>
                </div>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full sm:w-auto py-3 px-6 shadow-md flex items-center justify-center gap-2"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ShieldCheck size={18} /> I have paid</>
                }
              </Button>
            </section>
          </div>

          {/* ── Right: Summary ───────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-100 sticky top-28 border border-gray-100">
              <h3 className="text-xl font-bold text-brand-dark mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                        <img src={item.image || "/placeholder-food.png"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-gray-600 line-clamp-1 max-w-[110px]">{item.name}</span>
                      <span className="text-xs text-gray-400">×{item.qty}</span>
                    </div>
                    <span className="font-medium text-gray-900">₦{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Pickup summary */}
              {method === "pickup" && storeOpen && pickupSlot && (
                <div className="mb-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 flex items-start gap-2 text-sm">
                  <Store size={16} className="text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Store Pickup — Today</p>
                    <p className="text-gray-600 text-xs mt-0.5">{pickupSlot}</p>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 my-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₦{subtotal.toLocaleString()}</span>
                </div>

                {method === "delivery" ? (
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      Delivery
                      <span className="text-xs text-gray-400">({distanceKm.toFixed(1)} km)</span>
                    </span>
                    <span className="font-semibold text-violet-600">+₦{deliveryFee.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold text-brand-dark mt-4 pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>₦{orderTotal.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>
              )}

              <Button
                className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl flex items-center justify-center gap-2"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ShieldCheck size={18} /> Place Order</>
                }
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Secure Checkout
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
                <ShieldCheck size={32} className="text-brand-primary" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Confirm Payment</h2>
              <p className="text-gray-500 text-center text-sm mb-4 leading-relaxed">
                Confirm you have transferred{" "}
                <strong className="text-brand-primary text-base">₦{orderTotal.toLocaleString()}</strong>
                {" "}to our account. Our team will verify and begin packing.
              </p>

              {method === "delivery" && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-4 text-xs text-violet-800 text-center">
                  🛵 Delivery fee of <strong>₦{deliveryFee.toLocaleString()}</strong> is included in the total
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>If payment is not verified, your order will not be processed. Transfer the exact amount.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  No, Go Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle size={18} /> Yes, I've Paid</>
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
