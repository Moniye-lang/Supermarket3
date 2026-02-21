import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleLogout() {
      try {
        const token = localStorage.getItem("token");

        // 🟢 1. Log out from backend (invalidate token)
        if (token) {
          await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }

        // 🧹 2. Clear all sensitive data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");

        // 🆕 3. Create a new guest ID for future guest orders
        const newGuestId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        localStorage.setItem("guestId", newGuestId);

        // ⏩ 4. Redirect to sign-in
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Logout error:", err);
        navigate("/SignIn", { replace: true });
      }
    }

    handleLogout();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-gray-700">
      <h1 className="text-2xl font-semibold">Logging out...</h1>
      <p className="text-gray-500 mt-2">Please wait a moment.</p>
    </div>
  );
}
