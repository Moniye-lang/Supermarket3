"use client";
import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { Search, Eye, MapPin, Truck, CheckCircle, Clock, AlertCircle, RefreshCw, BellRing, ThumbsUp, ThumbsDown, Send, Package, X, ShieldCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { socket } from "@/socket";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";

let globalAudioCtx: AudioContext | null = null;

export default function AdminOrdersPage() {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const retryCountRef = useRef(0);
  const pollIntervalRef = useRef<any>(null);

  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Payment verification
  const [verifyingOrders, setVerifyingOrders] = useState<any[]>([]);
  const [paymentPopup, setPaymentPopup] = useState<any>(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // Goods status
  const [goodsStatusModal, setGoodsStatusModal] = useState<any>(null);
  const [goodsStatusText, setGoodsStatusText] = useState("");
  const [goodsStatusLoading, setGoodsStatusLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com";

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
      initAudio(); // ensure it's initialized
      if (!globalAudioCtx) return;
      
      const playDing = (freq: number, startTime: number, duration: number) => {
        if (!globalAudioCtx) return;
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Bell/chime envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01); // Quick attack
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Smooth decay
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = globalAudioCtx.currentTime;
      playDing(1046.50, now, 0.8); 
    } catch (err) {
      console.error("Audio playback failed", err);
    }
  };

  const loadWorkers = useCallback(async () => {
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWorkers(data.filter((u: any) => u.role === "worker" || u.role === "rider"));
      }
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  }, [token, API_URL]);

  const loadVerifyingOrders = useCallback(async () => {
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/orders/verifying`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok) setVerifyingOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching verifying orders:", err);
    }
  }, [token, API_URL]);

  const loadOrders = useCallback(async (isSilent = false) => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return;

    try {
      if (!isSilent) setLoading(true);
      const res = await fetch(`${API_URL}/api/orders?_t=${Date.now()}`, {
        headers: { 
            Authorization: `Bearer ${currentToken}`,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        }
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch orders:", data);
        setError(data.error || "Failed to load orders");
        setOrders([]);
        return;
      }
      const fetchedOrders = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
      setOrders(fetchedOrders);
      retryCountRef.current = 0; // reset retry counter on success
      
      // Update selectedOrder if it is open
      setSelectedOrder((prev: any) => {
        if (!prev) return null;
        const fresh = fetchedOrders.find((o: any) => o._id === prev._id);
        return fresh || prev;
      });

      setError(null);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      if (retryCountRef.current < 3) {
        retryCountRef.current += 1;
        const delay = 3000 * retryCountRef.current;
        console.log(`Retrying in ${delay / 1000}s... (attempt ${retryCountRef.current}/3)`);
        setTimeout(() => loadOrders(true), delay);
        if (!isSilent) setError(`Server is waking up, retrying... (${retryCountRef.current}/3)`);
      } else {
        setError("Failed to connect to server. Click Refresh to try again.");
      }
    } finally {
      if (!isSilent) setLoading(false);
      setIsRefreshing(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return;

    loadOrders();
    loadWorkers();
    loadVerifyingOrders();

    const handleUpdate = () => { loadOrders(true); loadVerifyingOrders(); };
    const handleNewOrder = () => {
      loadOrders(true);
      loadVerifyingOrders();
      playChime();
    };
    const handlePaymentVerification = (order: any) => {
      setVerifyingOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        return exists ? prev : [order, ...prev];
      });
      setPaymentPopup(order);
      playChime();
    };

    const onConnect = () => {
      console.log("Admin Socket Connected!");
      loadOrders(true);
      loadVerifyingOrders();
    };
    const onDisconnect = () => console.log("Admin Socket Disconnected!");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("orderCreated", handleNewOrder);
    socket.on("orderUpdated", handleUpdate);
    socket.on("order:status", handleUpdate);
    socket.on("paymentVerificationRequest", handlePaymentVerification);
    socket.on("workerStatusChanged", () => loadWorkers());

    if (!socket.connected) {
      socket.connect();
    }

    pollIntervalRef.current = setInterval(() => { loadOrders(true); loadVerifyingOrders(); }, 30000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("orderCreated", handleNewOrder);
      socket.off("orderUpdated", handleUpdate);
      socket.off("order:status", handleUpdate);
      socket.off("paymentVerificationRequest", handlePaymentVerification);
      socket.off("workerStatusChanged");
      clearInterval(pollIntervalRef.current);
    };
  }, [token, API_URL, loadOrders, loadWorkers, loadVerifyingOrders]);

  async function handleManualRefresh() {
    setIsRefreshing(true);
    retryCountRef.current = 0;
    setError(null);
    await loadOrders(false);
    loadWorkers();
    loadVerifyingOrders();
  }

  async function handlePaymentAction(order: any, action: "accept" | "decline") {
    setPaymentActionLoading(true);
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/orders/${order._id}/confirm-payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPaymentPopup(null);
      setVerifyingOrders(prev => prev.filter(o => o._id !== order._id));
      loadOrders(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentActionLoading(false);
    }
  }

  async function handleGoodsStatusSend() {
    if (!goodsStatusModal || !goodsStatusText.trim()) return;
    setGoodsStatusLoading(true);
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/orders/${goodsStatusModal._id}/goods-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({ goodsStatus: goodsStatusText.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGoodsStatusText("");
      setGoodsStatusModal(null);
      loadOrders(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGoodsStatusLoading(false);
    }
  }

  async function assignOrder(orderId: string, workerId: string) {
    const currentToken = token || localStorage.getItem("token");
    try {
      setAssigningId(orderId);
      const res = await fetch(`${API_URL}/api/orders/${orderId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign worker");
      
      loadOrders(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setAssigningId(null);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    if (!confirm(`Change order status to ${newStatus}?`)) return;
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      loadOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(o => {
    const matchesSearch = !searchTerm || 
                          o.pickupName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.pickupCode?.toString().includes(searchTerm);
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "completed") {
      matchesStatus = o.status === "completed" || o.status === "delivered" || o.status === "picked_up" || o.fulfilled;
    } else if (statusFilter === "processing") {
      matchesStatus = o.status === "processing" || (o.status === "pending" && o.assignedToWorkerId);
    } else {
      matchesStatus = o.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
        case "pending": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> Pending</span>;
        case "processing": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12}/> Processing</span>;
        case "packing": return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Package size={12}/> Packing</span>;
        case "payment_pending": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold w-fit animate-pulse">⏳ Verifying Payment</span>;
        case "payment_declined": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold w-fit">❌ Payment Declined</span>;
        case "completed":
        case "delivered":
        case "picked_up": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Completed</span>;
        case "cancelled": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold w-fit">Cancelled</span>;
        default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and update customer orders</p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing || loading}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <RefreshCw size={16} className={isRefreshing || loading ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Payment Verification Banner */}
      {verifyingOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <BellRing size={14} /> {verifyingOrders.length} Payment{verifyingOrders.length > 1 ? "s" : ""} Awaiting Verification
          </h2>
          {verifyingOrders.map(vo => (
            <motion.div
              key={vo._id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-gray-700"
            >
              <div>
                <p className="font-bold text-amber-900 text-sm">#{vo.pickupCode} — {vo.pickupName}</p>
                <p className="text-xs text-amber-700">₦{vo.amount?.toLocaleString()} · {vo.collectionMethod} · {new Date(vo.createdAt).toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => setPaymentPopup(vo)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition-colors cursor-pointer"
              >
                Verify Payment
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 w-full max-w-md">
            <Input 
                placeholder="Search by name or order code..." 
                icon={<Search size={18} className="text-gray-400" />}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {["all", "pending", "processing", "completed"].map(status => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === status 
                        ? "bg-brand-primary text-white shadow-md font-bold" 
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-300 w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-gray-900">No orders found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th className="p-4 pl-6">Order Code</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Method & Location</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Assigned Worker</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredOrders.map(order => {
                            const totalAmount = order.items?.reduce((sum: number, item: any) => sum + ((item.price || item.productId?.price || 0) * item.qty), 0) || 0;
                            
                            return (
                                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 pl-6 font-mono font-bold text-gray-900">
                                        #{order.pickupCode}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-semibold text-gray-900">{order.customerName || order.pickupName}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {order.collectionMethod === "delivery" ? (
                                                <Truck size={14} className="text-blue-500 shrink-0" />
                                            ) : (
                                                <MapPin size={14} className="text-orange-500 shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium capitalize text-gray-900">{order.collectionMethod}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1 w-40" title={order.deliveryAddress}>
                                                    {order.deliveryAddress}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="p-4 text-gray-700">
                                        <select 
                                            className={`text-xs border rounded-lg p-2 bg-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer ${
                                                order.assignedToWorkerId ? "border-brand-primary/45 font-bold text-brand-dark" : "border-gray-200 text-gray-500"
                                            }`}
                                            value={order.assignedToWorkerId?._id || order.assignedToWorkerId || ""}
                                            disabled={assigningId === order._id}
                                            onChange={(e) => assignOrder(order._id, e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            {workers
                                                .filter(w => {
                                                    const requiredRole = order.collectionMethod === "delivery" ? "rider" : "worker";
                                                    return w.role === requiredRole;
                                                })
                                                .map(w => (
                                                    <option key={w._id} value={w._id}>
                                                        {w.name} ({w.status || "available"})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">
                                        ₦{totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <Button variant="ghost" size="icon" className="bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                            <Eye size={16} />
                                          </Button>
                                          {!["completed", "delivered", "picked_up", "cancelled", "payment_pending", "payment_declined"].includes(order.status) && (
                                            <Button variant="ghost" size="icon" className="bg-purple-100 hover:bg-purple-200 text-purple-600 cursor-pointer" 
                                              onClick={() => { setGoodsStatusModal(order); setGoodsStatusText(order.goodsStatus || ""); }}
                                              title="Send goods status">
                                              <Package size={16} />
                                            </Button>
                                          )}
                                          {order.collectionMethod === "delivery" && !["completed", "delivered", "picked_up", "cancelled"].includes(order.status) && (
                                            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700 ml-2 cursor-pointer" onClick={() => updateOrderStatus(order._id, "delivery_here")}>
                                              Delivery Here
                                            </Button>
                                          )}
                                          {order.collectionMethod === "pickup" && !["completed", "delivered", "picked_up", "cancelled"].includes(order.status) && (
                                            <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700 ml-2 cursor-pointer" onClick={() => updateOrderStatus(order._id, "ready_for_pickup")}>
                                              Pickup Ready
                                            </Button>
                                          )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                onClick={() => setSelectedOrder(null)}
            />
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl relative z-10 border border-gray-100 max-h-[85vh] overflow-y-auto flex flex-col text-gray-700">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Order Details #{selectedOrder.pickupCode}</h2>
                        <p className="text-xs text-gray-500 font-medium">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedOrder(null)} 
                        className="text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Left: Info */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                            <h3 className="font-bold text-sm text-gray-900">Customer Info</h3>
                            <p className="text-sm"><strong className="text-gray-600">Name:</strong> {selectedOrder.customerName || selectedOrder.pickupName}</p>
                            {selectedOrder.customerPhone && (
                                <p className="text-sm"><strong className="text-gray-600">Phone:</strong> {selectedOrder.customerPhone}</p>
                            )}
                            <p className="text-sm capitalize"><strong className="text-gray-600">Method:</strong> {selectedOrder.collectionMethod}</p>
                            {selectedOrder.collectionMethod === "delivery" && (
                                <p className="text-sm"><strong className="text-gray-600">Address:</strong> {selectedOrder.deliveryAddress}</p>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                            <h3 className="font-bold text-sm text-gray-900">Items Ordered</h3>
                            <div className="divide-y divide-gray-200">
                                {selectedOrder.items?.map((it: any, idx: number) => (
                                    <div key={idx} className="py-2 flex justify-between text-sm">
                                        <span className="text-gray-700">
                                            {it.name || it.productId?.name || "Product"} × <strong>{it.qty}</strong>
                                        </span>
                                        <span className="font-bold text-gray-900">
                                            ₦{((it.price || it.productId?.price || 0) * it.qty).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                                <span>Total Amount:</span>
                                <span>₦{selectedOrder.amount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Operational dispatch & Logs */}
                    <div className="space-y-4 flex flex-col">
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                            <h3 className="font-bold text-sm text-gray-900">Assignment Controller</h3>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-bold block">Assigned Staff</label>
                                <select 
                                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-brand-primary font-medium"
                                    value={selectedOrder.assignedToWorkerId?._id || selectedOrder.assignedToWorkerId || ""}
                                    onChange={(e) => assignOrder(selectedOrder._id, e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {workers
                                        .filter(w => {
                                            const requiredRole = selectedOrder.collectionMethod === "delivery" ? "rider" : "worker";
                                            return w.role === requiredRole;
                                        })
                                        .map(w => (
                                            <option key={w._id} value={w._id}>
                                                {w.name} ({w.status || "available"})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500 block">Mode</span>
                                    <span className="font-bold capitalize bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                        {selectedOrder.assignmentMode || "None"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Assignment Status</span>
                                    <span className={`font-bold capitalize px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                        selectedOrder.assignmentStatus === "assigned" ? "bg-green-100 text-green-700" :
                                        selectedOrder.assignmentStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                    }`}>
                                        {selectedOrder.assignmentStatus || "unassigned"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Audit Logs */}
                        <div className="bg-gray-50 rounded-2xl p-4 flex-1 border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-sm text-gray-900 mb-3">Operational logs & history</h3>
                            <div className="flex-1 overflow-y-auto space-y-3 max-h-[200px] pr-1">
                                {(!selectedOrder.reassignmentHistory || selectedOrder.reassignmentHistory.length === 0) ? (
                                    <p className="text-xs text-gray-400 italic">No operational logs recorded yet.</p>
                                ) : (
                                    <div className="relative border-l-2 border-brand-primary/20 pl-4 space-y-4 ml-1.5 py-1">
                                        {selectedOrder.reassignmentHistory.map((log: any, lIdx: number) => (
                                            <div key={lIdx} className="relative text-xs">
                                                {/* Bullet dot */}
                                                <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border-2 border-white" />
                                                <p className="font-medium text-gray-800 leading-tight">{log.logMessage}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.assignedAt).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-end">
                    <Button onClick={() => setSelectedOrder(null)} className="px-6 cursor-pointer">Close</Button>
                </div>
            </div>
        </div>
      )}

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
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-gray-100 text-gray-700"
            >
              <button
                onClick={() => setPaymentPopup(null)}
                disabled={paymentActionLoading}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-905 bg-gray-100 rounded-full p-2 cursor-pointer"
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
                  className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {paymentActionLoading ? <Loader2 size={16} className="animate-spin" /> : <><ThumbsDown size={16} /> Decline</>}
                </button>
                <button
                  onClick={() => handlePaymentAction(paymentPopup, "accept")}
                  disabled={paymentActionLoading}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-gray-100 text-gray-700"
            >
              <button onClick={() => setGoodsStatusModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 cursor-pointer">
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
                    className="text-xs bg-gray-100 hover:bg-brand-primary/10 hover:text-brand-primary text-gray-600 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
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
                className="w-full py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                {goodsStatusLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Update</>}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
