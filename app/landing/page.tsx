"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<string | null>(null);

  const handleEnter = () => {
    if (choice === "user") {
      router.push("/signin");
    } else if (choice === "guest") {
      const guestId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      localStorage.setItem("guestId", guestId);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/"); // Redirect guest to homepage
    } else {
      alert("Please choose how you want to enter.");
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center h-screen bg-gradient-to-b from-orange-50 via-orange-100 to-orange-200 text-gray-800 font-sans">
      <div className="text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-orange-600 drop-shadow">
          Welcome to <span className="text-orange-500">FoodSpot 🍔</span>
        </h1>
        <p className="text-lg mb-10 text-gray-600">
          Choose how you’d like to enter
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center mb-10">
          <label
            className={`cursor-pointer px-6 py-4 rounded-2xl shadow-md border-2 transition-all duration-300 w-48 text-center flex flex-col items-center justify-center ${choice === "user"
                ? "bg-orange-500 text-white border-orange-600 scale-105 shadow-lg font-bold"
                : "bg-white border-transparent hover:border-orange-300 hover:scale-105"
              }`}
          >
            <input
              type="radio"
              name="entry"
              value="user"
              className="hidden"
              onChange={() => setChoice("user")}
            />
            <span>👤 Enter as User</span>
          </label>

          <label
            className={`cursor-pointer px-6 py-4 rounded-2xl shadow-md border-2 transition-all duration-300 w-48 text-center flex flex-col items-center justify-center ${choice === "guest"
                ? "bg-orange-500 text-white border-orange-600 scale-105 shadow-lg font-bold"
                : "bg-white border-transparent hover:border-orange-300 hover:scale-105"
              }`}
          >
            <input
              type="radio"
              name="entry"
              value="guest"
              className="hidden"
              onChange={() => setChoice("guest")}
            />
            <span>🛒 Enter as Guest</span>
          </label>
        </div>

        <button
          onClick={handleEnter}
          className="bg-orange-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-orange-500 transition-all duration-300 text-lg font-semibold cursor-pointer"
        >
          Continue →
        </button>
      </div>

      <footer className="absolute bottom-5 text-sm text-gray-500">
        © {new Date().getFullYear()} FoodSpot — All Rights Reserved
      </footer>
    </div>
  );
}
