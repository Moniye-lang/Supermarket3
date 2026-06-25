"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pusherClient from "@/lib/pusher-client";

export default function Order() {
  const router = useRouter();
  const [orderType, setOrderType] = useState("delivery");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!token) router.push("/signin");
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    async function fetchOrder() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/orders/latest/${orderType}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    fetchOrder();
  }, [token, orderType]);

  useEffect(() => {
    if (!order?._id) return;
    const channel = pusherClient.subscribe(`order-${order._id}`);
    channel.bind("order:status", ({ orderId: id, status }: any) => {
      if (id === order._id) {
        const isCompleted = status === "delivered" || status === "picked_up" || status === "completed";
        if (isCompleted) setOrder(null);
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

  async function handleComplete() {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order._id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to confirm completion");
      alert(orderType === "pickup" ? "✅ Pickup marked as successful!" : "✅ Delivery marked as successful!");
      setOrder(null);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 bg-gray-50 w-full min-h-screen flex flex-col items-center justify-center">

      {/* Type Selection Tabs */}
      <div className="flex gap-4 mb-6 mt-16 sm:mt-0">
        <button
          onClick={() => setOrderType("delivery")}
          className={`px-6 py-2 rounded-full font-bold transition-all ${orderType === "delivery" ? "bg-brand-primary text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          Delivery Orders
        </button>
        <button
          onClick={() => setOrderType("pickup")}
          className={`px-6 py-2 rounded-full font-bold transition-all ${orderType === "pickup" ? "bg-brand-primary text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          Pickup Orders
        </button>
      </div>

      {loading ? (
        <div className="w-full max-w-xl flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || !order ? (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-xl text-center">
          <p className="text-gray-700 text-lg">
            {error === "No recent order found" ? `No active ${orderType} order found.` : error || `No active ${orderType} order found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-xl">
          <h2 className="text-3xl font-bold text-green-800 text-center mb-4 capitalize">{orderType} Order</h2>

          <p className="text-gray-600 text-center mb-6">
            Status:{" "}
            <span className={`font-semibold ${
              order.fulfilled || order.status === "delivered" || order.status === "picked_up" ? "text-green-700 font-bold"
              : order.status === "delivery_here" || order.status === "ready_for_pickup" ? "text-blue-600 animate-pulse font-bold"
              : order.status === "packing" ? "text-orange-600 font-bold"
              : order.status === "payment_pending" ? "text-yellow-600 font-bold"
              : order.status === "payment_declined" || order.status === "cancelled" ? "text-red-600 font-bold"
              : "text-yellow-600"
            }`}>
              {order.fulfilled || order.status === "delivered" || order.status === "picked_up"
                ? (orderType === "pickup" ? "Picked Up" : "Delivered")
                : order.status === "payment_pending" ? "⏳ Payment not received, please wait..."
                : order.status === "payment_declined" ? "❌ Payment Verification Failed"
                : order.status === "packing" ? "📦 Packing items..."
                : order.status === "delivery_here" ? "🚚 Rider Arrived!"
                : order.status === "ready_for_pickup" ? "🛍️ Ready for Pickup!"
                : order.status === "cancelled" ? "❌ Cancelled"
                : "⏳ Preparing your order..."}
            </span>
          </p>

          {order.goodsStatus && (
            <div className="bg-brand-primary/5 rounded-2xl p-4 mb-6 border border-brand-primary/10 flex items-start gap-3">
              <span className="text-lg">📦</span>
              <div>
                <p className="font-bold text-brand-dark text-sm">Update from Store staff</p>
                <p className="text-gray-700 text-sm mt-0.5 font-medium leading-relaxed">{order.goodsStatus}</p>
              </div>
            </div>
          )}

          <p className="text-gray-600 mb-1">Date: <span className="font-semibold text-gray-800">{new Date(order.createdAt).toLocaleString()}</span></p>
          <p className="text-gray-600 mb-1">Name: <span className="font-semibold text-gray-800">{order.pickupName}</span></p>
          <p className="text-gray-600 mb-1">
            {orderType === "pickup" ? "Pickup Code" : "Order Code"}: <span className="font-semibold text-red-600 text-lg">{order.pickupCode}</span>
          </p>

          <div className="divide-y divide-gray-200 mb-6">
            {order.items.map((it: any) => (
              <div key={it.productId?._id || it._id || Math.random()} className="py-3 flex justify-between">
                <span>{it.productId?.name || it.name || "Product"}</span>
                <span>₦{((it.productId?.price || it.price) * it.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <p className="text-xl font-semibold text-green-800 text-center mb-4">Total: ₦{order.amount.toLocaleString()}</p>

          {order.status === "packing" && (
            <div className="mt-2 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 mb-3 font-medium">⚠️ You can only cancel during the packing status.</p>
              <button onClick={handleCancelOrder} disabled={cancelLoading} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold w-full transition-colors flex items-center justify-center gap-2">
                {cancelLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Cancel Order & Payment"}
              </button>
            </div>
          )}

          {!(order.fulfilled || order.status === "delivered" || order.status === "picked_up" || order.status === "cancelled" || order.status === "payment_declined" || order.status === "payment_pending" || order.status === "packing") && (
            <button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold w-full">
              Confirm {orderType === "pickup" ? "Pickup" : "Delivery"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
