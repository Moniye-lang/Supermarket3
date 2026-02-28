import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    async function handleLogout() {
      try {
        const token = localStorage.getItem("token");

        // 🟢 1. Log out from backend (invalidate token)
        if (token) {
          await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }

        // 🧹 2. Clear all sensitive data via context (which also clears localStorage)
        logout();

        // 🆕 3. Create a new guest ID for future guest orders
        const newGuestId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        localStorage.setItem("guestId", newGuestId);

        // ⏩ 4. Redirect to home
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Logout error:", err);
        navigate("/", { replace: true });
      }
    }

    handleLogout();
  }, [navigate, logout]);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-gray-700">
      <h1 className="text-2xl font-semibold">Logging out...</h1>
      <p className="text-gray-500 mt-2">Please wait a moment.</p>
    </div>
  );
}
