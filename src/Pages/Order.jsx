import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function Order() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = state?.orderId;
  const token = localStorage.getItem("token");
   useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, []);
  

  // Redirect if no token
  useEffect(() => {
    if (!token) navigate("/SignIn");
  }, [token, navigate]);

  // Fetch latest delivery order
  useEffect(() => {
    if (!token) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/latest/delivery`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch order");

        setOrder(data);
        socket.emit("joinOrderRoom", data._id); // join socket room
      } catch (err) {
        setError(err.message);
        console.error("Order fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [token]);

  // Listen for real-time delivery updates
  useEffect(() => {
    socket.on("order:status", ({ orderId: id, status }) => {
      if (order && id === order._id) {
        if (status === "delivered") setOrder(null); // clear order
        else setOrder((prev) => ({ ...prev, status })); // update status
      }
    });

    return () => socket.off("order:status");
  }, [order]);

  // Mark delivery as complete
  async function handleComplete() {
    if (!order) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${order._id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to confirm delivery");

      alert("✅ Delivery marked as successful!");
      setOrder(null); // clear order immediately
    } catch (err) {
      console.error(err);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-gray-50">
        <p className="text-xl font-medium text-gray-700 animate-pulse">
          Loading delivery order...
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
        <p className="text-gray-700 text-lg">No active delivery order found.</p>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 w-full min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-xl">
        <h2 className="text-3xl font-bold text-green-800 text-center mb-4">
          Delivery Order
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Status:{" "}
          <span
            className={`font-semibold ${
              order.fulfilled || order.status === "delivered"
                ? "text-green-700"
                : "text-yellow-600"
            }`}
          >
            {order.fulfilled || order.status === "delivered"
              ? "Delivered"
              : "Not Delivered"}
          </span>
        </p>

        <p className="text-gray-600 mb-1">
          Name: <span className="font-semibold text-gray-800">{order.pickupName}</span>
        </p>
        <p className="text-gray-600 mb-1">
          Pickup Code: <span className="font-semibold text-red-600 text-lg">{order.pickupCode}</span>
        </p>

        <div className="divide-y divide-gray-200 mb-6">
          {order.items.map((it) => (
            <div key={it.productId} className="py-3 flex justify-between">
              <span>{it.productId?.name || it.name || "Product"}</span>
              <span>₦{(it.price * it.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <p className="text-xl font-semibold text-green-800 text-center mb-4">
          Total: ₦{order.amount.toLocaleString()}
        </p>

        {!(order.fulfilled || order.status === "delivered") && (
          <button
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
          >
            Confirm Delivery
          </button>
        )}
      </div>
    </div>
  );
}
