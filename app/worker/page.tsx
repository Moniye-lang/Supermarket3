"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MapPin, Truck, ShieldCheck, LogOut, Loader2, Phone, MessageCircle, Navigation, X, Package, Send, BellRing, ThumbsUp, ThumbsDown, History, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import pusherClient from "@/lib/pusher-client";

let globalAudioCtx: AudioContext | null = null;

export default function Worker() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [code, setCode] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [workerStatus, setWorkerStatus] = useState("available");
  const [workerRole, setWorkerRole] = useState<"worker" | "rider" | null>(null);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Payment verification queue
  const [verifyingOrders, setVerifyingOrders] = useState<any[]>([]);
  const [paymentPopup, setPaymentPopup] = useState<any>(null); // order awaiting accept/decline
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // Goods status update
  const [goodsStatusModal, setGoodsStatusModal] = useState<any>(null); // order to update goods status
  const [goodsStatusText, setGoodsStatusText] = useState("");
  const [goodsStatusLoading, setGoodsStatusLoading] = useState(false);

  // Packing checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const API_URL = "";

  useEffect(() => {
    async function loadWorkerProfile() {
      try {
        const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/worker/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setWorkerStatus(data.status || "available");
          setWorkerRole(data.role || "worker");
        }
      } catch (err) {
        console.error("Error loading worker profile:", err);
      }
    }
    loadWorkerProfile();
  }, [API_URL]);

  async function updateStatus(newStatus: string) {
    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/worker/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setWorkerStatus(newStatus);
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  // Initialize and unlock audio context
  const initAudio = () => {
    try {
      if (!globalAudioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) globalAudioCtx = new AudioContextClass();
      }
      if (globalAudioCtx && globalAudioCtx.state === "suspended") {
        globalAudioCtx.resume().then(() => setAudioUnlocked(true));
      } else if (globalAudioCtx && globalAudioCtx.state === "running") {
        setAudioUnlocked(true);
      }
    } catch (e) {
      console.error("Audio init error", e);
    }
  };

  useEffect(() => {
    document.addEventListener("click", initAudio, { once: true });
    return () => document.removeEventListener("click", initAudio);
  }, []);

  const playChime = () => {
    try {
      initAudio();
      if (!globalAudioCtx) return;

      const playDing = (freq: number, startTime: number, duration: number) => {
        if (!globalAudioCtx) return;
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = globalAudioCtx.currentTime;
      playDing(1046.50, now, 0.8);
    } catch (err) {
      console.error("Audio playback failed", err);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/worker/orders?_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchCompletedOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/worker/orders?history=true&_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCompletedOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching completed orders:", err);
    }
  }, [API_URL]);

  const fetchVerifyingOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/verifying`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyingOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching verifying orders:", err);
    }
  }, [API_URL]);

  useEffect(() => {
    const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
    if (!token) {
      router.push("/workerlogin");
    } else {
      fetchOrders();
      fetchVerifyingOrders();
      fetchCompletedOrders();
    }
  }, [router, fetchOrders, fetchVerifyingOrders, fetchCompletedOrders]);

  // Real-time Pusher listeners + polling
  useEffect(() => {
    const channel = pusherClient.subscribe("admin-orders");

    const handleNewOrder = () => { fetchOrders(); playChime(); };
    const handleOrderStatus = ({ orderId, status }: { orderId: string; status: string }) => {
      if (status === "delivered" || status === "picked_up" || status === "completed" || status === "cancelled") {
        setOrders(prev => prev.filter(o => o._id !== orderId));
        setVerifyingOrders(prev => prev.filter(o => o._id !== orderId));
        if (paymentPopup && paymentPopup._id === orderId) setPaymentPopup(null);
      } else if (status === "packing") {
        fetchOrders(); fetchVerifyingOrders();
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      }
    };
    const handlePaymentVerification = (order: any) => {
      setVerifyingOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        if (!exists) return [order, ...prev];
        return prev;
      });
      setPaymentPopup(order);
      playChime();
    };
    const handleOrderUpdated = (updatedOrder: any) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      if (updatedOrder.paymentStatus === "verifying") fetchVerifyingOrders();
    };

    channel.bind("orderCreated", handleNewOrder);
    channel.bind("order:status", handleOrderStatus);
    channel.bind("paymentVerificationRequest", handlePaymentVerification);
    channel.bind("orderUpdated", handleOrderUpdated);

    const pollInterval = setInterval(() => { fetchOrders(); fetchVerifyingOrders(); }, 30000);

    return () => {
      pusherClient.unsubscribe("admin-orders");
      clearInterval(pollInterval);
    };
  }, [fetchOrders, fetchVerifyingOrders, paymentPopup]);

  // Handle payment accept/decline
  async function handlePaymentAction(order: any, action: "accept" | "decline") {
    setPaymentActionLoading(true);
    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${order._id}/confirm-payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setPaymentPopup(null);
      setVerifyingOrders(prev => prev.filter(o => o._id !== order._id));
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentActionLoading(false);
    }
  }

  // Handle goods status update
  async function handleGoodsStatusSend() {
    if (!goodsStatusModal || !goodsStatusText.trim()) return;
    setGoodsStatusLoading(true);
    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${goodsStatusModal._id}/goods-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ goodsStatus: goodsStatusText.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setOrders(prev => prev.map(o => o._id === goodsStatusModal._id ? { ...o, goodsStatus: goodsStatusText.trim() } : o));
      setGoodsStatusText("");
      setGoodsStatusModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGoodsStatusLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !code.trim()) return setMessage({ type: "error", text: "Enter the 4-digit code." });

    setConfirmLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/worker/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: selectedOrder._id, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm order");

      setMessage({ type: "success", text: "Order successfully fulfilled!" });
      setTimeout(() => {
        setSelectedOrder(null);
        setCode("");
        setMessage(null);
        fetchOrders();
        fetchCompletedOrders();
      }, 2000);

    } catch (err: any) {
      console.error("Confirm Error:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setConfirmLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const token = localStorage.getItem("workerToken") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("workerToken");
    localStorage.removeItem("token");
    router.push("/workerlogin");
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 sticky top-0 z-40">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-brand-dark">AM<span className="text-brand-primary">Stores</span></span>
            <span className="bg-brand-dark text-white text-xs px-2 py-0.5 rounded-md font-medium tracking-wide">
              {workerRole === "rider" ? "RIDER" : "PICKUP STAFF"}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Payment Verification Badge */}
            {verifyingOrders.length > 0 && (
              <button
                onClick={() => setPaymentPopup(verifyingOrders[0])}
                className="relative flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-full animate-pulse hover:animate-none hover:bg-amber-600 transition-colors"
              >
                <BellRing size={14} />
                {verifyingOrders.length} Payment{verifyingOrders.length > 1 ? "s" : ""} Pending
              </button>
            )}
            {/* Status Dropdown */}
            <select
              value={workerStatus}
              onChange={(e) => updateStatus(e.target.value)}
              className={`text-xs font-bold border rounded-full px-3 py-1.5 focus:outline-none transition-colors cursor-pointer ${
                workerStatus === "available" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                workerStatus === "busy" ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" :
                workerStatus === "break" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <option value="available">🟢 Available</option>
              <option value="busy">🟡 Busy</option>
              <option value="break">🔵 Break</option>
              <option value="offline">⚫ Offline</option>
            </select>
            <button
              onClick={playChime}
              className="flex items-center gap-2 text-brand-primary hover:text-brand-dark transition-colors text-sm font-medium bg-brand-primary/10 px-3 py-1.5 rounded-full"
            >
              Test Sound
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8 relative z-10 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              {workerRole === "rider" ? "🚚 Delivery Orders" : "📦 Pickup Orders"}
            </h1>
            <p className="text-gray-500">
              {workerRole === "rider"
                ? "Active deliveries assigned to you."
                : "Active in-store pickups assigned to you."}
            </p>
          </div>
        </div>

        {/* Shift Stats Summary Card */}
        {(() => {
          const totalCollections = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
          const completedCount = completedOrders.length;
          return (
            <div className="bg-gradient-to-r from-brand-dark to-brand-primary/95 text-white rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Award className="text-yellow-400" size={20} />
                  <span className="text-sm font-semibold uppercase tracking-wider text-white/80">Shift Summary</span>
                </div>
                <span className="bg-white/10 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">Today</span>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div>
                  <p className="text-xs text-white/70 font-medium">Fulfillments Completed</p>
                  <p className="text-3xl font-black mt-1">{completedCount} {workerRole === "rider" ? "Trips" : "Orders"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Total Value Processed</p>
                  <p className="text-3xl font-black mt-1">₦{totalCollections.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Role Stats Strip */}
        {(() => {
          const myOrders = orders.filter(o =>
            workerRole === "rider" ? o.collectionMethod === "delivery" : o.collectionMethod === "pickup"
          );
          const pendingCount = myOrders.filter(o => !o.fulfilled && o.status !== "packing").length;
          const packingCount = myOrders.filter(o => o.status === "packing").length;
          const totalCount = myOrders.length;
          return totalCount > 0 ? (
            <div className={`grid grid-cols-3 gap-3 mb-6 p-4 rounded-2xl border ${
              workerRole === "rider" ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"
            }`}>
              {[
                { label: "Total", value: totalCount, color: workerRole === "rider" ? "text-blue-700" : "text-orange-700" },
                { label: "Pending", value: pendingCount, color: "text-amber-700" },
                { label: "Packing", value: packingCount, color: "text-emerald-700" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          ) : null;
        })()}

        {/* Verifying Payments Banner */}
        {verifyingOrders.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <BellRing size={14} /> Awaiting Payment Verification
            </h2>
            {verifyingOrders.map(vo => (
              <motion.div
                key={vo._id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-amber-900 text-sm">Order #{vo.pickupCode} — {vo.pickupName}</p>
                  <p className="text-xs text-amber-700">
                    ₦{vo.amount?.toLocaleString()} · {vo.collectionMethod} ·{" "}
                    {new Date(vo.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentPopup(vo)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  Verify
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-primary w-10 h-10" />
          </div>
        ) : (() => {
          // Filter orders by this worker's role
          const myOrders = orders.filter(o =>
            workerRole === "rider" ? o.collectionMethod === "delivery" : o.collectionMethod === "pickup"
          );
          return myOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-500">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">All Caught Up!</h2>
            <p className="text-gray-500 mt-2">You have no active {workerRole === "rider" ? "delivery" : "pickup"} tasks at the moment.</p>
            <Button variant="ghost" className="mt-6 border border-gray-200" onClick={fetchOrders}>Refresh List</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order, idx) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order #{order.pickupCode}</span>
                        {order.collectionMethod === "delivery" ? (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1"><Truck size={12}/> Delivery</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1"><MapPin size={12}/> Pickup</span>
                        )}
                        {/* KDS Urgency Timer */}
                        {(() => {
                          const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                          if (mins > 30) return <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-black flex items-center gap-1">🔴 {mins}m overdue</span>;
                          if (mins > 15) return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">🟡 {mins}m ago</span>;
                          return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">🟢 {mins}m ago</span>;
                        })()}
                        {/* Status badge */}
                        {order.status === "packing" && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Package size={12} /> Packing
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{order.pickupName}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        🗓 {new Date(order.createdAt).toLocaleString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {order.goodsStatus && (
                        <p className="text-xs text-brand-primary mt-1 font-medium">📦 Last update: {order.goodsStatus}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand-primary">₦{order.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{order.items.length} items</p>
                    </div>
                  </div>

                  {/* Location Details */}
                  {order.collectionMethod === "delivery" && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-start gap-3">
                      <Navigation className="text-brand-primary mt-0.5 shrink-0" size={20} />
                      <div>
                        <p className="font-semibold text-gray-900">Delivery Address</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  )}

                  {/* Packing Checklist & Progress */}
                  {(() => {
                    const packedCount = order.items.filter((_: any, idx: number) => checkedItems[`${order._id}_${idx}`]).length;
                    const isAllPacked = packedCount === order.items.length;
                    const percent = Math.round((packedCount / (order.items.length || 1)) * 100);
                    return (
                      <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Package size={16} className="text-brand-primary" /> Item Packing Checklist
                          </h4>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${isAllPacked ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>
                            {packedCount} / {order.items.length} packed ({percent}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mb-3 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <ul className="divide-y divide-gray-200">
                          {order.items.map((it: any, idx: number) => {
                            const itemKey = `${order._id}_${idx}`;
                            const isChecked = !!checkedItems[itemKey];
                            return (
                              <li key={it._id || idx} className="py-2.5 flex justify-between items-center text-sm">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      setCheckedItems(prev => ({ ...prev, [itemKey]: e.target.checked }));
                                    }}
                                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                                  />
                                  <span className={isChecked ? "line-through text-gray-400 font-medium" : "text-gray-800 font-medium"}>
                                    {it.name || it.productId?.name || "Unnamed"} × <span className="font-bold text-brand-dark">{it.qty}</span>
                                  </span>
                                </label>
                                <span className="font-medium text-gray-700 text-xs">₦{((it.price || it.productId?.price) * it.qty).toLocaleString()}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {(order.customerPhone || order.customerId?.phone) && (
                      <>
                        <a href={`tel:${order.customerPhone || order.customerId?.phone}`} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center transition-colors">
                          <Phone size={20} />
                        </a>
                        <a href={`https://wa.me/${(order.customerPhone || order.customerId?.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl flex items-center justify-center transition-colors">
                          <MessageCircle size={20} />
                        </a>
                      </>
                    )}

                    {/* Send Goods Status */}
                    <button
                      onClick={() => { setGoodsStatusModal(order); setGoodsStatusText(order.goodsStatus || ""); }}
                      className="w-12 h-12 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center transition-colors"
                      title="Send goods status update"
                    >
                      <Send size={18} />
                    </button>

                    <Button onClick={() => setSelectedOrder(order)} className="flex-1 py-6 text-lg shadow-brand-primary/20 shadow-lg">
                      Verify & Complete
                    </Button>

                    {order.status === "packing" && order.collectionMethod === "delivery" && (
                      <Button
                        onClick={() => updateOrderStatus(order._id, "delivery_here")}
                        className="flex-1 py-6 ml-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Delivery Here
                      </Button>
                    )}
                    {order.status === "packing" && order.collectionMethod === "pickup" && (
                      <Button
                        onClick={() => updateOrderStatus(order._id, "ready_for_pickup")}
                        className="flex-1 py-6 ml-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Pickup Ready
                      </Button>
                    )}
                    {/* Fallback for legacy status */}
                    {order.status !== "packing" && order.collectionMethod === "delivery" && (
                      <Button
                        onClick={() => updateOrderStatus(order._id, "delivery_here")}
                        className="flex-1 py-6 ml-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Delivery Here
                      </Button>
                    )}
                    {order.status !== "packing" && order.collectionMethod === "pickup" && (
                      <Button
                        onClick={() => updateOrderStatus(order._id, "ready_for_pickup")}
                        className="flex-1 py-6 ml-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Pickup Ready
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )})()}

        {/* Completed History Section */}
        <div className="mt-8 border-t border-gray-150 pt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3 text-gray-700">
              <History size={20} className="text-brand-primary" />
              <span className="font-bold text-base">Completed Task History</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                {completedOrders.length}
              </span>
            </div>
            {showHistory ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {completedOrders.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">No completed tasks recorded yet.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {completedOrders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-white/60 border border-gray-100 rounded-2xl p-4 flex items-center justify-between text-sm shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-gray-400">#{order.pickupCode}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-black uppercase">Fulfilled</span>
                          </div>
                          <p className="font-semibold text-gray-800">{order.pickupName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Completed: {new Date(order.updatedAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">₦{order.amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{order.items?.length || 0} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* PAYMENT VERIFICATION POPUP */}
      <AnimatePresence>
        {paymentPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !paymentActionLoading && setPaymentPopup(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-gray-100"
            >
              <button
                onClick={() => setPaymentPopup(null)}
                disabled={paymentActionLoading}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-905 bg-gray-100 rounded-full p-2"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Payment Verification</h2>
              <p className="text-center text-gray-500 text-sm mb-5">
                Customer <strong className="text-gray-800">{paymentPopup.pickupName}</strong> claims to have paid for their order.
              </p>

              <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Order Code</span><span className="font-bold text-gray-900">#{paymentPopup.pickupCode}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-brand-primary">₦{paymentPopup.amount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{paymentPopup.collectionMethod}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Items</span><span className="font-medium">{paymentPopup.items?.length} item(s)</span></div>
              </div>

              <p className="text-xs text-center text-gray-400 mb-4">Verify via your payment platform before accepting. Only accept if payment is confirmed received.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePaymentAction(paymentPopup, "decline")}
                  disabled={paymentActionLoading}
                  className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {paymentActionLoading ? <Loader2 size={16} className="animate-spin" /> : <><ThumbsDown size={16} /> Decline</>}
                </button>
                <button
                  onClick={() => handlePaymentAction(paymentPopup, "accept")}
                  disabled={paymentActionLoading}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                >
                  {paymentActionLoading ? <Loader2 size={16} className="animate-spin" /> : <><ThumbsUp size={16} /> Accept</>}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-3">
                If declined: customer will be notified that payment was not received.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOODS STATUS MODAL */}
      <AnimatePresence>
        {goodsStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !goodsStatusLoading && setGoodsStatusModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-gray-100"
            >
              <button onClick={() => setGoodsStatusModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2">
                <X size={18} />
              </button>

              <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
                <Package size={26} />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Send Goods Update</h2>
              <p className="text-center text-gray-500 text-sm mb-5">
                Send a status message to <strong className="text-gray-800">{goodsStatusModal.pickupName}</strong> about their order.
              </p>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  "We are packing your items 📦",
                  "Your items are being freshly prepared 🍃",
                  "Packing complete, almost ready! ✅",
                  "Out of stock: 1 item substituted 🔄",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGoodsStatusText(preset)}
                    className="text-xs bg-gray-100 hover:bg-brand-primary/10 hover:text-brand-primary text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={goodsStatusText}
                onChange={(e) => setGoodsStatusText(e.target.value)}
                placeholder="Type a custom status message..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-brand-primary mb-4"
              />

              <Button
                onClick={handleGoodsStatusSend}
                disabled={goodsStatusLoading || !goodsStatusText.trim()}
                className="w-full py-3 flex items-center justify-center gap-2"
              >
                {goodsStatusLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Update</>}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERIFY & COMPLETE MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !confirmLoading && setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-gray-100"
            >
              <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-905 bg-gray-50 rounded-full p-2"><X size={20} /></button>

              <div className="text-center mb-6 pt-4">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Verify Order</h2>
                <p className="text-gray-500 mt-1">Ask <strong className="text-gray-900">{selectedOrder.pickupName}</strong> for their 4-digit code.</p>
              </div>

              {message && (
                <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message.type === "success" ? <CheckCircle size={16} /> : <span>⚠️</span>}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleConfirm}>
                <div className="mb-6">
                  <Input
                    type="text"
                    placeholder="4920"
                    value={code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    required
                    autoFocus
                    className="text-center tracking-[1em] text-3xl font-mono font-bold py-6 bg-gray-50 border-gray-200"
                  />
                </div>
                <Button type="submit" disabled={confirmLoading || code.length < 4} className="w-full py-6 text-lg">
                  {confirmLoading ? <Loader2 className="animate-spin" /> : "Confirm Fulfillment"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
