"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pusherClient from "@/lib/pusher-client";
import { AuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Clock, XCircle, Package, Truck, ShoppingBag,
  MapPin, ChevronRight, ChevronDown, PackageOpen,
  Calendar, User, Hash, History, Loader2, ReceiptText, Phone
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

function FulfillmentProgressBar({ status, orderType }: { status: string; orderType: string }) {
  let percentage = 0;
  if (status === "payment_pending" || status === "payment_declined" || status === "cancelled") {
    percentage = 15;
  } else if (status === "packing") {
    percentage = 50;
  } else if (status === "delivery_here" || status === "ready_for_pickup") {
    percentage = 80;
  } else if (status === "delivered" || status === "picked_up" || status === "completed") {
    percentage = 100;
  } else {
    percentage = 30;
  }

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Fulfillment Status</span>
        <span className="text-xs font-extrabold text-brand-primary">{percentage}% Complete</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-[2px] border border-gray-100">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-brand-primary to-amber-500 rounded-full"
        />
      </div>
    </div>
  );
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STEPS_DELIVERY = [
  { key: "payment_pending", label: "Payment" },
  { key: "packing",         label: "Packing"  },
  { key: "delivery_here",   label: "Arrived"  },
  { key: "delivered",       label: "Delivered"},
];

const STATUS_STEPS_PICKUP = [
  { key: "payment_pending",  label: "Payment" },
  { key: "packing",          label: "Packing" },
  { key: "ready_for_pickup", label: "Ready"   },
  { key: "picked_up",        label: "Picked Up"},
];

function getStepIndex(status: string, orderType: string) {
  const steps = orderType === "pickup" ? STATUS_STEPS_PICKUP : STATUS_STEPS_DELIVERY;
  const idx = steps.findIndex(s => s.key === status);
  if (status === "delivered" || status === "picked_up") return steps.length - 1;
  return idx === -1 ? 0 : idx;
}

const STATUS_META: Record<string, { color: string; bg: string; border: string; Icon: any; label: string }> = {
  payment_pending:  { color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200/50",  Icon: Clock,        label: "Payment not received, verifying..." },
  payment_declined: { color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200/50",    Icon: XCircle,      label: "Payment Verification Failed"         },
  packing:          { color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200/50", Icon: Package,      label: "Packing your items..."               },
  delivery_here:    { color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200/50",   Icon: Truck,        label: "Rider Arrived!"                       },
  ready_for_pickup: { color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200/50",   Icon: ShoppingBag,  label: "Ready for Pickup!"                   },
  cancelled:        { color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200/50",    Icon: XCircle,      label: "Order Cancelled"                     },
  delivered:        { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200/50", Icon: CheckCircle,  label: "Delivered successfully!"            },
  picked_up:        { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200/50", Icon: CheckCircle,  label: "Collected successfully!"            },
  default:          { color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200/50",  Icon: Clock,        label: "Preparing your order..."             },
};

function getStatusMeta(status: string) {
  return STATUS_META[status] || STATUS_META["default"];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBanner({ order, orderType }: { order: any; orderType: string }) {
  const isCompleted = order.fulfilled || order.status === "delivered" || order.status === "picked_up";
  const effectiveStatus = isCompleted ? (orderType === "pickup" ? "picked_up" : "delivered") : order.status;
  const meta = getStatusMeta(effectiveStatus);
  const Icon = meta.Icon;

  return (
    <motion.div
      key={effectiveStatus}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 p-5 rounded-3xl border transition-all ${meta.bg} ${meta.border} shadow-sm shadow-gray-100`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${meta.bg} ${meta.color} ${meta.border}`}>
        <Icon size={24} className={effectiveStatus === "payment_pending" || effectiveStatus === "packing" ? "animate-pulse" : ""} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-extrabold text-base leading-tight ${meta.color}`}>{meta.label}</p>
        <p className="text-xs text-brand-muted mt-1.5 flex items-center gap-1.5">
          <Clock size={12} /> Status updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function ProgressStepper({ order, orderType }: { order: any; orderType: string }) {
  const isCompleted = order.fulfilled || order.status === "delivered" || order.status === "picked_up";
  const isCancelled = order.status === "cancelled" || order.status === "payment_declined";
  const steps = orderType === "pickup" ? STATUS_STEPS_PICKUP : STATUS_STEPS_DELIVERY;
  const currentIdx = isCompleted ? steps.length - 1 : getStepIndex(order.status, orderType);

  if (isCancelled) return null;

  return (
    <div className="flex items-center gap-0 w-full pt-2">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0 relative">
              {/* Stepper Node */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0 relative z-10 ${
                done    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10" :
                active  ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/25" :
                          "bg-white border-gray-200 text-brand-muted"
              }`}>
                {active && (
                  <span className="absolute -inset-1 rounded-full border border-brand-primary animate-ping opacity-60" />
                )}
                {done ? (
                  <CheckCircle size={16} className="stroke-[3px]" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              {/* Stepper Label */}
              <p className={`text-[10px] font-extrabold mt-2 text-center tracking-wide uppercase truncate w-full px-1 ${
                done ? "text-emerald-600" :
                active ? "text-brand-primary font-black" :
                "text-brand-muted"
              }`}>{step.label}</p>
            </div>
            {/* Connecting Bar */}
            {idx < steps.length - 1 && (
              <div className="flex-1 -mt-6 mx-0 relative z-0">
                <div className="h-1 w-full bg-gray-100 rounded-full" />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 h-1 bg-emerald-500 rounded-full" 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoGrid({ order, orderType }: { order: any; orderType: string }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5">
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><Calendar size={12} /> Date Ordered</p>
        <p className="text-sm font-bold text-brand-dark">{new Date(order.createdAt).toLocaleDateString()}</p>
        <p className="text-xs text-brand-muted mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5">
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><User size={12} /> Recipient Name</p>
        <p className="text-sm font-bold text-brand-dark truncate">{order.pickupName || "—"}</p>
      </div>
      {orderType === "delivery" && order.deliveryAddress && (
        <div className="col-span-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 mb-1"><MapPin size={12} /> Delivery Destination</p>
          <p className="text-sm font-bold text-brand-dark leading-relaxed">{order.deliveryAddress}</p>
        </div>
      )}
    </div>
  );
}

// History badge helper
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
  const [orders, setOrders] = useState<any[]>([]);
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
        <button className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20">Browse Products</button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map((order, i) => (
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
                    {order.items?.map((item: any, j: number) => (
                      <div key={j} className="flex justify-between text-sm">
                        <span className="text-brand-secondary font-medium">{item.qty} × {item.productId?.name || "Product"}</span>
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
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{order.collectionMethod === "delivery" ? "Delivery Destination" : "Pickup Details"}</p>
                      {order.collectionMethod === "delivery" ? (
                        <p className="font-bold text-brand-dark mt-0.5">{order.deliveryAddress || "—"}</p>
                      ) : (
                        <div className="space-y-0.5 mt-0.5">
                          <p className="font-bold text-brand-dark">Code: {order.pickupCode}</p>
                          {order.deliveryAddress && order.deliveryAddress.includes("Pickup Station (Time:") && (
                            <p className="font-semibold text-brand-primary text-[10px]">
                              Time: {order.deliveryAddress.replace("Pickup Station (Time: ", "").replace(")", "")}
                            </p>
                          )}
                        </div>
                      )}
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

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function Order() {
  const router = useRouter();
  const { token: ctxToken } = useContext(AuthContext);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (err: any) {
        setOrder(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === "active") fetchOrder();
  }, [token, orderType, activeTab]);

  useEffect(() => {
    if (!order?._id) return;
    const channel = pusherClient.subscribe(`order-${order._id}`);
    channel.bind("order:status", ({ orderId: id, status }: any) => {
      if (id === order._id) {
        setOrder((prev: any) => ({ ...prev, status }));
      }
    });
    channel.bind("orderUpdated", (updatedOrder: any) => {
      if (updatedOrder._id === order._id) setOrder(updatedOrder);
    });
    return () => { pusherClient.unsubscribe(`order-${order._id}`); };
  }, [order?._id]);


  async function handleComplete() {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order._id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to confirm completion");
      setOrder((prev: any) => ({ ...prev, status: orderType === "pickup" ? "picked_up" : "delivered", fulfilled: true }));
    } catch (err) { console.error(err); }
  }

  const isCancelled = order?.status === "cancelled" || order?.status === "payment_declined";
  const isCompleted = order?.fulfilled || order?.status === "delivered" || order?.status === "picked_up";
  const canConfirm = order && !isCompleted && !isCancelled && !["payment_pending", "packing"].includes(order.status);
  
  const isWideLayout = activeTab === "active" && order && !loading && !error;

  return (
    <div className="min-h-screen bg-brand-light pt-28 pb-20 px-4 sm:px-6">
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
        <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-8 shadow-sm">
          {(["delivery", "pickup"] as const).map(type => (
            <button
              key={type}
              onClick={() => { setOrderType(type); setActiveTab("active"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-250 ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-250 ${
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
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-md p-12 text-center max-w-xl mx-auto">
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
                    <button className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-primary/20">Start Shopping</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Prominent Code Banner on Top */}
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm shadow-brand-primary/5">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-primary/25">
                        <Hash size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider">
                          {orderType === "pickup" ? "Pickup Code" : "Order Code"}
                        </p>
                        <p className="text-3xl font-black text-brand-primary tracking-widest font-display mt-0.5">{order.pickupCode || "—"}</p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Fulfillment Method</p>
                      <p className="text-base font-extrabold text-brand-dark capitalize mt-0.5">{orderType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column (Fulfillment Stepper and tracking map) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Status Alert Banner */}
                    <StatusBanner order={order} orderType={orderType} />
                    
                    {/* Progress details */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                      <FulfillmentProgressBar status={order.status} orderType={orderType} />
                      <ProgressStepper order={order} orderType={orderType} />
                    </div>

                    {/* Rider or Dispatch notification */}
                    {orderType === "delivery" && order.status !== "delivered" && order.status !== "completed" && order.status !== "cancelled" && (
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
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

                    {/* Store Operator updates */}
                    {order.goodsStatus && (
                      <div className="bg-brand-primary/5 rounded-3xl p-5 border border-brand-primary/10 flex items-start gap-4 shadow-sm shadow-brand-primary/5">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 border border-brand-primary/10">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-brand-dark text-sm">Store Operator Update</p>
                          <p className="text-brand-secondary text-sm mt-1 leading-relaxed">{order.goodsStatus}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Receipt, Details, and Call-to-actions) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Invoice Receipt container */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 relative overflow-hidden">
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
                          {order.items.map((it: any, i: number) => (
                            <div key={it.productId?._id || it._id || i} className="flex justify-between items-start text-sm gap-2">
                              <div>
                                <p className="font-semibold text-brand-dark">{it.productId?.name || it.name || "Product"}</p>
                                <p className="text-xs text-brand-muted mt-0.5">Qty: {it.qty} × ₦{(it.productId?.price || it.price || 0).toLocaleString()}</p>
                              </div>
                              <span className="font-bold text-brand-dark shrink-0">₦{((it.productId?.price || it.price || 0) * it.qty).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-dashed border-gray-200 my-5" />

                        {/* Fees and totals */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between text-sm text-brand-muted">
                            <span>Subtotal</span>
                            <span>₦{order.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-brand-muted">
                            <span>Delivery Fee</span>
                            <span>₦0</span>
                          </div>
                          <div className="flex justify-between text-base font-extrabold text-brand-dark border-t border-gray-100 pt-3 mt-3">
                            <span>Grand Total</span>
                            <span className="text-xl text-brand-primary font-display font-extrabold">₦{order.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer & address specs */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                      <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <User size={14} /> Customer Details
                      </h4>
                      <InfoGrid order={order} orderType={orderType} />
                    </div>


                    {/* Collection confirmations */}
                    {canConfirm && (
                      <button
                        onClick={handleComplete}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-3xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-green-600/20 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <CheckCircle size={20} />
                        Confirm {orderType === "pickup" ? "Collection" : "Delivery"}
                      </button>
                    )}

                  </div>

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
