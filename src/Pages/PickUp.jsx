import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import useStoreCountdown from "../hooks/useStoreCountdown";

export default function Pickup() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const { countdown, isOpen } = useStoreCountdown("08:00", "20:00");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);


  useEffect(() => {
    socket.on("order:status", ({ status }) => {
      if (status === "delivered") setOrder(null);
    });
    return () => socket.off("order:status");
  }, []);


  useEffect(() => {
    if (!token) {
      navigate("/SignIn");
      return;
    }


    async function fetchPickupOrder() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/orders/latest/pickup`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch pickup order");

        setOrder(data);
        socket.emit("joinOrderRoom", data._id);
      } catch (err) {
        setError(err.message);
        console.error("Pickup fetch error:", err);
      } finally {
        setLoading(false);
      }
      await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/orders/${order._id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setOrder(null);

    }

    fetchPickupOrder();
  }, [token, navigate]);

  async function handleComplete(orderId) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/orders/${orderId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to complete order");

      alert("✅ Delivery marked as successful!");
      setOrder(null); // Clear from screen
    } catch (err) {
      console.error(err);
    }
  }


  if (loading)
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
        <p className="text-xl font-medium text-gray-700 animate-pulse">
          Loading pickup order...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
        <p className="text-gray-700 text-lg">No active pickup order found.</p>
      </div>
    );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-50 to-red-50 px-6 py-12">
      <div className="backdrop-blur-xl bg-white/80 shadow-2xl rounded-3xl p-8 w-full max-w-lg border border-gray-100 transition-all duration-300 hover:shadow-red-200/50">
        <h1 className="text-4xl font-extrabold text-center text-red-600 mb-3 tracking-tight">
          Pickup Order
        </h1>

        <div className="flex flex-col items-center text-center mb-6">
          <p
            className={`text-sm px-3 py-1 rounded-full font-semibold ${isOpen
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
              }`}
          >
            Store is {isOpen ? "OPEN" : "CLOSED"}
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Supermarket closes in <span className="font-medium text-gray-800">{countdown}</span>
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl shadow-inner p-4 mb-6">

          <p className="text-gray-600 mb-1">
            Name: <span className="font-semibold text-gray-800">{order.pickupName}</span>
          </p>
          <p className="text-gray-600 mb-1">
            Pickup Code:{" "}
            <span className="font-semibold text-red-600 text-lg">{order.pickupCode}</span>
          </p>
          <p
            className={`mt-3 font-bold ${order.fulfilled ? "text-green-600" : "text-red-500"
              }`}
          >
            {order.fulfilled ? "Collected" : "Not Collected"}
          </p>
        </div>

        <ul className="divide-y divide-gray-200 mb-6">
          {order.items.map((it, idx) => (
            <li
              key={it._id || idx}
              className="py-3 flex justify-between items-center text-gray-700"
            >
              <span>
                {it.name || it.productId?.name || "Unnamed"} ×{" "}
                <span className="font-semibold">{it.qty}</span>
              </span>
              <span className="font-medium">₦{(it.price * it.qty).toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between items-center border-t pt-4">
          <p className="text-lg font-semibold text-gray-800">Total:</p>
          <p className="text-2xl font-extrabold text-red-600">
            ₦{order.amount.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => handleComplete(order._id)}
          className="bg-green-600 text-white px-4 py-2 rounded-md"
        >
          Confirm Delivery
        </button>

      </div>

      <p className="mt-8 text-sm text-gray-500">
        Thank you for ordering with{" "}
        <span className="text-red-600 font-semibold">AMStores.</span>
      </p>
    </div>
  );
}
