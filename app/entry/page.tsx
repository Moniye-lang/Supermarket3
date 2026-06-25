"use client";
import { useRouter } from "next/navigation";

export default function EntryPage() {
  const router = useRouter();

  function handleGuestEntry() {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("guestId", guestId);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    console.log("🧾 Guest session started:", guestId);
    router.push("/"); // Go to homepage
  }

  function handleUserEntry() {
    router.push("/signin"); // Redirect to login
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
      <h1 className="text-3xl font-bold mb-6 font-sans">Welcome to FoodEase 🍽️</h1>
      <p className="text-lg mb-8 text-gray-300">Choose how you want to continue:</p>

      <div className="flex flex-col sm:flex-row gap-6">
        <button
          onClick={handleUserEntry}
          className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer font-bold"
        >
          Enter as User
        </button>

        <button
          onClick={handleGuestEntry}
          className="px-6 py-3 bg-green-600 rounded-xl hover:bg-green-700 transition cursor-pointer font-bold"
        >
          Enter as Guest
        </button>
      </div>
    </div>
  );
}
