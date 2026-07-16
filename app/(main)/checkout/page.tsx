"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Truck, CreditCard, CheckCircle, MapPin, User, ShieldCheck, Phone, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CartContext } from "@/context/CartContext";
import dynamic from "next/dynamic";

const CheckoutMap = dynamic(() => import("@/components/CheckoutMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full rounded-2xl bg-gray-50 flex items-center justify-center text-sm text-gray-500 border border-gray-200">
      Loading Geographical Map...
    </div>
  )
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Checkout() {
  const router = useRouter();
  const [method, setMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [latitude, setLatitude] = useState(7.4332);
  const [longitude, setLongitude] = useState(3.9471);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const { clearCart, cart, totalPrice } = useContext(CartContext);

  const items = cart;
  const total = totalPrice;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!token) router.push("/signin");
  }, [token, router]);

  function handleIHavePaidClick() {
    setError("");
    if (!customerName.trim()) { setError("Please enter your name"); return; }
    if (method === "delivery" && !address.trim()) { setError("Please enter your delivery address"); return; }
    if (method === "delivery" && !phoneNumber.trim()) { setError("Please enter a phone number for delivery"); return; }
    if (!items.length) { setError("No items in the cart"); return; }
    setShowPaymentConfirm(true);
  }

  async function handleCheckout() {
    setShowPaymentConfirm(false);
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
          deliveryAddress: method === "delivery" ? address : "Pickup Station",
          customerPhone: method === "delivery" ? phoneNumber : undefined,
          paymentMethod: "manual_transfer",
          items: items.map((i: any) => ({ productId: i.productId || i._id, qty: i.qty })),
          latitude: method === "delivery" ? latitude : null,
          longitude: method === "delivery" ? longitude : null,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Order failed");
        return;
      }

      const id = data.order?._id || data._id;
      localStorage.setItem("orderId", id);
      clearCart();
      router.push(method === "delivery" ? "/order?type=delivery" : "/order?type=pickup");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-display font-bold text-brand-dark mb-8 text-center md:text-left">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-8">

            {/* Delivery Method */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <Truck size={20} className="text-brand-primary" /> Delivery Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setMethod("delivery")}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${method === "delivery" ? "border-brand-primary bg-brand-primary/5" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${method === "delivery" ? "border-brand-primary" : "border-gray-300"}`}>
                    {method === "delivery" && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Home Delivery</span>
                    <span className="text-sm text-gray-500">Delivered within 30-45 mins</span>
                  </div>
                </div>
                <div
                  onClick={() => setMethod("pickup")}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${method === "pickup" ? "border-brand-primary bg-brand-primary/5" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${method === "pickup" ? "border-brand-primary" : "border-gray-300"}`}>
                    {method === "pickup" && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Store Pickup</span>
                    <span className="text-sm text-gray-500">Pick up from our nearest station</span>
                    {method === "pickup" && <span className="text-sm text-brand-primary font-medium mt-1 block">Call 08023434790 when you arrive</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Info */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <User size={20} className="text-brand-primary" /> Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input placeholder="John Doe" value={customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)} />
                </div>
                {method === "delivery" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                        <Input placeholder="123 Main Street" value={address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)} icon={<MapPin size={18} className="text-gray-400" />} />
                      </div>
                      <CheckoutMap latitude={latitude} longitude={longitude} onChange={(lat, lng, addr) => { setLatitude(lat); setLongitude(lng); setAddress(addr); }} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <Input placeholder="08012345678" value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} icon={<Phone size={18} className="text-gray-400" />} />
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
                  <span className="text-sm text-gray-500">You will receive account details after placing order</span>
                </div>
              </div>
              <Button onClick={handleIHavePaidClick} disabled={loading} className="w-full sm:w-auto py-3 px-6 shadow-md flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldCheck size={18} /> I have paid</>}
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
                        <img src={item.image || "/placeholder-food.png"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-gray-600 line-clamp-1 max-w-[120px]">{item.name}</span>
                      <span className="text-xs text-gray-400">x{item.qty}</span>
                    </div>
                    <span className="font-medium text-gray-900">₦{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

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

              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}

              <Button className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl flex items-center justify-center gap-2" onClick={handleIHavePaidClick} disabled={loading}>
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldCheck size={18} /> Place Order</>}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setShowPaymentConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-gray-100"
            >
              <button onClick={() => setShowPaymentConfirm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-2 transition-colors">
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ShieldCheck size={32} className="text-brand-primary" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Confirm Payment</h2>
              <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
                By clicking <strong className="text-gray-800">&ldquo;Yes, I&apos;ve Paid&rdquo;</strong>, you confirm that you have already transferred{" "}
                <strong className="text-brand-primary text-base">₦{total.toLocaleString()}</strong> to our account.
                Our team will verify your payment and begin packing your order.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>If payment is not verified, your order will not be processed. Ensure the exact amount was transferred.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShowPaymentConfirm(false)} className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                  No, Go Back
                </button>
                <button onClick={handleCheckout} disabled={loading} className="flex-1 py-3 px-6 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={18} /> Yes, I&apos;ve Paid</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
