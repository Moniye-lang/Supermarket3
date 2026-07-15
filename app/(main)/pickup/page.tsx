"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pusherClient from "@/lib/pusher-client";
import useStoreCountdown from "@/hooks/useStoreCountdown";
import { motion } from "framer-motion";
import { 
  Check, 
  Copy, 
  ShoppingBag, 
  Package, 
  Store, 
  CheckCircle, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  ShieldAlert,
  CheckCircle2,
  CreditCard
} from "lucide-react";

function FulfillmentTimeline({ status }: { status: string }) {
  const steps = [
    { id: "confirmed", label: "Confirmed", icon: CreditCard, description: "Order paid & confirmed" },
    { id: "packing", label: "Packing", icon: Package, description: "Staff packing items" },
    { id: "ready", label: "Ready", icon: Store, description: "Ready at pickup point" },
    { id: "collected", label: "Collected", icon: CheckCircle2, description: "Order picked up" }
  ];

  // Determine current active step index
  let activeIndex = 0; // Confirmed
  if (status === "payment_pending" || status === "payment_declined" || status === "cancelled") {
    activeIndex = 0; // payment check
  } else if (status === "packing") {
    activeIndex = 1;
  } else if (status === "ready_for_pickup") {
    activeIndex = 2;
  } else if (status === "picked_up" || status === "delivered" || status === "completed") {
    activeIndex = 3;
  } else {
    activeIndex = 1; // default to preparing/packing
  }

  return (
    <div className="w-full mb-8 mt-4 bg-slate-50/50 border border-slate-100 rounded-3xl p-5 shadow-sm">
      <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-5">Fulfillment Status</h3>
      <div className="relative flex justify-between items-start">
        {/* Background connector line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-gray-200/70 rounded-full -z-10" />
        
        {/* Animated fill line */}
        <motion.div 
          className="absolute top-5 left-6 h-1 bg-gradient-to-r from-brand-primary via-orange-500 to-emerald-500 rounded-full -z-10"
          initial={{ width: "0%" }}
          animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div key={step.id} className="flex flex-col items-center w-1/4 relative text-center">
              {/* Node Circle */}
              <motion.div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    : isActive 
                      ? "bg-white border-brand-primary text-brand-primary shadow-md shadow-brand-primary/10 scale-105"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={isActive ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3px]" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </motion.div>

              {/* Step Labels */}
              <span className={`text-[11px] font-bold mt-2.5 tracking-tight ${
                isCompleted 
                  ? "text-emerald-600" 
                  : isActive 
                    ? "text-brand-primary" 
                    : "text-gray-400 font-medium"
              }`}>
                {step.label}
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5 leading-tight px-1 hidden sm:block">
                {step.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Pickup() {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { countdown, isOpen } = useStoreCountdown("08:00", "20:00");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!order?._id) return;
    const channel = pusherClient.subscribe(`order-${order._id}`);
    channel.bind("order:status", ({ orderId: id, status }: any) => {
      if (id === order._id) {
        if (status === "delivered" || status === "picked_up" || status === "completed") setOrder(null);
        else setOrder((prev: any) => ({ ...prev, status }));
      }
    });
    channel.bind("orderUpdated", (updatedOrder: any) => {
      if (updatedOrder._id === order._id) setOrder(updatedOrder);
    });
    return () => {
      pusherClient.unsubscribe(`order-${order._id}`);
    };
  }, [order?._id]);

  useEffect(() => {
    if (!token) { router.push("/signin"); return; }
    async function fetchPickupOrder() {
      try {
        const res = await fetch(`/api/orders/latest/pickup`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch pickup order");
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPickupOrder();
  }, [token, router]);

  async function handleCancelOrder() {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order and payment?")) return;
    try {
      setCancelLoading(true);
      const res = await fetch(`/api/orders/${order._id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to cancel order"); return; }
      alert("✅ Order cancelled successfully.");
      setOrder((prev: any) => ({ ...prev, status: "cancelled", paymentStatus: "cancelled" }));
    } catch (err) {
      alert("Error cancelling order");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleComplete(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to complete order");
      alert("✅ Pickup marked as successful!");
      setOrder(null);
    } catch (err) { console.error(err); }
  }

  const handleCopy = () => {
    if (!order?.pickupCode) return;
    navigator.clipboard.writeText(order.pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBannerInfo = () => {
    if (!order) return { bg: "bg-gray-50/50", border: "border-gray-150", text: "text-brand-muted", icon: Clock, label: "" };
    
    if (order.fulfilled || order.status === "delivered" || order.status === "picked_up") {
      return {
        bg: "bg-emerald-50/60",
        border: "border-emerald-100/80",
        text: "text-emerald-700",
        icon: CheckCircle2,
        label: "Collected"
      };
    }
    
    switch (order.status) {
      case "payment_pending":
        return {
          bg: "bg-amber-50/80 animate-pulse",
          border: "border-amber-200/40",
          text: "text-amber-700",
          icon: Clock,
          label: "Payment not received, please wait a few moments..."
        };
      case "payment_declined":
        return {
          bg: "bg-rose-50/80",
          border: "border-rose-200/40",
          text: "text-rose-700",
          icon: AlertTriangle,
          label: "Payment Verification Failed (Declined)"
        };
      case "packing":
        return {
          bg: "bg-orange-50/80",
          border: "border-orange-200/40",
          text: "text-orange-700",
          icon: Package,
          label: "Packing your items..."
        };
      case "ready_for_pickup":
        return {
          bg: "bg-emerald-50/80",
          border: "border-emerald-200/50",
          text: "text-emerald-700",
          icon: ShoppingBag,
          label: "Ready for Pickup!"
        };
      case "cancelled":
        return {
          bg: "bg-rose-50/80",
          border: "border-rose-200/40",
          text: "text-rose-700",
          icon: ShieldAlert,
          label: "Cancelled"
        };
      default:
        return {
          bg: "bg-blue-50/60",
          border: "border-blue-150",
          text: "text-blue-700",
          icon: Clock,
          label: "Preparing your order..."
        };
    }
  };

  const Barcode = () => {
    const bars = [2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3];
    return (
      <div className="flex items-center justify-center gap-[2px] h-8 opacity-40 hover:opacity-70 transition-opacity cursor-default my-3">
        {bars.map((width, idx) => (
          <div 
            key={idx} 
            className="h-full bg-brand-dark" 
            style={{ width: `${width}px` }} 
          />
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-slate-50 to-orange-50/30">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold text-brand-muted animate-pulse uppercase tracking-wider">Loading order details...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-rose-50 via-slate-50 to-orange-50/30 px-6">
      <div className="bg-white/80 backdrop-blur-md shadow-xl border border-rose-100 rounded-3xl p-6 text-center max-w-sm w-full">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-600 text-base font-bold">{error}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-rose-50 via-slate-50 to-orange-50/30 px-6">
      <div className="bg-white/80 backdrop-blur-md shadow-xl border border-gray-150 rounded-3xl p-6 text-center max-w-sm w-full">
        <ShoppingBag className="w-12 h-12 text-brand-muted mx-auto mb-3" />
        <p className="text-brand-dark text-base font-bold">No active pickup order found.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-brand-primary-hover shadow-sm">
          Browse Products
        </button>
      </div>
    </div>
  );

  const banner = getStatusBannerInfo();
  const BannerIcon = banner.icon;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-tr from-rose-50/60 via-slate-50 to-orange-50/20 px-4 py-12 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      
      {/* Top Helper Navigation Bar */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center px-2">
        <button 
          onClick={() => router.push("/dashboard")} 
          className="flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-primary transition-colors cursor-pointer group bg-transparent border-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Dashboard
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted/70">Order ID: #{order._id?.slice(-8)}</span>
      </div>

      {/* Main Glass Card Container */}
      <div className="backdrop-blur-xl bg-white/90 shadow-[0_20px_50px_rgba(173,52,62,0.06)] rounded-3xl p-6 sm:p-8 w-full max-w-lg border border-white/60 relative overflow-hidden">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-[100px] pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary mb-3">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tight">Pickup Order</h1>
        </div>

        {/* Store Open/Closed countdown badge */}
        <div className="flex flex-col items-center text-center mb-6 mt-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold border ${
              isOpen 
                ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                : "bg-rose-50 border-rose-100 text-rose-700"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              Store is {isOpen ? "OPEN" : "CLOSED"}
            </span>
            
            <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold bg-slate-50 border border-slate-150 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-brand-muted" />
              {isOpen ? `Closes in: ${countdown}` : `Opens in: ${countdown}`}
            </span>
          </div>
          
          {order.status !== "payment_pending" && order.status !== "payment_declined" && order.status !== "packing" && order.status !== "cancelled" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 bg-brand-primary/[0.02] text-brand-primary rounded-2xl border border-brand-primary/10 text-sm w-full flex gap-3 items-start text-left"
            >
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-brand-primary text-[14px]">Arrived at the Store?</p>
                <p className="text-brand-muted font-medium text-[13px] mt-0.5 leading-relaxed">
                  Please call our team at <span className="font-bold text-brand-primary underline decoration-2 decoration-brand-primary/30">08023434790</span> and we will bring your items directly to your vehicle or pickup point.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Status Alert Banner */}
        <div className={`p-4 rounded-2xl mb-6 border ${banner.bg} ${banner.border} flex items-center justify-center gap-3`}>
          <BannerIcon className={`w-5 h-5 shrink-0 ${order.status === "payment_pending" || order.status === "ready_for_pickup" ? "animate-pulse" : ""}`} />
          <span className={`text-sm font-semibold tracking-tight ${banner.text}`}>{banner.label}</span>
        </div>

        {/* Fulfillment Timeline */}
        <FulfillmentTimeline status={order.status} />

        {/* Store Staff Message Bubble */}
        {order.goodsStatus && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-50 border border-slate-150 rounded-2xl p-4 mb-6 flex items-start gap-3"
          >
            <div className="relative w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 font-bold text-xs border border-brand-primary/20">
              AM
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-50" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-brand-dark text-[11px] uppercase tracking-wider">Store Assistant</p>
                <span className="text-[10px] text-brand-muted">Live Update</span>
              </div>
              <p className="text-brand-secondary text-sm mt-1 font-medium leading-relaxed italic bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
                "{order.goodsStatus}"
              </p>
            </div>
          </motion.div>
        )}

        {/* Ticket Stub Pickup Code card */}
        <div className="relative bg-white border border-gray-150 rounded-3xl p-6 shadow-md overflow-hidden my-6">
          {/* Left ticket circle cutout */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border-r border-gray-150" />
          {/* Right ticket circle cutout */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border-l border-gray-150" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Your Pickup Code</span>
            
            <div className="flex items-center gap-3 mt-2">
              <span className="text-4xl font-black font-mono tracking-wider text-brand-primary bg-rose-50/50 px-4 py-1.5 rounded-2xl border border-rose-100/50 shadow-inner">
                {order.pickupCode}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2.5 rounded-xl bg-gray-50 border border-gray-150 hover:bg-gray-100 hover:text-brand-primary active:scale-95 transition-all text-brand-muted shadow-sm flex items-center justify-center cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 animate-bounce" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Custom Barcode */}
            <Barcode />
            <span className="text-[10px] text-brand-muted">Show this code to the cashier at checkout</span>

            <div className="w-full border-t border-dashed border-gray-200 my-4" />

            <div className="w-full text-left grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[10px] text-brand-muted block font-bold uppercase tracking-wider">Customer Name</span>
                <span className="font-semibold text-brand-dark">{order.pickupName}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-muted block font-bold uppercase tracking-wider">Collection Status</span>
                <span className={`font-semibold ${order.fulfilled ? "text-emerald-600" : "text-rose-500"}`}>
                  {order.fulfilled ? "Collected" : "Not Collected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Summary Section */}
        <div className="mt-8 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Items Order Summary</span>
            <span className="text-xs font-semibold text-brand-muted">{order.items.length} items</span>
          </div>
          <div className="bg-gray-50/50 border border-gray-150/70 rounded-2xl p-4 overflow-hidden shadow-inner">
            <ul className="divide-y divide-gray-150/50">
              {order.items.map((it: any, idx: number) => (
                <li key={it._id || idx} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-lg shadow-sm font-semibold">
                      🛍️
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-brand-dark leading-tight">{it.name || it.productId?.name || "Unnamed Item"}</span>
                      <span className="text-[11px] text-brand-muted mt-0.5">₦{it.price.toLocaleString()} each</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-gray-150 text-brand-secondary shadow-sm">
                      qty: {it.qty}
                    </span>
                    <span className="font-bold text-brand-dark text-right min-w-[70px]">
                      ₦{(it.price * it.qty).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Receipt Dashed Divider */}
            <div className="w-full border-t border-dashed border-gray-200 my-3" />
            
            <div className="flex justify-between items-center py-1">
              <p className="text-sm font-semibold text-brand-muted">Subtotal:</p>
              <p className="font-bold text-brand-dark">₦{order.amount.toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between items-center pb-1">
              <p className="text-sm font-semibold text-brand-muted">Pickup Fee:</p>
              <p className="font-bold text-emerald-600 text-sm uppercase">Free</p>
            </div>
            
            <div className="w-full border-t border-dashed border-gray-250 my-3" />
            
            <div className="flex justify-between items-center pt-1">
              <p className="text-base font-black text-brand-dark">Total Amount:</p>
              <p className="text-2xl font-black text-brand-primary">₦{order.amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {order.status === "packing" && (
          <div className="mt-6 mb-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/50">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                Cancellation is only permitted during the packing phase. Once marked ready, orders cannot be cancelled.
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCancelOrder} 
              disabled={cancelLoading} 
              className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/70 disabled:opacity-50 px-6 py-3 rounded-xl font-bold w-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {cancelLoading ? (
                <div className="w-5 h-5 border-2 border-rose-700/30 border-t-rose-700 rounded-full animate-spin" />
              ) : (
                "Cancel Order & Payment"
              )}
            </motion.button>
          </div>
        )}

        {order.status === "ready_for_pickup" && !order.fulfilled && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleComplete(order._id)} 
            className="mt-6 bg-gradient-to-r from-brand-primary to-orange-600 text-white px-6 py-4 rounded-xl font-bold w-full hover:shadow-lg hover:shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm Order Pickup
          </motion.button>
        )}
      </div>

      <p className="mt-8 text-xs text-brand-muted">
        Thank you for ordering with <span className="text-brand-primary font-bold">AMStores.</span>
      </p>
    </div>
  );
}
