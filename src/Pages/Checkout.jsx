import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Truck, Store, CreditCard, CheckCircle, MapPin, User, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [method, setMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const items = state?.items || [];
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const token = localStorage.getItem("token");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!token) navigate("/SignIn");
  }, [token, navigate]);

  const generateCode = () => Math.floor(1000 + Math.random() * 9000);

  async function handleCheckout() {
    setError("");

    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (method === "delivery" && !address.trim()) {
      setError("Please enter your delivery address");
      return;
    }
    if (!items.length) {
      setError("No items in the cart");
      return;
    }

    setLoading(true);
    const pickupCode = generateCode();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          code: pickupCode,
          collectionMethod: method,
          deliveryAddress: method === "delivery" ? address : "Pickup Station",
          paymentMethod: "manual_transfer",
          items: items.map((i) => ({ productId: i.productId || i._id, qty: i.qty })),
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

      // Simulate a success delay/animation if needed, or just navigate
      navigate(method === "delivery" ? "/Order" : "/Pickup", {
        state: { orderId: id, code: pickupCode, customerName }
      });

    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
      console.error(err);
    }
  }

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
                  <Input
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                {method === "delivery" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                    <Input
                      placeholder="123 Main Street, Apt 4B"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      icon={<MapPin size={18} className="text-gray-400" />}
                    />
                  </motion.div>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-brand-primary" /> Payment
              </h2>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block">Bank Transfer (Manual)</span>
                  <span className="text-sm text-gray-500">You will receive account details after placing order</span>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-100 sticky top-28 border border-gray-100">
              <h3 className="text-xl font-bold text-brand-dark mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => (
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

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}

              <Button
                className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl flex items-center justify-center gap-2"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} /> Place Order
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

