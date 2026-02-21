import { useState } from "react";

export default function Worker() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function handleConfirm() {
    if (!name.trim() || !code.trim()) return setMessage("Enter both name and code.");

    try {
      const token = localStorage.getItem("workerToken"); // ✅ include token
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/worker/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ send auth token
        },
        body: JSON.stringify({ name, code }), // ✅ match backend field names
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm");

      setMessage(data.message || "Order confirmed!");
    } catch (err) {
      console.error("Confirm Error:", err);
      setMessage(err.message);
    }
  }

  return (
    <div className="min-h-screen w-full  flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
        Worker: Confirm Pickup/Delivery
      </h1>

      <input
        type="text"
        placeholder="Customer Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 p-2 border rounded w-64"
      />

      <input
        type="text"
        placeholder="4-digit Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={4}
        className="mb-4 p-2 border rounded w-64"
      />

      <button
        onClick={handleConfirm}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Confirm
      </button>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
