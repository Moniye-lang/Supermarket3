"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pusherClient from "@/lib/pusher-client";
import { AuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Clock, XCircle, Package, Truck, ShoppingBag,
  AlertTriangle, MapPin, ChevronRight, ChevronDown, PackageOpen,
  Calendar, User, Hash, History, Loader2, ReceiptText, Ban, Phone
} from "lucide-react";
import dynamic from "next/dynamic";

const RiderMapComponent = dynamic(
  () => import("@/components/RiderMapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full rounded-2xl bg-gray-50 flex items-center justify-center text-sm text-gray-500 border border-gray-200">
        Loading Live Tracking Map...
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
    <div className="w-full mb-6 bg-gray-50 border border-gray-100 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfillment Progress</span>
        <span className="text-xs font-bold text-brand-primary">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200/50 rounded-full overflow-hidden p-[2px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-brand-primary to-orange-500 rounded-full"
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
  payment_pending:  { color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  Icon: Clock,        label: "Payment not received, please wait..." },
  payment_declined: { color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    Icon: XCircle,      label: "Payment Verification Failed"         },
  packing:          { color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", Icon: Package,      label: "Packing your items..."               },
  delivery_here:    { color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   Icon: Truck,        label: "Rider Arrived!"                       },
  ready_for_pickup: { color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   Icon: ShoppingBag,  label: "Ready for Pickup!"                   },
  cancelled:        { color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    Icon: Ban,          label: "Order Cancelled"                     },
  delivered:        { color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  Icon: CheckCircle,  label: "Delivered!"                          },
  picked_up:        { color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  Icon: CheckCircle,  label: "Picked Up!"                          },
  default:          { color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  Icon: Clock,        label: "Preparing your order..."             },
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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${meta.bg} ${meta.border} mb-6`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} border ${meta.border} shrink-0`}>
        <Icon size={20} className={effectiveStatus === "payment_pending" || effectiveStatus === "packing" ? "animate-pulse" : ""} />
      </div>
      <div>
        <p className={`font-bold text-sm ${meta.color}`}>{meta.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">Last updated: {new Date().toLocaleTimeString()}</p>
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
    <div className="flex items-center gap-0 mb-6 w-full">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0 ${
                done    ? "bg-green-500 border-green-500 text-white" :
                active  ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/30" :
                          "bg-white border-gray-200 text-gray-300"
              }`}>
                {done ? <CheckCircle size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              <p className={`text-[10px] font-semibold mt-1 text-center truncate w-full px-1 ${
                done || active ? "text-brand-dark" : "text-gray-400"
              }`}>{step.label}</p>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoGrid({ order, orderType }: { order: any; orderType: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1"><Calendar size={10} /> Date</p>
        <p className="text-sm font-semibold text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1"><User size={10} /> Name</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{order.pickupName || "—"}</p>
      </div>
      <div className="col-span-2 bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-3">
        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1 mb-1">
          <Hash size={10} /> {orderType === "pickup" ? "Pickup Code" : "Order Code"}
        </p>
        <p className="text-xl font-extrabold text-brand-primary tracking-widest">{order.pickupCode || "—"}</p>
      </div>
      {orderType === "delivery" && order.deliveryAddress && (
        <div className="col-span-2 bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1"><MapPin size={10} /> Delivery Address</p>
          <p className="text-sm font-semibold text-gray-800">{order.deliveryAddress}</p>
        </div>
      )}
    </div>
  );
}

function ItemsList({ order }: { order: any }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><ReceiptText size={12} /> Order Items</p>
      <div className="rounded-xl overflow-hidden border border-gray-100">
        {order.items.map((it: any, i: number) => (
          <div key={it.productId?._id || it._id || i} className={`flex justify-between items-center px-4 py-3 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div>
              <span className="font-medium text-gray-800">{it.productId?.name || it.name || "Product"}</span>
              <span className="text-gray-400 ml-2 text-xs">×{it.qty}</span>
            </div>
            <span className="font-bold text-gray-800">₦{((it.productId?.price || it.price || 0) * it.qty).toLocaleString()}</span>
          </div>
        ))}
        <div className="bg-brand-dark text-white flex justify-between items-center px-4 py-3">
          <span className="font-bold text-sm">Total</span>
          <span className="font-extrabold text-base">₦{order.amount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// History badge helper
const HIST_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  delivered:  { bg: "bg-green-100",  color: "text-green-700",  label: "Delivered"  },
  picked_up:  { bg: "bg-green-100",  color: "text-green-700",  label: "Picked Up"  },
  completed:  { bg: "bg-green-100",  color: "text-green-700",  label: "Completed"  },
  cancelled:  { bg: "bg-red-100",    color: "text-red-700",    label: "Cancelled"  },
  packing:    { bg: "bg-orange-100", color: "text-orange-700", label: "Packing"    },
  pending:    { bg: "bg-amber-100",  color: "text-amber-700",  label: "Pending"    },
};

function HistoryBadge({ status }: { status: string }) {
  const s = HIST_STATUS[status] || { bg: "bg-gray-100", color: "text-gray-600", label: status };
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>;
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
      <h3 className="text-lg font-bold text-gray-800 mb-1">No Orders Yet</h3>
      <p className="text-sm text-gray-500 mb-6">Place your first order to see history here.</p>
      <Link href="/products">
        <button className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-primary/90 transition-colors">Browse Products</button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {orders.map((order, i) => (
        <motion.div
          key={order._id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md hover:border-brand-primary/20 transition-all"
        >
          <div
            className="flex items-center justify-between px-4 py-3.5 cursor-pointer"
            onClick={() => setExpanded(prev => prev === order._id ? null : order._id)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${order.collectionMethod === "delivery" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-500"}`}>
                {order.collectionMethod === "delivery" ? <Truck size={18} /> : <MapPin size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{order.collectionMethod === "pickup" ? "Pickup" : "Delivery"} — #{order.pickupCode || order._id?.slice(-6)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                <div className="mt-1.5"><HistoryBadge status={order.status || (order.fulfilled ? "completed" : "pending")} /></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
              <span className="font-extrabold text-sm text-brand-primary">₦{order.amount?.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400">{order.items?.length || 0} items</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded === order._id ? "rotate-180" : ""}`} />
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
                <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-2 mb-3">
                    {order.items?.map((item: any, j: number) => (
                      <div key={j} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.qty}× {item.productId?.name || "Product"}</span>
                        <span className="font-semibold text-gray-800">₦{((item.price || item.productId?.price || 0) * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Customer</p>
                      <p className="font-semibold text-gray-700">{order.pickupName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">{order.collectionMethod === "delivery" ? "Delivery Address" : "Pickup Code"}</p>
                      <p className="font-semibold text-gray-700">{order.collectionMethod === "delivery" ? (order.deliveryAddress || "—") : order.pickupCode}</p>
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
  const [cancelLoading, setCancelLoading] = useState(false);

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
        const done = status === "delivered" || status === "picked_up" || status === "completed";
        if (done) setOrder((prev: any) => ({ ...prev, status }));
        else setOrder((prev: any) => ({ ...prev, status }));
      }
    });
    channel.bind("orderUpdated", (updatedOrder: any) => {
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
      setOrder((prev: any) => ({ ...prev, status: "cancelled", paymentStatus: "cancelled" }));
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
      setOrder((prev: any) => ({ ...prev, status: orderType === "pickup" ? "picked_up" : "delivered", fulfilled: true }));
    } catch (err) { console.error(err); }
  }

  const isCancelled = order?.status === "cancelled" || order?.status === "payment_declined";
  const isCompleted = order?.fulfilled || order?.status === "delivered" || order?.status === "picked_up";
  const canConfirm = order && !isCompleted && !isCancelled && !["payment_pending", "packing"].includes(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Page Header */}
        <div className="mb-6 pt-4">
          <h1 className="text-2xl font-extrabold text-brand-dark flex items-center gap-2">
            <ShoppingBag size={22} className="text-brand-primary" /> My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track your active orders and view past purchases.</p>
        </div>

        {/* Delivery / Pickup Segmented Control */}
        <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-4 shadow-sm">
          {(["delivery", "pickup"] as const).map(type => (
            <button
              key={type}
              onClick={() => { setOrderType(type); setActiveTab("active"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                orderType === type && activeTab === "active"
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type === "delivery" ? <Truck size={15} /> : <MapPin size={15} />}
              {type === "delivery" ? "Delivery" : "Pickup"}
            </button>
          ))}
          <div className="w-px bg-gray-100 my-1 mx-1" />
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "history"
                ? "bg-brand-dark text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History size={15} />
            History
          </button>
        </div>

        {/* ── Active Order Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab !== "history" && (
            <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 size={32} className="animate-spin text-brand-primary" />
                </div>
              ) : (error || !order) ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <PackageOpen size={30} />
                  </div>
                  <h3 className="font-bold text-gray-700 mb-1">No Active Order</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {error === "No recent order found" || !error
                      ? `You have no active ${orderType} order right now.`
                      : error}
                  </p>
                  <Link href="/products">
                    <button className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-primary/90 transition-colors">Shop Now</button>
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  {/* Title Row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                        {orderType === "delivery" ? <Truck size={18} /> : <MapPin size={18} />}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-gray-900 text-base capitalize">{orderType} Order</h2>
                        <p className="text-[11px] text-gray-400">#{order.pickupCode}</p>
                      </div>
                    </div>
                    <span className="text-lg font-extrabold text-brand-primary">₦{order.amount?.toLocaleString()}</span>
                  </div>

                  <StatusBanner order={order} orderType={orderType} />
                  
                  <FulfillmentProgressBar status={order.status} orderType={orderType} />

                  <ProgressStepper order={order} orderType={orderType} />

                  {orderType === "delivery" && order.status !== "delivered" && order.status !== "completed" && order.status !== "cancelled" && (
                    <div className="mb-6">
                      {order.assignedToWorkerId?.phone ? (
                        <a
                          href={`tel:${order.assignedToWorkerId.phone}`}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/25 cursor-pointer"
                        >
                          <Phone size={16} /> Call your Rider ({order.assignedToWorkerId.name})
                        </a>
                      ) : (
                        <div className="w-full bg-gray-50 text-gray-400 py-3 px-4 rounded-xl font-semibold text-xs text-center border border-gray-100">
                          ℹ️ Rider will be assigned once preparation is complete
                        </div>
                      )}
                    </div>
                  )}

                  {orderType === "delivery" && order.latitude && order.longitude && order.status !== "delivered" && order.status !== "completed" && order.status !== "cancelled" && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                        Live Delivery Route
                      </h3>
                      <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative z-0">
                        <RiderMapComponent destination={{ lat: order.latitude, lng: order.longitude }} />
                      </div>
                    </div>
                  )}

                  {order.goodsStatus && (
                    <div className="bg-brand-primary/5 rounded-2xl p-4 mb-5 border border-brand-primary/10 flex items-start gap-3">
                      <Package size={18} className="text-brand-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-brand-dark text-sm">Update from Store</p>
                        <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{order.goodsStatus}</p>
                      </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <InfoGrid order={order} orderType={orderType} />

                  {/* Items */}
                  <ItemsList order={order} />

                  {/* Cancel (packing only) */}
                  {order.status === "packing" && (
                    <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-xs text-amber-800 mb-3 font-medium flex items-center gap-1.5">
                        <AlertTriangle size={13} className="shrink-0" /> You can only cancel during packing.
                      </p>
                      <button
                        onClick={handleCancelOrder}
                        disabled={cancelLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : <><Ban size={14} /> Cancel Order & Payment</>}
                      </button>
                    </div>
                  )}

                  {/* Confirm Completion */}
                  {canConfirm && (
                    <button
                      onClick={handleComplete}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle size={16} />
                      Confirm {orderType === "pickup" ? "Pickup" : "Delivery"}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── History Tab ── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-gray-800">Order History</h2>
                <Link href="/history" className="text-xs text-brand-primary font-semibold flex items-center gap-1 hover:underline">
                  Full analytics <ChevronRight size={12} />
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
