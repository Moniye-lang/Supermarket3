"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../../socket"; // adjust path as needed

export default function OrderPage() {
  const router = useRouter();
  const [orderType, setOrderType] = useState("delivery"); // Toggle state
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Redirect if no token
  useEffect(() => {
    if (!token) router.push("/signin");
  }, [token, router]);

  // Fetch latest order based on type
  useEffect(() => {
    if (!token) return;
    async function fetchOrder() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com"}/api/orders/latest/${orderType}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch order");
        setOrder(data);
        socket.emit("joinOrderRoom", data._id);
      } catch (err) {
        setOrder(null);
        setError(err.message);
        console.error("Order fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [token, orderType]);

  // Listen for real‑time updates
  useEffect(() => {
    if (!order) return;
    const statusHandler = ({ orderId: id, status }) => {
      if (order && id === order._id) {
        const isCompleted = ["delivered", "picked_up", "completed"].includes(status);
        if (isCompleted) setOrder(null);
        else setOrder((prev) => ({ ...prev, status }));
      }
    };
    const updatedHandler = (updatedOrder) => {
      if (order && updatedOrder._id === order._id) setOrder(updatedOrder);
    };
    socket.on("order:status", statusHandler);
    socket.on("orderUpdated", updatedHandler);
    return () => {
      socket.off("order:status", statusHandler);
      socket.off("orderUpdated", updatedHandler);
    };
  }, [order]);

  // Cancel order (Only during packing status)
  async function handleCancelOrder() {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order and payment?")) return;
    try {
      setCancelLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com"}/api/orders/${order._id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to cancel order");
        return;
      }
      alert("✅ Order cancelled successfully.");
      setOrder((prev) => ({ ...prev, status: "cancelled", paymentStatus: "cancelled" }));
    } catch (err) {
      console.error(err);
      alert("Error cancelling order");
    } finally {
      setCancelLoading(false);
    }
  }

  // Mark as complete
  async function handleComplete() {
    if (!order) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com"}/api/orders/${order._id}/complete`, {
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

  // UI – using Tailwind classes (adjust as needed)
  return (
    <div className="p-6 bg-gray-50 w-full min-h-screen flex flex-col items-center justify-center">
      {/* Type Selection Tabs */}
      <div className="flex gap-4 mb-6 mt-16 sm:mt-0">
        <button onClick={() => setOrderType("delivery")} className={`px-6 py-2 rounded-full font-bold transition-all ${orderType === "delivery" ? "bg-brand-primary text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
          Delivery Orders
        </button>
        <button onClick={() => setOrderType("pickup")} className={`px-6 py-2 rounded-full font-bold transition-all ${orderType === "pickup" ? "bg-brand-primary text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
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
          {/* Order details – unchanged from original component */}
          {/* ... (omitted for brevity, you can copy the remaining JSX from original file) */}
          {/* Cancel / Complete buttons */}
          {order.status === "packing" && (
            <div className="mt-2 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 mb-3 font-medium">⚠️ Note: If you wish to cancel, you can only cancel during the packing status.</p>
              <button onClick={handleCancelOrder} disabled={cancelLoading} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold w-full transition-colors flex items-center justify-center gap-2">
                {cancelLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Cancel Order & Payment"
                )}
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
