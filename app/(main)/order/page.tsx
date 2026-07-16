"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pusherClient from "@/lib/pusher-client";
import { AuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Clock, Package, Truck, ShoppingBag,
  AlertTriangle, MapPin, ChevronRight, ChevronDown, PackageOpen,
  Calendar, User, Hash, History, Loader2, ReceiptText, Ban, Phone,
  CreditCard, CheckCircle2, ShieldAlert, Check, Copy, Store
} from "lucide-react";
import dynamic from "next/dynamic";

const RiderMapComponent = dynamic(
  () => import("@/components/RiderMapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full rounded-3xl bg-gray-50 flex items-center justify-center text-sm text-brand-muted border border-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-brand-primary" size={24} />
          <span>Loading Live Tracking Map...</span>
        </div>
      </div>
    )
  }
);

interface OrderItem {
  _id?: string;
  name?: string;
  productId?: {
    name?: string;
    price?: number;
    _id?: string;
  };
  price?: number;
  qty: number;
}

interface OrderType {
  _id: string;
  status: string;
  paymentStatus?: string;
  fulfilled: boolean;
  createdAt: string | Date;
  pickupName?: string;
  pickupCode?: string;
  deliveryAddress?: string;
  amount: number;
  items: OrderItem[];
  goodsStatus?: string;
  latitude?: number;
  longitude?: number;
  customerPhone?: string;
  collectionMethod?: string;
  assignedToWorkerId?: {
    name?: string;
    phone?: string;
  };
}

// ─── Helper Render Functions (Avoids static-component render nested issues) ───

function renderBarcode() {
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
}

