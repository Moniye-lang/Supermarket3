// src/pages/Entry.jsx
import { useNavigate } from "react-router-dom";

export default function Entry() {
  const navigate = useNavigate();

  function handleGuestEntry() {
    // 🔹 Create a guest ID and store it
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("guestId", guestId);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    console.log("🧾 Guest session started:", guestId);
    navigate("/"); // Go to homepage or main menu
  }

  function handleUserEntry() {
    navigate("/SignIn"); // Redirect to login/signup page
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Welcome to FoodEase 🍽️</h1>
      <p className="text-lg mb-8">Choose how you want to continue:</p>

      <div className="flex gap-6">
        <button
          onClick={handleUserEntry}
          className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition"
        >
          Enter as User
        </button>

        <button
          onClick={handleGuestEntry}
          className="px-6 py-3 bg-green-600 rounded-xl hover:bg-green-700 transition"
        >
          Enter as Guest
        </button>
      </div>
    </div>
  );
}
