"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pusherClient from "@/lib/pusher-client";
import useStoreCountdown from "@/hooks/useStoreCountdown";
import { motion } from "framer-motion";

function FulfillmentProgressBar({ status }: { status: string }) {
  let percentage = 0;
  if (status === "payment_pending" || status === "payment_declined" || status === "cancelled") {
    percentage = 15;
  } else if (status === "packing") {
    percentage = 50;
  } else if (status === "ready_for_pickup") {
    percentage = 80;
  } else if (status === "picked_up" || status === "delivered" || status === "completed") {
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
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
        />
      </div>
    </div>
  );
}

export default function Pickup() {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { countdown, isOpen } = useStoreCountdown();

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

  const getStatusText = () => {
    if (!order) return "";
    if (order.fulfilled || order.status === "delivered" || order.status === "picked_up") return "✅ Collected";
    if (order.status === "payment_pending") return "⏳ Payment not received, please wait a few moments...";
    if (order.status === "payment_declined") return "❌ Payment Verification Failed (Declined)";
    if (order.status === "packing") return "📦 Packing your items...";
    if (order.status === "ready_for_pickup") return "🛍️ Ready for Pickup!";
    if (order.status === "cancelled") return "❌ Cancelled";
    return "⏳ Preparing your order...";
  };

  const getStatusColor = () => {
    if (!order) return "text-gray-600";
    if (order.fulfilled || order.status === "delivered" || order.status === "picked_up") return "text-green-600 font-bold";
    if (order.status === "payment_pending") return "text-yellow-600 font-bold animate-pulse";
    if (order.status === "payment_declined" || order.status === "cancelled") return "text-red-600 font-bold";
    if (order.status === "packing") return "text-orange-600 font-bold";
    if (order.status === "ready_for_pickup") return "text-blue-600 font-bold animate-pulse";
    return "text-yellow-500 font-medium";
  };

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
      <p className="text-xl font-medium text-gray-700 animate-pulse">Loading pickup order...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
      <p className="text-red-600 text-lg font-semibold">{error}</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
      <p className="text-gray-700 text-lg">No active pickup order found.</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-50 to-red-50 px-6 py-12">
      <div className="backdrop-blur-xl bg-white/80 shadow-2xl rounded-3xl p-8 w-full max-w-lg border border-gray-100 transition-all duration-300">
        <h1 className="text-4xl font-extrabold text-center text-red-600 mb-3 tracking-tight">Pickup Order</h1>

        {/* Prominent Pickup Code Banner on Top */}
        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5 mb-6 text-center shadow-sm">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Your Pickup Code</p>
          <p className="text-3xl font-black text-red-600 tracking-widest font-mono">{order.pickupCode || "—"}</p>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <p className={`text-sm px-3 py-1 rounded-full font-semibold ${isOpen ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            Store is {isOpen ? "OPEN" : "CLOSED"}
          </p>
          <p className="text-gray-500 mt-2 text-sm">Supermarket closes in <span className="font-medium text-gray-800">{countdown}</span></p>
          {order.status !== "payment_pending" && order.status !== "payment_declined" && order.status !== "packing" && order.status !== "cancelled" && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm w-full">
              <p className="font-semibold mb-1">Arrived for Pickup?</p>
              <p>Please call us at <span className="font-bold">08023434790</span> so we can bring your order to you.</p>
            </div>
          )}
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-2xl mb-6 text-center text-sm font-semibold border ${
          order.status === "payment_pending" ? "bg-yellow-50 border-yellow-100 text-yellow-700"
          : order.status === "payment_declined" || order.status === "cancelled" ? "bg-red-50 border-red-100 text-red-700"
          : order.status === "packing" ? "bg-orange-50 border-orange-100 text-orange-700"
          : order.status === "ready_for_pickup" ? "bg-blue-50 border-blue-100 text-blue-700"
          : "bg-gray-50 border-gray-100 text-gray-700"
        }`}>
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>

        {/* Fulfillment Progress Bar */}
        <FulfillmentProgressBar status={order.status} />

        {order.goodsStatus && (
          <div className="bg-brand-primary/5 rounded-2xl p-4 mb-6 border border-brand-primary/10 flex items-start gap-3">
            <span className="text-lg">📦</span>
            <div>
              <p className="font-bold text-brand-dark text-sm">Update from Store Staff</p>
              <p className="text-gray-700 text-sm mt-0.5 font-medium leading-relaxed">{order.goodsStatus}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl shadow-inner p-4 mb-6">
          <p className="text-gray-600 mb-1">Date: <span className="font-semibold text-gray-800">{new Date(order.createdAt).toLocaleString()}</span></p>
          <p className="text-gray-600 mb-1">Name: <span className="font-semibold text-gray-800">{order.pickupName}</span></p>
          {order.deliveryAddress && order.deliveryAddress.includes("Pickup Station (Time:") && (
            <p className="text-gray-600 mb-1">
              Scheduled Time: <span className="font-semibold text-gray-800">{order.deliveryAddress.replace("Pickup Station (Time: ", "").replace(")", "")}</span>
            </p>
          )}
          <p className={`mt-3 font-bold ${order.fulfilled ? "text-green-600" : "text-red-500"}`}>
            {order.fulfilled ? "Collected" : "Not Collected"}
          </p>
        </div>

        <ul className="divide-y divide-gray-200 mb-6">
          {order.items.map((it: any, idx: number) => (
            <li key={it._id || idx} className="py-3 flex justify-between items-center text-gray-700">
              <span>{it.name || it.productId?.name || "Unnamed"} × <span className="font-semibold">{it.qty}</span></span>
              <span className="font-medium">₦{(it.price * it.qty).toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between items-center border-t pt-4 mb-4">
          <p className="text-lg font-semibold text-gray-800">Total:</p>
          <p className="text-2xl font-extrabold text-red-600">₦{order.amount.toLocaleString()}</p>
        </div>


        {order.status === "ready_for_pickup" && !order.fulfilled && (
          <button onClick={() => handleComplete(order._id)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-semibold w-full hover:bg-green-700 transition-colors">
            Confirm Pickup
          </button>
        )}
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Thank you for ordering with <span className="text-red-600 font-semibold">AMStores.</span>
      </p>
    </div>
  );
}