function renderTicketStub(order: OrderType, copied: boolean, handleCopy: () => void) {
  return (
    <div className="relative bg-white border border-gray-150 rounded-3xl p-6 shadow-md overflow-hidden my-6">
      {/* Left ticket circle cutout */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border-r border-gray-150" />
      {/* Right ticket circle cutout */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border-l border-gray-150" />

      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Your Pickup Code</span>
        
        <div className="flex items-center gap-3 mt-2">
          <span className="text-4xl font-black font-mono tracking-wider text-brand-primary bg-rose-50/50 px-4 py-1.5 rounded-2xl border border-rose-100/50 shadow-inner">
            {order.pickupCode || "—"}
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
        {renderBarcode()}
        <span className="text-[10px] text-brand-muted">Show this code to the cashier at checkout</span>

        <div className="w-full border-t border-dashed border-gray-200 my-4" />

        <div className="w-full text-left grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[10px] text-brand-muted block font-bold uppercase tracking-wider">Customer Name</span>
            <span className="font-semibold text-brand-dark">{order.pickupName || "—"}</span>
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
  );
}

function renderFulfillmentTimeline(status: string, orderType: string) {
  const steps = orderType === "pickup" 
    ? [
        { id: "confirmed", label: "Confirmed", icon: CreditCard, description: "Order paid & confirmed" },
        { id: "packing", label: "Packing", icon: Package, description: "Staff packing items" },
        { id: "ready", label: "Ready", icon: Store, description: "Ready at pickup point" },
        { id: "collected", label: "Collected", icon: CheckCircle2, description: "Order picked up" }
      ]
    : [
        { id: "confirmed", label: "Confirmed", icon: CreditCard, description: "Order paid & confirmed" },
        { id: "packing", label: "Packing", icon: Package, description: "Staff packing items" },
        { id: "dispatched", label: "Dispatched", icon: Truck, description: "Rider out for delivery" },
        { id: "delivered", label: "Delivered", icon: CheckCircle2, description: "Package delivered" }
      ];

  let activeIndex = 0;
  if (status === "payment_pending" || status === "payment_declined" || status === "cancelled") {
    activeIndex = 0;
  } else if (status === "packing") {
    activeIndex = 1;
  } else if (status === "delivery_here" || status === "ready_for_pickup") {
    activeIndex = 2;
  } else if (status === "delivered" || status === "picked_up" || status === "completed") {
    activeIndex = 3;
  } else {
    activeIndex = 1;
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

function renderStatusBanner(order: OrderType, orderType: string) {
  const isCompleted = order.fulfilled || order.status === "delivered" || order.status === "picked_up";
  const effectiveStatus = isCompleted ? (orderType === "pickup" ? "picked_up" : "delivered") : order.status;
  
  const getStatusBannerInfo = () => {
    if (order.fulfilled || order.status === "delivered" || order.status === "picked_up") {
      return {
        bg: "bg-emerald-50/60",
        border: "border-emerald-100/80",
        text: "text-emerald-700",
        icon: CheckCircle2,
        label: orderType === "pickup" ? "Collected successfully!" : "Delivered successfully!"
      };
    }
    
    switch (order.status) {
      case "payment_pending":
        return {
          bg: "bg-amber-50/80 animate-pulse",
          border: "border-amber-200/40",
          text: "text-amber-700",
          icon: Clock,
          label: "Payment not received, verifying..."
        };
      case "payment_declined":
        return {
          bg: "bg-rose-50/80",
          border: "border-rose-200/40",
          text: "text-rose-700",
          icon: AlertTriangle,
          label: "Payment Verification Failed"
        };
      case "packing":
        return {
          bg: "bg-orange-50/80",
          border: "border-orange-200/40",
          text: "text-orange-700",
          icon: Package,
          label: "Packing your items..."
        };
      case "delivery_here":
        return {
          bg: "bg-blue-50/80 animate-pulse",
          border: "border-blue-200/50",
          text: "text-blue-700",
          icon: Truck,
          label: "Rider Arrived!"
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
          label: "Order Cancelled"
        };
      default:
        return {
          bg: "bg-amber-50/60",
          border: "border-amber-150",
          text: "text-amber-700",
          icon: Clock,
          label: "Preparing your order..."
        };
    }
  };

  const banner = getStatusBannerInfo();
  const Icon = banner.icon;

  return (
    <motion.div
      key={effectiveStatus}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 p-5 rounded-3xl border transition-all ${banner.bg} ${banner.border} shadow-sm shadow-gray-100`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 bg-white shadow-sm border-gray-100 ${banner.text}`}>
        <Icon size={24} className={order.status === "payment_pending" || order.status === "packing" ? "animate-pulse" : ""} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-extrabold text-base leading-tight ${banner.text}`}>{banner.label}</p>
        <p className="text-xs text-brand-muted mt-1.5 flex items-center gap-1.5">
          <Clock size={12} /> Status updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function renderInfoGrid(order: OrderType, orderType: string) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-3.5">
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><Calendar size={12} /> Date Ordered</p>
        <p className="text-sm font-bold text-brand-dark">{new Date(order.createdAt).toLocaleDateString()}</p>
        <p className="text-xs text-brand-muted mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-3.5">
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><User size={12} /> Recipient Name</p>
        <p className="text-sm font-bold text-brand-dark truncate">{order.pickupName || "—"}</p>
      </div>
      <div className="col-span-2 bg-slate-50/70 border border-slate-150 rounded-2xl p-3.5">
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><Hash size={12} /> Order Identifier</p>
        <p className="text-xs font-mono font-bold text-brand-dark truncate">#{order._id}</p>
      </div>
      {orderType === "delivery" && order.deliveryAddress && (
        <div className="col-span-2 bg-slate-50/70 border border-slate-150 rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><MapPin size={12} /> Delivery Destination</p>
          <p className="text-sm font-bold text-brand-dark leading-relaxed">{order.deliveryAddress}</p>
        </div>
      )}
    </div>
  );
}

const HIST_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  delivered:  { bg: "bg-green-50",  color: "text-green-700",  label: "Delivered"  },
  picked_up:  { bg: "bg-green-50",  color: "text-green-700",  label: "Picked Up"  },
  completed:  { bg: "bg-green-50",  color: "text-green-700",  label: "Completed"  },
  cancelled:  { bg: "bg-red-50",    color: "text-red-700",    label: "Cancelled"  },
  packing:    { bg: "bg-orange-50", color: "text-orange-700", label: "Packing"    },
  pending:    { bg: "bg-amber-50",  color: "text-amber-700",  label: "Pending"    },
};

function HistoryBadge({ status }: { status: string }) {
  const s = HIST_STATUS[status] || { bg: "bg-gray-100", color: "text-gray-600", label: status };
  return <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${s.bg} ${s.color} uppercase tracking-wider border border-current/10`}>{s.label}</span>;
}

function HistoryList({ token }: { token: string | null }) {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/orders/history", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setOrders(await res.json());
      } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin text-brand-primary" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-4">
        <PackageOpen size={38} />
      </div>
      <h3 className="text-lg font-bold text-brand-dark mb-1">No Orders Yet</h3>
      <p className="text-sm text-brand-muted mb-6">Place your first order to see history here.</p>
      <Link href="/products">
        <button className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20 cursor-pointer">Browse Products</button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map((order: OrderType, i: number) => (
        <motion.div
          key={order._id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300"
        >
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => setExpanded(prev => prev === order._id ? null : order._id)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${order.collectionMethod === "delivery" ? "bg-blue-50 border-blue-100 text-blue-500" : "bg-orange-50 border-orange-100 text-orange-500"}`}>
                {order.collectionMethod === "delivery" ? <Truck size={20} /> : <MapPin size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-brand-dark truncate">{order.collectionMethod === "pickup" ? "Store Pickup" : "Home Delivery"} — #{order.pickupCode || order._id?.slice(-6)}</p>
                <p className="text-xs text-brand-muted mt-1 flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                <div className="mt-2"><HistoryBadge status={order.status || (order.fulfilled ? "completed" : "pending")} /></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
              <span className="font-extrabold text-sm text-brand-primary">₦{order.amount?.toLocaleString()}</span>
              <span className="text-[11px] text-brand-muted font-semibold">{order.items?.length || 0} items</span>
              <ChevronDown size={16} className={`text-brand-muted transition-transform duration-300 ${expanded === order._id ? "rotate-180" : ""}`} />
            </div>
          </div>

          <AnimatePresence>
            {expanded === order._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100 space-y-4">
                  <div className="space-y-2.5">
                    {order.items?.map((item: OrderItem, j: number) => (
                      <div key={j} className="flex justify-between text-sm">
                        <span className="text-brand-secondary font-medium">{item.qty} × {item.productId?.name || item.name || "Product"}</span>
                        <span className="font-bold text-brand-dark">₦{((item.price || item.productId?.price || 0) * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-3.5 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Customer Contact</p>
                      <p className="font-bold text-brand-dark mt-0.5">{order.pickupName}</p>
                      {order.customerPhone && <p className="text-brand-muted mt-0.5">{order.customerPhone}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{order.collectionMethod === "delivery" ? "Delivery Destination" : "Pickup Code"}</p>
                      <p className="font-bold text-brand-dark mt-0.5">{order.collectionMethod === "delivery" ? (order.deliveryAddress || "—") : order.pickupCode}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page Component ───

export default function Order() {
  const router = useRouter();
  const { token: ctxToken } = useContext(AuthContext);
  
  // Lazy state initialization to avoid useEffect set-state warning
  const [orderType, setOrderType] = useState<"delivery" | "pickup">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      if (type === "pickup" || type === "delivery") {
        return type as "pickup" | "delivery";
      }
    }
    return "delivery";
  });

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = ctxToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  useEffect(() => { if (!token) router.push("/signin"); }, [token, router]);

  useEffect(() => {
    if (!token) return;
    async function fetchOrder() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/orders/latest/${orderType}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch order");
        setOrder(data);
      } catch (err: unknown) {
        setOrder(null);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === "active" && (orderType === "pickup" || orderType === "delivery")) fetchOrder();
  }, [token, orderType, activeTab]);

  useEffect(() => {
    if (!order?._id) return;
    const channel = pusherClient.subscribe(`order-${order._id}`);
    channel.bind("order:status", ({ orderId: id, status }: { orderId: string; status: string }) => {
      if (id === order._id) {
        setOrder((prev) => prev ? ({ ...prev, status }) : null);
      }
    });
    channel.bind("orderUpdated", (updatedOrder: OrderType) => {
      if (updatedOrder._id === order._id) setOrder(updatedOrder);
    });
    return () => { pusherClient.unsubscribe(`order-${order._id}`); };
  }, [order?._id]);

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
      setOrder((prev) => prev ? ({ ...prev, status: "cancelled", paymentStatus: "cancelled" }) : null);
    } catch {
      alert("Error cancelling order");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleComplete() {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order._id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to confirm completion");
      setOrder((prev) => prev ? ({ ...prev, status: orderType === "pickup" ? "picked_up" : "delivered", fulfilled: true }) : null);
    } catch (err) { console.error(err); }
  }

  const handleCopy = () => {
    if (!order?.pickupCode) return;
    navigator.clipboard.writeText(order.pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCancelled = order?.status === "cancelled" || order?.status === "payment_declined";
  const isCompleted = order?.fulfilled || order?.status === "delivered" || order?.status === "picked_up";
  const canConfirm = order && !isCompleted && !isCancelled && !["payment_pending", "packing"].includes(order.status);
  
  const isWideLayout = activeTab === "active" && order && !loading && !error;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-rose-50/60 via-slate-50 to-orange-50/20 pt-28 pb-20 px-4 sm:px-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className={`mx-auto transition-all duration-300 ${isWideLayout ? "max-w-6xl" : "max-w-xl"}`}>

        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-brand-dark flex items-center gap-3">
              <ShoppingBag size={28} className="text-brand-primary" /> My Orders
            </h1>
            <p className="text-sm text-brand-muted mt-1">Track your active orders and view past purchases.</p>
          </div>
        </div>

        {/* Delivery / Pickup / History Tab Switcher */}
        <div className="flex bg-white/90 backdrop-blur-md border border-gray-150 rounded-2xl p-1 mb-8 shadow-sm">
          {(["delivery", "pickup"] as const).map(type => (
            <button
              key={type}
              onClick={() => { setOrderType(type); setActiveTab("active"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-250 cursor-pointer border-0 bg-transparent ${
                orderType === type && activeTab === "active"
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/50"
              }`}
            >
              {type === "delivery" ? <Truck size={16} /> : <MapPin size={16} />}
              <span className="capitalize">{type}</span>
            </button>
          ))}
          <div className="w-px bg-gray-200 my-1 mx-1" />
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-250 cursor-pointer border-0 bg-transparent ${
              activeTab === "history"
                ? "bg-brand-dark text-white shadow-md"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/50"
            }`}
          >
            <History size={16} />
            History
          </button>
        </div>

        {/* ── Active Order Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab !== "history" && (
            <motion.div key="active" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3">
                  <Loader2 size={36} className="animate-spin text-brand-primary" />
                  <span className="text-sm font-bold text-brand-muted">Fetching your order status...</span>
                </div>
              ) : (error || !order) ? (
                <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-gray-150 shadow-md p-12 text-center max-w-xl mx-auto">
                  <div className="w-18 h-18 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 text-brand-primary">
                    <PackageOpen size={36} />
                  </div>
                  <h3 className="font-extrabold text-brand-dark text-lg mb-1">No Active Order</h3>
                  <p className="text-sm text-brand-muted mb-8 max-w-sm mx-auto">
                    {error === "No recent order found" || !error
                      ? `You have no active ${orderType} order right now.`
                      : error}
                  </p>
                  <Link href="/products">
                    <button className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-primary/20 cursor-pointer">Start Shopping</button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column (Fulfillment Stepper and tracking map) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Status Alert Banner */}
                    {renderStatusBanner(order, orderType)}
                    
                    {/* Progress details */}
                    {renderFulfillmentTimeline(order.status, orderType)}

                    {/* Rider or Dispatch notification */}
                    {orderType === "delivery" && order.status !== "delivered" && order.status !== "completed" && order.status !== "cancelled" && (
                      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
                            <Truck size={16} className="text-brand-primary animate-pulse" /> Live Delivery Route
                          </h3>
                          {order.assignedToWorkerId?.phone && (
                            <a
                              href={`tel:${order.assignedToWorkerId.phone}`}
                              className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-250/30 px-3.5 py-2 rounded-full flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
                            >
                              <Phone size={12} /> Call Rider ({order.assignedToWorkerId.name})
                            </a>
                          )}
                        </div>

                        {/* Route map layer */}
                        {order.latitude && order.longitude ? (
                          <div className="h-[320px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative z-0">
                            <RiderMapComponent destination={{ lat: order.latitude, lng: order.longitude }} />
                          </div>
                        ) : (
                          <div className="h-[120px] w-full rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center text-sm text-brand-muted border border-gray-100 px-4">
                            <Loader2 className="animate-spin text-brand-primary mb-2" size={20} />
                            <p className="font-semibold text-brand-dark">Assigning delivery rider...</p>
                            <p className="text-[11px] text-brand-muted mt-0.5">Live tracking will begin once your package is dispatched.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Store Operator updates message bubble style */}
                    {order.goodsStatus && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
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
                            &ldquo;{order.goodsStatus}&rdquo;
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column (Receipt, Details, and Call-to-actions) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Ticket Stub for Pickup / Details Grid for Delivery */}
                    {orderType === "pickup" ? (
                      renderTicketStub(order, copied, handleCopy)
                    ) : (
                      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6">
                        <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
                          <User size={14} /> Customer Details
                        </h4>
                        {renderInfoGrid(order, orderType)}
                      </div>
                    )}

                    {/* Invoice Receipt container */}
                    <div className="bg-white rounded-3xl border border-gray-150 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 space-y-6 relative overflow-hidden">
                      {/* Dotted border line styling */}
                      <div className="absolute top-0 left-0 right-0 h-1 flex justify-between gap-1 overflow-hidden opacity-30">
                        {Array.from({ length: 40 }).map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 rounded-full bg-brand-dark shrink-0" />
                        ))}
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                            <ReceiptText size={13} /> Order Receipt
                          </span>
                          <span className="text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 border border-brand-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {order.paymentStatus || "Paid"}
                          </span>
                        </div>

                        {/* Items listed */}
                        <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                          {order.items.map((it: OrderItem, i: number) => (
                            <div key={it.productId?._id || it._id || i} className="flex justify-between items-center text-sm gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center text-base shadow-sm font-semibold">
                                  🛍️
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-brand-dark leading-tight">{it.productId?.name || it.name || "Product"}</span>
                                  <span className="text-[11px] text-brand-muted mt-0.5">₦{(it.productId?.price || it.price || 0).toLocaleString()} each</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-bold bg-slate-50 px-2 py-1 rounded-lg border border-gray-150 text-brand-secondary shadow-sm">
                                  qty: {it.qty}
                                </span>
                                <span className="font-bold text-brand-dark text-right min-w-[70px]">
                                  ₦{((it.productId?.price || it.price || 0) * it.qty).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-dashed border-gray-200 my-5" />

                        {/* Fees and totals */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-brand-muted">
                            <span>Subtotal</span>
                            <span className="font-semibold text-brand-dark">₦{order.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-brand-muted">
                            <span>{orderType === "pickup" ? "Pickup Fee" : "Delivery Fee"}</span>
                            <span className="font-bold text-emerald-600 uppercase text-xs">Free</span>
                          </div>
                          <div className="w-full border-t border-dashed border-gray-250 my-3" />
                          <div className="flex justify-between items-center pt-1">
                            <p className="text-base font-black text-brand-dark">Grand Total:</p>
                            <p className="text-2xl font-black text-brand-primary font-display">₦{order.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Packing cancellation actions */}
                    {order.status === "packing" && (
                      <div className="bg-amber-50/50 rounded-3xl border border-amber-200/50 p-5 space-y-4">
                        <div className="flex gap-2">
                          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                          <div>
                            <p className="font-bold text-amber-950 text-sm">Cancel Order</p>
                            <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                              You can cancel your order and secure a refund only during the packing phase.
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleCancelOrder}
                          disabled={cancelLoading}
                          className="w-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/70 disabled:opacity-50 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer border-0"
                        >
                          {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : <><Ban size={15} /> Cancel Order & Refund</>}
                        </motion.button>
                      </div>
                    )}

                    {/* Collection confirmations */}
                    {canConfirm && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleComplete}
                        className="w-full bg-gradient-to-r from-brand-primary to-orange-600 text-white py-4 rounded-3xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20 cursor-pointer border-0"
                      >
                        <CheckCircle size={20} />
                        Confirm {orderType === "pickup" ? "Collection" : "Delivery"}
                      </motion.button>
                    )}

                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* ── History Tab ── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-extrabold text-brand-dark text-lg">Order History</h2>
                <Link href="/history" className="text-xs text-brand-primary font-bold flex items-center gap-1 hover:underline">
                  Full analytics <ChevronRight size={14} />
                </Link>
              </div>
              <HistoryList token={token} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
